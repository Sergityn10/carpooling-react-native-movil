// YouConnext - RegisterScreen (Guía de Estilo v2)
// Registro vivo, ágil y profesional: medidor dinámico de contraseña, checkboxes de marca
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
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Mail,
  Lock,
  ChevronLeft,
  Check,
  ShieldCheck,
  UserPlus,
  AlertCircle,
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

const RegisterScreen = ({ navigation, route }) => {
  const { crearUsuario } = useUser();
  const {
    signInWithGoogle,
    loading: googleLoading,
    isAvailable: googleAvailable,
  } = useGoogleAuth({
    preferredMode: "personal",
    method: "register",
  });
  const initialEmail = route?.params?.initialEmail || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const passwordRef = useRef(null);

  useEffect(() => {
    if (route?.params?.initialEmail) {
      setEmail(route.params.initialEmail);
    }
  }, [route?.params?.initialEmail]);

  // Comprobación de requisitos de contraseña
  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-[\];'/\\~`+=]/.test(password),
  };

  const strengthScore = [
    passwordChecks.length,
    passwordChecks.hasUpper && passwordChecks.hasLower,
    passwordChecks.hasNumber,
    passwordChecks.hasSpecial,
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!password) return { label: "", color: COLORS.gray300 };
    if (strengthScore <= 1) return { label: "Débil", color: COLORS.error };
    if (strengthScore === 2) return { label: "Aceptable", color: BRAND.accent };
    if (strengthScore === 3) return { label: "Buena", color: "#10B981" };
    return { label: "Muy segura", color: BRAND.green };
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Introduce tu email para crear tu cuenta.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "El formato de email no parece correcto.";
    }

    if (!password.trim()) {
      newErrors.password = "Introduce una contraseña segura.";
    } else if (password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    } else if (!passwordChecks.hasUpper || !passwordChecks.hasLower) {
      newErrors.password = "Añade al menos una mayúscula y una minúscula.";
    } else if (!passwordChecks.hasNumber) {
      newErrors.password = "Incluye al menos un número (0-9).";
    } else if (!passwordChecks.hasSpecial) {
      newErrors.password = "Incluye al menos un símbolo especial (!, @, #...).";
    }

    if (!acceptTerms) {
      newErrors.terms = "Debes aceptar las condiciones de uso.";
    }
    if (!acceptPrivacy) {
      newErrors.privacy = "Debes aceptar la política de privacidad.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await crearUsuario(email.trim(), password, {
        acceptTerms,
        acceptPrivacy,
        acceptMarketing: false,
      });
      Alert.alert(
        "¡Bienvenido a YouConnext!",
        "Tu cuenta ha sido creada con éxito."
      );
    } catch (error) {
      setFormError(
        error.message ||
          "No hemos podido registrar tu cuenta. Puede que el correo ya esté en uso."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert(
        "Acepta las condiciones",
        "Por favor, marca las casillas de condiciones y privacidad para continuar con Google."
      );
      return;
    }

    setFormError(null);
    const res = await signInWithGoogle({
      consents: {
        acceptTerms: true,
        acceptPrivacy: true,
        acceptMarketing: false,
      },
    });

    if (res?.success) {
      Alert.alert(
        "¡Bienvenido a YouConnext!",
        "Tu cuenta ha sido creada con éxito."
      );
    } else if (res?.error) {
      setFormError(res.error);
    }
  };

  const strength = getStrengthLabel();

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
          {/* Cabecera */}
          <View style={styles.header}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a YouConnext para compartir viajes diarios, universitarios y eventos.
            </Text>
          </View>

          {/* Selector Inmediato de Rol: Particular vs Organización */}
          <AuthTypeSwitcher
            activeType="user"
            onChangeType={(type) => {
              if (type === "enterprise") {
                navigation.replace("EnterpriseRegister", { initialEmail: email });
              }
            }}
          />

          {/* Tarjeta de Formulario con radio 16 */}
          <View style={styles.formCard}>
            {formError && (
              <View style={styles.formErrorBanner}>
                <AlertCircle size={18} color={COLORS.error} strokeWidth={2} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Email */}
            <Input
              label="Correo electrónico"
              icon={Mail}
              placeholder="tu@correo.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                if (formError) setFormError(null);
              }}
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* Contraseña */}
            <Input
              inputRef={passwordRef}
              label="Contraseña"
              icon={Lock}
              placeholder="Crea una clave segura"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
                if (formError) setFormError(null);
              }}
              error={errors.password}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* Medidor dinámico de fortaleza de contraseña */}
            {password.length > 0 && (
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthTitle}>Seguridad de la clave</Text>
                  <Text style={[styles.strengthValue, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>

                {/* 4 segmentos vivos */}
                <View style={styles.meterRow}>
                  {[1, 2, 3, 4].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.meterSegment,
                        {
                          backgroundColor:
                            step <= strengthScore ? strength.color : "#E2EAE5",
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Lista de requisitos compacta y viva */}
                <View style={styles.rulesRow}>
                  <View style={styles.ruleItem}>
                    <Check
                      size={12}
                      color={passwordChecks.length ? BRAND.green : COLORS.gray400}
                      strokeWidth={2.5}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        passwordChecks.length && styles.ruleTextActive,
                      ]}
                    >
                      8+ letras
                    </Text>
                  </View>

                  <View style={styles.ruleItem}>
                    <Check
                      size={12}
                      color={
                        passwordChecks.hasUpper && passwordChecks.hasLower
                          ? BRAND.green
                          : COLORS.gray400
                      }
                      strokeWidth={2.5}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        passwordChecks.hasUpper &&
                          passwordChecks.hasLower &&
                          styles.ruleTextActive,
                      ]}
                    >
                      Mayús. y minús.
                    </Text>
                  </View>

                  <View style={styles.ruleItem}>
                    <Check
                      size={12}
                      color={passwordChecks.hasNumber ? BRAND.green : COLORS.gray400}
                      strokeWidth={2.5}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        passwordChecks.hasNumber && styles.ruleTextActive,
                      ]}
                    >
                      Número
                    </Text>
                  </View>

                  <View style={styles.ruleItem}>
                    <Check
                      size={12}
                      color={passwordChecks.hasSpecial ? BRAND.green : COLORS.gray400}
                      strokeWidth={2.5}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        passwordChecks.hasSpecial && styles.ruleTextActive,
                      ]}
                    >
                      Símbolo
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Checkboxes de Términos y Privacidad de Marca */}
            <View style={styles.legalSection}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setAcceptTerms(!acceptTerms);
                  if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    acceptTerms && styles.checkboxBoxChecked,
                    Boolean(errors.terms) && styles.checkboxBoxError,
                  ]}
                >
                  {acceptTerms && <Check size={14} color={COLORS.white} strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Acepto las{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      Linking.openURL("https://app.youconnext.es/condiciones")
                    }
                  >
                    condiciones del servicio
                  </Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <Text style={styles.checkboxErrorText}>{errors.terms}</Text>
              )}

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setAcceptPrivacy(!acceptPrivacy);
                  if (errors.privacy)
                    setErrors((prev) => ({ ...prev, privacy: undefined }));
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    acceptPrivacy && styles.checkboxBoxChecked,
                    Boolean(errors.privacy) && styles.checkboxBoxError,
                  ]}
                >
                  {acceptPrivacy && (
                    <Check size={14} color={COLORS.white} strokeWidth={3} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  He leído la{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() =>
                      Linking.openURL("https://app.youconnext.es/privacidad")
                    }
                  >
                    política de privacidad
                  </Text>
                </Text>
              </TouchableOpacity>
              {errors.privacy && (
                <Text style={styles.checkboxErrorText}>{errors.privacy}</Text>
              )}
            </View>

            {/* Botón Principal (Verde, 48px, Sora 700) */}
            <Button
              title="Crear cuenta"
              onPress={handleSubmit}
              variant="primary"
              loading={loading}
              icon={<UserPlus size={18} color={COLORS.white} strokeWidth={2.4} />}
              style={styles.submitButton}
            />

            {/* Separador */}
            <AuthDivider text="o regístrate con" />

            {/* Botón Google */}
            {googleAvailable && (
              <GoogleSignInButton
                onPress={handleGoogleAuth}
                loading={googleLoading}
                disabled={googleLoading || loading}
                text="Registrarme con Google"
                accessibilityLabel="Registrarme con Google"
              />
            )}
          </View>

          {/* Enlace a Iniciar Sesión */}
          <View style={styles.toggleFooter}>
            <Text style={styles.toggleText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
              hitSlop={4}
            >
              <Text style={styles.toggleLink}>Iniciar sesión</Text>
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
    backgroundColor: COLORS.errorSoft,
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
  },
  strengthBox: {
    backgroundColor: "#F6FAF7",
    borderRadius: RADIUS.control,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2EAE5",
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  strengthTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.black,
  },
  strengthValue: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "700",
  },
  meterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  meterSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  rulesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ruleText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.gray400,
  },
  ruleTextActive: {
    color: BRAND.black,
    fontWeight: "600",
  },
  legalSection: {
    marginBottom: 16,
    gap: 10,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.gray400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxBoxError: {
    borderColor: COLORS.error,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    color: BRAND.black,
    lineHeight: 18,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  checkboxErrorText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.error,
    marginLeft: 30,
    marginTop: -4,
  },
  submitButton: {
    marginTop: 6,
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
    borderRadius: RADIUS.control,
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

export default RegisterScreen;
