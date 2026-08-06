// YouConnext - User Context
import React, { createContext, useContext, useState, useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import httpClient from "../services/httpClient";
import travelsHttpClient from "../services/travels/httpClient";
import notificationsHttpClient from "../services/notifications/httpClient";
import authService from "../services/authService";
import usuarioService from "../services/usuarioService";
import userCache from "../services/messages/userCache";
import { homeCache } from "../services/homeCache";
import socketService from "../services/messages/socketService";
import {
  registerPushDevice,
  unregisterPushDevice,
  listenForTokenRefresh,
} from "../services/notifications/pushRegistration";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar usuario desde AsyncStorage al iniciar
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
      const jwtToken = await AsyncStorage.getItem("@youconnext_token");
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

  // Cargar usuario almacenado
  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("@youconnext_token");

      if (token) {
        httpClient.setToken(token);
        travelsHttpClient.setToken(token);
        notificationsHttpClient.setToken(token);
        try {
          // Validar token y obtener datos del usuario
          const validateRes = await authService.validateToken();
          const userData = validateRes.data || validateRes;

          // Obtener info completa del usuario
          try {
            const infoRes = await usuarioService.getUserInfo();
            const fullUser = {
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
            setUser(fullUser);
            setIsAuthenticated(true);
          } catch {
            // Si getUserInfo falla, usar datos de validateToken
            setUser({
              id: userData.userId,
              email: userData.email,
              img_perfil: userData.img_perfil,
              ciudad: userData.ciudad,
              onboarding_ended: userData.onboarding_ended,
              role: userData.role,
            });
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Error al validar token:", error);
          // Solo cerrar sesión si es un error de autenticación (401),
          // no por errores de red o del servidor
          const isAuthError =
            error?.message?.includes("401") ||
            error?.message?.includes("token") ||
            error?.message?.includes("Unauthorized") ||
            error?.message?.includes("sesión");
          if (isAuthError) {
            await clearStoredSession();
          } else {
            // Error de red o servidor: mantener sesión, usar datos locales
            const localUserData =
              await AsyncStorage.getItem("@youconnext_user");
            if (localUserData) {
              const parsedUser = JSON.parse(localUserData);
              setUser(parsedUser);
              setIsAuthenticated(true);
            }
          }
        }
      } else {
        // Fallback: cargar usuario guardado localmente
        const userData = await AsyncStorage.getItem("@youconnext_user");
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

  // Guardar sesión (token + usuario)
  const saveSession = async (userData, token) => {
    try {
      userCache.clear();
      await AsyncStorage.setItem("@youconnext_user", JSON.stringify(userData));
      if (token) {
        await AsyncStorage.setItem("@youconnext_token", token);
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
    await AsyncStorage.removeItem("@youconnext_user");
    await AsyncStorage.removeItem("@youconnext_token");
    httpClient.clearToken();
    travelsHttpClient.clearToken();
    notificationsHttpClient.clearToken();
    userCache.clear();
    homeCache.clear();
    socketService.disconnect();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Crear usuario (registro) — solo email + password
  const crearUsuario = async (email, password, options = {}) => {
    try {
      const response = await authService.register(email, password, options);
      const token = response.token;
      httpClient.setToken(token);
      travelsHttpClient.setToken(token);
      // Tras registro, obtener info completa del usuario
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
      } catch {
        // Si falla, usar datos básicos del registro
      }

      await saveSession(userData, token);
      return { ...response, user: userData };
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  };

  // Iniciar sesión (email + password)
  const iniciarSesion = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const token = response.token;
      httpClient.setToken(token);
      travelsHttpClient.setToken(token);
      // Construir userData con lo que devuelve login + validateToken
      let userData = {
        id: response.userId,
        email,
        img_perfil: response.img_perfil,
        onboarding_ended: response.onboarding_ended,
      };

      // Obtener info completa del usuario
      try {
        const infoRes = await usuarioService.getUserInfo();
        userData = {
          ...userData,
          ...(infoRes.data || infoRes),
          completitud: infoRes.completitud ?? null,
          completitud_cae: infoRes.completitud_cae ?? null,
          monedero: infoRes.monedero ?? null,
        };
      } catch {
        // Si falla, usar datos básicos del login
      }

      await saveSession(userData, token);
      return { ...response, user: userData };
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  // Cerrar sesión
  const cerrarSesion = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error al cerrar sesión en API:", error);
    } finally {
      // Cerrar sesión también en el SDK nativo de Google
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignorar si no hay sesión de Google
      }
      // Desregistrar token de notificaciones
      try {
        const jwtToken = await AsyncStorage.getItem("@youconnext_token");
        await unregisterPushDevice(jwtToken);
      } catch (e) {
        // Ignorar si falla; clearStoredSession limpia el token igualmente
      }
      await clearStoredSession();
    }
  };

  // Login con Google nativo — recibe idToken del SDK de Google Sign-In
  const loginGoogleNative = async (idToken, method = "login", options = {}) => {
    try {
      const res = await authService.loginWithGoogleAndroid(
        idToken,
        method,
        options,
      );
      const { token, userId, img_perfil } = res;

      httpClient.setToken(token);
      travelsHttpClient.setToken(token);
      let userData = {
        id: userId,
        img_perfil: img_perfil || null,
        onboarding_ended: res.onboarding_ended,
      };

      // Obtener info completa del usuario
      try {
        const infoRes = await usuarioService.getUserInfo();
        userData = {
          ...userData,
          ...(infoRes.data || infoRes),
          completitud: infoRes.completitud ?? null,
          completitud_cae: infoRes.completitud_cae ?? null,
          monedero: infoRes.monedero ?? null,
        };
      } catch {
        // Si falla, usar datos básicos del login
      }

      await saveSession(userData, token);
      return { token, userId, user: userData };
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      throw error;
    }
  };

  // Actualizar usuario (PATCH /api/users)
  const actualizarUsuario = async (datos) => {
    try {
      await usuarioService.updateUser(datos);

      // Tras actualizar, refrescar datos del usuario
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
        await AsyncStorage.setItem(
          "@youconnext_user",
          JSON.stringify(updatedUser),
        );
        setUser(updatedUser);
        return updatedUser;
      } catch {
        // Si no se puede refrescar, actualizar localmente
        const updatedUser = { ...user, ...datos };
        await AsyncStorage.setItem(
          "@youconnext_user",
          JSON.stringify(updatedUser),
        );
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
    loading,
    isAuthenticated,
    crearUsuario,
    iniciarSesion,
    loginGoogleNative,
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
