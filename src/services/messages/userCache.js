// YouConnext - User Info Cache for Messages
// Caches public user info (id, name, img_perfil) so we don't refetch on every chat open.
import { usuarioService } from "../usuarioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tokenStorage from "../tokenStorage";

const cache = new Map();

/**
 * Decodificador Base64URL puro en JavaScript sin dependencia de atob (compatible con Hermes/React Native)
 */
const base64UrlDecode = (str) => {
  if (!str || typeof str !== "string") return "";
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  for (let i = 0; i < base64.length; i += 4) {
    const enc1 = chars.indexOf(base64.charAt(i));
    const enc2 = chars.indexOf(base64.charAt(i + 1));
    const enc3 = chars.indexOf(base64.charAt(i + 2));
    const enc4 = chars.indexOf(base64.charAt(i + 3));

    if (enc1 === -1 || enc2 === -1) break;

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64 && enc3 !== -1) output += String.fromCharCode(chr2);
    if (enc4 !== 64 && enc4 !== -1) output += String.fromCharCode(chr3);
  }
  return output;
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const jsonStr = base64UrlDecode(parts[1]);
    return JSON.parse(jsonStr);
  } catch (err) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("[userCache] Error decodificando JWT:", err?.message);
    }
    return null;
  }
};

let resolvedUuid = null;

const userCache = {
  // Resolve the current user's UUID from the JWT (not user.id from main API)
  async getMyUuid(fallbackUserId = null) {
    if (resolvedUuid) return resolvedUuid;
    try {
      let token = await tokenStorage.getAuthToken();
      if (!token) {
        token = await AsyncStorage.getItem("@youconnext_token");
      }
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          resolvedUuid = String(
            payload.id ||
              payload.user_id ||
              payload.userId ||
              payload.sub ||
              "",
          );
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            console.log("[userCache] Resolved my UUID from JWT:", resolvedUuid);
          }
        }
      }
    } catch (err) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("[userCache] Error al obtener UUID:", err?.message);
      }
    }

    if (!resolvedUuid && fallbackUserId) {
      resolvedUuid = String(fallbackUserId);
    }

    return resolvedUuid || "";
  },

  // Synchronous version for use in render functions (returns cached value)
  getMyUuidSync(fallbackUserId = null) {
    return resolvedUuid || (fallbackUserId ? String(fallbackUserId) : "");
  },

  // Get a single user from cache (no fetch)
  get(id) {
    if (!id) return null;
    return cache.get(String(id)) || null;
  },

  // Set a single user into cache
  set(id, user) {
    if (!id || !user) return;
    cache.set(String(id), user);
  },

  // Get multiple users from cache (returns only cached ones)
  getMany(ids) {
    return ids.map((id) => cache.get(String(id))).filter(Boolean);
  },

  // Fetch and cache a single user's public info
  async fetchOne(id) {
    if (!id) return null;
    const key = String(id);
    if (cache.has(key)) return cache.get(key);

    try {
      console.log("[userCache] Fetching single user:", id);
      const res = await usuarioService.getUserPublicChatInfo(id);
      console.log("[userCache] Single response:", JSON.stringify(res));
      const user = res?.user || res?.data?.user || null;
      if (user) {
        cache.set(key, user);
      }
      return user;
    } catch (err) {
      console.warn("[userCache] Error fetching user", id, err.message);
      return null;
    }
  },

  // Fetch and cache multiple users via batch endpoint
  // Only fetches IDs not already in cache.
  async fetchMany(ids) {
    if (!ids || ids.length === 0) return [];

    const uniqueIds = [...new Set(ids.map(String))];
    const missing = uniqueIds.filter((id) => !cache.has(id));

    if (missing.length === 0) {
      return uniqueIds.map((id) => cache.get(id)).filter(Boolean);
    }

    try {
      console.log("[userCache] Batch fetching users:", missing);
      const res = await usuarioService.getUsersPublicBatch(missing);
      console.log("[userCache] Batch response:", JSON.stringify(res));
      const users = res?.users || res?.data?.users || [];
      console.log("[userCache] Parsed users count:", users.length);
      for (const u of users) {
        if (u?.id) {
          cache.set(String(u.id), u);
        }
      }
    } catch (err) {
      console.warn("[userCache] Error batch fetching users:", err.message);
    }

    return uniqueIds.map((id) => cache.get(id)).filter(Boolean);
  },

  // Resolve a single user: returns cached or fetches if missing
  async resolve(id) {
    if (!id) return null;
    const key = String(id);
    if (cache.has(key)) return cache.get(key);
    return this.fetchOne(id);
  },

  // Resolve multiple users: uses batch for missing ones
  async resolveMany(ids) {
    if (!ids || ids.length === 0) return [];
    return this.fetchMany(ids);
  },

  // Clear the cache
  clear() {
    cache.clear();
    resolvedUuid = null;
  },

  // Check if a user is cached
  has(id) {
    return cache.has(String(id));
  },
};

export default userCache;
