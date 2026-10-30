// YouConnext - Event Info Cache for Messages
// Caches event info (id, name, image) so we don't refetch on every render/scroll.
import { eventService } from "../eventService";
import { homeCache } from "../homeCache";

const cache = new Map();

/**
 * Normaliza cualquier formato de imagen (base64 puro, data: URI, o http/https)
 */
export const getEventImageUri = (img) => {
  if (!img || typeof img !== "string") return null;
  const trimmed = img.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  return `data:image/jpeg;base64,${trimmed}`;
};

const eventChatCache = {
  get(id) {
    if (!id) return null;
    return cache.get(String(id)) || null;
  },

  set(id, event) {
    if (!id || !event) return;
    cache.set(String(id), event);
  },

  has(id) {
    return cache.has(String(id));
  },

  /**
   * Precarga eventos inscritos desde homeCache o desde eventService
   */
  async preloadFromJoinedEvents() {
    try {
      const fromHome = homeCache.getJoinedEvents();
      if (Array.isArray(fromHome) && fromHome.length > 0) {
        fromHome.forEach((ev) => {
          if (ev?.id) {
            cache.set(String(ev.id), ev);
          }
        });
        return;
      }

      const res = await eventService.getMyJoinedEvents();
      const events = Array.isArray(res)
        ? res
        : Array.isArray(res?.events)
          ? res.events
          : Array.isArray(res?.data)
            ? res.data
            : [];

      events.forEach((ev) => {
        if (ev?.id) {
          cache.set(String(ev.id), ev);
        }
      });
    } catch (e) {
      // Silencioso para no bloquear el flujo de chat
      console.warn("[eventChatCache] Preload error:", e?.message);
    }
  },

  /**
   * Resuelve un evento específico por ID
   */
  async resolve(id) {
    if (!id) return null;
    const key = String(id);
    if (cache.has(key)) return cache.get(key);

    try {
      const res = await eventService.getEventById(key);
      const ev = res?.event || res?.data || res || null;
      if (ev && ev.id) {
        cache.set(key, ev);
        return ev;
      }
      return null;
    } catch (err) {
      console.warn("[eventChatCache] Error fetching event", id, err?.message);
      return null;
    }
  },

  /**
   * Resuelve múltiples eventos en paralelo para los que no están en caché
   */
  async resolveMany(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const uniqueIds = [...new Set(ids.map(String))].filter(Boolean);
    const missing = uniqueIds.filter((id) => !cache.has(id));

    if (missing.length > 0) {
      await Promise.allSettled(
        missing.map(async (id) => {
          try {
            const res = await eventService.getEventById(id);
            const ev = res?.event || res?.data || res || null;
            if (ev && ev.id) {
              cache.set(String(id), ev);
            }
          } catch {}
        }),
      );
    }

    return uniqueIds.map((id) => cache.get(id)).filter(Boolean);
  },

  clear() {
    cache.clear();
  },
};

export default eventChatCache;
