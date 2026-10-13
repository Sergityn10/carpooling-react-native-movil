// YouConnext - Vista Principal del Mapa de Exploración Pro
// Contenedor interactivo a pantalla completa con Origen (Conductor), Destino, Ruta Completa, Auto-Fit y Waypoints

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Compass } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import { MAP_STYLE_YOUCONNEXT, MAP_STYLE_DARK } from "../../constants/mapStyles";
import {
  regionToBoundingBox,
  latitudeDeltaToZoom,
  getTripOriginCoords,
  getTripDestinationCoords,
  extractTripRouteCoordinates,
  extractTripWaypoints,
  disperseOverlappingCoordinates,
  calculateBoundsFromCoordinates,
  pointInBoundingBox,
} from "../../utils/mapGeoUtils";
import { resolveTripRoute, getCachedRoute } from "../../services/routing/routeResolver";
import { useMapViewport } from "../../hooks/useMapViewport";
import DriverMarker from "./DriverMarker";
import DestinationMarker from "./DestinationMarker";
import WaypointMarker from "./WaypointMarker";
import ClusterMarker from "./ClusterMarker";
import TripPolylineLayer from "./TripPolylineLayer";
import TripPreviewSheet from "./TripPreviewSheet";
import MapFilterBar from "./MapFilterBar";
import MapDatePickerSheet from "./MapDatePickerSheet";
import MapControls from "./MapControls";

// Constante estable para evitar creación de objetos en cada render
const EMPTY_FILTERS = {};

