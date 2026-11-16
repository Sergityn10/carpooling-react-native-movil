// YouConnextApp - src/constants/feedback.js
// Sincronizado con carpooling-user backend API (/api/feedback, /api/feedback/categories, /api/feedback/mine)

export const FEEDBACK_LIMITS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 150,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1024,
  // Aliases para compatibilidad
  TITLE_MIN: 3,
  TITLE_MAX: 150,
  MESSAGE_MIN: 10,
  MESSAGE_MAX: 1024,
};

// Fallback local por defecto si la red falla o está en modo avión
export const DEFAULT_FEEDBACK_CATEGORIES = [
  {
    id: "bug",
    label: "Reportar un fallo",
    description: "Informa sobre errores técnicos, pantallas rotas o mal funcionamiento.",
    icon: "🐛",
  },
  {
    id: "improvement",
    label: "Propuesta de mejora",
    description: "Sugiere nuevas características o ideas para la plataforma.",
    icon: "💡",
  },
  {
    id: "usability",
    label: "Experiencia de uso (Diseño)",
    description: "Comenta sobre la navegación, facilidad de uso o diseño visual.",
    icon: "✨",
  },
  {
    id: "performance",
    label: "Rendimiento y velocidad",
    description: "Reporta tiempos de carga lentos o problemas de respuesta.",
    icon: "⚡",
  },
  {
    id: "service",
    label: "Servicio de Carpooling",
    description: "Feedback relacionado con reservas, cancelaciones o trayectos.",
    icon: "🚗",
  },
  {
    id: "organization",
    label: "Gestión Corporativa",
    description: "Específico para administradores y empleados de organizaciones.",
    icon: "🏢",
  },
  {
    id: "other",
    label: "Otros comentarios",
    description: "Cualquier otra inquietud o mensaje general.",
    icon: "💬",
  },
];

// Metadatos globales por defecto (Backend-Driven Fallback)
export const DEFAULT_FEEDBACK_META = {
  title: "Buzón de Sugerencias y Feedback",
  description:
    "Tu opinión es fundamental para nosotros. Envíanos tus comentarios, reportes de fallos o propuestas de nuevas funciones para seguir mejorando YouConnext.",
  maxTitleLength: FEEDBACK_LIMITS.MAX_TITLE_LENGTH,
  maxMessageLength: FEEDBACK_LIMITS.MAX_MESSAGE_LENGTH,
  categories: DEFAULT_FEEDBACK_CATEGORIES,
};

export const DEFAULT_FEEDBACK_CATEGORY = "improvement";
export const FEEDBACK_CATEGORIES = DEFAULT_FEEDBACK_CATEGORIES;

// Estados del Ciclo de Vida de Feedback (5 fases + discarded)
// Sincronizado con Prisma enum FeedbackStatus en backend
export const FEEDBACK_STATUS = {
  SUBMITTED: "submitted",
  RECEIVED: "received",
  IN_PROGRESS: "in_progress",
  PENDING_VERIFICATION: "pending_verification",
  RESOLVED: "resolved",
  DISCARDED: "discarded",
};

export const FEEDBACK_STATUS_META = {
  submitted: {
    label: "Enviado",
    description: "Pendiente de revisión inicial por el equipo.",
    color: "#4A5753",
    bgColor: "#EEF5F0",
    borderColor: "#D6E2DB",
    icon: "Clock",
  },
  received: {
    label: "Recibido",
    description: "Revisado y clasificado por el equipo de YouConnext.",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    borderColor: "#38BDF8",
    icon: "Inbox",
  },
  in_progress: {
    label: "En progreso",
    description: "El equipo técnico está trabajando en la solución o mejora.",
    color: "#8A5200",
    bgColor: "#FBF0DE",
    borderColor: "#F2A33C",
    icon: "Wrench",
  },
  pending_verification: {
    label: "Por verificar",
    fullLabel: "Cambio realizado (Pendiente de probar)",
    description: "Hemos aplicado una solución. Por favor, pruébala y dinos si te funciona.",
    color: "#C2410C",
    bgColor: "#FFEDD5",
    borderColor: "#FB923C",
    icon: "Sparkles",
    requiresAction: true,
  },
  resolved: {
    label: "Resuelto",
    description: "Solución verificada y confirmada por ti con éxito.",
    color: "#0B7A3B",
    bgColor: "#E3F4EA",
    borderColor: "#00C853",
    icon: "CheckCircle2",
  },
  discarded: {
    label: "Descartado",
    description: "Reporte desestimado o duplicado.",
    color: "#6B7A75",
    bgColor: "#EEF5F0",
    borderColor: "#D6E2DB",
    icon: "XCircle",
  },
};

export default {
  FEEDBACK_LIMITS,
  DEFAULT_FEEDBACK_CATEGORIES,
  DEFAULT_FEEDBACK_META,
  DEFAULT_FEEDBACK_CATEGORY,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUS,
  FEEDBACK_STATUS_META,
};
