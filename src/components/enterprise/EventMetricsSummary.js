// YouConnext - EventMetricsSummary (Panel Analítico Embebido en la Vista de Eventos)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  CalendarCheck,
  Users,
  Car,
  Leaf,
  QrCode,
  TrendingUp,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";

const MetricCard = ({ icon: Icon, value, label, subtext, highlightColor }) => (
  <View style={styles.kpiCard}>
    <View style={styles.kpiHeader}>
      <View style={[styles.kpiIconBox, { backgroundColor: `${highlightColor}15` }]}>
        <Icon size={16} color={highlightColor} strokeWidth={2.4} />
      </View>
      <Text style={[styles.kpiValue, { color: highlightColor }]}>{value}</Text>
    </View>
    <Text style={styles.kpiLabel}>{label}</Text>
    {subtext ? <Text style={styles.kpiSubtext}>{subtext}</Text> : null}
  </View>
);

const EventMetricsSummary = ({ metrics = {} }) => {
  const {
    totalEvents = 0,
    activeEvents = 0,
    totalAttendees = 0,
    totalCheckedIn = 0,
    checkInRate = 0,
    totalCarpoolRoutes = 0,
    totalCo2Saved = 0,
  } = metrics;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <TrendingUp size={16} color={COLORS.primary} strokeWidth={2.4} />
          <Text style={styles.headerTitle}>Métricas de Eventos Corporativos</Text>
        </View>
        <View style={styles.badgeLive}>
          <View style={styles.pulseDot} />
          <Text style={styles.badgeLiveText}>En vivo</Text>
        </View>
      </View>

      {/* Grid de 4 KPIs */}
      <View style={styles.grid}>
        <MetricCard
          icon={CalendarCheck}
          value={activeEvents}
          label="Eventos Activos"
          subtext={`${totalEvents} organizados en total`}
          highlightColor={COLORS.primary}
        />

        <MetricCard
          icon={Users}
          value={totalAttendees}
          label="Asistentes Registrados"
          subtext={`${checkInRate}% acreditados con QR`}
          highlightColor="#0284C7"
        />

        <MetricCard
          icon={Car}
          value={totalCarpoolRoutes}
          label="Rutas Carpooling"
          subtext="Viajes compartidos hacia eventos"
          highlightColor={BRAND.accent}
        />

        <MetricCard
          icon={Leaf}
          value={`${totalCo2Saved} kg`}
          label="CO2 Evitado"
          subtext="Reducción en desplazamientos"
          highlightColor="#10B981"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.screenMargin,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.cardPadding,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.black,
    letterSpacing: 0.2,
  },
  badgeLive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  badgeLiveText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kpiIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  kpiLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 3,
  },
  kpiSubtext: {
    fontSize: 10,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
    lineHeight: 14,
  },
});

export default EventMetricsSummary;
