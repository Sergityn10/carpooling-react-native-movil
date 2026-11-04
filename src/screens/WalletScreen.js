// YouConnext - WalletScreen (Mi Monedero y Movimientos en Tiempo Real)
// Cumplimiento estricto de la especificación técnica de seguridad financiera, SSE e idempotencia

import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Wallet,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Radio,
  X,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Coins,
  ExternalLink,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, BRAND } from "../constants";
import GradientBackground from "../components/common/GradientBackground";
import PulseDot from "../components/common/PulseDot";
import MovementCard from "../components/payments/MovementCard";
import { useMovements } from "../hooks/useMovements";
import paymentService from "../services/paymentService";
import { generateUUID } from "../utils/uuid";

const ROLE_TABS = [
  { key: "all", label: "Todos" },
  { key: "driver", label: "Conductor" },
  { key: "passenger", label: "Pasajero" },
];

const WalletScreen = ({ navigation, route, onBack }) => {
  const initialRole = route?.params?.initialRole || "all";
  const {
    movements,
    balance,
    loading,
    refreshing,
    isLoadingMore,
    hasMore,
    roleFilter,
    setRoleFilter,
    refresh,
    loadMore,
    error,
    isStreamConnected,
  } = useMovements(initialRole);

  // Estados del modal de retiro
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [isLinkingStripe, setIsLinkingStripe] = useState(false);
  const idempotencyKeyRef = useRef("");

  // Desglose de importes Stripe Connect (Disponible vs Pendiente)
  const availableEurNum =
    parseFloat(balance.available_eur || balance.balance_eur) || 0;
  const pendingEurNum = parseFloat(balance.pending_eur || "0.00") || 0;
  const totalEurNum =
    parseFloat(balance.total_eur) || availableEurNum + pendingEurNum;

  const availableEurFormatted = (
    balance.available_eur ||
    balance.balance_eur ||
    "0.00"
  ).replace(".", ",");
  const pendingEurFormatted = (balance.pending_eur || "0.00").replace(".", ",");
  const totalEurFormatted = totalEurNum.toFixed(2).replace(".", ",");

  // Apertura del modal con generación de clave de idempotencia única
  const handleOpenPayoutModal = () => {
    idempotencyKeyRef.current = generateUUID();
    setPayoutAmount("");
    setShowPayoutModal(true);
  };

  const handleClosePayoutModal = () => {
    if (isSubmittingPayout) return;
    setShowPayoutModal(false);
    setPayoutAmount("");
  };

  // Botones de porcentaje rápido sobre saldo disponible
  const handleSetPercentage = (percent) => {
    const calculated = (availableEurNum * percent).toFixed(2);
    setPayoutAmount(calculated.replace(".", ","));
  };

  // Vinculación rápida con Stripe Connect para cuentas pendientes
  const handleSetupStripe = async () => {
    setIsLinkingStripe(true);
    try {
      const res = await paymentService.getStripeConnectLink();
      if (res?.accountLink?.url) {
        await Linking.openURL(res.accountLink.url);
      } else {
        Alert.alert(
          "Aviso",
          "No se pudo generar el enlace de vinculación con Stripe. Inténtalo más tarde.",
        );
      }
    } catch (e) {
      Alert.alert(
        "Error",
        e?.message || "No se pudo conectar con Stripe Connect.",
      );
    } finally {
      setIsLinkingStripe(false);
    }
  };

  // Confirmación de retiro con protección contra doble clic
  const handleConfirmPayout = async () => {
    if (isSubmittingPayout) return;

    const normalizedAmount = parseFloat(payoutAmount.replace(",", "."));
    if (isNaN(normalizedAmount) || normalizedAmount <= 0) {
      Alert.alert("Importe inválido", "Por favor introduce un importe mayor a 0,00 €");
      return;
    }

    if (normalizedAmount > availableEurNum) {
      Alert.alert(
        "Saldo insuficiente",
        `El importe solicitado supera tu saldo disponible (${availableEurFormatted} €). Los fondos pendientes aún no están liberados.`,
      );
      return;
    }

    const amountCents = Math.round(normalizedAmount * 100);

    // Candado inmediato contra peticiones duplicadas
    setIsSubmittingPayout(true);

    try {
      await paymentService.createWalletPayout({
        amount: amountCents,
        currency: "eur",
        method: "standard",
        idempotency_key: idempotencyKeyRef.current,
      });

      setShowPayoutModal(false);
      setPayoutAmount("");

      Alert.alert(
        "Transferencia iniciada",
        "Tu solicitud de retiro ha sido procesada correctamente mediante Stripe.",
        [{ text: "Aceptar", onPress: () => refresh() }],
      );
    } catch (err) {
      const errMsg = err?.message || "";
      const status = err?.status;

      if (status === 400 || errMsg.includes("INSUFFICIENT_BALANCE")) {
        Alert.alert(
          "Saldo insuficiente",
          "El importe solicitado supera tu saldo disponible.",
        );
      } else if (status === 404 || errMsg.includes("STRIPE_ACCOUNT_NOT_FOUND")) {
        Alert.alert(
          "Cuenta no vinculada",
          "No tienes una cuenta de Stripe Connect vinculada para recibir transferencias.",
        );
      } else if (status === 403 || errMsg.includes("WALLET_BLOCKED")) {
        Alert.alert(
          "Monedero bloqueado",
          "Tu monedero se encuentra temporalmente bloqueado por motivos de seguridad.",
        );
      } else {
        Alert.alert(
          "Error en la transferencia",
          errMsg || "No se pudo tramitar la solicitud de retiro. Inténtalo de nuevo.",
        );
      }
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate("Main");
    }
  };

  const handleEndReached = () => {
    if (
      movements.length > 0 &&
      hasMore &&
      !loading &&
      !isLoadingMore &&
      !refreshing
    ) {
      loadMore();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header superior con botón Volver */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.black} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Monedero</Text>
        <TouchableOpacity
          onPress={refresh}
          style={styles.refreshButton}
          activeOpacity={0.7}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            color={refreshing ? COLORS.primary : COLORS.gray700}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      {/* Contenido principal con FlatList Virtualizada */}
      <FlatList
        data={movements}
        keyExtractor={(item) => String(item.id || item._id)}
        renderItem={({ item, index }) => (
          <MovementCard movement={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        onEndReachedThreshold={0.2}
        onEndReached={handleEndReached}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            {/* Tarjeta Hero de Saldo (Fintech Dashboard: Disponible vs Pendiente) */}
            <View style={styles.heroCard}>
              <GradientBackground
                colors={COLORS.gradient.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                borderRadius={RADIUS.xl}
              />
              <View style={styles.heroInner}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroPill}>
                    <ShieldCheck
                      size={13}
                      color={BRAND.green}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.heroPillText}>Stripe Connect</Text>
                  </View>

                  {/* Badge de conexión SSE en vivo */}
                  <View style={styles.liveStreamBadge}>
                    <PulseDot
                      size={7}
                      color={isStreamConnected ? BRAND.green : COLORS.gray400}
                    />
                    <Text
                      style={[
                        styles.liveStreamText,
                        {
                          color: isStreamConnected
                            ? COLORS.white
                            : "rgba(255,255,255,0.7)",
                        },
                      ]}
                    >
                      {isStreamConnected ? "En vivo (T+0)" : "Sincronizando"}
                    </Text>
                  </View>
                </View>

                {/* Sección 1: Dinero Disponible (Foco Principal de Retiro) */}
                <View style={styles.availableSection}>
                  <View style={styles.availableBadgeRow}>
                    <View style={styles.availableBadge}>
                      <CheckCircle2
                        size={12}
                        color={BRAND.green}
                        strokeWidth={2.6}
                      />
                      <Text style={styles.availableBadgeText}>
                        DINERO DISPONIBLE
                      </Text>
                    </View>
                  </View>

                  {/* Cifra destacada de disponible */}
                  <Text style={styles.heroAmountText}>
                    {availableEurFormatted} €
                  </Text>

                  <Text style={styles.availableHintText}>
                    Fondos liberados listos para transferir a tu cuenta bancaria
                  </Text>
                </View>

                {/* Sección 2: Dinero Pendiente (En proceso de liquidación) */}
                <View style={styles.pendingCardBox}>
                  <View style={styles.pendingHeaderRow}>
                    <View style={styles.pendingBadge}>
                      <Clock
                        size={12}
                        color={COLORS.warning}
                        strokeWidth={2.6}
                      />
                      <Text style={styles.pendingBadgeText}>
                        DINERO PENDIENTE
                      </Text>
                    </View>
                    <Text style={styles.pendingAmountText}>
                      {pendingEurFormatted} €
                    </Text>
                  </View>
                  <Text style={styles.pendingNoticeText}>
                    En proceso de liquidación por pasarelas o reservas en curso.
                  </Text>
                </View>

                {/* Resumen Total si existen fondos pendientes */}
                {pendingEurNum > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabelText}>
                      Total en balance:
                    </Text>
                    <Text style={styles.totalValueText}>
                      {totalEurFormatted} €
                    </Text>
                  </View>
                )}

                {/* Botón de Retiro (Habilitado solo si hay dinero disponible) */}
                <TouchableOpacity
                  style={[
                    styles.withdrawButton,
                    availableEurNum <= 0 && styles.withdrawButtonDisabled,
                  ]}
                  onPress={handleOpenPayoutModal}
                  disabled={availableEurNum <= 0}
                  activeOpacity={0.88}
                >
                  <ArrowUpFromLine
                    size={16}
                    color={COLORS.primaryDark}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.withdrawButtonText}>
                    Retirar saldo disponible
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Aviso para completar onboarding si no tiene cuenta Stripe vinculada */}
            {balance.has_stripe_account === false && (
              <View style={styles.stripeOnboardingCard}>
                <View style={styles.stripeOnboardingHeader}>
                  <AlertCircle
                    size={20}
                    color={COLORS.warning}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.stripeOnboardingTitle}>
                    Cuenta Stripe Connect requerida
                  </Text>
                </View>
                <Text style={styles.stripeOnboardingDesc}>
                  Para recibir los pagos de los pasajeros y transferir tus ganancias a tu banco, vincula tu cuenta de Stripe Connect.
                </Text>
                <TouchableOpacity
                  style={styles.stripeOnboardingBtn}
                  onPress={handleSetupStripe}
                  disabled={isLinkingStripe}
                  activeOpacity={0.85}
                >
                  {isLinkingStripe ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <ExternalLink
                        size={15}
                        color={COLORS.white}
                        strokeWidth={2.4}
                      />
                      <Text style={styles.stripeOnboardingBtnText}>
                        Vincular cuenta con Stripe
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Pestañas de Filtro por Rol (Segmented Control) */}
            <View style={styles.segmentedTabsContainer}>
              {ROLE_TABS.map((tab) => {
                const isActive = roleFilter === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.segmentedTab,
                      isActive && styles.segmentedTabActive,
                    ]}
                    onPress={() => setRoleFilter(tab.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentedTabText,
                        isActive && styles.segmentedTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Historial de Movimientos</Text>
              {movements.length > 0 && (
                <Text style={styles.sectionCountText}>
                  {movements.length} registradas
                </Text>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando movimientos...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyBox}>
              <AlertCircle size={32} color={COLORS.error} strokeWidth={2} />
              <Text style={styles.emptyTitle}>Error al sincronizar</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={refresh}
                activeOpacity={0.85}
              >
                <RefreshCw size={14} color={COLORS.white} strokeWidth={2.4} />
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Clock size={36} color={COLORS.gray400} strokeWidth={1.8} />
              <Text style={styles.emptyTitle}>Sin movimientos</Text>
              <Text style={styles.emptySubtitle}>
                {roleFilter === "driver"
                  ? "Aún no has registrado ingresos por trayectos como conductor."
                  : roleFilter === "passenger"
                    ? "No has realizado pagos por reservas de viajes todavía."
                    : "Tus transacciones, cobros y retiros aparecerán aquí."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <View style={{ height: SPACING.xxl }} />
          )
        }
      />

      {/* Modal de Retiro Seguro (Payout) */}
      {showPayoutModal && (
        <Modal
          visible={showPayoutModal}
          transparent
          animationType="fade"
          onRequestClose={handleClosePayoutModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={handleClosePayoutModal}
              activeOpacity={1}
            />

            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Retirar saldo a tu banco</Text>
                <TouchableOpacity
                  onPress={handleClosePayoutModal}
                  style={styles.modalCloseBtn}
                  disabled={isSubmittingPayout}
                >
                  <X size={18} color={COLORS.gray700} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <Text style={styles.availableLabel}>
                Saldo disponible para transferir:{" "}
                <Text style={styles.availableAmount}>
                  {availableEurFormatted} €
                </Text>
              </Text>

              {pendingEurNum > 0 && (
                <View style={styles.pendingModalHint}>
                  <Clock size={12} color={COLORS.accentDark} strokeWidth={2.4} />
                  <Text style={styles.pendingModalHintText}>
                    Tienes {pendingEurFormatted} € en proceso que estarán disponibles en cuanto se liquiden.
                  </Text>
                </View>
              )}

              {/* Input grande de importe */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.amountInput}
                  value={payoutAmount}
                  onChangeText={setPayoutAmount}
                  placeholder="0,00"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="decimal-pad"
                  autoFocus
                  editable={!isSubmittingPayout}
                />
                <Text style={styles.inputSuffix}>€</Text>
              </View>

              {/* Botones de Porcentaje Rápido */}
              <View style={styles.percentageRow}>
                <TouchableOpacity
                  style={styles.percentageBtn}
                  onPress={() => handleSetPercentage(0.25)}
                  disabled={isSubmittingPayout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.percentageBtnText}>25%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.percentageBtn}
                  onPress={() => handleSetPercentage(0.5)}
                  disabled={isSubmittingPayout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.percentageBtnText}>50%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.percentageBtn, styles.percentageBtnAll]}
                  onPress={() => handleSetPercentage(1)}
                  disabled={isSubmittingPayout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.percentageBtnTextAll}>Todo (100%)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.securityNotice}>
                <ShieldCheck
                  size={16}
                  color={COLORS.primaryDark}
                  strokeWidth={2.4}
                />
                <Text style={styles.securityNoticeText}>
                  Operación protegida con clave de idempotencia bancaria única.
                </Text>
              </View>

              {/* Botones de acción */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleClosePayoutModal}
                  disabled={isSubmittingPayout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    (!payoutAmount || isSubmittingPayout) &&
                      styles.confirmBtnDisabled,
                  ]}
                  onPress={handleConfirmPayout}
                  disabled={!payoutAmount || isSubmittingPayout}
                  activeOpacity={0.88}
                >
                  {isSubmittingPayout ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      Confirmar transferencia
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.black,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  listHeaderContainer: {
    marginBottom: SPACING.sm,
  },
  heroCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryDark,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  heroInner: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    fontWeight: "700",
  },
  liveStreamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  liveStreamText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroAmountText: {
    fontSize: 38,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -0.6,
  },
  availableSection: {
    marginTop: 2,
    gap: 4,
  },
  availableBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 200, 83, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  availableBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND.green,
    letterSpacing: 0.5,
  },
  availableHintText: {
    fontSize: FONTS.xs,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  pendingCardBox: {
    backgroundColor: "rgba(242, 163, 60, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(242, 163, 60, 0.35)",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 6,
  },
  pendingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(242, 163, 60, 0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.warning,
    letterSpacing: 0.5,
  },
  pendingAmountText: {
    fontSize: FONTS.md + 2,
    fontWeight: "800",
    color: COLORS.warning,
    letterSpacing: -0.3,
  },
  pendingNoticeText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.82)",
    fontWeight: "500",
    lineHeight: 15,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
  },
  totalLabelText: {
    fontSize: FONTS.xs,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  totalValueText: {
    fontSize: FONTS.sm + 1,
    fontWeight: "800",
    color: COLORS.white,
  },
  stripeOnboardingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: "rgba(242, 163, 60, 0.4)",
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  stripeOnboardingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  stripeOnboardingTitle: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.black,
  },
  stripeOnboardingDesc: {
    fontSize: FONTS.xs + 1,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  stripeOnboardingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    marginTop: SPACING.xs,
  },
  stripeOnboardingBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.white,
  },
  pendingModalHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    marginTop: 2,
  },
  pendingModalHintText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.accentDark,
    fontWeight: "600",
    lineHeight: 15,
  },
  heroSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroSubtitleText: {
    fontSize: FONTS.xs,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    minHeight: 48,
    marginTop: SPACING.xs,
  },
  withdrawButtonDisabled: {
    opacity: 0.5,
  },
  withdrawButtonText: {
    fontSize: FONTS.sm + 1,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  segmentedTabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.gray200,
    padding: 3,
    borderRadius: RADIUS.control,
    marginBottom: SPACING.md,
  },
  segmentedTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: RADIUS.control - 2,
  },
  segmentedTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.xs,
  },
  segmentedTabText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  segmentedTabTextActive: {
    color: COLORS.black,
    fontWeight: "800",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.black,
  },
  sectionCountText: {
    fontSize: FONTS.xs,
    color: COLORS.gray600,
    fontWeight: "600",
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    fontWeight: "600",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.black,
  },
  emptySubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray600,
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  retryBtnText: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    fontWeight: "800",
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
    gap: SPACING.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.black,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  availableLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray600,
  },
  availableAmount: {
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.control,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.gray50,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.black,
    textAlign: "center",
    minWidth: 120,
  },
  inputSuffix: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gray600,
    marginLeft: 6,
  },
  percentageRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  percentageBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.control,
    backgroundColor: COLORS.gray100,
  },
  percentageBtnAll: {
    backgroundColor: COLORS.primarySoft,
  },
  percentageBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  percentageBtnTextAll: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.control,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primaryDark,
    lineHeight: 15,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    borderRadius: RADIUS.control,
    backgroundColor: COLORS.gray100,
  },
  cancelBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  confirmBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    borderRadius: RADIUS.control,
    backgroundColor: COLORS.primary,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.white,
  },
});

export default WalletScreen;
