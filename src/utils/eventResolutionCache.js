// YouConnext - Pure client-side cache for resolving EVENTO alert IDs to readable metadata

export function normalizeEventSummary(rawEvent) {
  if (!rawEvent) return null;
  const ev = rawEvent.event && typeof rawEvent.event === "object" ? rawEvent.event : rawEvent;
  if (!ev?.id) return null;

  return {
    id: String(ev.id),
    name: ev.name || ev.title || "Evento de interés",
    start_date: ev.start_date || null,
    end_date: ev.end_date || null,
    image: ev.image || null,
    city: ev.city || ev.company?.name || ev.enterprise?.name || null,
    raw: ev,
  };
}

export function createEventResolutionCache() {
  const cache = new Map();

  const seed = (eventsList = []) => {
    if (!Array.isArray(eventsList)) return;
    for (const item of eventsList) {
      const summary = normalizeEventSummary(item);
      if (summary) {
        cache.set(summary.id, summary);
      }
    }
  };

  const get = (id) => {
    if (!id) return null;
    return cache.get(String(id)) || null;
  };

  const getSnapshot = () => {
    const out = {};
    for (const [key, val] of cache.entries()) {
      out[key] = val;
    }
    return out;
  };

  const resolveMissing = async (ids = [], fetchEventById) => {
    const uniqueIds = [
      ...new Set(
        (Array.isArray(ids) ? ids : [])
          .map((id) => (id ? String(id).trim() : ""))
          .filter(Boolean),
      ),
    ];

    const missingIds = uniqueIds.filter((id) => !cache.has(id));
    if (missingIds.length === 0 || typeof fetchEventById !== "function") {
      return getSnapshot();
    }

    const results = await Promise.allSettled(
      missingIds.map((id) => fetchEventById(id)),
    );

    results.forEach((result, idx) => {
      const id = missingIds[idx];
      if (result.status === "fulfilled" && result.value) {
        const summary = normalizeEventSummary(result.value);
        if (summary) {
          cache.set(id, summary);
          return;
        }
      }
      // Fallback para eventos eliminados/404: evita re-consultar indefinidamente y evita UUID crudo
      cache.set(id, {
        id,
        name: "Evento no disponible",
        start_date: null,
        end_date: null,
        image: null,
        city: null,
        unavailable: true,
      });
    });

    return getSnapshot();
  };

  const clear = () => {
    cache.clear();
  };

  return {
    seed,
    get,
    getSnapshot,
    resolveMissing,
    clear,
  };
}
