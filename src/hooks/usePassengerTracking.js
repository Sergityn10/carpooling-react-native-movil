// YouConnext - Hook de tracking para el PASAJERO (receptor)
// Escucha location_updated (live + recovered), no_location y tracking_ended.
// Al desmontar: desconecta el socket.
import { useEffect, useState } from "react";
import trackingSocketService from "../services/tracking/trackingSocketService";

export const usePassengerTracking = (trayectoId, enabled = true) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [participantLocations, setParticipantLocations] = useState({});
  const [isRecovered, setIsRecovered] = useState(false);
  const [waitingLocation, setWaitingLocation] = useState(true);
  const [trackingEnded, setTrackingEnded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !trayectoId) return;

    let cancelled = false;

    const start = async () => {
      try {
        await trackingSocketService.connect(trayectoId, {
          onConnect: () => {
            if (cancelled) return;
            setConnected(true);
            setReconnecting(false);
          },
          onDisconnect: () => {
            if (!cancelled) setConnected(false);
          },
          onLocationUpdated: (data) => {
            if (cancelled || !data) return;
            const loc = {
              latitude: data.lat,
              longitude: data.lng,
              updatedAt: data.updatedAt,
            };
            if (data.user_id) {
              // Actualización de un pasajero específico
              setParticipantLocations((prev) => ({
                ...prev,
                [data.user_id]: loc,
              }));
            } else {
              // Actualización del conductor (sin user_id)
              setDriverLocation(loc);
              setIsRecovered(!!data.recovered);
              setWaitingLocation(false);
            }
          },
          onNoLocation: () => {
            if (!cancelled) setWaitingLocation(true);
          },
          onTrackingEnded: () => {
            if (!cancelled) setTrackingEnded(true);
          },
          onError: (err) => {
            if (!cancelled) setError(err?.message || "Error de tracking");
          },
          onConnectError: (err) => {
            if (!cancelled) setError(err?.message || "Error de conexión");
          },
          onReconnectAttempt: () => {
            if (!cancelled) setReconnecting(true);
          },
          onReconnect: () => {
            if (!cancelled) setReconnecting(false);
          },
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "No se pudo conectar");
      }
    };

    start();

    return () => {
      cancelled = true;
      trackingSocketService.disconnect();
    };
  }, [trayectoId, enabled]);

  return {
    driverLocation,
    participantLocations,
    isRecovered,
    waitingLocation,
    trackingEnded,
    connected,
    reconnecting,
    error,
  };
};

export default usePassengerTracking;
