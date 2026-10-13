// YouConnext - Marcador de Paradas Intermedias / Waypoints de un Trayecto
// Señala puntos de recogida y tramos en ruta cuando el viaje está seleccionado

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { MapPin } from "lucide-react-native";
import { COLORS, RADIUS, FONTS, SHADOWS } from "../../constants";

const WaypointMarker = React.memo(({ waypoint, onPress, theme = "light" }) => {
  if (!waypoint?.latitude || !waypoint?.longitude) return null;

  const isDark = theme === "dark";

  return (
    <Marker
      coordinate={{ latitude: waypoint.latitude, longitude: waypoint.longitude }}
      onPress={() => onPress?.(waypoint)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={50}
    >
      <View style={styles.container}>
        <View style={[styles.circleOuter, isDark && styles.circleOuterDark]}>
          <View style={styles.circleInner}>
            {waypoint.order ? (
              <Text style={styles.orderText}>{waypoint.order}</Text>
            ) : (
              <View style={styles.dot} />
            )}
          </View>
        </View>
      </View>
    </Marker>
  );
});

WaypointMarker.displayName = "WaypointMarker";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  circleOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  circleOuterDark: {
    backgroundColor: "#0F172A",
    borderColor: COLORS.primaryLight,
  },
  circleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  orderText: {
    fontSize: 9,
    fontWeight: FONTS.bold,
    color: COLORS.primaryDark,
  },
});

export default WaypointMarker;