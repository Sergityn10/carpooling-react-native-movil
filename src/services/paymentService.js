// YouConnext - Payment Service
import httpClient from "./httpClient";
import { generateUUID } from "../utils/uuid";

// Crear cuenta Stripe Connect — POST /api/payment/stripe-connect
async function createStripeConnect(data) {
  return httpClient.request("/api/payment/stripe-connect", {
    method: "POST",
    body: data,
  });
}

// Obtener link de onboarding — GET /api/payment/stripe-connect-link
async function getStripeConnectLink(params) {
  const query = new URLSearchParams();
  if (params?.return_url) query.set("return_url", params.return_url);
  if (params?.refresh_url) query.set("refresh_url", params.refresh_url);
  const qs = query.toString();
  return httpClient.request(
    `/api/payment/stripe-connect-link${qs ? `?${qs}` : ""}`,
  );
}

// Obtener mi cuenta Stripe Connect — GET /api/payment/stripe-connect
async function getStripeConnect() {
  return httpClient.request("/api/payment/stripe-connect");
}

// Crear cliente Stripe — POST /api/payment/stripe-customer
async function createStripeCustomer(data) {
  return httpClient.request("/api/payment/stripe-customer", {
    method: "POST",
    body: data,
  });
}

// Obtener mi cliente Stripe — GET /api/payment/stripe-customer
async function getStripeCustomer() {
  return httpClient.request("/api/payment/stripe-customer");
}

// Crear link de cuenta Stripe — POST /api/payment/stripe-link
async function createStripeLink(data) {
  return httpClient.request("/api/payment/stripe-link", {
    method: "POST",
    body: data,
  });
}

// Crear login link de Stripe — POST /api/payment/stripe-login-link
async function createStripeLoginLink(data) {
  return httpClient.request("/api/payment/stripe-login-link", {
    method: "POST",
    body: data,
  });
}

// Crear sesión del Billing Portal — GET /api/payment/stripe-billing-portal
async function createBillingPortal() {
  return httpClient.request("/api/payment/stripe-billing-portal");
}

// Obtener balance de efectivo (Stripe) — GET /api/payment/cash-balance
async function getCashBalance() {
  return httpClient.request("/api/payment/cash-balance");
}

// Obtener movimientos unificados con filtros y paginación — GET /api/payment/movements
async function getMovements({
  role = "all",
  type,
  limit = 20,
  offset = 0,
  from_date,
  to_date,
} = {}) {
  const query = new URLSearchParams();
  if (role && role !== "all") query.set("role", role);
  if (type) query.set("type", type);
  if (limit) query.set("limit", String(limit));
  if (offset !== undefined && offset !== null) query.set("offset", String(offset));
  if (from_date) query.set("from_date", from_date);
  if (to_date) query.set("to_date", to_date);
  const qs = query.toString();
  return httpClient.request(`/api/payment/movements${qs ? `?${qs}` : ""}`);
}

// Obtener balance del monedero (Wallet) — GET /api/payment/wallet-balance
async function getWalletBalance() {
  return httpClient.request("/api/payment/wallet-balance");
}

// Obtener transacciones del monedero — GET /api/payment/wallet-transactions
async function getWalletTransactions(limit = 50, offset = 0) {
  return httpClient.request(
    `/api/payment/wallet-transactions?limit=${limit}&offset=${offset}`,
  );
}

// Crear Payout del monedero con clave de idempotencia UUID — POST /api/payment/wallet-payout
async function createWalletPayout(data) {
  const idempotencyKey = data?.idempotency_key || generateUUID();
  const body = {
    ...data,
    idempotency_key: idempotencyKey,
  };
  return httpClient.request("/api/payment/wallet-payout", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body,
  });
}

// Listar Payouts del monedero — GET /api/payment/wallet-payouts
async function getWalletPayouts(limit = 50, offset = 0) {
  return httpClient.request(
    `/api/payment/wallet-payouts?limit=${limit}&offset=${offset}`,
  );
}

// Crear Payout directo (Stripe) — POST /api/payment/payout
async function createStripePayout(data) {
  return httpClient.request("/api/payment/payout", {
    method: "POST",
    body: data,
  });
}

// Recargar monedero — POST /api/payment/recharge
async function rechargeWallet(data) {
  return httpClient.request("/api/payment/recharge", {
    method: "POST",
    body: data,
  });
}

// Crear cuenta bancaria — POST /api/payment/bank_account
async function createBankAccount(data) {
  return httpClient.request("/api/payment/bank_account", {
    method: "POST",
    body: data,
  });
}

// Obtener cuentas vinculadas (tarjetas y bancos) — GET /api/monedero/cuenta-vinculada
async function getLinkedAccounts() {
  return httpClient.request("/api/monedero/cuenta-vinculada");
}

// Obtener link de checkout de una reserva — GET /api/payment/payment-intent/:id_reserva/checkout-link
async function getCheckoutLink(idReserva) {
  return httpClient.request(
    `/api/payment/payment-intent/${idReserva}/checkout-link`,
  );
}

export const paymentService = {
  getMovements,
  createStripeConnect,
  getStripeConnectLink,
  getStripeConnect,
  createStripeCustomer,
  getStripeCustomer,
  createStripeLink,
  createStripeLoginLink,
  createBillingPortal,
  getCashBalance,
  getWalletBalance,
  getWalletTransactions,
  createWalletPayout,
  getWalletPayouts,
  createStripePayout,
  rechargeWallet,
  createBankAccount,
  getLinkedAccounts,
  getCheckoutLink,
};

export default paymentService;
