// YouConnext - Storage Manager (Protección contra SQLITE_FULL y Gestión Segura de Caché)
import AsyncStorage from "@react-native-async-storage/async-storage";

// Claves de caché secundarias que se pueden purgar sin perder la sesión del usuario
const VOLATILE_CACHE_KEYS = [
  "@youconnext_movements_cache",
  "@youconnext_enterprise_events",
  "@youconnext_enterprise_members",
  "@youconnext_map_cache",
];

// Comprobar si un error corresponde a almacenamiento SQLite desbordado
export function isSqliteFullError(error) {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  return (
    msg.includes("sqlite_full") ||
    msg.includes("code 13") ||
    msg.includes("database or disk is full") ||
    msg.includes("cursorwindowallocationexception") ||
    msg.includes("row too big") ||
    msg.includes("no space left on device") ||
    msg.includes("could not allocate cursorwindow")
  );
}

// Sanitizar valores antes de persistir para evitar desbordar el CursorWindow (2 MB) o SQLite (6 MB)
export function sanitizeValue(rawVal, aggressive = false) {
  if (!rawVal) return rawVal;

  let parsed = null;
  let isObject = false;

  if (typeof rawVal === "object") {
    parsed = { ...rawVal };
    isObject = true;
  } else if (typeof rawVal === "string") {
    // Si la cadena cruda es un Base64 gigante directo (> 100 KB)
    if (rawVal.startsWith("data:image/") && rawVal.length > 100000) {
      return aggressive ? null : rawVal.slice(0, 1000);
    }
    try {
      parsed = JSON.parse(rawVal);
      isObject = typeof parsed === "object" && parsed !== null;
    } catch {
      return rawVal;
    }
  }

  if (!isObject || !parsed) return rawVal;

  // Sanitizar campos multimedia comunes que suelen inflar el JSON
  const mediaKeys = ["img_perfil", "avatar", "logo", "image", "photo"];
  for (const k of mediaKeys) {
    if (parsed[k] && typeof parsed[k] === "string") {
      // Si contiene un data URI o base64 de más de 80 KB
      if (parsed[k].startsWith("data:image/") || parsed[k].length > 80000) {
        if (aggressive) {
          parsed[k] = null;
        } else if (parsed[k].length > 200000) {
          // Truncar para que no desborde el CursorWindow de 2MB
          parsed[k] = null;
        }
      }
    }
  }

  return JSON.stringify(parsed);
}

// Purgar cachés prescindibles para liberar espacio inmediato en SQLite
export async function purgeVolatileCaches() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(
      (k) =>
        VOLATILE_CACHE_KEYS.includes(k) ||
        k.startsWith("@youconnext_enterprise_checkins_") ||
        k.startsWith("@youconnext_cache_")
    );

    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
      console.log(`[StorageManager] Se purgaron ${toRemove.length} claves de caché volátil.`);
    }
    return true;
  } catch (err) {
    console.warn("[StorageManager] Error purgando cachés volátiles:", err?.message);
    return false;
  }
}

// Guardado seguro de un único elemento con auto-recuperación ante SQLITE_FULL
export async function safeSetItem(key, value) {
  try {
    const sanitized = sanitizeValue(value, false);
    await AsyncStorage.setItem(key, sanitized);
  } catch (error) {
    if (isSqliteFullError(error)) {
      console.warn(`[StorageManager] SQLITE_FULL en setItem (${key}). Ejecutando auto-purga...`);
      await purgeVolatileCaches();
      try {
        const sanitizedAggressive = sanitizeValue(value, true);
        await AsyncStorage.setItem(key, sanitizedAggressive);
      } catch (retryError) {
        console.error(`[StorageManager] Fallo en reintento de setItem (${key}):`, retryError?.message);
      }
    } else {
      throw error;
    }
  }
}

// Guardado seguro por lotes atómico con auto-recuperación ante SQLITE_FULL
export async function safeMultiSet(pairs) {
  if (!pairs || !Array.isArray(pairs) || pairs.length === 0) return;

  try {
    const sanitizedPairs = pairs.map(([k, v]) => [k, sanitizeValue(v, false)]);
    await AsyncStorage.multiSet(sanitizedPairs);
  } catch (error) {
    if (isSqliteFullError(error)) {
      console.warn("[StorageManager] SQLITE_FULL en multiSet. Purgando almacenamiento volátil y reintentando...");
      await purgeVolatileCaches();
      try {
        const aggressivePairs = pairs.map(([k, v]) => [k, sanitizeValue(v, true)]);
        await AsyncStorage.multiSet(aggressivePairs);
      } catch (retryError) {
        console.error("[StorageManager] Fallo en reintento de multiSet:", retryError?.message);
        // Si aún falla, guardar al menos la clave principal de usuario de forma individual
        for (const [k, v] of pairs) {
          try {
            await AsyncStorage.setItem(k, sanitizeValue(v, true));
          } catch (e) {}
        }
      }
    } else {
      throw error;
    }
  }
}

// Resumen del estado de uso de almacenamiento
export async function getStorageUsageSummary() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(allKeys);
    let totalBytes = 0;
    const keyBreakdown = [];

    for (const [k, v] of pairs) {
      const bytes = (k.length + (v ? v.length : 0)) * 2; // UTF-16 approx
      totalBytes += bytes;
      keyBreakdown.push({ key: k, bytes });
    }

    keyBreakdown.sort((a, b) => b.bytes - a.bytes);

    return {
      totalKeys: allKeys.length,
      totalBytes,
      totalKB: Math.round(totalBytes / 1024),
      totalMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
      largestKeys: keyBreakdown.slice(0, 5),
    };
  } catch (err) {
    console.warn("[StorageManager] No se pudo obtener uso de almacenamiento:", err?.message);
    return null;
  }
}

export const storageManager = {
  isSqliteFullError,
  sanitizeValue,
  purgeVolatileCaches,
  safeSetItem,
  safeMultiSet,
  getStorageUsageSummary,
};

export default storageManager;
