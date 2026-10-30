// YouConnext - Brand Colors & Constants (v2 - Octubre 2026)
// Tema: Verde y negro, acento ámbar opcional para eventos
import { BRAND, TOKENS } from "./tokens";

export { BRAND, TOKENS };

// Colores principales alineados con la Guía de Estilo v2
export const COLORS = {
  // Verde de Marca
  primary: BRAND.greenOnLight,        // #0B7A3B sobre fondo claro
  primaryBright: BRAND.green,         // #00C853 sobre fondo oscuro
  primaryDark: BRAND.greenOnLightPressed, // #095F2E
  primaryLight: BRAND.green,          // #00C853
  primarySoft: "#E3F4EA",             // fondo verde suave

  // Ámbar para eventos y avisos (según guía oficial)
  accent: BRAND.accent,               // #F2A33C
  accentDark: BRAND.accentTextOnLight, // #8A5200
  accentLight: "#FDBA74",
  accentSoft: "#FBF0DE",

  // Neutros estructuradores de YouConnext
  black: BRAND.black,                 // #0B0F0E
  white: "#FFFFFF",
  gray50: "#EEF5F0",                  // fondo general de marca
  gray100: "#F4FAF6",
  gray200: "#D6E2DB",                 // borde separador
  gray300: "#B8C9C1",
  gray400: "#7A8884",                 // borde de campos (3.7:1)
  gray500: "#6B7A75",                 // borde de campos oscuro (4.3:1)
  gray600: "#4A5753",                 // texto secundario / muted
  gray700: "#2F3A36",                 // separador decorativo oscuro
  gray800: "#1D2522",                 // surface-2 oscuro
  gray900: "#141A18",                 // surface-1 oscuro

  // Superficies
  surface: "#FFFFFF",
  surface1: "#141A18",
  surface2: "#1D2522",
  surfaceDark: BRAND.black,
  border: "#D6E2DB",
  borderField: "#7A8884",
  borderDark: "#2F3A36",
  borderFieldDark: "#6B7A75",

  // Texto
  text: BRAND.black,
  textMuted: "#4A5753",
  textDark: "#F2F5F4",
  textMutedDark: "#A7B2AE",

  // Estados
  success: BRAND.greenOnLight,
  successSoft: "#E3F4EA",
  warning: BRAND.accent,
  warningSoft: "#FBF0DE",
  error: "#C62828",
  errorDark: "#FF6B6B",
  errorSoft: "#F9E7E4",
  info: BRAND.greenOnLight,
  infoSoft: "#E3F4EA",

  // Fondos
  background: "#EEF5F0",              // fondo general modo claro v2
  backgroundDark: BRAND.black,        // fondo general modo oscuro v2
  backgroundSecondary: "#FFFFFF",
  cardBackground: "#FFFFFF",

  // Gradientes sutiles y elegantes (sin tonos chillones)
  gradient: {
    greenStart: BRAND.black,
    greenEnd: "#141A18",
    blueStart: BRAND.black,
    blueEnd: "#141A18",
    limeStart: BRAND.green,
    limeEnd: "#00A843",
    hero: [BRAND.black, "#141A18", "#1D2522"],
    subtle: ["#FFFFFF", "#F4FAF6"],
    darkGlow: [BRAND.black, "#0F1A14", BRAND.black],
    accent: [BRAND.accent, "#E09228"],
  },
};

// Espaciado base 4
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screenMargin: 20,
  cardGap: 12,
  cardPadding: 16,
};

// Tamaños y pesos de fuente (Google Fonts: Sora e Inter)
const FONT_SIZES = {
  xs: 11,
  sm: 12,
  md: 15,
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
  typography: TOKENS.typography,
};

// Sombras suaves con tinta al 8% (Pág. 3 de la guía: "0 2 8 con tinta al 8% para tarjetas")
const SHADOW_SOFT_CARD = {
  shadowColor: BRAND.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
};

const SHADOW_HOVER = {
  shadowColor: BRAND.black,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 4,
};

export const SHADOWS = {
  xs: SHADOW_SOFT_CARD,
  sm: SHADOW_SOFT_CARD,
  small: SHADOW_SOFT_CARD,
  md: SHADOW_HOVER,
  medium: SHADOW_HOVER,
  lg: SHADOW_HOVER,
  large: SHADOW_HOVER,
  xl: SHADOW_HOVER,
  soft: SHADOW_SOFT_CARD,
  card: SHADOW_SOFT_CARD,
};

export const coloredShadow = (color, opacity = 0.15) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: opacity,
  shadowRadius: 10,
  elevation: 3,
});

// Border radius: 12 para controles, 16 para tarjetas, 9999 para chips/redondos
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,      // controles (botones y campos)
  lg: 16,      // tarjetas
  xl: 24,
  "2xl": 32,
  xxl: 32,
  full: 9999,  // chips y avatares redondos
  control: 12,
  card: 16,
  round: 9999,
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
  TRACKING_INTERVAL: 5000,
  SAVE_INTERVAL: 60000,
  MIN_DISTANCE: 10,
};

// Estados de viaje
export const VIAJE_ESTADO = {
  PENDIENTE: "pendiente",
  ACTIVO: "activo",
  COMPLETADO: "completado",
  CANCELADO: "cancelado",
};

// Estilos de Mapa
export { MAP_STYLE_YOUCONNEXT, MAP_STYLE_DARK, MAP_STYLE_DEFAULT } from "./mapStyles";
