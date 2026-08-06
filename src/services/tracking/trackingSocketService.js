// YouConnext - Socket.IO Service for Tracking API
// Centraliza la conexión WebSocket con el microservicio de Tracking.
// La sala (trayecto:<id>) se une automáticamente en el servidor al pasar
// trayecto_id en el auth del handshake; NO existe evento "join_room".
import { io } from "socket.io-client";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import httpClient from "../httpClient";

const getMetroHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL !== "string") return null;
  const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] || null;
};

const getTrackingUrl = () => {
  let baseUrl =
    process.env.EXPO_PUBLIC_TRACKING_API_URL || "http://localhost:4003";

  if (Platform.OS === "android" && typeof __DEV__ !== "undefined" && __DEV__) {
    if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      const metroHost = getMetroHost();
      const host = metroHost || "10.0.2.2";
      baseUrl = baseUrl
        .replace("http://localhost", `http://${host}`)
        .replace("http://127.0.0.1", `http://${host}`);
    }
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return baseUrl;
};

let socket = null;
let currentTrayectoId = null;

// Si el httpClient refresca el token mientras el socket vive,
// actualizar el auth para los próximos handshakes de reconexión.
httpClient.onTokenRefreshed((newToken) => {
  if (socket) {
    socket.auth = { token: newToken, trayecto_id: currentTrayectoId };
  }
});

const trackingSocketService = {
  async connect(trayectoId, handlers = {}) {
    if (socket && socket.connected && currentTrayectoId === trayectoId) {
      return socket;
    }

    this.disconnect();

    let token = null;
    try {
      token = await AsyncStorage.getItem("@youconnext_token");
    } catch {}

    currentTrayectoId = trayectoId;

    socket = io(getTrackingUrl(), {
      auth: {
        token: token || undefined,
        trayecto_id: trayectoId,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("[Tracking] Conectado a sala trayecto:", trayectoId);
      }
      handlers.onConnect?.();
    });

    socket.on("disconnect", (reason) => {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("[Tracking] Desconectado:", reason);
      }
      handlers.onDisconnect?.(reason);
    });

    socket.on("location_updated", (data) => {
      handlers.onLocationUpdated?.(data);
    });

    socket.on("no_location", (data) => {
      handlers.onNoLocation?.(data);
    });

    socket.on("tracking_ended", (data) => {
      handlers.onTrackingEnded?.(data);
    });

    socket.on("error", (err) => {
      handlers.onError?.(err);
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      handlers.onReconnectAttempt?.(attempt);
    });

    socket.io.on("reconnect", (attempt) => {
      handlers.onReconnect?.(attempt);
    });

    socket.on("connect_error", async (err) => {
      const code = err?.message?.split(":")[0];

      if (code === "AUTH_EXPIRED") {
        try {
          const newToken = await httpClient.refreshToken();
          if (newToken && socket) {
            socket.auth = { token: newToken, trayecto_id: trayectoId };
            socket.connect();
            return;
          }
        } catch (refreshErr) {
          handlers.onConnectError?.(refreshErr);
          return;
        }
      }

      handlers.onConnectError?.(err);
    });

    return socket;
  },

  updateLocation(lat, lng) {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, error: "Socket no conectado" });
        return;
      }
      socket.emit("update_location", { lat, lng }, (ack) => {
        resolve(ack || { ok: false, error: "Sin respuesta del servidor" });
      });
    });
  },

  endTracking() {
    if (socket && socket.connected) {
      socket.emit("end_tracking");
    }
  },

  disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socket = null;
      currentTrayectoId = null;
    }
  },

  isConnected() {
    return socket && socket.connected;
  },
};

export default trackingSocketService;
