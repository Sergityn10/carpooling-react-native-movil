// YouConnext - LoginScreen
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Mail, Lock, ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, GoogleIcon } from "../components";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
console.log("[LoginScreen] webClientId:", GOOGLE_WEB_CLIENT_ID);

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
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo iniciar sesión.");
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
                  placeholder="Tu contraseña"
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
                  Continuar con Google
                </Text>
              </>
            )}
          </TouchableOpacity>

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
    fontWeight: "bold",
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
    textAlign: "center",
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

export default LoginScreen;
