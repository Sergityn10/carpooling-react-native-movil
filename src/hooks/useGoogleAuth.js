// YouConnext - useGoogleAuth (Hook reutilizable para autenticación con Google)
import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useUser } from "../context/UserContext";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// Configuración inicial de Google Sign-In
try {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
} catch (e) {
  console.warn("[useGoogleAuth] Error al configurar GoogleSignin:", e?.message);
}

export const useGoogleAuth = (defaultOptions = {}) => {
  const { loginGoogleNative, loginGoogleEnterprise } = useUser();
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState(null);

  // Verificar soporte de Google Play Services
  useEffect(() => {
    let mounted = true;
    GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false })
      .then((hasServices) => {
        if (mounted) setIsAvailable(Boolean(hasServices));
      })
      .catch(() => {
        if (mounted) setIsAvailable(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithGoogle = useCallback(
    async (runtimeOptions = {}) => {
      const mergedOptions = { ...defaultOptions, ...runtimeOptions };
      const {
        target = "user", // "user" | "enterprise"
        preferredMode = "personal", // "personal" | "enterprise"
        method = "login", // "login" | "register" | "auto"
        consents = {},
        showAlertOnError = true,
      } = mergedOptions;

      setLoading(true);
      setError(null);

      try {
        // Limpiar sesión previa en caché para permitir elegir cuenta si es necesario
        try {
          await GoogleSignin.signOut();
        } catch {}

        // Iniciar flujo interactivo de Google
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signInResponse = await GoogleSignin.signIn();

        // Obtener tokens de autenticación
        let idToken = signInResponse?.data?.idToken;
        if (!idToken) {
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens?.idToken;
        }

        if (!idToken) {
          throw new Error("No se pudo obtener el token de identidad de Google.");
        }

        // Llamar a loginGoogleEnterprise para cuentas B2B o loginGoogleNative para particulares
        let authResult;
        if (target === "enterprise") {
          authResult = await loginGoogleEnterprise(idToken, method);
        } else {
          authResult = await loginGoogleNative(idToken, method, {
            preferredMode,
            ...consents,
          });
        }

        return {
          success: true,
          cancelled: false,
          result: authResult,
        };
      } catch (err) {
        // Detectar si el usuario canceló voluntariamente el diálogo de Google
        const isCancelled =
          err?.code === statusCodes?.SIGN_IN_CANCELLED ||
          err?.code === "12501" ||
          String(err?.message || "").includes("12501") ||
          String(err?.message || "").includes("cancelled");

        if (isCancelled) {
          return {
            success: false,
            cancelled: true,
          };
        }

        let userFriendlyMsg =
          err?.message || "No se pudo completar el acceso con Google.";

        if (err?.code === statusCodes?.IN_PROGRESS) {
          userFriendlyMsg = "Ya hay un proceso de inicio de sesión en marcha.";
        } else if (err?.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
          userFriendlyMsg =
            "Los servicios de Google Play no están disponibles en este dispositivo.";
        }

        setError(userFriendlyMsg);

        if (showAlertOnError) {
          Alert.alert("Autenticación con Google", userFriendlyMsg, [
            { text: "Entendido" },
          ]);
        }

        return {
          success: false,
          cancelled: false,
          error: userFriendlyMsg,
        };
      } finally {
        setLoading(false);
      }
    },
    [defaultOptions, loginGoogleNative],
  );

  return {
    signInWithGoogle,
    loading,
    isAvailable,
    error,
  };
};

export default useGoogleAuth;
