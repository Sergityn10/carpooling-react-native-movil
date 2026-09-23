// YouConnext - LoginScreen
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
      if (!value.trim()) return "El email es requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return "Email no válido";
    }
    if (field === "password") {
      if (!value.trim()) return "La contraseña es requerida";
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
          "No se pudo iniciar sesión. Revisa tu email y contraseña.",
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
      console.log(
        "[LoginScreen] Google Sign-In error:",
        JSON.stringify({
          code: error.code,
          message: error.message,
          description: error.description,
        }),
      );
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* Header con botón back */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <ChevronLeft size={24} color={COLORS.gray700} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo y titulo */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          {/* Error global del formulario */}
          {formError && (
            <View style={styles.formErrorBanner} accessibilityRole="alert">
              <AlertCircle size={18} color={COLORS.error} strokeWidth={2.2} />
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          )}

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "email" && styles.inputWrapperFocused,
                  errors.email && styles.inputWrapperError,
                ]}
              >
                <Mail
                  size={20}
                  color={
                    errors.email
                      ? COLORS.error
                      : focusedField === "email"
                        ? COLORS.primary
                        : COLORS.gray400
                  }
                  strokeWidth={2}
                />
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={COLORS.gray400}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email)
                      setErrors({ ...errors, email: undefined });
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
                  submitBehavior="submit"
                  accessibilityLabel="Email"
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "password" && styles.inputWrapperFocused,
                  errors.password && styles.inputWrapperError,
                ]}
              >
                <Lock
                  size={20}
                  color={
                    errors.password
                      ? COLORS.error
                      : focusedField === "password"
                        ? COLORS.primary
                        : COLORS.gray400
                  }
                  strokeWidth={2}
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Tu contraseña"
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
                  accessibilityLabel="Contraseña"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.gray500} strokeWidth={2} />
                  ) : (
                    <Eye size={20} color={COLORS.gray500} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <Button
              title="Iniciar sesión"
              onPress={handleSubmit}
              variant="primary"
              size="large"
              loading={loading}
              style={styles.submitButton}
            />
          </View>

          {/* Separador */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botón Google */}
          {googleAvailable && (
            <TouchableOpacity
              style={[
                styles.googleButton,
                (googleLoading || loading) && styles.googleButtonLoading,
              ]}
              onPress={handleGoogleAuth}
              disabled={googleLoading || loading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continuar con Google"
              accessibilityState={{ disabled: googleLoading || loading }}
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

          {/* Link a registro */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>¿No tienes cuenta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleLink}>Regístrate</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.xxl,
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.md,
    lineHeight: 23,
    color: COLORS.gray500,
    textAlign: "center",
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
    fontSize: FONTS.sm,
    lineHeight: 20,
    color: COLORS.error,
    fontWeight: "500",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
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
  },
  errorText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.error,
    fontWeight: "500",
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  submitButton: {
    marginTop: SPACING.lg,
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
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  toggleText: {
    fontSize: FONTS.md,
    lineHeight: 22,
    color: COLORS.gray500,
  },
  toggleLink: {
    fontSize: FONTS.md,
    lineHeight: 22,
    color: COLORS.primary,
    fontWeight: "700",
    marginLeft: SPACING.xs,
  },
});

export default LoginScreen;
