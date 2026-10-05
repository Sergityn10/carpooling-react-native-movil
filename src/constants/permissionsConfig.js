// YouConnext - Permissions Configuration & Prominent Disclosure Constants
// Cumplimiento estricto de directivas de Google Play (Prominent Disclosure & Consent) y Apple App Store

export const PERMISSION_TYPES = {
  LOCATION_FOREGROUND: "LOCATION_FOREGROUND",
  LOCATION_BACKGROUND: "LOCATION_BACKGROUND",
  CAMERA: "CAMERA",
  MEDIA_LIBRARY: "MEDIA_LIBRARY",
  NOTIFICATIONS: "NOTIFICATIONS",
};

export const PERMISSION_CHOICE_STATUS = {
  NOT_DETERMINED: "not_determined",
  GRANTED: "granted",
  DECLINED: "declined", // El usuario pulsó "Ahora no"
  BLOCKED: "blocked", // Denegado permanentemente en el OS
};

export const PERMISSIONS_CONFIG = {
  [PERMISSION_TYPES.LOCATION_FOREGROUND]: {
    id: PERMISSION_TYPES.LOCATION_FOREGROUND,
    name: "Ubicación en primer plano",
    shortName: "Ubicación",
    icon: "MapPin",
    badgeColor: "#0D9F6E",
    badgeBg: "#D1FAE5",
    title: "Permiso de Ubicación",
    subtitle: "Aviso destacado de privacidad y uso de datos",
    summary:
      "YouConnext necesita acceder a tu ubicación precisa mientras usas la aplicación para conectarte con viajes y eventos cercanos.",
    dataCollected: [
      {
        title: "Datos de geolocalización precisa (GPS)",
        description:
          "Se obtienen tus coordenadas de latitud y longitud mientras la aplicación está en uso en pantalla.",
      },
    ],
    purposeList: [
      {
        title: "Búsqueda de trayectos y eventos cercanos",
        description:
          "Mostrarte conductores, pasajeros y eventos en tu radio de proximidad sin tener que escribir tu ciudad manualmente.",
      },
      {
        title: "Cálculo de rutas y puntos de encuentro",
        description:
          "Calcular la distancia exacta y el tiempo estimado hasta el punto de recogida o destino del viaje compartido.",
      },
      {
        title: "Verificación de paradas en ruta",
        description:
          "Facilitar la confirmación de subida al coche en el punto de encuentro acordado.",
      },
    ],
    googlePlayNotice:
      "YouConnext recopila datos de ubicación para permitir la búsqueda de viajes cercanos, cálculo de rutas y puntos de encuentro únicamente mientras usas la app.",
    degradationNotice:
      "Si prefieres no permitir el acceso a la ubicación, podrás seguir buscando y creando trayectos escribiendo manualmente los nombres de las ciudades y direcciones en el buscador.",
    ctaAcceptText: "Entendido y permitir",
    ctaDeclineText: "Ahora no, usaré búsqueda manual",
    settingsMessage:
      "El permiso de ubicación está desactivado en los ajustes de tu teléfono. Puedes activarlo manualmente para disfrutar de búsqueda automática.",
  },

  [PERMISSION_TYPES.LOCATION_BACKGROUND]: {
    id: PERMISSION_TYPES.LOCATION_BACKGROUND,
    name: "Ubicación en segundo plano",
    shortName: "Ubicación en segundo plano",
    icon: "Radio",
    badgeColor: "#0EA5E9",
    badgeBg: "#E0F2FE",
    title: "Seguimiento en Segundo Plano",
    subtitle: "Aviso destacado para conductores y seguimiento de viaje",
    summary:
      "Para que los pasajeros vean tu posición en tiempo real mientras conduces con la pantalla apagada o usando Waze/Google Maps, YouConnext requiere acceso continuo a la ubicación.",
    dataCollected: [
      {
        title: "Ubicación periódica continua durante viajes activos",
        description:
          "Se transmiten coordenadas GPS únicamente mientras tengas un viaje en curso activo como conductor.",
      },
    ],
    purposeList: [
      {
        title: "Navegación con otras aplicaciones abiertas",
        description:
          "Permite que uses tu app de navegación favorita (Google Maps, Waze, etc.) mientras YouConnext sigue transmitiendo el progreso del trayecto.",
      },
      {
        title: "Tranquilidad y seguridad para los pasajeros",
        description:
          "Tus acompañantes podrán ver en su mapa cómo te aproximas al punto de recogida en tiempo real aunque guardes el móvil en el soporte.",
      },
      {
        title: "Verificación automática de llegada",
        description:
          "Detección inteligente de llegada a los puntos acordados sin que tengas que manipular el teléfono mientras conduces.",
      },
    ],
    googlePlayNotice:
      "YouConnext recopila datos de ubicación para habilitar el seguimiento del viaje compartido en tiempo real y la notificación de llegada a los pasajeros incluso cuando la aplicación está cerrada o no está en uso (durante un viaje en curso).",
    osInstructionNotice:
      "En la siguiente pantalla de ajustes del sistema, por favor selecciona la opción 'Permitir todo el tiempo' o 'Permitir siempre' para garantizar el correcto funcionamiento del tracking.",
    degradationNotice:
      "Si decides no habilitar la ubicación en segundo plano, podrás realizar el viaje con el 'Modo Manual', donde deberás confirmar manualmente con botones cada parada de recogida y llegada.",
    ctaAcceptText: "Entendido y continuar",
    ctaDeclineText: "Ahora no, usaré modo manual",
    settingsMessage:
      "Para habilitar el tracking automático en segundo plano, selecciona 'Permitir todo el tiempo' en los ajustes de ubicación de tu dispositivo.",
  },

  [PERMISSION_TYPES.CAMERA]: {
    id: PERMISSION_TYPES.CAMERA,
    name: "Acceso a la cámara",
    shortName: "Cámara",
    icon: "Camera",
    badgeColor: "#84CC16",
    badgeBg: "#ECFCCB",
    title: "Permiso de Cámara",
    subtitle: "Aviso destacado para escaneo de códigos QR",
    summary:
      "YouConnext utiliza la cámara exclusivamente para escanear los códigos QR de verificación al subir a un viaje compartido.",
    dataCollected: [
      {
        title: "Transmisión de vídeo en vivo para escaneo",
        description:
          "La cámara solo procesa visualmente el código QR en tiempo real. No se graban ni se guardan fotografías ni vídeos en servidores.",
      },
    ],
    purposeList: [
      {
        title: "Validación de subida al vehículo (Check-in)",
        description:
          "Confirmar de forma instantánea y segura que el pasajero ha subido al vehículo del conductor correcto.",
      },
      {
        title: "Evitar fraudes y confusiones",
        description:
          "Garantizar la identidad y seguridad de todos los integrantes del viaje compartido.",
      },
    ],
    googlePlayNotice:
      "YouConnext utiliza la cámara únicamente para el escaneo de códigos QR de validación de pasajeros durante el inicio o transcurso del viaje compartido.",
    degradationNotice:
      "Si no permites el acceso a la cámara, podrás unirte al viaje introduciendo manualmente el código alfanumérico que el conductor te mostrará en pantalla.",
    ctaAcceptText: "Entendido y permitir",
    ctaDeclineText: "Ahora no, usaré código manual",
    settingsMessage:
      "El acceso a la cámara está desactivado. Puedes activarlo en los ajustes para escanear códigos QR rápidamente.",
  },

  [PERMISSION_TYPES.MEDIA_LIBRARY]: {
    id: PERMISSION_TYPES.MEDIA_LIBRARY,
    name: "Acceso a fotos y galería",
    shortName: "Galería de fotos",
    icon: "Image",
    badgeColor: "#F59E0B",
    badgeBg: "#FEF3C7",
    title: "Acceso a la Galería",
    subtitle: "Aviso destacado para fotos de perfil y vehículo",
    summary:
      "YouConnext solicita acceso a tus fotos para que puedas personalizar tu perfil y subir fotografías de tu coche.",
    dataCollected: [
      {
        title: "Imágenes seleccionadas explícitamente",
        description:
          "Solo se accede a las fotografías específicas que elijas manualmente desde tu galería. No se escanea ni lee el resto de tu almacenamiento.",
      },
    ],
    purposeList: [
      {
        title: "Foto de perfil de usuario",
        description:
          "Aumentar la confianza y facilitar el reconocimiento mutuo entre conductores y pasajeros.",
      },
      {
        title: "Fotos del vehículo compartido",
        description:
          "Mostrar a los pasajeros el modelo, color y estado de tu vehículo para localizarlo fácilmente.",
      },
    ],
    googlePlayNotice:
      "YouConnext accede únicamente a las imágenes que selecciones expresamente de tu galería para la personalización de tu perfil y la ficha de tu vehículo.",
    degradationNotice:
      "Si prefieres no dar acceso a tu galería, tu perfil mantendrá un avatar con tus iniciales y un icono genérico para tu vehículo.",
    ctaAcceptText: "Entendido y seleccionar foto",
    ctaDeclineText: "Ahora no, usaré avatar por defecto",
    settingsMessage:
      "El acceso a tus fotos está desactivado. Puedes activarlo en ajustes si deseas subir imágenes personalizadas.",
  },

  [PERMISSION_TYPES.NOTIFICATIONS]: {
    id: PERMISSION_TYPES.NOTIFICATIONS,
    name: "Notificaciones push",
    shortName: "Notificaciones",
    icon: "Bell",
    badgeColor: "#0D9F6E",
    badgeBg: "#D1FAE5",
    title: "Permiso de Notificaciones",
    subtitle: "Aviso destacado para avisos y alertas de viaje",
    summary:
      "Recibe avisos al instante sobre el estado de tus reservas, mensajes de chat y alertas importantes sobre tus viajes.",
    dataCollected: [
      {
        title: "Identificador de dispositivo para entrega de avisos",
        description:
          "Se registra un token seguro de notificación para enviar alertas directamente a tu teléfono.",
      },
    ],
    purposeList: [
      {
        title: "Alertas de reserva y confirmación",
        description:
          "Saber inmediatamente cuando un conductor acepta tu solicitud de plaza o cuando un pasajero se une a tu viaje.",
      },
      {
        title: "Mensajes de chat en tiempo real",
        description:
          "No perderte mensajes importantes para coordinar el punto de recogida con tus acompañantes.",
      },
      {
        title: "Avisos de llegada y cambios en el viaje",
        description:
          "Alertas de proximidad cuando el vehículo esté cerca de tu parada.",
      },
    ],
    googlePlayNotice:
      "YouConnext utiliza las notificaciones para enviarte avisos operativos cruciales sobre tus reservas, chats y estado de los viajes compartidos.",
    degradationNotice:
      "Si no activas las notificaciones, no recibirás alertas con la app cerrada, pero podrás consultar todas las novedades dentro de la app o mediante correo electrónico.",
    ctaAcceptText: "Entendido y activar",
    ctaDeclineText: "Ahora no, revisaré en la app",
    settingsMessage:
      "Las notificaciones están desactivadas. Puedes activarlas en los ajustes de tu móvil para no perderte avisos de tus viajes.",
  },
};
