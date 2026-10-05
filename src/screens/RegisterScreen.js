// YouConnext - RegisterScreen (Pro UI/UX Redesign)
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
  Linking,
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
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, GoogleIcon } from "../components";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

const RegisterScreen = ({ navigation }) => {
  const { crearUsuario, loginGoogleNative } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  const passwordRef = useRef(null);

  useEffect(() => {
    GoogleSignin.hasPlayServices()
      .then((hasServices) => {
        if (!hasServices) {
          console.warn("Google Play Services no disponibles");
        }
      })
      .catch((err) => console.warn("Error checking Play Services:", err));
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Introduce tu correo electrónico";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "El formato del email no es válido";
    }
    if (!password.trim()) {
      newErrors.password = "Introduce una contraseña segura";
    } else if (password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Debe incluir al menos una mayúscula (A-Z)";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Debe incluir al menos una minúscula (a-z)";
    } else if (!/\d/.test(password)) {
      newErrors.password = "Debe incluir al menos un número (0-9)";
    } else if (!/[!@#$%^&*(),.?":{}|<>_\-\[\];'/\\]/.test(password)) {
      newErrors.password = "Debe incluir al menos un carácter especial (!@#$...)";
    }
    if (!acceptTerms) {
      newErrors.terms = "Debes aceptar los términos de servicio";
    }
    if (!acceptPrivacy) {
      newErrors.privacy = "Debes aceptar la política de privacidad";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await crearUsuario(email.trim(), password, {
        acceptTerms,
        acceptPrivacy,
        acceptMarketing,
      });
      Alert.alert(
        "¡Cuenta creada con éxito!",
        "Bienvenido a YouConnext. Ahora puedes completar tu perfil.",
      );
    } catch (error) {
      Alert.alert(
        "No se pudo crear la cuenta",
        error.message || "Ha ocurrido un error al procesar el registro.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert(
        "Consentimiento requerido",
        "Por favor, marca las casillas de términos de servicio y privacidad antes de continuar.",
      );
      return;
    }

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

      await loginGoogleNative(idToken, "register", {
        acceptTerms,
        acceptPrivacy,
        acceptMarketing,
      });
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

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-\[\];'/\\]/.test(password);

  const validCount = [
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;

  const passwordStrengthColor =
    validCount <= 2
      ? COLORS.error
      : validCount <= 4
        ? COLORS.warning
        : COLORS.success;

  const passwordStrengthText =
    validCount === 0
      ? ""
      : validCount <= 2
        ? "Débil"
        : validCount <= 4
          ? "Media"
          : "Fuerte";

  const passwordChecks = [
    { label: "Mínimo 8 caracteres", valid: hasMinLength },
    { label: "Una mayúscula (A-Z) y minúscula (a-z)", valid: hasUpperCase && hasLowerCase },
    { label: "Un número (0-9)", valid: hasNumber },
    { label: "Un carácter especial (!@#$...)", valid: hasSpecialChar },
  ];

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
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a YouConnext y empieza a compartir trayectos sostenibles.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email */}
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
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
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

            {/* Password */}
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
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={COLORS.gray400}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="password"
                  returnKeyType="done"
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

            {/* Password Strength Indicator & Checklist */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeaderRow}>
                  <Text style={styles.strengthLabel}>Seguridad:</Text>
                  <Text
                    style={[
                      styles.strengthValue,
                      { color: passwordStrengthColor },
                    ]}
                  >
                    {passwordStrengthText}
                  </Text>
                </View>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: `${(validCount / 5) * 100}%`,
                        backgroundColor: passwordStrengthColor,
                      },
                    ]}
                  />
                </View>

                <View style={styles.checklist}>
                  {passwordChecks.map((check, index) => (
                    <View key={index} style={styles.checkItem}>
                      <View
                        style={[
                          styles.checkIconBox,
                          check.valid
                            ? styles.checkIconBoxValid
                            : styles.checkIconBoxInvalid,
                        ]}
                      >
                        {check.valid ? (
                          <Check size={11} color={COLORS.white} strokeWidth={3} />
                        ) : (
                          <View style={styles.checkDot} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.checkText,
                          check.valid && styles.checkTextValid,
                        ]}
                      >
                        {check.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Consents */}
            <View style={styles.consentContainer}>
              <TouchableOpacity
                style={styles.consentItem}
                onPress={() => {
                  setAcceptTerms(!acceptTerms);
                  if (errors.terms) setErrors({ ...errors, terms: undefined });
                }}
                activeOpacity={0.7}
              >
                {acceptTerms ? (
                  <CheckSquare
                    size={20}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                  />
                ) : (
                  <Square size={20} color={COLORS.gray400} strokeWidth={2} />
                )}
                <Text style={styles.consentText}>
                  Acepto los{" "}
                  <Text
                    style={styles.consentLink}
                    onPress={() =>
                      Linking.openURL("https://app.youconnext.es/condiciones")
                    }
                  >
                    términos de servicio
                  </Text>
                  {" *"}
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <View style={styles.fieldErrorRow}>
                  <AlertCircle size={13} color={COLORS.error} strokeWidth={2} />
                  <Text style={styles.errorText}>{errors.terms}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.consentItem}
                onPress={() => {
                  setAcceptPrivacy(!acceptPrivacy);
                  if (errors.privacy)
                    setErrors({ ...errors, privacy: undefined });
                }}
                activeOpacity={0.7}
              >
                {acceptPrivacy ? (
                  <CheckSquare
                    size={20}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                  />
                ) : (
                  <Square size={20} color={COLORS.gray400} strokeWidth={2} />
                )}
                <Text style={styles.consentText}>
                  Acepto la{" "}
                  <Text
                    style={styles.consentLink}
                    onPress={() =>
                      Linking.openURL("https://app.youconnext.es/privacidad")
                    }
                  >
                    política de privacidad
                  </Text>
                  {" *"}
                </Text>
              </TouchableOpacity>
              {errors.privacy && (
                <View style={styles.fieldErrorRow}>
                  <AlertCircle size={13} color={COLORS.error} strokeWidth={2} />
                  <Text style={styles.errorText}>{errors.privacy}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.consentItem}
                onPress={() => setAcceptMarketing(!acceptMarketing)}
                activeOpacity={0.7}
              >
                {acceptMarketing ? (
                  <CheckSquare
                    size={20}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                  />
                ) : (
                  <Square size={20} color={COLORS.gray400} strokeWidth={2} />
                )}
                <Text style={styles.consentText}>
                  Deseo recibir novedades y ventajas exclusivas
                </Text>
              </TouchableOpacity>
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
                  <Text style={styles.submitButtonText}>Crear cuenta gratis</Text>
                  <ArrowRight size={18} color={COLORS.white} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o bien regístrate con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-in */}
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
                    Registrarse con Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer toggle to Login */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
              hitSlop={4}
            >
              <Text style={styles.toggleLink}>Inicia sesión</Text>
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
  inputGroup: {
    marginBottom: SPACING.md,
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
  // Password Strength
  strengthContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  strengthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  strengthLabel: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  strengthValue: {
    fontSize: 11,
    fontWeight: "800",
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  checklist: {
    gap: 4,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkIconBox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconBoxValid: {
    backgroundColor: COLORS.success,
  },
  checkIconBoxInvalid: {
    backgroundColor: COLORS.gray300,
  },
  checkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },
  checkText: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  checkTextValid: {
    color: COLORS.gray800,
    fontWeight: "600",
  },
  // Consents
  consentContainer: {
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  consentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 4,
    paddingVertical: 2,
  },
  consentText: {
    flex: 1,
    fontSize: FONTS.xs,
    lineHeight: 18,
    color: COLORS.gray600,
    fontWeight: "500",
  },
  consentLink: {
    color: COLORS.primary,
    fontWeight: "700",
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

export default RegisterScreen;