// YouConnext - Tokens de Diseño v2 (Octubre 2026)
// Paleta verde y negro con ámbar para eventos y acentos táctiles
import { Platform } from "react-native";

export const BRAND = {
  green: "#00C853",              // verde de marca sobre fondo oscuro
  greenPressed: "#00A843",
  greenOnLight: "#0B7A3B",       // verde para texto y botones sobre claro
  greenOnLightPressed: "#095F2E",
  black: "#0B0F0E",              // negro profundo estructurador
  accent: "#F2A33C",             // ámbar para eventos y botón publicar
  accentTextOnLight: "#8A5200",
};

export const TOKENS = {
  // Paleta clara
  light: {
    primary: BRAND.greenOnLight,
    primaryPressed: BRAND.greenOnLightPressed,
    onPrimary: "#FFFFFF",
    bg: "#EEF5F0",
    surface: "#FFFFFF",
    surfaceDark: BRAND.black,
    surface2: "#F4FAF6",
    support: "#BDEBCF",
    text: BRAND.black,
    textMuted: "#4A5753",
    border: "#D6E2DB",
    borderField: "#7A8884",      // 3.7:1 sobre blanco
    borderFocus: BRAND.greenOnLight,
    success: BRAND.greenOnLight,
    successBg: "#E3F4EA",
    warning: BRAND.accent,
    warningBg: "#FBF0DE",
    error: "#C62828",
    errorBg: "#F9E7E4",
    accent: BRAND.accent,
    accentText: BRAND.accentTextOnLight,
    cardBg: "#FFFFFF",
  },

  // Paleta oscura (principal de marca)
  dark: {
    primary: BRAND.green,
    primaryPressed: BRAND.greenPressed,
    onPrimary: BRAND.black,      // contraste 8.6:1
    bg: BRAND.black,
    surface: "#141A18",
    surface2: "#1D2522",
    surfaceDark: BRAND.black,
    support: "#1D2522",
    text: "#F2F5F4",
    textMuted: "#A7B2AE",
    border: "#2F3A36",
    borderField: "#6B7A75",      // 4.3:1 sobre fondo
    borderFocus: BRAND.green,
    success: BRAND.green,
    successBg: "#12261B",
    warning: BRAND.accent,
    warningBg: "#2A1F12",
    error: "#FF6B6B",
    errorBg: "#2A1616",
    accent: BRAND.accent,
    accentText: BRAND.accent,
    cardBg: "#141A18",
  },

  // Espaciado base 4
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    screenMargin: 20,
    cardGap: 12,
    cardPadding: 16,
  },

  // Radios de redondeo
  radius: {
    control: 12,   // botones y campos de texto
    card: 16,      // tarjetas de evento y viaje
    round: 9999,   // chips, píldoras y avatares
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },

  // Sombras suaves difusas (tinta al 8%)
  shadows: {
    card: {
      shadowColor: "#0B0F0E",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    hover: {
      shadowColor: "#0B0F0E",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },

  // Tipografía: Sora (display/botones) e Inter (cuerpo/etiquetas)
  typography: {
    fonts: {
      display: Platform.select({
        ios: "Sora",
        android: "Sora",
        default: "Sora, -apple-system, BlinkMacSystemFont, sans-serif",
      }),
      body: Platform.select({
        ios: "Inter",
        android: "Inter",
        default: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }),
    },
    screen: {
      fontFamily: Platform.select({ ios: "Sora", android: "Sora", default: "Sora" }),
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
    },
    section: {
      fontFamily: Platform.select({ ios: "Sora", android: "Sora", default: "Sora" }),
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "700",
    },
    card: {
      fontFamily: Platform.select({ ios: "Sora", android: "Sora", default: "Sora" }),
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
    },
    button: {
      fontFamily: Platform.select({ ios: "Sora", android: "Sora", default: "Sora" }),
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "700",
    },
    body: {
      fontFamily: Platform.select({ ios: "Inter", android: "Inter", default: "Inter" }),
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "400",
    },
    meta: {
      fontFamily: Platform.select({ ios: "Inter", android: "Inter", default: "Inter" }),
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
    },
    label: {
      fontFamily: Platform.select({ ios: "Inter", android: "Inter", default: "Inter" }),
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
  },
};
