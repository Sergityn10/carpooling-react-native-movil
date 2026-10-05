// YouConnext - EventMiniCard (carrusel de eventos en la Home)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ticket, Building2, CheckCircle2, MapPin } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import GradientBackground from "../common/GradientBackground";
import PressableScale from "../common/PressableScale";
import { MINI_CARD_WIDTH } from "./HomeSkeletons";

const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

const getDateChip = (startDate) => {
  if (!startDate) return null;
  const date = new Date(startDate);
  if (isNaN(date.getTime())) return null;
  return { day: date.getDate(), month: MONTHS[date.getMonth()] };
};

const formatDistance = (km) => {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

const EventMiniCard = ({
  event,
  tieneViaje,
  onPress,
  onSearchTrip,
  onOfferSeats,
}) => {
  const hasImage = event.image && event.image.length > 100;
  const dateChip = getDateChip(event.start_date);
  const distance = formatDistance(event.distance_km);
  const companyName = event.company?.name;

  return (
    <PressableScale
      style={styles.shell}
      onPress={onPress}
      accessibilityLabel={`Evento ${event.name}`}
    >
      <View style={styles.inner}>
        <View style={styles.media}>
          {hasImage ? (
            <Image
              source={{
                uri: event.image.startsWith("data:")
                  ? event.image
                  : `data:image/jpeg;base64,${event.image}`,
              }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholder}>
              <GradientBackground
                colors={[COLORS.secondarySoft, COLORS.primarySoft]}
              />
              <Ticket size={32} color={COLORS.secondary} strokeWidth={1.6} />
            </View>
          )}
          <GradientBackground
            colors={["#000000", "#000000"]}
            opacities={[0, 0.55]}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 0, y: 1 }}
          />

          {dateChip ? (
            <View style={styles.dateChip}>
              <Text style={styles.dateDay}>{dateChip.day}</Text>
              <Text style={styles.dateMonth}>{dateChip.month}</Text>
            </View>
          ) : null}

          {distance ? (
            <View style={styles.distanceChip}>
              <MapPin size={11} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          ) : null}

          {companyName ? (
            <View style={styles.companyRow}>
              <Building2 size={12} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.companyText} numberOfLines={1}>
                {companyName}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {event.name}
          </Text>

          {tieneViaje ? (
            <View style={styles.readyBadge}>
              <CheckCircle2 size={14} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.readyText}>Viaje listo</Text>
            </View>
          ) : (
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.ctaSoft}
                onPress={onSearchTrip}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.ctaSoftText}>Buscar viaje</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ctaSolid}
                onPress={onOfferSeats}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.ctaSolidText}>Ofrecer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  shell: {
    width: MINI_CARD_WIDTH,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  inner: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
  },
  media: {
    height: 136,
    backgroundColor: COLORS.gray100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dateChip: {
    position: "absolute",
    top: SPACING.sm + 2,
    left: SPACING.sm + 2,
    minWidth: 44,
    paddingVertical: 4,
    paddingHorizontal: SPACING.xs,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  dateDay: {
    fontSize: FONTS.lg,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  dateMonth: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  distanceChip: {
    position: "absolute",
    top: SPACING.sm + 2,
    right: SPACING.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  distanceText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  companyRow: {
    position: "absolute",
    left: SPACING.sm + 2,
    right: SPACING.sm + 2,
    bottom: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  companyText: {
    flexShrink: 1,
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  title: {
    fontSize: FONTS.md,
    lineHeight: 21,
    fontWeight: "700",
    color: COLORS.gray900,
    minHeight: 42,
  },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    minHeight: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
  },
  readyText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  ctaRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  ctaSoft: {
    flex: 1,
    minHeight: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSoftText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.gray800,
  },
  ctaSolid: {
    flex: 1,
    minHeight: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSolidText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
});

export default EventMiniCard;
