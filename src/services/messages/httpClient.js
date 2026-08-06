// YouConnext - HTTP Client for Messages API (api-messages, port 4002)
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import httpClient from "../httpClient";

const getMetroHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL !== "string") return null;
  const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] || null;
};

class MessagesHttpClient {
  constructor() {
    const envBaseUrl =
      process.env.EXPO_PUBLIC_MESSAGES_API_URL ||
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      "https://api.youconnext.es";
    let baseUrl = envBaseUrl;

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

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    this.baseUrl = baseUrl;
    this.token = null;

    httpClient.onTokenRefreshed((newToken) => {
      this.token = newToken;
    });

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log("Messages API baseUrl:", this.baseUrl);
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

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || "GET";
    const hasBody = options.body !== undefined;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.getToken()) {
      headers["Authorization"] = `Bearer ${this.getToken()}`;
    }

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log(
        "Messages API request:",
        method,
        url,
        "| token:",
        this.getToken() ? "YES" : "NO",
      );
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: hasBody ? options.body : undefined,
      });

      if (!response.ok) {
        if (response.status === 401 && !options._retried) {
          try {
            const newToken = await httpClient.refreshToken();
            if (newToken) {
              this.token = newToken;
              return this.request(endpoint, { ...options, _retried: true });
            }
          } catch (refreshErr) {
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.warn(
                "Messages API: Refresh failed (network?), not logging out:",
                refreshErr?.message,
              );
            }
            throw new Error("Error de conexión al refrescar la sesión");
          }
        }

        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      if (response.status === 204) return null;

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.error("Messages API error:", error.message);
      }
      throw error;
    }
  }
}

const messagesHttpClient = new MessagesHttpClient();

async function asegurarToken() {
  try {
    const token = await AsyncStorage.getItem("@youconnext_token");
    if (token) {
      messagesHttpClient.setToken(token);
    }
  } catch (error) {
    console.warn("No se pudo recuperar el token:", error);
  }
}

export { messagesHttpClient, asegurarToken };
export default messagesHttpClient;
