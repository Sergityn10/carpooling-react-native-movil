// YouConnext - Reserva Service (api-travels)
import httpClient from "./httpClient";

// Crear reserva — POST /api/reserva
async function crearReserva(userId, trayectoId) {
  return httpClient.request("/api/reserva", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, trayecto_id: trayectoId }),
  });
}

// Reserva mediante QR (unión y recogida inmediata) — POST /api/reserva/qr
async function reservaQR(trayectoId, lat, lng) {
  return httpClient.request("/api/reserva/qr", {
    method: "POST",
    body: JSON.stringify({ trayecto_id: trayectoId, lat, lng }),
  });
}

// Obtener mis reservas — GET /api/reserva/userId/:userIdParam
async function obtenerMisReservas(userId) {
  return httpClient.request(`/api/reserva/userId/${userId}`);
}

// Obtener reservas por trayecto — GET /api/reserva/trayectoId/:travelId
async function obtenerReservasPorTrayecto(travelId) {
  return httpClient.request(`/api/reserva/trayectoId/${travelId}`);
}

// Cancelar reserva — DELETE /api/reserva/:id
async function cancelarReserva(id) {
  return httpClient.request(`/api/reserva/${id}`, {
    method: "DELETE",
  });
}

// Confirmar viaje exitoso — POST /api/reserva/:id/success
async function confirmarViajeExitoso(id) {
  return httpClient.request(`/api/reserva/${id}/success`, {
    method: "POST",
  });
}

// Reclamar incidencia de viaje — POST /api/reserva/:id/issue
async function reclamarIncidencia(id, reason) {
  return httpClient.request(`/api/reserva/${id}/issue`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// Retomar pago de reserva — POST /api/reserva/resume
async function resumePago(
  idReserva,
  returnUrl = "youconnext://perfil",
  refreshUrl = "youconnext://perfil",
) {
  return httpClient.request("/api/reserva/resume", {
    method: "POST",
    body: JSON.stringify({
      id_reserva: idReserva,
      return_url: returnUrl,
      refresh_url: refreshUrl,
    }),
  });
}

export const reservaService = {
  crearReserva,
  reservaQR,
  obtenerMisReservas,
  obtenerReservasPorTrayecto,
  cancelarReserva,
  confirmarViajeExitoso,
  reclamarIncidencia,
  resumePago,
};

export default reservaService;
