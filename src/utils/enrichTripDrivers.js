// YouConnext - Utilidad de Enriquecimiento de Perfiles Públicos de Conductores
// Recupera fotos, nombres y calificaciones de forma óptima, asíncrona y con tolerancia total a fallos

import { usuarioService } from "../services/usuarioService";
import userCache from "../services/messages/userCache";

// Caché en memoria de perfiles públicos de conductores
const driverProfileCache = new Map();

/**
 * Extrae el ID del conductor desde cualquier variante del objeto de trayecto
 */
export function getTripDriverId(trip) {
  if (!trip) return null;
  if (trip.conductor_id) return String(trip.conductor_id);
  if (trip.conductorId) return String(trip.conductorId);
  if (typeof trip.conductor === "string") return String(trip.conductor);
  if (trip.conductor && typeof trip.conductor === "object" && trip.conductor.id) {
    return String(trip.conductor.id);
  }
  if (trip.driver_id) return String(trip.driver_id);
  return null;
}

/**
 * Enriquece los trayectos con las propiedades públicas de sus conductores (foto, nombre, rating)
 * - Consulta la caché en memoria primero para evitar peticiones duplicadas
 * - Utiliza batch fetching para optimizar las peticiones de red
 * - En caso de error o ausencia de red, devuelve los trayectos originales intactos
 */
export async function enrichTripsWithDriverProfiles(trips) {
  if (!Array.isArray(trips) || trips.length === 0) return trips || [];

  // Extraer IDs de conductores únicos
  const driverIds = [];
  trips.forEach((t) => {
    const dId = getTripDriverId(t);
    if (dId && !driverIds.includes(dId)) {
      driverIds.push(dId);
    }
  });

  if (driverIds.length === 0) return trips;

  // Filtrar IDs que aún no están en caché
  const missingIds = driverIds.filter(
    (id) => !driverProfileCache.has(id) && !userCache.has(id)
  );

  if (missingIds.length > 0) {
    try {
      // 1. Intentar recuperación en lote (Batch)
      const batchRes = await usuarioService.getUsersPublicBatch(missingIds).catch(() => null);
      const users = batchRes?.users || batchRes?.data?.users || (Array.isArray(batchRes) ? batchRes : []);

      if (Array.isArray(users) && users.length > 0) {
        users.forEach((u) => {
          if (u?.id) {
            driverProfileCache.set(String(u.id), u);
          }
        });
      }

      // 2. Si quedan IDs sin recuperar, consultar endpoints públicos individuales de forma paralela y segura
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
                return;
              }

              // Fallback a perfil público general
              const profileRes = await usuarioService.getUserPublicProfile(id).catch(() => null);
              const prof = profileRes?.user || profileRes?.data?.user || profileRes?.data;
              if (prof) {
                driverProfileCache.set(String(id), prof);
              }
            } catch {}
          })
        );
      }
    } catch (err) {
      console.log("[enrichTripDrivers] Error recuperando perfiles:", err.message);
    }
  }

  // Mapear los trayectos con los datos de conductor enriquecidos
  return trips.map((trip) => {
    const driverId = getTripDriverId(trip);
    if (!driverId) return trip;

    const profile = driverProfileCache.get(driverId) || userCache.get(driverId);
    if (!profile) return trip;

    const img_perfil =
      trip.img_perfil ||
      trip.conductor_img ||
      profile.img_perfil ||
      profile.avatar ||
      profile.photo ||
      (typeof trip.conductor === "object" ? trip.conductor?.img_perfil : null);

    const conductorNombre =
      profile.name ||
      profile.nombre ||
      (typeof trip.conductor === "object"
        ? trip.conductor?.nombre || trip.conductor?.name
        : typeof trip.conductor === "string" && !trip.conductor.includes("-")
        ? trip.conductor
        : null) ||
      trip.conductorNombre ||
      "Conductor";

    const conductorRating =
      profile.averageRating ||
      profile.rating ||
      trip.conductorRating ||
      (typeof trip.conductor === "object" ? trip.conductor?.rating : 4.9);

    return {
      ...trip,
      img_perfil,
      conductor_img: img_perfil,
      conductorRating,
      conductor:
        typeof trip.conductor === "object"
          ? {
              ...trip.conductor,
              id: driverId,
              nombre: conductorNombre,
              name: conductorNombre,
              img_perfil,
              rating: conductorRating,
            }
          : {
              id: driverId,
              nombre: conductorNombre,
              name: conductorNombre,
              img_perfil,
              rating: conductorRating,
            },
    };
  });
}

export default enrichTripsWithDriverProfiles;