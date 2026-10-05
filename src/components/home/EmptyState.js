// YouConnext - EmptyState
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const EmptyState = ({
  icon: Icon,
  tint = COLORS.primary,
  tintSoft = COLORS.primarySoft,
  title,
  subtitle,
  actionLabel,
  onActionPress,
}) => (
  <View style={styles.card}>
    {Icon ? (
      <View style={[styles.iconOuter, { backgroundColor: tintSoft }]}>
        <View style={styles.iconInner}>
          <Icon size={26} color={tint} strokeWidth={2} />
        </View>
      </View>
    ) : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {actionLabel && onActionPress ? (
      <TouchableOpacity
        style={[styles.action, { backgroundColor: tint }]}
        onPress={onActionPress}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    ...SHADOWS.soft,
  },
  iconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  iconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "700",
    color: COLORS.gray900,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: SPACING.xs,
    maxWidth: 280,
  },
  action: {
    marginTop: SPACING.md,
    minHeight: 44,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default EmptyState;
