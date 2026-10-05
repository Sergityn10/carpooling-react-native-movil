// YouConnext - Skeletons de la Home
import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../constants";
import Skeleton from "../common/Skeleton";

export const MINI_CARD_WIDTH = 248;

export const HeroCardSkeleton = () => (
  <View style={styles.hero}>
    <Skeleton width={110} height={26} borderRadius={13} />
    <Skeleton width="45%" height={12} style={styles.gapMd} />
    <Skeleton width="80%" height={18} style={styles.gapSm} />
    <Skeleton width="65%" height={18} style={styles.gapSm} />
    <View style={styles.heroFooter}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <Skeleton width="40%" height={14} style={styles.flexGap} />
      <Skeleton width={72} height={36} borderRadius={RADIUS.full} />
    </View>
  </View>
);

export const CarouselSkeleton = ({ withImage = true }) => (
  <View style={styles.carousel}>
    {[0, 1].map((key) => (
      <View key={key} style={styles.miniCard}>
        {withImage ? (
          <Skeleton width="100%" height={128} borderRadius={0} />
        ) : null}
        <View style={styles.miniBody}>
          <Skeleton width="75%" height={16} />
          <Skeleton width="50%" height={12} style={styles.gapSm} />
          <Skeleton
            width="100%"
            height={34}
            borderRadius={RADIUS.md}
            style={styles.gapMd}
          />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.soft,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  flexGap: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  gapSm: {
    marginTop: SPACING.sm,
  },
  gapMd: {
    marginTop: SPACING.md,
  },
  carousel: {
    flexDirection: "row",
    gap: SPACING.md,
    overflow: "hidden",
  },
  miniCard: {
    width: MINI_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.soft,
  },
  miniBody: {
    padding: SPACING.md,
  },
});
