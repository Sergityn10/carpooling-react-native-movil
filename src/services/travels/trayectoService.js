// YouConnext - Trayecto Service (api-travels)
import httpClient from "./httpClient";
import { parseTripDate } from "../dateUtils";

// Obtener todos los trayectos — GET /api/trayecto (paginado)
async function obtenerTrayectos({ page, limit } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(`/api/trayecto${query}`);
}

// Buscar trayectos — GET /api/trayecto/search
async function buscarTrayectos({
  origin,
  destination,
  date,
  passengers,
  page,
  limit,
}) {
  const params = new URLSearchParams({
    origin,
    destination,
    date,
    passengers: String(passengers),
  });
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  return httpClient.request(`/api/trayecto/search?${params.toString()}`);
}

// Obtener mis trayectos (como conductor) — GET /api/trayecto/mis-trayectos (paginado)
async function obtenerMisTrayectos({ page, limit } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(`/api/trayecto/mis-trayectos${query}`);
}

// Obtener próximos trayectos (conductor o pasajero) — GET /api/trayecto/proximos
async function obtenerProximosTrayectos() {
  return httpClient.request("/api/trayecto/proximos");
}

// Obtener trayecto por ID — GET /api/trayecto/:id
async function obtenerTrayectoPorId(id) {
  return httpClient.request(`/api/trayecto/${id}`);
}

// Obtener trayecto completo (con pasajeros, eventos, comentarios) — GET /api/trayecto/:id/completo
async function obtenerTrayectoCompleto(id) {
  return httpClient.request(`/api/trayecto/${id}/completo`);
}

// Obtener estado del trayecto (perspectiva del pasajero) — GET /api/trayecto/:id/estado
async function obtenerEstadoTrayecto(id) {
  return httpClient.request(`/api/trayecto/${id}/estado`);
}

