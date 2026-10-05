// YouConnext - Hero cards de la Home (próximo viaje / próximo plan)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  Clock,
  MessageCircle,
  Ticket,
  CheckCircle2,
  Search,
  PlusCircle,
  CalendarDays,
} from "lucide-react-native";
import {
  COLORS,
  SPACING,
  RADIUS,
  FONTS,
  coloredShadow,
} from "../../constants";
import GradientBackground from "../common/GradientBackground";
import PressableScale from "../common/PressableScale";
import PulseDot from "../common/PulseDot";

const Decorations = () => (
  <>
    <View style={[styles.ring, styles.ringLarge]} />
    <View style={[styles.ring, styles.ringSmall]} />
  </>
);

export const HeroTripCard = ({
  viaje,
  countdown,
  dateLabel,
  timeLabel,
  conductorNombre,
  onPress,
  onChatPress,
}) => (
  <PressableScale
    style={[styles.shell, coloredShadow(COLORS.primaryDark, 0.35)]}
    onPress={onPress}
    scaleTo={0.98}
    accessibilityLabel={`Tu próximo viaje de ${viaje.origen} a ${viaje.destino}`}
  >
    <View style={styles.inner}>
      <GradientBackground colors={COLORS.gradient.hero} />
      <Decorations />

      <View style={styles.topRow}>
        {countdown ? (
          <View style={styles.pill}>
            <PulseDot color={COLORS.white} size={6} />
            <Text style={styles.pillText}>{countdown}</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.datePill}>
          <CalendarDays size={13} color={COLORS.primaryDark} strokeWidth={2.5} />
          <Text style={styles.datePillText}>
            {dateLabel} · {timeLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>Tu próximo viaje</Text>

      <View style={styles.route}>
        <View style={styles.timeline}>
          <View style={styles.dotFilled} />
          <View style={styles.timelineLine} />
          <View style={styles.dotHollow} />
        </View>
        <View style={styles.routeTexts}>
          <Text style={styles.routeText} numberOfLines={1}>
            {viaje.origen || "Origen"}
          </Text>
          <Text style={styles.routeText} numberOfLines={1}>
            {viaje.destino || "Destino"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.person}>
          {viaje.img_perfil ? (
            <Image source={{ uri: viaje.img_perfil }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {conductorNombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.personTexts}>
            <Text style={styles.personLabel}>Conductor</Text>
            <Text style={styles.personName} numberOfLines={1}>
              {conductorNombre}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={onChatPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Abrir chat del viaje"
        >
          <MessageCircle size={16} color={COLORS.primaryDark} strokeWidth={2.5} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  </PressableScale>
);

export const HeroEventCard = ({
  evento,
  tieneViaje,
  onPress,
  onSearchTrip,
  onOfferSeats,
}) => (
  <PressableScale
    style={[styles.shell, coloredShadow(COLORS.secondaryDark, 0.35)]}
    onPress={onPress}
    scaleTo={0.98}
    accessibilityLabel={`Tu próximo plan: ${evento.name}`}
  >
    <View style={styles.inner}>
      <GradientBackground colors={COLORS.gradient.ocean} />
      <Decorations />

      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Ticket size={13} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.pillText}>Te has unido</Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>Tu próximo plan</Text>
      <Text style={styles.eventTitle} numberOfLines={2}>
        {evento.name}
      </Text>

      {tieneViaje ? (
        <View style={styles.readyBadge}>
          <CheckCircle2 size={16} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.readyText}>Ya tienes un viaje para este evento</Text>
        </View>
      ) : (
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={onSearchTrip}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Search size={16} color={COLORS.secondaryDark} strokeWidth={2.5} />
            <Text style={styles.ctaPrimaryText}>Buscar viaje</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaGhost}
            onPress={onOfferSeats}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <PlusCircle size={16} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.ctaGhostText}>Ofrecer plazas</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </PressableScale>
);

const styles = StyleSheet.create({
  shell: {
    borderRadius: 28,
    backgroundColor: COLORS.primaryDark,
  },
  shellEvent: {
    backgroundColor: COLORS.secondaryDark,
  },
  inner: {
    borderRadius: 28,
    overflow: "hidden",
    padding: SPACING.lg,
  },
  ring: {
    position: "absolute",
    borderRadius: RADIUS.full,
    borderWidth: 28,
    borderColor: "rgba(255,255,255,0.06)",
  },
  ringLarge: {
    width: 240,
    height: 240,
    top: -110,
    right: -80,
  },
  ringSmall: {
    width: 140,
    height: 140,
    bottom: -70,
    right: 40,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.white,
    fontWeight: "700",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  datePillText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
  },
  route: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  timeline: {
    alignItems: "center",
    paddingVertical: 6,
  },
  dotFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accentLight,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginVertical: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 1,
  },
  dotHollow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  routeTexts: {
    flex: 1,
    gap: SPACING.md,
  },
  routeText: {
    fontSize: FONTS.lg,
    lineHeight: 24,
    color: COLORS.white,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: SPACING.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  personTexts: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.white,
  },
  personLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  personName: {
    fontSize: FONTS.md,
    lineHeight: 20,
    color: COLORS.white,
    fontWeight: "700",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
  },
  chatButtonText: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  eventTitle: {
    fontSize: FONTS.xxl,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  readyText: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  ctaRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 46,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
  },
  ctaPrimaryText: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.secondaryDark,
  },
  ctaGhost: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 46,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: RADIUS.full,
  },
  ctaGhostText: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.white,
  },
});
