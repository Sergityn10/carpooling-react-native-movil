// YouConnext - MovementCard Component (Fintech Real-Time UI)
// Representación visual e intuitiva del movimiento financiero conforme a especificación

import React, { memo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import {
  Car,
  Ticket,
  CreditCard,
  Building,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, BRAND } from "../../constants";
import AnimatedCardEntrance from "../common/AnimatedCardEntrance";

/**
 * Obtiene la configuración visual del tipo de movimiento
 */
const getTypeConfig = (type, isNegative) => {
  switch (type) {
    case "reservation_revenue":
      return {
        icon: Car,
        iconBg: COLORS.primarySoft,
        iconColor: COLORS.primaryDark,
        label: "Ingreso por viaje",
        amountColor: COLORS.primaryDark,
        sign: "+",
      };
    case "reservation_payment":
      return {
        icon: Ticket,
        iconBg: COLORS.gray100,
        iconColor: COLORS.gray700,
        label: "Pago de viaje",
        amountColor: COLORS.black,
        sign: "-",
      };
    case "deposit":
      return {
        icon: CreditCard,
        iconBg: COLORS.primarySoft,
        iconColor: COLORS.primaryDark,
        label: "Recarga de monedero",
        amountColor: COLORS.primaryDark,
        sign: "+",
      };
    case "credit":
      return {
        icon: Building,
        iconBg: "#E0F2FE", // Azul suave bancario
        iconColor: "#0369A1",
        label: "Transferencia a banco",
        amountColor: "#0369A1",
        sign: "-",
      };
    case "refund":
      return {
        icon: RotateCcw,
        iconBg: COLORS.accentSoft,
        iconColor: COLORS.accentDark,
        label: "Reembolso recibido",
        amountColor: COLORS.accentDark,
        sign: "+",
      };
    default:
      return {
        icon: isNegative ? ArrowUpFromLine : ArrowDownToLine,
        iconBg: isNegative ? COLORS.gray100 : COLORS.primarySoft,
        iconColor: isNegative ? COLORS.gray700 : COLORS.primaryDark,
        label: "Movimiento",
        amountColor: isNegative ? COLORS.black : COLORS.primaryDark,
        sign: isNegative ? "-" : "+",
      };
  }
};

/**
 * Obtiene la configuración visual del badge de estado
 */
const getStatusBadge = (status) => {
  const norm = (status || "succeeded").toLowerCase();
  if (norm === "succeeded" || norm === "completado") {
    return {
      text: "Completado",
      color: COLORS.primaryDark,
      bg: COLORS.primarySoft,
      icon: CheckCircle2,
    };
  }
  if (norm === "pending" || norm === "en_custodia" || norm === "in_custody") {
    return {
      text: "En custodia",
      color: COLORS.accentDark,
      bg: COLORS.accentSoft,
      icon: Clock,
    };
  }
  if (norm === "failed" || norm === "fallido") {
    return {
      text: "Fallido",
      color: COLORS.error,
      bg: COLORS.errorSoft,
      icon: AlertCircle,
    };
  }
  return {
    text: status,
    color: COLORS.gray600,
    bg: COLORS.gray100,
    icon: Clock,
  };
};

/**
 * Formatea la fecha ISO en formato legible en español
 */
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const MovementCard = memo(({ movement, index = 0 }) => {
  if (!movement) return null;

  const amounts = movement.amounts || {};
  const isNegative =
    amounts.is_negative ??
    (amounts.raw_cents !== undefined
      ? amounts.raw_cents < 0
      : movement.type === "reservation_payment" || movement.type === "credit");

  const typeConfig = getTypeConfig(movement.type, isNegative);
  const statusBadge = getStatusBadge(movement.status);
  const StatusIcon = statusBadge.icon;
  const TypeIcon = typeConfig.icon;

  // Formato seguro del importe
  let formattedAmount = "";
  if (amounts.formatted_eur) {
    const cleanEur = String(amounts.formatted_eur).replace("-", "");
    formattedAmount = `${cleanEur.replace(".", ",")} €`;
  } else if (amounts.absolute_cents !== undefined) {
    formattedAmount = `${(amounts.absolute_cents / 100).toFixed(2).replace(".", ",")} €`;
  } else if (amounts.raw_cents !== undefined) {
    formattedAmount = `${(Math.abs(amounts.raw_cents) / 100).toFixed(2).replace(".", ",")} €`;
  } else if (movement.amount !== undefined) {
    formattedAmount = `${(Math.abs(movement.amount) / 100).toFixed(2).replace(".", ",")} €`;
  } else {
    formattedAmount = "0,00 €";
  }

  const counterpart = movement.counterpart;
  const paymentMethod = movement.payment_method;
  const counterpartName = counterpart
    ? `${counterpart.name || ""} ${counterpart.surname_initial || ""}`.trim()
    : null;
  const counterpartInitial = counterpart?.name
    ? counterpart.name.charAt(0).toUpperCase()
    : null;

  return (
    <AnimatedCardEntrance index={index}>
      <View style={styles.cardContainer}>
        {/* Fila superior: Icono de tipo, títulos y montos */}
        <View style={styles.topRow}>
          <View style={[styles.typeIconBox, { backgroundColor: typeConfig.iconBg }]}>
            <TypeIcon size={18} color={typeConfig.iconColor} strokeWidth={2.4} />
          </View>

          <View style={styles.titleCol}>
            <Text style={styles.descriptionText} numberOfLines={1}>
              {movement.description || typeConfig.label}
            </Text>
            <Text style={styles.dateText}>{formatDate(movement.created_at)}</Text>
          </View>

          <View style={styles.amountCol}>
            <Text
              style={[
                styles.amountText,
                { color: isNegative ? COLORS.black : COLORS.primaryDark },
              ]}
            >
              {typeConfig.sign} {formattedAmount}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <StatusIcon size={10} color={statusBadge.color} strokeWidth={2.5} />
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Fila inferior de contexto seguro: Contraparte y Tarjeta */}
        {(counterpart || paymentMethod) && (
          <View style={styles.footerRow}>
            {counterpart && (
              <View style={styles.counterpartChip}>
                {counterpart.img_perfil ? (
                  <Image
                    source={{ uri: counterpart.img_perfil }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {counterpartInitial || "U"}
                    </Text>
                  </View>
                )}
                <Text style={styles.counterpartName} numberOfLines={1}>
                  {counterpartName || "Usuario YouConnext"}
                </Text>
              </View>
            )}

            {paymentMethod && (
              <View style={styles.paymentMethodChip}>
                <CreditCard size={11} color={COLORS.gray600} strokeWidth={2} />
                <Text style={styles.paymentMethodText}>
                  {(paymentMethod.brand || "Tarjeta").toUpperCase()} ••••{" "}
                  {paymentMethod.last4 || "0000"}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </AnimatedCardEntrance>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.control,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  titleCol: {
    flex: 1,
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  descriptionText: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 2,
  },
  dateText: {
    fontSize: FONTS.xs,
    color: COLORS.gray600,
    fontWeight: "500",
  },
  amountCol: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amountText: {
    fontSize: FONTS.md + 1,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    gap: SPACING.sm,
  },
  counterpartChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  avatarImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  avatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  counterpartName: {
    fontSize: FONTS.xs,
    color: COLORS.gray700,
    fontWeight: "600",
  },
  paymentMethodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  paymentMethodText: {
    fontSize: 11,
    color: COLORS.gray700,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default MovementCard;
