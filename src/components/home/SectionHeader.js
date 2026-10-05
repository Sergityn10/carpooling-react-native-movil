// YouConnext - SectionHeader
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { COLORS, SPACING, FONTS } from "../../constants";

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
        <ChevronRight size={16} color={COLORS.primary} strokeWidth={2.5} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  textCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  title: {
    fontSize: FONTS.xl,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: COLORS.gray900,
  },
  subtitle: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    color: COLORS.gray500,
    marginTop: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  actionText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default SectionHeader;
