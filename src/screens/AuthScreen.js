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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ArrowRight } from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, GoogleIcon } from "../components";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
console.log("[AuthScreen] webClientId:", GOOGLE_WEB_CLIENT_ID);

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

const AuthScreen = ({ navigation }) => {
  const { loginGoogleNative } = useUser();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.hasPlayServices()
      .then((hasServices) => {
        if (!hasServices) {
          console.warn("Google Play Services no disponibles");
        }
      })
      .catch((err) => console.warn("Error checking Play Services:", err));
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
      console.log(
        "[AuthScreen] Google Sign-In error:",
        JSON.stringify({
          code: error.code,
          message: error.message,
          description: error.description,
        }),
      );
      if (error.code !== "12501") {
        Alert.alert(
          "Error",
          error.message || "No se pudo completar la autenticacion con Google.",
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
            Comparte viajes, ahorra energia, conecta personas
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
            title="Iniciar sesion"
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
            <Text style={styles.dividerText}>o continua con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Boton Google */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleAuth}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={COLORS.gray700} />
            ) : (
              <>
                <GoogleIcon size={24} />
                <Text style={styles.googleButtonText}>Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al continuar aceptas nuestros terminos de servicio y politica de
            privacidad.
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
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
    fontSize: FONTS.title,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  googleButtonText: {
    fontSize: FONTS.md,
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
    color: COLORS.gray400,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default AuthScreen;
