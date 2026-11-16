// YouConnext - Pure helpers for Trip Alerts (validation, error mapping, push parsing)

export const TIPO_ALERTA = {
  DESTINO: "DESTINO",
  EVENTO: "EVENTO",
};

const TRIP_ALERT_TYPES = new Set([
  "trip_alert_matched",
  "trip.alert.matched",
]);

/**
 * Valida y normaliza el payload de creación de una alerta según el contrato del Factory backend.
 */
export function buildCreateAlertaPayload(input = {}) {
  const tipo = String(input.tipo || "").trim().toUpperCase();

  if (tipo === TIPO_ALERTA.DESTINO) {
    const destino = String(input.destino || "").trim();
    if (destino.length < 2) {
      const err = new Error("Introduce un destino válido (mínimo 2 caracteres).");
      err.status = 400;
      throw err;
    }
    return {
      tipo: TIPO_ALERTA.DESTINO,
      destino,
    };
  }

  if (tipo === TIPO_ALERTA.EVENTO) {
    const eventoId = String(input.eventoId || "").trim();
    if (!eventoId) {
      const err = new Error("Selecciona un evento para crear la alerta.");
      err.status = 400;
      throw err;
    }
    return {
      tipo: TIPO_ALERTA.EVENTO,
      eventoId,
    };
  }

  const err = new Error("El tipo de alerta debe ser DESTINO o EVENTO.");
  err.status = 400;
  throw err;
}

/**
 * Extrae el nombre limpio de ciudad a partir de un objeto de Google Places o texto libre.
 */
export function extractCityName(placeOrText) {
  if (!placeOrText) return "";

  if (typeof placeOrText === "string") {
    const firstPart = placeOrText.split(",")[0]?.trim() || "";
    return firstPart || placeOrText.trim();
  }

  const components = Array.isArray(placeOrText.addressComponents)
    ? placeOrText.addressComponents
    : [];

  const locality = components.find((c) =>
    Array.isArray(c.types) && c.types.includes("locality"),
  );
  if (locality?.long_name) return locality.long_name.trim();

  const admin2 = components.find((c) =>
    Array.isArray(c.types) && c.types.includes("administrative_area_level_2"),
  );
  if (admin2?.long_name) return admin2.long_name.trim();

  if (placeOrText.city) return String(placeOrText.city).trim();
  if (placeOrText.name) return String(placeOrText.name).split(",")[0].trim();
  if (placeOrText.address) return String(placeOrText.address).split(",")[0].trim();

  return "";
}

/**
 * Comprueba si ya existe una alerta equivalente para evitar duplicados en cliente.
 */
export function findDuplicateAlerta(alertas = [], candidate = {}) {
  const tipo = String(candidate.tipo || "").trim().toUpperCase();
  if (!Array.isArray(alertas)) return null;

  if (tipo === TIPO_ALERTA.EVENTO) {
    const targetId = String(candidate.eventoId || "").trim().toLowerCase();
    if (!targetId) return null;
    return (
      alertas.find(
        (a) =>
          a?.tipo === TIPO_ALERTA.EVENTO &&
          String(a.eventoId || "").trim().toLowerCase() === targetId,
      ) || null
    );
  }

  if (tipo === TIPO_ALERTA.DESTINO) {
    const targetDest = String(candidate.destino || "").trim().toLowerCase();
    if (!targetDest) return null;
    return (
      alertas.find(
        (a) =>
          a?.tipo === TIPO_ALERTA.DESTINO &&
          String(a.destino || "").trim().toLowerCase() === targetDest,
      ) || null
    );
  }

  return null;
}

/**
 * Traduce códigos HTTP del microservicio de trayectos a mensajes amigables para el usuario.
 */
export function getAlertaErrorMessage(
  error,
  fallback = "No se pudo completar la operación con tus alertas.",
) {
  const status = error?.status;
  const serverMessage =
    typeof error?.message === "string" && error.message.trim()
      ? error.message.trim()
      : "";

  switch (status) {
    case 400:
      return (
        serverMessage ||
        "Datos de la alerta no válidos. Revisa el destino o evento seleccionado."
      );
    case 401:
      return "Tu sesión ha expirado. Vuelve a iniciar sesión para gestionar tus alertas.";
    case 403:
      return "No tienes permisos para modificar o eliminar esta alerta.";
    case 404:
      return "Esta alerta ya no existe o fue eliminada.";
    case 429:
      return "Has realizado demasiadas peticiones seguidas. Espera unos segundos e inténtalo de nuevo.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "El servicio de alertas no está disponible en este momento. Inténtalo más tarde.";
    default:
      if (
        serverMessage.toLowerCase().includes("network request failed") ||
        serverMessage.toLowerCase().includes("failed to fetch")
      ) {
        return "Sin conexión con el servidor. Comprueba tu conexión a internet.";
      }
      return serverMessage || fallback;
  }
}

/**
 * Parsea el payload `data` de una notificación push `trip_alert_matched`.
 * Devuelve `null` si la notificación no corresponde a una alerta de trayecto o falta `tripId`.
 */
export function parseTripAlertNotificationData(rawData) {
  if (!rawData) return null;

  let data = rawData;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") return null;

  if (typeof data.payload === "string") {
    try {
      data = { ...data, ...JSON.parse(data.payload) };
    } catch {
      // ignore nested parse error
    }
  } else if (data.payload && typeof data.payload === "object") {
    data = { ...data, ...data.payload };
  }

  const rawType = String(
    data.type || data.event || data.notificationType || "",
  )
    .trim()
    .toLowerCase();

  if (!TRIP_ALERT_TYPES.has(rawType)) {
    return null;
  }

  const tripId = data.tripId ?? data.trayectoId ?? data.trip_id ?? null;
  if (tripId === null || tripId === undefined || String(tripId).trim() === "") {
    return null;
  }

  return {
    type: rawType,
    tripId: String(tripId).trim(),
    origin: data.origin ? String(data.origin) : "",
    destination: data.destination ? String(data.destination) : "",
    date: data.date ? String(data.date) : "",
    time: data.time ? String(data.time) : "",
    price: data.price !== undefined && data.price !== null ? String(data.price) : "",
    seats: data.seats !== undefined && data.seats !== null ? String(data.seats) : "",
    driverName: data.driverName ? String(data.driverName) : "",
  };
}
