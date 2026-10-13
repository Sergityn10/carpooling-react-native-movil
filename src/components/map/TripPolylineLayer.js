// YouConnext - Capa de Polilíneas de Trayectos con Efecto Glow / Halo y LOD
// Renderizado de doble capa (halo exterior + trazo central nítido) con decodificación unificada
// Incluye paleta de colores por viaje y desplazamiento paralelo para rutas superpuestas

import React, { useMemo } from "react";
import { Polyline } from "react-native-maps";
import {
  extractTripRouteCoordinates,
  simplifyPolylineRDP,
  getSimplificationEpsilon,
  calculateParallelOffset,
} from "../../utils/mapGeoUtils";
import { COLORS } from "../../constants";

// Paleta de colores complementarios para diferenciar viajes no seleccionados
const ROUTE_COLORS = [
  COLORS.primary,      // Turquesa YouConnext
  COLORS.secondary,    // Azul Océano
  "#8B5CF6",           // Violeta suave
  "#EC4899",           // Rosa coral
  "#F59E0B",           // Ámbar
  "#10B981",           // Esmeralda
];

const TripPolylineLayer = React.memo(({ trip, customCoordinates, selected, hasActiveSelection, zoom, theme = "light", onPress, colorIndex = 0, offsetIndex = 0 }) => {
  const coordinates = useMemo(() => {
    let rawCoords = (Array.isArray(customCoordinates) && customCoordinates.length >= 2)
      ? customCoordinates
      : extractTripRouteCoordinates(trip);

    if (!rawCoords || rawCoords.length < 2) return [];

    // Simplificación adaptativa para zooms alejados para optimizar FPS
    if (zoom <= 14 && rawCoords.length > 50) {
      const epsilon = getSimplificationEpsilon(zoom);
      rawCoords = simplifyPolylineRDP(rawCoords, epsilon);
    }

    // Aplicar desplazamiento paralelo si hay múltiples rutas en el mismo corredor
    if (offsetIndex > 0 && rawCoords.length >= 2) {
      rawCoords = calculateParallelOffset(rawCoords, offsetIndex * 12); // 12 metros por nivel
    }

    return rawCoords;
  }, [trip, customCoordinates, zoom, offsetIndex]);

  if (!coordinates || coordinates.length < 2) return null;

  const isDark = theme === "dark";
  const isDimmed = hasActiveSelection && !selected;

  // Color base para viajes no seleccionados (paleta rotativa)
  const baseColor = ROUTE_COLORS[colorIndex % ROUTE_COLORS.length];

  // Colores y grosores según selección y tema
  const coreColor = selected
    ? COLORS.secondary // Azul Océano cuando está seleccionado
    : isDimmed
    ? (isDark ? "rgba(148, 163, 184, 0.22)" : "rgba(100, 116, 139, 0.28)") // Atenuado
    : isDark
    ? baseColor
    : baseColor;

  const glowColor = selected
    ? "rgba(14, 165, 233, 0.55)"
    : isDimmed
    ? "transparent"
    : isDark
    ? `${baseColor}44` // 27% opacity
    : `${baseColor}38`; // 22% opacity

  return (
    <>
      {/* Capa 1: Halo exterior resplandeciente */}
      {!isDimmed && (
        <Polyline
          coordinates={coordinates}
          strokeColor={glowColor}
          strokeWidth={selected ? 14 : 7}
          lineCap="round"
          lineJoin="round"
          geodesic={true}
          zIndex={selected ? 30 : 4}
        />
      )}

      {/* Capa 2: Trazo central definido */}
      <Polyline
        coordinates={coordinates}
        strokeColor={coreColor}
        strokeWidth={selected ? 5.5 : isDimmed ? 1.8 : 3.2}
        strokeOpacity={isDimmed ? 0.35 : 1}
        lineCap="round"
        lineJoin="round"
        geodesic={true}
        onPress={onPress}
        zIndex={selected ? 35 : 6}
      />
    </>
  );
});

TripPolylineLayer.displayName = "TripPolylineLayer";

export default TripPolylineLayer;