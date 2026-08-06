// YouConnext - SearchTrayectosScreen (Trayectos + Eventos)
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Keyboard,
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
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, ViajeCard, SearchBottomSheet, EventCard } from "../components";
import { trayectoService } from "../services/travels/trayectoService";
import { eventService } from "../services/eventService";

const TAB_TRAYECTOS = "trayectos";
const TAB_EVENTOS = "eventos";

const SearchTrayectosScreen = ({ navigation, route }) => {
  const initialParams = route.params?.searchParams || null;

  const [activeTab, setActiveTab] = useState(TAB_TRAYECTOS);
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
      if (hasOrigin && hasDest) {
        performSearch(initialParams);
      }
    }
  }, [initialParams]);

  const handleSearch = (params) => {
    setSearchParams(params);
    performSearch(params);
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

  // Fetch events when switching to eventos tab for the first time
  useEffect(() => {
    if (activeTab === TAB_EVENTOS && !eventsFetched) {
      fetchEvents();
    }
  }, [activeTab, eventsFetched, fetchEvents]);

  // --- Render helpers ---
  const renderTrayectoResult = ({ item }) => (
    <ViajeCard
      viaje={item}
      onPress={() => handleViajePress(item)}
      onUnirse={() => navigation.navigate("EscanearQR")}
    />
  );

  const renderEventResult = ({ item }) => (
    <EventCard event={item} onPress={() => handleEventPress(item)} />
  );

  const renderTrayectosEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      );
    }
    if (!searchParams) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Search size={40} color={COLORS.gray300} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Busca tu trayecto</Text>
          <Text style={styles.emptyText}>
            Toca el campo de búsqueda para establecer tu origen, destino y fecha
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MapPin size={40} color={COLORS.gray300} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>Sin resultados</Text>
        <Text style={styles.emptyText}>
          No se encontraron trayectos para esta búsqueda. Prueba con otra fecha
          u origen.
        </Text>
      </View>
    );
  };

  const renderEventosEmpty = () => {
    if (loadingEvents) return null;
    if (eventError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{eventError}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Calendar size={40} color={COLORS.gray300} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>Sin eventos</Text>
        <Text style={styles.emptyText}>
          No se encontraron eventos. Prueba con otro término de búsqueda.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={COLORS.gray700} strokeWidth={2.5} />
        </TouchableOpacity>

        {activeTab === TAB_TRAYECTOS ? (
          <TouchableOpacity
            style={styles.searchInput}
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.7}
          >
            <Search size={18} color={COLORS.gray400} strokeWidth={2.5} />
            <Text
              style={[
                styles.searchPlaceholder,
                searchParams?.destination && styles.searchValue,
              ]}
              numberOfLines={1}
            >
              {searchParams?.destination || "Establece tu destino"}
            </Text>
            <View style={styles.filterIcon}>
              <SlidersHorizontal
                size={16}
                color={COLORS.primary}
                strokeWidth={2.5}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.searchInput}>
            <Search size={18} color={COLORS.gray400} strokeWidth={2.5} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Buscar eventos..."
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
              >
                <X size={16} color={COLORS.gray400} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === TAB_TRAYECTOS && styles.tabActive,
            ]}
            onPress={() => setActiveTab(TAB_TRAYECTOS)}
            activeOpacity={0.7}
          >
            <Car
              size={14}
              color={
                activeTab === TAB_TRAYECTOS ? COLORS.primary : COLORS.gray500
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
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_EVENTOS && styles.tabActive]}
            onPress={() => setActiveTab(TAB_EVENTOS)}
            activeOpacity={0.7}
          >
            <Calendar
              size={14}
              color={
                activeTab === TAB_EVENTOS ? COLORS.primary : COLORS.gray500
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === TAB_EVENTOS && styles.tabTextActive,
              ]}
            >
              Eventos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info de búsqueda activa (trayectos) */}
      {activeTab === TAB_TRAYECTOS && searchParams && (
        <View style={styles.searchInfoBar}>
          <View style={styles.searchInfoItem}>
            <View style={styles.searchInfoIcon}>
              <Navigation size={14} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchInfoLabel}>Origen</Text>
              <Text style={styles.searchInfoValue} numberOfLines={1}>
                {searchParams.origin}
              </Text>
            </View>
          </View>
          <View style={styles.searchInfoDivider} />
          <View style={styles.searchInfoItem}>
            <View style={styles.searchInfoIcon}>
              <Calendar size={14} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchInfoLabel}>Fecha</Text>
              <Text style={styles.searchInfoValue} numberOfLines={1}>
                {searchParams.date}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Contenido según tab activo */}
      {activeTab === TAB_TRAYECTOS ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTrayectoResult}
          ListEmptyComponent={renderTrayectosEmpty}
          ListHeaderComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Buscando trayectos...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={
            results.length === 0 ? styles.emptyList : styles.resultsList
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEventResult}
          ListEmptyComponent={renderEventosEmpty}
          ListHeaderComponent={
            loadingEvents ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Buscando eventos...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={
            events.length === 0 ? styles.emptyList : styles.resultsList
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Bottom Sheet (trayectos) */}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: FONTS.md,
    color: COLORS.gray400,
  },
  searchTextInput: {
    flex: 1,
    fontSize: FONTS.md,
    color: COLORS.gray800,
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  searchValue: {
    color: COLORS.gray800,
    fontWeight: "500",
  },
  filterIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
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
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  searchInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.sm,
  },
  searchInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  searchInfoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInfoLabel: {
    fontSize: 10,
    color: COLORS.gray400,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  searchInfoValue: {
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    marginTop: 1,
    fontWeight: "500",
  },
  searchInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.gray200,
  },
  resultsList: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray400,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default SearchTrayectosScreen;
