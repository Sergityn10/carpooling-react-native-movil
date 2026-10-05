// YouConnext - LoginScreen (Pro UI/UX Redesign)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  Mail,
  Lock,
  ChevronLeft,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, GoogleIcon } from "../components";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

const LoginScreen = ({ navigation }) => {
  const { iniciarSesion, loginGoogleNative } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [formError, setFormError] = useState(null);
  const [googleAvailable, setGoogleAvailable] = useState(true);

  const passwordRef = useRef(null);

  useEffect(() => {
    GoogleSignin.hasPlayServices()
      .then((hasServices) => setGoogleAvailable(!!hasServices))
      .catch(() => setGoogleAvailable(false));
  }, []);

  const getFieldError = (field, value) => {
    if (field === "email") {
      if (!value.trim()) return "Introduce tu correo electrónico";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return "El formato del email no es válido";
    }
    if (field === "password") {
      if (!value.trim()) return "Introduce tu contraseña";
    }
    return undefined;
  };

  const handleBlur = (field, value) => {
    setFocusedField(null);
    const error = getFieldError(field, value);
    if (error) setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validate = () => {
    const newErrors = {
      email: getFieldError("email", email),
      password: getFieldError("password", password),
    };
    const cleaned = Object.fromEntries(
      Object.entries(newErrors).filter(([, v]) => v),
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
          "Credenciales incorrectas. Comprueba tu email y contraseña.",
      );
    } finally {
      setLoading(false);
    }
  };

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
      if (error.code !== "12501") {
        Alert.alert(
          "Error",
          error.message || "No se pudo completar la autenticación con Google.",
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Recuperar contraseña",
      "Si has olvidado tu contraseña, puedes solicitar un enlace de restablecimiento a través de nuestro soporte web.",
      [{ text: "Entendido" }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Headline */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>¡Hola de nuevo!</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para acceder a tus trayectos, eventos y comunidad.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Global form error banner */}
            {formError && (
              <View style={styles.formErrorBanner}>
                <AlertCircle size={18} color={COLORS.error} strokeWidth={2.2} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "email" && styles.inputWrapperFocused,
                  errors.email && styles.inputWrapperError,
                ]}
              >
                <Mail
                  size={19}
                  color={
                    errors.email
                      ? COLORS.error
                      : focusedField === "email"
                        ? COLORS.primary
                        : COLORS.gray400
                  }
                  strokeWidth={2.2}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={COLORS.gray400}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                    if (formError) setFormError(null);
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => handleBlur("email", email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.email && (
                <View style={styles.fieldErrorRow}>
                  <AlertCircle size={13} color={COLORS.error} strokeWidth={2} />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Contraseña</Text>
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                  hitSlop={6}
                >
                  <Text style={styles.forgotPasswordText}>¿La has olvidado?</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "password" && styles.inputWrapperFocused,
                  errors.password && styles.inputWrapperError,
                ]}
              >
                <Lock
                  size={19}
                  color={
                    errors.password
                      ? COLORS.error
                      : focusedField === "password"
                        ? COLORS.primary
                        : COLORS.gray400
                  }
                  strokeWidth={2.2}
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Tu contraseña secreta"
                  placeholderTextColor={COLORS.gray400}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                    if (formError) setFormError(null);
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => handleBlur("password", password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={COLORS.gray500} strokeWidth={2} />
                  ) : (
                    <Eye size={19} color={COLORS.gray500} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.fieldErrorRow}>
                  <AlertCircle size={13} color={COLORS.error} strokeWidth={2} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonLoading,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Iniciar sesión</Text>
                  <ArrowRight size={18} color={COLORS.white} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o bien continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-in */}
            {googleAvailable && (
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  (googleLoading || loading) && styles.googleButtonLoading,
                ]}
                onPress={handleGoogleAuth}
                disabled={googleLoading || loading}
                activeOpacity={0.8}
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

          {/* Footer toggle to Register */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>¿Aún no tienes cuenta?</Text>
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
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  logoImage: {
    width: 54,
    height: 54,
  },
  title: {
    fontSize: FONTS.xxl + 2,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONTS.sm + 1,
    lineHeight: 22,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: SPACING.md,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.medium,
  },
  formErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.errorSoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  formErrorText: {
    flex: 1,
    fontSize: FONTS.xs,
    lineHeight: 18,
    color: COLORS.error,
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray700,
    fontWeight: "700",
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  forgotPasswordText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.primary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: FONTS.md,
    color: COLORS.gray900,
    fontWeight: "600",
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginLeft: 2,
  },
  errorText: {
    fontSize: FONTS.xs,
    color: COLORS.error,
    fontWeight: "600",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    minHeight: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.xs,
    ...SHADOWS.medium,
  },
  submitButtonLoading: {
    opacity: 0.8,
  },
  submitButtonText: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.md + 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  dividerText: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    marginHorizontal: SPACING.md,
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  googleButtonLoading: {
    opacity: 0.7,
  },
  googleButtonText: {
    fontSize: FONTS.sm + 1,
    fontWeight: "700",
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
    gap: 4,
  },
  toggleText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  toggleLink: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    fontWeight: "800",
  },
});

export default LoginScreen;