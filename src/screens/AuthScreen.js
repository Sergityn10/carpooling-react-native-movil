// YouConnext - AuthScreen (Pantalla de bienvenida oficial v2)
// Estructura negra #0B0F0E, acento verde táctil, tipografía Sora/Inter, iconos Lucide
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  Route,
  Ticket,
  BadgeCheck,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND } from "../constants";
import { Button } from "../components";

const AuthScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.black} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera estructurada en negro de marca */}
        <View style={styles.heroCard}>
          <View style={styles.ambientGlow} />

          <View style={styles.logoBadge}>
            <Image
              source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.wordmark}>YouConnext</Text>
          <Text style={styles.tagline}>
            Comparte coche a tus eventos y pueblos. Sencillo, puntual y entre personas de confianza.
          </Text>

          {/* Tres pilares oficiales con iconos de trazo Lucide (sin emojis) */}
          <View style={styles.pillarsRow}>
            <View style={styles.pillarItem}>
              <View style={styles.pillarIconBadge}>
                <Route size={16} color={BRAND.green} strokeWidth={2} />
              </View>
              <Text style={styles.pillarText}>Ruta directa</Text>
            </View>

            <View style={styles.pillarItem}>
              <View style={styles.pillarIconBadge}>
                <Ticket size={16} color={BRAND.accent} strokeWidth={2} />
              </View>
              <Text style={styles.pillarText}>Tus eventos</Text>
            </View>

            <View style={styles.pillarItem}>
              <View style={styles.pillarIconBadge}>
                <BadgeCheck size={16} color={BRAND.green} strokeWidth={2} />
              </View>
              <Text style={styles.pillarText}>Verificados</Text>
            </View>
          </View>
        </View>

        {/* Bloque de Acciones: Botones de 48px con radio 12 */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Bienvenido a YouConnext</Text>
          <Text style={styles.actionsSubtitle}>
            Accede a tu cuenta o regístrate en menos de dos minutos.
          </Text>

          <Button
            title="Iniciar sesión"
            onPress={() => navigation.navigate("Login")}
            variant="primary"
            icon={<LogIn size={18} color={COLORS.white} strokeWidth={2.4} />}
            style={styles.buttonSpacing}
          />

          <Button
            title="Crear cuenta nueva"
            onPress={() => navigation.navigate("Register")}
            variant="outline"
            icon={<UserPlus size={18} color={COLORS.primary} strokeWidth={2.4} />}
          />
        </View>

        {/* Pie de confianza y términos legales */}
        <View style={styles.footer}>
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color={COLORS.gray400} strokeWidth={2} />
            <Text style={styles.trustText}>Comunidad con identidad verificada</Text>
          </View>

          <Text style={styles.footerText}>
            Al continuar aceptas nuestras{" "}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL("https://app.youconnext.es/condiciones")}
            >
              condiciones de uso
            </Text>
            {" y "}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL("https://app.youconnext.es/privacidad")}
            >
              política de privacidad
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // #EEF5F0
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenMargin, // 20px
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heroCard: {
    backgroundColor: BRAND.black,
    borderRadius: RADIUS.card, // 16px
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#1E2724",
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  ambientGlow: {
    position: "absolute",
    top: -50,
    width: 220,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 200, 83, 0.12)",
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#141A18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F3A36",
    marginBottom: SPACING.sm,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  wordmark: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: "#F2F5F4",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 14,
    lineHeight: 20,
    color: "#A7B2AE",
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: SPACING.lg,
  },
  pillarsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    paddingTop: 4,
  },
  pillarItem: {
    alignItems: "center",
    flex: 1,
  },
  pillarIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1D2522",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F3A36",
    marginBottom: 6,
  },
  pillarText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    color: "#D0D9D5",
    textAlign: "center",
  },
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card, // 16px
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.lg,
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: BRAND.black,
    textAlign: "center",
    marginBottom: 4,
  },
  actionsSubtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.gray600,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  trustText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: "500",
  },
  footerText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.gray400,
    textAlign: "center",
    lineHeight: 16,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default AuthScreen;
