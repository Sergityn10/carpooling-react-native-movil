// YouConnext - Caché en Cliente para Viewports de Mapa
// LRU con TTL de 30s y validación de contención geoespacial

const CACHE_TTL = 30000;
const MAX_CACHE_SIZE = 50;

class MapViewportCache {
  constructor() {
    this.cache = new Map();
  }

  generateKey(bounds, zoom, filters = {}) {
    const filterKey = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");

    const boundsKey = `${bounds.minLat.toFixed(4)},${bounds.minLng.toFixed(4)},${bounds.maxLat.toFixed(4)},${bounds.maxLng.toFixed(4)},${zoom}`;
    return filterKey ? `${boundsKey}|${filterKey}` : boundsKey;
  }

  isContainedInCached(newBounds, cachedBounds) {
    return (
      newBounds.minLat >= cachedBounds.minLat &&
      newBounds.maxLat <= cachedBounds.maxLat &&
      newBounds.minLng >= cachedBounds.minLng &&
      newBounds.maxLng <= cachedBounds.maxLng
    );
  }

  isExpired(entry) {
    return Date.now() - entry.timestamp > CACHE_TTL;
  }

  get(bounds, zoom, filters = {}) {
    const key = this.generateKey(bounds, zoom, filters);
    const now = Date.now();

    const exactEntry = this.cache.get(key);
    if (exactEntry && !this.isExpired(exactEntry)) {
      this.cache.delete(key);
      this.cache.set(key, { ...exactEntry, timestamp: now });
      return exactEntry.data;
    }

    for (const [cacheKey, entry] of this.cache.entries()) {
      if (!this.isExpired(entry) && this.isContainedInCached(bounds, entry.bounds)) {
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, { ...entry, timestamp: now });
        return entry.data;
      }
    }

    return null;
  }

  set(bounds, zoom, filters, data) {
    const key = this.generateKey(bounds, zoom, filters);
    const now = Date.now();

    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      bounds,
      zoom,
      filters: { ...filters },
      data,
      timestamp: now,
    });
  }

  clear() {
    this.cache.clear();
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        age: Date.now() - entry.timestamp,
        tripCount: entry.data?.length || 0,
      })),
    };
  }
}

export const mapViewportCache = new MapViewportCache();

export function getCachedOrFetch(bounds, zoom, filters, fetchFn) {
  const cached = mapViewportCache.get(bounds, zoom, filters);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return Promise.resolve(cached);
  }

  return fetchFn().then((data) => {
    // Solo cachear si la respuesta contiene datos válidos (evita cachear respuestas vacías o canceladas)
    if (Array.isArray(data) && data.length > 0) {
      mapViewportCache.set(bounds, zoom, filters, data);
    }
    return data;
  });
}