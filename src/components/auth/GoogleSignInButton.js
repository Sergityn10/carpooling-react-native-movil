// YouConnext - GoogleSignInButton (Botón reutilizable de autenticación con Google)
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";
import GoogleIcon from "../GoogleIcon";

const GoogleSignInButton = ({
  onPress,
  loading = false,
  disabled = false,
  text = "Continuar con Google",
  loadingText = "Conectando...",
  variant = "default", // "default" | "corporate" | "outline"
  theme = "light", // "light" | "dark"
  iconSize = 20,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const isDark = theme === "dark";
  const isCorporate = variant === "corporate";
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        isDark ? styles.buttonDark : styles.buttonLight,
        isCorporate && (isDark ? styles.buttonCorporateDark : styles.buttonCorporateLight),
        variant === "outline" && styles.buttonOutline,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || text}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <View style={styles.contentRow}>
          <ActivityIndicator
            size="small"
            color={isDark ? COLORS.white : BRAND.black}
            style={styles.spinner}
          />
          <Text
            style={[
              styles.text,
              isDark ? styles.textDark : styles.textLight,
              textStyle,
            ]}
          >
            {loadingText}
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>
            <GoogleIcon size={iconSize} />
          </View>
          <Text
            style={[
              styles.text,
              isDark ? styles.textDark : styles.textLight,
              isCorporate && styles.textCorporate,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {text}
          </Text>
        </View>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: RADIUS.button || 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    ...SHADOWS.small,
  },
  buttonLight: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  buttonDark: {
    backgroundColor: "#1D2522",
    borderColor: COLORS.borderDark || "#2F3A36",
  },
  buttonCorporateLight: {
    backgroundColor: COLORS.white,
    borderColor: BRAND.accent, // Acento ámbar institucional
  },
  buttonCorporateDark: {
    backgroundColor: "#1D2522",
    borderColor: BRAND.accent,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderColor: COLORS.border,
    shadowColor: "transparent",
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm || 10,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginRight: 4,
  },
  text: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 14,
    fontWeight: "600",
  },
  textLight: {
    color: BRAND.black,
  },
  textDark: {
    color: COLORS.white,
  },
  textCorporate: {
    color: BRAND.black,
  },
});

export default GoogleSignInButton;
