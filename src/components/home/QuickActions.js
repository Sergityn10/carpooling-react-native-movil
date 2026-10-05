// YouConnext - QuickActions (accesos directos en tarjetas)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import GradientBackground from "../common/GradientBackground";
import PressableScale from "../common/PressableScale";

const QuickActions = ({ actions }) => (
  <View style={styles.row}>
    {actions.map((action) => (
      <PressableScale
        key={action.label}
        style={styles.card}
        onPress={action.onPress}
        accessibilityLabel={action.label}
        scaleTo={0.97}
      >
        <View style={styles.topRow}>
          <View style={styles.iconChip}>
            <GradientBackground colors={action.gradient} />
            <action.icon size={22} color={COLORS.white} strokeWidth={2.4} />
          </View>
          <View style={styles.arrowBadge}>
            <ChevronRight size={14} color={COLORS.gray400} strokeWidth={2.5} />
          </View>
        </View>

        <View style={styles.textCol}>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {action.label}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {action.subtitle}
          </Text>
        </View>
      </PressableScale>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    gap: 2,
  },
  title: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    fontWeight: "500",
  },
});

export default QuickActions;
