// YouConnext - Permission Storage Service
// Persistencia segura de decisiones del usuario y estado de consentimiento

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PERMISSION_TYPES,
  PERMISSION_CHOICE_STATUS,
} from "../constants/permissionsConfig";

const PERMISSIONS_STORAGE_KEY = "@youconnext_permissions_state_v1";

const DEFAULT_STATE = {
  [PERMISSION_TYPES.LOCATION_FOREGROUND]: {
    status: PERMISSION_CHOICE_STATUS.NOT_DETERMINED,
    updatedAt: null,
    declinedCount: 0,
    acknowledgedAt: null,
  },
  [PERMISSION_TYPES.LOCATION_BACKGROUND]: {
    status: PERMISSION_CHOICE_STATUS.NOT_DETERMINED,
    updatedAt: null,
    declinedCount: 0,
    acknowledgedAt: null,
  },
  [PERMISSION_TYPES.CAMERA]: {
    status: PERMISSION_CHOICE_STATUS.NOT_DETERMINED,
    updatedAt: null,
    declinedCount: 0,
    acknowledgedAt: null,
  },
  [PERMISSION_TYPES.MEDIA_LIBRARY]: {
    status: PERMISSION_CHOICE_STATUS.NOT_DETERMINED,
    updatedAt: null,
    declinedCount: 0,
    acknowledgedAt: null,
  },
  [PERMISSION_TYPES.NOTIFICATIONS]: {
    status: PERMISSION_CHOICE_STATUS.NOT_DETERMINED,
    updatedAt: null,
    declinedCount: 0,
    acknowledgedAt: null,
  },
};

/**
 * Obtener todos los estados almacenados de permisos
 */
export const getStoredPermissionsState = async () => {
  try {
    const raw = await AsyncStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
    };
  } catch (error) {
    console.warn("Error leyendo el estado de permisos de almacenamiento:", error);
    return { ...DEFAULT_STATE };
  }
};

/**
 * Obtener el estado almacenado para un permiso específico
 */
export const getStoredPermission = async (permissionType) => {
  const all = await getStoredPermissionsState();
  return (
    all[permissionType] || {
      status: PERMISSION_CHOICE_STATUS.NOT_DETERMINED,
      updatedAt: null,
      declinedCount: 0,
      acknowledgedAt: null,
    }
  );
};

/**
 * Guardar la elección del usuario (granted, declined, blocked)
 */
export const savePermissionChoice = async (permissionType, status) => {
  try {
    const current = await getStoredPermissionsState();
    const prevEntry = current[permissionType] || {};
    const isDeclined = status === PERMISSION_CHOICE_STATUS.DECLINED;

    const updatedEntry = {
      ...prevEntry,
      status,
      updatedAt: new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
      declinedCount: isDeclined
        ? (prevEntry.declinedCount || 0) + 1
        : prevEntry.declinedCount || 0,
    };

    const newState = {
      ...current,
      [permissionType]: updatedEntry,
    };

    await AsyncStorage.setItem(
      PERMISSIONS_STORAGE_KEY,
      JSON.stringify(newState),
    );
    return newState;
  } catch (error) {
    console.warn("Error guardando elección de permiso:", error);
    return null;
  }
};

/**
 * Restablecer la elección de un permiso (para permitir reintentar o reconfigurar)
 */
export const resetPermissionChoice = async (permissionType) => {
  try {
    const current = await getStoredPermissionsState();
    const newState = {
      ...current,
      [permissionType]: {
        status: PERMISSION_CHOICE_STATUS.NOT_DETERMINED,
        updatedAt: new Date().toISOString(),
        declinedCount: 0,
        acknowledgedAt: null,
      },
    };
    await AsyncStorage.setItem(
      PERMISSIONS_STORAGE_KEY,
      JSON.stringify(newState),
    );
    return newState;
  } catch (error) {
    console.warn("Error restableciendo permiso:", error);
    return null;
  }
};

/**
 * Restablecer todos los permisos
 */
export const resetAllPermissionsChoice = async () => {
  try {
    await AsyncStorage.setItem(
      PERMISSIONS_STORAGE_KEY,
      JSON.stringify(DEFAULT_STATE),
    );
    return DEFAULT_STATE;
  } catch (error) {
    console.warn("Error restableciendo todos los permisos:", error);
    return DEFAULT_STATE;
  }
};

/**
 * Comprobar rápidamente si un permiso está en modo rechazado (para degradar funcionalidad)
 */
export const isPermissionDeclined = async (permissionType) => {
  const perm = await getStoredPermission(permissionType);
  return perm.status === PERMISSION_CHOICE_STATUS.DECLINED;
};
