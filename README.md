# 🚗 YouConnext - App Móvil

Aplicación móvil de carpooling desarrollada con React Native (Expo) para la plataforma YouConnext.

## Características

- ✅ Creación de viajes rápidos con tracking GPS
- ✅ Sistema de códigos QR para unirse a viajes
- ✅ Registro de ubicaciones en tiempo real
- ✅ Historial de viajes y estadísticas
- ✅ Perfil de usuario con gestión de datos
- ✅ Diseño moderno con la identidad de marca YouConnext

## Stack Tecnológico

- **Framework**: React Native con Expo
- **Navegación**: React Navigation (Native Stack + Bottom Tabs)
- **Ubicación**: expo-location
- **Cámara**: expo-camera
- **QR Code**: react-native-qrcode-svg + react-native-svg
- **Almacenamiento**: @react-native-async-storage/async-storage
- **Estado**: Context API (UserContext + ViajeContext)

## Colores de Marca

- **Azul Eléctrico** (#0066FF): Juventud y Movimiento
- **Amarillo Sol** (#FFB800): Comunidad
- **Verde Esmeralda** (#00B894): Sostenibilidad

## Requisitos

- Node.js >= 16.x
- npm o yarn
- Expo CLI
- Android Studio / Xcode (para emulator)
- Desactivacion del Play Protect para pruebas standalone

## Instalación

```bash
# Navegar al directorio de la app
cd YouConnextApp

# Instalar dependencias
npm install
npx expo prebuild --clean
npx expo prebuild --platform android --no-install
eas build:configure
 eas build --platform android --profile preview
 eas build --platform android --profile production
 # Para Windows (PowerShell)
 
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# Iniciar en desarrollo
npx expo run:android     
npx expo start
```

## Scripts Disponibles

| Script            | Descripción        |
| ----------------- | ------------------ |
| `npm run android` | Iniciar en Android |
| `npm run ios`     | Iniciar en iOS     |
| `npm run web`     | Iniciar en web     |
| `npx expo start`  | Iniciar Expo       |

## Estructura del Proyecto

```
YouConnextApp/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── Button.js
│   │   ├── ViajeCard.js
│   │   └── QRCodeModal.js
│   ├── constants/        # Constantes y configuración
│   │   └── index.js
│   ├── context/          # Contextos de estado
│   │   ├── UserContext.js
│   │   └── ViajeContext.js
│   ├── navigation/       # Navegación de la app
│   │   └── AppNavigator.js
│   ├── screens/          # Pantallas de la app
│   │   ├── HomeScreen.js
│   │   ├── PerfilScreen.js
│   │   ├── EscanearQRScreen.js
│   │   └── ViajeDetalleScreen.js
│   └── services/         # Servicios API
│       └── api.js
├── App.js                # Entry point
└── package.json
```

## Endpoints de la API

La app se conecta al backend en `http://localhost:3000`. Asegúrate de que el backend esté corriendo antes de probar la app.

### Endpoints principales:

- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/dni/:dni` - Obtener usuario por DNI
- `POST /api/viajes` - Crear viaje
- `GET /api/viajes/:id` - Obtener viaje
- `POST /api/viajes/unirse` - Unirse a viaje
- `PUT /api/viajes/:id/iniciar` - Iniciar viaje
- `PUT /api/viajes/:id/completar` - Completar viaje
- `POST /api/ubicaciones` - Registrar ubicación GPS

## Permisos Necesarios

La app solicita los siguientes permisos:

- **Ubicación**: Para tracking GPS en tiempo real
- **Cámara**: Para escanear códigos QR

## Conexión con Backend

Para conectar la app con el backend, asegúrate de:

1. Ejecutar el backend: `cd ../backend && npm run dev`
2. Verificar que la URL en `src/constants/index.js` sea correcta
3. La app guardará datos localmente si el backend no está disponible

## Licencia

MIT © YouConnext