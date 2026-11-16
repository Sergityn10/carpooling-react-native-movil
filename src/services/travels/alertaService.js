// YouConnext - Alerta Service (ms-trayectos /api/alertas)
import httpClient from "./httpClient";
import {
  TIPO_ALERTA,
  buildCreateAlertaPayload,
  extractCityName,
  findDuplicateAlerta,
  getAlertaErrorMessage,
  parseTripAlertNotificationData,
} from "../../utils/alertaUtils";

// Listar alertas del usuario autenticado — GET /api/alertas
async function obtenerMisAlertas() {
  const res = await httpClient.request("/api/alertas");
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.alertas)) return res.alertas;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

// Crear nueva alerta (DESTINO o EVENTO) — POST /api/alertas
async function crearAlerta(payload) {
  const body = buildCreateAlertaPayload(payload);
  const res = await httpClient.request("/api/alertas", {
    method: "POST",
    body,
  });
  return res?.alerta || res?.data || res;
}

// Pausar o reanudar una alerta — PATCH /api/alertas/:id/estado
async function actualizarEstadoAlerta(id, activa) {
  if (id === undefined || id === null || String(id).trim() === "") {
    const err = new Error("Identificador de alerta no válido.");
    err.status = 400;
    throw err;
  }
  if (typeof activa !== "boolean") {
    const err = new Error("El estado 'activa' debe ser booleano.");
    err.status = 400;
    throw err;
  }
  const res = await httpClient.request(`/api/alertas/${id}/estado`, {
    method: "PATCH",
    body: { activa },
  });
  return res?.alerta || res?.data || res;
}

// Eliminar una alerta — DELETE /api/alertas/:id
async function eliminarAlerta(id) {
  if (id === undefined || id === null || String(id).trim() === "") {
    const err = new Error("Identificador de alerta no válido.");
    err.status = 400;
    throw err;
  }
  return httpClient.request(`/api/alertas/${id}`, {
    method: "DELETE",
  });
}

export const alertaService = {
  TIPO_ALERTA,
  obtenerMisAlertas,
  crearAlerta,
  actualizarEstadoAlerta,
  eliminarAlerta,
  extractCityName,
  findDuplicateAlerta,
  getAlertaErrorMessage,
  parseTripAlertNotificationData,
};

export default alertaService;
