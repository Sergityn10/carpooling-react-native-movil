// YouConnext - Event Trips Section Component
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
  Navigation as NavIcon,
  ArrowRight,
  Search,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS } from "../../constants";
import { ViajeCard } from "../index";

const EventTripsSection = ({
  trayectosIda = [],
  trayectosVuelta = [],
  loading,
  onCrearViaje,
  onBuscarViaje,
  onViajePress,
  activeTab = "ida",
  onTabChange,
}) => {
  const trayectos = activeTab === "ida" ? trayectosIda : trayectosVuelta;

  const renderEmpty = () => (
    <View style={styles.emptyTrips}>
      <NavIcon size={40} color={COLORS.gray300} strokeWidth={1.5} />
      <Text style={styles.emptyTripsTitle}>
        No hay viajes de {activeTab === "ida" ? "ida" : "vuelta"}
      </Text>
      <Text style={styles.emptyTripsText}>
        Sé el primero en crear un viaje de{" "}
        {activeTab === "ida" ? "ida hacia" : "vuelta desde"} este evento
      </Text>
      <TouchableOpacity
        style={styles.emptyCrearButton}
        onPress={onCrearViaje}
        activeOpacity={0.8}
      >
        <Car size={18} color={COLORS.white} strokeWidth={2.5} />
        <Text style={styles.emptyCrearText}>Crear viaje</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.tripsHeader}>
        <View style={styles.tripsTitleRow}>
          <Car size={18} color={COLORS.gray700} strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Viajes</Text>
        </View>
        <View style={styles.tripsHeaderActions}>
          {onBuscarViaje && (
            <TouchableOpacity
              style={styles.buscarViajeButton}
              onPress={() => onBuscarViaje(activeTab)}
              activeOpacity={0.8}
            >
              <Search size={16} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.buscarViajeText}>Buscar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.crearViajeButton}
            onPress={onCrearViaje}
            activeOpacity={0.8}
          >
            <Plus size={16} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.crearViajeText}>Crear viaje</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Ida / Vuelta */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "ida" && styles.tabActive]}
          onPress={() => onTabChange("ida")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "ida" && styles.tabTextActive,
            ]}
          >
            Ida
          </Text>
          {trayectosIda.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{trayectosIda.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "vuelta" && styles.tabActive]}
          onPress={() => onTabChange("vuelta")}
          activeOpacity={0.8}
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
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{trayectosVuelta.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.tripsLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.tripsLoadingText}>Cargando viajes...</Text>
        </View>
      ) : trayectos.length > 0 ? (
        trayectos.map((viaje, index) => (
          <ViajeCard
            key={viaje.id || index}
            viaje={viaje}
            onPress={() => onViajePress(viaje)}
          />
        ))
      ) : (
        renderEmpty()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  tripsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  tripsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  crearViajeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  buscarViajeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  buscarViajeText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.primary,
  },
  tripsHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  crearViajeText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.primary,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  tripsLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  tripsLoadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  emptyTrips: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTripsTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray600,
  },
  emptyTripsText: {
    fontSize: FONTS.sm,
    color: COLORS.gray400,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyCrearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  emptyCrearText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sm,
  },
});

export default EventTripsSection;
