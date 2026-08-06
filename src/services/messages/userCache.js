// YouConnext - User Info Cache for Messages
// Caches public user info (id, name, img_perfil) so we don't refetch on every chat open.
import { usuarioService } from "../usuarioService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const cache = new Map();

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

let resolvedUuid = null;

const userCache = {
  // Resolve the current user's UUID from the JWT (not user.id from main API)
  async getMyUuid() {
    if (resolvedUuid) return resolvedUuid;
    try {
      const token = await AsyncStorage.getItem("@youconnext_token");
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          resolvedUuid = String(
            payload.id || payload.user_id || payload.userId || "",
          );
          console.log("[userCache] Resolved my UUID from JWT:", resolvedUuid);
        }
      }
    } catch {}
    return resolvedUuid || "";
  },

  // Synchronous version for use in render functions (returns cached value)
  getMyUuidSync() {
    return resolvedUuid || "";
  },

  // Get a single user from cache (no fetch)
  get(id) {
    if (!id) return null;
    return cache.get(String(id)) || null;
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
