# YouConnext — Sistema de Diseño

> **Versión:** 1.0  
> **Fecha:** Septiembre 2026  
> **Objetivo:** Documento de referencia para replicar la identidad visual y UX de YouConnext en la web y futuros componentes.

---

## 1. ADN de Marca

**YouConnext** es una plataforma de carpooling (compartir trayectos) con un fuerte enfoque en tres pilares:

- **Sostenibilidad** — Movilidad verde, reducción de emisiones
- **Comunidad** — Conexión entre personas, confianza
- **Movimiento / Dinamismo** — Viajes, desplazamientos, energía

### Personalidad de marca

| Rasgo         | Aplicación UI                                             |
| ------------- | -------------------------------------------------------- |
| Cercana       | Lenguaje en español, tono casual pero profesional         |
| Transparente  | Precios, plazas y valoraciones siempre visibles           |
| Activa        | Colores vibrantes, transiciones, feedback visual inmediato |
| Organizada    | Jerarquía visual clara, chips, badges, secciones delimitadas |

---

## 2. Paleta de Colores

### 2.1 Colores principales

| Nombre           | Hex       | Uso                                             |
| ---------------- | --------- | ----------------------------------------------- |
| **Verde Bosque** | `#0D9F6E` | Color primario. Botones principales, CTAs, marca |
| Verde Bosque Osc | `#0A7E58` | Hover/pressed sobre elementos primarios         |
| Verde Bosque Clr | `#10B981` | Acentos claros, badges de éxito                 |
| Verde Bosque Sft | `#D1FAE5` | Fondos suaves de éxito, chips activos            |
| **Azul Océano**  | `#0EA5E9` | Color secundario. Enlaces, indicadores informativos |
| Azul Océano Osc  | `#0284C7` | Hover/pressed sobre secundario                  |
| Azul Océano Clr  | `#38BDF8` | Acentos claros de info                          |
| Azul Océano Sft  | `#E0F2FE` | Fondos suaves de info                           |
| **Lima Solar**   | `#84CC16` | Color de acento. Energía, comunidad, badges     |
| Lima Solar Osc   | `#65A30D` | Hover/pressed sobre acento                      |
| Lima Solar Clr   | `#A3E635` | Acentos claros                                  |
| Lima Solar Sft   | `#ECFCCB` | Fondos suaves de acento                         |

### 2.2 Neutros

| Token      | Hex       | Uso                      |
| ---------- | --------- | ------------------------ |
| `white`    | `#FFFFFF` | Texto principal, fondos  |
| `gray50`   | `#FAFAFA` | Fondo principal          |
| `gray100`  | `#F4F4F5` | Fondo secundario         |
| `gray200`  | `#E4E4E7` | Bordes sutiles           |
| `gray300`  | `#D4D4D8` | Bordes, chips desactivados |
| `gray400`  | `#A1A1AA` | Placeholder, texto sec   |
| `gray500`  | `#71717A` | Texto secundario         |
| `gray600`  | `#52525B` | Texto terciario          |
| `gray700`  | `#27272A` | Texto principal          |
| `gray800`  | `#18181B` | Texto muy oscuro         |
| `gray900`  | `#09090B` | Texto máximo contraste   |

### 2.3 Estados

| Estado    | Hex (primario) | Hex (fondo suave) | Uso                        |
| --------- | -------------- | ------------------ | -------------------------- |
| Éxito     | `#10B981`      | `#D1FAE5`          | Confirmaciones, viajes ok  |
| Advertencia| `#F59E0B`     | `#FEF3C7`          | Alertas, pendientes        |
| Error     | `#EF4444`      | `#FEE2E2`          | Errores, cancelaciones     |
| Info      | `#0EA5E9`      | `#E0F2FE`          | Notificaciones informativas|

### 2.4 Fondos

| Token                  | Hex       |
| ---------------------- | --------- |
| `background`           | `#FAFAFA` |
| `backgroundSecondary`  | `#F4F4F5` |
| `cardBackground`       | `#FFFFFF` |

### 2.5 Gradientes

Se utilizan en headers, hero sections y elementos destacados. Siempre en dirección de izquierda a derecha (o top-bottom en vertical).

