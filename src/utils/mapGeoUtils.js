// YouConnext - Utilidades Geoespaciales para Mapa Interactivo
// Cálculo de Bounding Box, nivel de zoom, distancias, simplificación RDP y decodificación de Polilíneas

const EARTH_RADIUS_KM = 6371;

export function regionToBoundingBox(region) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  const halfLatDelta = latitudeDelta / 2;
  const halfLngDelta = longitudeDelta / 2;

  return {
    minLat: latitude - halfLatDelta,
    maxLat: latitude + halfLatDelta,
    minLng: longitude - halfLngDelta,
    maxLng: longitude + halfLngDelta,
  };
}

export function boundingBoxToRegion(bbox) {
  const { minLat, maxLat, minLng, maxLng } = bbox;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: maxLat - minLat,
    longitudeDelta: maxLng - minLng,
  };
}

export function latitudeDeltaToZoom(latitudeDelta) {
  if (!latitudeDelta || latitudeDelta <= 0) return 15;
  const zoom = Math.log2(360 / latitudeDelta);
  return Math.max(1, Math.min(20, Math.round(zoom)));
}

export function zoomToLatitudeDelta(zoom) {
  const clampedZoom = Math.max(1, Math.min(20, zoom));
  return 360 / Math.pow(2, clampedZoom);
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export function pointInBoundingBox(point, bbox) {
  const { latitude, longitude } = point;
  return (
    latitude >= bbox.minLat &&
    latitude <= bbox.maxLat &&
    longitude >= bbox.minLng &&
    longitude <= bbox.maxLng
  );
}

export function polylineInBoundingBox(coordinates, bbox) {
  if (!coordinates || coordinates.length === 0) return false;
  return coordinates.some((pt) =>
    pointInBoundingBox(
      Array.isArray(pt) ? { latitude: pt[1], longitude: pt[0] } : pt,
      bbox
    )
  );
}

/**
 * Algoritmo oficial de decodificación de Google Polyline format
 * Convierte strings compactos en array de coordenadas [{ latitude, longitude }]
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

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return points;
}

export function simplifyPolylineRDP(points, epsilon) {
  if (!points || points.length <= 2) return points;

  const findPerpendicularDistance = (point, start, end) => {
    const isArr = Array.isArray(point);
    const x0 = isArr ? point[0] : point.longitude;
    const y0 = isArr ? point[1] : point.latitude;
    const x1 = isArr ? start[0] : start.longitude;
    const y1 = isArr ? start[1] : start.latitude;
    const x2 = isArr ? end[0] : end.longitude;
    const y2 = isArr ? end[1] : end.latitude;

    const numerator = Math.abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1));
    const denominator = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    return denominator === 0
      ? Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2)
      : numerator / denominator;
  };

  const simplify = (pts, eps) => {
    let maxDist = 0;
    let index = 0;
    const end = pts.length - 1;

    for (let i = 1; i < end; i++) {
      const dist = findPerpendicularDistance(pts[i], pts[0], pts[end]);
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > eps) {
      const firstHalf = simplify(pts.slice(0, index + 1), eps);
      const secondHalf = simplify(pts.slice(index), eps);
      return firstHalf.slice(0, -1).concat(secondHalf);
    }

    return [pts[0], pts[end]];
  };

  return simplify(points, epsilon);
}

export function getPolylinePrecision(zoom) {
  if (zoom <= 9) return "bounds";
  if (zoom <= 14) return "simplified";
  return "full";
}

export function getSimplificationEpsilon(zoom) {
  if (zoom <= 10) return 0.002;
  if (zoom <= 12) return 0.0005;
  if (zoom <= 14) return 0.00015;
  return 0;
}

export function coordinatesToLatLngArray(coordinates) {
  if (!coordinates || !coordinates.length) return [];
  return coordinates.map((pt) => {
    if (Array.isArray(pt)) {
      return { latitude: pt[1], longitude: pt[0] };
    }
    return pt;
  });
}

/**
 * Obtiene las coordenadas del punto de origen de un trayecto
 */
export function getTripOriginCoords(trip) {
  if (!trip) return null;
  const lat = trip.puntosClave?.origen?.lat ?? trip.origen_lat ?? trip.origen?.lat;
  const lng = trip.puntosClave?.origen?.lng ?? trip.origen_lng ?? trip.origen?.lng;
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;
  return { latitude: Number(lat), longitude: Number(lng) };
}

/**
 * Obtiene las coordenadas del punto de destino de un trayecto
 */
export function getTripDestinationCoords(trip) {
  if (!trip) return null;
  const lat = trip.puntosClave?.destino?.lat ?? trip.destino_lat ?? trip.destino?.lat;
  const lng = trip.puntosClave?.destino?.lng ?? trip.destino_lng ?? trip.destino?.lng;
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;
  return { latitude: Number(lat), longitude: Number(lng) };
}

/**
 * Valida si un array de coordenadas de ruta es coherente con el origen del trayecto
 * Evita polilíneas corruptas o decodificadas erróneamente en el ecuador (0,0)
 */
export function areRouteCoordinatesValid(coords, origin = null) {
  if (!Array.isArray(coords) || coords.length < 2) return false;

  // Comprobar que no sean coordenadas nulas o en el golfo de Guinea (0,0)
  const isNearZero = coords.every((p) => Math.abs(p.latitude) < 0.5 && Math.abs(p.longitude) < 0.5);
  if (isNearZero) return false;

  // Si se dispone de origen, el punto inicial no debe distar más de 80km
  if (origin && typeof origin.latitude === "number" && typeof origin.longitude === "number") {
    const dist = calculateDistance(origin.latitude, origin.longitude, coords[0].latitude, coords[0].longitude);
    if (dist > 80) return false;
  }

  return true;
}

/**
 * Extrae y normaliza el array de coordenadas [{ latitude, longitude }] que componen el trayecto completo
 */
export function extractTripRouteCoordinates(trip) {
  if (!trip) return [];
  const origin = getTripOriginCoords(trip);
  const dest = getTripDestinationCoords(trip);

  // 0. Si el viaje ya tiene una ruta resuelta válida en memoria
  if (Array.isArray(trip.resolvedRoute) && trip.resolvedRoute.length >= 2) {
    if (areRouteCoordinatesValid(trip.resolvedRoute, origin)) {
      return trip.resolvedRoute;
    }
  }

  // 1. Prioridad: geometry (GeoJSON LineString [lng, lat]) - Precisión nativa sin errores de codificación
  if (trip.geometry?.coordinates && Array.isArray(trip.geometry.coordinates) && trip.geometry.coordinates.length >= 2) {
    const coords = trip.geometry.coordinates
      .map(([lng, lat]) => ({ latitude: Number(lat), longitude: Number(lng) }))
      .filter((pt) => !isNaN(pt.latitude) && !isNaN(pt.longitude));
    if (coords.length >= 2 && areRouteCoordinatesValid(coords, origin)) {
      return coords;
    }
  }

  // 2. Prioridad: encodedPolyline (Google Encoded Polyline v2.0) - Solo si decodifica a puntos válidos
  if (trip.encodedPolyline && typeof trip.encodedPolyline === "string") {
    const decoded = decodePolyline(trip.encodedPolyline);
    if (decoded.length >= 2 && areRouteCoordinatesValid(decoded, origin)) {
      return decoded;
    }
  }

  // 3. Prioridad: tramos / Tramos encadenados
  const tramos = trip.tramos || trip.Tramos;
  if (Array.isArray(tramos) && tramos.length > 0) {
    const tramoCoords = [];
    tramos.forEach((tr) => {
      const oLat = tr.origen_lat ?? tr.start?.lat;
      const oLng = tr.origen_lng ?? tr.start?.lng;
      const dLat = tr.destino_lat ?? tr.end?.lat;
      const dLng = tr.destino_lng ?? tr.end?.lng;
      if (oLat != null && oLng != null && !isNaN(oLat) && !isNaN(oLng)) {
        tramoCoords.push({ latitude: Number(oLat), longitude: Number(oLng) });
      }
      if (dLat != null && dLng != null && !isNaN(dLat) && !isNaN(dLng)) {
        tramoCoords.push({ latitude: Number(dLat), longitude: Number(dLng) });
      }
    });
    if (tramoCoords.length >= 2 && areRouteCoordinatesValid(tramoCoords, origin)) {
      return tramoCoords;
    }
  }

  // 4. Prioridad: recorrido [{ lat, lng }]
  if (Array.isArray(trip.recorrido) && trip.recorrido.length >= 2) {
    const coords = trip.recorrido
      .map((p) => ({ latitude: Number(p.lat), longitude: Number(p.lng) }))
      .filter((pt) => !isNaN(pt.latitude) && !isNaN(pt.longitude));
    if (coords.length >= 2 && areRouteCoordinatesValid(coords, origin)) {
      return coords;
    }
  }

  // 5. Fallback directo: origen y destino directo
  if (origin && dest) {
    return [origin, dest];
  }

  return [];
}

/**
 * Extrae los puntos de parada intermedia / waypoints del trayecto
 */
export function extractTripWaypoints(trip) {
  if (!trip) return [];
  const waypoints = [];

  const rawWaypoints = trip.tramos || trip.Tramos || trip.paradas || trip.waypoints;
  if (Array.isArray(rawWaypoints)) {
    rawWaypoints.forEach((wp, index) => {
      const lat = wp.lat ?? wp.latitude ?? wp.start?.lat;
      const lng = wp.lng ?? wp.longitude ?? wp.start?.lng;
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
        waypoints.push({
          id: wp.id || `wp-${index}`,
          name: wp.name || wp.address || wp.direccion || `Parada ${index + 1}`,
          latitude: Number(lat),
          longitude: Number(lng),
          order: index + 1,
        });
      }
    });
  }

  return waypoints;
}

