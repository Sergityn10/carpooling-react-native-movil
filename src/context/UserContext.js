// YouConnext - User Context (con soporte para Inicio de Sesión Unificado B2B/B2C)
import React, { createContext, useContext, useState, useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tokenStorage from "../services/tokenStorage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import httpClient from "../services/httpClient";
import travelsHttpClient from "../services/travels/httpClient";
import notificationsHttpClient from "../services/notifications/httpClient";
import authService from "../services/authService";
import { enterpriseService } from "../services/enterpriseService";
import usuarioService from "../services/usuarioService";
import userCache from "../services/messages/userCache";
import { homeCache } from "../services/homeCache";
import socketService from "../services/messages/socketService";
import {
  safeMultiSet,
  safeSetItem,
  purgeVolatileCaches,
  storageManager,
} from "../services/storageManager";
import {
  registerPushDevice,
  unregisterPushDevice,
  listenForTokenRefresh,
} from "../services/notifications/pushRegistration";

const STORAGE_KEYS = {
  USER: "@youconnext_user",
  ACTIVE_MODE: "@youconnext_active_mode",
  IDENTITY: "@youconnext_identity",
  PERMISSIONS: "@youconnext_permissions",
  MEMBERSHIPS: "@youconnext_corporate_memberships",
  SELECTED_ENTERPRISE: "@youconnext_selected_enterprise",
};

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Estados B2B / Identidad y Gobernanza de Modo
  const [activeMode, setActiveMode] = useState("personal"); // "personal" | "enterprise"
  const [identity, setIdentity] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [corporateMemberships, setCorporateMemberships] = useState([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);

  // Cargar usuario y preferencias desde AsyncStorage al iniciar
  useEffect(() => {
    loadUser();
  }, []);

  // Registrar handler de 401: limpiar sesión y redirigir a login
  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredSession();
    };
    httpClient.setUnauthorizedHandler(handleUnauthorized);
    travelsHttpClient.setUnauthorizedHandler(handleUnauthorized);
    notificationsHttpClient.setUnauthorizedHandler(handleUnauthorized);
    return () => {
      httpClient.setUnauthorizedHandler(null);
      travelsHttpClient.setUnauthorizedHandler(null);
      notificationsHttpClient.setUnauthorizedHandler(null);
    };
  }, []);

  // Refrescar token proactivamente al volver a primer plano
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active" && isAuthenticated) {
        httpClient.refreshToken().catch(() => {});
      }
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let unsubscribeTokenRefresh = null;

    const register = async () => {
      const jwtToken = await tokenStorage.getAuthToken();
      if (!jwtToken) return;
      await registerPushDevice(user.id, jwtToken);
      unsubscribeTokenRefresh = listenForTokenRefresh(user.id, jwtToken);
    };

    register();

    return () => {
      if (typeof unsubscribeTokenRefresh === "function") {
        unsubscribeTokenRefresh();
      }
    };
  }, [isAuthenticated, user?.id]);

  // Normalizar datos de login unificado
  const processUnifiedAuthResponse = async (response) => {
    const token = response.token;
    const refreshToken = response.refreshToken;

    if (token) {
      await tokenStorage.setAuthToken(token);
      httpClient.setToken(token);
      travelsHttpClient.setToken(token);
      notificationsHttpClient.setToken(token);
    }
    if (refreshToken) {
      await tokenStorage.setRefreshToken(refreshToken);
      httpClient.setRefreshToken(refreshToken);
    }

    const resIdentity = response.identity || {};
    const resPermissions = response.permissions || {};
    const legalEntity = response.legal_entity;
    const naturalPerson = response.natural_person;
    const initialMode = response.initial_mode;

    const memberships = naturalPerson?.memberships ||
      (naturalPerson?.primary_membership ? [naturalPerson.primary_membership] : []);

    const chosenEnterprise = legalEntity
      ? {
          id: legalEntity.enterprise_id,
          name: legalEntity.name,
          cif: legalEntity.cif,
          sector: legalEntity.sector,
          location: legalEntity.location,
          verified: legalEntity.verified,
        }
      : naturalPerson?.primary_membership || (memberships.length > 0 ? memberships[0] : null);

    // Determinar modo activo:
    // Si es LEGAL_ENTITY, forzosamente 'enterprise'
    let modeToSet = "personal";
    if (resIdentity.type === "LEGAL_ENTITY") {
      modeToSet = "enterprise";
    } else {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODE);
      if (savedMode === "enterprise" && resPermissions.can_access_corporate_mode) {
        modeToSet = "enterprise";
      } else if (initialMode === "enterprise" && resPermissions.can_access_corporate_mode) {
        modeToSet = "enterprise";
      } else {
        modeToSet = "personal";
      }
    }

    // Construir objeto user normalizado
    let normalizedUser = {
      id: resIdentity.user_id || response.userId,
      email: resIdentity.email || response.email,
      name: naturalPerson?.first_name || resIdentity.display_name || legalEntity?.name || "Usuario",
      surname: naturalPerson?.last_name || "",
      img_perfil: resIdentity.avatar || response.img_perfil || null,
      phone: naturalPerson?.phone || legalEntity?.phone || null,
      dni: naturalPerson?.dni || null,
      role: resIdentity.system_role || response.role || (resIdentity.type === "LEGAL_ENTITY" ? "enterprise" : "user"),
      classification: resIdentity.classification || "REGULAR_USER",
      identity_type: resIdentity.type || (resIdentity.system_role === "enterprise" ? "LEGAL_ENTITY" : "NATURAL_PERSON"),
      is_corporate_member: Boolean(naturalPerson?.is_corporate_member || memberships.length > 0 || legalEntity),
      onboarding_ended: response.onboarding_ended ?? 1,
    };

    // Intentar enriquecer datos con usuarioService si es persona física
    if (resIdentity.type !== "LEGAL_ENTITY") {
      try {
        const infoRes = await usuarioService.getUserInfo();
        const infoData = infoRes.data || infoRes;
        normalizedUser = {
          ...normalizedUser,
          ...infoData,
          completitud: infoRes.completitud ?? null,
          completitud_cae: infoRes.completitud_cae ?? null,
          monedero: infoRes.monedero ?? null,
        };
      } catch (err) {
        console.warn("[UserContext] No se pudo obtener info adicional de usuario:", err?.message);
      }
    }

    // Guardar en Storage de forma atómica y protegida contra SQLITE_FULL
    const storagePairs = [
      [STORAGE_KEYS.USER, JSON.stringify(normalizedUser)],
      [STORAGE_KEYS.ACTIVE_MODE, modeToSet],
      [STORAGE_KEYS.IDENTITY, JSON.stringify(resIdentity)],
      [STORAGE_KEYS.PERMISSIONS, JSON.stringify(resPermissions)],
      [STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(memberships)],
    ];
    if (chosenEnterprise) {
      storagePairs.push([
        STORAGE_KEYS.SELECTED_ENTERPRISE,
        JSON.stringify(chosenEnterprise),
      ]);
    }

    await safeMultiSet(storagePairs);

    // Actualizar estado en React
    setUser(normalizedUser);
    setIdentity(resIdentity);
    setPermissions(resPermissions);
    setCorporateMemberships(memberships);
    setSelectedEnterprise(chosenEnterprise);
    setActiveMode(modeToSet);
    setIsAuthenticated(true);

    return normalizedUser;
  };

  // Cargar usuario almacenado
  const loadUser = async () => {
    try {
      const token = await tokenStorage.getAuthToken();

      // Restaurar preferencias B2B locales
      const [savedMode, savedIdentity, savedPerms, savedMemberships, savedEnt] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.IDENTITY),
        AsyncStorage.getItem(STORAGE_KEYS.PERMISSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MEMBERSHIPS),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ENTERPRISE),
      ]);

      if (savedMode) setActiveMode(savedMode);
      if (savedIdentity) setIdentity(JSON.parse(savedIdentity));
      if (savedPerms) setPermissions(JSON.parse(savedPerms));
      if (savedMemberships) setCorporateMemberships(JSON.parse(savedMemberships));
      if (savedEnt) setSelectedEnterprise(JSON.parse(savedEnt));

      if (token) {
        httpClient.setToken(token);
        travelsHttpClient.setToken(token);
        notificationsHttpClient.setToken(token);

        // Restaurar refresh token de SecureStore
        const refreshTokenValue = await tokenStorage.getRefreshToken();
        if (refreshTokenValue) {
          httpClient.setRefreshToken(refreshTokenValue);
        }

        try {
          // Si el usuario es persona jurídica, no consultar validateToken de usuarios B2C
          const localUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          const parsedLocalUser = localUserData ? JSON.parse(localUserData) : null;

          if (parsedLocalUser?.role === "enterprise" || parsedLocalUser?.identity_type === "LEGAL_ENTITY") {
            try {
              const valRes = await enterpriseService.validateEnterpriseToken();
              if (valRes?.enterprise) {
                const ent = valRes.enterprise;
                const updatedEnterpriseUser = {
                  ...parsedLocalUser,
                  id: ent.id || parsedLocalUser.id,
                  name: ent.name || parsedLocalUser.name,
                  email: ent.email || parsedLocalUser.email,
                  img_perfil: ent.logo || parsedLocalUser.img_perfil,
                  phone: ent.phone || parsedLocalUser.phone,
                  cif: ent.cif || parsedLocalUser.cif,
                  location: ent.location || parsedLocalUser.location,
                  onboarding_ended: ent.onboarding_ended ?? parsedLocalUser.onboarding_ended,
                  enterprise: ent,
                };
                await safeSetItem(STORAGE_KEYS.USER, JSON.stringify(updatedEnterpriseUser));
                await safeSetItem(STORAGE_KEYS.SELECTED_ENTERPRISE, JSON.stringify(ent));
                setUser(updatedEnterpriseUser);
                setSelectedEnterprise(ent);
              } else {
                setUser(parsedLocalUser);
              }
            } catch (entErr) {
              console.warn("[UserContext] validateEnterpriseToken aviso, usando sesión local:", entErr?.message);
              setUser(parsedLocalUser);
            }
            setIsAuthenticated(true);
            setActiveMode("enterprise");
          } else {
            const [validateRes, infoRes] = await Promise.all([
              authService.validateToken(),
              usuarioService.getUserInfo(),
            ]);
            const userData = validateRes.data || validateRes;
            const fullUser = {
              ...parsedLocalUser,
              id: userData.userId,
              email: userData.email,
              img_perfil: userData.img_perfil,
              ciudad: userData.ciudad,
              onboarding_ended: userData.onboarding_ended,
              role: userData.role,
              ...(infoRes.data || infoRes),
              completitud: infoRes.completitud ?? null,
              completitud_cae: infoRes.completitud_cae ?? null,
              monedero: infoRes.monedero ?? null,
            };
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fullUser));
            setUser(fullUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Error al obtener info del usuario en loadUser:", error);
          const isAuthError =
            error?.status === 401 ||
            error?.message?.includes("401") ||
            error?.message?.includes("Unauthorized") ||
            error?.message?.includes("Sesión expirada");
          if (isAuthError) {
            await clearStoredSession();
          } else {
            const localUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            if (localUserData) {
              const parsedUser = JSON.parse(localUserData);
              setUser(parsedUser);
              setIsAuthenticated(true);
            }
          }
        }
      } else {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Conmutador de modo: "personal" ⇋ "enterprise"
  const switchMode = async (mode, enterpriseId = null) => {
    try {
      const targetMode = mode === "enterprise" ? "enterprise" : "personal";
      setActiveMode(targetMode);
      await safeSetItem(STORAGE_KEYS.ACTIVE_MODE, targetMode);

      if (enterpriseId && corporateMemberships.length > 0) {
        const ent = corporateMemberships.find(
          (m) => String(m.id || m.enterprise_id) === String(enterpriseId),
        );
        if (ent) {
          setSelectedEnterprise(ent);
          await safeSetItem(STORAGE_KEYS.SELECTED_ENTERPRISE, JSON.stringify(ent));
        }
      }
    } catch (e) {
      console.error("Error al conmutar modo en UserContext:", e);
    }
  };

  // Guardar sesión (token + usuario)
  const saveSession = async (userData, token) => {
    try {
      userCache.clear();
      await safeSetItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      if (token) {
        await tokenStorage.setAuthToken(token);
        httpClient.setToken(token);
        travelsHttpClient.setToken(token);
        notificationsHttpClient.setToken(token);
      }
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error al guardar sesión:", error);
      throw error;
    }
  };

  // Limpiar sesión almacenada
  const clearStoredSession = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.ACTIVE_MODE,
      STORAGE_KEYS.IDENTITY,
      STORAGE_KEYS.PERMISSIONS,
      STORAGE_KEYS.MEMBERSHIPS,
      STORAGE_KEYS.SELECTED_ENTERPRISE,
    ]);
    await tokenStorage.clearAllAuthTokens();
    httpClient.clearToken();
    travelsHttpClient.clearToken();
    notificationsHttpClient.clearToken();
    userCache.clear();
    homeCache.clear();
    socketService.disconnect();
    setUser(null);
    setIdentity(null);
    setPermissions({});
    setCorporateMemberships([]);
    setSelectedEnterprise(null);
    setActiveMode("personal");
    setIsAuthenticated(false);
  };

  // Crear usuario (registro) — solo email + password
  const crearUsuario = async (email, password, options = {}) => {
    try {
      const response = await authService.register(email, password, options);
      const token = response.token;
      httpClient.setToken(token);
      travelsHttpClient.setToken(token);

      let userData = {
        id: response.userId,
        email,
        onboarding_ended: 0,
      };

      try {
        const infoRes = await usuarioService.getUserInfo();
        userData = {
          ...userData,
          ...(infoRes.data || infoRes),
          completitud: infoRes.completitud ?? null,
          completitud_cae: infoRes.completitud_cae ?? null,
          monedero: infoRes.monedero ?? null,
        };
      } catch (infoErr) {
        console.warn("[UserContext] getUserInfo fallo en crearUsuario:", infoErr?.message);
      }

      await saveSession(userData, token);
      return { ...response, user: userData };
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  };

  // Iniciar sesión (Login Unificado)
  const iniciarSesion = async (email, password) => {
    try {
      const response = await authService.unifiedLogin({
        email,
        password,
        auth_type: "auto",
      });

      // Si recibimos la respuesta estandarizada de identidad
      if (response?.identity) {
        const normalizedUser = await processUnifiedAuthResponse(response);
        return { ...response, user: normalizedUser };
      }

      // Fallback para login clásico
      const token = response.token;
      httpClient.setToken(token);
      travelsHttpClient.setToken(token);

      let userData = {
        id: response.userId,
        email,
        img_perfil: response.img_perfil,
        onboarding_ended: response.onboarding_ended,
        role: response.role || "user",
      };

      try {
        const infoRes = await usuarioService.getUserInfo();
        userData = {
          ...userData,
          ...(infoRes.data || infoRes),
          completitud: infoRes.completitud ?? null,
          completitud_cae: infoRes.completitud_cae ?? null,
          monedero: infoRes.monedero ?? null,
        };
      } catch (infoErr) {
        console.warn("[UserContext] getUserInfo fallo en iniciarSesion:", infoErr?.message);
      }

      await saveSession(userData, token);
      return { ...response, user: userData };
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  // Login con Google nativo (Login Unificado)
  const loginGoogleNative = async (idToken, method = "login", options = {}) => {
    try {
      const response = await authService.unifiedLogin({
        id_token: idToken,
        auth_method: "google",
      });

      if (response?.identity) {
        const normalizedUser = await processUnifiedAuthResponse(response);
        return { token: response.token, userId: response.identity.user_id, user: normalizedUser };
      }

      // Fallback legacy
      const res = await authService.loginWithGoogleAndroid(idToken, method, options);
      const { token, userId, img_perfil } = res;

      httpClient.setToken(token);
      travelsHttpClient.setToken(token);
      let userData = {
        id: userId,
        img_perfil: img_perfil || null,
        onboarding_ended: res.onboarding_ended,
        role: res.role || "user",
      };

      try {
        const infoRes = await usuarioService.getUserInfo();
        userData = {
          ...userData,
          ...(infoRes.data || infoRes),
          completitud: infoRes.completitud ?? null,
          completitud_cae: infoRes.completitud_cae ?? null,
          monedero: infoRes.monedero ?? null,
        };
      } catch (infoErr) {
        console.warn("[UserContext] getUserInfo fallo en loginGoogle:", infoErr?.message);
      }

      await saveSession(userData, token);
      return { token, userId, user: userData };
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      throw error;
    }
  };

  // Procesar sesión de organización (B2B - docs/api/enterprise_auth.md)
  const processEnterpriseAuthSession = async (response) => {
    const token = response.token;
    if (token) {
      await tokenStorage.setAuthToken(token);
      httpClient.setToken(token);
      travelsHttpClient.setToken(token);
      notificationsHttpClient.setToken(token);
    }

    const ent = response.enterprise || {};
    const normalizedEnterpriseUser = {
      id: ent.id || response.userId || "enterprise-account",
      email: ent.email || "",
      name: ent.name || "Organización",
      img_perfil: ent.logo || null,
      phone: ent.phone || null,
      cif: ent.cif || null,
      location: ent.location || null,
      role: "enterprise",
      classification: "ENTERPRISE",
      identity_type: "LEGAL_ENTITY",
      is_corporate_member: true,
      onboarding_ended: ent.onboarding_ended ?? false,
      enterprise: ent,
    };

    const identityObj = {
      user_id: normalizedEnterpriseUser.id,
      email: normalizedEnterpriseUser.email,
      display_name: normalizedEnterpriseUser.name,
      type: "LEGAL_ENTITY",
      system_role: "enterprise",
      avatar: normalizedEnterpriseUser.img_perfil,
    };

    const permsObj = {
      can_access_corporate_mode: true,
      can_access_personal_mode: false,
      is_enterprise_admin: true,
    };

    await safeMultiSet([
      [STORAGE_KEYS.USER, JSON.stringify(normalizedEnterpriseUser)],
      [STORAGE_KEYS.ACTIVE_MODE, "enterprise"],
      [STORAGE_KEYS.SELECTED_ENTERPRISE, JSON.stringify(ent)],
      [STORAGE_KEYS.IDENTITY, JSON.stringify(identityObj)],
      [STORAGE_KEYS.PERMISSIONS, JSON.stringify(permsObj)],
      ["@youconnext_enterprise_profile", JSON.stringify(ent)],
    ]);

    setUser(normalizedEnterpriseUser);
    setIdentity(identityObj);
    setPermissions(permsObj);
    setSelectedEnterprise(ent);
    setActiveMode("enterprise");
    setIsAuthenticated(true);

    return normalizedEnterpriseUser;
  };

  // Iniciar sesión corporativa (Organización - docs/api/enterprise_auth.md)
  const iniciarSesionOrganizacion = async (email, password) => {
    try {
      const response = await enterpriseService.enterpriseLogin({
        email: email.trim(),
        password,
      });

      if (!response?.token) {
        throw new Error(
          response?.message || "No se pudo obtener el token de acceso de la organización."
        );
      }

      const normalizedUser = await processEnterpriseAuthSession(response);
      return { ...response, user: normalizedUser };
    } catch (error) {
      console.error("[UserContext] Error al iniciar sesión de organización:", error);
      throw error;
    }
  };

  // Crear cuenta de organización (docs/api/enterprise_auth.md)
  const crearOrganizacion = async (email, password, name) => {
    try {
      const response = await enterpriseService.enterpriseRegister({
        email: email.trim(),
        password,
        name: name ? name.trim() : undefined,
      });

      if (!response?.token) {
        throw new Error(
          response?.message || "No se pudo registrar la organización."
        );
      }

      const normalizedUser = await processEnterpriseAuthSession(response);
      return { ...response, user: normalizedUser };
    } catch (error) {
      console.error("[UserContext] Error al crear organización:", error);
      throw error;
    }
  };

  // Cerrar sesión
  const cerrarSesion = async () => {
    try {
      if (activeMode === "enterprise" || user?.role === "enterprise") {
        await enterpriseService.logoutEnterprise();
      } else {
        await authService.logout();
      }
    } catch (error) {
      console.error("Error al cerrar sesión en API:", error);
    } finally {
      try {
        await GoogleSignin.signOut();
      } catch (e) {}

      try {
        const jwtToken = await tokenStorage.getAuthToken();
        await unregisterPushDevice(jwtToken);
      } catch (e) {}

      await clearStoredSession();
    }
  };

  // Actualizar datos de organización / sede corporativa (docs/api/enterprise.md)
  const actualizarOrganizacion = async (datos) => {
    try {
      const enterpriseId =
        selectedEnterprise?.id || user?.enterprise?.id || user?.id;
      const updatedEnterprise = await enterpriseService.updateEnterpriseProfile(
        datos,
        enterpriseId
      );
      const updatedUser = {
        ...user,
        ...updatedEnterprise,
        name: updatedEnterprise.name || user?.name || "Organización",
        onboarding_ended: updatedEnterprise.onboarding_ended ?? true,
        enterprise: updatedEnterprise,
      };

      await safeMultiSet([
        [STORAGE_KEYS.USER, JSON.stringify(updatedUser)],
        [STORAGE_KEYS.SELECTED_ENTERPRISE, JSON.stringify(updatedEnterprise)],
        ["@youconnext_enterprise_profile", JSON.stringify(updatedEnterprise)],
      ]);

      setUser(updatedUser);
      setSelectedEnterprise(updatedEnterprise);
      return updatedUser;
    } catch (error) {
      console.error("[UserContext] Error al actualizar organización:", error);
      throw error;
    }
  };

  // Actualizar usuario (PATCH /api/users)
  const actualizarUsuario = async (datos) => {
    if (
      user?.role === "enterprise" ||
      activeMode === "enterprise" ||
      user?.identity_type === "LEGAL_ENTITY"
    ) {
      return actualizarOrganizacion(datos);
    }

    try {
      await usuarioService.updateUser(datos);

      try {
        const infoRes = await usuarioService.getUserInfo();
        const infoData = infoRes.data || infoRes;
        const updatedUser = {
          ...user,
          ...infoData,
          ...datos,
          completitud: infoRes.completitud ?? null,
          completitud_cae: infoRes.completitud_cae ?? null,
          monedero: infoRes.monedero ?? null,
        };
        await safeSetItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return updatedUser;
      } catch {
        const updatedUser = { ...user, ...datos };
        await safeSetItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return updatedUser;
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    activeMode,
    identity,
    permissions,
    corporateMemberships,
    selectedEnterprise,
    switchMode,
    setSelectedEnterprise,
    clearAppCache: purgeVolatileCaches,
    crearUsuario,
    iniciarSesion,
    loginGoogleNative,
    iniciarSesionOrganizacion,
    crearOrganizacion,
    actualizarOrganizacion,
    cerrarSesion,
    actualizarUsuario,
    refreshUser: loadUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe ser usado dentro de UserProvider");
  }
  return context;
};

export default UserContext;
