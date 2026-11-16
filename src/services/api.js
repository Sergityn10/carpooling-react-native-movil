// YouConnext - API Service (wrapper de compatibilidad)
// @deprecated — importar directamente desde los servicios específicos:
//   import { authService } from "../services";
//   import { usuarioService } from "../services";
//   import { viajeService } from "../services";
//   import { ubicacionService } from "../services";

import httpClient from "./httpClient";
import authService from "./authService";
import usuarioService from "./usuarioService";
import viajeService from "./viajeService";
import ubicacionService from "./ubicacionService";
import feedbackService from "./feedbackService";

// Proxy que delega al httpClient + servicios específicos
const apiService = {
  // Tokens
  setToken: (token) => httpClient.setToken(token),
  clearToken: () => httpClient.clearToken(),
  request: (endpoint, options) => httpClient.request(endpoint, options),

  // Auth
  ...authService,

  // Usuarios
  ...usuarioService,

  // Viajes
  ...viajeService,

  // Ubicaciones
  ...ubicacionService,

  // Feedback
  ...feedbackService,


  // Helpers
  healthCheck: () => httpClient.healthCheck(),
};

export { apiService };
export default apiService;
