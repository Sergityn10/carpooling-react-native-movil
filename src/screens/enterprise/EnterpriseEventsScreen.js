// YouConnext - EnterpriseEventsScreen (Eventos Corporativos + Métricas Integradas)
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarDays,
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import {
  EnterpriseHeader,
  EnterpriseEventCard,
  EventMetricsSummary,
} from "../../components/enterprise";
import PressableScale from "../../components/common/PressableScale";
import { useUser } from "../../context/UserContext";
import { enterpriseService } from "../../services/enterpriseService";

const FILTER_TABS = ["Todos", "Próximos", "En curso", "Finalizados"];

const EnterpriseEventsScreen = ({ navigation }) => {
  const { switchMode, permissions } = useUser();
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [eventsList, metricsData] = await Promise.all([
        enterpriseService.getEnterpriseEvents(),
        enterpriseService.getEnterpriseEventsMetrics(),
      ]);
      setEvents(eventsList || []);
      setMetrics(metricsData);
    } catch (err) {
      console.warn("Error cargando eventos corporativos:", err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredEvents = events.filter((ev) => {
    const titleMatch = (ev.name || ev.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const locationMatch = (
      ev.location ||
      ev.address_line1 ||
      (ev.city ? `${ev.city}, ${ev.country || "ES"}` : "")
    ).toLowerCase().includes(searchQuery.toLowerCase());

    if (!titleMatch && !locationMatch) return false;

    const rawStatus = (ev.status || ev.original_status || "").toLowerCase();
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

    if (selectedTab === "Próximos") return isUpcoming;
    if (selectedTab === "En curso") return isActive;
    if (selectedTab === "Finalizados") return isCompleted;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <EnterpriseHeader
        title="Eventos Corporativos"
        subtitle="Gestión de aforos, acreditación y carpooling"
        onSwitchPersonal={() => switchMode("personal")}
        rightAction={
          <PressableScale
            style={styles.headerAddBtn}
            onPress={() => navigation.navigate("EnterpriseCrearEvento")}
            scaleTo={0.96}
            accessibilityLabel="Crear nuevo evento corporativo"
          >
            <Plus size={16} color={COLORS.white} strokeWidth={2.6} />
            <Text style={styles.headerAddBtnText}>Nuevo</Text>
          </PressableScale>
        }
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
        {/* Panel de Métricas de Eventos (Solicitado explícitamente dentro de la pantalla de eventos) */}
        {metrics && <EventMetricsSummary metrics={metrics} />}

        {/* Buscador de Eventos */}
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.gray500} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o sede del evento..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Pestañas de Filtro */}
        <View style={styles.tabsRow}>
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, isSelected && styles.tabChipSelected]}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isSelected && styles.tabChipTextSelected,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Listado de Tarjetas de Eventos */}
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={42} color={COLORS.gray400} strokeWidth={1.8} />
            <Text style={styles.emptyTitle}>No hay eventos en esta sección</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Prueba con otra palabra clave en el buscador."
                : "Pulsa '+ Nuevo' para dar de alta el primer evento corporativo."}
            </Text>
            <PressableScale
              style={styles.emptyBtn}
              onPress={() => navigation.navigate("EnterpriseCrearEvento")}
              scaleTo={0.98}
            >
              <Plus size={16} color={COLORS.white} strokeWidth={2.6} />
              <Text style={styles.emptyBtnText}>Crear Evento</Text>
            </PressableScale>
          </View>
        ) : (
          filteredEvents.map((item) => (
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
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.round,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  headerAddBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.screenMargin,
    marginTop: SPACING.sm,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: BRAND.black,
  },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.screenMargin,
    marginVertical: SPACING.md,
    gap: 8,
  },
  tabChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  tabChipSelected: {
    backgroundColor: BRAND.black,
    borderColor: BRAND.black,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  tabChipTextSelected: {
    color: COLORS.white,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.screenMargin,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.control,
    gap: 8,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default EnterpriseEventsScreen;
