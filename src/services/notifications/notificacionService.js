// YouConnext - Notificacion Service (notifications microservice)
import httpClient from "./httpClient";

// ============================================================
// Health
// ============================================================

async function healthCheck() {
  return httpClient.request("/health");
}

// ============================================================
// Emails
// ============================================================

async function getEmailTemplates() {
  return httpClient.request("/api/emails/templates");
}

async function checkSmtpHealth() {
  return httpClient.request("/api/emails/health/smtp");
}

async function sendEmail(payload) {
  return httpClient.request("/api/emails/send", {
    method: "POST",
    body: payload,
  });
}

async function sendTemplatedEmail(payload) {
  return httpClient.request("/api/emails/send/template", {
    method: "POST",
    body: payload,
  });
}

async function sendSuggestionEmail(payload) {
  return httpClient.request("/api/emails/send/suggestion", {
    method: "POST",
    body: payload,
  });
}

async function sendBatchEmails(payload) {
  return httpClient.request("/api/emails/send/batch", {
    method: "POST",
    body: payload,
  });
}

// ============================================================
// Push Notifications (FCM)
// ============================================================

async function sendPush(payload) {
  return httpClient.request("/api/push/send", {
    method: "POST",
    body: payload,
  });
}

async function sendMulticastPush(payload) {
  return httpClient.request("/api/push/send/multicast", {
    method: "POST",
    body: payload,
  });
}

async function sendPushToUser(payload) {
  return httpClient.request("/api/push/send/user", {
    method: "POST",
    body: payload,
  });
}

async function sendPushToTopic(payload) {
  return httpClient.request("/api/push/send/topic", {
    method: "POST",
    body: payload,
  });
}

async function subscribeToTopic(payload) {
  return httpClient.request("/api/push/topic/subscribe", {
    method: "POST",
    body: payload,
  });
}

async function unsubscribeFromTopic(payload) {
  return httpClient.request("/api/push/topic/unsubscribe", {
    method: "POST",
    body: payload,
  });
}

// ============================================================
// Device Tokens (JWT required)
// ============================================================

async function registerDeviceToken(payload) {
  return httpClient.request("/api/device-tokens", {
    method: "POST",
    body: payload,
  });
}

async function getMyDeviceTokens() {
  return httpClient.request("/api/device-tokens/me");
}

async function unregisterDeviceToken(payload) {
  return httpClient.request("/api/device-tokens", {
    method: "DELETE",
    body: payload,
  });
}

export const notificacionService = {
  // Health
  healthCheck,

  // Emails
  getEmailTemplates,
  checkSmtpHealth,
  sendEmail,
  sendTemplatedEmail,
  sendSuggestionEmail,
  sendBatchEmails,

  // Push
  sendPush,
  sendMulticastPush,
  sendPushToUser,
  sendPushToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,

  // Device tokens
  registerDeviceToken,
  getMyDeviceTokens,
  unregisterDeviceToken,
};

export default notificacionService;
