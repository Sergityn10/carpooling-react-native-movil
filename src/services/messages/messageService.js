// YouConnext - Message Service (REST API for chats and messages)
import { messagesHttpClient, asegurarToken } from "./httpClient";

// Chats

// Listar todos mis chats (individuales + grupales) — GET /api/chats
async function obtenerChats() {
  await asegurarToken();
  return messagesHttpClient.request("/api/chats");
}

// Listar chats grupales del usuario autenticado — GET /api/chats/me
async function obtenerChatsGrupales() {
  await asegurarToken();
  return messagesHttpClient.request("/api/chats/me");
}

// Obtener chat por ID — GET /api/chats/:chatId
async function obtenerChatPorId(chatId) {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/${chatId}`);
}

// Obtener chat grupal por trip_id — GET /api/chats/trip/:tripId?type=TRAYECTO|VIAJE|EVENT
async function obtenerChatPorTripId(tripId, type = "TRAYECTO") {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/trip/${tripId}?type=${type}`);
}

// Crear chat grupal — POST /api/chats
async function crearChatGrupal({
  name,
  chat_type,
  trip_id,
  admin_id,
  participant_ids,
}) {
  await asegurarToken();
  const body = {};
  if (name) body.name = name;
  if (chat_type) body.chat_type = chat_type;
  if (trip_id) body.trip_id = trip_id;
  if (admin_id) body.admin_id = admin_id;
  if (participant_ids) body.participant_ids = participant_ids;
  return messagesHttpClient.request("/api/chats", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Actualizar chat grupal — PATCH /api/chats/:chatId
async function actualizarChat(chatId, { name, trip_id, admin_id }) {
  await asegurarToken();
  const body = {};
  if (name !== undefined) body.name = name;
  if (trip_id !== undefined) body.trip_id = trip_id;
  if (admin_id !== undefined) body.admin_id = admin_id;
  return messagesHttpClient.request(`/api/chats/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// Eliminar chat grupal — DELETE /api/chats/:chatId
async function eliminarChat(chatId) {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/${chatId}`, {
    method: "DELETE",
  });
}

// Participantes

// Listar participantes — GET /api/chats/:chatId/participants
async function obtenerParticipantes(chatId) {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/${chatId}/participants`);
}

// Añadir participante — POST /api/chats/:chatId/participants
async function anadirParticipante(chatId, user_id) {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/${chatId}/participants`, {
    method: "POST",
    body: JSON.stringify({ user_id }),
  });
}

// Eliminar participante — DELETE /api/chats/:chatId/participants/:userKey
async function eliminarParticipante(chatId, userKey) {
  await asegurarToken();
  return messagesHttpClient.request(
    `/api/chats/${chatId}/participants/${userKey}`,
    { method: "DELETE" },
  );
}

// Unirse a un chat grupal — POST /api/chats/:chatId/join
async function unirseChat(chatId) {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/${chatId}/join`, {
    method: "POST",
  });
}

// Salirse de un chat grupal — POST /api/chats/:chatId/leave
async function salirseChat(chatId) {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/${chatId}/leave`, {
    method: "POST",
  });
}

// Mensajes

// Listar mensajes de un chat — GET /api/chats/:chatId/messages
async function obtenerMensajes(chatId, { limit, before_id } = {}) {
  await asegurarToken();
  let endpoint = `/api/chats/${chatId}/messages`;
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (before_id) params.append("before_id", before_id);
  if (params.toString()) endpoint += `?${params.toString()}`;
  return messagesHttpClient.request(endpoint);
}

// Crear mensaje — POST /api/chats/:chatId/messages
async function enviarMensaje(chatId, { content, type = "TEXT" }) {
  await asegurarToken();
  return messagesHttpClient.request(`/api/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, type }),
  });
}

// Editar mensaje — PATCH /api/chats/:chatId/messages/:messageId
async function editarMensaje(chatId, messageId, content) {
  await asegurarToken();
  return messagesHttpClient.request(
    `/api/chats/${chatId}/messages/${messageId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ content }),
    },
  );
}

// Eliminar mensaje — DELETE /api/chats/:chatId/messages/:messageId
async function eliminarMensaje(chatId, messageId) {
  await asegurarToken();
  return messagesHttpClient.request(
    `/api/chats/${chatId}/messages/${messageId}`,
    { method: "DELETE" },
  );
}

export const messageService = {
  obtenerChats,
  obtenerChatsGrupales,
  obtenerChatPorId,
  obtenerChatPorTripId,
  crearChatGrupal,
  actualizarChat,
  eliminarChat,
  obtenerParticipantes,
  anadirParticipante,
  eliminarParticipante,
  unirseChat,
  salirseChat,
  obtenerMensajes,
  enviarMensaje,
  editarMensaje,
  eliminarMensaje,
};

export default messageService;
