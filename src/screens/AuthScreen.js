// YouConnext - AuthScreen (pantalla de bienvenida)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ArrowRight } from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, GoogleIcon } from "../components";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

const AuthScreen = ({ navigation }) => {
  const { loginGoogleNative } = useUser();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(true);

  useEffect(() => {
    GoogleSignin.hasPlayServices()
      .then((hasServices) => setGoogleAvailable(!!hasServices))
      .catch(() => setGoogleAvailable(false));
  }, []);

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      try {
        await GoogleSignin.signOut();
      } catch (e) {}

      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        Alert.alert("Error", "No se pudo obtener el token de Google.");
        setGoogleLoading(false);
        return;
      }

      await loginGoogleNative(idToken, "login");
    } catch (error) {
      // 12501 = el usuario canceló el diálogo de Google, no es un error real
      if (error.code !== "12501") {
        Alert.alert(
          "No se pudo continuar",
          error.message || "No se pudo completar la autenticación con Google.",
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section con logo */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>YouConnext</Text>
          <Text style={styles.tagline}>
            Comparte coche con tu comunidad. Ahorra en cada viaje y reduce tu
            huella de carbono.
          </Text>
        </View>

        {/* Feature pills */}
        <View style={styles.featuresRow}>
          <View style={styles.featurePill}>
            <View
              style={[styles.featureDot, { backgroundColor: COLORS.primary }]}
            />
            <Text style={styles.featureText}>Sostenible</Text>
          </View>
          <View style={styles.featurePill}>
            <View
              style={[styles.featureDot, { backgroundColor: COLORS.secondary }]}
            />
            <Text style={styles.featureText}>Comunidad</Text>
          </View>
          <View style={styles.featurePill}>
            <View
              style={[styles.featureDot, { backgroundColor: COLORS.accent }]}
            />
            <Text style={styles.featureText}>Ahorro</Text>
          </View>
        </View>

        {/* Botones principales */}
        <View style={styles.actionsContainer}>
          <Button
            title="Iniciar sesión"
            onPress={() => navigation.navigate("Login")}
            variant="primary"
            size="large"
            style={styles.mainButton}
          />

          <Button
            title="Crear cuenta nueva"
            onPress={() => navigation.navigate("Register")}
            variant="outline"
            size="large"
            style={styles.mainButton}
          />

          {/* Separador */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Boton Google */}
          {googleAvailable && (
            <TouchableOpacity
              style={[
                styles.googleButton,
                googleLoading && styles.googleButtonLoading,
              ]}
              onPress={handleGoogleAuth}
              disabled={googleLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continuar con Google"
              accessibilityState={{ disabled: googleLoading }}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={COLORS.gray700} />
              ) : (
                <>
                  <GoogleIcon size={22} />
                  <Text style={styles.googleButtonText}>
                    Continuar con Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
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
    paddingBottom: SPACING.lg,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logoWrapper: {
    marginBottom: SPACING.lg,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: FONTS.xxxl,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: COLORS.gray900,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONTS.md,
    lineHeight: 23,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: SPACING.md,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.small,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  actionsContainer: {
    marginBottom: SPACING.xl,
  },
  mainButton: {
    marginBottom: SPACING.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  dividerText: {
    fontSize: FONTS.sm,
    color: COLORS.gray400,
    marginHorizontal: SPACING.md,
    fontWeight: "500",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  googleButtonLoading: {
    opacity: 0.7,
  },
  googleButtonText: {
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "600",
    color: COLORS.gray700,
    marginLeft: SPACING.sm,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  footerText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    fontSize: FONTS.xs,
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
});

export default AuthScreen;
