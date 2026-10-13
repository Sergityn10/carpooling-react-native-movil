// YouConnext - Controles Flotantes del Mapa Pro
// Botones: GPS con auto-localización, Zoom +/-, Brújula Norte, Refresco con animación y Modo Día/Noche

import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated, Easing, ActivityIndicator } from "react-native";
import { Crosshair, Plus, Minus, Compass, RefreshCw, Sun, Moon } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";

const MapControls = ({
  onCenterUserLocation,
  onResetNorth,
  onZoomIn,
  onZoomOut,
  onRefresh,
  onToggleTheme,
  mapTheme = "light",
  userLocation,
  hasUserMoved,
  disabled = false,
  locationLoading = false,
  refreshing = false,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [refreshing, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const isDark = mapTheme === "dark";

  return (
    <View style={styles.container}>
      {/* Grupo 1: Zoom In / Zoom Out */}
      <View style={[styles.groupCard, isDark && styles.groupCardDark]}>
        <PressableScale
          style={styles.iconButton}
          onPress={onZoomIn}
          disabled={disabled}
          accessibilityLabel="Acercar mapa"
          hitSlop={6}
        >
          <Plus size={18} color={isDark ? COLORS.white : COLORS.gray700} strokeWidth={2.5} />
        </PressableScale>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        <PressableScale
          style={styles.iconButton}
          onPress={onZoomOut}
          disabled={disabled}
          accessibilityLabel="Alejar mapa"
          hitSlop={6}
        >
          <Minus size={18} color={isDark ? COLORS.white : COLORS.gray700} strokeWidth={2.5} />
        </PressableScale>
      </View>

      {/* Grupo 2: Mi Ubicación (GPS) */}
      <PressableScale
        style={[
          styles.singleButton,
          isDark && styles.groupCardDark,
          !hasUserMoved && userLocation && styles.activeGpsButton,
        ]}
        onPress={onCenterUserLocation}
        disabled={disabled || locationLoading}
        accessibilityLabel="Centrar en mi ubicación"
        hitSlop={8}
      >
        {locationLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Crosshair
            size={20}
            color={!hasUserMoved && userLocation ? COLORS.white : isDark ? COLORS.white : COLORS.primary}
            strokeWidth={2.4}
          />
        )}
      </PressableScale>

      {/* Grupo 3: Brújula / Orientación Norte */}
      <PressableScale
        style={[styles.singleButton, isDark && styles.groupCardDark]}
        onPress={onResetNorth}
        disabled={disabled}
        accessibilityLabel="Orientar al norte"
        hitSlop={8}
      >
        <Compass size={20} color={isDark ? COLORS.white : COLORS.gray600} strokeWidth={2.2} />
      </PressableScale>

      {/* Grupo 4: Refrescar Viajes */}
      <PressableScale
        style={[styles.singleButton, isDark && styles.groupCardDark]}
        onPress={onRefresh}
        disabled={disabled || refreshing}
        accessibilityLabel="Recargar viajes visibles"
        hitSlop={8}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <RefreshCw size={19} color={isDark ? COLORS.white : COLORS.gray600} strokeWidth={2.2} />
        </Animated.View>
      </PressableScale>

      {/* Grupo 5: Alternador Día / Noche */}
      <PressableScale
        style={[styles.singleButton, isDark && styles.groupCardDark]}
        onPress={onToggleTheme}
        disabled={disabled}
        accessibilityLabel="Cambiar tema del mapa"
        hitSlop={8}
      >
        {isDark ? (
          <Sun size={20} color={COLORS.accent} strokeWidth={2.4} />
        ) : (
          <Moon size={19} color={COLORS.gray700} strokeWidth={2.2} />
        )}
      </PressableScale>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: SPACING.md,
    bottom: SPACING.xl * 2.8,
    flexDirection: "column",
    gap: SPACING.sm,
    zIndex: 90,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  groupCardDark: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  iconButton: {
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerDark: {
    backgroundColor: "#334155",
  },
  singleButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activeGpsButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
});

export default MapControls;