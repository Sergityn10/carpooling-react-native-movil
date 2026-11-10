// YouConnext - AuthTypeSwitcher (Selector Animado de Rol: Particular vs Organización)
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { User, Building2 } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";

const AuthTypeSwitcher = ({
  activeType = "user", // "user" | "enterprise"
  onChangeType,
  showHelperText = true,
  theme = "light", // "light" | "dark"
  style,
}) => {
  const isEnterprise = activeType === "enterprise";
  const isDark = theme === "dark";

  // Medición dinámica de anchura para animación precisa
  const [trackWidth, setTrackWidth] = useState(0);
  const animValue = useRef(new Animated.Value(isEnterprise ? 1 : 0)).current;

  // Animación física de deslizamiento (spring)
  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isEnterprise ? 1 : 0,
      damping: 18,
      stiffness: 190,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [isEnterprise, animValue]);

  const tabWidth = trackWidth > 0 ? (trackWidth - 8) / 2 : 0;
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          if (width > 0 && width !== trackWidth) {
            setTrackWidth(width);
          }
        }}
      >
        {/* Píldora Deslizante Animada (Indicador Flotante) */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                width: tabWidth,
                transform: [{ translateX }],
              },
              isDark
                ? (isEnterprise ? styles.indicatorEnterpriseDark : styles.indicatorUserDark)
                : styles.indicatorLight,
            ]}
          />
        )}

        {/* Pestaña 1: Particular */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.tab}
          onPress={() => onChangeType && onChangeType("user")}
          accessibilityRole="tab"
          accessibilityState={{ selected: !isEnterprise }}
          accessibilityLabel="Cambiar a cuenta particular"
        >
          <User
            size={16}
            color={
              !isEnterprise
                ? (isDark ? COLORS.white : COLORS.primary)
                : (isDark ? "#8A9994" : COLORS.gray500)
            }
            strokeWidth={2.4}
          />
          <Text
            style={[
              styles.tabLabel,
              isDark ? styles.tabLabelDark : styles.tabLabelLight,
              !isEnterprise && (isDark ? styles.tabLabelActiveDark : styles.tabLabelActiveUserLight),
            ]}
          >
            Particular
          </Text>
        </TouchableOpacity>

        {/* Pestaña 2: Organización */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.tab}
          onPress={() => onChangeType && onChangeType("enterprise")}
          accessibilityRole="tab"
          accessibilityState={{ selected: isEnterprise }}
          accessibilityLabel="Cambiar a cuenta de organización"
        >
          <Building2
            size={16}
            color={
              isEnterprise
                ? (isDark ? COLORS.white : BRAND.black)
                : (isDark ? "#8A9994" : COLORS.gray500)
            }
            strokeWidth={2.4}
          />
          <Text
            style={[
              styles.tabLabel,
              isDark ? styles.tabLabelDark : styles.tabLabelLight,
              isEnterprise && (isDark ? styles.tabLabelActiveDark : styles.tabLabelActiveEnterpriseLight),
            ]}
          >
            Organización
          </Text>

          {/* Pastilla mini B2B vistosa */}
          <View
            style={[
              styles.miniB2B,
              isDark ? styles.miniB2BDark : styles.miniB2BLight,
              isEnterprise && (isDark ? styles.miniB2BActiveDark : styles.miniB2BActiveLight),
            ]}
          >
            <Text
              style={[
                styles.miniB2BText,
                isDark ? styles.miniB2BTextDark : styles.miniB2BTextLight,
                isEnterprise && (isDark ? styles.miniB2BTextActiveDark : styles.miniB2BTextActiveLight),
              ]}
            >
              B2B
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {showHelperText && (
        <Text style={[styles.helperText, isDark ? styles.helperTextDark : styles.helperTextLight]}>
          {isEnterprise
            ? "Acceso institucional para empresas, entidades y coordinadores B2B"
            : "Acceso personal para conductores y pasajeros"}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: "100%",
    marginBottom: SPACING.md,
  },
  container: {
    flexDirection: "row",
    borderRadius: RADIUS.round,
    padding: 4,
    height: 48,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    position: "relative",
  },
  containerLight: {
    backgroundColor: "#E4ECE7",
    borderWidth: 1.5,
    borderColor: "#CBD8D0",
  },
  containerDark: {
    backgroundColor: "#121815",
    borderWidth: 1.5,
    borderColor: "#22332A",
  },
  slidingIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: RADIUS.round,
    zIndex: 1,
  },
  indicatorLight: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#D6E4DC",
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  indicatorUserDark: {
    backgroundColor: BRAND.greenOnLight, // #0B7A3B
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  indicatorEnterpriseDark: {
    backgroundColor: "#0D5230", // Verde corporativo profundo
    borderWidth: 1,
    borderColor: "#196E42",
    shadowColor: BRAND.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    gap: 6,
    zIndex: 2,
  },
  tabLabel: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tabLabelLight: {
    color: COLORS.gray600,
  },
  tabLabelDark: {
    color: "#8A9994",
  },
  tabLabelActiveUserLight: {
    color: COLORS.primary,
  },
  tabLabelActiveEnterpriseLight: {
    color: BRAND.black,
  },
  tabLabelActiveDark: {
    color: COLORS.white,
  },
  miniB2B: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 2,
  },
  miniB2BLight: {
    backgroundColor: "#D3E2DA",
  },
  miniB2BDark: {
    backgroundColor: "#1A2621",
  },
  miniB2BActiveLight: {
    backgroundColor: BRAND.accent,
  },
  miniB2BActiveDark: {
    backgroundColor: BRAND.accent,
  },
  miniB2BText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 9.5,
    fontWeight: "800",
  },
  miniB2BTextLight: {
    color: COLORS.gray600,
  },
  miniB2BTextDark: {
    color: "#8A9994",
  },
  miniB2BTextActiveLight: {
    color: BRAND.black,
  },
  miniB2BTextActiveDark: {
    color: BRAND.black,
  },
  helperText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 8,
  },
  helperTextLight: {
    color: COLORS.gray600,
  },
  helperTextDark: {
    color: "#A7B2AE",
  },
});

export default AuthTypeSwitcher;
