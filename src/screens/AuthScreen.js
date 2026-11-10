// YouConnext - AuthScreen (Pantalla de bienvenida y selección de portal v2)
// Estructura oficial #0B0F0E, selector segmentado táctil, tipografía Sora/Inter, iconos Lucide
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  Route,
  Ticket,
  BadgeCheck,
  Building2,
  QrCode,
  TrendingUp,
  User,
  Briefcase,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../constants";
import { Button, AuthTypeSwitcher } from "../components";

const AuthScreen = ({ navigation }) => {
  // Estado para conmutar entre Usuario Particular y Organización B2B
  const [portalMode, setPortalMode] = useState("user"); // "user" | "enterprise"

  const isEnterprise = portalMode === "enterprise";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.black} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card estructurada en negro de marca */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.ambientGlow,
              isEnterprise && styles.ambientGlowEnterprise,
            ]}
          />

          <View style={styles.logoBadge}>
            <Image
              source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.wordmark}>YouConnext</Text>
            {isEnterprise && (
              <View style={styles.enterpriseBadge}>
                <Text style={styles.enterpriseBadgeText}>B2B</Text>
              </View>
            )}
          </View>

          {/* Conmutador por debajo del título */}
          <AuthTypeSwitcher
            activeType={portalMode}
            onChangeType={setPortalMode}
            theme="dark"
            showHelperText={false}
            style={styles.heroSwitcher}
          />

          <Text style={styles.tagline}>
            {isEnterprise
              ? "Impulsa la movilidad compartida de tu equipo, reduce la huella de CO₂ y gestiona tus eventos institucionales."
              : "Comparte coche a tus eventos y pueblos. Sencillo, puntual y entre personas de confianza."}
          </Text>

          {/* Tres pilares oficiales con iconos de trazo Lucide */}
          {!isEnterprise ? (
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
          ) : (
            <View style={styles.pillarsRow}>
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBadge}>
                  <Building2 size={16} color={BRAND.green} strokeWidth={2} />
                </View>
                <Text style={styles.pillarText}>Gestión B2B</Text>
              </View>

              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBadge}>
                  <QrCode size={16} color={BRAND.accent} strokeWidth={2} />
                </View>
                <Text style={styles.pillarText}>Eventos & QR</Text>
              </View>

              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBadge}>
                  <TrendingUp size={16} color={BRAND.green} strokeWidth={2} />
                </View>
                <Text style={styles.pillarText}>Métricas CO₂</Text>
              </View>
            </View>
          )}
        </View>

        {/* Bloque de Acciones: Botones de 48px con radio 12 */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>
            {isEnterprise
              ? "Portal de Organizaciones"
              : "Bienvenido a YouConnext"}
          </Text>
          <Text style={styles.actionsSubtitle}>
            {isEnterprise
              ? "Accede al panel corporativo o da de alta a tu empresa o institución."
              : "Accede a tu cuenta o regístrate en menos de dos minutos."}
          </Text>

          {!isEnterprise ? (
            <>
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
                icon={
                  <UserPlus size={18} color={COLORS.primary} strokeWidth={2.4} />
                }
              />
            </>
          ) : (
            <>
              <Button
                title="Acceder como Organización"
                onPress={() => navigation.navigate("EnterpriseLogin")}
                variant="primary"
                icon={
                  <Building2 size={18} color={COLORS.white} strokeWidth={2.4} />
                }
                style={styles.buttonSpacing}
              />

              <Button
                title="Registrar mi Organización"
                onPress={() => navigation.navigate("EnterpriseRegister")}
                variant="outline"
                icon={
                  <Briefcase size={18} color={COLORS.primary} strokeWidth={2.4} />
                }
              />
            </>
          )}
        </View>

        {/* Pie de confianza y términos legales */}
        <View style={styles.footer}>
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color={COLORS.gray400} strokeWidth={2} />
            <Text style={styles.trustText}>
              {isEnterprise
                ? "Entorno corporativo seguro con métricas de impacto"
                : "Comunidad con identidad verificada"}
            </Text>
          </View>

          <Text style={styles.footerText}>
            Al continuar aceptas nuestras{" "}
            <Text
              style={styles.footerLink}
              onPress={() =>
                Linking.openURL("https://app.youconnext.es/condiciones")
              }
            >
              condiciones de uso
            </Text>
            {" y "}
            <Text
              style={styles.footerLink}
              onPress={() =>
                Linking.openURL("https://app.youconnext.es/privacidad")
              }
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
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  heroSwitcher: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: BRAND.black,
    borderRadius: RADIUS.card, // 16px
    paddingVertical: 18,
    paddingHorizontal: SPACING.md,
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
  ambientGlowEnterprise: {
    backgroundColor: "rgba(242, 163, 60, 0.10)", // Glow ámbar corporativo
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#141A18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F3A36",
    marginBottom: 6,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  wordmark: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#F2F5F4",
    letterSpacing: -0.5,
  },
  enterpriseBadge: {
    backgroundColor: BRAND.accent, // #F2A33C
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  enterpriseBadgeText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 11,
    fontWeight: "800",
    color: BRAND.black,
  },
  tagline: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: "#A7B2AE",
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  pillarsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    paddingTop: 2,
  },
  pillarItem: {
    alignItems: "center",
    flex: 1,
  },
  pillarIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1D2522",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F3A36",
    marginBottom: 4,
  },
  pillarText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "600",
    color: "#D0D9D5",
    textAlign: "center",
  },
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card, // 16px
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10,
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.black,
    textAlign: "center",
    marginBottom: 2,
  },
  actionsSubtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.gray600,
    textAlign: "center",
    marginBottom: 12,
  },
  buttonSpacing: {
    marginBottom: 10,
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
    textAlign: "center",
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
