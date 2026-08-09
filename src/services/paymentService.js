// YouConnext - Payment Service
import httpClient from "./httpClient";

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

// Crear Payout del monedero — POST /api/payment/wallet-payout
async function createWalletPayout(data) {
  return httpClient.request("/api/payment/wallet-payout", {
    method: "POST",
    body: data,
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
