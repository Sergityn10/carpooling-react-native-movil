// YouConnext - EnterpriseLoginScreen (Acceso para Organizaciones y Empresas v2)
// Estructura oficial, foco interactivo, validaciones corporativas (docs/api/enterprise_auth.md)
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
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Mail,
  Lock,
  ChevronLeft,
  AlertCircle,
  Building2,
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

const EnterpriseLoginScreen = ({ navigation, route }) => {
  const { iniciarSesionOrganizacion } = useUser();
  const {
    signInWithGoogle,
    loading: googleLoading,
    isAvailable: googleAvailable,
  } = useGoogleAuth({
    target: "enterprise",
    method: "auto",
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
      if (!value.trim())
        return "Introduce el correo institucional de la organización.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return "El formato de correo no es válido (ej: movilidad@empresa.com).";
    }
    if (field === "password") {
      if (!value.trim()) return "Introduce la contraseña corporativa.";
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
      Object.entries(newErrors).filter(([, v]) => Boolean(v)),
    );
    setErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await iniciarSesionOrganizacion(email.trim(), password);
    } catch (error) {
      const msg =
        error?.message ||
        "Credenciales incorrectas o cuenta corporativa no disponible. Revisa los datos e inténtalo de nuevo.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    const res = await signInWithGoogle();
    if (res?.error) {
      setFormError(res.error);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Recuperar Acceso Corporativo",
      "Para restablecer la contraseña institucional, contacta con el administrador de tu entidad o con soporte B2B (empresas@youconnext.es).",
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
        {/* Barra superior con botón volver */}
        <View style={styles.headerBar}>
          <PressableScale
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver atrás"
          >
            <ChevronLeft size={22} color={BRAND.black} strokeWidth={2.4} />
          </PressableScale>

          <View style={styles.badgePill}>
            <Building2 size={14} color={BRAND.black} strokeWidth={2.2} />
            <Text style={styles.badgePillText}>Portal Organizaciones</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Titular en Sora y subtítulo en Inter */}
          <View style={styles.header}>
            <Text style={styles.title}>Acceso Corporativo</Text>
            <Text style={styles.subtitle}>
              Inicia sesión con la cuenta de tu empresa, institución o sede para
              gestionar la movilidad compartida de tu equipo.
            </Text>
          </View>

          {/* Selector Inmediato de Rol: Particular vs Organización */}
          <AuthTypeSwitcher
            activeType="enterprise"
            onChangeType={(type) => {
              if (type === "user") {
                navigation.replace("Login", { initialEmail: email });
              }
            }}
          />

          {/* Tarjeta de Formulario */}
          <View style={styles.formCard}>
            {formError && (
              <View style={styles.formErrorBanner}>
                <AlertCircle size={18} color={COLORS.error} strokeWidth={2} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Correo Corporativo */}
            <Input
              label="Correo institucional / corporativo"
              icon={Mail}
              placeholder="movilidad@empresa.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
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

            {/* Contraseña */}
            <View style={styles.passwordRowHeader}>
              <Text style={styles.inputLabel}>Contraseña de organización</Text>
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
              placeholder="Tu contraseña corporativa"
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

            {/* Botón Principal B2B */}
            <Button
              title="Entrar al Panel Corporativo"
              onPress={handleSubmit}
              variant="primary"
              loading={loading}
              icon={
                <Building2 size={18} color={COLORS.white} strokeWidth={2.4} />
              }
              style={styles.submitButton}
            />

            {/* Separador elegante */}
            <AuthDivider text="o accede con" />

            {/* Botón de Google Corporativo */}
            {googleAvailable && (
              <GoogleSignInButton
                onPress={handleGoogleLogin}
                loading={googleLoading}
                disabled={loading || googleLoading}
                text="Continuar con Google Corporativo"
                variant="corporate"
                accessibilityLabel="Continuar con Google Corporativo"
              />
            )}

            {/* Microtexto informativo corporativo */}
            <View style={styles.corporateHintContainer}>
              <Text style={styles.corporateHintText}>
                Acceso unificado para cuentas institucionales de Google Workspace vinculadas a tu organización.
              </Text>
            </View>
          </View>

          {/* Enlace alternativo a registro corporativo */}
          <View style={styles.toggleFooter}>
            <Text style={styles.toggleText}>
              ¿Tu entidad todavía no está registrada?
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("EnterpriseRegister")}
              activeOpacity={0.7}
              hitSlop={4}
            >
              <Text style={styles.toggleLink}>Registrar mi Organización</Text>
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
    borderRadius: RADIUS.card, // 16px
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
  passwordRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inputLabel: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.black,
  },
  forgotPasswordText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: SPACING.md,
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
  corporateHintContainer: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: "center",
  },
  corporateHintText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 16,
  },
});

export default EnterpriseLoginScreen;
