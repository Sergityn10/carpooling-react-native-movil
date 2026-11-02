// YouConnext - Auth Service
import httpClient from "./httpClient";

// Inicio de sesión unificado — POST /api/auth/unified-login
// Admite Email + Password (auth_type: "auto") o Google OAuth ({ id_token, auth_method: "google" })
// Retorna respuesta estandarizada: { token, refreshToken, identity, legal_entity, natural_person, permissions, initial_mode }
async function unifiedLogin(params = {}) {
  const { email, password, id_token, auth_method, auth_type = "auto" } = params;
  let body = {};
  if (id_token) {
    body = { id_token, auth_method: auth_method || "google" };
  } else {
    body = { email, password, auth_type };
  }

  try {
    return await httpClient.request("/api/auth/unified-login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error) {
    // Si el endpoint unificado no responde o devuelve 404 en entornos en transición, fallback suave
    if (error?.status === 404 || error?.message?.includes("404")) {
      if (id_token) {
        return loginWithGoogleAndroid(id_token, "login");
      }
      return login(email, password);
    }
    throw error;
  }
}

// Login clásico — POST /api/auth/login
// auth_method: "PASSWORD" (por defecto) o "GOOGLE"
// Retorna: { status, message, userId, token, img_perfil, onboarding_ended }
async function login(email, password, auth_method = "PASSWORD") {
  return httpClient.request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, auth_method }),
  });
}

// Registro — POST /api/auth/register
// Retorna: { status, message, token, role, userId }
async function register(email, password, options = {}) {
  const body = {
    email,
    password,
    consents: {
      privacy_policy_accepted: options.acceptPrivacy ?? true,
      terms_of_service_accepted: options.acceptTerms ?? true,
      marketing_accepted: options.acceptMarketing ?? false,
      privacy_version: "v1.0",
      terms_version: "v1.0",
    },
  };
  return httpClient.request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Comprobar si email existe — GET /api/auth/register/email/:email
async function checkEmailExists(email) {
  return httpClient.request(
    `/api/auth/register/email/${encodeURIComponent(email)}`,
  );
}

// Logout — GET /api/auth/logout
async function logout() {
  return httpClient.request("/api/auth/logout");
}

// Refresh token — POST /api/auth/refresh
async function refreshToken() {
  return httpClient.request("/api/auth/refresh", {
    method: "POST",
  });
}

// Validar token — GET /api/auth/validate
// Retorna: { status, message, token, data: { userId, email, img_perfil, ciudad, onboarding_ended, role } }
async function validateToken() {
  return httpClient.request("/api/auth/validate");
}

// OAuth Google Android — POST /api/auth/oauth/android
// Recibe el id_token del SDK de Google Sign-In y method (login|register)
// Retorna: { status, message, token, userId, img_perfil, onboarding_ended }
async function loginWithGoogleAndroid(
  id_token,
  method = "login",
  options = {},
) {
  const body = { id_token, method };
  if (method === "register") {
    body.consents = {
      privacy_policy_accepted: options.acceptPrivacy ?? true,
      terms_of_service_accepted: options.acceptTerms ?? true,
      marketing_accepted: options.acceptMarketing ?? false,
      privacy_version: "v1.0",
      terms_version: "v1.0",
    };
  }
  return httpClient.request("/api/auth/oauth/android", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const authService = {
  unifiedLogin,
  login,
  register,
  checkEmailExists,
  logout,
  refreshToken,
  validateToken,
  loginWithGoogleAndroid,
};

export default authService;
