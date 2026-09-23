// YouConnext - Button Component
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const Button = ({
  title,
  onPress,
  variant = "primary", // primary, secondary, outline, ghost
  size = "medium", // small, medium, large
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];

    switch (variant) {
      case "secondary":
        baseStyle.push(styles.buttonSecondary);
        break;
      case "outline":
        baseStyle.push(styles.buttonOutline);
        break;
      case "ghost":
        baseStyle.push(styles.buttonGhost);
        break;
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
      case "outline":
      case "ghost":
        baseStyle.push(styles.textOutline);
        break;
      default:
        baseStyle.push(styles.textFilled);
    }

    if (disabled) {
      baseStyle.push(styles.textDisabled);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? COLORS.primary
              : COLORS.white
          }
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  button_small: {
    minHeight: 38,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  button_medium: {
    minHeight: 46,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  button_large: {
    minHeight: 54,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray300,
    borderColor: COLORS.gray300,
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  text_small: {
    fontSize: FONTS.sm,
    lineHeight: 20,
  },
  text_medium: {
    fontSize: FONTS.md,
    lineHeight: 22,
  },
  text_large: {
    fontSize: FONTS.lg,
    lineHeight: 24,
  },
  textFilled: {
    color: COLORS.white,
  },
  textOutline: {
    color: COLORS.primary,
  },
  textDisabled: {
    color: COLORS.gray500,
  },
  icon: {
    marginRight: SPACING.sm,
  },
});

export default Button;
