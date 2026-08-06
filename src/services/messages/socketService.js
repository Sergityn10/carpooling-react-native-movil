// YouConnext - Socket.IO Service for Messages API
import { io } from "socket.io-client";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getMetroHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL !== "string") return null;
  const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] || null;
};

const getSocketUrl = () => {
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

  return baseUrl;
};

let socket = null;
let isConnecting = false;

const socketService = {
  async connect(userId) {
    if (socket && socket.connected) return socket;
    if (isConnecting) return socket;

    isConnecting = true;

    let token = null;
    try {
      token = await AsyncStorage.getItem("@youconnext_token");
    } catch {}

    const url = getSocketUrl();

    socket = io(url, {
      auth: {
        token: token || undefined,
        id: userId,
        serverOffset: 0,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionMaxDelay: 5000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      isConnecting = false;
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("[Socket] Connected to messages server");
      }
    });

    socket.on("disconnect", (reason) => {
      isConnecting = false;
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log("[Socket] Disconnected:", reason);
      }
    });

    socket.on("connect_error", (error) => {
      isConnecting = false;
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("[Socket] Connection error:", error.message);
      }
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      isConnecting = false;
    }
  },

  getSocket() {
    return socket;
  },

  isConnected() {
    return socket && socket.connected;
  },

  // Emit setUserId to join personal room
  setUserId(userId) {
    if (socket && socket.connected) {
      socket.emit("setUserId", userId);
    }
  },

  // Join a group chat room
  joinGroup(chatId, serverOffset = 0) {
    if (socket && socket.connected) {
      socket.emit("join_group", { chatId, serverOffset });
    }
  },

  // Join a direct chat with another user
  joinChat(peerId) {
    if (socket && socket.connected) {
      socket.emit("join_chat", peerId);
    }
  },

  // Send a message to a group chat
  sendMessageToGroup(chatId, message, ackCallback) {
    if (socket && socket.connected) {
      socket.emit(
        "chat_message",
        { chatId, message },
        ackCallback,
      );
    }
  },

  // Send a direct message to a user
  sendMessageToUser(recipientId, message, ackCallback) {
    if (socket && socket.connected) {
      socket.emit(
        "chat_message",
        { send_to: recipientId, message },
        ackCallback,
      );
    }
  },

  // Listen for incoming messages
  onMessage(callback) {
    if (socket) {
      socket.on("chat_message", callback);
    }
  },

  // Listen for notifications
  onNotification(callback) {
    if (socket) {
      socket.on("receiveNotification", callback);
    }
  },

  // Listen for chat errors
  onError(callback) {
    if (socket) {
      socket.on("chat_error", callback);
    }
  },

  // Remove a specific listener
  off(event, callback) {
    if (socket) {
      socket.off(event, callback);
    }
  },

  // Remove all listeners for an event
  offAll(event) {
    if (socket) {
      socket.removeAllListeners(event);
    }
  },
};

export default socketService;
