// YouConnext - EnterpriseEventCard (Tarjeta de Gestión de Evento Corporativo)
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import {
  Calendar,
  MapPin,
  Users,
  Car,
  QrCode,
  Edit3,
  ChevronRight,
  CheckCircle2,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";
import { formatTripDate } from "../../services/dateUtils";

const EnterpriseEventCard = ({
  event,
  onPress,
  onEdit,
  onScanQR,
  onViewDetail,
}) => {
  const rawStatus = (event.status || event.original_status || "").toLowerCase();
  const isUpcoming =
    rawStatus === "upcoming" ||
    rawStatus === "requested" ||
    rawStatus === "approved" ||
    rawStatus === "pending" ||
    !rawStatus;
  const isActive = rawStatus === "active" || rawStatus === "in_progress" || rawStatus === "ongoing";
  const isCompleted =
    rawStatus === "completed" ||
    rawStatus === "finished" ||
    rawStatus === "canceled" ||
    rawStatus === "cancelled" ||
    rawStatus === "rejected";
  const isRequested = rawStatus === "requested" || event.original_status === "requested";

  const statusLabel = isRequested
    ? "Solicitado"
    : isActive
    ? "En curso"
    : isUpcoming
    ? "Próximo"
    : "Finalizado";
  const statusColor = isRequested
    ? "#D97706"
    : isActive
    ? COLORS.primary
    : isUpcoming
    ? "#0284C7"
    : COLORS.gray500;
  const statusBg = isRequested
    ? "#FEF3C7"
    : isActive
    ? "#DCFCE7"
    : isUpcoming
    ? "#E0F2FE"
    : COLORS.gray100;

  const rawDate = event.start_date || event.start_at || event.startDate;
  const dateStr = rawDate ? new Date(rawDate).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) : "Fecha por definir";

  const timeStr = rawDate ? new Date(rawDate).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }) : "";

  // Recuperar el número de inscritos según las propiedades documentadas de la API
  const inscribedCount =
    event.total_participants ??
    event.participants_count ??
    event.inscribed_count ??
    event._count?.participants ??
    event.registered_attendees ??
    0;

  const locationStr =
    event.location ||
    event.address_line1 ||
    (event.city ? `${event.city}${event.country ? `, ${event.country}` : ""}` : null) ||
    "Sede por definir";

  const titleStr = event.name || event.title || "Evento Corporativo";

  const handleCardPress = () => {
    if (onViewDetail) {
      onViewDetail(event);
    } else if (onPress) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.94}
    >
      {/* Cabecera con imagen / banner o placeholder */}
      {event.image ? (
        <Image source={{ uri: event.image }} style={styles.bannerImage} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        {/* Fila superior: Estado y Código Único */}
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {event.unique_code ? (
            <Text style={styles.uniqueCodeText}>Cód: {event.unique_code}</Text>
          ) : null}
        </View>

        {/* Título del evento */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {titleStr}
        </Text>

        {/* Fecha y Lugar */}
        <View style={styles.infoRow}>
          <Calendar size={13} color={COLORS.gray500} strokeWidth={2.2} />
          <Text style={styles.infoText}>
            {dateStr} {timeStr ? `• ${timeStr}` : ""}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={13} color={COLORS.gray500} strokeWidth={2.2} />
          <Text style={styles.infoText} numberOfLines={1}>
            {locationStr}
          </Text>
        </View>

        {/* Indicadores de Aforo, Acreditados y Rutas de Carpooling */}
        <View style={styles.statsRow}>
          <View style={[styles.statPill, styles.statPillGreen]}>
            <Users size={13} color="#0B7A3B" strokeWidth={2.4} />
            <Text style={[styles.statPillText, styles.statPillGreenText]}>
              {inscribedCount} {event.capacity ? `/ ${event.capacity}` : ""} {inscribedCount === 1 ? "inscrito" : "inscritos"}
            </Text>
          </View>

          <View style={[styles.statPill, styles.statPillBlue]}>
            <CheckCircle2 size={13} color="#0284C7" strokeWidth={2.4} />
            <Text style={[styles.statPillText, styles.statPillBlueText]}>
              {event.checked_in_count || 0} acreditados
            </Text>
          </View>

          {(event.carpool_routes_count || 0) > 0 ? (
            <View style={[styles.statPill, styles.statPillAmber]}>
              <Car size={13} color="#D97706" strokeWidth={2.4} />
              <Text style={[styles.statPillText, styles.statPillAmberText]}>
                {event.carpool_routes_count} rutas
              </Text>
            </View>
          ) : null}
        </View>

        {/* Botones de acción rápida */}
        <View style={styles.actionDivider} />

        <View style={styles.actionsRow}>
          {/* Botón Escanear QR */}
          <PressableScale
            style={styles.scanButton}
            onPress={() => onScanQR && onScanQR(event)}
            scaleTo={0.96}
          >
            <QrCode size={15} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.scanButtonText}>Acreditar QR</Text>
          </PressableScale>

          {/* Botón Editar */}
          <PressableScale
            style={styles.editButton}
            onPress={() => onEdit && onEdit(event)}
            scaleTo={0.96}
          >
            <Edit3 size={14} color="#334155" strokeWidth={2.2} />
            <Text style={styles.editButtonText}>Editar</Text>
          </PressableScale>

          {/* Botón Ver Detalle */}
          <PressableScale
            style={styles.detailButton}
            onPress={() => onViewDetail && onViewDetail(event)}
            scaleTo={0.96}
          >
            <Text style={styles.detailButtonText}>Detalles</Text>
            <ChevronRight size={14} color="#334155" strokeWidth={2.2} />
          </PressableScale>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginHorizontal: SPACING.screenMargin,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  bannerImage: {
    width: "100%",
    height: 120,
    backgroundColor: COLORS.gray100,
  },
  body: {
    padding: SPACING.cardPadding,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  uniqueCodeText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: COLORS.gray500,
    fontFamily: "monospace",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.gray600,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    gap: 5,
    borderWidth: 1,
  },
  statPillGreen: {
    backgroundColor: "#EBF7EE",
    borderColor: "#C6ECD2",
  },
  statPillGreenText: {
    color: "#14532D",
  },
  statPillBlue: {
    backgroundColor: "#E0F2FE",
    borderColor: "#BAE6FD",
  },
  statPillBlueText: {
    color: "#0369A1",
  },
  statPillAmber: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  statPillAmberText: {
    color: "#92400E",
  },
  statPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  scanButton: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.control,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  scanButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  editButton: {
    flex: 0.85,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 5,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  detailButton: {
    flex: 0.85,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 4,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
});

export default EnterpriseEventCard;
