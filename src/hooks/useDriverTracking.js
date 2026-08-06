// YouConnext - Hook de tracking para el CONDUCTOR (emisor)
// Obtiene el GPS cada ~5s y emite update_location al microservicio.
// Al desmontar: detiene la suscripción GPS y desconecta el socket.
import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import trackingSocketService from "../services/tracking/trackingSocketService";
import { GPS_CONFIG } from "../constants";

export const useDriverTracking = (trayectoId, enabled = true) => {
  const [connected, setConnected] = useState(false);
  const [gpsActivo, setGpsActivo] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoEnvio, setUltimoEnvio] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!enabled || !trayectoId) return;

    let cancelled = false;

    const start = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) setError("Permiso de ubicación denegado");
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (!cancelled) setError("Servicios de ubicación desactivados");
          return;
        }

        await trackingSocketService.connect(trayectoId, {
          onConnect: () => {
            if (!cancelled) setConnected(true);
          },
          onDisconnect: () => {
            if (!cancelled) setConnected(false);
          },
          onError: (err) => {
            if (!cancelled) setError(err?.message || "Error de tracking");
          },
          onConnectError: (err) => {
            if (!cancelled) setError(err?.message || "Error de conexión");
          },
        });

        if (cancelled) return;

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: GPS_CONFIG.TRACKING_INTERVAL,
            distanceInterval: GPS_CONFIG.MIN_DISTANCE,
          },
          async (location) => {
            const { latitude, longitude } = location.coords;
            const ack = await trackingSocketService.updateLocation(
              latitude,
              longitude,
            );
            if (cancelled) return;
            if (ack?.ok) {
              setUltimoEnvio(ack.updatedAt || new Date().toISOString());
            } else if (ack?.error && ack.error !== "Socket no conectado") {
              setError(ack.error);
            }
          },
        );

        if (!cancelled) setGpsActivo(true);
      } catch (e) {
        if (!cancelled) setError(e?.message || "No se pudo iniciar el GPS");
      }
    };

    start();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      trackingSocketService.disconnect();
      setGpsActivo(false);
    };
  }, [trayectoId, enabled]);

  const finalizarTrayecto = useCallback(() => {
    trackingSocketService.endTracking();
    trackingSocketService.disconnect();
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setGpsActivo(false);
  }, []);

  return { connected, gpsActivo, error, ultimoEnvio, finalizarTrayecto };
};

export default useDriverTracking;