export function calculateBoundsFromCoordinates(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  coordinates.forEach((pt) => {
    const lat = Array.isArray(pt) ? pt[1] : pt.latitude;
    const lng = Array.isArray(pt) ? pt[0] : pt.longitude;
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  });

  if (minLat === Infinity || maxLat === -Infinity) return null;
  return { minLat, maxLat, minLng, maxLng };
}

export function expandBounds(bbox, factor = 0.1) {
  const latPadding = (bbox.maxLat - bbox.minLat) * factor;
  const lngPadding = (bbox.maxLng - bbox.minLng) * factor;

  return {
    minLat: bbox.minLat - latPadding,
    maxLat: bbox.maxLat + latPadding,
    minLng: bbox.minLng - lngPadding,
    maxLng: bbox.maxLng + lngPadding,
  };
}

/**
 * Desplaza sutilmente marcadores cuyas coordenadas sean idénticas o estén a menos de thresholdKm
 * Distribuye los marcadores en un arco radial para que no se tapen entre sí
 * @param {Array<Object>} trips - Array de viajes
 * @param {'origin' | 'destination'} pointType - Si se dispersan orígenes o destinos
 * @param {number} thresholdKm - Distancia mínima para considerar que se solapan (default 0.07 km = 70m)
 * @param {number} [zoom] - Nivel de zoom actual (1-20) para ajustar radio de dispersión dinámicamente
 * @returns {Map<string, { latitude: number, longitude: number }>} Map de tripId -> coordenadas ajustadas
 */
