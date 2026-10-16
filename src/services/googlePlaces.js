import { Platform } from "react-native";

const getApiKey = () => process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const assertApiKey = () => {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      "Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Configúrala en .env y reinicia Metro.",
    );
  }
};

// Package name y huella SHA-1 de la app para que Google Maps acepte
// la API Key con restricción de "Aplicaciones Android" en peticiones REST.
const DEFAULT_ANDROID_PACKAGE = "app.youconnext";
const DEFAULT_ANDROID_SHA1 = "5E8F16062EA3CD2C4A0D547876BAA6F38CABF625"; // android/app/debug.keystore
const FALLBACK_ANDROID_SHA1 = "0AF0CF184D34AF71A3990DD65143214D0A3F08BD"; // ~/.android/debug.keystore

export const getMobileHeaders = (useFallbackCert = false) => {
  const headers = {};

  if (Platform.OS === "android") {
    const pkg =
      process.env.EXPO_PUBLIC_ANDROID_PACKAGE || DEFAULT_ANDROID_PACKAGE;
    const rawCert = useFallbackCert
      ? FALLBACK_ANDROID_SHA1
      : process.env.EXPO_PUBLIC_ANDROID_SHA1 || DEFAULT_ANDROID_SHA1;
    const cert = rawCert ? rawCert.replace(/:/g, "").toUpperCase() : "";

    if (pkg) headers["X-Android-Package"] = pkg;
    if (cert) headers["X-Android-Cert"] = cert;
  } else if (Platform.OS === "ios") {
    const bundleId =
      process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || DEFAULT_ANDROID_PACKAGE;
    if (bundleId) headers["X-Ios-Bundle-Identifier"] = bundleId;
  }

  return headers;
};

const fetchGoogleApi = async (url) => {
  const primaryHeaders = getMobileHeaders(false);
  let res = await fetch(url, { headers: primaryHeaders });
  let data = await res.json();

  // Si Google rechaza con REQUEST_DENIED en Android, reintentar con el certificado alternativo
  if (
    Platform.OS === "android" &&
    data.status === "REQUEST_DENIED" &&
    primaryHeaders["X-Android-Cert"] !== FALLBACK_ANDROID_SHA1
  ) {
    const fallbackHeaders = getMobileHeaders(true);
    const resFallback = await fetch(url, { headers: fallbackHeaders });
    const dataFallback = await resFallback.json();
    if (
      dataFallback.status === "OK" ||
      dataFallback.status === "ZERO_RESULTS"
    ) {
      return { res: resFallback, data: dataFallback };
    }
  }

  return { res, data };
};

// Optimizado usando URLSearchParams nativo de JavaScript
const buildUrl = (baseUrl, params) => {
  const searchParams = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;

    if (Array.isArray(v)) {
      for (const item of v) {
        if (item === undefined || item === null || item === "") continue;
        searchParams.append(k, String(item));
      }
      continue;
    }

    searchParams.append(k, String(v));
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

export const autocompletePlaces = async ({
  input,
  location,
  radius,
  language = "es",
  types = "geocode|establishment",
  components, // Asegúrate de pasarlo como string: ej. "country:es" o "country:es|country:mx"
}) => {
  assertApiKey();
  const key = getApiKey();

  const url = buildUrl(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    {
      input,
      key,
      language,
      types,
      ...(location
        ? {
            location: `${location.latitude},${location.longitude}`,
          }
        : null),
      radius,
      components,
    },
  );

  const { res, data } = await fetchGoogleApi(url);

  if (!res.ok || (data.status !== "OK" && data.status !== "ZERO_RESULTS")) {
    throw new Error(
      data.error_message || `Google Places error: ${data.status}`,
    );
  }

  return data.predictions || [];
};

export const reverseGeocode = async ({
  latitude,
  longitude,
  language = "es",
}) => {
  assertApiKey();
  const key = getApiKey();

  const url = buildUrl("https://maps.googleapis.com/maps/api/geocode/json", {
    latlng: `${latitude},${longitude}`,
    key,
    language,
  });

  const { res, data } = await fetchGoogleApi(url);

  if (!res.ok || data.status !== "OK") {
    throw new Error(
      data.error_message || `Google Geocoding error: ${data.status}`,
    );
  }

  const result = data.results?.[0];
  return {
    name: result?.address_components?.[0]?.long_name || "Mi ubicación",
    address: result?.formatted_address || `${latitude}, ${longitude}`,
    latitude,
    longitude,
  };
};

export const getPlaceDetails = async ({
  placeId,
  language = "es",
  fields = "geometry,name,formatted_address,address_components",
}) => {
  assertApiKey();
  const key = getApiKey();

  const url = buildUrl(
    "https://maps.googleapis.com/maps/api/place/details/json",
    {
      place_id: placeId,
      key,
      language,
      fields,
    },
  );

  const { res, data } = await fetchGoogleApi(url);

  if (!res.ok || data.status !== "OK") {
    throw new Error(
      data.error_message || `Google Place Details error: ${data.status}`,
    );
  }

  const result = data.result;
  return {
    placeId,
    name: result?.name,
    address: result?.formatted_address,
    latitude: result?.geometry?.location?.lat,
    longitude: result?.geometry?.location?.lng,
    addressComponents: result?.address_components || [],
    raw: result,
  };
};

export const getDirectionsRoute = async ({
  origin,
  destination,
  language = "es",
  mode = "driving",
}) => {
  assertApiKey();
  const key = getApiKey();

  if (
    origin?.latitude == null ||
    origin?.longitude == null ||
    destination?.latitude == null ||
    destination?.longitude == null
  ) {
    throw new Error("Faltan coordenadas para obtener la ruta");
  }

  const url = buildUrl("https://maps.googleapis.com/maps/api/directions/json", {
    key,
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    language,
    mode,
  });

  const { res, data } = await fetchGoogleApi(url);

  if (!res.ok || data.status !== "OK") {
    throw new Error(
      data.error_message || `Google Directions error: ${data.status}`,
    );
  }

  const route = data.routes?.[0];
  const polyline = route?.overview_polyline?.points;
  const leg = route?.legs?.[0];

  if (!polyline) {
    throw new Error("No se pudo obtener la polyline de la ruta");
  }

  return {
    encodedPolyline: polyline,
    distanceMeters: leg?.distance?.value,
    durationSeconds: leg?.duration?.value,
    raw: route,
  };
};

export const buildStaticMapUrl = ({
  origin,
  destination,
  encodedPolyline,
  width = 640,
  height = 320,
  scale = 2,
  language = "es",
}) => {
  assertApiKey();
  const key = getApiKey();

  const markers = [];
  // Usar != null aquí es un acierto porque captura undefined y null pero permite el número 0
  if (origin?.latitude != null && origin?.longitude != null) {
    markers.push(`color:green|label:A|${origin.latitude},${origin.longitude}`);
  }
  if (destination?.latitude != null && destination?.longitude != null) {
    markers.push(
      `color:red|label:B|${destination.latitude},${destination.longitude}`,
    );
  }

  const path = encodedPolyline
    ? `color:0x0066FF|weight:5|enc:${encodedPolyline}`
    : origin?.latitude != null &&
        origin?.longitude != null &&
        destination?.latitude != null &&
        destination?.longitude != null
      ? `color:0x0066FF|weight:5|${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`
      : undefined;

  return buildUrl("https://maps.googleapis.com/maps/api/staticmap", {
    key,
    size: `${width}x${height}`,
    scale,
    language,
    ...(markers.length ? { markers } : null),
    ...(path ? { path } : null),
  });
};
