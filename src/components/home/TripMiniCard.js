// YouConnext - TripMiniCard (carrusel de viajes disponibles)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Users, Clock } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";
import { MINI_CARD_WIDTH } from "./HomeSkeletons";

const TripMiniCard = ({ viaje, dateLabel, timeLabel, onPress }) => {
  const seats = viaje.disponible ?? viaje.plazas;
  const isFree = Number(viaje.precio) === 0;

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`Viaje de ${viaje.origen} a ${viaje.destino}`}
    >
      <View style={styles.header}>
        <View style={styles.whenChip}>
          <Clock size={12} color={COLORS.primaryDark} strokeWidth={2.5} />
          <Text style={styles.whenText}>
            {dateLabel} · {timeLabel}
          </Text>
        </View>
        {viaje.precio != null ? (
          <Text style={styles.price}>
            {isFree ? "Gratis" : `${viaje.precio}€`}
          </Text>
        ) : null}
      </View>

      <View style={styles.route}>
        <View style={styles.timeline}>
          <View style={styles.dotFilled} />
          <View style={styles.line} />
          <View style={styles.dotHollow} />
        </View>
        <View style={styles.routeTexts}>
          <Text style={styles.place} numberOfLines={1}>
            {viaje.origen || "Origen"}
          </Text>
          <Text style={styles.place} numberOfLines={1}>
            {viaje.destino || "Destino"}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Users size={14} color={COLORS.gray500} strokeWidth={2.2} />
        <Text style={styles.footerText}>
          {seats ?? "?"} {seats === 1 ? "plaza libre" : "plazas libres"}
        </Text>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    width: MINI_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  whenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
  },
  whenText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  price: {
    fontSize: FONTS.xl,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: COLORS.gray900,
  },
  route: {
    flexDirection: "row",
    gap: SPACING.sm + 2,
  },
  timeline: {
    alignItems: "center",
    paddingVertical: 5,
  },
  dotFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 3,
    borderRadius: 1,
    backgroundColor: COLORS.gray200,
  },
  dotHollow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: COLORS.secondary,
  },
  routeTexts: {
    flex: 1,
    gap: SPACING.sm + 2,
  },
  place: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  footerText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "600",
    color: COLORS.gray500,
  },
});

export default TripMiniCard;
