// YouConnext - HomeHeader (cabecera con degradado + buscador flotante)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { MessageCircle, Search, SlidersHorizontal } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import GradientBackground from "../common/GradientBackground";
import PressableScale from "../common/PressableScale";

const HomeHeader = ({
  user,
  greeting,
  topInset = 0,
  onChatPress,
  onProfilePress,
  onSearchPress,
}) => {
  const displayName = user?.nombre || user?.name || "Usuario";
  const initial = displayName.charAt(0).toUpperCase();
  const completion = user?.completitud?.porcentaje_total;
  const showCompletion = typeof completion === "number" && completion < 100;

  return (
    <View>
      <View style={[styles.hero, { paddingTop: topInset + SPACING.md }]}>
        <GradientBackground
          colors={COLORS.gradient.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.blob, styles.blobLarge]} />
        <View style={[styles.blob, styles.blobSmall]} />

        <View style={styles.topRow}>
          <View style={styles.greetingCol}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.glassButton}
              onPress={onChatPress}
              activeOpacity={0.8}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Abrir mensajes"
            >
              <MessageCircle size={20} color={COLORS.white} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarRing}
              onPress={onProfilePress}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
            >
              {user?.img_perfil ? (
                <Image source={{ uri: user.img_perfil }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
              {showCompletion && (
                <View style={styles.completionBadge}>
                  <Text style={styles.completionText}>{completion}%</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headline}>¿A dónde vamos hoy?</Text>
      </View>

      <PressableScale
        style={styles.searchBar}
        onPress={onSearchPress}
        scaleTo={0.98}
        accessibilityLabel="Buscar viaje"
      >
        <View style={styles.searchIcon}>
          <Search size={20} color={COLORS.primary} strokeWidth={2.5} />
        </View>
        <View style={styles.searchTextCol}>
          <Text style={styles.searchTitle}>Buscar un viaje</Text>
          <Text style={styles.searchSubtitle} numberOfLines={1}>
            Origen, destino o evento
          </Text>
        </View>
        <View style={styles.searchFilter}>
          <SlidersHorizontal
            size={18}
            color={COLORS.gray700}
            strokeWidth={2.2}
          />
        </View>
      </PressableScale>
    </View>
  );
};

const AVATAR = 46;

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl + SPACING.sm,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    backgroundColor: COLORS.primaryDark,
  },
  blob: {
    position: "absolute",
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  blobLarge: {
    width: 220,
    height: 220,
    top: -80,
    right: -60,
  },
  blobSmall: {
    width: 120,
    height: 120,
    bottom: -40,
    left: -30,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  greeting: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  name: {
    fontSize: FONTS.xxl,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.white,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: AVATAR + 4,
    height: AVATAR + 4,
    borderRadius: (AVATAR + 4) / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: AVATAR - 2,
    height: AVATAR - 2,
    borderRadius: (AVATAR - 2) / 2,
  },
  avatarFallback: {
    width: AVATAR - 2,
    height: AVATAR - 2,
    borderRadius: (AVATAR - 2) / 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.white,
  },
  completionBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
  },
  completionText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  headline: {
    marginTop: SPACING.lg,
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -32,
    marginHorizontal: SPACING.lg,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: 64,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  searchIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchTextCol: {
    flex: 1,
  },
  searchTitle: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  searchSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    marginTop: 1,
  },
  searchFilter: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HomeHeader;
