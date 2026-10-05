// YouConnext - AuthScreen (Welcome / Gateway Screen)
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LogIn,
  UserPlus,
  ArrowRight,
  Leaf,
  Users,
  Zap,
  ShieldCheck,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";

const AuthScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Brand Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Image
              source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>YouConnext</Text>
          <Text style={styles.tagline}>
            Comparte coche con tu comunidad universitaria y profesional. Sostenible,
            económico y seguro.
          </Text>
        </View>

        {/* Feature Pills */}
        <View style={styles.featuresRow}>
          <View style={styles.featurePill}>
            <Leaf size={14} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.featureText}>Sostenible</Text>
          </View>
          <View style={styles.featurePill}>
            <Users size={14} color={COLORS.secondary} strokeWidth={2.5} />
            <Text style={styles.featureText}>Comunidad</Text>
          </View>
          <View style={styles.featurePill}>
            <Zap size={14} color="#F59E0B" strokeWidth={2.5} />
            <Text style={styles.featureText}>Ahorro</Text>
          </View>
        </View>

        {/* Actions Card: Iniciar Sesión vs Registrarse */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsCardTitle}>Bienvenido a la comunidad</Text>
          <Text style={styles.actionsCardSubtitle}>
            Elige una opción para continuar
          </Text>

          {/* 1. Botón Iniciar Sesión */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.88}
          >
            <View style={styles.buttonIconLeft}>
              <LogIn size={20} color={COLORS.white} strokeWidth={2.4} />
            </View>
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
            <ArrowRight size={18} color={COLORS.white} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* 2. Botón Registrarse (Crear cuenta) */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.85}
          >
            <View style={styles.buttonIconLeft}>
              <UserPlus size={20} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <Text style={styles.secondaryButtonText}>Crear cuenta nueva</Text>
            <ArrowRight size={18} color={COLORS.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Trust & Legal Footer */}
        <View style={styles.footer}>
          <View style={styles.trustBadge}>
            <ShieldCheck size={13} color={COLORS.gray400} strokeWidth={2} />
            <Text style={styles.trustText}>Conexión cifrada y segura</Text>
          </View>
          <Text style={styles.footerText}>
            Al continuar aceptas nuestros{" "}
            <Text
              style={styles.footerLink}
              onPress={() =>
                Linking.openURL("https://app.youconnext.es/condiciones")
              }
            >
              términos de servicio
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: FONTS.xxxl + 2,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONTS.sm + 1,
    lineHeight: 22,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: SPACING.md,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.xs + 2,
    marginBottom: SPACING.xl,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.small,
  },
  featureText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  actionsCardTitle: {
    fontSize: FONTS.md + 1,
    fontWeight: "800",
    color: COLORS.gray900,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  actionsCardSubtitle: {
    fontSize: FONTS.xs + 1,
    color: COLORS.gray500,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.medium,
  },
  buttonIconLeft: {
    marginRight: SPACING.sm,
  },
  primaryButtonText: {
    flex: 1,
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primarySoft,
  },
  secondaryButtonText: {
    flex: 1,
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.primaryDark,
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  trustText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: "600",
  },
  footerText: {
    fontSize: FONTS.xs - 1,
    color: COLORS.gray400,
    textAlign: "center",
    lineHeight: 16,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default AuthScreen;
