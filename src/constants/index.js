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
    hero: ["#065F46", "#0A7E58", "#10B981"],
    ocean: ["#075985", "#0284C7", "#38BDF8"],
    fresh: ["#0D9F6E", "#0EA5E9"],
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

// Tamaños y pesos de fuente
const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  "2xl": 24,
  xxxl: 32,
  "3xl": 32,
  title: 40,
};

const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

export const FONTS = {
  ...FONT_SIZES,
  sizes: FONT_SIZES,
  weights: FONT_WEIGHTS,
};

const SHADOW_SMALL = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

const SHADOW_MEDIUM = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

const SHADOW_LARGE = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 6,
};

const SHADOW_XLARGE = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.16,
  shadowRadius: 28,
  elevation: 8,
};

// Sombras suaves y redondeadas (cross-platform iOS y Android)
export const SHADOWS = {
  xs: SHADOW_SMALL,
  sm: SHADOW_SMALL,
  small: SHADOW_SMALL,
  md: SHADOW_MEDIUM,
  medium: SHADOW_MEDIUM,
  lg: SHADOW_LARGE,
  large: SHADOW_LARGE,
  xl: SHADOW_XLARGE,
  soft: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
};

export const coloredShadow = (color, opacity = 0.22) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: opacity,
  shadowRadius: 16,
  elevation: 4,
});

// Border radius
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  xxl: 32,
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
