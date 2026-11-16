// YouConnext - Feedback Service
// Integración con carpooling-user backend API (/api/feedback, /api/feedback/categories, /api/feedback/mine)
import httpClient from "./httpClient";
import {
  DEFAULT_FEEDBACK_META,
  FEEDBACK_LIMITS,
  DEFAULT_FEEDBACK_CATEGORY,
} from "../constants/feedback";

/**
 * Obtiene los metadatos y categorías de feedback del backend.
 * Si falla la red, devuelve null para que la vista use el fallback offline o caché.
 * GET /api/feedback/categories
 * @returns {Promise<Object|null>} { title, description, maxTitleLength, maxMessageLength, categories }
 */
export async function obtenerCategoriasFeedback() {
  try {
    const response = await httpClient.request("/api/feedback/categories");
    return response?.data || response || null;
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        "[feedbackService] No se pudieron cargar categorías dinámicas, usando fallback local:",
        error?.message,
      );
    }
    return null;
  }
}

/**
 * Envía un nuevo feedback autenticado al backend.
 * POST /api/feedback
 * @param {Object} feedbackData - { title, category, message }
 * @returns {Promise<Object>} Respuesta del backend { status, message, data }
 */
export async function enviarFeedback(feedbackData) {
  const { title, category, message } = feedbackData || {};

  const cleanTitle = title && typeof title === "string" ? title.trim() : "";
  const cleanMessage =
    message && typeof message === "string" ? message.trim() : "";
  const cleanCategory = category || DEFAULT_FEEDBACK_CATEGORY;

  if (
    cleanTitle &&
    (cleanTitle.length < FEEDBACK_LIMITS.MIN_TITLE_LENGTH ||
      cleanTitle.length > FEEDBACK_LIMITS.MAX_TITLE_LENGTH)
  ) {
    const error = new Error(
      `El título debe tener entre ${FEEDBACK_LIMITS.MIN_TITLE_LENGTH} y ${FEEDBACK_LIMITS.MAX_TITLE_LENGTH} caracteres.`,
    );
    error.status = 400;
    throw error;
  }

  if (
    !cleanMessage ||
    cleanMessage.length < FEEDBACK_LIMITS.MIN_MESSAGE_LENGTH ||
    cleanMessage.length > FEEDBACK_LIMITS.MAX_MESSAGE_LENGTH
  ) {
    const error = new Error(
      `El mensaje debe tener entre ${FEEDBACK_LIMITS.MIN_MESSAGE_LENGTH} y ${FEEDBACK_LIMITS.MAX_MESSAGE_LENGTH} caracteres.`,
    );
    error.status = 400;
    throw error;
  }

  return httpClient.request("/api/feedback", {
    method: "POST",
    body: {
      title: cleanTitle || undefined,
      category: cleanCategory,
      message: cleanMessage,
    },
  });
}

/**
 * Obtiene la lista de feedbacks y consultas propias del usuario autenticado.
 * GET /api/feedback/mine
 * @returns {Promise<Array>} Lista de feedbacks con sus estados del ciclo de vida
 */
export async function obtenerMisFeedbacks() {
  try {
    const response = await httpClient.request("/api/feedback/mine");
    if (Array.isArray(response?.data?.feedbacks)) {
      return response.data.feedbacks;
    }
    if (Array.isArray(response?.feedbacks)) {
      return response.feedbacks;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        "[feedbackService] Error al obtener feedbacks propios:",
        error?.message,
      );
    }
    throw error;
  }
}

/**
 * Confirma que el cambio técnico realizado por el equipo soluciona la incidencia.
 * Transiciona el estado del feedback a 'resolved'.
 * POST /api/feedback/:id/confirm-resolution
 * @param {string} id - Identificador del feedback
 * @param {string} [comment] - Comentario opcional de agradecimiento o verificación
 * @returns {Promise<Object>}
 */
export async function confirmarResolucionFeedback(id, comment) {
  if (!id) throw new Error("ID de feedback no proporcionado");

  return httpClient.request(`/api/feedback/${id}/confirm-resolution`, {
    method: "POST",
    body: {
      comment: comment?.trim() || undefined,
    },
  });
}

/**
 * Indica que el cambio realizado aún no funciona y devuelve el feedback a 'in_progress'.
 * POST /api/feedback/:id/reject-resolution
 * @param {string} id - Identificador del feedback
 * @param {string} reason - Motivo explicativo de por qué persiste el fallo (mín. 5 caracteres)
 * @returns {Promise<Object>}
 */
export async function rechazarResolucionFeedback(id, reason) {
  if (!id) throw new Error("ID de feedback no proporcionado");
  const cleanReason = reason && typeof reason === "string" ? reason.trim() : "";

  if (cleanReason.length < 5) {
    const error = new Error(
      "Debes explicar por qué el problema persiste (mínimo 5 caracteres).",
    );
    error.status = 400;
    throw error;
  }

  return httpClient.request(`/api/feedback/${id}/reject-resolution`, {
    method: "POST",
    body: {
      reason: cleanReason,
    },
  });
}

export const feedbackService = {
  obtenerCategoriasFeedback,
  enviarFeedback,
  obtenerMisFeedbacks,
  confirmarResolucionFeedback,
  rechazarResolucionFeedback,
};

export default feedbackService;
