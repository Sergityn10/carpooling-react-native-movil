// YouConnext - Marcador de Conductor y Trayecto en Mapa (Pro UI)
// Formato Pill flotante con avatar, precio, plazas y animación spring

import React, { useRef, useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { Marker } from "react-native-maps";
import { User, Star, Users } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const DriverMarker = React.memo(({ trip, coordinate, onPress, selected, zoom, theme = "light" }) => {
  const {
    id,
    conductor,
    precio,
    plazasDisponibles,
    disponible,
    conductorRating,
    img_perfil,
  } = trip;

  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 6,
      speed: 14,
    }).start();

    // Permitir snapshot estable una vez montado el componente
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [trip.id, selected]);

  const driverAvatar =
    img_perfil ||
    trip.conductor_img ||
    (typeof conductor === "object" ? (conductor?.img_perfil || conductor?.avatar || conductor?.photo) : null);

  const driverName =
    (typeof conductor === "object" ? (conductor?.nombre || conductor?.name) : conductor) ||
    trip.conductorNombre ||
    "Conductor";
  const rating = conductorRating || (typeof conductor === "object" ? conductor?.rating : null) || 4.9;
  const seats = plazasDisponibles ?? disponible ?? 0;
  const price = precio ?? 0;
  const isSelected = selected === id;
  const isDark = theme === "dark";

  const targetCoord =
    coordinate ||
    (trip.puntosClave?.origen
      ? { latitude: trip.puntosClave.origen.lat, longitude: trip.puntosClave.origen.lng }
      : trip.origen_lat != null && trip.origen_lng != null
      ? { latitude: trip.origen_lat, longitude: trip.origen_lng }
      : null);

  if (!targetCoord) return null;

  return (
    <Marker
      coordinate={targetCoord}
      onPress={() => onPress?.(trip)}
      tracksViewChanges={tracksViewChanges || isSelected}
      anchor={{ x: 0.5, y: 0.95 }}
      zIndex={isSelected ? 999 : 10}
    >
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: isSelected ? 1.08 : scaleAnim }] },
        ]}
      >
        {/* Pill Principal */}
        <View
          style={[
            styles.pill,
            isDark && styles.pillDark,
            isSelected && styles.pillSelected,
          ]}
        >
          {/* Avatar del conductor */}
          <View style={styles.avatarWrapper}>
            {driverAvatar ? (
              <Image source={{ uri: driverAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <User size={13} color={COLORS.white} strokeWidth={2.5} />
              </View>
            )}
          </View>

          {/* Precio destacado */}
          <View style={styles.priceCol}>
            <Text style={[styles.priceText, isDark && styles.textWhite]}>
              {price}€
            </Text>
          </View>

          {/* Badge de Plazas */}
          {seats > 0 && (
            <View style={[styles.seatsBadge, isSelected && styles.seatsBadgeSelected]}>
              <Users size={10} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.seatsText}>{seats}</Text>
            </View>
          )}
        </View>

        {/* Flecha inferior del Pin */}
        <View
          style={[
            styles.pinArrow,
            isDark && styles.pinArrowDark,
            isSelected && styles.pinArrowSelected,
          ]}
        />
      </Animated.View>
    </Marker>
  );
});

DriverMarker.displayName = "DriverMarker";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...SHADOWS.md,
    gap: 6,
  },
  pillDark: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  pillSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    transform: [{ scale: 1.05 }],
  },
  avatarWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  avatarFallback: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  priceCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.gray900,
  },
  textWhite: {
    color: COLORS.white,
  },
  seatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  seatsBadgeSelected: {
    backgroundColor: COLORS.secondary,
  },
  seatsText: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },
  pinArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#E2E8F0",
    marginTop: -1,
  },
  pinArrowDark: {
    borderTopColor: "#334155",
  },
  pinArrowSelected: {
    borderTopColor: COLORS.primary,
  },
});

export default DriverMarker;