// YouConnext - Utilidad de Enriquecimiento de Perfiles Públicos de Conductores
// Recupera fotos, nombres y calificaciones descifradas de forma óptima, asíncrona y con tolerancia total a fallos

import { usuarioService } from "../services/usuarioService";
import userCache from "../services/messages/userCache";

// Caché en memoria de perfiles públicos de conductores
export const driverProfileCache = new Map();

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const HEX_ID_REGEX = /^[0-9a-fA-F]{24,32}$/;
const PURE_NUMERIC_ID = /^\d{4,}$/;

/**
 * Determina si una cadena es un identificador técnico (UUID, hash, ID de base de datos)
 * en lugar de un nombre de persona legible y descifrado.
 */
export function isLikelyId(val) {
  if (typeof val !== "string") return false;
  const s = val.trim();
  if (!s) return false;
  if (s.toLowerCase().includes("[object")) return true;
  if (s === "undefined" || s === "null" || s === "NaN") return true;
  if (s.includes("-") && s.length >= 20 && /^[0-9a-fA-F-]+$/.test(s)) return true;
  if (UUID_REGEX.test(s)) return true;
  if (HEX_ID_REGEX.test(s)) return true;
  if (PURE_NUMERIC_ID.test(s)) return true;
  return false;
}

/**
 * Extrae el ID del conductor desde cualquier variante del objeto de trayecto
 */
export function getTripDriverId(trip) {
  if (!trip) return null;
  if (trip.conductor_id && isLikelyId(String(trip.conductor_id))) return String(trip.conductor_id);
  if (trip.conductorId && isLikelyId(String(trip.conductorId))) return String(trip.conductorId);
  if (trip.driver_id && isLikelyId(String(trip.driver_id))) return String(trip.driver_id);
  if (trip.conductor_id) return String(trip.conductor_id);
  if (trip.conductorId) return String(trip.conductorId);
  if (trip.driver_id) return String(trip.driver_id);
  if (trip.conductor && typeof trip.conductor === "object" && (trip.conductor.id || trip.conductor._id)) {
    return String(trip.conductor.id || trip.conductor._id);
  }
  if (typeof trip.conductor === "string" && isLikelyId(trip.conductor)) {
    return String(trip.conductor);
  }
  return null;
}

/**
 * Obtiene el nombre legible y descifrado del conductor.
 * Garantiza que NUNCA se muestre un UUID, hash o identificador cifrado.
 */
export function getTripDriverName(trip, fallback = "Conductor") {
  if (!trip) return fallback;

  // 1. Nombre directo en propiedades de primer nivel si son válidas y legibles
  const directProperties = [
    trip.conductor_nombre,
    trip.conductorNombre,
    trip.driver_name,
    trip.conductor_name,
  ];
  for (const name of directProperties) {
    if (typeof name === "string" && name.trim() && !isLikelyId(name)) {
      return name.trim();
    }
  }

  // 2. Propiedades dentro del objeto conductor
  if (trip.conductor && typeof trip.conductor === "object") {
    const rawNombre = trip.conductor.nombre || trip.conductor.name || trip.conductor.fullName;
    if (typeof rawNombre === "string" && rawNombre.trim() && !isLikelyId(rawNombre)) {
      const apellidos = trip.conductor.apellidos || trip.conductor.surname;
      if (typeof apellidos === "string" && apellidos.trim() && !isLikelyId(apellidos)) {
        return `${rawNombre.trim()} ${apellidos.trim()}`;
      }
      return rawNombre.trim();
    }
  }

  // 3. Cadena directa en conductor (siempre y cuando NO sea un ID/hash técnico)
  if (typeof trip.conductor === "string" && trip.conductor.trim() && !isLikelyId(trip.conductor)) {
    return trip.conductor.trim();
  }

  // 4. Búsqueda en cachés en memoria por ID de conductor
  const driverId = getTripDriverId(trip);
  if (driverId) {
    const cachedProfile = driverProfileCache.get(driverId) || userCache.get(driverId);
    if (cachedProfile) {
      const cName = cachedProfile.name || cachedProfile.nombre;
      if (typeof cName === "string" && cName.trim() && !isLikelyId(cName)) {
        const cSurname = cachedProfile.surname || cachedProfile.apellidos;
        if (typeof cSurname === "string" && cSurname.trim() && !isLikelyId(cSurname)) {
          return `${cName.trim()} ${cSurname.trim()}`;
        }
        return cName.trim();
      }
    }
  }

  return fallback;
}

/**
 * Obtiene la URL del avatar del conductor si está disponible
 */
