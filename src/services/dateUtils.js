// YouConnext - Date utilities
// The backend stores hora as "HH:MM" (UTC) and fecha as "YYYY-MM-DD" (UTC).
// These helpers parse those values into local Date objects and format for display.

// Parse a trip's fecha + hora (both UTC) into a local Date.
// Accepts either separate fecha/hora strings or a combined hora ISO string.
export const parseTripDate = (viaje) => {
  if (!viaje) return null;

  // If hora is a full ISO string (e.g. "2026-07-20T10:00:00.000Z"), parse directly
  if (viaje.hora && viaje.hora.includes("T")) {
    const d = new Date(viaje.hora);
    if (!isNaN(d.getTime())) return d;
  }

  // Combine fecha + hora with Z suffix to indicate UTC
  const fecha = viaje.fecha;
  const hora = viaje.hora;

  if (fecha && hora) {
    const d = new Date(`${fecha}T${hora}:00Z`);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback: try fecha alone (midnight UTC)
  if (fecha) {
    const d = new Date(`${fecha}T00:00:00Z`);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback: try hora alone (might be ISO)
  if (hora) {
    const d = new Date(hora);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

// Format a trip's date for display (e.g. "20 jul" or "Hoy" or "Mañana")
export const formatTripDate = (viaje) => {
  const date = parseTripDate(viaje);
  if (!date) return "";

  const hoy = new Date();
  const manana = new Date();
  manana.setDate(hoy.getDate() + 1);

  if (date.toDateString() === hoy.toDateString()) return "Hoy";
  if (date.toDateString() === manana.toDateString()) return "Mañana";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
};

// Format a trip's time for display (e.g. "10:00")
export const formatTripTime = (viaje) => {
  const date = parseTripDate(viaje);
  if (!date) return "--:--";
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format a trip's full date+time for display (e.g. "20 de julio de 2026, 10:00")
export const formatTripDateTime = (viaje) => {
  const date = parseTripDate(viaje);
  if (!date) return "No disponible";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format a countdown until trip time (e.g. "En 30 min")
export const formatTripCountdown = (viaje) => {
  const date = parseTripDate(viaje);
  if (!date) return "";
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "Ahora";
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `En ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  if (diffHr < 24) return `En ${diffHr}h ${remMin}min`;
  const diffDays = Math.floor(diffHr / 24);
  return `En ${diffDays}d`;
};

// Convert local Date objects (from pickers) to UTC fecha+hora for the API.
// Used when creating or updating trayectos.
export const localToUtcApi = (date, time) => {
  const d = new Date(date);
  const t = new Date(time);
  const combined = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    t.getHours(),
    t.getMinutes(),
    0,
    0,
  );
  const fechaStr = `${combined.getUTCFullYear()}-${String(combined.getUTCMonth() + 1).padStart(2, "0")}-${String(combined.getUTCDate()).padStart(2, "0")}`;
  const horaStr = `${String(combined.getUTCHours()).padStart(2, "0")}:${String(combined.getUTCMinutes()).padStart(2, "0")}`;
  return { fecha: fechaStr, hora: horaStr };
};
