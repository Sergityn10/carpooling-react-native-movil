// YouConnext - AuthDivider (Separador decorativo para flujos de autenticación)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONTS } from "../../constants";

const AuthDivider = ({
  text = "o entra con",
  theme = "light", // "light" | "dark"
  style,
  textStyle,
}) => {
  const isDark = theme === "dark";

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.line,
          isDark ? styles.lineDark : styles.lineLight,
        ]}
      />
      <Text
        style={[
          styles.text,
          isDark ? styles.textDark : styles.textLight,
          textStyle,
        ]}
      >
        {text}
      </Text>
      <View
        style={[
          styles.line,
          isDark ? styles.lineDark : styles.lineLight,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  line: {
    flex: 1,
    height: 1,
  },
  lineLight: {
    backgroundColor: COLORS.border,
  },
  lineDark: {
    backgroundColor: COLORS.borderDark || "#2F3A36",
  },
  text: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textLight: {
    color: COLORS.gray500,
  },
  textDark: {
    color: "#8A9994",
  },
});

export default AuthDivider;
