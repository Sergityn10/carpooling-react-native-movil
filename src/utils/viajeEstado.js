// YouConnext - Config visual compartida para estados de viaje
import { COLORS } from "../constants";

export const ESTADO_CONFIG = {
  activo: {
    label: "En curso",
    bg: COLORS.successSoft,
    color: COLORS.primaryDark,
    dot: COLORS.primary,
  },
  "en curso": {
    label: "En curso",
    bg: COLORS.successSoft,
    color: COLORS.primaryDark,
    dot: COLORS.primary,
  },
  en_curso: {
    label: "En curso",
    bg: COLORS.successSoft,
    color: COLORS.primaryDark,
    dot: COLORS.primary,
  },
  pendiente: {
    label: "Pendiente",
    bg: COLORS.warningSoft,
    color: "#B45309",
    dot: COLORS.warning,
  },
  pendiente_pago: {
    label: "Pendiente",
    bg: COLORS.warningSoft,
    color: "#B45309",
    dot: COLORS.warning,
  },
  programado: {
    label: "Programado",
    bg: COLORS.warningSoft,
    color: "#B45309",
    dot: COLORS.warning,
  },
  finalizado: {
    label: "Completado",
    bg: COLORS.gray100,
    color: COLORS.gray600,
    dot: COLORS.gray400,
  },
  completado: {
    label: "Completado",
    bg: COLORS.gray100,
    color: COLORS.gray600,
    dot: COLORS.gray400,
  },
  cancelado: {
    label: "Cancelado",
    bg: COLORS.errorSoft,
    color: COLORS.error,
    dot: COLORS.error,
  },
};

export const getEstadoConfig = (estado) => {
  const key = (estado || "").toLowerCase();
  return (
    ESTADO_CONFIG[key] || {
      label: key ? key.charAt(0).toUpperCase() + key.slice(1) : "Desconocido",
      bg: COLORS.gray100,
      color: COLORS.gray600,
      dot: COLORS.gray400,
    }
  );
};

export const esEstadoEnCurso = (estado) => {
  const e = (estado || "").toLowerCase();
  return e === "activo" || e === "en curso" || e === "en_curso";
};
