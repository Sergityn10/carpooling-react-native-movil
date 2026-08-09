// YouConnext - RegisterScreen
import React, { useState, useEffect } from "react";
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
  Square,
  CheckSquare,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, GoogleIcon } from "../components";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
console.log("[RegisterScreen] webClientId:", GOOGLE_WEB_CLIENT_ID);

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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

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
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email no válido";
    }
    if (!password.trim()) {
      newErrors.password = "La contraseña es requerida";
    } else if (password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Debe incluir al menos una mayúscula";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Debe incluir al menos una minúscula";
    } else if (!/\d/.test(password)) {
      newErrors.password = "Debe incluir al menos un número";
    } else if (!/[!@#$%^&*(),.?":{}|<>_\-\[\];'/\\]/.test(password)) {
      newErrors.password = "Debe incluir al menos un carácter especial";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert(
        "Consentimiento requerido",
        "Debes aceptar los términos de servicio y la política de privacidad para registrarte.",
      );
      return;
    }

    setLoading(true);
    try {
      await crearUsuario(email.trim(), password, {
        acceptTerms,
        acceptPrivacy,
        acceptMarketing,
      });
      Alert.alert(
        "Cuenta creada",
        "Completa tu perfil en la seccion de informacion.",
      );
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert(
        "Consentimiento requerido",
        "Debes aceptar los términos de servicio y la política de privacidad para registrarte.",
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
      console.log(
        "[RegisterScreen] Google Sign-In error:",
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

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-\[\];'/\\]/.test(password);

  const passwordChecks = [
    { label: "Mínimo 8 caracteres", valid: hasMinLength },
    { label: "Una mayúscula (A-Z)", valid: hasUpperCase },
    { label: "Una minúscula (a-z)", valid: hasLowerCase },
    { label: "Un número (0-9)", valid: hasNumber },
    {
      label: "Un carácter especial (!@#$...)",
      valid: hasSpecialChar,
    },
    {
      label: "Un email válido",
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {/* Header con botón back */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={COLORS.gray700} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo y título */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/logo-sin-bg-198px-ajustado.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a la comunidad YouConnext. Podrás completar tu perfil más
              tarde.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email && styles.inputWrapperError,
                ]}
              >
                <Mail
                  size={20}
                  color={errors.email ? COLORS.error : COLORS.gray400}
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
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
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
                  errors.password && styles.inputWrapperError,
                ]}
              >
                <Lock
                  size={20}
                  color={errors.password ? COLORS.error : COLORS.gray400}
                  strokeWidth={2}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={COLORS.gray400}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.gray400} strokeWidth={2} />
                  ) : (
                    <Eye size={20} color={COLORS.gray400} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Checklist de validacion */}
            <View style={styles.checklist}>
              {passwordChecks.map((check, index) => (
                <View key={index} style={styles.checkItem}>
                  <View
                    style={[
                      styles.checkIcon,
                      check.valid
                        ? styles.checkIconValid
                        : styles.checkIconInvalid,
                    ]}
                  >
                    {check.valid && (
                      <Check size={12} color={COLORS.white} strokeWidth={3} />
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

            {/* Consentimientos legales */}
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
                    size={22}
                    color={COLORS.primary}
                    strokeWidth={2}
                  />
                ) : (
                  <Square size={22} color={COLORS.gray400} strokeWidth={2} />
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
                <Text style={styles.errorText}>{errors.terms}</Text>
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
                    size={22}
                    color={COLORS.primary}
                    strokeWidth={2}
                  />
                ) : (
                  <Square size={22} color={COLORS.gray400} strokeWidth={2} />
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
                <Text style={styles.errorText}>{errors.privacy}</Text>
              )}

              <TouchableOpacity
                style={styles.consentItem}
                onPress={() => setAcceptMarketing(!acceptMarketing)}
                activeOpacity={0.7}
              >
                {acceptMarketing ? (
                  <CheckSquare
                    size={22}
                    color={COLORS.primary}
                    strokeWidth={2}
                  />
                ) : (
                  <Square size={22} color={COLORS.gray400} strokeWidth={2} />
                )}
                <Text style={styles.consentText}>
                  Deseo recibir comunicaciones y noticias sobre la aplicación
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Crear cuenta"
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
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleAuth}
            disabled={googleLoading || loading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={COLORS.gray700} />
            ) : (
              <>
                <GoogleIcon size={24} />
                <Text style={styles.googleButtonText}>
                  Registrarse con Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Link a login */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
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
    paddingVertical: SPACING.lg,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.xxl,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: SPACING.md,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: FONTS.md,
    color: COLORS.gray800,
  },
  errorText: {
    fontSize: FONTS.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  checklist: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconValid: {
    backgroundColor: COLORS.success,
  },
  checkIconInvalid: {
    backgroundColor: COLORS.gray200,
  },
  checkText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  checkTextValid: {
    color: COLORS.gray700,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  consentContainer: {
    marginBottom: SPACING.md,
  },
  consentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  consentText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    lineHeight: 20,
  },
  consentLink: {
    color: COLORS.primary,
    fontWeight: "600",
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
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  toggleText: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
  },
  toggleLink: {
    fontSize: FONTS.md,
    color: COLORS.primary,
    fontWeight: "bold",
    marginLeft: SPACING.xs,
  },
});

export default RegisterScreen;
