// YouConnext - HomeHeader (Cabecera oficial v2: Negra #0B0F0E con wordmark y buscador)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { MessageCircle, Search, SlidersHorizontal } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";

const HomeHeader = ({
  user,
  greeting = "Hola",
  topInset = 0,
  onChatPress,
  onProfilePress,
  onSearchPress,
}) => {
  const displayName = user?.nombre || user?.name || "Sergio";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.headerContainer}>
      {/* Cabecera Negra Estructuradora (#0B0F0E) según Guía Pág. 6 y 7 */}
      <View style={[styles.darkHeader, { paddingTop: topInset + SPACING.sm }]}>
        <View style={styles.ambientGlow} />

        {/* Fila Superior: Marca YouConnext + Acciones de usuario */}
        <View style={styles.brandRow}>
          <View style={styles.brandGroup}>
            <View style={styles.miniLogoBadge}>
              <Image
                source={require("../../../assets/logo-sin-bg-198px-ajustado.png")}
                style={styles.miniLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandWordmark}>YouConnext</Text>
          </View>

          <View style={styles.actionsGroup}>
            {/* Botón de Chats / Avisos con punto indicador */}
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={onChatPress}
              activeOpacity={0.8}
              accessibilityLabel="Ver chats y avisos"
            >
              <MessageCircle size={19} color="#F2F5F4" strokeWidth={2.2} />
              <View style={styles.chatBadgeDot} />
            </TouchableOpacity>

            {/* Avatar de Usuario */}
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={onProfilePress}
              activeOpacity={0.85}
              accessibilityLabel="Ver perfil"
            >
              {user?.img_perfil ? (
                <Image source={{ uri: user.img_perfil }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarInitialBox}>
                  <Text style={styles.avatarInitialText}>{initial}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Saludo Personal y Pregunta de Enfoque (Pág. 7: "Saluda por el nombre y pregunta lo único importante") */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Hola, {displayName}</Text>
          <Text style={styles.greetingSubtitle}>
            ¿A qué evento vas esta semana?
          </Text>
        </View>

        {/* Buscador Interactivo ("Busca un evento o un pueblo") */}
        <PressableScale
          style={styles.searchBar}
          onPress={onSearchPress}
          scaleTo={0.98}
          accessibilityLabel="Buscar un evento o pueblo"
        >
          <Search size={19} color={BRAND.greenOnLight} strokeWidth={2.4} />
          <View style={styles.searchTextCol}>
            <Text style={styles.searchPlaceholder}>
              Busca un evento o un pueblo
            </Text>
          </View>
          <View style={styles.searchFilterIcon}>
            <SlidersHorizontal size={16} color={COLORS.gray600} strokeWidth={2.2} />
          </View>
        </PressableScale>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: BRAND.black,
  },
  darkHeader: {
    backgroundColor: BRAND.black,
    paddingHorizontal: SPACING.screenMargin, // 20px
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.card + 8,
    borderBottomRightRadius: RADIUS.card + 8,
    position: "relative",
    overflow: "hidden",
  },
  ambientGlow: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 200,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 200, 83, 0.08)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniLogoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#141A18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F3A36",
  },
  miniLogo: {
    width: 20,
    height: 20,
  },
  brandWordmark: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 18,
    fontWeight: "800",
    color: "#F2F5F4",
    letterSpacing: -0.3,
  },
  actionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1D2522",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F3A36",
    position: "relative",
  },
  chatBadgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.green,
    borderWidth: 1.5,
    borderColor: "#1D2522",
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: BRAND.green,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitialBox: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1D2522",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 14,
    fontWeight: "700",
    color: "#F2F5F4",
  },
  greetingSection: {
    marginBottom: SPACING.md,
  },
  greetingTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 24, // Sora 800 · 24/30 (Pág. 3 y 7)
    lineHeight: 30,
    fontWeight: "800",
    color: "#F2F5F4",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 15,
    lineHeight: 21,
    color: "#A7B2AE", // text-muted-dark (Pág. 2)
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.control, // 12px
    height: 48, // 48px
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2EAE5",
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchTextCol: {
    flex: 1,
  },
  searchPlaceholder: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 14,
    color: COLORS.gray600,
  },
  searchFilterIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F4FAF6",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HomeHeader;
