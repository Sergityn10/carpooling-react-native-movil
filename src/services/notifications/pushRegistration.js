// YouConnext - Push notification device registration helper
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { notificacionService } from "./notificacionService";
import notificationsHttpClient from "./httpClient";
import tokenStorage from "../tokenStorage";
import { PERMISSION_TYPES } from "../../constants/permissionsConfig";

const DEVICE_TOKEN_KEY = "@youconnext_device_push_token";
const DEVICE_ID_KEY = "@youconnext_device_id";
export const TRIP_ALERTS_CHANNEL_ID = "trip-alerts";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function ensureTripAlertNotificationChannel() {
  if (Platform.OS !== "android") return null;
  try {
    return await Notifications.setNotificationChannelAsync(
      TRIP_ALERTS_CHANNEL_ID,
      {
        name: "Alertas de trayectos",
        description:
          "Avisos cuando se publica un viaje a un destino o evento de tu interés.",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0B7A3B",
        enableVibrate: true,
        enableLights: true,
      },
    );
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[PushRegistration] Error setting Android notification channel:",
        error?.message,
      );
    }
    return null;
  }
}

async function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.manifest?.extra?.eas?.projectId ||
    Constants?.eas?.projectId ||
    null
  );
}

async function getOrCreateDeviceId() {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (deviceId) return deviceId;

    // Generar un ID estable por instalación de la app
    deviceId = `${Platform.OS}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.warn("[PushRegistration] Error getting deviceId:", error);
    return `${Platform.OS}-${Date.now()}`;
  }
}

async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus;
}

async function getPushToken() {
  // Primero intentamos obtener el token nativo del dispositivo (FCM en Android/APNs en iOS).
  // Esto requiere que el proyecto tenga configurado FCM v1 en EAS o google-services.json.
  try {
    const nativeToken = await Notifications.getDevicePushTokenAsync();
    if (nativeToken?.data) {
      return { type: "native", token: nativeToken.data };
    }
  } catch (error) {
    if (__DEV__) {
      console.log(
        "[PushRegistration] Native token not available, falling back to Expo token:",
        error?.message,
      );
    }
  }

  // Fallback: token de Expo Push. Útil para desarrollo/Expo Go,
  // pero el backend debe saber enviar push a tokens de Expo.
  try {
    const projectId = await getProjectId();
    const expoToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return { type: "expo", token: expoToken.data };
  } catch (error) {
    console.warn("[PushRegistration] Error getting Expo push token:", error);
    throw error;
  }
}

/**
 * Solicita permisos, obtiene el token de push y lo registra en el microservicio
 * de notificaciones. Si el token ya está registrado localmente, no vuelve a llamar.
 * @param {string|number} userId - id del usuario propietario del dispositivo
 * @param {string} jwtToken - JWT del usuario para autenticar la petición
 * @param {boolean} force - fuerza el registro aunque el token local coincida
 */
export async function registerPushDevice(userId, jwtToken, force = false) {
  try {
    const status = await requestNotificationPermissions();
    if (status !== "granted") {
      return {
        success: false,
        alreadyRegistered: false,
        error: "Permiso de notificaciones denegado",
      };
    }

    await ensureTripAlertNotificationChannel();

    if (jwtToken) {
      notificationsHttpClient.setToken(jwtToken);
    }

    const { token, type } = await getPushToken();
    const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);

    if (!force && storedToken === token) {
      if (__DEV__) {
        console.log("[PushRegistration] Token already registered:", token);
      }
      return { success: true, token, type, alreadyRegistered: true };
    }

    const deviceId = await getOrCreateDeviceId();
    const deviceName = `${Platform.OS === "ios" ? "iOS" : "Android"} ${Platform.Version || ""}`;

    if (__DEV__) {
      console.log(
        "[PushRegistration] Registering token:",
        token,
        type,
        "| userId:",
        userId,
      );
    }

    await notificacionService.registerDeviceToken({
      token,
      userId,
      platform: Platform.OS,
      deviceId,
      deviceName,
    });

    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);

    return { success: true, token, type, alreadyRegistered: false };
  } catch (error) {
    console.error("[PushRegistration] Error:", error);
    return {
      success: false,
      alreadyRegistered: false,
      error: error.message || "Error registrando dispositivo",
    };
  }
}

/**
 * Elimina el token registrado del backend y del almacenamiento local.
 * @param {string} jwtToken - JWT del usuario para autenticar la petición
 */
export async function unregisterPushDevice(jwtToken) {
  try {
    if (jwtToken) {
      notificationsHttpClient.setToken(jwtToken);
    }

    const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!storedToken && !deviceId) {
      return { success: true };
    }

    await notificacionService.unregisterDeviceToken({
      token: storedToken,
      deviceId,
    });

    await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    return { success: true };
  } catch (error) {
    console.error("[PushRegistration] Error unregistering:", error);
    // Aunque falle en el backend, limpiamos el caché local
    await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    return { success: false, error: error.message };
  }
}

/**
 * Escucha cambios de token y los re-registra automáticamente.
 * @param {string|number} userId - id del usuario propietario del dispositivo
 * @param {string} jwtToken - JWT del usuario para autenticar la petición
 * @param {function} callback - opcional, llamado con el resultado del re-registro
 * @returns {function} función para limpiar el listener
 */
export function listenForTokenRefresh(userId, jwtToken, callback) {
  const subscription = Notifications.addPushTokenListener(async (tokenData) => {
    const token = tokenData?.data;
    if (!token) return;

    const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (storedToken === token) return;

    if (__DEV__) {
      console.log("[PushRegistration] Token refreshed:", token);
    }

    const result = await registerPushDevice(userId, jwtToken, true);
    if (typeof callback === "function") {
      callback(result);
    }
  });

  return subscription.remove;
}

/**
 * Devuelve el token actual sin intentar registrarlo.
 */
export async function getStoredPushToken() {
  return AsyncStorage.getItem(DEVICE_TOKEN_KEY);
}

/**
 * Consulta el estado actual de permisos del sistema y si existe un token push guardado.
 */
export async function getNotificationPushStatus() {
  try {
    const [{ status, canAskAgain }, storedToken] = await Promise.all([
      Notifications.getPermissionsAsync(),
      AsyncStorage.getItem(DEVICE_TOKEN_KEY),
    ]);
    return {
      permissionStatus: status,
      granted: status === "granted",
      canAskAgain: Boolean(canAskAgain),
      hasRegisteredToken: Boolean(storedToken),
      token: storedToken || null,
    };
  } catch {
    return {
      permissionStatus: "undetermined",
      granted: false,
      canAskAgain: true,
      hasRegisteredToken: false,
      token: null,
    };
  }
}

/**
 * Solicita permiso de notificaciones mediante Prominent Disclosure y registra el token FCM en /api/device-tokens.
 */
export async function enablePushNotificationsForUser({
  requestPermissionWithDisclosure,
  userId,
}) {
  if (typeof requestPermissionWithDisclosure !== "function") {
    return { granted: false };
  }
  const res = await requestPermissionWithDisclosure(
    PERMISSION_TYPES.NOTIFICATIONS,
    { forcePrompt: true },
  );
  if (res?.granted && userId) {
    const jwtToken = await tokenStorage.getAuthToken();
    if (jwtToken) {
      await registerPushDevice(userId, jwtToken, true);
    }
  }
  return { granted: Boolean(res?.granted) };
}
