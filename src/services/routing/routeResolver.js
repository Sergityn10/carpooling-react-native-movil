// YouConnext - Route Resolver Service
// Resuelve la trayectoria real por carretera de los trayectos (API backend o Google Directions) con caché en memoria

import { decodePolyline, getTripOriginCoords, getTripDestinationCoords, areRouteCoordinatesValid } from "../../utils/mapGeoUtils";
import { trayectoService } from "../travels/trayectoService";
import { getDirectionsRoute } from "../googlePlaces";

// Caché en memoria para evitar peticiones repetidas (tripId -> coordinates[])
const routeCache = new Map();

// Promesas activas en vuelo para evitar llamadas duplicadas simultáneas
const pendingRequests = new Map();

/**
 * Obtiene la ruta resuelta desde la caché síncrona
 */
export function getCachedRoute(tripId) {
  if (!tripId) return null;
  return routeCache.get(String(tripId)) || null;
}

/**
 * Guarda manualmente una ruta en la caché
 */
export function setCachedRoute(tripId, coordinates) {
  if (!tripId || !Array.isArray(coordinates) || coordinates.length < 2) return;
  routeCache.set(String(tripId), coordinates);
}

/**
 * Limpia la caché de rutas
 */
export function clearRouteCache() {
  routeCache.clear();
  pendingRequests.clear();
}

/**
 * Resuelve la trayectoria completa de un viaje.
 * 1. Comprueba la caché en memoria.
 * 2. Decodifica `encodedPolyline` o `geometry.coordinates` si ya vienen en el viaje.
 * 3. Si faltan datos de carretera, consulta `obtenerTrayectoCompleto(trip.id)` al backend.
 * 4. Si aún no está disponible, calcula la ruta por carretera mediante Google Directions API.
 * 5. Fallback seguro: devuelve [origen, destino] sin lanzar excepciones.
 */
