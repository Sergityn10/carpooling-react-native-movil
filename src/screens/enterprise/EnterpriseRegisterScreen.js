// YouConnext - EnterpriseRegisterScreen (Auto-registro de Organizaciones v2)
// Registro ágil corporativo (email corporativo, contraseña segura, nombre de entidad)
import React, { useState, useRef, useEffect } from "react";
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
  Building2,
  Mail,
  Lock,
  ChevronLeft,
  Check,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  ArrowRight,
  User,
} from "lucide-react-native";
import { useUser } from "../../context/UserContext";
import {
  COLORS,
  SPACING,
  RADIUS,
  FONTS,
  BRAND,
  SHADOWS,
} from "../../constants";
import {
  Button,
  Input,
  PressableScale,
  AuthTypeSwitcher,
  GoogleSignInButton,
  AuthDivider,
} from "../../components";
import { useGoogleAuth } from "../../hooks";

const EnterpriseRegisterScreen = ({ navigation, route }) => {
  const { crearOrganizacion } = useUser();
  const {
    signInWithGoogle,
    loading: googleLoading,
    isAvailable: googleAvailable,
  } = useGoogleAuth({
    target: "enterprise",
    method: "register",
  });
  const initialEmail = route?.params?.initialEmail || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (route?.params?.initialEmail) {
      setEmail(route.params.initialEmail);
    }
  }, [route?.params?.initialEmail]);

  // Validación de contraseña corporativa según directivas de docs/api/enterprise_auth.md:
  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo especial (@$!%*?&_-#)
  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&_\-#]/.test(password),
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
    return { label: "Segura y conforme", color: BRAND.green };
  };

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Introduce el correo corporativo de la organización.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "El formato de correo institucional no es correcto.";
    }

    if (!password.trim()) {
      newErrors.password =
        "Introduce una contraseña para la cuenta corporativa.";
    } else if (password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    } else if (!passwordChecks.hasUpper || !passwordChecks.hasLower) {
      newErrors.password =
        "Incluye al menos una letra mayúscula y una minúscula.";
    } else if (!passwordChecks.hasNumber) {
      newErrors.password = "Incluye al menos un número (0-9).";
    } else if (!passwordChecks.hasSpecial) {
      newErrors.password = "Incluye al menos un símbolo especial (@$!%*?&_-#).";
    }

    if (!acceptTerms) {
      newErrors.terms = "Debes aceptar las condiciones corporativas.";
    }
    if (!acceptPrivacy) {
      newErrors.privacy =
        "Debes aceptar la política de privacidad de YouConnext.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await crearOrganizacion(email.trim(), password, name.trim());
      Alert.alert(
        "¡Organización Registrada!",
        "Tu cuenta corporativa ha sido creada exitosamente. Te damos la bienvenida a YouConnext B2B.",
      );
    } catch (error) {
      setFormError(
        error?.message ||
          "No se pudo completar el registro de la organización. Comprueba si el correo ya pertenece a otra entidad.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setFormError(null);
    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert(
        "Acepta las condiciones",
        "Por favor, marca las casillas de condiciones corporativas y política de privacidad para continuar con Google.",
        [{ text: "Entendido" }],
      );
      return;
    }

    const res = await signInWithGoogle({
      consents: {
        acceptTerms: true,
        acceptPrivacy: true,
        acceptMarketing: false,
      },
    });

    if (res?.success) {
      Alert.alert(
        "¡Bienvenida a YouConnext B2B!",
        "Tu cuenta corporativa ha sido vinculada y configurada exitosamente.",
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
        {/* Barra superior */}
        <View style={styles.headerBar}>
          <PressableScale
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver atrás"
          >
            <ChevronLeft size={22} color={BRAND.black} strokeWidth={2.4} />
          </PressableScale>

          <View style={styles.badgePill}>
            <Briefcase size={14} color={BRAND.black} strokeWidth={2.2} />
            <Text style={styles.badgePillText}>Alta B2B</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabecera */}
          <View style={styles.header}>
            <Text style={styles.title}>Registra tu Organización</Text>
            <Text style={styles.subtitle}>
              Crea la cuenta institucional para coordinar eventos sostenibles,
              gestionar carpooling de empleados y medir el CO₂ ahorrado.
            </Text>
          </View>

          {/* Selector Inmediato de Rol: Particular vs Organización */}
          <AuthTypeSwitcher
            activeType="enterprise"
            onChangeType={(type) => {
              if (type === "user") {
                navigation.replace("Register", { initialEmail: email });
              }
            }}
          />

          {/* Formulario */}
          <View style={styles.formCard}>
            {formError && (
              <View style={styles.formErrorBanner}>
                <AlertCircle size={18} color={COLORS.error} strokeWidth={2} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Nombre de la entidad (Opcional / Recomendado) */}
            <Input
              label="Nombre de la empresa o institución"
              icon={Building2}
              placeholder="Ej: EcoEmpresa S.L., Universidad..."
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            {/* Correo Corporativo */}
            <Input
              inputRef={emailRef}
              label="Correo electrónico corporativo"
              icon={Mail}
              placeholder="movilidad@tuorganizacion.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
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
              label="Contraseña institucional"
              icon={Lock}
              placeholder="Mínimo 8 caracteres con mayúscula y símbolo"
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

            {/* Medidor de complejidad de contraseña */}
            {password.length > 0 && (
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthTitle}>
                    Seguridad de la contraseña:
                  </Text>
                  <Text
                    style={[styles.strengthValue, { color: strength.color }]}
                  >
                    {strength.label}
                  </Text>
                </View>

                <View style={styles.strengthBarRow}>
                  {[1, 2, 3, 4].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            index <= strengthScore
                              ? strength.color
                              : COLORS.gray200,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Requisitos visuales */}
                <View style={styles.requirementsList}>
                  <View style={styles.reqRow}>
                    <Check
                      size={14}
                      color={
                        passwordChecks.length ? BRAND.green : COLORS.gray400
                      }
                    />
                    <Text
                      style={[
                        styles.reqText,
                        passwordChecks.length && styles.reqTextDone,
                      ]}
                    >
                      Mínimo 8 caracteres
                    </Text>
                  </View>

                  <View style={styles.reqRow}>
                    <Check
                      size={14}
                      color={
                        passwordChecks.hasUpper && passwordChecks.hasLower
                          ? BRAND.green
                          : COLORS.gray400
                      }
                    />
                    <Text
                      style={[
                        styles.reqText,
                        passwordChecks.hasUpper &&
                          passwordChecks.hasLower &&
                          styles.reqTextDone,
                      ]}
                    >
                      Mayúsculas y minúsculas
                    </Text>
                  </View>

                  <View style={styles.reqRow}>
                    <Check
                      size={14}
                      color={
                        passwordChecks.hasNumber ? BRAND.green : COLORS.gray400
                      }
                    />
                    <Text
                      style={[
                        styles.reqText,
                        passwordChecks.hasNumber && styles.reqTextDone,
                      ]}
                    >
                      Al menos un número (0-9)
                    </Text>
                  </View>

                  <View style={styles.reqRow}>
                    <Check
                      size={14}
                      color={
                        passwordChecks.hasSpecial ? BRAND.green : COLORS.gray400
                      }
                    />
                    <Text
                      style={[
                        styles.reqText,
                        passwordChecks.hasSpecial && styles.reqTextDone,
                      ]}
                    >
                      Símbolo especial (@$!%*?&_-#)
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Checkboxes de Términos y Privacidad */}
            <View style={styles.consentsContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    acceptTerms && styles.checkboxBoxChecked,
                    errors.terms && styles.checkboxBoxError,
                  ]}
                >
                  {acceptTerms && (
                    <Check size={14} color={COLORS.white} strokeWidth={3} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Acepto las{" "}
                  <Text
                    style={styles.checkboxLink}
                    onPress={() =>
                      Linking.openURL("https://app.youconnext.es/condiciones")
                    }
                  >
                    condiciones de uso corporativo
                  </Text>
                  .
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <Text style={styles.consentErrorText}>{errors.terms}</Text>
              )}

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    acceptPrivacy && styles.checkboxBoxChecked,
                    errors.privacy && styles.checkboxBoxError,
                  ]}
                >
                  {acceptPrivacy && (
                    <Check size={14} color={COLORS.white} strokeWidth={3} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Acepto la{" "}
                  <Text
                    style={styles.checkboxLink}
                    onPress={() =>
                      Linking.openURL("https://app.youconnext.es/privacidad")
                    }
                  >
                    política de privacidad y protección de datos
                  </Text>
                  .
                </Text>
              </TouchableOpacity>
              {errors.privacy && (
                <Text style={styles.consentErrorText}>{errors.privacy}</Text>
              )}
            </View>

            {/* Botón de Submit */}
            <Button
              title="Crear Cuenta de Organización"
              onPress={handleSubmit}
              variant="primary"
              loading={loading}
              icon={
                <Briefcase size={18} color={COLORS.white} strokeWidth={2.4} />
              }
              style={styles.submitButton}
            />

            {/* Separador elegante */}
            <AuthDivider text="o registra tu entidad con" />

            {/* Botón de Google para Alta Corporativa */}
            {googleAvailable && (
              <GoogleSignInButton
                onPress={handleGoogleRegister}
                loading={googleLoading}
                disabled={loading || googleLoading}
                text="Registrar Organización con Google"
                variant="corporate"
                accessibilityLabel="Registrar Organización con Google"
              />
            )}
          </View>

          {/* Enlace alternativo a login corporativo */}
          <View style={styles.toggleFooter}>
            <Text style={styles.toggleText}>
              ¿Tu organización ya tiene cuenta?
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("EnterpriseLogin")}
              activeOpacity={0.7}
              hitSlop={4}
            >
              <Text style={styles.toggleLink}>Inicia sesión corporativa</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND.accent, // #F2A33C
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgePillText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 11,
    fontWeight: "700",
    color: BRAND.black,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenMargin,
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
    lineHeight: 20,
    color: COLORS.gray600,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  formErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.errorSoft || "#F9E7E4",
    borderWidth: 1,
    borderColor: COLORS.error || "#C62828",
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 10,
  },
  formErrorText: {
    flex: 1,
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    color: COLORS.error || "#C62828",
    lineHeight: 18,
  },
  strengthBox: {
    backgroundColor: COLORS.gray50 || "#EEF5F0",
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  strengthTitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: "600",
  },
  strengthValue: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "700",
  },
  strengthBarRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  requirementsList: {
    gap: 4,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reqText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.gray500,
  },
  reqTextDone: {
    color: BRAND.green,
    fontWeight: "600",
  },
  consentsContainer: {
    marginTop: SPACING.md,
    gap: 10,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.borderField || "#7A8884",
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: BRAND.greenOnLight,
    borderColor: BRAND.greenOnLight,
  },
  checkboxBoxError: {
    borderColor: COLORS.error,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.gray700,
  },
  checkboxLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  consentErrorText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.error,
    marginLeft: 30,
    marginTop: -4,
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
  toggleFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    flexWrap: "wrap",
  },
  toggleText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    color: COLORS.gray600,
  },
  toggleLink: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
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

export default EnterpriseRegisterScreen;
