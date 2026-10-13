// YouConnext - Switcher de Modo de Vista (Lista ↔ Mapa)
// Selector segmentado con diseño YouConnext Pro y modo flotante para el mapa

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Map, List } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const ViewModeSwitcher = ({ activeMode, onModeChange, isMapMode = false, topInset = 0, style }) => {
  const isList = activeMode === "list";
  const isMap = activeMode === "map";

  return (
    <View
      style={[
        styles.outerContainer,
        isMapMode ? [styles.mapFloatingContainer, { top: topInset + SPACING.sm }] : styles.listContainer,
        style,
      ]}
    >
      <View style={[styles.track, isMapMode ? styles.trackMap : styles.trackList]}>
        {/* Opción 1: Lista / Feed */}
        <TouchableOpacity
          style={[
            styles.tabButton,
            isList && styles.tabButtonActive,
          ]}
          onPress={() => onModeChange("list")}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityState={{ selected: isList }}
          accessibilityLabel="Ver vista de lista"
        >
          <List
            size={18}
            color={isList ? COLORS.white : COLORS.gray600}
            strokeWidth={isList ? 2.5 : 2}
          />
          <Text
            style={[
              styles.tabLabel,
              isList ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Lista
          </Text>
        </TouchableOpacity>

        {/* Opción 2: Mapa Interactivo */}
        <TouchableOpacity
          style={[
            styles.tabButton,
            isMap && styles.tabButtonActive,
          ]}
          onPress={() => onModeChange("map")}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityState={{ selected: isMap }}
          accessibilityLabel="Ver mapa interactivo"
        >
          <Map
            size={18}
            color={isMap ? COLORS.white : COLORS.gray600}
            strokeWidth={isMap ? 2.5 : 2}
          />
          <Text
            style={[
              styles.tabLabel,
              isMap ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Mapa
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    zIndex: 100,
  },
  listContainer: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  mapFloatingContainer: {
    position: "absolute",
    alignSelf: "center",
    width: "88%",
    maxWidth: 360,
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.full,
    padding: 4,
    height: 48,
  },
  trackList: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    ...SHADOWS.sm,
  },
  trackMap: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    ...SHADOWS.lg,
  },
  tabButton: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    gap: SPACING.xs + 2,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  tabLabel: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: COLORS.white,
  },
  tabLabelInactive: {
    color: COLORS.gray600,
  },
});

export default ViewModeSwitcher;