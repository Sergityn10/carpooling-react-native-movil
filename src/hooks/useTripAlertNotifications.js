// YouConnext - Hook for Trip Alert Push Notifications & Deep Linking (Expo SDK 56)
import { useEffect, useRef, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { parseTripAlertNotificationData } from "../utils/alertaUtils";
import { ensureTripAlertNotificationChannel } from "../services/notifications/pushRegistration";

const TOAST_AUTO_DISMISS_MS = 8500;

export function useTripAlertNotifications({
  navigationRef,
  isNavigationReady = false,
  enabled = false,
}) {
  const [activeAlertToast, setActiveAlertToast] = useState(null);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const handledIdentifiersRef = useRef(new Set());
  const toastTimerRef = useRef(null);

  const dismissAlertToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setActiveAlertToast(null);
  }, []);

  const navigateToTripFromAlert = useCallback(
    (parsedAlert) => {
      if (!parsedAlert?.tripId || !navigationRef?.isReady()) return false;
      dismissAlertToast();
      navigationRef.navigate("ViajeDetalle", {
        id: parsedAlert.tripId,
        fromAlertNotification: true,
        alertPayload: parsedAlert,
      });
      return true;
    },
    [navigationRef, dismissAlertToast],
  );

  // Configurar canal Android al iniciar sesión
  useEffect(() => {
    if (!enabled) return;
    ensureTripAlertNotificationChannel();
  }, [enabled]);

  // Listener en primer plano (foreground)
  useEffect(() => {
    if (!enabled) return undefined;

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const content = notification?.request?.content;
        const parsed = parseTripAlertNotificationData(content?.data);
        if (!parsed) return;

        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }

        setActiveAlertToast({
          ...parsed,
          id:
            notification?.request?.identifier ||
            `${parsed.tripId}-${Date.now()}`,
          title: content?.title || "¡Nuevo trayecto encontrado!",
          body: content?.body || "",
        });

        toastTimerRef.current = setTimeout(() => {
          setActiveAlertToast(null);
          toastTimerRef.current = null;
        }, TOAST_AUTO_DISMISS_MS);
      },
    );

    return () => {
      subscription.remove();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [enabled]);

  // Listener unificado para tap en segundo plano y apertura desde app cerrada (Expo v56)
  useEffect(() => {
    if (!enabled || !isNavigationReady || !lastNotificationResponse) return;

    const identifier = lastNotificationResponse.notification?.request?.identifier;
    if (identifier && handledIdentifiersRef.current.has(identifier)) {
      return;
    }

    const data = lastNotificationResponse.notification?.request?.content?.data;
    const parsed = parseTripAlertNotificationData(data);
    if (!parsed) return;

    if (identifier) {
      handledIdentifiersRef.current.add(identifier);
    }

    const didNavigate = navigateToTripFromAlert(parsed);
    if (didNavigate) {
      try {
        Notifications.clearLastNotificationResponse();
      } catch {
        // Ignorar si la plataforma no soporta limpiar respuesta
      }
    }
  }, [
    enabled,
    isNavigationReady,
    lastNotificationResponse,
    navigateToTripFromAlert,
  ]);

  return {
    activeAlertToast,
    dismissAlertToast,
    openAlertTrip: () => navigateToTripFromAlert(activeAlertToast),
  };
}