| Gradiente      | Inicio    | Fin       | Uso                      |
| --------------- | --------- | --------- | ------------------------ |
| Verde           | `#0D9F6E` | `#10B981` | Headers, auth, branding  |
| Azul            | `#0EA5E9` | `#38BDF8` | Datos, estadísticas      |
| Lima            | `#84CC16` | `#A3E635` | Comunidad, logros        |

---

## 3. Tipografía

### 3.1 Pila de fuentes

| Contexto        | Font-family                |
| --------------- | -------------------------- |
| UI general      | `System` (iOS: SF Pro, Android: Roboto) |
| Títulos/Display | `System` con `font-weight: 700-800` |
| Monospace/código| N/A (no usada)             |

> **Nota:** No se importa ninguna fuente custom. Se confía en la fuente del sistema para rendimiento y legibilidad nativa.

### 3.2 Escala tipográfica

| Token   | tamaño | uso                                |
| ------- | ------ | ---------------------------------- |
| `xs`    | 12     | Meta información, badges            |
| `sm`    | 14     | Texto secundario, sub-labels        |
| `md`    | 16     | Texto principal, body              |
| `lg`    | 18     | Subtítulos, card titles            |
| `xl`    | 20     | Secciones, screen titles           |
| `xxl`   | 24     | Títulos grandes, sheet titles      |
| `xxxl`  | 32     | Display, hero                      |
| `title` | 40     | Página principal, splash           |

### 3.3 Pesos

- **Regular** (`400`) → Texto body, descripciones
- **Medium** (`500`) → Labels, subtítulos
- **Semi-bold** (`600`) → Botones, nombres de rutas, datos importantes
- **Bold** (`700`) → Títulos, CTAs principales

---

## 4. Espaciado

Sistema basado en 4px. Se aplica consistentemente a padding, margin, gap.

| Token | Valor | Uso                             |
| ----- | ----- | ------------------------------- |
| `xs`  | 4     | Gaps mínimos, padding interno   |
| `sm`  | 8     | Gaps estándard entre elementos  |
| `md`  | 16    | Padding horizontal, margen sección |
| `lg`  | 24    | Padding sheets, margen grande   |
| `xl`  | 32    | Separación secciones           |
| `xxl` | 48    | Espaciado de página completa    |

---

## 5. Bordes y Radios

| Token   | Valor | Uso                                        |
| ------- | ----- | ------------------------------------------ |
| `sm`    | 8     | Botones pequeños, badges, inputs           |
| `md`    | 12    | Bots. principales, cards, date chips       |
| `lg`    | 16    | Cards grandes, contenedores de sección     |
| `xl`    | 24    | Sheets, modales, contenedores de overlay   |
| `full`  | 9999  | Chips, tags, avatares, botones circulares  |

---

## 6. Sombras

| Nivel  | shadowColor | offset        | opacity | radius | elevation |
| ------ | ----------- | ------------- | ------- | ------ | --------- |
| Small  | `#000`      | `{0, 2}`      | 0.10    | 4      | 2         |
| Medium | `#000`      | `{0, 4}`      | 0.15    | 8      | 4         |
| Large  | `#000`      | `{0, 8}`      | 0.20    | 16     | 8         |

Se aplican mediante `SHADOWS.small/medium/large` en todos los componentes elevados.

---

## 7. Componentes Core

### 7.1 Botones (`Button`)

**Props:** `variant`, `size`, `disabled`, `loading`, `icon`

| Variant     | Background          | Border                 | Text Color |
| ----------- | ------------------- | ---------------------- | ---------- |
| `primary`   | `COLORS.primary`    | —                      | `white`    |
| `secondary` | `COLORS.secondary`  | —                      | `white`    |
| `outline`   | `transparent`       | 2px `COLORS.primary`   | `primary`  |
| `ghost`     | `transparent`       | ninguna                | `primary`  |
| `disabled`  | `COLORS.gray300`    | `gray300`              | `gray500`  |

| Size     | Padding V | Padding H | Font-size |
| -------- | --------- | --------- | --------- |
| `small`  | 8         | 16        | 14        |
| `medium` | 16        | 24        | 16        |
| `large`  | 24        | 32        | 18        |

---

### 7.2 Cards (Cards/EventCard, ViajeCard)