const DEFAULT_REGION = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const MapaExploracionView = ({
  initialRegion = DEFAULT_REGION,
  onTripSelect,
  filters = EMPTY_FILTERS,
  filterTopOffset = 12,
  style,
}) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const currentRegionRef = useRef(initialRegion);

  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedTripRoute, setSelectedTripRoute] = useState(null); // Array de { latitude, longitude } resuelto
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD' o null
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [hasUserMoved, setHasUserMoved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mapTheme, setMapTheme] = useState("light"); // "light" | "dark"
  const [locationLoading, setLocationLoading] = useState(false);

  // Filtros combinados (incluyendo fecha seleccionada)
  const combinedFilters = useMemo(
    () => ({
      ...filters,
      ...activeFilters,
      date: selectedDate,
    }),
    [filters, activeFilters, selectedDate]
  );

  const {
    trips,
    loading,
    isInitialLoading,
    error,
    selectedTrip,
    selectTrip,
    clearSelection,
    handleRegionChange,
    handleRegionChangeComplete,
    refresh,
  } = useMapViewport(initialRegion, combinedFilters);

  const selectedTripData = selectedTrip;

  // 1. Auto-geolocalización al montar el mapa
  useEffect(() => {
    let isMounted = true;
    const fetchInitialLocation = async () => {
      setLocationLoading(true);
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted" && isMounted) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isMounted && loc?.coords) {
            const userCoords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserLocation(userCoords);
            const userRegion = {
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
              latitudeDelta: 0.035,
              longitudeDelta: 0.035,
            };
            currentRegionRef.current = userRegion;
            mapRef.current?.animateToRegion(userRegion, 1000);
          }
        }
      } catch (err) {
        console.log("No se pudo obtener ubicación inicial:", err.message);
      } finally {
        if (isMounted) setLocationLoading(false);
      }
    };

    fetchInitialLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasAutoFramedRef = useRef(false);

  // Auto-encuadrar viajes si están fuera del viewport inicial (ej. viajes en Extremadura cuando el mapa inicia en Madrid)
  useEffect(() => {
    if (trips.length > 0 && !hasAutoFramedRef.current && !hasUserMoved) {
      const cur = currentRegionRef.current;
      const curBbox = cur ? regionToBoundingBox(cur) : null;
      const anyInView = curBbox && trips.some((t) => {
        const o = getTripOriginCoords(t);
        return o && pointInBoundingBox(o, curBbox);
      });

      if (!anyInView) {
        hasAutoFramedRef.current = true;
        const allPoints = [];
        trips.forEach((t) => {
          const o = getTripOriginCoords(t);
          const d = getTripDestinationCoords(t);
          if (o) allPoints.push(o);
          if (d) allPoints.push(d);
        });

        if (allPoints.length >= 1) {
          const bbox = calculateBoundsFromCoordinates(allPoints);
          if (bbox) {
            const latSpan = bbox.maxLat - bbox.minLat;
            const lngSpan = bbox.maxLng - bbox.minLng;
            const latDelta = Math.max(latSpan * 1.6, 0.08);
            const lngDelta = Math.max(lngSpan * 1.6, 0.08);
            const centerLat = (bbox.minLat + bbox.maxLat) / 2;
            const centerLng = (bbox.minLng + bbox.maxLng) / 2;
            const targetRegion = {
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta: latDelta,
              longitudeDelta: lngDelta,
            };
            currentRegionRef.current = targetRegion;
            mapRef.current?.animateToRegion(targetRegion, 900);
          }
        }
      }
    }
  }, [trips, hasUserMoved]);

  // 2. Centrar en la ubicación del usuario bajo demanda
  const handleCenterUserLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      let currentStatus = (await Location.getForegroundPermissionsAsync()).status;
      if (currentStatus !== "granted") {
        currentStatus = (await Location.requestForegroundPermissionsAsync()).status;
        if (currentStatus !== "granted") return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (loc?.coords) {
        const userCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(userCoords);
        setHasUserMoved(false);
        const userRegion = {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        };
        currentRegionRef.current = userRegion;
        mapRef.current?.animateToRegion(userRegion, 800);
      }
    } catch (err) {
      console.warn("Error al centrar en GPS:", err);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // 3. Zoom In / Zoom Out
  const handleZoomIn = useCallback(() => {
    const cur = currentRegionRef.current;
    if (!cur) return;
    const newRegion = {
      ...cur,
      latitudeDelta: Math.max(0.002, cur.latitudeDelta / 1.7),
      longitudeDelta: Math.max(0.002, cur.longitudeDelta / 1.7),
    };
    currentRegionRef.current = newRegion;
    mapRef.current?.animateToRegion(newRegion, 350);
  }, []);

  const handleZoomOut = useCallback(() => {
    const cur = currentRegionRef.current;
    if (!cur) return;
    const newRegion = {
      ...cur,
      latitudeDelta: Math.min(80, cur.latitudeDelta * 1.7),
      longitudeDelta: Math.min(80, cur.longitudeDelta * 1.7),
    };
    currentRegionRef.current = newRegion;
    mapRef.current?.animateToRegion(newRegion, 350);
  }, []);

  // 4. Orientación Norte
  const handleResetNorth = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.animateCamera({ heading: 0, pitch: 0 }, { duration: 500 });
    }
  }, []);

  // 5. Alternar Tema Día / Noche
  const handleToggleTheme = useCallback(() => {
    setMapTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // 6. Función para encuadrar la ruta completa (Origen ➔ Trayecto ➔ Destino)
  const fitTripToScreen = useCallback((trip, overrideCoords = null) => {
    if (!trip || !mapRef.current) return;
    const origin = getTripOriginCoords(trip);
    const dest = getTripDestinationCoords(trip);
    const routeCoords = overrideCoords || selectedTripRoute || extractTripRouteCoordinates(trip);

    const points = [];
    if (origin) points.push(origin);
    if (Array.isArray(routeCoords) && routeCoords.length > 0) {
      points.push(...routeCoords);
    }
    if (dest) points.push(dest);

    const validPoints = points.filter(
      (p) =>
        p &&
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    );

    if (validPoints.length >= 2) {
      // Calcular bounding box manual para control total
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      validPoints.forEach((pt) => {
        minLat = Math.min(minLat, pt.latitude);
        maxLat = Math.max(maxLat, pt.latitude);
        minLng = Math.min(minLng, pt.longitude);
        maxLng = Math.max(maxLng, pt.longitude);
      });

      const latSpan = maxLat - minLat;
      const lngSpan = maxLng - minLng;

      // Umbrales mínimos para evitar over-zoom (nivel ciudad ~0.04° ≈ 4-5km)
      const minLatDelta = Math.max(latSpan * 1.5, 0.04);
      const minLngDelta = Math.max(lngSpan * 1.5, 0.04);

      // Centro del bounding box
      let centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Desplazar centro hacia arriba para compensar la tarjeta inferior (~250px = ~18% del alto)
      // A zoom 13, 1° lat ≈ 111km, pantalla ≈ 0.08° -> 250px ≈ 0.014°
      const verticalOffsetDeg = minLatDelta * 0.18;
      centerLat -= verticalOffsetDeg;

      mapRef.current.animateToRegion(
        {
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: minLatDelta,
          longitudeDelta: minLngDelta,
        },
        600
      );
    } else if (origin) {
      mapRef.current.animateToRegion(
        {
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        },
        600
      );
    }
  }, [selectedTripRoute]);

  // 7. Selección y clic en mapa
  const handleMapPress = useCallback(() => {
    if (selectedTripId) {
      setSelectedTripId(null);
      setSelectedTripRoute(null);
      clearSelection();
      setShowPreview(false);
    }
  }, [selectedTripId, clearSelection]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setSelectedTripId(null);
    setSelectedTripRoute(null);
    clearSelection();
  }, [clearSelection]);

  const handleTripPress = useCallback(
    (trip) => {
      if (selectedTripId === trip.id) {
        setSelectedTripId(null);
        setSelectedTripRoute(null);
        clearSelection();
        setShowPreview(false);
      } else {
        setSelectedTripId(trip.id);
        selectTrip(trip);
        setShowPreview(true);

        // Comprobar si ya está resuelta en caché
        const cached = getCachedRoute(trip.id);
        if (cached && cached.length >= 2) {
          setSelectedTripRoute(cached);
          fitTripToScreen(trip, cached);
        } else {
          // Resolver la trayectoria real por carretera en segundo plano
          // Solo hacer fit una vez cuando la ruta esté lista
          resolveTripRoute(trip)
            .then((resolved) => {
              if (resolved && resolved.length >= 2) {
                setSelectedTripRoute(resolved);
                fitTripToScreen(trip, resolved);
              } else if (!resolved || resolved.length < 2) {
                // Fallback: encuadrar solo origen-destino si no hay ruta detallada
                fitTripToScreen(trip);
              }
            })
            .catch(() => {
              // En caso de error, encuadrar origen-destino
              fitTripToScreen(trip);
            });
        }
      }
    },
    [selectedTripId, selectTrip, clearSelection, fitTripToScreen]
  );

  // 8. Filtros
  const handleFilterChange = useCallback((filterId, active, filterData) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterId]: active,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    setSelectedDate(null);
  }, []);

  // 9. Clustering dinámico cliente (solo si hay densidad alta de viajes para no ocultar trayectos)
  const currentDelta = currentRegionRef.current?.latitudeDelta || 0.08;
  const zoomLevel = latitudeDeltaToZoom(currentDelta);

  const clusters = useMemo(() => {
    // Si hay 30 viajes o menos, o zoom no continental, NO agrupar: mostrar todos individualmente
    if (trips.length <= 30 || currentDelta < 1.5) return [];
    const clustered = {};
    trips.forEach((trip) => {
      const lat = trip.puntosClave?.origen?.lat ?? trip.origen_lat;
      const lng = trip.puntosClave?.origen?.lng ?? trip.origen_lng;
      if (lat == null || lng == null) return;
      const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      if (!clustered[key]) clustered[key] = [];
      clustered[key].push(trip);
    });
    return Object.entries(clustered)
      .filter(([, v]) => v.length > 1)
      .map(([coord, clusterTrips]) => {
        const [lat, lng] = coord.split(",").map(Number);
        return {
          coordinate: { latitude: lat, longitude: lng },
          count: clusterTrips.length,
          trips: clusterTrips,
        };
      });
  }, [trips, currentDelta]);

  const singleTrips = useMemo(() => {
    if (clusters.length === 0) return trips;
    const clusteredIds = new Set();
    clusters.forEach((c) => c.trips.forEach((t) => clusteredIds.add(t.id)));
    return trips.filter((t) => !clusteredIds.has(t.id));
  }, [trips, clusters]);

  // Paradas intermedias / waypoints del viaje seleccionado
  const selectedTripWaypoints = useMemo(() => {
    if (!selectedTripData) return [];
    return extractTripWaypoints(selectedTripData);
  }, [selectedTripData]);

  // Des-superposición de marcadores: calcula offset radial adaptable al zoom para orígenes/destinos solapados
  const dispersedOrigins = useMemo(() => {
    return disperseOverlappingCoordinates(singleTrips, "origin", 0.08, zoomLevel);
  }, [singleTrips, zoomLevel]);

  const dispersedDestinations = useMemo(() => {
    return disperseOverlappingCoordinates(singleTrips, "destination", 0.08, zoomLevel);
  }, [singleTrips, zoomLevel]);

  const currentMapStyle = mapTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_YOUCONNEXT;

  return (
    <View style={[styles.container, style]}>
      {/* Mapa Base a pantalla completa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChange={(r) => {
          setHasUserMoved(true);
          currentRegionRef.current = r;
        }}
        onRegionChangeComplete={(r) => {
          currentRegionRef.current = r;
          handleRegionChangeComplete(r);
        }}
        onPress={handleMapPress}
        customMapStyle={currentMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={Platform.OS === "ios"}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        maxZoomLevel={19}
        minZoomLevel={3}
      >
        {/* Capa de Polilíneas de Trayectos (Rutas completas con Halo y Carreteras) */}
        {singleTrips.map((trip, index) => {
          // Calcular índice de color basado en hash del origen+destino para consistencia
          const origin = trip.puntosClave?.origen ?? { lat: trip.origen_lat, lng: trip.origen_lng };
          const dest = trip.puntosClave?.destino ?? { lat: trip.destino_lat, lng: trip.destino_lng };
          const routeKey = `${Math.round((origin.lat || 0) * 100)},${Math.round((origin.lng || 0) * 100)}-${Math.round((dest.lat || 0) * 100)},${Math.round((dest.lng || 0) * 100)}`;
          const colorIndex = routeKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 6;

          // offsetIndex: 0 para el primer viaje de un corredor, 1, 2, etc. para los siguientes
          // Para simplificar, usamos el índice del array filtrado por corredor similar
          const offsetIndex = index % 3; // Máximo 3 paralelos

          return (
            <TripPolylineLayer
              key={`polyline-${trip.id}`}
              trip={trip}
              customCoordinates={selectedTripId === trip.id ? selectedTripRoute : undefined}
              selected={selectedTripId === trip.id}
              hasActiveSelection={!!selectedTripId}
              zoom={zoomLevel}
              theme={mapTheme}
              onPress={() => handleTripPress(trip)}
              colorIndex={colorIndex}
              offsetIndex={selectedTripId === trip.id ? 0 : offsetIndex}
            />
          );
        })}

        {/* Clústeres en zooms lejanos */}
        {clusters.map((cluster) => (
          <ClusterMarker
            key={`cluster-${cluster.coordinate.latitude}-${cluster.coordinate.longitude}`}
            count={cluster.count}
            coordinate={cluster.coordinate}
            onPress={() => {
              const newRegion = {
                latitude: cluster.coordinate.latitude,
                longitude: cluster.coordinate.longitude,
                latitudeDelta: currentDelta / 2.2,
                longitudeDelta: currentDelta / 2.2,
              };
              setHasUserMoved(true);
              currentRegionRef.current = newRegion;
              mapRef.current?.animateToRegion(newRegion, 500);
            }}
            trips={cluster.trips}
          />
        ))}

        {/* Marcadores de Destino (Llegada) - Siempre diferenciados y des-superpuestos */}
        {singleTrips.map((trip) => {
          // Mostrar destino si el viaje está seleccionado o en zoom adecuado
          const shouldShowDestination =
            selectedTripId === trip.id || zoomLevel >= 10 || trips.length <= 15;
          if (!shouldShowDestination) return null;

          return (
            <DestinationMarker
              key={`dest-${trip.id}`}
              trip={trip}
              coordinate={dispersedDestinations.get(String(trip.id))}
              onPress={handleTripPress}
              selected={selectedTripId}
              theme={mapTheme}
            />
          );
        })}

        {/* Paradas intermedias / Waypoints (para el viaje seleccionado) */}
        {selectedTripWaypoints.map((wp) => (
          <WaypointMarker
            key={`wp-${wp.id}`}
            waypoint={wp}
            theme={mapTheme}
          />
        ))}

        {/* Marcadores de Origen / Conductor - Des-superpuestos radialmente */}
        {singleTrips.map((trip) => (
          <DriverMarker
            key={`driver-${trip.id}`}
            trip={trip}
            coordinate={dispersedOrigins.get(String(trip.id))}
            onPress={handleTripPress}
            selected={selectedTripId}
            zoom={zoomLevel}
            theme={mapTheme}
          />
        ))}
      </MapView>

      {/* Barra Flotante de Filtros con Selector de Días */}
      <MapFilterBar
        activeFilters={activeFilters}
        selectedDate={selectedDate}
        onFilterChange={handleFilterChange}
        onOpenDatePicker={() => setDatePickerVisible(true)}
        onClearAll={handleClearFilters}
        theme={mapTheme}
        tripCount={trips.length}
        topOffset={filterTopOffset}
      />

      {/* Controles Flotantes a la Derecha */}
      <MapControls
        onCenterUserLocation={handleCenterUserLocation}
        onResetNorth={handleResetNorth}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRefresh={refresh}
        onToggleTheme={handleToggleTheme}
        mapTheme={mapTheme}
        userLocation={userLocation}
        hasUserMoved={hasUserMoved}
        disabled={loading}
        locationLoading={locationLoading}
        refreshing={loading}
      />

      {/* Estado Vacío */}
      {trips.length === 0 && !loading && !isInitialLoading && !error && (
        <View style={[styles.emptyCard, { top: filterTopOffset + 50 }]}>
          <Compass size={20} color={COLORS.gray400} strokeWidth={2} />
          <View style={styles.emptyTextCol}>
            <Text style={styles.emptyTitle}>Sin viajes para estos filtros</Text>
            <Text style={styles.emptySubtitle}>Prueba con otro día o mueve el mapa</Text>
          </View>
        </View>
      )}

      {/* Tarjeta Flotante de Detalle (Floating Island) */}
      <TripPreviewSheet
        trip={selectedTripData}
        visible={showPreview && !!selectedTripData}
        onClose={handleClosePreview}
        onViewDetail={() => onTripSelect?.(selectedTripData)}
        onFitRoute={() => fitTripToScreen(selectedTripData, selectedTripRoute)}
        onChat={() => {
          // Acción de chat
        }}
        theme={mapTheme}
      />

      {/* Modal / Sheet Selector de Días */}
      <MapDatePickerSheet
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onSelectDate={(date) => setSelectedDate(date)}
        onClose={() => setDatePickerVisible(false)}
        theme={mapTheme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.background,
  },
  map: {
    width: "100%",
    height: "100%",
    ...StyleSheet.absoluteFillObject,
  },
  emptyCard: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 90,
  },
  emptyTextCol: {
    flexDirection: "column",
  },
  emptyTitle: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: COLORS.gray800,
  },
  emptySubtitle: {
    fontSize: 10,
    color: COLORS.gray500,
  },
});

export default MapaExploracionView;