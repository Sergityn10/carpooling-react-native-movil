// YouConnext - Secure Token Storage Service
// Migración de AsyncStorage a expo-secure-store para cumplimiento RGPD / PSD2 (FRONT-01)
// Cifrado por hardware mediante Keychain en iOS y EncryptedSharedPreferences (Android Keystore) en Android.

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Claves permitidas por SecureStore: solo caracteres alfanuméricos, '.', '-' y '_' (sin '@')
const SECURE_TOKEN_KEY = "youconnext_token";
const SECURE_REFRESH_TOKEN_KEY = "youconnext_refresh_token";

// Claves legacy de AsyncStorage para migración transparente de sesiones existentes
const LEGACY_TOKEN_KEY = "@youconnext_token";
const LEGACY_REFRESH_TOKEN_KEY = "@youconnext_refresh_token";

const SECURE_STORE_OPTIONS = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

let isSecureStoreAvailablePromise = null;

async function checkSecureStoreAvailable() {
  if (Platform.OS === "web") {
    return false;
  }
  if (!isSecureStoreAvailablePromise) {
    isSecureStoreAvailablePromise = SecureStore.isAvailableAsync().catch(() => false);
  }
  return isSecureStoreAvailablePromise;
}

/**
 * Obtiene el token JWT de acceso actual.
 * Realiza migración automática de AsyncStorage si existía una sesión previa no cifrada.
 * @returns {Promise<string|null>} Token JWT o null
 */
export async function getAuthToken() {
  try {
    const isSecure = await checkSecureStoreAvailable();
    if (isSecure) {
      const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      if (token) {
        return token;
      }

      // Migración transparente: verificar si existía token guardado previamente en AsyncStorage
      const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
      if (legacyToken) {
        try {
          await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacyToken, SECURE_STORE_OPTIONS);
          await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log("[tokenStorage] Token migrado con éxito de AsyncStorage a SecureStore");
          }
        } catch (migErr) {
          console.warn("[tokenStorage] Error al migrar token legacy:", migErr?.message);
        }
        return legacyToken;
      }
      return null;
    }

    // Fallback para Web
    return await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    console.warn("[tokenStorage] Error al leer auth token:", error?.message);
    try {
      return await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    } catch {
      return null;
    }
  }
}

/**
 * Guarda el token JWT de acceso en almacenamiento seguro cifrado por hardware.
 * @param {string} token - Token JWT
 */
export async function setAuthToken(token) {
  if (!token) {
    await removeAuthToken();
    return;
  }

  try {
    const isSecure = await checkSecureStoreAvailable();
    if (isSecure) {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token, SECURE_STORE_OPTIONS);
      // Limpiar residuo en texto plano de AsyncStorage si existía
      try {
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
      } catch {}
      return;
    }

    // Fallback para Web
    await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
  } catch (error) {
    console.error("[tokenStorage] Error al guardar auth token en SecureStore:", error?.message);
    // Respaldo de seguridad en caso de fallo inesperado del keystore nativo
    await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
  }
}

/**
 * Elimina el token de acceso de SecureStore y AsyncStorage.
 */
export async function removeAuthToken() {
  try {
    const isSecure = await checkSecureStoreAvailable();
    if (isSecure) {
      try {
        await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
      } catch {}
    }
  } catch (e) {
    console.warn("[tokenStorage] Error al borrar token de SecureStore:", e?.message);
  } finally {
    try {
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch {}
  }
}

/**
 * Obtiene el refresh token actual.
 * Realiza migración automática de AsyncStorage si existía en texto plano.
 * @returns {Promise<string|null>} Refresh token o null
 */
export async function getRefreshToken() {
  try {
    const isSecure = await checkSecureStoreAvailable();
    if (isSecure) {
      const refreshToken = await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        return refreshToken;
      }

      // Migración desde AsyncStorage legacy
      const legacyRefresh = await AsyncStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
      if (legacyRefresh) {
        try {
          await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, legacyRefresh, SECURE_STORE_OPTIONS);
          await AsyncStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log("[tokenStorage] Refresh token migrado con éxito a SecureStore");
          }
        } catch (migErr) {
          console.warn("[tokenStorage] Error al migrar refresh token legacy:", migErr?.message);
        }
        return legacyRefresh;
      }
      return null;
    }

    // Fallback para Web
    return await AsyncStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn("[tokenStorage] Error al leer refresh token:", error?.message);
    try {
      return await AsyncStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }
}

/**
 * Guarda el refresh token en almacenamiento cifrado seguro.
 * @param {string} refreshToken - Token de refresco
 */
export async function setRefreshToken(refreshToken) {
  if (!refreshToken) {
    await removeRefreshToken();
    return;
  }

  try {
    const isSecure = await checkSecureStoreAvailable();
    if (isSecure) {
      await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, refreshToken, SECURE_STORE_OPTIONS);
      try {
        await AsyncStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
      } catch {}
      return;
    }

    // Fallback para Web
    await AsyncStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error("[tokenStorage] Error al guardar refresh token en SecureStore:", error?.message);
    await AsyncStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Elimina el refresh token de SecureStore y AsyncStorage.
 */
export async function removeRefreshToken() {
  try {
    const isSecure = await checkSecureStoreAvailable();
    if (isSecure) {
      try {
        await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
      } catch {}
    }
  } catch (e) {
    console.warn("[tokenStorage] Error al borrar refresh token de SecureStore:", e?.message);
  } finally {
    try {
      await AsyncStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    } catch {}
  }
}

/**
 * Limpia todos los tokens de autenticación de forma segura (logout completo).
 */
export async function clearAllAuthTokens() {
  await Promise.all([
    removeAuthToken(),
    removeRefreshToken(),
  ]);
}

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  clearAllAuthTokens,
};
