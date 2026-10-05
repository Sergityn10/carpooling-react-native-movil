// YouConnext - EventAllTripsModal (Pantalla / Vista Completa para Explorar Todos los Trayectos del Evento)
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Search,
  Car,
  Calendar,
  LocateFixed,
  PlusCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import { ViajeCard } from "../index";
import AnimatedCardEntrance from "../common/AnimatedCardEntrance";
import EmptyState from "../home/EmptyState";
import { parseTripDate } from "../../services/dateUtils";

const EventAllTripsModal = ({
  visible,
  onClose,
  eventName,
  trayectosIda = [],
  trayectosVuelta = [],
  initialTab = "ida",
  loading = false,
  onViajePress,
  onCrearViaje,
  onBuscarCerca,
  loadingNearby = false,
  isNearbyActive = false,
  onResetFiltroCerca,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const rawTrips = activeTab === "ida" ? trayectosIda : trayectosVuelta;

  // Fechas únicas para filtrar
  const uniqueDates = useMemo(() => {
    return [
      ...new Set(
        rawTrips
          .map((t) => {
            const d = parseTripDate(t);
            return d ? d.toDateString() : null;
          })
          .filter(Boolean),
      ),
    ].sort((a, b) => new Date(a) - new Date(b));
  }, [rawTrips]);

  // Filtrado por texto y fecha
  const filteredTrips = useMemo(() => {
    return rawTrips.filter((t) => {
      const originMatch = (t.origen || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const destMatch = (t.destino || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const conductorMatch = (typeof t.conductor === "string" ? t.conductor : "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());

      const matchesSearch =
        !searchQuery.trim() || originMatch || destMatch || conductorMatch;

      const tripDate = parseTripDate(t);
      const matchesDate =
        !selectedDate || (tripDate && tripDate.toDateString() === selectedDate);

      return matchesSearch && matchesDate;
    });
  }, [rawTrips, searchQuery, selectedDate]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={8}
            activeOpacity={0.8}
          >
            <X size={20} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Viajes para {eventName}
            </Text>
            <Text style={styles.headerSubtitle}>
              {filteredTrips.length}{" "}
              {filteredTrips.length === 1 ? "viaje disponible" : "viajes disponibles"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={onCrearViaje}
            activeOpacity={0.85}
          >
            <PlusCircle size={16} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.createBtnText}>Ofrecer</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented Control Ida / Vuelta */}
        <View style={styles.tabsWrapper}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "ida" && styles.tabActive,
              ]}
              onPress={() => {
                setActiveTab("ida");
                setSelectedDate(null);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ida" && styles.tabTextActive,
                ]}
              >
                Ida hacia el evento
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
              style={[
                styles.tab,
                activeTab === "vuelta" && styles.tabActive,
              ]}
              onPress={() => {
                setActiveTab("vuelta");
                setSelectedDate(null);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "vuelta" && styles.tabTextActive,
                ]}
              >
                Vuelta a casa
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
        </View>

        {/* Buscador de Ciudad / Origen */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.gray400} strokeWidth={2.5} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                activeTab === "ida"
                  ? "Filtrar por origen (ej. Madrid, Barcelona)..."
                  : "Filtrar por destino..."
              }
              placeholderTextColor={COLORS.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearBtn}
                hitSlop={6}
              >
                <X size={14} color={COLORS.gray500} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros de Ubicación Cercana y Fecha */}
        <View style={styles.dateFiltersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={uniqueDates}
            keyExtractor={(d) => d}
            contentContainerStyle={styles.dateFiltersContent}
            ListHeaderComponent={
              <View style={styles.filterPillsRow}>
                {/* Botón Cerca de mí */}
                {onBuscarCerca && (
                  <TouchableOpacity
                    style={[
                      styles.datePill,
                      isNearbyActive && styles.datePillActiveNearby,
                    ]}
                    onPress={isNearbyActive ? onResetFiltroCerca : onBuscarCerca}
                    disabled={loadingNearby}
                    activeOpacity={0.8}
                  >
                    {loadingNearby ? (
                      <ActivityIndicator size={12} color={COLORS.primaryDark} />
                    ) : (
                      <LocateFixed
                        size={12}
                        color={isNearbyActive ? COLORS.white : COLORS.gray600}
                        strokeWidth={2.5}
                      />
                    )}
                    <Text
                      style={[
                        styles.datePillText,
                        isNearbyActive && styles.datePillTextActiveNearby,
                      ]}
                    >
                      Cerca de mí (5 km)
                    </Text>
                    {isNearbyActive && (
                      <X size={12} color={COLORS.white} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                )}

                {/* Todas las fechas */}
                <TouchableOpacity
                  style={[
                    styles.datePill,
                    !selectedDate && styles.datePillActive,
                  ]}
                  onPress={() => setSelectedDate(null)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      !selectedDate && styles.datePillTextActive,
                    ]}
                  >
                    Todas las fechas
                  </Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => {
              const isActive = selectedDate === item;
              const formatted = new Date(item).toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              return (
                <TouchableOpacity
                  style={[styles.datePill, isActive && styles.datePillActive]}
                  onPress={() => setSelectedDate(isActive ? null : item)}
                  activeOpacity={0.8}
                >
                  <Calendar
                    size={12}
                    color={isActive ? COLORS.primaryDark : COLORS.gray500}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.datePillText,
                      isActive && styles.datePillTextActive,
                    ]}
                  >
                    {formatted}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Listado de Trayectos */}
        {loading || loadingNearby ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Buscando trayectos...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTrips}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <AnimatedCardEntrance index={index}>
                <ViajeCard viaje={item} onPress={() => onViajePress(item)} />
              </AnimatedCardEntrance>
            )}
            ListEmptyComponent={
              <EmptyState
                icon={Car}
                tint={COLORS.primary}
                tintSoft={COLORS.primarySoft}
                title={
                  isNearbyActive
                    ? "Sin viajes cerca de tu ubicación"
                    : searchQuery || selectedDate
                      ? "Sin viajes con esos filtros"
                      : "No hay viajes para este evento"
                }
                subtitle={
                  isNearbyActive
                    ? "No se encontraron trayectos que pasen en un radio de 5 km de tu ubicación."
                    : searchQuery || selectedDate
                      ? "Prueba eliminando el filtro de búsqueda o cambiando la fecha."
                      : `Sé el primero en ofrecer plazas en tu coche para ${eventName}.`
                }
                actionLabel={
                  isNearbyActive
                    ? "Ver todos los viajes"
                    : searchQuery || selectedDate
                      ? "Limpiar filtros"
                      : "Ofrecer plazas"
                }
                onActionPress={
                  isNearbyActive
                    ? onResetFiltroCerca
                    : searchQuery || selectedDate
                      ? () => {
                          setSearchQuery("");
                          setSelectedDate(null);
                        }
                      : onCrearViaje
                }
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  headerSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  createBtnText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  tabsWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    padding: 3,
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
  searchBarContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray900,
    fontWeight: "600",
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  dateFiltersWrapper: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  dateFiltersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  filterPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginRight: SPACING.xs,
  },
  datePillActive: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  datePillActiveNearby: {
    backgroundColor: COLORS.primary,
  },
  datePillText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  datePillTextActive: {
    color: COLORS.primaryDark,
  },
  datePillTextActiveNearby: {
    color: COLORS.white,
    fontWeight: "800",
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
    fontWeight: "600",
  },
});

export default EventAllTripsModal;
