// YouConnext - Brand Colors & Constants
// Tema: Sostenibilidad, movilidad verde, comunidad

// Colores principales
export const COLORS = {
  // Verde Bosque (Sostenibilidad - color principal)
  primary: "#0D9F6E",
  primaryDark: "#0A7E58",
  primaryLight: "#10B981",
  primarySoft: "#D1FAE5",

  // Azul Oceano (Movilidad)
  secondary: "#0EA5E9",
  secondaryDark: "#0284C7",
  secondaryLight: "#38BDF8",
  secondarySoft: "#E0F2FE",

  // Lima Solar (Comunidad y energia)
  accent: "#84CC16",
  accentDark: "#65A30D",
  accentLight: "#A3E635",
  accentSoft: "#ECFCCB",

  // Neutros
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#FAFAFA",
  gray100: "#F4F4F5",
  gray200: "#E4E4E7",
  gray300: "#D4D4D8",
  gray400: "#A1A1AA",
  gray500: "#71717A",
  gray600: "#52525B",
  gray700: "#27272A",
  gray800: "#18181B",
  gray900: "#09090B",

  // Estados
  success: "#10B981",
  successSoft: "#D1FAE5",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  error: "#EF4444",
  errorSoft: "#FEE2E2",
  info: "#0EA5E9",
  infoSoft: "#E0F2FE",

  // Fondos
  background: "#FAFAFA",
  backgroundSecondary: "#F4F4F5",
  cardBackground: "#FFFFFF",

  // Gradientes (para usar en estilos)
  gradient: {
    greenStart: "#0D9F6E",
    greenEnd: "#10B981",
    blueStart: "#0EA5E9",
    blueEnd: "#38BDF8",
    limeStart: "#84CC16",
    limeEnd: "#A3E635",
  },
};

// Espaciado
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Tamaños de fuente
export const FONTS = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 40,
};

// Sombras
export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Border radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Configuración de la API
export const API_CONFIG = {
  BASE_URL: "http://localhost:3000",
  TIMEOUT: 10000,
};

// Configuración de GPS
export const GPS_CONFIG = {
  ACCURACY_HIGH: 10,
  ACCURACY_MEDIUM: 50,
  ACCURACY_LOW: 100,
  TRACKING_INTERVAL: 5000, // 5 segundos (UI updates)
  SAVE_INTERVAL: 60000, // 1 minuto (guardado al backend)
  MIN_DISTANCE: 10, // metros
};

// Estados de viaje
export const VIAJE_ESTADO = {
  PENDIENTE: "pendiente",
  ACTIVO: "activo",
  COMPLETADO: "completado",
  CANCELADO: "cancelado",
};
