// YouConnext - HTTP Client for Notifications Microservice
import { NativeModules, Platform } from "react-native";
import httpClient from "../httpClient";

const getMetroHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL !== "string") return null;
  const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] || null;
};

class NotificationsHttpClient {
  constructor() {
    const envBaseUrl =
      process.env.EXPO_PUBLIC_NOTIFICATIONS_API_URL || "http://localhost:3004";
    let baseUrl = envBaseUrl;

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    if (
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

    // Sincronizar token con el httpClient principal cuando se refresque
    httpClient.onTokenRefreshed((newToken) => {
      this.token = newToken;
    });

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("Notifications API baseUrl:", this.baseUrl);
    }
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  getToken() {
    return this.token || httpClient.token;
  }

  onUnauthorized = null;

  setUnauthorizedHandler(handler) {
    this.onUnauthorized = handler;
  }

  async request(endpoint, options = {}) {
    const envBaseUrl = process.env.EXPO_PUBLIC_NOTIFICATIONS_API_URL;

    if (envBaseUrl) {
      let baseUrl = envBaseUrl;
      if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
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
        .replace("http://10.0.2.2", `http://${host}`);

      if (nextBaseUrl !== this.baseUrl) {
        this.baseUrl = nextBaseUrl;
        console.log("Notifications API baseUrl (updated):", this.baseUrl);
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const hasBody = options.body !== undefined && options.body !== null;
    const headers = {
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["Cookie"] = `token=${token}`;
    }

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log(
        "Notifications API request:",
        url,
        "| token:",
        this.getToken() ? "YES" : "NO",
      );
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
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.warn(
            "Notifications API error response:",
            response.status,
            rawText?.substring(0, 500),
          );
        }
        if (response.status === 401 && !options._retried) {
          try {
            const newToken = await httpClient.refreshToken();
            if (newToken) {
              this.token = newToken;
              return this.request(endpoint, { ...options, _retried: true });
            }
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.warn(
                "[Notifications API] Refresh returned null, triggering logout",
              );
            }
          } catch (refreshErr) {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.warn(
                "[Notifications API] Refresh failed:",
                refreshErr?.message,
              );
            }
          }
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
          const err = new Error("Sesión expirada");
          err.status = 401;
          throw err;
        }
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        if (data && typeof data === "object") {
          const msg =
            data.message ||
            data.error ||
            (data.detail ? JSON.stringify(data.detail) : null);
          if (typeof msg === "string") {
            throw new Error(msg);
          }
          throw new Error(JSON.stringify(data));
        }
        throw new Error(
          typeof data === "string" && data ? data : "Error en la peticion",
        );
      }

      return data;
    } catch (error) {
      console.error("Notifications API Error:", error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const notificationsHttpClient = new NotificationsHttpClient();
export default notificationsHttpClient;
