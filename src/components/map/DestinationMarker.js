// YouConnext - Marcador de Destino y Llegada de Trayecto (Pro UI)
// Identifica visualmente el punto final del viaje (diferenciado del origen)

import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Marker } from "react-native-maps";
import { Flag, MapPin } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import { getTripDestinationCoords } from "../../utils/mapGeoUtils";

const DestinationMarker = React.memo(({ trip, coordinate, onPress, selected, theme = "light" }) => {
  const destCoords = coordinate || getTripDestinationCoords(trip);
  if (!destCoords) return null;

  const isSelected = selected === trip.id;
  const isDark = theme === "dark";

  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 5,
      speed: 15,
    }).start();

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [trip.id, isSelected]);

  // Formatear nombre de destino (ej. "Cáceres", "Toledo, Centro" -> "Cáceres")
  const rawDest = trip.destino?.nombre || trip.destino || "Destino";
  const destinationName =
    typeof rawDest === "string"
      ? rawDest.split(",")[0].trim()
      : "Destino";

  return (
    <Marker
      coordinate={destCoords}
      onPress={() => onPress?.(trip)}
      tracksViewChanges={tracksViewChanges || isSelected}
      anchor={{ x: 0.5, y: 0.95 }}
      zIndex={isSelected ? 998 : 12}
    >
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: isSelected ? 1.08 : scaleAnim }] },
        ]}
      >
        {/* Pill Flotante de Destino */}
        <View
          style={[
            styles.pill,
            isDark && styles.pillDark,
            isSelected && styles.pillSelected,
          ]}
        >
          {/* Icono de Llegada / Bandera */}
          <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
            <Flag size={12} color={COLORS.white} strokeWidth={2.5} />
          </View>

          {/* Nombre de la Ciudad / Destino */}
          <View style={styles.textCol}>
            <Text
              style={[
                styles.destinationText,
                isDark && styles.textWhite,
                isSelected && styles.destinationTextSelected,
              ]}
              numberOfLines={1}
            >
              {destinationName}
            </Text>
          </View>
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

DestinationMarker.displayName = "DestinationMarker";

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
    paddingLeft: 4,
    paddingRight: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: "#BAE6FD", // Azul suave de destino
    ...SHADOWS.md,
    gap: 5,
  },
  pillDark: {
    backgroundColor: "#1E293B",
    borderColor: "#0284C7",
  },
  pillSelected: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    ...SHADOWS.lg,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.secondary, // Azul Océano YouConnext
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperSelected: {
    backgroundColor: COLORS.secondaryDark,
  },
  textCol: {
    maxWidth: 130,
  },
  destinationText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: "#0369A1", // Azul fuerte legible
  },
  destinationTextSelected: {
    color: COLORS.secondaryDark,
  },
  textWhite: {
    color: "#38BDF8",
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
    borderTopColor: "#BAE6FD",
    marginTop: -1,
  },
  pinArrowDark: {
    borderTopColor: "#0284C7",
  },
  pinArrowSelected: {
    borderTopColor: COLORS.secondary,
  },
});

export default DestinationMarker;