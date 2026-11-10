// YouConnext - EnterpriseDashboardScreen (Panel Principal de la Organización)
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Leaf,
  Users,
  Car,
  Calendar,
  Plus,
  UserPlus,
  QrCode,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import { EnterpriseHeader, EnterpriseEventCard } from "../../components/enterprise";
import PressableScale from "../../components/common/PressableScale";
import { useUser } from "../../context/UserContext";
import { enterpriseService } from "../../services/enterpriseService";

const EnterpriseDashboardScreen = ({ navigation }) => {
  const { user, selectedEnterprise, switchMode, permissions } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    co2EvitadoKg: 948.5,
    viajesMes: 142,
    empleadosActivos: 0,
    ahorroEstimadoEur: 1240,
  });

  const loadData = useCallback(async () => {
    try {
      const [eventsData, metricsData, membersData] = await Promise.all([
        enterpriseService.getEnterpriseEvents(),
        enterpriseService.getEnterpriseEventsMetrics(),
        enterpriseService.getEnterpriseMembers(selectedEnterprise?.id),
      ]);
      setEvents(eventsData.slice(0, 3)); // Mostrar los 3 más relevantes
      const membersCount = Array.isArray(membersData) ? membersData.length : 0;
      setKpis((prev) => ({
        ...prev,
        co2EvitadoKg: metricsData?.totalCo2Saved || prev.co2EvitadoKg,
        viajesMes: (metricsData?.totalCarpoolRoutes * 4) || prev.viajesMes,
        empleadosActivos: membersCount,
      }));
    } catch (e) {
      console.warn("Error al cargar dashboard de empresa:", e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEnterprise?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSwitchPersonal = () => {
    switchMode("personal");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <EnterpriseHeader
        onSwitchPersonal={handleSwitchPersonal}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Banner de Bienvenida Institucional */}
        <View style={styles.heroBanner}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>PANEL DE MOVILIDAD Y EVENTOS</Text>
          <Text style={styles.heroTitle}>Sostenibilidad Corporativa</Text>
          <Text style={styles.heroDesc}>
            Supervisa las emisiones evitadas, la participación en carpooling y los eventos de tu comunidad empresarial.
          </Text>

          {/* Acciones Rápidas */}
          <View style={styles.quickActionsRow}>
            <PressableScale
              style={styles.quickBtnPrimary}
              onPress={() => navigation.navigate("EnterpriseCrearEvento")}
              scaleTo={0.96}
            >
              <Plus size={16} color={BRAND.black} strokeWidth={2.8} />
              <Text style={styles.quickBtnPrimaryText}>Crear Evento</Text>
            </PressableScale>

            <PressableScale
              style={styles.quickBtnSecondary}
              onPress={() => navigation.navigate("Equipo")}
              scaleTo={0.96}
            >
              <UserPlus size={16} color={COLORS.gray800} strokeWidth={2.4} />
              <Text style={styles.quickBtnSecondaryText}>Invitar Miembro</Text>
            </PressableScale>
          </View>
        </View>

        {/* Tarjetas de Impacto Ambiental y Carpooling */}
        <Text style={styles.sectionTitle}>Impacto Acumulado</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#E3F4EA" }]}>
              <Leaf size={18} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <Text style={[styles.kpiNumber, { color: COLORS.primary }]}>
              {kpis.co2EvitadoKg} kg
            </Text>
            <Text style={styles.kpiLabel}>CO2 Evitado</Text>
            <Text style={styles.kpiHint}>En rutas compartidas</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#E0F2FE" }]}>
              <Car size={18} color="#0284C7" strokeWidth={2.4} />
            </View>
            <Text style={[styles.kpiNumber, { color: "#0284C7" }]}>
              {kpis.viajesMes}
            </Text>
            <Text style={styles.kpiLabel}>Viajes este mes</Text>
            <Text style={styles.kpiHint}>Compartidos entre sedes</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#FEF3C7" }]}>
              <Users size={18} color={BRAND.accent} strokeWidth={2.4} />
            </View>
            <Text style={[styles.kpiNumber, { color: BRAND.accent }]}>
              {kpis.empleadosActivos} pax
            </Text>
            <Text style={styles.kpiLabel}>Empleados Activos</Text>
            <Text style={styles.kpiHint}>En el programa</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#F3E8FF" }]}>
              <TrendingUp size={18} color="#9333EA" strokeWidth={2.4} />
            </View>
            <Text style={[styles.kpiNumber, { color: "#9333EA" }]}>
              {kpis.ahorroEstimadoEur} €
            </Text>
            <Text style={styles.kpiLabel}>Ahorro Estimado</Text>
            <Text style={styles.kpiHint}>En combustible y CAEs</Text>
          </View>
        </View>

        {/* Sección de Eventos Corporativos Recientes */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Eventos")}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>Ver todos</Text>
            <ArrowRight size={13} color={COLORS.primary} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {events.length === 0 ? (
          <View style={styles.dashboardEmptyCard}>
            <Calendar size={28} color={COLORS.gray400} strokeWidth={1.8} />
            <Text style={styles.dashboardEmptyTitle}>
              Aún no tienes eventos programados
            </Text>
            <Text style={styles.dashboardEmptyDesc}>
              Crea tu primer evento corporativo para activar las rutas compartidas de tu equipo.
            </Text>
            <PressableScale
              style={styles.dashboardEmptyBtn}
              onPress={() => navigation.navigate("EnterpriseCrearEvento")}
            >
              <Plus size={15} color={COLORS.white} strokeWidth={2.6} />
              <Text style={styles.dashboardEmptyBtnText}>Crear Evento</Text>
            </PressableScale>
          </View>
        ) : (
          events.map((item) => (
            <EnterpriseEventCard
              key={item.id}
              event={item}
              onScanQR={(ev) =>
                navigation.navigate("EnterpriseQRScanner", {
                  eventId: ev.id,
                  eventTitle: ev.name || ev.title,
                })
              }
              onEdit={(ev) =>
                navigation.navigate("EnterpriseEditarEvento", { event: ev })
              }
              onViewDetail={(ev) =>
                navigation.navigate("EnterpriseEventDetail", {
                  eventId: ev.id,
                  event: ev,
                })
              }
            />
          ))
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  heroBanner: {
    backgroundColor: BRAND.black,
    marginHorizontal: SPACING.screenMargin,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    overflow: "hidden",
    position: "relative",
    ...SHADOWS.card,
  },
  heroGlow: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 200, 83, 0.15)",
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: BRAND.green,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F2F5F4",
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 12,
    color: "#A7B2AE",
    lineHeight: 17,
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND.green,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.control,
    gap: 8,
    shadowColor: BRAND.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  quickBtnPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND.black,
    letterSpacing: 0.2,
  },
  quickBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.control,
    gap: 8,
  },
  quickBtnSecondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    marginHorizontal: SPACING.screenMargin,
    marginTop: SPACING.sm,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: SPACING.screenMargin,
    marginTop: SPACING.sm,
    marginBottom: 10,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#E3F4EA",
    borderRadius: RADIUS.round,
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: SPACING.screenMargin,
    gap: 10,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 2,
  },
  kpiHint: {
    fontSize: 10,
    color: COLORS.gray500,
    marginTop: 1,
  },
  dashboardEmptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    marginHorizontal: SPACING.screenMargin,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  dashboardEmptyTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 10,
    marginBottom: 4,
    textAlign: "center",
  },
  dashboardEmptyDesc: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.gray600,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  dashboardEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.round,
    gap: 6,
  },
  dashboardEmptyBtnText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default EnterpriseDashboardScreen;