export async function resolveTripRoute(trip) {
  if (!trip) return [];
  const tripId = trip.id ? String(trip.id) : null;

  // 1. Verificar si ya está en caché
  if (tripId && routeCache.has(tripId)) {
    return routeCache.get(tripId);
  }

  const origin = getTripOriginCoords(trip);
  const destination = getTripDestinationCoords(trip);

  // 2. Comprobar si el objeto ya contiene la geometría directa
  // Prioridad 1: geometry.coordinates (GeoJSON LineString nativo, sin compresión con pérdida)
  if (trip.geometry?.coordinates && Array.isArray(trip.geometry.coordinates) && trip.geometry.coordinates.length >= 2) {
    const coords = trip.geometry.coordinates
      .map(([lng, lat]) => ({ latitude: Number(lat), longitude: Number(lng) }))
      .filter((pt) => !isNaN(pt.latitude) && !isNaN(pt.longitude));
    if (coords.length >= 2 && areRouteCoordinatesValid(coords, origin)) {
      if (tripId) routeCache.set(tripId, coords);
      return coords;
    }
  }

  // Prioridad 2: encodedPolyline (solo si decodifica a puntos coherentes con el origen)
  if (trip.encodedPolyline) {
    const decoded = decodePolyline(trip.encodedPolyline);
    if (decoded.length >= 2 && areRouteCoordinatesValid(decoded, origin)) {
      if (tripId) routeCache.set(tripId, decoded);
      return decoded;
    }
  }

  // 3. Comprobar tramos guardados (tramos / Tramos)
  const tramos = trip.tramos || trip.Tramos;
  if (Array.isArray(tramos) && tramos.length > 0) {
    const tramoCoords = [];
    tramos.forEach((tr) => {
      const oLat = tr.origen_lat ?? tr.start?.lat;
      const oLng = tr.origen_lng ?? tr.start?.lng;
      const dLat = tr.destino_lat ?? tr.end?.lat;
      const dLng = tr.destino_lng ?? tr.end?.lng;
      if (oLat != null && oLng != null) tramoCoords.push({ latitude: Number(oLat), longitude: Number(oLng) });
      if (dLat != null && dLng != null) tramoCoords.push({ latitude: Number(dLat), longitude: Number(dLng) });
    });
    if (tramoCoords.length >= 2 && areRouteCoordinatesValid(tramoCoords, origin)) {
      if (tripId) routeCache.set(tripId, tramoCoords);
      return tramoCoords;
    }
  }

  // 4. Si hay una petición en curso para este mismo tripId, reutilizarla
  if (tripId && pendingRequests.has(tripId)) {
    return pendingRequests.get(tripId);
  }

  const resolvePromise = (async () => {
    try {
      // 5. Intentar obtener el detalle completo del trayecto desde la API de viajes (con tramos y polyline)
      if (tripId) {
        try {
          const detalle = await trayectoService.obtenerTrayectoCompleto(tripId).catch(() => null);
          const data = detalle?.data || detalle;

          if (data?.encodedPolyline) {
            const decoded = decodePolyline(data.encodedPolyline);
            if (decoded.length >= 2) {
              routeCache.set(tripId, decoded);
              return decoded;
            }
          }

          if (data?.geometry?.coordinates && Array.isArray(data.geometry.coordinates) && data.geometry.coordinates.length >= 2) {
            const coords = data.geometry.coordinates
              .map(([lng, lat]) => ({ latitude: Number(lat), longitude: Number(lng) }))
              .filter((pt) => !isNaN(pt.latitude) && !isNaN(pt.longitude));
            if (coords.length >= 2) {
              routeCache.set(tripId, coords);
              return coords;
            }
          }

          const detTramos = data?.tramos || data?.Tramos;
          if (Array.isArray(detTramos) && detTramos.length > 0) {
            const tramoCoords = [];
            detTramos.forEach((tr) => {
              const oLat = tr.origen_lat ?? tr.start?.lat;
              const oLng = tr.origen_lng ?? tr.start?.lng;
              const dLat = tr.destino_lat ?? tr.end?.lat;
              const dLng = tr.destino_lng ?? tr.end?.lng;
              if (oLat != null && oLng != null) tramoCoords.push({ latitude: Number(oLat), longitude: Number(oLng) });
              if (dLat != null && dLng != null) tramoCoords.push({ latitude: Number(dLat), longitude: Number(dLng) });
            });
            if (tramoCoords.length >= 2) {
              routeCache.set(tripId, tramoCoords);
              return tramoCoords;
            }
          }
        } catch (e) {
          console.log("[routeResolver] Detalle completo de trayecto no disponible:", e.message);
        }
      }

      // 6. Si el backend no tiene la polilínea calculada, obtener la ruta exacta por carretera con Google Directions API
      if (origin && destination) {
        try {
          const directionsRes = await getDirectionsRoute({ origin, destination }).catch(() => null);
          if (directionsRes?.encodedPolyline) {
            const decoded = decodePolyline(directionsRes.encodedPolyline);
            if (decoded.length >= 2) {
              if (tripId) routeCache.set(tripId, decoded);
              return decoded;
            }
          }
        } catch (dirErr) {
          console.log("[routeResolver] Google Directions no disponible:", dirErr.message);
        }
      }

      // 7. Fallback seguro: línea directa origen -> destino
      if (origin && destination) {
        const direct = [origin, destination];
        if (tripId) routeCache.set(tripId, direct);
        return direct;
      }
    } catch (err) {
      console.warn("[routeResolver] Error resolviendo ruta:", err.message);
    } finally {
      if (tripId) pendingRequests.delete(tripId);
    }

    // Fallback final
    if (origin && destination) return [origin, destination];
    return [];
  })();

  if (tripId) pendingRequests.set(tripId, resolvePromise);
  return resolvePromise;
}

export const routeResolver = {
  resolveTripRoute,
  getCachedRoute,
  setCachedRoute,
  clearRouteCache,
};

export default routeResolver;