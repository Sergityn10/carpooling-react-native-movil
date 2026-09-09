// YouConnext - Hook combinado de tracking (envío + recepción)
// Permite que conductor y pasajeros compartan y vean sus ubicaciones.
// Evita el conflicto de tener dos hooks usando el mismo socket singleton.
import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import trackingSocketService from "../services/tracking/trackingSocketService";
import { GPS_CONFIG } from "../constants";

export const useLiveTracking = (
  trayectoId,
  enabled = true,
  shareLocation = false,
  conductorId = null,
  userId = null,
) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [participantLocations, setParticipantLocations] = useState({});
  const [isRecovered, setIsRecovered] = useState(false);
  const [waitingLocation, setWaitingLocation] = useState(true);
  const [trackingEnded, setTrackingEnded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [gpsActivo, setGpsActivo] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoEnvio, setUltimoEnvio] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!enabled || !trayectoId) return;

    let cancelled = false;

    const start = async () => {
      try {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.log("[LiveTracking] start() called:", {
            trayectoId,
            enabled,
            shareLocation,
            conductorId,
            userId,
          });
        }
        // Si shareLocation, pedir permisos de GPS
        if (shareLocation) {
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
        }

        await trackingSocketService.connect(trayectoId, {
          onConnect: () => {
            if (cancelled) return;
            setConnected(true);
            setReconnecting(false);
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log(
                "[LiveTracking] Socket conectado, trayecto:",
                trayectoId,
              );
            }
          },
          onDisconnect: () => {
            if (!cancelled) setConnected(false);
          },
          onLocationUpdated: (data) => {
            if (cancelled || !data) return;
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log(
                "[LiveTracking] location_updated:",
                JSON.stringify(data),
              );
            }
            const loc = {
              latitude: data.lat,
              longitude: data.lng,
              updatedAt: data.updatedAt,
            };
            // Si el user_id corresponde al conductor, va a driverLocation
            if (
              data.user_id &&
              conductorId &&
              String(data.user_id) === String(conductorId)
            ) {
              setDriverLocation(loc);
              setIsRecovered(!!data.recovered);
              setWaitingLocation(false);
            } else if (data.user_id) {
              // Pasajero
              setParticipantLocations((prev) => ({
                ...prev,
                [data.user_id]: loc,
              }));
            } else {
              // Sin user_id: asumimos que es el conductor (backward compat)
              setDriverLocation(loc);
              setIsRecovered(!!data.recovered);
              setWaitingLocation(false);
            }
          },
          onNoLocation: () => {
            if (cancelled) return;
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log("[LiveTracking] no_location recibido");
            }
            // Solo marcar waiting si realmente no tenemos ubicación del conductor
            setDriverLocation((prev) => {
              if (!prev) setWaitingLocation(true);
              return prev;
            });
          },
          onTrackingEnded: () => {
            if (!cancelled) setTrackingEnded(true);
          },
          onError: (err) => {
            if (!cancelled) setError(err?.message || "Error de tracking");
          },
          onConnectError: (err) => {
            if (cancelled) return;
            if (typeof __DEV__ !== "undefined" && __DEV__) {
              console.log("[LiveTracking] connect_error:", err?.message || err);
            }
            setError(err?.message || "Error de conexión");
          },
          onReconnectAttempt: () => {
            if (!cancelled) setReconnecting(true);
          },
          onReconnect: () => {
            if (!cancelled) setReconnecting(false);
          },
        });

        if (cancelled) return;

        // Si shareLocation, empezar a enviar ubicación
        if (shareLocation) {
          subscriptionRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: GPS_CONFIG.TRACKING_INTERVAL,
              distanceInterval: GPS_CONFIG.MIN_DISTANCE,
            },
            async (location) => {
              const { latitude, longitude } = location.coords;
              const now = new Date().toISOString();

              // Setear MI ubicación localmente (no depender del broadcast)
              const myLoc = { latitude, longitude, updatedAt: now };
              if (
                userId &&
                conductorId &&
                String(userId) === String(conductorId)
              ) {
                // Soy el conductor
                setDriverLocation(myLoc);
                setIsRecovered(false);
                setWaitingLocation(false);
              } else if (userId) {
                // Soy un pasajero
                setParticipantLocations((prev) => ({
                  ...prev,
                  [userId]: myLoc,
                }));
              }

              if (typeof __DEV__ !== "undefined" && __DEV__) {
                console.log(
                  "[LiveTracking] GPS update:",
                  latitude,
                  longitude,
                  "userId:",
                  userId,
                  "conductorId:",
                  conductorId,
                );
              }

              const ack = await trackingSocketService.updateLocation(
                latitude,
                longitude,
              );
              if (cancelled) return;
              if (ack?.ok) {
                setUltimoEnvio(ack.updatedAt || now);
              } else if (ack?.error && ack.error !== "Socket no conectado") {
                setError(ack.error);
              }
            },
          );
          if (!cancelled) setGpsActivo(true);
        }
      } catch (e) {
        if (!cancelled)
          setError(e?.message || "No se pudo iniciar el tracking");
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
  }, [trayectoId, enabled, shareLocation, conductorId, userId]);

  const finalizarTrayecto = useCallback(() => {
    trackingSocketService.endTracking();
    trackingSocketService.disconnect();
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setGpsActivo(false);
  }, []);

  return {
    driverLocation,
    participantLocations,
    isRecovered,
    waitingLocation,
    trackingEnded,
    connected,
    reconnecting,
    gpsActivo,
    error,
    ultimoEnvio,
    finalizarTrayecto,
  };
};

export default useLiveTracking;
