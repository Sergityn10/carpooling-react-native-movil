import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  ChevronRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CheckCircle2 as CheckIcon,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../../constants";
import styles from "../profileStyles";
import SubViewHeader from "./SubViewHeader";

const formatCentsToEuros = (cents) => {
  if (typeof cents !== "number") return "0,00";
  return (cents / 100).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatEuros = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "0,00";
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const MonederoSection = ({
  walletBalance,
  walletBalanceEuros,
  caeData,
  loadingWallet,
  walletError,
  walletTransactions,
  walletPayouts,
  linkedAccounts,
  stripeConnectStatus,
  stripeOnboardingLoading,
  showPayoutModal,
  payoutAmount,
  processingPayout,
  onSetPayoutAmount,
  onShowPayoutModal,
  onClosePayoutModal,
  onWithdraw,
  onViewStripeAccount,
  onSetupStripeConnect,
  onSetupPaymentMethod,
  onRetryWallet,
  onBack,
}) => {
  const walletEuros =
    walletBalance && walletBalance.length > 0
      ? walletBalance[0].balance_cents / 100
      : 0;
  const caeDisponible = caeData?.disponible ?? 0;
  const caeRevision = caeData?.en_revision ?? 0;

  const pendingTxAmount = walletTransactions
    .filter((tx) => tx.status === "pending" || tx.type === "pending")
    .reduce((sum, tx) => sum + (tx.amount || 0) / 100, 0);

  const disponibleTotal = walletEuros + caeDisponible;
  const revisionTotal = caeRevision + pendingTxAmount;

  return (
    <ScrollView
      style={styles.sectionContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.sectionScroll}
    >
      <SubViewHeader title="Monedero" onBack={onBack} />

      {loadingWallet ? (
        <View style={styles.walletLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.walletLoadingText}>Cargando saldo...</Text>
        </View>
      ) : walletError ? (
        <View style={styles.walletErrorContainer}>
          <Text style={styles.walletErrorText}>{walletError}</Text>
          <TouchableOpacity
            style={styles.walletRetryBtn}
            onPress={onRetryWallet}
          >
            <Text style={styles.walletRetryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Tarjeta principal — Disponible */}
          <View style={styles.walletDisponibleCard}>
            <View style={styles.walletDisponibleHeader}>
              <View style={styles.walletDisponibleIcon}>
                <CheckIcon size={22} color={COLORS.white} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletDisponibleLabel}>Disponible</Text>
                <Text style={styles.walletDisponibleSublabel}>
                  Listo para retirar
                </Text>
              </View>
            </View>
            <Text style={styles.walletDisponibleAmount}>
              {formatEuros(disponibleTotal)} €
            </Text>
            <View style={styles.walletDisponibleBreakdown}>
              <View style={styles.walletDisponibleBreakdownItem}>
                <View
                  style={[
                    styles.walletBreakdownDot,
                    { backgroundColor: "rgba(255,255,255,0.5)" },
                  ]}
                />
                <Text style={styles.walletDisponibleBreakdownLabel}>
                  Monedero
                </Text>
                <Text style={styles.walletDisponibleBreakdownValue}>
                  {formatEuros(walletEuros)} €
                </Text>
              </View>
              {caeDisponible > 0 && (
                <View style={styles.walletDisponibleBreakdownItem}>
                  <View
                    style={[
                      styles.walletBreakdownDot,
                      { backgroundColor: "rgba(255,255,255,0.5)" },
                    ]}
                  />
                  <Text style={styles.walletDisponibleBreakdownLabel}>
                    CAE disponible
                  </Text>
                  <Text style={styles.walletDisponibleBreakdownValue}>
                    {formatEuros(caeDisponible)} €
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tarjeta secundaria — En revisión */}
          <View style={styles.walletRevisionCard}>
            <View style={styles.walletRevisionHeader}>
              <View style={styles.walletRevisionIcon}>
                <Clock size={20} color={COLORS.warning} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletRevisionLabel}>En revisión</Text>
                <Text style={styles.walletRevisionSublabel}>
                  Pendiente de validación
                </Text>
              </View>
            </View>
            <Text style={styles.walletRevisionAmount}>
              {formatEuros(revisionTotal)} €
            </Text>
            <View style={styles.walletRevisionBreakdown}>
              {caeRevision > 0 && (
                <View style={styles.walletRevisionBreakdownItem}>
                  <View
                    style={[
                      styles.walletBreakdownDot,
                      { backgroundColor: COLORS.warning },
                    ]}
                  />
                  <Text style={styles.walletRevisionBreakdownLabel}>
                    CAE en revisión
                  </Text>
                  <Text style={styles.walletRevisionBreakdownValue}>
                    {formatEuros(caeRevision)} €
                  </Text>
                </View>
              )}
              {pendingTxAmount > 0 && (
                <View style={styles.walletRevisionBreakdownItem}>
                  <View
                    style={[
                      styles.walletBreakdownDot,
                      { backgroundColor: COLORS.warning },
                    ]}
                  />
                  <Text style={styles.walletRevisionBreakdownLabel}>
                    Reservas pendientes
                  </Text>
                  <Text style={styles.walletRevisionBreakdownValue}>
                    {formatEuros(pendingTxAmount)} €
                  </Text>
                </View>
              )}
              {caeRevision === 0 && pendingTxAmount === 0 && (
                <Text style={styles.walletRevisionEmpty}>
                  No hay dinero en revisión actualmente
                </Text>
              )}
            </View>
          </View>
        </>
      )}

      {/* Botones de acción */}
      {!loadingWallet && !walletError && (
        <View style={styles.walletActionsRow}>
          <TouchableOpacity
            style={styles.walletActionBtn}
            onPress={onShowPayoutModal}
          >
            <View style={styles.walletActionIcon}>
              <ArrowUpFromLine
                size={20}
                color={COLORS.secondary}
                strokeWidth={2.5}
              />
            </View>
            <Text style={styles.walletActionText}>Retirar saldo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.walletActionBtn}
            onPress={onViewStripeAccount}
          >
            <View style={styles.walletActionIcon}>
              <ExternalLink
                size={20}
                color={COLORS.secondary}
                strokeWidth={2.5}
              />
            </View>
            <Text style={styles.walletActionText}>Ver cuenta Stripe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.walletActionBtn}
            onPress={onSetupPaymentMethod}
          >
            <View style={styles.walletActionIcon}>
              <CreditCard
                size={20}
                color={COLORS.secondary}
                strokeWidth={2.5}
              />
            </View>
            <Text style={styles.walletActionText}>Método de pago</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Configuración Stripe Connect */}
      {!loadingWallet &&
      !walletError &&
      stripeConnectStatus?.detailsSubmitted ? (
        <View style={styles.stripeConnectedBadge}>
          <CheckCircle2 size={18} color={COLORS.success} strokeWidth={2} />
          <Text style={styles.stripeConnectedText}>
            Cuenta Stripe verificada
          </Text>
        </View>
      ) : !loadingWallet && !walletError && stripeConnectStatus ? (
        <TouchableOpacity
          style={styles.stripeConnectCard}
          onPress={onSetupStripeConnect}
          disabled={stripeOnboardingLoading}
          activeOpacity={0.8}
        >
          <View style={styles.stripeConnectLeft}>
            <View style={styles.stripeConnectIcon}>
              {stripeOnboardingLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <CreditCard size={22} color={COLORS.primary} strokeWidth={2} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stripeConnectTitle}>
                {stripeConnectStatus?.hasAccount
                  ? "Completar onboarding Stripe"
                  : "Configurar cuenta Stripe"}
              </Text>
              <Text style={styles.stripeConnectSubtitle}>
                {stripeConnectStatus?.hasAccount
                  ? "Termina de configurar tu cuenta para recibir pagos y retirar saldo"
                  : "Configura tu cuenta para recibir pagos y retirar saldo"}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={COLORS.gray400} strokeWidth={2} />
        </TouchableOpacity>
      ) : null}

      {/* Cuentas vinculadas (tarjetas y bancos) */}
      {!loadingWallet && !walletError && (
        <View>
          <Text style={styles.linkedAccountsTitle}>Mis métodos de cobro</Text>
          {loadingWallet ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ paddingVertical: SPACING.xl }}
            />
          ) : linkedAccounts.length === 0 ? (
            <View style={styles.walletSectionCard}>
              <Text style={styles.walletEmptyText}>
                No tienes métodos de cobro vinculados. Configura tu cuenta
                Stripe para añadir tarjetas y cuentas bancarias.
              </Text>
            </View>
          ) : (
            <View style={styles.linkedAccountsList}>
              {linkedAccounts.map((cuenta, idx) =>
                cuenta.tipo === "tarjeta" ? (
                  <View
                    key={`card-${idx}`}
                    style={[
                      styles.bankCard,
                      cuenta.marca?.toLowerCase() === "visa" &&
                        styles.bankCardVisa,
                      cuenta.marca?.toLowerCase() === "mastercard" &&
                        styles.bankCardMastercard,
                      cuenta.marca?.toLowerCase() === "amex" &&
                        styles.bankCardAmex,
                    ]}
                  >
                    <View style={styles.bankCardTop}>
                      <View style={styles.bankCardChip} />
                      <Text style={styles.bankCardBrand}>
                        {cuenta.marca || "Tarjeta"}
                      </Text>
                    </View>
                    <Text style={styles.bankCardNumber}>
                      •••• •••• •••• {cuenta.ultimos4}
                    </Text>
                    <View style={styles.bankCardBottom}>
                      <View>
                        <Text style={styles.bankCardLabel}>Caducidad</Text>
                        <Text style={styles.bankCardValue}>
                          {cuenta.caducidad || "—"}
                        </Text>
                      </View>
                      <View style={styles.bankCardBrandCircle}>
                        <Text style={styles.bankCardBrandCircleText}>
                          {cuenta.marca?.slice(0, 1).toUpperCase() || "T"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View key={`bank-${idx}`} style={styles.bankAccountCard}>
                    <View style={styles.bankAccountLeft}>
                      <View style={styles.bankAccountIcon}>
                        <CreditCard
                          size={20}
                          color={COLORS.primary}
                          strokeWidth={2}
                        />
                      </View>
                      <View>
                        <Text style={styles.bankAccountBank}>
                          {cuenta.banco || "Cuenta bancaria"}
                        </Text>
                        <Text style={styles.bankAccountIban}>
                          •••• {cuenta.ultimos4}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bankAccountRight}>
                      <Text
                        style={[
                          styles.bankAccountStatus,
                          cuenta.estado === "validated" && {
                            color: COLORS.success,
                          },
                          cuenta.estado === "new" && {
                            color: COLORS.warning,
                          },
                          cuenta.estado === "errored" && {
                            color: COLORS.error,
                          },
                        ]}
                      >
                        {cuenta.estado === "validated"
                          ? "Validada"
                          : cuenta.estado === "new"
                            ? "Pendiente"
                            : cuenta.estado === "errored"
                              ? "Error"
                              : cuenta.estado}
                      </Text>
                      <Text style={styles.bankAccountCurrency}>
                        {(cuenta.moneda || "eur").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ),
              )}
            </View>
          )}
        </View>
      )}

      {/* Transacciones recientes */}
      {!loadingWallet && !walletError && (
        <View style={styles.walletSectionCard}>
          <Text style={styles.walletSectionTitle}>Transacciones recientes</Text>
          {walletTransactions.length === 0 ? (
            <Text style={styles.walletEmptyText}>
              No hay transacciones recientes.
            </Text>
          ) : (
            walletTransactions.slice(0, 10).map((tx) => (
              <View key={tx.id} style={styles.walletTxRow}>
                <View style={styles.walletTxIcon}>
                  {tx.type === "deposit" ? (
                    <ArrowDownToLine
                      size={16}
                      color={COLORS.success}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <ArrowUpFromLine
                      size={16}
                      color={COLORS.error}
                      strokeWidth={2.5}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletTxDesc}>
                    {tx.description ||
                      (tx.type === "deposit" ? "Recarga" : "Retirada")}
                  </Text>
                  <Text style={styles.walletTxDate}>
                    {new Date(tx.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.walletTxAmount,
                    tx.type === "deposit"
                      ? { color: COLORS.success }
                      : { color: COLORS.error },
                  ]}
                >
                  {tx.type === "deposit" ? "+" : "-"}
                  {formatCentsToEuros(tx.amount)} €
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Retiradas recientes */}
      {!loadingWallet && !walletError && walletPayouts.length > 0 && (
        <View style={styles.walletSectionCard}>
          <Text style={styles.walletSectionTitle}>Retiradas recientes</Text>
          {walletPayouts.slice(0, 5).map((payout) => (
            <View key={payout.id} style={styles.walletTxRow}>
              <View style={styles.walletTxIcon}>
                <ArrowUpFromLine
                  size={16}
                  color={COLORS.gray500}
                  strokeWidth={2.5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletTxDesc}>Retirada a Stripe</Text>
                <Text style={styles.walletTxDate}>
                  {new Date(payout.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.walletTxAmount}>
                  -{formatCentsToEuros(payout.amount)} €
                </Text>
                <Text
                  style={[
                    styles.walletPayoutStatus,
                    payout.status === "succeeded" && { color: COLORS.success },
                    payout.status === "pending" && { color: COLORS.warning },
                    payout.status === "failed" && { color: COLORS.error },
                  ]}
                >
                  {payout.status === "succeeded"
                    ? "Completada"
                    : payout.status === "pending"
                      ? "En proceso"
                      : payout.status === "failed"
                        ? "Fallida"
                        : payout.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: SPACING.xxl }} />

      {/* Modal de retirar saldo */}
      {showPayoutModal && (
        <View style={styles.payoutModalOverlay}>
          <View style={styles.payoutModalCard}>
            <Text style={styles.payoutModalTitle}>Retirar saldo</Text>
            <Text style={styles.payoutModalSubtitle}>
              Saldo disponible: {formatEuros(disponibleTotal)} €
            </Text>
            <View style={styles.payoutInputWrapper}>
              <TextInput
                style={styles.payoutInput}
                value={payoutAmount}
                onChangeText={onSetPayoutAmount}
                placeholder="0,00"
                placeholderTextColor={COLORS.gray400}
                keyboardType="decimal-pad"
              />
              <Text style={styles.payoutInputSuffix}>€</Text>
            </View>
            <View style={styles.payoutModalActions}>
              <TouchableOpacity
                style={[
                  styles.payoutModalBtn,
                  { backgroundColor: COLORS.gray200 },
                ]}
                onPress={onClosePayoutModal}
                disabled={processingPayout}
              >
                <Text
                  style={[styles.payoutModalBtnText, { color: COLORS.gray700 }]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.payoutModalBtn,
                  { flex: 2, backgroundColor: COLORS.primary },
                ]}
                onPress={onWithdraw}
                disabled={processingPayout}
              >
                {processingPayout ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.payoutModalBtnText}>Retirar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default MonederoSection;
