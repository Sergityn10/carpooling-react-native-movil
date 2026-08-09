// YouConnext - Comentario Service (api-travels)
import httpClient from "./httpClient";

// Crear opinión — POST /api/comments
async function crearOpinion(datos) {
  return httpClient.request("/api/comments", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Obtener opiniones por usuario comentarista — GET /api/comments/user_id_commentator/:userId
async function obtenerOpinionesPorComentarista(userId, { page, limit } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(
    `/api/comments/user_id_commentator/${userId}${query}`,
  );
}

// Obtener opiniones por usuario valorado — GET /api/comments/user_id_trayect/:userId
async function obtenerOpinionesPorValorado(userId, { page, limit } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return httpClient.request(`/api/comments/user_id_trayect/${userId}${query}`);
}

// Obtener opiniones por trayecto — GET /api/comments/travelId/:travelId
async function obtenerOpinionesPorTrayecto(travelId) {
  return httpClient.request(`/api/comments/travelId/${travelId}`);
}

// Actualizar opinión — PATCH /api/comments/:id
async function actualizarOpinion(id, datos) {
  return httpClient.request(`/api/comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

// Eliminar opinión — DELETE /api/comments/:id
async function eliminarOpinion(id) {
  return httpClient.request(`/api/comments/${id}`, {
    method: "DELETE",
  });
}

export const comentarioService = {
  crearOpinion,
  obtenerOpinionesPorComentarista,
  obtenerOpinionesPorValorado,
  obtenerOpinionesPorTrayecto,
  actualizarOpinion,
  eliminarOpinion,
};

export default comentarioService;
