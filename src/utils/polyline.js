// YouConnext - Decodificación de Polilíneas en el Cliente (Layer 1)
// Algoritmo optimizado para decodificar strings compactos (Google Encoded Polyline Format)

/**
 * Decodifica un string de Google Encoded Polyline en un array de pares [lat, lng].
 * Cumple con el estándar de cliente ligero (1-2 KB de carga útil).
 * 
 * @param {string} encoded - String codificado
 * @returns {[number, number][]} Array de pares [lat, lng]
 */
export function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== "string") return [];

  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    // Devuelve [lat, lng]
    points.push([lat * 1e-5, lng * 1e-5]);
  }

  return points;
}

/**
 * Decodifica a formato React Native Maps: [{ latitude, longitude }]
 * 
 * @param {string} encoded - String codificado
 * @returns {{ latitude: number, longitude: number }[]}
 */
export function decodePolylineToLatLng(encoded) {
  if (!encoded || typeof encoded !== "string") return [];

  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return points;
}

/**
 * Decodifica a coordenadas estándar GeoJSON: [[longitude, latitude]]
 * 
 * @param {string} encoded - String codificado
 * @returns {[number, number][]} Array de [lng, lat]
 */
export function decodePolylineToGeoJSON(encoded) {
  if (!encoded || typeof encoded !== "string") return [];

  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    // En GeoJSON el orden estándar es [lng, lat]
    points.push([lng * 1e-5, lat * 1e-5]);
  }

  return points;
}
