// YouConnext - MonederoSection Component (Self-Contained Pro Fintech UI/UX)
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import {
  ChevronRight,
  CreditCard,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  ShieldCheck,
  Building,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Wallet,
  Sparkles,
  RefreshCw,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../../constants";
import SubViewHeader from "./SubViewHeader";
import GradientBackground from "../../common/GradientBackground";
import PressableScale from "../../common/PressableScale";
import AnimatedCardEntrance from "../../common/AnimatedCardEntrance";

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

const TAB_TODOS = "todos";
const TAB_INGRESOS = "ingresos";
const TAB_RETIRADAS = "retiradas";

const MonederoSection = ({
  walletBalance,
  walletBalanceEuros,
  caeData,
  loadingWallet,
  walletError,
  walletTransactions = [],
  walletPayouts = [],
  linkedAccounts = [],
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
  const [activeTab, setActiveTab] = useState(TAB_TODOS);

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

  // Filtrado de movimientos ordenados por fecha
  const filteredMovements = useMemo(() => {
    const txList = walletTransactions.map((tx) => ({
      id: `tx-${tx.id}`,
      type: tx.type === "deposit" || tx.amount > 0 ? "income" : "payout",
      rawType: tx.type,
      description:
        tx.description ||
        (tx.type === "deposit" ? "Ingreso por trayecto" : "Pago de viaje"),
      date: tx.created_at,
      amountCents: tx.amount,
      status: tx.status || "succeeded",
    }));

    const payoutsList = walletPayouts.map((p) => ({
      id: `payout-${p.id}`,
      type: "payout",
      rawType: "payout",
      description: "Transferencia a cuenta bancaria",
      date: p.created_at,
      amountCents: p.amount,
      status: p.status || "succeeded",
    }));

    const all = [...txList, ...payoutsList].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    if (activeTab === TAB_INGRESOS) {
      return all.filter((m) => m.type === "income");
    }
    if (activeTab === TAB_RETIRADAS) {
      return all.filter((m) => m.type === "payout");
    }
    return all;
  }, [walletTransactions, walletPayouts, activeTab]);

  const handleSetPercentage = (percent) => {
    const amount = (disponibleTotal * percent).toFixed(2);
    onSetPayoutAmount(amount.replace(".", ","));
  };

  return (
    <ScrollView
      style={styles.sectionContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.sectionScroll}
    >
      <SubViewHeader title="Mi Monedero" onBack={onBack} />

      {loadingWallet ? (
        <View style={styles.walletLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.walletLoadingText}>
            Sincronizando saldo y movimientos...
          </Text>
        </View>
      ) : walletError ? (
        <View style={styles.walletErrorContainer}>
          <AlertCircle size={32} color={COLORS.error} strokeWidth={2} />
          <Text style={styles.walletErrorTitle}>
            No se pudo cargar el monedero
          </Text>
          <Text style={styles.walletErrorText}>{walletError}</Text>
          <TouchableOpacity
            style={styles.walletRetryBtn}
            onPress={onRetryWallet}
            activeOpacity={0.85}
          >
            <RefreshCw size={16} color={COLORS.white} strokeWidth={2.4} />
            <Text style={styles.walletRetryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Tarjeta Principal de Saldo (Dashboard Fintech) */}
          <View style={styles.walletMainHeroCard}>
            <GradientBackground
              colors={COLORS.gradient.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              borderRadius={RADIUS.xl}
            />
            <View style={styles.walletMainHeroInner}>
              <View style={styles.walletMainHeroHeader}>
                <View style={styles.walletHeroPill}>
                  <Wallet size={13} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={styles.walletHeroPillText}>Saldo Total</Text>
                </View>
                <View style={styles.walletLiveBadge}>
                  <CheckCircle2 size={12} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={styles.walletLiveBadgeText}>Disponible</Text>
                </View>
              </View>

              <Text style={styles.walletMainAmount}>
                {formatEuros(disponibleTotal)} €
              </Text>

              {/* Desglose de saldo */}
              <View style={styles.walletBreakdownGrid}>
                <View style={styles.walletBreakdownCard}>
                  <Text style={styles.walletBreakdownCardLabel}>
                    Por trayectos
                  </Text>
                  <Text style={styles.walletBreakdownCardValue}>
                    {formatEuros(walletEuros)} €
                  </Text>
                </View>

                {caeDisponible > 0 && (
                  <View style={styles.walletBreakdownCard}>
                    <Text style={styles.walletBreakdownCardLabel}>Bono CAE</Text>
                    <Text style={styles.walletBreakdownCardValue}>
                      {formatEuros(caeDisponible)} €
                    </Text>
                  </View>
                )}

                {revisionTotal > 0 && (
                  <View style={styles.walletBreakdownCard}>
                    <View style={styles.revisionDotLabelRow}>
                      <Clock
                        size={11}
                        color="rgba(255,255,255,0.9)"
                        strokeWidth={2.5}
                      />
                      <Text style={styles.walletBreakdownCardLabel}>
                        En revisión
                      </Text>
                    </View>
                    <Text style={styles.walletBreakdownCardValue}>
                      {formatEuros(revisionTotal)} €
                    </Text>
                  </View>
                )}
              </View>

              {/* Botón de Retirada Rápida */}
              <View style={styles.walletHeroActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.walletMainWithdrawBtn,
                    disponibleTotal <= 0 &&
                      styles.walletMainWithdrawBtnDisabled,
                  ]}
                  onPress={onShowPayoutModal}
                  disabled={disponibleTotal <= 0}
                  activeOpacity={0.88}
                >
                  <ArrowUpFromLine
                    size={16}
                    color={COLORS.primaryDark}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.walletMainWithdrawBtnText}>
                    Retirar a mi banco
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Estado de Verificación con Stripe */}
          {stripeConnectStatus?.detailsSubmitted ? (
            <View style={styles.stripeVerifiedCard}>
              <View style={styles.stripeVerifiedLeft}>
                <ShieldCheck
                  size={20}
                  color={COLORS.success}
                  strokeWidth={2.4}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stripeVerifiedTitle}>
                    Cuenta bancaria verificada con Stripe
                  </Text>
                  <Text style={styles.stripeVerifiedSubtitle}>
                    Las transferencias se procesan automáticamente sin comisiones.
                  </Text>
                </View>
              </View>
              {onViewStripeAccount && (
                <TouchableOpacity
                  style={styles.stripeViewLink}
                  onPress={onViewStripeAccount}
                  activeOpacity={0.7}
                >
                  <ExternalLink
                    size={14}
                    color={COLORS.gray600}
                    strokeWidth={2.2}
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.stripePendingCard}
              onPress={onSetupStripeConnect}
              disabled={stripeOnboardingLoading}
              activeOpacity={0.88}
            >
              <View style={styles.stripePendingIconBox}>
                {stripeOnboardingLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primaryDark} />
                ) : (
                  <CreditCard
                    size={20}
                    color={COLORS.primaryDark}
                    strokeWidth={2.4}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stripePendingTitle}>
                  {stripeConnectStatus?.hasAccount
                    ? "Completar vinculación de cuenta"
                    : "Vincular cuenta para recibir transferencias"}
                </Text>
                <Text style={styles.stripePendingSubtitle}>
                  Configura tus datos en Stripe para transferir tus ganancias a tu banco.
                </Text>
              </View>
              <ChevronRight
                size={18}
                color={COLORS.primaryDark}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          )}

          {/* Cuentas y Tarjetas Vinculadas */}
          {linkedAccounts.length > 0 && (
            <View style={styles.walletBlockSection}>
              <Text style={styles.walletBlockTitle}>
                Método de cobro vinculado
              </Text>
              {linkedAccounts.map((cuenta, idx) => (
                <View key={idx} style={styles.digitalBankCard}>
                  <View style={styles.digitalBankTop}>
                    <View style={styles.bankChipIcon} />
                    <Text style={styles.digitalBankBrand}>
                      {cuenta.banco || cuenta.marca || "Cuenta bancaria"}
                    </Text>
                  </View>
                  <Text style={styles.digitalBankNumber}>
                    •••• •••• •••• {cuenta.ultimos4 || "0000"}
                  </Text>
                  <View style={styles.digitalBankBottom}>
                    <View style={styles.digitalBankStatusPill}>
                      <CheckCircle2
                        size={12}
                        color={COLORS.success}
                        strokeWidth={2.5}
                      />
                      <Text style={styles.digitalBankStatusText}>
                        Habilitada para cobros
                      </Text>
                    </View>
                    <Text style={styles.digitalBankCurrency}>EUR (€)</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Historial de Movimientos con Segmented Tabs */}
          <View style={styles.walletBlockSection}>
            <View style={styles.movementsHeaderRow}>
              <Text style={styles.walletBlockTitle}>
                Historial de movimientos
              </Text>
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentedMovementsWrapper}>
              <TouchableOpacity
                style={[
                  styles.movementTab,
                  activeTab === TAB_TODOS && styles.movementTabActive,
                ]}
                onPress={() => setActiveTab(TAB_TODOS)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.movementTabText,
                    activeTab === TAB_TODOS && styles.movementTabTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.movementTab,
                  activeTab === TAB_INGRESOS && styles.movementTabActive,
                ]}
                onPress={() => setActiveTab(TAB_INGRESOS)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.movementTabText,
                    activeTab === TAB_INGRESOS && styles.movementTabTextActive,
                  ]}
                >
                  Ingresos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.movementTab,
                  activeTab === TAB_RETIRADAS && styles.movementTabActive,
                ]}
                onPress={() => setActiveTab(TAB_RETIRADAS)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.movementTabText,
                    activeTab === TAB_RETIRADAS && styles.movementTabTextActive,
                  ]}
                >
                  Retiradas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lista de movimientos */}
            <View style={styles.movementsListCard}>
              {filteredMovements.length === 0 ? (
                <View style={styles.emptyMovementsBox}>
                  <Clock size={28} color={COLORS.gray400} strokeWidth={1.8} />
                  <Text style={styles.emptyMovementsTitle}>
                    Sin movimientos registrados
                  </Text>
                  <Text style={styles.emptyMovementsSubtitle}>
                    {activeTab === TAB_INGRESOS
                      ? "Aún no has recibido ingresos por viajes compartidos."
                      : activeTab === TAB_RETIRADAS
                        ? "No has realizado transferencias a tu banco todavía."
                        : "Tus transacciones y cobros aparecerán listados aquí."}
                  </Text>
                </View>
              ) : (
                filteredMovements.slice(0, 15).map((item, index) => {
                  const isIncome = item.type === "income";
                  const isLast =
                    index === Math.min(filteredMovements.length, 15) - 1;
                  return (
                    <AnimatedCardEntrance key={item.id} index={index}>
                      <View
                        style={[
                          styles.movementRow,
                          isLast && styles.movementRowLast,
                        ]}
                      >
                        <View
                          style={[
                            styles.movementIconBox,
                            isIncome
                              ? styles.movementIconIncome
                              : styles.movementIconPayout,
                          ]}
                        >
                          {isIncome ? (
                            <ArrowDownToLine
                              size={16}
                              color={COLORS.primaryDark}
                              strokeWidth={2.4}
                            />
                          ) : (
                            <ArrowUpFromLine
                              size={16}
                              color={COLORS.gray700}
                              strokeWidth={2.4}
                            />
                          )}
                        </View>

                        <View style={styles.movementTextCol}>
                          <Text style={styles.movementTitle} numberOfLines={1}>
                            {item.description}
                          </Text>
                          <Text style={styles.movementDate}>
                            {new Date(item.date).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>

                        <View style={styles.movementAmountCol}>
                          <Text
                            style={[
                              styles.movementAmount,
                              isIncome && styles.movementAmountIncome,
                            ]}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCentsToEuros(item.amountCents)} €
                          </Text>
                          {item.status !== "succeeded" && (
                            <Text style={styles.movementStatusText}>
                              {item.status === "pending"
                                ? "En proceso"
                                : item.status}
                            </Text>
                          )}
                        </View>
                      </View>
                    </AnimatedCardEntrance>
                  );
                })
              )}
            </View>
          </View>
        </>
      )}

      <View style={{ height: SPACING.xxl }} />

      {/* Modal Moderno para Retirar Fondos */}
      {showPayoutModal && (
        <Modal
          visible={showPayoutModal}
          transparent
          animationType="fade"
          onRequestClose={onClosePayoutModal}
        >
          <View style={styles.payoutModalOverlay}>
            <TouchableOpacity
              style={styles.payoutModalBackdrop}
              onPress={onClosePayoutModal}
              activeOpacity={1}
            />

            <View style={styles.payoutModalSheet}>
              <View style={styles.payoutModalHeader}>
                <Text style={styles.payoutModalTitle}>
                  Retirar saldo a tu banco
                </Text>
                <TouchableOpacity
                  onPress={onClosePayoutModal}
                  style={styles.payoutModalCloseBtn}
                >
                  <X size={18} color={COLORS.gray700} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <Text style={styles.payoutModalAvailableLabel}>
                Saldo disponible para transferir:{" "}
                <Text
                  style={{ fontWeight: "800", color: COLORS.primaryDark }}
                >
                  {formatEuros(disponibleTotal)} €
                </Text>
              </Text>

              {/* Input grande con formato */}
              <View style={styles.payoutInputWrapperModern}>
                <TextInput
                  style={styles.payoutInputModern}
                  value={payoutAmount}
                  onChangeText={onSetPayoutAmount}
                  placeholder="0,00"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <Text style={styles.payoutInputSuffixModern}>€</Text>
              </View>

              {/* Botones de Porcentaje Rápido */}
              <View style={styles.percentageButtonsRow}>
                <TouchableOpacity
                  style={styles.percentageBtn}
                  onPress={() => handleSetPercentage(0.25)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.percentageBtnText}>25%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.percentageBtn}
                  onPress={() => handleSetPercentage(0.5)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.percentageBtnText}>50%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.percentageBtn, styles.percentageBtnAll]}
                  onPress={() => handleSetPercentage(1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.percentageBtnTextAll}>Todo (100%)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.payoutInfoNotice}>
                <ShieldCheck
                  size={16}
                  color={COLORS.success}
                  strokeWidth={2.4}
                />
                <Text style={styles.payoutInfoNoticeText}>
                  Transferencia segura directa vía Stripe. Sin comisiones de servicio.
                </Text>
              </View>

              {/* Botones de confirmación */}
              <View style={styles.payoutModalActionsModern}>
                <TouchableOpacity
                  style={styles.payoutCancelBtnModern}
                  onPress={onClosePayoutModal}
                  disabled={processingPayout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.payoutCancelBtnTextModern}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.payoutConfirmBtnModern,
                    (!payoutAmount || processingPayout) &&
                      styles.payoutConfirmBtnDisabled,
                  ]}
                  onPress={onWithdraw}
                  disabled={!payoutAmount || processingPayout}
                  activeOpacity={0.88}
                >
                  {processingPayout ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.payoutConfirmBtnTextModern}>
                      Confirmar transferencia
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionContent: {
    flex: 1,
  },
  sectionScroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  walletLoadingContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  walletLoadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  walletErrorContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  walletErrorTitle: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  walletErrorText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  walletRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  walletRetryBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.white,
  },

  // Tarjeta Principal de Saldo (Dashboard Hero)
  walletMainHeroCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryDark,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  walletMainHeroInner: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  walletMainHeroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletHeroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  walletHeroPillText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.white,
    fontWeight: "700",
  },
  walletLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  walletLiveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  walletMainAmount: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -0.6,
  },
  walletBreakdownGrid: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  walletBreakdownCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    gap: 2,
  },
  walletBreakdownCardLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  walletBreakdownCardValue: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.white,
  },
  revisionDotLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  walletHeroActionsRow: {
    paddingTop: SPACING.xs,
  },
  walletMainWithdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    minHeight: 48,
  },
  walletMainWithdrawBtnDisabled: {
    opacity: 0.6,
  },
  walletMainWithdrawBtnText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  // Verificación Stripe
  stripeVerifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  stripeVerifiedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
    flex: 1,
  },
  stripeVerifiedTitle: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  stripeVerifiedSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    marginTop: 1,
  },
  stripeViewLink: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: SPACING.xs,
  },
  stripePendingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(13, 159, 110, 0.25)",
  },
  stripePendingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stripePendingTitle: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  stripePendingSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray700,
    marginTop: 1,
  },

  // Tarjeta de Banco Digital
  digitalBankCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  digitalBankTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bankChipIcon: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: "#F59E0B",
    opacity: 0.85,
  },
  digitalBankBrand: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  digitalBankNumber: {
    fontSize: FONTS.lg,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 2,
  },
  digitalBankBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  digitalBankStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  digitalBankStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  digitalBankCurrency: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },

  // Bloques y Secciones del Monedero
  walletBlockSection: {
    marginBottom: SPACING.lg,
  },
  walletBlockTitle: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.gray900,
    marginBottom: SPACING.sm,
  },
  movementsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  segmentedMovementsWrapper: {
    flexDirection: "row",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.sm + 2,
  },
  movementTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  movementTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  movementTabText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  movementTabTextActive: {
    color: COLORS.gray900,
    fontWeight: "800",
  },
  movementsListCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.card,
  },
  emptyMovementsBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyMovementsTitle: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.gray800,
    marginTop: 4,
  },
  emptyMovementsSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    textAlign: "center",
    maxWidth: 260,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.md,
  },
  movementRowLast: {
    borderBottomWidth: 0,
  },
  movementIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  movementIconIncome: {
    backgroundColor: COLORS.primarySoft,
  },
  movementIconPayout: {
    backgroundColor: COLORS.gray100,
  },
  movementTextCol: {
    flex: 1,
    gap: 2,
  },
  movementTitle: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  movementDate: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  movementAmountCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  movementAmount: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  movementAmountIncome: {
    color: COLORS.primaryDark,
  },
  movementStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.warning,
  },

  // Modal de Retirada Moderno
  payoutModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  payoutModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  payoutModalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? SPACING.xxl : SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.large,
  },
  payoutModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  payoutModalTitle: {
    fontSize: FONTS.lg,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.3,
  },
  payoutModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  payoutModalAvailableLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
  },
  payoutInputWrapperModern: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    minHeight: 64,
  },
  payoutInputModern: {
    flex: 1,
    fontSize: FONTS.xxxl,
    fontWeight: "800",
    color: COLORS.gray900,
    padding: 0,
  },
  payoutInputSuffixModern: {
    fontSize: FONTS.xxl,
    fontWeight: "800",
    color: COLORS.gray400,
    marginLeft: SPACING.xs,
  },
  percentageButtonsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  percentageBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
  },
  percentageBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  percentageBtnAll: {
    backgroundColor: COLORS.primarySoft,
  },
  percentageBtnTextAll: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  payoutInfoNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  payoutInfoNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.gray600,
    flex: 1,
  },
  payoutModalActionsModern: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  payoutCancelBtnModern: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    minHeight: 50,
  },
  payoutCancelBtnTextModern: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  payoutConfirmBtnModern: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minHeight: 50,
    ...SHADOWS.small,
  },
  payoutConfirmBtnDisabled: {
    backgroundColor: COLORS.gray300,
  },
  payoutConfirmBtnTextModern: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.white,
  },
});

export default MonederoSection;
