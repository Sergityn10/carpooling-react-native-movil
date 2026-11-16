// YouConnext - AlertaCard Component (Tarjeta individual de alerta DESTINO / EVENTO)
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import {
  MapPin,
  Calendar,
  Trash2,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { BRAND, COLORS, FONTS, RADIUS, SHADOWS, SPACING } from "../../constants";
import { TIPO_ALERTA } from "../../utils/alertaUtils";
import Skeleton from "../common/Skeleton";

function formatShortDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

const AlertaCard = ({
  alerta,
  eventInfo = null,
  resolvingEvent = false,
  toggling = false,
  deleting = false,
  onToggle,
  onDelete,
  onPress,
}) => {
  const isEvento = alerta?.tipo === TIPO_ALERTA.EVENTO;
  const isActive = Boolean(alerta?.activa);
  const createdLabel = formatShortDate(alerta?.createdAt);
  const eventDateLabel = formatShortDate(eventInfo?.start_date);

  const primaryTitle = isEvento
    ? eventInfo?.name || "Evento de interés"
    : alerta?.destino || "Destino sin especificar";

  const secondaryLine = isEvento
    ? [
        eventDateLabel ? `Evento: ${eventDateLabel}` : null,
        eventInfo?.city || null,
        createdLabel ? `Creada el ${createdLabel}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : [
        "Aviso ante nuevos trayectos hacia este destino",
        createdLabel ? `Creada el ${createdLabel}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.cardPaused]}
      activeOpacity={onPress ? 0.88 : 1}
      onPress={() => onPress?.(alerta, eventInfo)}
      disabled={!onPress || deleting}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.typeBadge,
            isEvento ? styles.typeBadgeEvento : styles.typeBadgeDestino,
          ]}
        >
          {isEvento ? (
            <Calendar size={12} color={COLORS.accentDark} strokeWidth={2.4} />
          ) : (
            <MapPin size={12} color={COLORS.primaryDark} strokeWidth={2.4} />
          )}
          <Text
            style={[
              styles.typeBadgeText,
              isEvento
                ? styles.typeBadgeTextEvento
                : styles.typeBadgeTextDestino,
            ]}
          >
            {isEvento ? "Evento" : "Destino"}
          </Text>
        </View>

        <View style={styles.statusAndActions}>
          <View
            style={[
              styles.statusPill,
              isActive ? styles.statusPillActive : styles.statusPillPaused,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? BRAND.green : COLORS.gray400 },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isActive ? styles.statusTextActive : styles.statusTextPaused,
              ]}
            >
              {isActive ? "Activa" : "Pausada"}
            </Text>
          </View>

          <Switch
            value={isActive}
            onValueChange={(next) => onToggle?.(alerta, next)}
            disabled={toggling || deleting}
            trackColor={{ false: COLORS.gray300, true: COLORS.primarySoft }}
            thumbColor={isActive ? COLORS.primary : COLORS.white}
            ios_backgroundColor={COLORS.gray300}
            accessibilityLabel={
              isActive ? "Pausar alerta" : "Activar alerta"
            }
          />
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View
          style={[
            styles.iconCircle,
            isEvento ? styles.iconCircleEvento : styles.iconCircleDestino,
          ]}
        >
          {isEvento ? (
            <Calendar size={20} color={COLORS.accentDark} strokeWidth={2.2} />
          ) : (
            <MapPin size={20} color={COLORS.primary} strokeWidth={2.2} />
          )}
        </View>

        <View style={styles.contentCol}>
          {isEvento && resolvingEvent && !eventInfo ? (
            <Skeleton width={170} height={18} style={{ marginBottom: 6 }} />
          ) : (
            <Text style={styles.title} numberOfLines={2}>
              {primaryTitle}
            </Text>
          )}

          {secondaryLine ? (
            <View style={styles.metaRow}>
              <Clock size={12} color={COLORS.gray400} strokeWidth={2.2} />
              <Text style={styles.metaText} numberOfLines={2}>
                {secondaryLine}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete?.(alerta)}
          disabled={deleting || toggling}
          hitSlop={6}
          activeOpacity={0.75}
          accessibilityLabel="Eliminar alerta"
        >
          {deleting ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <>
              <Trash2 size={14} color={COLORS.error} strokeWidth={2.2} />
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </>
          )}
        </TouchableOpacity>

        {onPress && (
          <View style={styles.exploreHint}>
            <Text style={styles.exploreHintText}>
              {isEvento ? "Ver evento" : "Buscar viajes"}
            </Text>
            <ChevronRight size={15} color={COLORS.primaryDark} strokeWidth={2.4} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardPaused: {
    backgroundColor: "#FAFDFB",
    borderColor: COLORS.gray200,
    opacity: 0.9,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  typeBadgeDestino: {
    backgroundColor: COLORS.primarySoft,
  },
  typeBadgeEvento: {
    backgroundColor: COLORS.accentSoft,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  typeBadgeTextDestino: {
    color: COLORS.primaryDark,
  },
  typeBadgeTextEvento: {
    color: COLORS.accentDark,
  },
  statusAndActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusPillActive: {
    backgroundColor: COLORS.successSoft,
  },
  statusPillPaused: {
    backgroundColor: COLORS.gray100,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextActive: {
    color: COLORS.primaryDark,
  },
  statusTextPaused: {
    color: COLORS.gray600,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleDestino: {
    backgroundColor: COLORS.primarySoft,
  },
  iconCircleEvento: {
    backgroundColor: COLORS.accentSoft,
  },
  contentCol: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: FONTS.md + 1,
    fontWeight: "700",
    color: BRAND.black,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  metaText: {
    flex: 1,
    fontSize: FONTS.xs + 1,
    color: COLORS.gray600,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: SPACING.sm + 2,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    fontSize: FONTS.xs + 1,
    fontWeight: "700",
    color: COLORS.error,
  },
  exploreHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  exploreHintText: {
    fontSize: FONTS.xs + 1,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
});

export default AlertaCard;
