// YouConnext - Event Service
import httpClient from "./httpClient";

// Listar eventos — GET /api/events
async function getEvents(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.tag) query.append("tag", params.tag);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qs = query.toString();
  return httpClient.request(`/api/events${qs ? `?${qs}` : ""}`);
}

// Obtener evento por ID — GET /api/events/:id
async function getEventById(id) {
  return httpClient.request(`/api/events/${id}`);
}

// Obtener eventos cercanos — GET /api/events/nearby
async function getNearbyEvents({ lat, lng, radius, tag, limit }) {
  const query = new URLSearchParams();
  query.append("lat", lat);
  query.append("lng", lng);
  if (radius) query.append("radius", radius);
  if (tag) query.append("tag", tag);
  if (limit) query.append("limit", limit);
  return httpClient.request(`/api/events/nearby?${query.toString()}`);
}

// Obtener evento por código único — GET /api/events/code/:code
async function getEventByCode(code) {
  return httpClient.request(`/api/events/code/${code}`);
}

// Listar etiquetas — GET /api/tags
async function getTags() {
  return httpClient.request("/api/tags");
}

// Unirse a un evento — POST /api/events/:id/join
async function joinEvent(eventId) {
  return httpClient.request(`/api/events/${eventId}/join`, {
    method: "POST",
  });
}

// Salirse de un evento — DELETE /api/events/:id/join
async function leaveEvent(eventId) {
  return httpClient.request(`/api/events/${eventId}/join`, {
    method: "DELETE",
  });
}

// Listar participantes — GET /api/events/:id/participants
async function getParticipants(eventId) {
  return httpClient.request(`/api/events/${eventId}/participants`);
}

// Eventos a los que se ha unido el usuario — GET /api/events/me/joined
async function getMyJoinedEvents() {
  return httpClient.request("/api/events/me/joined");
}

export const eventService = {
  getEvents,
  getEventById,
  getNearbyEvents,
  getEventByCode,
  getTags,
  joinEvent,
  leaveEvent,
  getParticipants,
  getMyJoinedEvents,
};
