// YouConnext - Services Index
export { httpClient } from "./httpClient";
export { authService } from "./authService";
export { usuarioService } from "./usuarioService";
export { viajeService } from "./viajeService";
export { ubicacionService } from "./ubicacionService";
export { carService } from "./carService";

// Travels services
export { trayectoService } from "./travels/trayectoService";
export { comentarioService } from "./travels/comentarioService";
export { reservaService } from "./travels/reservaService";
export { preferenciaService } from "./travels/preferenciaService";
export { ubicacionTravelService } from "./travels/ubicacionService";
export { combustibleService } from "./travels/combustibleService";
export { rutaFrecuenteService } from "./travels/rutaFrecuenteService";
export { alertaService } from "./travels/alertaService";

// Payments & Real-time Stream
export { paymentService } from "./paymentService";
export { movementStreamService } from "./movementStreamService";

// Events
export { eventService } from "./eventService";
export { eventCache } from "./eventCache";

// Notifications
export { notificacionService } from "./notifications/notificacionService";

// Enterprise & Organizations
export { enterpriseService } from "./enterpriseService";

// Feedback
export { feedbackService } from "./feedbackService";


// Storage & Cache Protection
export { storageManager, safeSetItem, safeMultiSet, purgeVolatileCaches } from "./storageManager";