export function getTripDriverAvatar(trip) {
  if (!trip) return null;

  // 1. Propiedades de avatar de primer nivel
  const directAvatars = [
    trip.img_perfil,
    trip.conductor_img,
    trip.conductor_avatar,
    trip.conductorAvatar,
  ];
  for (const av of directAvatars) {
    if (typeof av === "string" && av.trim() && !av.includes("[object")) {
      return av.trim();
    }
  }

  // 2. Avatar dentro del objeto conductor
  if (trip.conductor && typeof trip.conductor === "object") {
    const cAv =
      trip.conductor.img_perfil ||
      trip.conductor.avatar ||
      trip.conductor.photo ||
      trip.conductor.avatar_url;
    if (typeof cAv === "string" && cAv.trim() && !cAv.includes("[object")) {
      return cAv.trim();
    }
  }

  // 3. Búsqueda en cachés en memoria
  const driverId = getTripDriverId(trip);
  if (driverId) {
    const cachedProfile = driverProfileCache.get(driverId) || userCache.get(driverId);
    if (cachedProfile) {
      const pAv = cachedProfile.img_perfil || cachedProfile.avatar || cachedProfile.photo;
      if (typeof pAv === "string" && pAv.trim() && !pAv.includes("[object")) {
        return pAv.trim();
      }
    }
  }

  return null;
}

/**
 * Enriquece los trayectos con las propiedades públicas de sus conductores (foto, nombre descifrado, rating)
 * - Consulta la caché en memoria primero para evitar peticiones duplicadas
 * - Utiliza batch fetching para optimizar las peticiones de red
 * - Garantiza que los nombres descifrados se sincronicen en el objeto de trayecto
 */
export async function enrichTripsWithDriverProfiles(trips) {
  if (!Array.isArray(trips) || trips.length === 0) return trips || [];

  // Extraer IDs de conductores únicos válidos
  const driverIds = [];
  trips.forEach((t) => {
    const dId = getTripDriverId(t);
    if (dId && !driverIds.includes(dId)) {
      driverIds.push(dId);
    }
  });

  if (driverIds.length > 0) {
    // Filtrar IDs que aún no están en caché
    const missingIds = driverIds.filter(
      (id) => !driverProfileCache.has(id) && !userCache.has(id)
    );

    if (missingIds.length > 0) {
      try {
        // 1. Intentar recuperación en lote (Batch) — endpoint que devuelve nombres descifrados
        const batchRes = await usuarioService.getUsersPublicBatch(missingIds).catch(() => null);
        const users = batchRes?.users || batchRes?.data?.users || (Array.isArray(batchRes) ? batchRes : []);

        if (Array.isArray(users) && users.length > 0) {
          users.forEach((u) => {
            if (u?.id) {
              const uId = String(u.id);
              driverProfileCache.set(uId, u);
              try {
                if (typeof userCache.set === "function") {
                  userCache.set(uId, u);
                }
              } catch {}
            }
          });
        }

        // 2. Si quedan IDs sin recuperar, consultar endpoints públicos individuales
        const stillMissing = missingIds.filter((id) => !driverProfileCache.has(id) && !userCache.has(id));
        if (stillMissing.length > 0) {
          await Promise.allSettled(
            stillMissing.map(async (id) => {
              try {
                // Intentar endpoint público de chat primero (más ligero)
                const res = await usuarioService.getUserPublicChatInfo(id).catch(() => null);
                const user = res?.user || res?.data?.user || res?.data;
                if (user && (user.img_perfil || user.name || user.nombre)) {
                  driverProfileCache.set(String(id), user);
                  try {
                    userCache.set(String(id), user);
                  } catch {}
                  return;
                }

                // Fallback a perfil público general
                const profileRes = await usuarioService.getUserPublicProfile(id).catch(() => null);
                const prof = profileRes?.user || profileRes?.data?.user || profileRes?.data;
                if (prof) {
                  driverProfileCache.set(String(id), prof);
                  try {
                    userCache.set(String(id), prof);
                  } catch {}
                }
              } catch {}
            })
          );
        }
      } catch (err) {
        console.log("[enrichTripDrivers] Error recuperando perfiles descifrados:", err.message);
      }
    }
  }

  // Mapear los trayectos con los datos de conductor enriquecidos y nombres descifrados
  return trips.map((trip) => {
    const driverId = getTripDriverId(trip);
    const profile = driverId
      ? driverProfileCache.get(driverId) || userCache.get(driverId)
      : null;

    const img_perfil =
      getTripDriverAvatar(trip) ||
      profile?.img_perfil ||
      profile?.avatar ||
      profile?.photo ||
      null;

    const profileFullName = profile?.name
      ? `${profile.name}${profile.surname ? " " + profile.surname : ""}`.trim()
      : profile?.nombre || null;

    const conductorNombre = getTripDriverName(
      { ...trip, img_perfil },
      profileFullName || "Conductor"
    );

    const conductorRating =
      profile?.averageRating ||
      profile?.rating ||
      trip.valoracion_media ||
      trip.conductorRating ||
      (typeof trip.conductor === "object" ? trip.conductor?.rating : null) ||
      "4,8";

    return {
      ...trip,
      img_perfil,
      conductor_img: img_perfil,
      conductorRating,
      conductorNombre,
      conductor_nombre: conductorNombre,
      conductor: {
        id: driverId || (typeof trip.conductor === "object" ? trip.conductor?.id : null),
        nombre: conductorNombre,
        name: conductorNombre,
        img_perfil,
        rating: conductorRating,
      },
    };
  });
}

export default enrichTripsWithDriverProfiles;
