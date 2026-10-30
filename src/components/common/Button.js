// YouConnext - Button Component (Guía de Estilo v2)
// Altura 48px, radio 12px, Sora 700. Verde para pasajero, negro para conductor.
import React from "react";
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { COLORS, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "./PressableScale";

const Button = ({
  title,
  onPress,
  variant = "primary", // 'primary', 'driver', 'secondary', 'outline', 'ghost', 'accent'
  size = "medium",    // 'small', 'medium' (48px standard), 'large'
  disabled = false,
  loading = false,
  icon = null,
  iconRight = null,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];

    switch (variant) {
      case "driver":
      case "dark":
        baseStyle.push(styles.buttonDriver);
        break;
      case "accent":
        baseStyle.push(styles.buttonAccent);
        break;
      case "secondary":
        baseStyle.push(styles.buttonSecondary);
        break;
      case "outline":
        baseStyle.push(styles.buttonOutline);
        break;
      case "ghost":
        baseStyle.push(styles.buttonGhost);
        break;
      case "primary":
      default:
        baseStyle.push(styles.buttonPrimary);
    }

    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${size}`]];

    switch (variant) {
      case "accent":
        baseStyle.push(styles.textAccent);
        break;
      case "outline":
      case "ghost":
        baseStyle.push(styles.textOutline);
        break;
      case "secondary":
        baseStyle.push(styles.textSecondary);
        break;
      case "primary":
      case "driver":
      case "dark":
      default:
        baseStyle.push(styles.textFilled);
    }

    if (disabled) {
      baseStyle.push(styles.textDisabled);
    }

    return baseStyle;
  };

  const getSpinnerColor = () => {
    if (variant === "outline" || variant === "ghost") return COLORS.primary;
    if (variant === "accent") return BRAND.black;
    return COLORS.white;
  };

  return (
    <PressableScale
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.control, // 12px exacto
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  button_small: {
    height: 38,
    paddingHorizontal: 14,
  },
  button_medium: {
    height: 48, // Estándar oficial pág. 4
    paddingHorizontal: 20,
  },
  button_large: {
    height: 52,
    paddingHorizontal: 24,
  },
  // Verde de pasajero (Reservar plaza)
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  // Negro estructurado de conductor (Publicar mi viaje)
  buttonDriver: {
    backgroundColor: BRAND.black,
    ...SHADOWS.small,
  },
  // Ámbar para eventos y avisos destacados
  buttonAccent: {
    backgroundColor: BRAND.accent,
    ...SHADOWS.small,
  },
  buttonSecondary: {
    backgroundColor: COLORS.primarySoft,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  // Verde niebla con texto apagado (Pág. 4)
  buttonDisabled: {
    backgroundColor: "#CDE3D6",
    borderColor: "#CDE3D6",
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontFamily: FONTS.typography?.button?.fontFamily || "Sora",
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  text_small: {
    fontSize: 13,
  },
  text_medium: {
    fontSize: 15, // Sora 700 / 15
  },
  text_large: {
    fontSize: 16,
  },
  textFilled: {
    color: COLORS.white,
  },
  textAccent: {
    color: BRAND.black,
  },
  textOutline: {
    color: COLORS.primary,
  },
  textSecondary: {
    color: COLORS.primary,
  },
  textDisabled: {
    color: "#6B7A75",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
