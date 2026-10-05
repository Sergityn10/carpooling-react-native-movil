// YouConnext - PermissionContext & usePermission Hook
// Gestión unificada de permisos con Aviso Destacado (Prominent Disclosure), Persistencia y Modo Degradado

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import {
  PERMISSION_TYPES,
  PERMISSION_CHOICE_STATUS,
  PERMISSIONS_CONFIG,
} from "../constants/permissionsConfig";
import {
  getStoredPermissionsState,
  savePermissionChoice,
  resetPermissionChoice,
  resetAllPermissionsChoice,
} from "../services/permissionStorage";
import PermissionDisclosureSheet from "../components/common/PermissionDisclosureSheet";
import PermissionBlockedSheet from "../components/common/PermissionBlockedSheet";

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const [permissionsState, setPermissionsState] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Estados de control para los Bottom Sheets
  const [disclosureConfig, setDisclosureConfig] = useState({
    visible: false,
    type: null,
  });

  const [blockedConfig, setBlockedConfig] = useState({
    visible: false,
    type: null,
  });

  // Referencias para resolver promesas de diálogos asíncronos
  const resolverRef = useRef(null);

  // Cargar estado inicial almacenado
  const loadInitialState = useCallback(async () => {
    try {
      const stored = await getStoredPermissionsState();
      setPermissionsState(stored);
    } catch (err) {
      console.warn("Error cargando permisos:", err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  /**
   * Consulta el estado del sistema operativo para un tipo de permiso
   */
  const getSystemPermissionStatus = async (type) => {
    try {
      switch (type) {
        case PERMISSION_TYPES.LOCATION_FOREGROUND: {
          const res = await Location.getForegroundPermissionsAsync();
          return {
            granted: res.status === "granted",
            canAskAgain: res.canAskAgain,
            status: res.status,
          };
        }
        case PERMISSION_TYPES.LOCATION_BACKGROUND: {
          const res = await Location.getBackgroundPermissionsAsync();
          return {
            granted: res.status === "granted",
            canAskAgain: res.canAskAgain,
            status: res.status,
          };
        }
        case PERMISSION_TYPES.CAMERA: {
          const res = await Camera.getCameraPermissionsAsync();
          return {
            granted: res.status === "granted",
            canAskAgain: res.canAskAgain,
            status: res.status,
          };
        }
        case PERMISSION_TYPES.MEDIA_LIBRARY: {
          const res = await ImagePicker.getMediaLibraryPermissionsAsync();
          return {
            granted: res.status === "granted",
            canAskAgain: res.canAskAgain,
            status: res.status,
          };
        }
        case PERMISSION_TYPES.NOTIFICATIONS: {
          const res = await Notifications.getPermissionsAsync();
          return {
            granted: res.status === "granted",
            canAskAgain: res.canAskAgain,
            status: res.status,
          };
        }
        default:
          return { granted: false, canAskAgain: true, status: "undetermined" };
      }
    } catch (error) {
      console.warn(`Error consultando permiso OS ${type}:`, error);
      return { granted: false, canAskAgain: true, status: "undetermined" };
    }
  };

  /**
   * Disparar la petición nativa del sistema operativo
   */
  const executeNativeRequest = async (type) => {
    try {
      switch (type) {
        case PERMISSION_TYPES.LOCATION_FOREGROUND:
          return await Location.requestForegroundPermissionsAsync();
        case PERMISSION_TYPES.LOCATION_BACKGROUND:
          return await Location.requestBackgroundPermissionsAsync();
        case PERMISSION_TYPES.CAMERA:
          return await Camera.requestCameraPermissionsAsync();
        case PERMISSION_TYPES.MEDIA_LIBRARY:
          return await ImagePicker.requestMediaLibraryPermissionsAsync();
        case PERMISSION_TYPES.NOTIFICATIONS:
          return await Notifications.requestPermissionsAsync();
        default:
          return { status: "denied", granted: false };
      }
    } catch (error) {
      console.warn(`Error solicitando permiso OS ${type}:`, error);
      return { status: "denied", granted: false };
    }
  };

  /**
   * Solicitar un permiso respetando Aviso Destacado, Persistencia y Consentimiento
   * @param {string} type - Tipo de permiso de PERMISSION_TYPES
   * @param {object} options - { forcePrompt: boolean, alwaysShowDisclosure: boolean }
   * @returns {Promise<{ granted: boolean, status: string, userCancelled?: boolean, isFallback?: boolean }>}
   */
  const requestPermissionWithDisclosure = useCallback(
    async (type, options = {}) => {
      const { forcePrompt = false, alwaysShowDisclosure = false } = options;

      // Comprobar estado actual en el sistema operativo
      const sysStatus = await getSystemPermissionStatus(type);

      // Los permisos de ubicación siempre muestran el popup por requisito explícito
      const isLocationType =
        type === PERMISSION_TYPES.LOCATION_FOREGROUND ||
        type === PERMISSION_TYPES.LOCATION_BACKGROUND;

      const shouldAlwaysShow = alwaysShowDisclosure || isLocationType;

      // Si no requiere mostrarlo siempre y ya está concedido en el sistema
      if (!shouldAlwaysShow && sysStatus.granted) {
        await savePermissionChoice(type, PERMISSION_CHOICE_STATUS.GRANTED);
        setPermissionsState((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            status: PERMISSION_CHOICE_STATUS.GRANTED,
          },
        }));
        return { granted: true, status: "granted" };
      }

      // Verificar decisión previa del usuario
      const stored = permissionsState[type];
      const isDeclined =
        stored?.status === PERMISSION_CHOICE_STATUS.DECLINED;

      // Si el usuario dijo "Ahora no" previamente y no es una acción forzada por él ni de ubicación
      if (isDeclined && !forcePrompt && !shouldAlwaysShow) {
        return {
          granted: false,
          status: PERMISSION_CHOICE_STATUS.DECLINED,
          isFallback: true,
        };
      }

      // Si no puede volver a preguntar en el OS y es forzado, mostrar sheet de bloqueo/ajustes
      if (
        !sysStatus.canAskAgain &&
        sysStatus.status !== "undetermined" &&
        !sysStatus.granted &&
        forcePrompt
      ) {
        return new Promise((resolve) => {
          resolverRef.current = resolve;
          setBlockedConfig({ visible: true, type });
        });
      }

      // Mostrar Bottom Sheet de Aviso Destacado y Consentimiento
      return new Promise((resolve) => {
        resolverRef.current = async (choice) => {
          if (choice === "accept") {
            // Si en el OS ya estaba concedido previamente
            if (sysStatus.granted) {
              await savePermissionChoice(
                type,
                PERMISSION_CHOICE_STATUS.GRANTED,
              );
              setPermissionsState((prev) => ({
                ...prev,
                [type]: {
                  ...prev[type],
                  status: PERMISSION_CHOICE_STATUS.GRANTED,
                },
              }));
              resolve({ granted: true, status: "granted" });
              return;
            }

            // Usuario dio consentimiento afirmativo -> Llamar a la API nativa
            const nativeRes = await executeNativeRequest(type);
            const isGranted =
              nativeRes.status === "granted" || nativeRes.granted;

            if (isGranted) {
              await savePermissionChoice(
                type,
                PERMISSION_CHOICE_STATUS.GRANTED,
              );
              setPermissionsState((prev) => ({
                ...prev,
                [type]: {
                  ...prev[type],
                  status: PERMISSION_CHOICE_STATUS.GRANTED,
                },
              }));
              resolve({ granted: true, status: "granted" });
            } else {
              // Denegado en el sistema
              const finalStatus =
                nativeRes.canAskAgain === false
                  ? PERMISSION_CHOICE_STATUS.BLOCKED
                  : PERMISSION_CHOICE_STATUS.DECLINED;

              await savePermissionChoice(type, finalStatus);
              setPermissionsState((prev) => ({
                ...prev,
                [type]: {
                  ...prev[type],
                  status: finalStatus,
                },
              }));

              if (nativeRes.canAskAgain === false) {
                // Abrir diálogo de ajustes si quedó bloqueado
                setBlockedConfig({ visible: true, type });
              }

              resolve({
                granted: false,
                status: finalStatus,
                isFallback: true,
              });
            }
          } else {
            // Usuario pulsó "Ahora no" -> Registrar y NO llamar a la API del OS
            await savePermissionChoice(
              type,
              PERMISSION_CHOICE_STATUS.DECLINED,
            );
            setPermissionsState((prev) => ({
              ...prev,
              [type]: {
                ...prev[type],
                status: PERMISSION_CHOICE_STATUS.DECLINED,
              },
            }));
            resolve({
              granted: false,
              status: PERMISSION_CHOICE_STATUS.DECLINED,
              userCancelled: true,
              isFallback: true,
            });
          }
        };

        setDisclosureConfig({ visible: true, type });
      });
    },
    [permissionsState],
  );

  /**
   * Flujo de Ubicación en 2 Pasos (Requerimiento Google Play Android 11+)
   */
  const requestBackgroundLocationWithDisclosure = useCallback(
    async (options = {}) => {
      // Paso 1: Ubicación en primer plano
      const fgResult = await requestPermissionWithDisclosure(
        PERMISSION_TYPES.LOCATION_FOREGROUND,
        options,
      );

      if (!fgResult.granted) {
        return {
          granted: false,
          status: fgResult.status,
          step: "foreground",
          isFallback: true,
        };
      }

      // Paso 2: Ubicación en segundo plano con aviso específico
      const bgResult = await requestPermissionWithDisclosure(
        PERMISSION_TYPES.LOCATION_BACKGROUND,
        { ...options, forcePrompt: true },
      );

      return {
        granted: bgResult.granted,
        status: bgResult.status,
        step: "background",
        isFallback: !bgResult.granted,
      };
    },
    [requestPermissionWithDisclosure],
  );

  // Handlers para los Bottom Sheets
  const handleAcceptDisclosure = () => {
    setDisclosureConfig({ visible: false, type: null });
    if (resolverRef.current) {
      resolverRef.current("accept");
      resolverRef.current = null;
    }
  };

  const handleDeclineDisclosure = () => {
    setDisclosureConfig({ visible: false, type: null });
    if (resolverRef.current) {
      resolverRef.current("decline");
      resolverRef.current = null;
    }
  };

  const handleCloseBlocked = () => {
    setBlockedConfig({ visible: false, type: null });
    if (resolverRef.current) {
      resolverRef.current({
        granted: false,
        status: PERMISSION_CHOICE_STATUS.BLOCKED,
        isFallback: true,
      });
      resolverRef.current = null;
    }
  };

  /**
   * Comprobar si una funcionalidad está activa o degradada
   */
  const isFeatureAllowed = (type) => {
    const entry = permissionsState[type];
    return entry?.status === PERMISSION_CHOICE_STATUS.GRANTED;
  };

  /**
   * Restablecer elección para permitir volver a configurar
   */
  const resetPermission = async (type) => {
    const updated = await resetPermissionChoice(type);
    if (updated) setPermissionsState(updated);
  };

  const resetAllPermissions = async () => {
    const updated = await resetAllPermissionsChoice();
    if (updated) setPermissionsState(updated);
  };

  const refreshAllPermissions = async () => {
    await loadInitialState();
  };

  const value = {
    permissionsState,
    isInitialized,
    requestPermissionWithDisclosure,
    requestBackgroundLocationWithDisclosure,
    getSystemPermissionStatus,
    isFeatureAllowed,
    resetPermission,
    resetAllPermissions,
    refreshAllPermissions,
    PERMISSION_TYPES,
    PERMISSION_CHOICE_STATUS,
    PERMISSIONS_CONFIG,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}

      {/* Bottom Sheet de Aviso Destacado */}
      <PermissionDisclosureSheet
        visible={disclosureConfig.visible}
        permissionType={disclosureConfig.type}
        onAccept={handleAcceptDisclosure}
        onDecline={handleDeclineDisclosure}
      />

      {/* Bottom Sheet de Permiso Bloqueado (Ajustes) */}
      <PermissionBlockedSheet
        visible={blockedConfig.visible}
        permissionType={blockedConfig.type}
        onClose={handleCloseBlocked}
      />
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "usePermission debe ser utilizado dentro de un PermissionProvider",
    );
  }
  return context;
};

export default PermissionContext;
