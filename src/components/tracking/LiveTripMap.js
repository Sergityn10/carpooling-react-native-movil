// YouConnext - Mapa en vivo del trayecto
// Pinta origen/destino y el coche del conductor con animación interpolada
// (Marker.Animated + AnimatedRegion) para que no "salte" entre updates.
import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import MapView, { Marker, AnimatedRegion } from "react-native-maps";
import { Car, MapPin, Flag } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const DEFAULT_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

const LiveTripMap = ({
  origin,
  destination,
  driverLocation,
  driverPhoto = null,
  driverName = "Conductor",
  participants = [],
  isRecovered = false,
  waitingLocation = false,
  trackingEnded = false,
  reconnecting = false,
  height = 420,
  bottomInset = 0,
  fullBleed = false,
}) => {
  const mapRef = useRef(null);
  const carCoordRef = useRef(null);

  if (!carCoordRef.current) {
    const initial = driverLocation || origin || { latitude: 0, longitude: 0 };
    carCoordRef.current = new AnimatedRegion({
      latitude: initial.latitude,
      longitude: initial.longitude,
      ...DEFAULT_DELTA,
    });
  }

  const initialRegion = useMemo(() => {
    const base = origin || driverLocation || destination;
    if (!base) return null;
    return {
      latitude: base.latitude,
      longitude: base.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, []);

  useEffect(() => {
    if (!driverLocation) return;

    carCoordRef.current
      .timing({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        duration: 1000,
        useNativeDriver: false,
      })
      .start();

    mapRef.current?.animateToRegion(
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        ...DEFAULT_DELTA,
      },
      800,
    );
  }, [driverLocation]);

  if (!initialRegion) {
    return (
      <View
        style={[styles.placeholder, fullBleed && styles.fullBleed, { height }]}
      >
        <Text style={styles.placeholderText}>
          No hay coordenadas para mostrar el mapa
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, fullBleed && styles.fullBleed, { height }]}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {origin && (
          <Marker coordinate={origin} title={origin.name || "Origen"}>
            <MapPin size={28} color={COLORS.primary} fill={COLORS.white} />
          </Marker>
        )}

        {destination && (
          <Marker
            coordinate={destination}
            title={destination.name || "Destino"}
          >
            <Flag size={26} color={COLORS.gray700} fill={COLORS.white} />
          </Marker>
        )}

        {driverLocation && (
          <Marker.Animated
            coordinate={carCoordRef.current}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View
              style={[
                styles.carMarker,
                isRecovered && styles.carMarkerRecovered,
              ]}
            >
              {driverPhoto ? (
                <Image
                  source={{ uri: driverPhoto }}
                  style={styles.markerPhoto}
                />
              ) : (
                <Car size={18} color={COLORS.white} strokeWidth={2.5} />
              )}
            </View>
          </Marker.Animated>
        )}

        {participants.map((p) =>
          p.location ? (
            <Marker
              key={p.id}
              coordinate={p.location}
              title={p.name || "Pasajero"}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.participantMarker}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} style={styles.markerPhoto} />
                ) : (
                  <Text style={styles.markerInitial}>
                    {(p.name || "?").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </Marker>
          ) : null,
        )}
      </MapView>

      {waitingLocation && !trackingEnded && (
        <View style={[styles.statusPill, { bottom: SPACING.md + bottomInset }]}>
          <View
            style={[styles.statusDot, { backgroundColor: COLORS.warning }]}
          />
          <Text style={styles.statusText}>
            Esperando ubicación del conductor…
          </Text>
        </View>
      )}

      {isRecovered && !waitingLocation && !trackingEnded && (
        <View style={[styles.statusPill, { bottom: SPACING.md + bottomInset }]}>
          <View
            style={[styles.statusDot, { backgroundColor: COLORS.gray400 }]}
          />
          <Text style={styles.statusText}>Última posición conocida</Text>
        </View>
      )}

      {reconnecting && !trackingEnded && (
        <View style={[styles.statusPill, styles.statusPillTop]}>
          <View
            style={[styles.statusDot, { backgroundColor: COLORS.warning }]}
          />
          <Text style={styles.statusText}>Reconectando…</Text>
        </View>
      )}

      {trackingEnded && (
        <View style={[styles.statusPill, { bottom: SPACING.md + bottomInset }]}>
          <View
            style={[styles.statusDot, { backgroundColor: COLORS.gray500 }]}
          />
          <Text style={styles.statusText}>Trayecto finalizado</Text>
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
  fullBleed: {
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
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
  carMarker: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.small,
  },
  carMarkerRecovered: {
    backgroundColor: COLORS.gray500,
  },
  markerPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.full,
  },
  participantMarker: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.small,
  },
  markerInitial: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: "700",
  },
  statusPill: {
    position: "absolute",
    bottom: SPACING.md,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    ...SHADOWS.small,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillTop: {
    bottom: undefined,
    top: SPACING.sm,
  },
  statusText: {
    color: COLORS.gray700,
    fontSize: FONTS.xs,
    fontWeight: "600",
  },
});

export default LiveTripMap;
