import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { Navigation2, Clock } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import {
  buildStaticMapUrl,
  getDirectionsRoute,
} from "../../services/googlePlaces";

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

const TripMapPreview = ({ origin, destination, height = 160 }) => {
  const [imageError, setImageError] = useState(false);
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
    setImageError(false);
  }, [origin, destination]);

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
  }, [hasBothPoints, origin, destination]);

  const url = useMemo(() => {
    try {
      if (!hasAnyPoint) return null;
      return buildStaticMapUrl({
        origin,
        destination,
        encodedPolyline,
        width: 640,
        height: 320,
        scale: 2,
      });
    } catch {
      return null;
    }
  }, [origin, destination, encodedPolyline, hasAnyPoint]);

  if (!url || imageError) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>
          {!hasAnyPoint
            ? "Selecciona origen y/o destino para ver el mapa"
            : routeError
              ? routeError
              : "No se pudo cargar el mapa (revisa API key / billing / Maps Static API / Directions API)"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <Image
        source={{ uri: url }}
        style={styles.image}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
      {loadingRoute && (
        <View style={styles.routeLoadingPill}>
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
    ...SHADOWS.small,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.gray100,
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
    backgroundColor: "rgba(0,0,0,0.6)",
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
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeInfoText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: "600",
  },
  routeInfoDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});

export default TripMapPreview;
