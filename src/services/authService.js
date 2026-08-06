// YouConnext - Auth Service
import httpClient from "./httpClient";

// Login — POST /api/auth/login
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
  login,
  register,
  checkEmailExists,
  logout,
  refreshToken,
  validateToken,
  loginWithGoogleAndroid,
};

export default authService;
