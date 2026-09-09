// YouConnext - SearchBottomSheet Component
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  X,
  Search,
  MapPin,
  Calendar,
  Navigation,
  ChevronRight,
  Clock,
  Trash2,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import LocationSelectSheet from "./LocationSelectSheet";
import { useUser } from "../../context/UserContext";
import { ubicacionTravelService } from "../../services/travels/ubicacionService";
import { trayectoService } from "../../services/travels/trayectoService";
import { Home, Briefcase, BookOpen, Dumbbell } from "lucide-react-native";

const MAX_RECENT_SEARCHES = 5;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

const SavedIconMap = {
  home: Home,
  work: Briefcase,
  university: BookOpen,
  gym: Dumbbell,
  other: MapPin,
};

const SearchBottomSheet = ({ visible, onClose, onSearch, initialParams }) => {
  const { user } = useUser();
  const [slideAnim] = useState(new Animated.Value(SHEET_HEIGHT));
  const [originText, setOriginText] = useState("");
  const [originPlace, setOriginPlace] = useState(null);
  const [destText, setDestText] = useState("");
  const [destPlace, setDestPlace] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [activeSelectType, setActiveSelectType] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const scrollViewRef = useRef(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const datePresets = [
    {
      label: "Hoy",
      value: todayStr,
      sublabel: today.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
    },
    {
      label: "Mañana",
      value: tomorrowStr,
      sublabel: tomorrow.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
    },
    {
      label: dayAfter.toLocaleDateString("es-ES", { weekday: "short" }),
      value: dayAfterStr,
      sublabel: dayAfter.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
    },
  ];

  const loadRecentSearches = useCallback(async () => {
    try {
      const res = await trayectoService.obtenerHistorialBusquedas({
        limit: MAX_RECENT_SEARCHES,
      });
      const data = res.data || res || [];
      if (Array.isArray(data)) {
        const mapped = data.map((item) => ({
          id: item.id,
          origin: item.origin,
          destination: item.destination,
          date: item.search_date || item.date || "",
          originLat: item.origin_lat,
          originLng: item.origin_lng,
          destLat: item.destination_lat,
          destLng: item.destination_lng,
          passengers: item.passengers,
          createdAt: item.created_at,
        }));
        setRecentSearches(mapped);
      }
    } catch (e) {
      console.log("Error al cargar historial de búsquedas:", e);
    }
  }, []);

  const loadSavedLocations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await ubicacionTravelService.obtenerUbicacionesPorUsuario(
        user.id,
      );
      const apiLocations = res.data || res.ubicaciones || res || [];
      if (Array.isArray(apiLocations)) {
        const mapped = apiLocations
          .filter((loc) => loc.direccion)
          .map((loc) => ({
            id: loc.id || loc.id_ubicacion,
            label: loc.nombre || loc.tipo || "Otro",
            type: loc.tipo || "other",
            address: loc.direccion,
            coords: loc.latitud
              ? {
                  latitude: Number(loc.latitud),
                  longitude: Number(loc.longitud),
                }
              : null,
          }));
        setSavedLocations(mapped);
      }
    } catch (e) {
      console.log("Error al cargar ubicaciones guardadas:", e);
    }
  }, [user?.id]);

  const handleQuickSelectLocation = (location) => {
    const placeData = {
      name: location.label,
      address: location.address,
      latitude: location.coords?.latitude,
      longitude: location.coords?.longitude,
    };
    if (!originText) {
      setOriginPlace(placeData);
      setOriginText(location.address);
    } else if (!destText) {
      setDestPlace(placeData);
      setDestText(location.address);
    } else {
      setOriginPlace(placeData);
      setOriginText(location.address);
      setDestPlace(null);
      setDestText("");
    }
  };

  const handleDeleteRecentSearch = async (id, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s.id !== id);
    setRecentSearches(updated);
  };

  const handleSelectRecentSearch = (search) => {
    setOriginText(search.origin || "");
    setOriginPlace(
      search.originLat
        ? {
            name: search.origin,
            address: search.origin,
            latitude: search.originLat,
            longitude: search.originLng,
          }
        : null,
    );
    setDestText(search.destination || "");
    setDestPlace(
      search.destLat
        ? {
            name: search.destination,
            address: search.destination,
            latitude: search.destLat,
            longitude: search.destLng,
          }
        : null,
    );
    const searchDate = search.date || "";
    setSelectedDate(
      searchDate && searchDate >= todayStr ? searchDate : todayStr,
    );
  };

  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      loadSavedLocations();
      if (initialParams) {
        setOriginText(initialParams.origin || "");
        setOriginPlace(initialParams.originPlace || null);
        setDestText(initialParams.destination || "");
        setDestPlace(initialParams.destPlace || null);
        setSelectedDate(initialParams.date || "");
      }
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialParams]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSearch = () => {
    const params = {
      origin: originPlace?.address || originText,
      destination: destPlace?.address || destText,
      date: selectedDate || new Date().toISOString().split("T")[0],
      passengers: 1,
    };
    onSearch(params);
    handleClose();
  };

  const handleNativeDateChange = (event, date) => {
    setShowNativeDatePicker(false);
    if (event.type === "set" && date) {
      setSelectedDate(date.toISOString().split("T")[0]);
    }
  };

  const dateLabel = () => {
    if (!selectedDate) return "Hoy";
    if (selectedDate === todayStr) return "Hoy";
    if (selectedDate === tomorrowStr) return "Mañana";
    const d = new Date(selectedDate);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  const canSearch = (originPlace || originText) && (destPlace || destText);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Buscar trayecto</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color={COLORS.gray600} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.formContainer}
          >
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Origen */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Navigation
                    size={18}
                    color={COLORS.success}
                    strokeWidth={2.5}
                  />
                </View>
                <TouchableOpacity
                  style={styles.fakeInput}
                  onPress={() => setActiveSelectType("origin")}
                >
                  <Text
                    style={[
                      styles.fakeInputText,
                      originText && styles.fakeInputTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {originText || "Selecciona tu origen"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Destino */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MapPin size={18} color={COLORS.error} strokeWidth={2.5} />
                </View>
                <TouchableOpacity
                  style={styles.fakeInput}
                  onPress={() => setActiveSelectType("destination")}
                >
                  <Text
                    style={[
                      styles.fakeInputText,
                      destText && styles.fakeInputTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {destText || "Selecciona tu destino"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ubicaciones guardadas — accès rápido */}
              {savedLocations.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.savedLocationsRow}
                  contentContainerStyle={styles.savedLocationsContent}
                >
                  {savedLocations.map((loc) => {
                    const Icon = SavedIconMap[loc.type] || MapPin;
                    return (
                      <TouchableOpacity
                        key={loc.id}
                        style={styles.savedLocationChip}
                        onPress={() => handleQuickSelectLocation(loc)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          size={14}
                          color={COLORS.primary}
                          strokeWidth={2.5}
                        />
                        <Text
                          style={styles.savedLocationLabel}
                          numberOfLines={1}
                        >
                          {loc.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Fecha — chips horizontales */}
              <Text style={styles.sectionLabel}>Fecha</Text>
              <View style={styles.dateChipsRow}>
                {datePresets.map((preset) => {
                  const isActive = (selectedDate || todayStr) === preset.value;
                  return (
                    <TouchableOpacity
                      key={preset.value}
                      style={[
                        styles.dateChip,
                        isActive && styles.dateChipActive,
                      ]}
                      onPress={() => setSelectedDate(preset.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateChipLabel,
                          isActive && styles.dateChipLabelActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                      <Text
                        style={[
                          styles.dateChipSub,
                          isActive && styles.dateChipSubActive,
                        ]}
                      >
                        {preset.sublabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.dateChipMore}
                  onPress={() => setShowNativeDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Calendar
                    size={18}
                    color={COLORS.gray600}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.dateChipMoreText}>Más</Text>
                </TouchableOpacity>
              </View>

              {selectedDate &&
                !datePresets.some((p) => p.value === selectedDate) && (
                  <View style={styles.customDateRow}>
                    <Calendar
                      size={14}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.customDateText}>{dateLabel()}</Text>
                    <TouchableOpacity onPress={() => setSelectedDate("")}>
                      <X size={14} color={COLORS.gray400} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}

              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionLabel}>Búsquedas recientes</Text>
                  {recentSearches.map((search) => (
                    <TouchableOpacity
                      key={search.id}
                      style={styles.recentItem}
                      onPress={() => handleSelectRecentSearch(search)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recentIcon}>
                        <Clock
                          size={16}
                          color={COLORS.primary}
                          strokeWidth={2.5}
                        />
                      </View>
                      <View style={styles.recentTextContainer}>
                        <Text style={styles.recentRoute} numberOfLines={1}>
                          {search.origin} → {search.destination}
                        </Text>
                        {search.date && (
                          <Text style={styles.recentDate} numberOfLines={1}>
                            {search.date}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.recentDelete}
                        onPress={(e) => handleDeleteRecentSearch(search.id, e)}
                      >
                        <Trash2
                          size={16}
                          color={COLORS.gray400}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Botón buscar */}
            <TouchableOpacity
              style={[
                styles.searchButton,
                !canSearch && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={!canSearch}
            >
              <Search size={20} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* Selector de ubicación (slide secundario) */}
      <LocationSelectSheet
        visible={activeSelectType !== null}
        onClose={() => setActiveSelectType(null)}
        title={
          activeSelectType === "origin"
            ? "Selecciona tu origen"
            : "Selecciona tu destino"
        }
        onSelect={(location) => {
          if (activeSelectType === "origin") {
            setOriginPlace(location);
            setOriginText(location.address);
          } else {
            setDestPlace(location);
            setDestText(location.address);
          }
        }}
      />

      {/* Native date picker */}
      {showNativeDatePicker && (
        <DateTimePicker
          value={
            selectedDate ? new Date(selectedDate + "T00:00:00") : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={new Date()}
          onChange={handleNativeDateChange}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    ...SHADOWS.large,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    alignSelf: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  savedLocationsRow: {
    marginBottom: SPACING.md,
  },
  savedLocationsContent: {
    gap: SPACING.xs,
    paddingRight: SPACING.md,
  },
  savedLocationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  savedLocationLabel: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  fakeInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
  },
  fakeInputText: {
    fontSize: FONTS.md,
    color: COLORS.gray400,
  },
  fakeInputTextActive: {
    color: COLORS.gray800,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  dateChipsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dateChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  dateChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  dateChipLabel: {
    fontSize: FONTS.sm,
    fontWeight: "bold",
    color: COLORS.gray600,
  },
  dateChipLabelActive: {
    color: COLORS.primary,
  },
  dateChipSub: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },
  dateChipSubActive: {
    color: COLORS.primaryDark,
  },
  dateChipMore: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    gap: 2,
  },
  dateChipMoreText: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  customDateText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.primaryDark,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: FONTS.md,
  },
  recentSection: {
    marginTop: SPACING.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray50,
    marginBottom: SPACING.xs,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentRoute: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  recentDate: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  recentDelete: {
    padding: SPACING.xs,
  },
});

export default SearchBottomSheet;
