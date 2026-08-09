// YouConnext - Trayecto Service (api-travels)
import httpClient from "./httpClient";

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

// Crear trayecto hacia un evento — POST /api/trayecto/evento
async function crearTrayectoEvento(datos) {
  return httpClient.request("/api/trayecto/evento", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Eliminar trayecto — DELETE /api/trayecto/:id
async function eliminarTrayecto(id) {
  return httpClient.request(`/api/trayecto/${id}`, {
    method: "DELETE",
  });
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
  crearTrayectoEvento,
  eliminarTrayecto,
};

export default trayectoService;
