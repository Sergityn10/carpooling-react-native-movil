// YouConnext - SectionHeader (Guía de Estilo v2)
// Sección Sora 700 · 18/24, Inter para subtítulo y acento verde táctil
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { COLORS, SPACING, FONTS, BRAND } from "../../constants";

const SectionHeader = ({ title, subtitle, actionLabel, onActionPress }) => (
  <View style={styles.container}>
    <View style={styles.textCol}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {actionLabel && onActionPress ? (
      <TouchableOpacity
        style={styles.action}
        onPress={onActionPress}
        hitSlop={8}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
        <ChevronRight size={15} color={BRAND.greenOnLight} strokeWidth={2.4} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: SPACING.sm + 4,
  },
  textCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  title: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 18, // Sora 700 · 18/24
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.black,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.gray600,
    marginTop: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingBottom: 2,
  },
  actionText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.greenOnLight,
  },
});

export default SectionHeader;
