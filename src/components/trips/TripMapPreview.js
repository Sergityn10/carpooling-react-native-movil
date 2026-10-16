import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Text, Platform, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Navigation2, Clock } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import { MAP_STYLE_YOUCONNEXT } from "../../constants/mapStyles";
import { getDirectionsRoute } from "../../services/googlePlaces";
import { decodePolyline } from "../../utils/mapGeoUtils";

const formatDistance = (meters) => {
  if (!meters && meters !== 0) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
};

const TripMapPreview = ({ origin, destination, height = 180 }) => {
  const mapRef = useRef(null);
  const [encodedPolyline, setEncodedPolyline] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const requestIdRef = useRef(0);

  const hasAnyPoint =
    (origin?.latitude != null && origin?.longitude != null) ||
    (destination?.latitude != null && destination?.longitude != null);

  const hasBothPoints =
    origin?.latitude != null &&
    origin?.longitude != null &&
    destination?.latitude != null &&
    destination?.longitude != null;

  useEffect(() => {
    if (!hasBothPoints) {
      setEncodedPolyline(null);
      setRouteInfo(null);
      setRouteError("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const run = async () => {
      try {
        setLoadingRoute(true);
        setRouteError("");
        const result = await getDirectionsRoute({ origin, destination });
        if (requestIdRef.current !== requestId) return;
        setEncodedPolyline(result.encodedPolyline);
        setRouteInfo({
          distanceMeters: result.distanceMeters,
          durationSeconds: result.durationSeconds,
        });
      } catch (e) {
        if (requestIdRef.current !== requestId) return;
        setEncodedPolyline(null);
        setRouteInfo(null);
        setRouteError(e?.message || "No se pudo obtener la ruta");
      } finally {
        if (requestIdRef.current === requestId) setLoadingRoute(false);
      }
    };

    run();
  }, [hasBothPoints, origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  const routeCoords = useMemo(() => {
    if (!encodedPolyline) return [];
    try {
      return decodePolyline(encodedPolyline) || [];
    } catch {
      return [];
    }
  }, [encodedPolyline]);

  const initialRegion = useMemo(() => {
    const pt = origin || destination || { latitude: 40.4168, longitude: -3.7038 };
    return {
      latitude: pt.latitude || 40.4168,
      longitude: pt.longitude || -3.7038,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (hasBothPoints && routeCoords.length > 0) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
          ...routeCoords,
        ],
        {
          edgePadding: { top: 35, right: 35, bottom: 35, left: 35 },
          animated: true,
        },
      );
    } else if (origin?.latitude != null && origin?.longitude != null) {
      mapRef.current.animateToRegion(
        {
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        400,
      );
    } else if (destination?.latitude != null && destination?.longitude != null) {
      mapRef.current.animateToRegion(
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        400,
      );
    }
  }, [hasBothPoints, origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude, routeCoords]);

  if (!hasAnyPoint) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>
          Selecciona origen y/o destino para ver el mapa de la ruta
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={MAP_STYLE_YOUCONNEXT}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        liteMode={Platform.OS === "android"}
      >
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={COLORS.primary}
            strokeWidth={4}
          />
        )}
        {origin?.latitude != null && origin?.longitude != null && (
          <Marker
            coordinate={{
              latitude: origin.latitude,
              longitude: origin.longitude,
            }}
            pinColor="#10B981"
            title="Origen"
          />
        )}
        {destination?.latitude != null && destination?.longitude != null && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            pinColor={COLORS.primary}
            title="Destino"
          />
        )}
      </MapView>

      {loadingRoute && (
        <View style={styles.routeLoadingPill}>
          <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.routeLoadingText}>Calculando ruta…</Text>
        </View>
      )}

      {routeInfo && !loadingRoute && (
        <View style={styles.routeInfoBadge}>
          <View style={styles.routeInfoItem}>
            <Navigation2 size={13} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.routeInfoText}>
              {formatDistance(routeInfo.distanceMeters) || "—"}
            </Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Clock size={13} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.routeInfoText}>
              {formatDuration(routeInfo.durationSeconds) || "—"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    position: "relative",
    ...SHADOWS.small,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
  },
  placeholderText: {
    color: COLORS.gray600,
    fontSize: FONTS.sm,
    textAlign: "center",
  },
  routeLoadingPill: {
    position: "absolute",
    bottom: SPACING.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  routeLoadingText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: "600",
  },
  routeInfoBadge: {
    position: "absolute",
    bottom: SPACING.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeInfoText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: "700",
  },
  routeInfoDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});

export default TripMapPreview;
