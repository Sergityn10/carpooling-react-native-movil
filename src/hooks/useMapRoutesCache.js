// YouConnext - Caché en Memoria de Polilíneas (Layer 2)
// Evita decodificar o recalcular geometrías que ya se descargaron, optimizando FPS y memoria.

import { useRef, useCallback } from "react";
import {
  decodePolyline,
  decodePolylineToLatLng,
  decodePolylineToGeoJSON,
} from "../utils/polyline";
import { extractTripRouteCoordinates } from "../utils/mapGeoUtils";

/**
 * @typedef {Object} RouteGeometry
 * @property {string|number} id
 * @property {{ latitude: number, longitude: number }[]} coordinates
 * @property {[number, number][]} rawPoints - Pares [lat, lng]
 * @property {[number, number][]} geoJsonCoords - Pares [lng, lat]
 * @property {Object} trip
 */

export function useMapRoutesCache() {
  // Mapa en memoria: tripId -> { coordinates, rawPoints, geoJsonCoords, rawPolyline }
  const cacheRef = useRef(new Map());

  /**
   * Obtiene las rutas decodificadas para una lista de trayectos,
   * aprovechando la caché en memoria para los ya procesados.
   *
   * @param {Array<Object>} trayectos
   * @returns {RouteGeometry[]}
   */
  const getDecodedRoutes = useCallback((trayectos) => {
    if (!Array.isArray(trayectos)) return [];

    return trayectos
      .map((t) => {
        if (!t) return null;
        const tripId = String(t.id ?? t.id_trayecto ?? "");
        if (!tripId) return null;

        const poly = t.encodedPolyline || t.encoded_polyline || t.polyline;

        const currentEntry = cacheRef.current.get(tripId);

        // Si ya está en caché y la polilínea no ha cambiado, devolverlo directamente
        if (currentEntry) {
          if (!poly || currentEntry.rawPolyline === poly) {
            return {
              id: tripId,
              coordinates: currentEntry.coordinates,
              rawPoints: currentEntry.rawPoints,
              geoJsonCoords: currentEntry.geoJsonCoords,
              trip: t,
            };
          }
        }

        let coordinates = [];
        let rawPoints = [];
        let geoJsonCoords = [];

        // 1. Decodificación en el cliente desde string compacto (Layer 1)
        if (poly && typeof poly === "string") {
          coordinates = decodePolylineToLatLng(poly);
          rawPoints = decodePolyline(poly);
          geoJsonCoords = decodePolylineToGeoJSON(poly);
        } else {
          // 2. Fallback de extracción de coordenadas del modelo existente
          coordinates = extractTripRouteCoordinates(t) || [];
          if (Array.isArray(coordinates) && coordinates.length >= 2) {
            rawPoints = coordinates.map((c) => [c.latitude, c.longitude]);
            geoJsonCoords = coordinates.map((c) => [c.longitude, c.latitude]);
          }
        }

        if (!coordinates || coordinates.length < 2) return null;

        const newEntry = {
          rawPolyline: poly || "",
          coordinates,
          rawPoints,
          geoJsonCoords,
        };

        cacheRef.current.set(tripId, newEntry);

        return {
          id: tripId,
          coordinates,
          rawPoints,
          geoJsonCoords,
          trip: t,
        };
      })
      .filter(Boolean);
  }, []);

  /**
   * Genera una GeoJSON FeatureCollection consolidada para todas las rutas no seleccionadas.
   * Esto permite que el mapa renderice todas las polilíneas de fondo en un único draw-call (Layer 4).
   *
   * @param {Array<Object>} trayectos
   * @param {string|number|null} selectedId
   * @param {Object} [options]
   * @param {boolean} [options.isDark]
   * @param {boolean} [options.isDimmed]
   * @returns {{ type: "FeatureCollection", features: Array<Object> }}
   */
  const getRoutesFeatureCollection = useCallback(
    (trayectos, selectedId = null, options = {}) => {
      const { isDark = false, isDimmed = false } = options;
      const decodedRoutes = getDecodedRoutes(trayectos);
      const strSelectedId = selectedId != null ? String(selectedId) : null;

      const ROUTE_PALETTE = [
        "#0EA5E9", // Ocean Blue / Cyan
        "#14B8A6", // Teal
        "#8B5CF6", // Purple
        "#F59E0B", // Amber
        "#EC4899", // Coral Pink
        "#10B981", // Emerald
      ];

      const features = decodedRoutes
        .filter((r) => r.id !== strSelectedId)
        .map((r, index) => {
          const color = isDimmed
            ? (isDark ? "#475569" : "#94A3B8")
            : ROUTE_PALETTE[index % ROUTE_PALETTE.length];

          return {
            type: "Feature",
            id: r.id,
            properties: {
              id: r.id,
              colorIndex: index % ROUTE_PALETTE.length,
              stroke: color,
              "stroke-width": isDimmed ? 2 : 3.2,
              "stroke-opacity": isDimmed ? 0.35 : 0.85,
            },
            geometry: {
              type: "LineString",
              coordinates: r.geoJsonCoords, // GeoJSON [lng, lat]
            },
          };
        });

      return {
        type: "FeatureCollection",
        features,
      };
    },
    [getDecodedRoutes]
  );

  /**
   * Obtiene la ruta de un viaje específico desde la caché o la extrae
   */
  const getRouteForTrip = useCallback(
    (trip) => {
      if (!trip) return null;
      const tripId = String(trip.id ?? trip.id_trayecto ?? "");
      const cached = cacheRef.current.get(tripId);
      if (cached && cached.coordinates?.length >= 2) {
        return cached.coordinates;
      }
      const decoded = getDecodedRoutes([trip]);
      return decoded[0]?.coordinates || null;
    },
    [getDecodedRoutes]
  );

  /**
   * Limpia la caché en memoria
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    cacheRef,
    getDecodedRoutes,
    getRoutesFeatureCollection,
    getRouteForTrip,
    clearCache,
  };
}

export default useMapRoutesCache;