export function disperseOverlappingCoordinates(trips, pointType = "origin", thresholdKm = 0.07, zoom = 13) {
  const coordMap = new Map();
  if (!Array.isArray(trips) || trips.length === 0) return coordMap;

  // Calcular radio de dispersión dinámico según zoom
  // Zoom bajo (alejado) = radio menor, Zoom alto (cerca) = radio mayor
  // A ~200-250m en zoom 13-14, ~400m en zoom 15+
  let radiusDeg;
  if (zoom >= 16) radiusDeg = 0.0036;    // ~400m
  else if (zoom >= 14) radiusDeg = 0.0022; // ~250m
  else if (zoom >= 12) radiusDeg = 0.0018; // ~200m
  else radiusDeg = 0.001;                  // ~110m

  // Extraer puntos válidos
  const points = [];
  trips.forEach((trip) => {
    const coords =
      pointType === "origin"
        ? getTripOriginCoords(trip)
        : getTripDestinationCoords(trip);
    if (coords && trip.id) {
      points.push({ tripId: String(trip.id), coords });
    }
  });

  // Agrupar puntos cercanos
  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < points.length; i++) {
    if (visited.has(points[i].tripId)) continue;

    const group = [points[i]];
    visited.add(points[i].tripId);

    for (let j = i + 1; j < points.length; j++) {
      if (visited.has(points[j].tripId)) continue;

      const dist = calculateDistance(
        points[i].coords.latitude,
        points[i].coords.longitude,
        points[j].coords.latitude,
        points[j].coords.longitude
      );

      if (dist <= thresholdKm) {
        group.push(points[j]);
        visited.add(points[j].tripId);
      }
    }
    clusters.push(group);
  }

  // Dispersar puntos que pertenezcan a grupos de 2 o más
  clusters.forEach((group) => {
    if (group.length === 1) {
      coordMap.set(group[0].tripId, group[0].coords);
      return;
    }

    const count = group.length;

    group.forEach((item, index) => {
      // Ángulo distribuido equitativamente alrededor del centroide
      const angle = (2 * Math.PI * index) / count;
      const dLat = radiusDeg * Math.cos(angle);
      const cosLat = Math.cos((item.coords.latitude * Math.PI) / 180) || 1;
      const dLng = (radiusDeg * Math.sin(angle)) / cosLat;

      coordMap.set(item.tripId, {
        latitude: item.coords.latitude + dLat,
        longitude: item.coords.longitude + dLng,
      });
    });
  });

  return coordMap;
}

