// YouConnext - Car Service
import httpClient from "./httpClient";
import tokenStorage from "./tokenStorage";

/**
 * Función auxiliar para asegurar que el token de acceso
 * está configurado en el cliente HTTP antes de realizar la petición.
 */
async function asegurarToken() {
  try {
    const token = await tokenStorage.getAuthToken();
    if (token) {
      httpClient.setToken(token);
    }
  } catch (error) {
    console.warn("No se pudo recuperar el token seguro:", error);
  }
}

/**
 * Registra un nuevo coche asociado al usuario autenticado.
 * @param {Object} carData - Datos del coche
 * @returns {Promise<Object>} Respuesta de la API
 */
async function crearCoche(carData) {
  await asegurarToken();
  return httpClient.request("/api/cars", {
    method: "POST",
    body: JSON.stringify(carData),
  });
}

/**
 * Obtiene todos los coches asociados a un usuario específico.
 * @param {number|string} userId - ID del usuario
 * @returns {Promise<Object>} Respuesta con el listado de coches
 */
async function obtenerCochesUsuario(userId) {
  await asegurarToken();
  return httpClient.request(`/api/cars/user/${userId}`);
}

/**
 * Actualiza los datos de un coche específico por su ID.
 * @param {number|string} carId - ID del coche (id_coche)
 * @param {Object} carData - Datos a actualizar
 * @returns {Promise<Object>} Respuesta de la API
 */
async function actualizarCoche(carId, carData) {
  await asegurarToken();
  return httpClient.request(`/api/cars/${carId}`, {
    method: "PUT",
    body: JSON.stringify(carData),
  });
}

/**
 * Elimina un coche por su ID.
 * @param {number|string} carId - ID del coche (id_coche)
 * @returns {Promise<Object>} Respuesta de la API
 */
async function eliminarCoche(carId) {
  await asegurarToken();
  return httpClient.request(`/api/cars/${carId}`, {
    method: "DELETE",
  });
}

/**
 * Obtiene los datos de un coche específico por su ID.
 * @param {number|string} carId - ID del coche (id_coche)
 * @returns {Promise<Object>} Respuesta de la API
 */
async function obtenerCochePorId(carId) {
  await asegurarToken();
  return httpClient.request(`/api/cars/${carId}`);
}

export const carService = {
  crearCoche,
  obtenerCochesUsuario,
  actualizarCoche,
  eliminarCoche,
  obtenerCochePorId,
};

export default carService;