- **Border radius:** lg (16px)
- **Background:** `cardBackground` (`#FFFFFF`)
- **Shadow:** `SHADOWS.medium`
- **Padding interno:** `SPACING.md` (16px)
- **Colores de acento por tipo:** cada tarjeta lleva un color de icono contextual

---

### 7.3 Chips / Badges / Tags

- **Border radius:** `full` (9999px) para tags; `md` (12px) para date chips
- **Padding:** H: `SPACING.md` (16px), V: `SPACING.sm` (8px)
- **Fondo activo:** `COLORS.primarySoft` con texto `COLORS.primary`
- **Fondo inactivo:** `COLORS.white` con borde `COLORS.gray200`

---

### 7.4 Bottom Sheets / Modales

Patrón usado en `SearchBottomSheet`, `LocationSelectSheet`:

- **Overlay:** `rgba(0, 0, 0, 0.5)` (50% black)
- **Sheet height:** `60%` de la pantalla (`SCREEN_HEIGHT * 0.6`)
- **Header:** Título (`fontSize: 18, bold`) + botón cerrar (`X, 20px, gray600`)
- **Animación:** Slide up (`Animated.timing` 300ms)
- **Botón primario abajo:** Siempre fuera del scroll, sticky bottom

```js
// Pattern
<Modal visible transparent animationType="none">
  <View style={overlay}>
    <TouchableOpacity style={backdrop} onPress={handleClose} />
    <Animated.View style={[sheet, { transform: [{ translateY: slideAnim }] }]}>
      <View style={handleBar} />
      {/* Header, content, footer */}
    </Animated.View>
  </View>
</Modal>
```

---

### 7.5 Inputs / Formularios

| Estado        | Border Color     | Background      |
| ------------- | ---------------- | --------------- |
| Default       | `COLORS.gray200` | `COLORS.white`  |
| Focus/active  | `COLORS.primary` | `COLORS.white`  |
| Error         | `COLORS.error`   | `COLORS.white`  |
| Disabled      | `COLORS.gray300` | `COLORS.gray100`|

- **Border radius:** `md` (12px)
- **Padding:** H: `SPACING.md` (16px), V: `SPACING.sm` (8px)
- **Font-size:** `md` (16px)

---

### 7.6 Iconos

**Librería:** `lucide-react-native`

| Tamaño común | Componente                |
| ------------ | ------------------------- |
| 14px         | Inline tags, sub-labels   |
| 16px         | List items, date chips    |
| 18px         | Input icons, nav icons    |
| 20px         | Buttons, close buttons    |
| 22-24px      | Empty states, main icons  |
| 32px+        | Hero sections, placeholders |

**Stroke width:** 1.5 (placeholder) · 2 (estado activo) · 2.5 (acciones importantes)

Iconos comunes usados:
- `MapPin`, `Navigation`, `Clock`, `Calendar`, `Search`, `X`, `ChevronRight`
- `Home`, `Briefcase`, `BookOpen`, `Dumbbell` (ubicaciones guardadas)
- `CheckCircle2`, `Building2`, `Ticket`, `Tag`, `CalendarDays`

---

## 8. Patrones de Layout

### Homescreen / SearchScreen (patrón "Discover")

```
[Header sticky]
├── Greeting + fecha
├── Chips horizontales (Ubicaciones guardadas)
├── Inputs Origen / Destino (con iconos)
├── Chips de fecha (Hoy / Mañana / [día])
└── Búsquedas recientes (lista vertical con icono Clock)

[Scroll body]
├── Sección — Trayectos recomendados
├── Sección — Eventos cercanos
└── Sección — Mis planes
```

### Trip Detail Screen

```
[Hero image]
├── Badges (tipo, evento, conductor)
[Info section]
├── Conductor (avatar, nombre, rating)
├── Ruta con línea de puntos (origen → destino)
├── Fecha, hora, precio, plazas
├── Mensaje a conductor (input)
└── Botón - Solicitar plaza (full width, primary)

[Comentarios section]
[QRCodeModal - solo conductor]
```

---

## 9. Navegación

**Biblioteca:** React Navigation (Native Stack + Bottom Tabs)

### Bottom Tabs

| Tab      | Icono           | Screen                  |
| -------- | --------------- | ----------------------- |
| Inicio   | `Home`          | `HomeScreen`            |
| Buscar   | `Search`        | `SearchTrayectosScreen` |
| Mis Planes| `CalendarDays` | `MisTrayectosScreen`    |
| Perfil   | `User`          | `PerfilScreen`          |