/**
 * Calcula un desplazamiento paralelo (perpendicular) a una polilínea para evitar superposición visual
 * @param {Array<{latitude, longitude}>} coordinates - Coordenadas de la ruta original
 * @param {number} offsetMeters - Desplazamiento lateral en metros (positivo = derecha, negativo = izquierda)
 * @returns {Array<{latitude, longitude}>} - Nueva polilínea desplazada
 */
export function calculateParallelOffset(coordinates, offsetMeters) {
  if (!coordinates || coordinates.length < 2 || offsetMeters === 0) return coordinates;

  // Convertir metros a grados (aproximado)
  // 1 grado de latitud ≈ 111,320 metros
  // 1 grado de longitud ≈ 111,320 * cos(lat) metros
  const offsetDegLat = offsetMeters / 111320;

  const result = [];
  for (let i = 0; i < coordinates.length; i++) {
    const curr = coordinates[i];
    let next, prev;

    if (i === 0) {
      // Primer punto: usar dirección hacia el siguiente
      next = coordinates[1];
      const bearing = calculateBearing(curr, next);
      const perpBearing = bearing + 90; // Perpendicular a la derecha
      result.push(destinationPoint(curr, perpBearing, offsetMeters));
    } else if (i === coordinates.length - 1) {
      // Último punto: usar dirección desde el anterior
      prev = coordinates[i - 1];
      const bearing = calculateBearing(prev, curr);
      const perpBearing = bearing + 90;
      result.push(destinationPoint(curr, perpBearing, offsetMeters));
    } else {
      // Punto intermedio: promedio de direcciones
      prev = coordinates[i - 1];
      next = coordinates[i + 1];
      const bearing1 = calculateBearing(prev, curr);
      const bearing2 = calculateBearing(curr, next);
      const avgBearing = (bearing1 + bearing2) / 2;
      const perpBearing = avgBearing + 90;
      result.push(destinationPoint(curr, perpBearing, offsetMeters));
    }
  }
  return result;
}

function calculateBearing(from, to) {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function destinationPoint(point, bearing, distanceMeters) {
  const R = 6371000; // Radio de la Tierra en metros
  const lat1 = (point.latitude * Math.PI) / 180;
  const lng1 = (point.longitude * Math.PI) / 180;
  const brng = (bearing * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / R) +
    Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(brng)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(distanceMeters / R) * Math.cos(lat1),
    Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lng2 * 180) / Math.PI,
  };
}