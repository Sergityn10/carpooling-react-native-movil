// YouConnext - HTTP Client Base
import { API_CONFIG } from "../constants";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getMetroHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL !== "string") return null;
  const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] || null;
};

class HttpClient {
  constructor() {
    const envBaseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.youconnext.es";
    let baseUrl = envBaseUrl || API_CONFIG.BASE_URL;

    // Remove trailing slash to avoid double slashes in endpoints
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    if (
      !envBaseUrl &&
      Platform.OS === "android" &&
      typeof __DEV__ !== "undefined" &&
      __DEV__
    ) {
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        const metroHost = getMetroHost();
        const host = metroHost || "10.0.2.2";
        baseUrl = baseUrl
          .replace("http://localhost", `http://${host}`)
          .replace("http://127.0.0.1", `http://${host}`);
      }
    }

    this.baseUrl = baseUrl;
    this.token = null;
    this.refreshPromise = null;
    this.tokenRefreshCallbacks = [];

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("API baseUrl:", this.baseUrl);
    }
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  onUnauthorized = null;

  setUnauthorizedHandler(handler) {
    this.onUnauthorized = handler;
  }

  onTokenRefreshed(callback) {
    this.tokenRefreshCallbacks.push(callback);
  }

  async refreshToken() {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const url = `${this.baseUrl}/api/auth/refresh`;
        const headers = {};
        if (this.token) {
          headers["Authorization"] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, { method: "POST", headers });
        const rawText = await response.text();
        let data = null;
        if (rawText) {
          try {
            data = JSON.parse(rawText);
          } catch {
            data = rawText;
          }
        }

        if (!response.ok) return null;

        const newToken = data?.token;
        if (!newToken) return null;

        this.token = newToken;
        try {
          await AsyncStorage.setItem("@youconnext_token", newToken);
        } catch {}

        this.tokenRefreshCallbacks.forEach((cb) => {
          try {
            cb(newToken);
          } catch {}
        });

        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("[httpClient] Token refreshed successfully");
        }
        return newToken;
      } catch (e) {
        console.error("[httpClient] Refresh token failed:", e?.message);
        throw e;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request(endpoint, options = {}) {
    const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (envBaseUrl) {
      let baseUrl = envBaseUrl;
      if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

      // Replace localhost/127.0.0.1 with the Metro host or 10.0.2.2 on Android
      if (
        Platform.OS === "android" &&
        typeof __DEV__ !== "undefined" &&
        __DEV__ &&
        (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))
      ) {
        const metroHost = getMetroHost();
        const host = metroHost || "10.0.2.2";
        baseUrl = baseUrl
          .replace("http://localhost", `http://${host}`)
          .replace("http://127.0.0.1", `http://${host}`);
        console.log("API baseUrl (env + android):", baseUrl);
      }

      this.baseUrl = baseUrl;
    } else if (
      Platform.OS === "android" &&
      typeof __DEV__ !== "undefined" &&
      __DEV__
    ) {
      const metroHost = getMetroHost();
      const host = metroHost || "10.0.2.2";

      const nextBaseUrl = this.baseUrl
        .replace("http://localhost", `http://${host}`)
        .replace("http://127.0.0.1", `http://${host}`)
        .replace("http://10.0.2.2", `http://${host}`)
        .replace("http://192.168.0.47", `http://${host}`);

      if (nextBaseUrl !== this.baseUrl) {
        this.baseUrl = nextBaseUrl;
        console.log("API baseUrl (updated):", this.baseUrl);
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const hasBody = options.body !== undefined && options.body !== null;
    const headers = {
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (hasBody) {
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    } else {
      if (headers["Content-Type"] === "application/json") {
        delete headers["Content-Type"];
      }
    }

    const config = {
      ...options,
      headers,
    };

    if (!hasBody) {
      delete config.body;
    } else if (
      headers["Content-Type"]?.includes("application/json") &&
      typeof config.body !== "string"
    ) {
      config.body = JSON.stringify(config.body);
    }

    try {
      let response = await fetch(url, config);

      const rawText = await response.text();
      let data = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }
      }

      if (!response.ok) {
        if (
          response.status === 401 &&
          !options._retried &&
          !endpoint.includes("/api/auth/refresh")
        ) {
          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              return this.request(endpoint, { ...options, _retried: true });
            }
          } catch (refreshErr) {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.warn(
                "[httpClient] Refresh failed (network?), not logging out:",
                refreshErr?.message,
              );
            }
            throw new Error("Error de conexión al refrescar la sesión");
          }
        }

        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        if (data && typeof data === "object") {
          const err = new Error(
            data.message || data.error || "Error en la peticion",
          );
          err.status = response.status;
          throw err;
        }
        const err = new Error(
          typeof data === "string" && data ? data : "Error en la peticion",
        );
        err.status = response.status;
        throw err;
      }
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const httpClient = new HttpClient();
export default httpClient;
