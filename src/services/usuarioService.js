// YouConnext - Usuario Service
import httpClient from "./httpClient";

// Obtener info del usuario autenticado — GET /api/users/info
// Retorna: { status, message, data: { name, surname, phone, email, img_perfil, role, averageRating, numOpinions, about_me, viajes, preferences } }
async function getUserInfo() {
  return httpClient.request("/api/users/info");
}

// Obtener usuario por ID — GET /api/users/:id
async function getUserById(id) {
  return httpClient.request(`/api/users/${id}`);
}

// Obtener info pública de usuario por ID — GET /api/users/:id/info
async function getUserPublicInfo(id) {
  return httpClient.request(`/api/users/${id}/info`);
}

// Obtener info pública de un usuario (para chats) — GET /api/users/:id/public
// Retorna: { status, user: { id, name, img_perfil } }
async function getUserPublicChatInfo(id) {
  return httpClient.request(`/api/users/${id}/public`);
}

// Info pública de múltiples usuarios (batch, para chats grupales) — POST /api/users/public/batch
// Body: { ids: ["uuid1", "uuid2", ...] }
// Retorna: { status, users: [{ id, name, img_perfil }, ...] }
async function getUsersPublicBatch(ids) {
  return httpClient.request("/api/users/public/batch", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// Perfil público completo de un usuario — GET /api/users/:id/profile
// Retorna: { status, user: { id, name, img_perfil, about_me, genero, fecha_nacimiento, ciudad, provincia, pais, created_at, cars, stats, recent_comments } }
async function getUserPublicProfile(id) {
  return httpClient.request(`/api/users/${id}/profile`);
}

// Actualizar usuario autenticado — PATCH /api/users
async function updateUser(datos) {
  return httpClient.request("/api/users", {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

// Actualizar usuario por ID — PATCH /api/users/:id
async function updateUserById(id, datos) {
  return httpClient.request(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

// Eliminar usuario — DELETE /api/users/:id
async function deleteUser(id) {
  return httpClient.request(`/api/users/${id}`, {
    method: "DELETE",
  });
}

// Listar usuarios — GET /api/users
async function listarUsuarios() {
  return httpClient.request("/api/users");
}

// Buscar usuarios por ubicación — GET /api/users/unique-by-location?location=...
async function searchUsersByLocation(location) {
  return httpClient.request(
    `/api/users/unique-by-location?location=${encodeURIComponent(location)}`,
  );
}

export const usuarioService = {
  getUserInfo,
  getUserById,
  getUserPublicInfo,
  getUserPublicChatInfo,
  getUsersPublicBatch,
  getUserPublicProfile,
  updateUser,
  updateUserById,
  deleteUser,
  listarUsuarios,
  searchUsersByLocation,
};

export default usuarioService;
