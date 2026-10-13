// YouConnext - SearchTrayectosScreen (Pro UI/UX Redesign con Mapa Interactivo)
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  MapPin,
  SlidersHorizontal,
  Calendar,
  Navigation,
  Car,
  X,
  Ticket,
  Users,
  Map,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import {
  ViajeCard,
  SearchBottomSheet,
  EventCard,
  EmptyState,
  CarouselSkeleton,
  AnimatedCardEntrance,
  MapaExploracionView,
} from "../components";
import { trayectoService } from "../services/travels/trayectoService";
import { eventService } from "../services/eventService";

const TAB_MAPA = "mapa";
const TAB_TRAYECTOS = "trayectos";
const TAB_EVENTOS = "eventos";

const SearchTrayectosScreen = ({ navigation, route }) => {
  const initialParams = route.params?.searchParams || null;
  const initialTab = route.params?.tab || (initialParams ? TAB_TRAYECTOS : TAB_MAPA);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchParams, setSearchParams] = useState(initialParams);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Eventos state
  const [eventSearch, setEventSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState(null);
  const [eventsFetched, setEventsFetched] = useState(false);
  const searchTimeoutRef = useRef(null);

  // --- Trayectos ---
  const performSearch = async (params) => {
    if (!params) return;
    setLoading(true);
    setError(null);
    try {
      const response = await trayectoService.buscarTrayectos({
        origin: params.origin,
        destination: params.destination,
        date: params.date,
        passengers: params.passengers || 1,
      });
      const data = response.data || response.trayectos || response || [];
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error al buscar trayectos");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialParams) {
      setSearchParams(initialParams);
      if (initialParams.openSheet) {
        setSheetVisible(true);
      }
      const hasOrigin = !!initialParams.origin;
      const hasDest = !!initialParams.destination;
      if (hasOrigin || hasDest) {
        performSearch(initialParams);
        setActiveTab(TAB_TRAYECTOS);
      }
    }
  }, [initialParams]);

  const handleSearch = (params) => {
    setSearchParams(params);
    performSearch(params);
    setActiveTab(TAB_TRAYECTOS);
  };

  const handleViajePress = (viaje) => {
    navigation.navigate("ViajeDetalle", { viaje });
  };

  // --- Eventos ---
  const fetchEvents = useCallback(async (searchTerm = "") => {
    setLoadingEvents(true);
    setEventError(null);
    try {
      const params = { limit: 50 };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await eventService.getEvents(params);
      const data = res.events || res.data || [];
      setEvents(Array.isArray(data) ? data : []);
      setEventsFetched(true);
    } catch (err) {
      setEventError(err.message || "Error al buscar eventos");
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const handleEventSearch = (text) => {
    setEventSearch(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchEvents(text);
    }, 300);
  };

  const handleEventPress = (event) => {
    Keyboard.dismiss();
    navigation.navigate("EventDetalle", { eventId: event.id, event });
  };

  useEffect(() => {
    if (activeTab === TAB_EVENTOS && !eventsFetched) {
      fetchEvents();
    }
  }, [activeTab, eventsFetched, fetchEvents]);

  // --- Render items ---
  const renderTrayectoResult = ({ item, index }) => (
    <AnimatedCardEntrance index={index}>
      <ViajeCard
        viaje={item}
        onPress={() => handleViajePress(item)}
        onUnirse={() => navigation.navigate("EscanearQR")}
      />
    </AnimatedCardEntrance>
  );

  const renderEventResult = ({ item, index }) => (
    <AnimatedCardEntrance index={index}>
      <EventCard event={item} onPress={() => handleEventPress(item)} />
    </AnimatedCardEntrance>
  );

  const renderTrayectosEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <EmptyState
          icon={Car}
          tint={COLORS.error}
          tintSoft={COLORS.errorSoft}
          title="Ocurrió un error"
          subtitle={error}
          actionLabel="Reintentar"
          onActionPress={() => performSearch(searchParams)}
        />
      );
    }
    if (!searchParams || (!searchParams.origin && !searchParams.destination)) {
      return (
        <EmptyState
          icon={Search}
          tint={COLORS.primary}
          tintSoft={COLORS.primarySoft}
          title="Busca tu trayecto"
          subtitle="Especifica tu origen, destino y fecha para ver los viajes disponibles."
          actionLabel="Establecer ruta"
          onActionPress={() => setSheetVisible(true)}
        />
      );
    }
    return (
      <EmptyState
        icon={MapPin}
        tint={COLORS.primary}
        tintSoft={COLORS.primarySoft}
        title="Sin trayectos encontrados"
        subtitle="No se encontraron viajes para esta búsqueda. Prueba cambiando la fecha u origen."
        actionLabel="Modificar búsqueda"
        onActionPress={() => setSheetVisible(true)}
      />
    );
  };

  const renderEventosEmpty = () => {
    if (loadingEvents) return null;
    if (eventError) {
      return (
        <EmptyState
          icon={Ticket}
          tint={COLORS.error}
          tintSoft={COLORS.errorSoft}
          title="Error al cargar eventos"
          subtitle={eventError}
          actionLabel="Reintentar"
          onActionPress={() => fetchEvents(eventSearch)}
        />
      );
    }
    return (
      <EmptyState
        icon={Ticket}
        tint={COLORS.secondary}
        tintSoft={COLORS.secondarySoft}
        title="Sin eventos encontrados"
        subtitle="No encontramos eventos con ese término. Prueba con otra palabra clave."
      />
    );
  };

  const routeSummaryText = () => {
    if (!searchParams) return "Buscar por origen y destino...";
    const origin = searchParams.origin || "Cualquier origen";
    const dest = searchParams.destination || "Cualquier destino";
    return `${origin} → ${dest}`;
  };

  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header con Barra de Búsqueda (en Trayectos y Eventos) */}
      {activeTab !== TAB_MAPA && (
        <View style={styles.header}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={8}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color={COLORS.gray800} strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          {activeTab === TAB_TRAYECTOS ? (
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.8}
            >
              <Search size={18} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.searchBarText} numberOfLines={1}>
                {routeSummaryText()}
              </Text>
              <View style={styles.filterChip}>
                <SlidersHorizontal
                  size={15}
                  color={COLORS.primaryDark}
                  strokeWidth={2.5}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.searchBar}>
              <Search size={18} color={COLORS.gray400} strokeWidth={2.5} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Buscar por evento, concierto, festival..."
                placeholderTextColor={COLORS.gray400}
                value={eventSearch}
                onChangeText={handleEventSearch}
                returnKeyType="search"
                onSubmitEditing={() => fetchEvents(eventSearch)}
              />
              {eventSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setEventSearch("");
                    fetchEvents("");
                  }}
                  style={styles.clearButton}
                  hitSlop={6}
                >
                  <X size={14} color={COLORS.gray500} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Segmented Control (Tabs: Mapa | Trayectos | Eventos) */}
      <View style={[styles.tabsWrapper, activeTab === TAB_MAPA && styles.tabsWrapperFloating]}>
        <View style={styles.tabsContainer}>
          {/* Tab 1: Mapa */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === TAB_MAPA && styles.tabActiveMap,
            ]}
            onPress={() => setActiveTab(TAB_MAPA)}
            activeOpacity={0.85}
          >
            <Map
              size={15}
              color={
                activeTab === TAB_MAPA ? COLORS.white : COLORS.gray600
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === TAB_MAPA && styles.tabTextActiveLight,
              ]}
            >
              Mapa
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Trayectos */}
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === TAB_TRAYECTOS && styles.tabActive,
            ]}
            onPress={() => setActiveTab(TAB_TRAYECTOS)}
            activeOpacity={0.85}
          >
            <Car
              size={15}
              color={
                activeTab === TAB_TRAYECTOS ? COLORS.primary : COLORS.gray600
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === TAB_TRAYECTOS && styles.tabTextActive,
              ]}
            >
              Trayectos
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Eventos */}
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_EVENTOS && styles.tabActive]}
            onPress={() => setActiveTab(TAB_EVENTOS)}
            activeOpacity={0.85}
          >
            <Ticket
              size={15}
              color={
                activeTab === TAB_EVENTOS ? COLORS.secondary : COLORS.gray600
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === TAB_EVENTOS && styles.tabTextActiveSecondary,
              ]}
            >
              Eventos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido según la pestaña activa */}
      {activeTab === TAB_MAPA ? (
        <View style={styles.mapViewWrapper}>
          <MapaExploracionView
            style={styles.mapComponent}
            onTripSelect={handleViajePress}
          />
        </View>
      ) : activeTab === TAB_TRAYECTOS ? (
        <View style={styles.listWrapper}>
          {/* Bar de resumen de búsqueda activa */}
          {searchParams && (searchParams.origin || searchParams.destination) && (
            <View style={styles.summaryBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.summaryChipsContent}
              >
                {searchParams.origin ? (
                  <View style={styles.summaryChip}>
                    <Navigation
                      size={12}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.summaryChipText} numberOfLines={1}>
                      {searchParams.origin}
                    </Text>
                  </View>
                ) : null}

                {searchParams.destination ? (
                  <View style={styles.summaryChip}>
                    <MapPin size={12} color={COLORS.error} strokeWidth={2.5} />
                    <Text style={styles.summaryChipText} numberOfLines={1}>
                      {searchParams.destination}
                    </Text>
                  </View>
                ) : null}

                {searchParams.date ? (
                  <View style={styles.summaryChip}>
                    <Calendar
                      size={12}
                      color={COLORS.gray600}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.summaryChipText}>
                      {searchParams.date}
                    </Text>
                  </View>
                ) : null}

                {searchParams.passengers > 1 ? (
                  <View style={styles.summaryChip}>
                    <Users size={12} color={COLORS.gray600} strokeWidth={2.5} />
                    <Text style={styles.summaryChipText}>
                      {searchParams.passengers} plazas
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <TouchableOpacity
                style={styles.editSearchBtn}
                onPress={() => setSheetVisible(true)}
                hitSlop={6}
              >
                <Text style={styles.editSearchText}>Editar</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderTrayectoResult}
            ListEmptyComponent={renderTrayectosEmpty}
            ListHeaderComponent={
              loading ? (
                <View style={styles.skeletonContainer}>
                  <CarouselSkeleton withImage={false} />
                </View>
              ) : null
            }
            contentContainerStyle={
              results.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <FlatList
            data={events}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEventResult}
            ListEmptyComponent={renderEventosEmpty}
            ListHeaderComponent={
              loadingEvents ? (
                <View style={styles.skeletonContainer}>
                  <CarouselSkeleton />
                </View>
              ) : null
            }
            contentContainerStyle={
              events.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Bottom Sheet de Búsqueda */}
      <SearchBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSearch={handleSearch}
        initialParams={searchParams}
      />
    </SafeAreaView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  searchBarText: {
    flex: 1,
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  searchTextInput: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray900,
    paddingVertical: SPACING.xs,
  },
  filterChip: {
    padding: SPACING.xs,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.sm,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  tabsWrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  tabsWrapperFloating: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    ...SHADOWS.sm,
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
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.xs,
  },
  tabActiveMap: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.xs,
  },
  tabText: {
    fontSize: FONTS.xs + 1,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabTextActiveLight: {
    color: COLORS.white,
  },
  tabTextActiveSecondary: {
    color: COLORS.secondary,
  },
  mapViewWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mapComponent: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    gap: SPACING.sm,
  },
  summaryChipsContent: {
    gap: SPACING.xs,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  summaryChipText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium,
    color: COLORS.gray700,
  },
  editSearchBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  editSearchText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  skeletonContainer: {
    paddingTop: SPACING.sm,
  },
});

export default SearchTrayectosScreen;