- **Activo:** `COLORS.primary` + dot indicator
- **Inactivo:** `COLORS.gray400`
- **Background:** `COLORS.white`
- **Border top:** `COLORS.gray200`, 1px

### Stack principal

```
Root
├── Auth (Login/Register)
├── AppTabs
│   ├── Home
│   ├── Buscar
│   ├── MisPlanes
│   └── Perfil
├── EventScreens (3 niveles)
├── TripScreens (2 niveles)
└── Settings/ProfileScreens
```

---

## 10. SEO y Web Considerations

### 10.1 Meta tags sugeridos (para web)

```html
<title>YouConnext — Tu carpooling de confianza</title>
<meta name="description" content="Comparte trayectos, súmate a eventos y viaja con personas como tú. Sostenible, económico y social." />
<meta property="og:title" content="YouConnext" />
<meta property="og:description" content="Plataforma de carpooling sostenible. Comparte trayectos y eventos." />
<meta property="og:image" content="/logo-con-bg.png" />
<meta property="og:type" content="website" />
<meta name="theme-color" content="#0D9F6E" />
```

### 10.2 URL Structure (recomendada para SEO)

```
/                    → Splash/redirect
/buscar              → Search UI
/trayecto/:id        → Trip detail
/evento/:id          → Event detail
/mis-trayectos       → User trips
/perfil              → User profile
/unirse/:tripId      → QR join redirect
```

### 10.3 Schema.org sugeridos

- `Organization` — nombre, logo, redes sociales
- `SoftwareApplication` / `MobileApplication` — nombre, rating, descripción
- `Trip` — origen, destino, fecha, conductor, plazas

---

## 11. Animaciones y Transiciones

| Caso              | Duración | Tipo                        |
| ----------------- | -------- | --------------------------- |
| Slide up sheet    | 300ms    | `Animated.timing`           |
| Slide down sheet  | 250ms    | `Animated.timing`           |
| Fade in backdrop  | n/a      | Solo slide, no fade         |
| Botón disabled    | n/a      | Immediate (no animation)    |
| Loading state     | —        | `ActivityIndicator` spinner |

---

## 12. Estados Vacíos / Empty States

Patrón estándar:

- **Icono grande:** 48-64px, color `gray300` o `gray400`, strokeWidth 1.5
- **Título:** `fontSize: md, fontWeight: bold, color: gray700`
- **Descripción:** `fontSize: sm, color: gray500`
- **CTA opcional:** `Button variant="primary"` si acción clara

---

## 13. Iconos de Ubicación Guardadas (mapeo)

| Tipo         | Icono      | Color        | Uso                |
| ------------ | ---------- | ------------ | ------------------ |
| `home`       | `Home`     | `primary`    | Domicilio          |
| `work`       | `Briefcase`| `primary`    | Trabajo            |
| `university` | `BookOpen` | `primary`    | Universidad        |
| `gym`        | `Dumbbell` | `primary`    | Gimnasio           |
| `other`      | `MapPin`   | `primary`    | Otro lugar         |

---

## 14. Registry de Componentes Clave

| Componente               | Ruta                                        |
| ------------------------ | ------------------------------------------- |
| `Button`                 | `src/components/common/Button.js`           |
| `EventCard`              | `src/components/events/EventCard.js`        |
| `ViajeCard`              | `src/components/trips/ViajeCard.js`         |
| `SearchBottomSheet`      | `src/components/search/SearchBottomSheet.js`|
| `LocationSelectSheet`    | `src/components/search/LocationSelectSheet.js` |
| `PlaceAutocompleteInput` | `src/components/search/PlaceAutocompleteInput.js` |
| `QRCodeModal`            | `src/components/trips/QRCodeModal.js`      |
| `TripMapPreview`         | `src/components/trips/TripMapPreview.js`   |
| `LiveTripMap`            | `src/components/tracking/LiveTripMap.js`   |
| `ProfileView`            | `src/components/profile/ProfileView.js`    |
| `Skeleton`               | `src/components/common/Skeleton.js`         |

Todos importan tokens desde `src/constants/index.js` — nunca hardcodear colores, tamaños, radios ni sombras directamente.
