// YouConnext - EventMetricsCard Component (Métricas de Movilidad y Asistencia del Evento)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Car, Users, Ticket, MapPin, Sparkles } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const KpiItem = ({
  icon: Icon,
  iconColor,
  value,
  label,
  subtext,
  onPress,
  loading,
}) => {
  const content = (
    <View style={styles.kpiBox}>
      <View style={styles.kpiHeader}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={16} color={iconColor} strokeWidth={2.4} />
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} style={{ marginLeft: 4 }} />
        ) : (
          <Text style={[styles.kpiValue, { color: iconColor }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      <Text style={styles.kpiLabel} numberOfLines={1}>
        {label}
      </Text>
      {subtext ? (
        <Text style={styles.kpiSubtext} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.kpiTouch}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.kpiTouch}>{content}</View>;
};

const EventMetricsCard = ({
  totalTrayectos = 0,
  trayectosIdaCount = 0,
  trayectosVueltaCount = 0,
  totalPasajeros = 0,
  plazasLibres = 0,
  totalInscritos = 0,
  locationName = "Presencial",
  locationSubtext = "",
  loading = false,
  onTrayectosPress,
  onInscritosPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Sparkles size={15} color={COLORS.primary} strokeWidth={2.4} />
          <Text style={styles.cardTitle}>Resumen de Movilidad y Asistencia</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>En vivo</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {/* 1. Trayectos vinculados */}
        <KpiItem
          icon={Car}
          iconColor={COLORS.primary}
          value={totalTrayectos}
          label="Trayectos"
          subtext={
            totalTrayectos > 0
              ? `${trayectosIdaCount} ida · ${trayectosVueltaCount} vuelta`
              : "Sin viajes aún"
          }
          loading={loading}
          onPress={onTrayectosPress}
        />

        {/* 2. Pasajeros y Plazas carpooling */}
        <KpiItem
          icon={Users}
          iconColor="#0284C7"
          value={totalPasajeros}
          label="Pasajeros"
          subtext={
            plazasLibres > 0
              ? `${plazasLibres} plazas libres`
              : "Plazas completas"
          }
          loading={loading}
          onPress={onTrayectosPress}
        />

        {/* 3. Inscritos al evento */}
        <KpiItem
          icon={Ticket}
          iconColor="#8B5CF6"
          value={totalInscritos}
          label="Inscritos"
          subtext={
            totalInscritos === 1
              ? "1 asistente"
              : `${totalInscritos} asistentes`
          }
          loading={loading}
          onPress={onInscritosPress}
        />

        {/* 4. Ubicación del evento */}
        <KpiItem
          icon={MapPin}
          iconColor="#F59E0B"
          value={locationName}
          label="Sede"
          subtext={locationSubtext || "Ver en el mapa"}
          loading={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm + 2,
    paddingBottom: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: FONTS.xs + 1,
    fontWeight: "700",
    color: COLORS.gray700,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${COLORS.primary}12`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  kpiTouch: {
    width: "50%",
    padding: 4,
  },
  kpiBox: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 2,
  },
  kpiSubtext: {
    fontSize: 10,
    color: COLORS.gray500,
    marginTop: 1,
  },
});

export default EventMetricsCard;
