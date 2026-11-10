// YouConnext - LoginScreen (Guía de Estilo v2)
// Minimalista, vivo y formal: foco verde interactivo, microtextos humanos "de tú"
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Mail,
  Lock,
  ChevronLeft,
  AlertCircle,
  LogIn,
  Building2,
  ArrowRight,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../constants";
import {
  Button,
  Input,
  PressableScale,
  AuthTypeSwitcher,
  GoogleSignInButton,
  AuthDivider,
} from "../components";
import { useGoogleAuth } from "../hooks";

const LoginScreen = ({ navigation, route }) => {
  const { iniciarSesion } = useUser();
  const {
    signInWithGoogle,
    loading: googleLoading,
    isAvailable: googleAvailable,
  } = useGoogleAuth({
    preferredMode: "personal",
    method: "login",
  });
  const initialEmail = route?.params?.initialEmail || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const passwordRef = useRef(null);

  useEffect(() => {
    if (route?.params?.initialEmail) {
      setEmail(route.params.initialEmail);
    }
  }, [route?.params?.initialEmail]);

  const getFieldError = (field, value) => {
    if (field === "email") {
      if (!value.trim()) return "Falta tu email: introduce tu correo para entrar.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return "El formato del correo no parece correcto (ejemplo@correo.com).";
    }
    if (field === "password") {
      if (!value.trim()) return "Falta la contraseña: sin ella no puedes acceder.";
    }
    return undefined;
  };

  const handleBlur = (field, value) => {
    const error = getFieldError(field, value);
    if (error) setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validate = () => {
    const newErrors = {
      email: getFieldError("email", email),
      password: getFieldError("password", password),
    };
    const cleaned = Object.fromEntries(
      Object.entries(newErrors).filter(([, v]) => Boolean(v))
    );
    setErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (error) {
      setFormError(
        error.message ||
          "Ups, algo ha fallado. Revisa tu email y contraseña e inténtalo otra vez."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setFormError(null);
    const res = await signInWithGoogle();
    if (res?.error) {
      setFormError(res.error);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Recuperar contraseña",
      "Te enviaremos las instrucciones de restablecimiento a tu correo electrónico.",
      [{ text: "Entendido" }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {/* Barra superior con botón volver */}
        <View style={styles.headerBar}>
          <PressableScale
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver atrás"
          >
            <ChevronLeft size={22} color={BRAND.black} strokeWidth={2.4} />
          </PressableScale>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Titular en Sora 800 y subtítulo en Inter 400 */}
          <View style={styles.header}>
            <Text style={styles.title}>Inicia sesión</Text>
            <Text style={styles.subtitle}>
              Te damos la bienvenida de nuevo a YouConnext. Accede para reservar tu plaza o compartir tu coche.
            </Text>
          </View>

          {/* Selector Inmediato de Rol: Particular vs Organización */}
          <AuthTypeSwitcher
            activeType="user"
            onChangeType={(type) => {
              if (type === "enterprise") {
                navigation.replace("EnterpriseLogin", { initialEmail: email });
              }
            }}
          />

          {/* Tarjeta de Formulario con radio 16 y sombra suave */}
          <View style={styles.formCard}>
            {/* Banner de error de formulario si existe (pág. 6) */}
            {formError && (
              <View style={styles.formErrorBanner}>
                <AlertCircle size={18} color={COLORS.error} strokeWidth={2} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Campo Email */}
            <Input
              label="Correo electrónico"
              icon={Mail}
              placeholder="tu@universidad.es o email personal"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                if (formError) setFormError(null);
              }}
              onBlur={() => handleBlur("email", email)}
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* Campo Contraseña con enlace de olvido */}
            <View style={styles.passwordRowHeader}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
                hitSlop={6}
              >
                <Text style={styles.forgotPasswordText}>¿La has olvidado?</Text>
              </TouchableOpacity>
            </View>

            <Input
              inputRef={passwordRef}
              icon={Lock}
              placeholder="Tu contraseña secreta"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
                if (formError) setFormError(null);
              }}
              onBlur={() => handleBlur("password", password)}
              error={errors.password}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            {/* Botón Principal (Verde, 48px, Sora 700) */}
            <Button
              title="Iniciar sesión"
              onPress={handleSubmit}
              variant="primary"
              loading={loading}
              icon={<LogIn size={18} color={COLORS.white} strokeWidth={2.4} />}
              style={styles.submitButton}
            />

            {/* Separador elegante */}
            <AuthDivider text="o entra con" />

            {/* Botón de Google */}
            {googleAvailable && (
              <GoogleSignInButton
                onPress={handleGoogleAuth}
                loading={googleLoading}
                disabled={googleLoading || loading}
                text="Continuar con Google"
                accessibilityLabel="Continuar con Google"
              />
            )}
          </View>

          {/* Enlace alternativo a registro */}
          <View style={styles.toggleFooter}>
            <Text style={styles.toggleText}>¿Todavía no tienes cuenta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
              hitSlop={4}
            >
              <Text style={styles.toggleLink}>Crear cuenta gratis</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // #EEF5F0
  },
  flex: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: SPACING.screenMargin,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenMargin, // 20px
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.black,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.gray600,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card, // 16px
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  formErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.errorSoft, // #F9E7E4
    borderWidth: 1,
    borderColor: "#F5C2BC",
    borderRadius: RADIUS.control,
    padding: 12,
    marginBottom: 16,
  },
  formErrorText: {
    flex: 1,
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    color: COLORS.error,
    fontWeight: "500",
    lineHeight: 18,
  },
  passwordRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inputLabel: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.black,
  },
  forgotPasswordText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.gray600,
    paddingHorizontal: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: RADIUS.control, // 12px
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    ...SHADOWS.small,
  },
  googleButtonText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 14,
    fontWeight: "600",
    color: BRAND.black,
  },
  toggleFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.xl,
  },
  toggleText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    color: COLORS.gray600,
  },
  toggleLink: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  bridgeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginTop: SPACING.lg,
    ...SHADOWS.small,
  },
  bridgeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft || "#E3F4EA",
    alignItems: "center",
    justifyContent: "center",
  },
  bridgeTextBox: {
    flex: 1,
  },
  bridgeTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.black,
    marginBottom: 2,
  },
  bridgeSubtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.gray600,
  },
});

export default LoginScreen;
