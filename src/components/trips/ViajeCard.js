// YouConnext - ViajeCard Component
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Clock, CheckCircle2, XCircle, Play, Users } from "lucide-react-native";
import {
  COLORS,
  SPACING,
  RADIUS,
  FONTS,
  SHADOWS,
  VIAJE_ESTADO,
} from "../../constants";
import { formatTripDate, formatTripTime } from "../../services/dateUtils";

const ViajeCard = ({ viaje, onPress, onUnirse, esConductor }) => {
  const estado = viaje.status || viaje.estado;

  const getEstadoStyle = () => {
    switch (estado) {
      case VIAJE_ESTADO.PENDIENTE:
        return { bg: COLORS.warningSoft, fg: COLORS.warning };
      case VIAJE_ESTADO.ACTIVO:
        return { bg: COLORS.successSoft, fg: COLORS.success };
      case VIAJE_ESTADO.COMPLETADO:
        return { bg: COLORS.gray100, fg: COLORS.gray500 };
      case VIAJE_ESTADO.CANCELADO:
        return { bg: COLORS.errorSoft, fg: COLORS.error };
      default:
        return null;
    }
  };

  const getEstadoIcon = (color) => {
    switch (estado) {
      case VIAJE_ESTADO.PENDIENTE:
        return <Clock size={10} color={color} strokeWidth={2.5} />;
      case VIAJE_ESTADO.ACTIVO:
        return <Play size={10} color={color} strokeWidth={2.5} />;
      case VIAJE_ESTADO.COMPLETADO:
        return <CheckCircle2 size={10} color={color} strokeWidth={2.5} />;
      case VIAJE_ESTADO.CANCELADO:
        return <XCircle size={10} color={color} strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  const getEstadoTexto = () => {
    switch (estado) {
      case VIAJE_ESTADO.PENDIENTE:
        return "Pendiente";
      case VIAJE_ESTADO.ACTIVO:
        return "En curso";
      case VIAJE_ESTADO.COMPLETADO:
        return "Completado";
      case VIAJE_ESTADO.CANCELADO:
        return "Cancelado";
      default:
        return estado;
    }
  };

  const formatTime = (viaje) => formatTripTime(viaje);

  const formatDate = (viaje) => formatTripDate(viaje);

  const conductorNombre =
    typeof viaje.conductor === "string"
      ? viaje.conductor
      : `Conductor #${viaje.conductor || "?"}`;

  const plazasLibres = viaje.disponible;
  const plazasTotal = viaje.plazas;
  const precio = esConductor ? viaje.precio_conductor : viaje.precio;
  const estadoStyle = getEstadoStyle();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Ruta con timeline + precio destacado */}
      <View style={styles.mainRow}>
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.place} numberOfLines={1}>
              {viaje.origen || "Origen"}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.dotHollow} />
            <Text style={styles.place} numberOfLines={1}>
              {viaje.destino || "Destino"}
            </Text>
          </View>
        </View>
        <View style={styles.rightCol}>
          {precio != null && <Text style={styles.priceBig}>{precio}€</Text>}
          {estadoStyle && (
            <View
              style={[styles.estadoBadge, { backgroundColor: estadoStyle.bg }]}
            >
              {getEstadoIcon(estadoStyle.fg)}
              <Text style={[styles.estadoTexto, { color: estadoStyle.fg }]}>
                {getEstadoTexto()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer: fecha · plazas · conductor */}
      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Clock size={13} color={COLORS.gray400} strokeWidth={2} />
          <Text style={styles.metaText}>
            {formatDate(viaje)} · {formatTime(viaje)}
          </Text>
        </View>
        {plazasLibres != null && plazasTotal != null && (
          <View style={styles.metaItem}>
            <Users size={13} color={COLORS.gray400} strokeWidth={2} />
            <Text
              style={[
                styles.metaText,
                plazasLibres === 0 && styles.metaTextMuted,
              ]}
            >
              {plazasLibres}/{plazasTotal}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <View style={styles.conductorChip}>
          {viaje.conductor_img ? (
            <Image
              source={{ uri: viaje.conductor_img }}
              style={styles.conductorAvatar}
            />
          ) : (
            <View style={styles.conductorAvatarFallback}>
              <Text style={styles.conductorInitial}>
                {conductorNombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.conductorName} numberOfLines={1}>
            {conductorNombre}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  routeContainer: {
    flex: 1,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotHollow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
    borderWidth: 2.5,
    borderColor: COLORS.secondary,
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: COLORS.gray200,
    marginLeft: 4,
    marginVertical: 2,
  },
  place: {
    flex: 1,
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  priceBig: {
    fontSize: FONTS.xl,
    fontWeight: "800",
    color: COLORS.primary,
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  estadoTexto: {
    fontSize: FONTS.xs,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    marginTop: SPACING.sm + 2,
    paddingTop: SPACING.sm + 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  metaTextMuted: {
    color: COLORS.error,
  },
  conductorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  conductorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  conductorAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  conductorInitial: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  conductorName: {
    fontSize: FONTS.xs,
    color: COLORS.gray600,
    fontWeight: "500",
    maxWidth: 90,
  },
});

export default ViajeCard;