// Crear trayecto — POST /api/trayecto
async function crearTrayecto(datos) {
  return httpClient.request("/api/trayecto", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Actualizar coordenadas de un trayecto — PUT /api/trayecto/update/id/:id
async function actualizarCoordenadasTrayecto(id) {
  return httpClient.request(`/api/trayecto/update/id/${id}`, {
    method: "PUT",
  });
}

// Actualizar coordenadas de todos los trayectos — PUT /api/trayecto/update
async function actualizarCoordenadasTodos() {
  return httpClient.request("/api/trayecto/update", {
    method: "PUT",
  });
}

// Actualizar trayecto (PUT) — PUT /api/trayecto/:id
async function actualizarTrayectoPut(id, datos) {
  return httpClient.request(`/api/trayecto/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// Actualizar trayecto (PATCH) — PATCH /api/trayecto/:id
async function actualizarTrayectoPatch(id, datos) {
  return httpClient.request(`/api/trayecto/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

// Iniciar trayecto — POST /api/trayecto/:id/iniciar
async function iniciarTrayecto(id) {
  return httpClient.request(`/api/trayecto/${id}/iniciar`, {
    method: "POST",
  });
}

// Guardar ubicación del recorrido — POST /api/trayecto/:id/recorrido
async function guardarRecorrido(id, { lat, lng, address }) {
  return httpClient.request(`/api/trayecto/${id}/recorrido`, {
    method: "POST",
    body: JSON.stringify({ lat, lng, address }),
  });
}

// Obtener recorrido del trayecto — GET /api/trayecto/:id/recorrido
async function obtenerRecorrido(id) {
  return httpClient.request(`/api/trayecto/${id}/recorrido`);
}

// Finalizar trayecto — POST /api/trayecto/:id/finalizar
async function finalizarTrayecto(id) {
  return httpClient.request(`/api/trayecto/${id}/finalizar`, {
    method: "POST",
  });
}

// Crear evento de trayecto (recogida, etc.) — POST /api/trayecto/:id/recoger
async function crearEventoTrayecto(id, { lat, lng, tipo_evento, id_reserva }) {
  return httpClient.request(`/api/trayecto/${id}/recoger`, {
    method: "POST",
    body: JSON.stringify({ lat, lng, tipo_evento, id_reserva }),
  });
}

// Obtener eventos de un trayecto — GET /api/trayecto/:id/recoger
async function obtenerEventosTrayecto(id) {
  return httpClient.request(`/api/trayecto/${id}/recoger`);
}

// Registrar llegada a destino — POST /api/trayecto/:id/llegada
async function registrarLlegadaDestino(id, { lat, lng }) {
  return httpClient.request(`/api/trayecto/${id}/llegada`, {
    method: "POST",
    body: JSON.stringify({ lat, lng }),
  });
}

// Obtener trayectos por conductor — GET /api/trayecto/conductor/:id (paginado)
async function obtenerTrayectosPorConductor(conductorId, { page, limit } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(`/api/trayecto/conductor/${conductorId}${query}`);
}

// Obtener trayectos por evento — GET /api/trayecto/evento/:eventoId?direccion=ida|vuelta
async function obtenerTrayectosPorEvento(eventoId, direccion) {
  const query = direccion ? `?direccion=${direccion}` : "";
  return httpClient.request(`/api/trayecto/evento/${eventoId}${query}`);
}

// Buscar trayectos por evento cerca de tu ubicación — GET /api/trayecto/evento/:eventoId/cerca
async function buscarTrayectosPorEventoCerca(
  eventoId,
  { lat, lng, ciudad, radius, direccion, fecha } = {},
) {
  const params = new URLSearchParams();
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));
  if (ciudad) params.set("ciudad", ciudad);
  if (radius != null) params.set("radius", String(radius));
  if (direccion) params.set("direccion", direccion);
  if (fecha) params.set("fecha", fecha);
  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(`/api/trayecto/evento/${eventoId}/cerca${query}`);
}

// Crear trayecto hacia un evento — POST /api/trayecto/evento
async function crearTrayectoEvento(datos) {
  return httpClient.request("/api/trayecto/evento", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Obtener historial de búsquedas — GET /api/trayecto/search-history
async function obtenerHistorialBusquedas({ page, limit } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(`/api/trayecto/search-history${query}`);
}

// Eliminar trayecto — DELETE /api/trayecto/:id
async function eliminarTrayecto(id) {
  return httpClient.request(`/api/trayecto/${id}`, {
    method: "DELETE",
  });
}

// Obtener trayectos por viewport (mapa interactivo v2.0) — GET /api/trayecto/viewport
async function obtenerTrayectosViewport(
  { minLat, maxLat, minLng, maxLng, zoom, precision, format = "both", limit = 50, date, minSeats, maxPrice, eventoId } = {},
  signal
) {
  const params = new URLSearchParams();
  if (minLat != null) params.set("minLat", String(minLat));
  if (maxLat != null) params.set("maxLat", String(maxLat));
  if (minLng != null) params.set("minLng", String(minLng));
  if (maxLng != null) params.set("maxLng", String(maxLng));
  if (zoom != null) params.set("zoom", String(zoom));
  params.set("precision", precision || (zoom < 10 ? "bounds" : zoom < 15 ? "simplified" : "full"));
  params.set("format", format || "both");
  if (limit) params.set("limit", String(limit));

  // Duplicar parámetros fecha y plazas para compatibilidad total con la API v1 y v2
  if (date) {
    params.set("fecha", date);
    params.set("date", date);
  }
  if (minSeats) {
    params.set("plazas", String(minSeats));
    params.set("minSeats", String(minSeats));
  }
  if (maxPrice) params.set("maxPrice", String(maxPrice));
  if (eventoId) params.set("eventoId", eventoId);

  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(`/api/trayecto/viewport${query}`, { signal });
}

// Fallback local: filtrar trayectos disponibles por BBox (cuando el backend no tiene endpoint /viewport)
async function obtenerTrayectosViewportLocal(
  { minLat, maxLat, minLng, maxLng, zoom, precision, limit = 50, date, minSeats, maxPrice, eventoId } = {}
) {
  try {
    const res = await obtenerTrayectos({ limit: 200 });
    const allTrips = Array.isArray(res) ? res : res?.data || res?.trayectos || [];
    const now = Date.now();

    return allTrips
      .filter((t) => {
        const estado = (t.status || t.estado || "").toLowerCase();
        const disponible = t.disponible ?? t.plazas ?? 0;
        const tripDateObj = parseTripDate(t);
        const tripTime = tripDateObj ? tripDateObj.getTime() : 0;
        const hasCoords =
          t.origen_lat != null &&
          t.origen_lng != null &&
          t.destino_lat != null &&
          t.destino_lng != null;

        return (
          estado !== "cancelado" &&
          estado !== "completado" &&
          disponible > 0 &&
          tripTime > now &&
          hasCoords &&
          t.origen_lat >= minLat &&
          t.origen_lat <= maxLat &&
          t.origen_lng >= minLng &&
          t.origen_lng <= maxLng
        );
      })
      .filter((t) => {
        if (date && t.hora) {
          const tripDateObj = parseTripDate(t);
          if (!tripDateObj) return true;
          const tripDateStr = tripDateObj.toISOString().split("T")[0];
          return tripDateStr === date;
        }
        return true;
      })
      .filter((t) => {
        if (minSeats && (t.disponible ?? t.plazas ?? 0) < minSeats) return false;
        return true;
      })
      .filter((t) => {
        if (maxPrice && t.precio > maxPrice) return false;
        return true;
      })
      .filter((t) => {
        if (eventoId && t.evento_id !== eventoId && t.eventoId !== eventoId) return false;
        return true;
      })
      .slice(0, limit)
      .map((t) => ({
        ...t,
        puntosClave: {
          origen: { lat: Number(t.origen_lat), lng: Number(t.origen_lng) },
          destino: { lat: Number(t.destino_lat), lng: Number(t.destino_lng) },
        },
        geometry:
          t.geometry ||
          (Array.isArray(t.tramos || t.Tramos) && (t.tramos || t.Tramos).length > 0
            ? {
                type: "LineString",
                coordinates: (t.tramos || t.Tramos).flatMap((tr) => [
                  [Number(tr.origen_lng || tr.start?.lng), Number(tr.origen_lat || tr.start?.lat)],
                  [Number(tr.destino_lng || tr.end?.lng), Number(tr.destino_lat || tr.end?.lat)],
                ]),
              }
            : undefined),
      }));
  } catch (err) {
    console.warn("Fallback local viewport falló:", err.message);
    return [];
  }
}

export const trayectoService = {
  obtenerTrayectos,
  buscarTrayectos,
  obtenerMisTrayectos,
  obtenerProximosTrayectos,
  obtenerTrayectoPorId,
  obtenerTrayectoCompleto,
  obtenerEstadoTrayecto,
  crearTrayecto,
  iniciarTrayecto,
  guardarRecorrido,
  obtenerRecorrido,
  actualizarCoordenadasTrayecto,
  actualizarCoordenadasTodos,
  actualizarTrayectoPut,
  actualizarTrayectoPatch,
  finalizarTrayecto,
  crearEventoTrayecto,
  obtenerEventosTrayecto,
  registrarLlegadaDestino,
  obtenerTrayectosPorConductor,
  obtenerTrayectosPorEvento,
  buscarTrayectosPorEventoCerca,
  crearTrayectoEvento,
  eliminarTrayecto,
  obtenerHistorialBusquedas,
  obtenerTrayectosViewport,
  obtenerTrayectosViewportLocal,
};

export default trayectoService;
