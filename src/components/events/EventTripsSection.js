// YouConnext - Event Trips Section Component (Pro UI/UX Redesign with Nearby Filter)
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Car,
  Plus,
  Search,
  ChevronRight,
  MapPin,
  LocateFixed,
  X,
  SlidersHorizontal,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import { ViajeCard } from "../index";
import AnimatedCardEntrance from "../common/AnimatedCardEntrance";

const EventTripsSection = ({
  trayectosIda = [],
  trayectosVuelta = [],
  loading,
  onCrearViaje,
  onBuscarViaje,
  onViajePress,
  onVerTodos,
  onBuscarCerca,
  onResetFiltros,
  isNearbyActive = false,
  loadingNearby = false,
  activeTab = "ida",
  onTabChange,
}) => {
  const trayectos = activeTab === "ida" ? trayectosIda : trayectosVuelta;
  const previewTrips = trayectos.slice(0, 3);
  const totalCount = trayectos.length;

  const renderEmpty = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconBox}>
        <Car size={32} color={COLORS.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyTitle}>
        {isNearbyActive
          ? `Sin viajes de ${activeTab === "ida" ? "ida" : "vuelta"} cerca de ti`
          : `Sin viajes de ${activeTab === "ida" ? "ida" : "vuelta"} por ahora`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isNearbyActive
          ? "No se encontraron trayectos que pasen en un radio de 5 km de tu ubicación."
          : "¿Vas en tu vehículo? Comparte tus plazas libres con otros asistentes y ahorra gastos de combustible."}
      </Text>

      {isNearbyActive ? (
        <TouchableOpacity
          style={styles.resetFilterBtn}
          onPress={onResetFiltros}
          activeOpacity={0.85}
        >
          <Text style={styles.resetFilterBtnText}>Ver todos los viajes</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.emptyCreateBtn}
          onPress={onCrearViaje}
          activeOpacity={0.88}
        >
          <Car size={16} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.emptyCreateBtnText}>Ofrecer plazas</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Car size={18} color={COLORS.gray900} strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Viajes compartidos</Text>
        </View>

        <View style={styles.actionBtns}>
          {onBuscarViaje && (
            <TouchableOpacity
              style={styles.buscarBtn}
              onPress={() => onBuscarViaje(activeTab)}
              activeOpacity={0.8}
            >
              <Search size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
              <Text style={styles.buscarBtnText}>Buscar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.crearBtn}
            onPress={onCrearViaje}
            activeOpacity={0.85}
          >
            <Plus size={14} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.crearBtnText}>Ofrecer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Control Ida / Vuelta */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "ida" && styles.tabActive]}
          onPress={() => onTabChange("ida")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "ida" && styles.tabTextActive,
            ]}
          >
            Ida al evento
          </Text>
          {trayectosIda.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                activeTab === "ida" && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === "ida" && styles.tabBadgeTextActive,
                ]}
              >
                {trayectosIda.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "vuelta" && styles.tabActive]}
          onPress={() => onTabChange("vuelta")}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "vuelta" && styles.tabTextActive,
            ]}
          >
            Vuelta
          </Text>
          {trayectosVuelta.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                activeTab === "vuelta" && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === "vuelta" && styles.tabBadgeTextActive,
                ]}
              >
                {trayectosVuelta.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filtros rápidos: Cerca de mí / Todos */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            !isNearbyActive && styles.filterPillActive,
          ]}
          onPress={onResetFiltros}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterPillText,
              !isNearbyActive && styles.filterPillTextActive,
            ]}
          >
            Todos los viajes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            isNearbyActive && styles.filterPillActiveNearby,
          ]}
          onPress={onBuscarCerca}
          disabled={loadingNearby}
          activeOpacity={0.8}
        >
          {loadingNearby ? (
            <ActivityIndicator size={12} color={COLORS.primaryDark} />
          ) : (
            <LocateFixed
              size={13}
              color={isNearbyActive ? COLORS.white : COLORS.gray600}
              strokeWidth={2.4}
            />
          )}
          <Text
            style={[
              styles.filterPillText,
              isNearbyActive && styles.filterPillTextActiveNearby,
            ]}
          >
            Cerca de mí (5 km)
          </Text>
          {isNearbyActive && (
            <X size={12} color={COLORS.white} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      {/* Lista / Previsualización */}
      {loading || loadingNearby ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Buscando trayectos...</Text>
        </View>
      ) : trayectos.length > 0 ? (
        <View style={styles.tripsList}>
          {previewTrips.map((viaje, index) => (
            <AnimatedCardEntrance key={viaje.id || index} index={index}>
              <ViajeCard viaje={viaje} onPress={() => onViajePress(viaje)} />
            </AnimatedCardEntrance>
          ))}

          {/* Botón Ver Todos los Trayectos si hay varios */}
          <TouchableOpacity
            style={styles.verTodosBtn}
            onPress={() => onVerTodos(activeTab)}
            activeOpacity={0.85}
          >
            <Text style={styles.verTodosBtnText}>
              Ver todos los viajes de {activeTab === "ida" ? "ida" : "vuelta"} ({totalCount})
            </Text>
            <ChevronRight size={18} color={COLORS.primaryDark} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      ) : (
        renderEmpty()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.3,
  },
  actionBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  buscarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  buscarBtnText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  crearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  crearBtnText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 38,
    borderRadius: RADIUS.full,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.primaryDark,
    fontWeight: "800",
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primarySoft,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.gray600,
  },
  tabBadgeTextActive: {
    color: COLORS.primaryDark,
  },
  filterPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  filterPillActiveNearby: {
    backgroundColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  filterPillTextActive: {
    color: COLORS.gray900,
    fontWeight: "800",
  },
  filterPillTextActiveNearby: {
    color: COLORS.white,
    fontWeight: "800",
  },
  tripsList: {
    gap: SPACING.sm,
  },
  verTodosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(13, 159, 110, 0.3)",
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  verTodosBtnText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
  },
  loadingText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm + 2,
  },
  emptyTitle: {
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "800",
    color: COLORS.gray900,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 18,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: 4,
    marginBottom: SPACING.md,
    maxWidth: 280,
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    ...SHADOWS.small,
  },
  emptyCreateBtnText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
  resetFilterBtn: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  resetFilterBtnText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
});

export default EventTripsSection;
