// YouConnext - SearchBottomSheet Component (Fixed Modal Layout & Pro UI/UX)
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  X,
  Search,
  MapPin,
  Calendar,
  Clock,
  Trash2,
  ArrowUpDown,
  Users,
  Plus,
  Minus,
  Home,
  Briefcase,
  BookOpen,
  Dumbbell,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import LocationSelectSheet from "./LocationSelectSheet";
import { useUser } from "../../context/UserContext";
import { ubicacionTravelService } from "../../services/travels/ubicacionService";
import { trayectoService } from "../../services/travels/trayectoService";

const MAX_RECENT_SEARCHES = 5;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.82, 680);

const SavedIconMap = {
  home: Home,
  work: Briefcase,
  university: BookOpen,
  gym: Dumbbell,
  other: MapPin,
};

const SearchBottomSheet = ({ visible, onClose, onSearch, initialParams }) => {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(SHEET_HEIGHT));
  const [originText, setOriginText] = useState("");
  const [originPlace, setOriginPlace] = useState(null);
  const [destText, setDestText] = useState("");
  const [destPlace, setDestPlace] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [passengers, setPassengers] = useState(1);
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
          passengers: item.passengers || 1,
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
      const apiLocations = Array.isArray(res)
        ? res
        : res?.data || res?.ubicaciones || [];
      if (Array.isArray(apiLocations)) {
        const mapped = apiLocations
          .filter((loc) => loc && (loc.address || loc.direccion || loc.display_name))
          .map((loc) => {
            const typeKey = (loc.type || loc.tipo || "other").toLowerCase();
            const latVal = loc.lat ?? loc.latitud ?? loc.latitude;
            const lngVal = loc.lng ?? loc.longitud ?? loc.longitude;
            return {
              id: loc.id || loc.id_ubicacion || String(Math.random()),
              label: loc.display_name || loc.nombre || loc.type || "Otro",
              type: typeKey,
              address: loc.address || loc.direccion || "",
              city: loc.city || loc.ciudad || "",
              coords:
                latVal != null && lngVal != null
                  ? {
                      latitude: Number(latVal),
                      longitude: Number(lngVal),
                    }
                  : null,
            };
          });
        setSavedLocations(mapped);
      }
    } catch (e) {
      console.log("Error al cargar ubicaciones guardadas:", e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      loadSavedLocations();
      if (initialParams) {
        setOriginText(initialParams.origin || "");
        setOriginPlace(initialParams.originPlace || null);
        setDestText(initialParams.destination || "");
        setDestPlace(initialParams.destPlace || null);
        setSelectedDate(initialParams.date || todayStr);
        setPassengers(initialParams.passengers || 1);
      } else if (!selectedDate) {
        setSelectedDate(todayStr);
      }
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 14,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialParams]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSwapRoute = () => {
    const tempText = originText;
    const tempPlace = originPlace;
    setOriginText(destText);
    setOriginPlace(destPlace);
    setDestText(tempText);
    setDestPlace(tempPlace);
  };

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
    } else {
      setDestPlace(placeData);
      setDestText(location.address);
    }
  };

  const handleDeleteRecentSearch = async (id, e) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((s) => s.id !== id));
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
    if (search.passengers) setPassengers(search.passengers);
  };

  const handleSearch = () => {
    const params = {
      origin: originPlace?.address || originText,
      destination: destPlace?.address || destText,
      date: selectedDate || todayStr,
      passengers,
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
    if (!selectedDate || selectedDate === todayStr) return "Hoy";
    if (selectedDate === tomorrowStr) return "Mañana";
    const d = new Date(selectedDate);
    return d.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const canSearch = Boolean(originPlace || originText || destPlace || destText);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop tap para cerrar */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.backdrop} />
        </TouchableOpacity>

        {/* Contenedor del desplegable */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom:
                insets.bottom > 0 ? insets.bottom + SPACING.xs : SPACING.lg,
            },
          ]}
        >
          {/* Barra superior de agarre */}
          <View style={styles.handleBar} />

          {/* Cabecera */}
          <View style={styles.header}>
            <Text style={styles.title}>Buscar trayecto</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={18} color={COLORS.gray600} strokeWidth={2.5} />
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
              contentContainerStyle={styles.scrollContent}
            >
              {/* Tarjeta de ruta (Origen + Destino + Intercambiador) */}
              <View style={styles.routeCard}>
                <View style={styles.routeTimeline}>
                  <View
                    style={[styles.dot, { backgroundColor: COLORS.success }]}
                  />
                  <View style={styles.line} />
                  <View
                    style={[styles.dot, { backgroundColor: COLORS.error }]}
                  />
                </View>

                <View style={styles.routeInputs}>
                  {/* Origen */}
                  <TouchableOpacity
                    style={styles.routeInputRow}
                    onPress={() => setActiveSelectType("origin")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.routeInputContent}>
                      <Text style={styles.inputLabel}>Origen</Text>
                      <Text
                        style={[
                          styles.inputText,
                          !originText && styles.placeholderText,
                        ]}
                        numberOfLines={1}
                      >
                        {originText || "¿Desde dónde sales?"}
                      </Text>
                    </View>
                    {originText ? (
                      <TouchableOpacity
                        onPress={() => {
                          setOriginText("");
                          setOriginPlace(null);
                        }}
                        style={styles.clearBtn}
                      >
                        <X size={14} color={COLORS.gray400} strokeWidth={2.5} />
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>

                  <View style={styles.inputDivider} />

                  {/* Destino */}
                  <TouchableOpacity
                    style={styles.routeInputRow}
                    onPress={() => setActiveSelectType("destination")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.routeInputContent}>
                      <Text style={styles.inputLabel}>Destino</Text>
                      <Text
                        style={[
                          styles.inputText,
                          !destText && styles.placeholderText,
                        ]}
                        numberOfLines={1}
                      >
                        {destText || "¿A dónde quieres ir?"}
                      </Text>
                    </View>
                    {destText ? (
                      <TouchableOpacity
                        onPress={() => {
                          setDestText("");
                          setDestPlace(null);
                        }}
                        style={styles.clearBtn}
                      >
                        <X size={14} color={COLORS.gray400} strokeWidth={2.5} />
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                </View>

                {/* Botón Invertir Ruta */}
                <TouchableOpacity
                  style={styles.swapButton}
                  onPress={handleSwapRoute}
                  activeOpacity={0.8}
                  hitSlop={8}
                >
                  <ArrowUpDown
                    size={16}
                    color={COLORS.primary}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>

              {/* Lugares guardados */}
              {savedLocations.length > 0 && (
                <View style={styles.savedSection}>
                  <Text style={styles.sectionTitle}>Ubicaciones guardadas</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.savedRow}
                  >
                    {savedLocations.map((loc) => {
                      const Icon = SavedIconMap[loc.type] || MapPin;
                      return (
                        <TouchableOpacity
                          key={loc.id}
                          style={styles.savedChip}
                          onPress={() => handleQuickSelectLocation(loc)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.savedIconChip}>
                            <Icon
                              size={13}
                              color={COLORS.primary}
                              strokeWidth={2.5}
                            />
                          </View>
                          <Text
                            style={styles.savedChipText}
                            numberOfLines={1}
                          >
                            {loc.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Selector de Fecha */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>¿Cuándo viajas?</Text>
                <View style={styles.dateRow}>
                  {datePresets.map((preset) => {
                    const isActive =
                      (selectedDate || todayStr) === preset.value;
                    return (
                      <TouchableOpacity
                        key={preset.value}
                        style={[
                          styles.datePresetCard,
                          isActive && styles.datePresetCardActive,
                        ]}
                        onPress={() => setSelectedDate(preset.value)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.datePresetLabel,
                            isActive && styles.datePresetTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                        <Text
                          style={[
                            styles.datePresetSub,
                            isActive && styles.datePresetSubActive,
                          ]}
                        >
                          {preset.sublabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.dateMoreBtn}
                    onPress={() => setShowNativeDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Calendar
                      size={18}
                      color={COLORS.gray700}
                      strokeWidth={2.2}
                    />
                    <Text style={styles.dateMoreText}>
                      {selectedDate &&
                      !datePresets.some((p) => p.value === selectedDate)
                        ? dateLabel()
                        : "Otra"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Selector de Pasajeros */}
              <View style={styles.section}>
                <View style={styles.passengerCard}>
                  <View style={styles.passengerInfo}>
                    <View style={styles.passengerIconBox}>
                      <Users
                        size={18}
                        color={COLORS.primary}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View>
                      <Text style={styles.passengerTitle}>Pasajeros</Text>
                      <Text style={styles.passengerSubtitle}>
                        {passengers === 1
                          ? "1 plaza"
                          : `${passengers} plazas`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={[
                        styles.counterBtn,
                        passengers <= 1 && styles.counterBtnDisabled,
                      ]}
                      onPress={() =>
                        setPassengers((p) => Math.max(1, p - 1))
                      }
                      disabled={passengers <= 1}
                      activeOpacity={0.8}
                    >
                      <Minus
                        size={16}
                        color={
                          passengers <= 1 ? COLORS.gray300 : COLORS.gray800
                        }
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{passengers}</Text>
                    <TouchableOpacity
                      style={[
                        styles.counterBtn,
                        passengers >= 8 && styles.counterBtnDisabled,
                      ]}
                      onPress={() =>
                        setPassengers((p) => Math.min(8, p + 1))
                      }
                      disabled={passengers >= 8}
                      activeOpacity={0.8}
                    >
                      <Plus
                        size={16}
                        color={
                          passengers >= 8 ? COLORS.gray300 : COLORS.gray800
                        }
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
                  {recentSearches.map((search) => (
                    <TouchableOpacity
                      key={search.id}
                      style={styles.recentItem}
                      onPress={() => handleSelectRecentSearch(search)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.recentIconBox}>
                        <Clock
                          size={15}
                          color={COLORS.primary}
                          strokeWidth={2.2}
                        />
                      </View>
                      <View style={styles.recentTexts}>
                        <Text style={styles.recentRoute} numberOfLines={1}>
                          {search.origin || "Origen"} →{" "}
                          {search.destination || "Destino"}
                        </Text>
                        {search.date && (
                          <Text style={styles.recentDate} numberOfLines={1}>
                            {search.date}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.recentDeleteBtn}
                        onPress={(e) => handleDeleteRecentSearch(search.id, e)}
                        hitSlop={8}
                      >
                        <Trash2
                          size={15}
                          color={COLORS.gray400}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Botón Buscar Trayectos */}
            <View style={styles.footerAction}>
              <TouchableOpacity
                style={[
                  styles.searchBtn,
                  !canSearch && styles.searchBtnDisabled,
                ]}
                onPress={handleSearch}
                disabled={!canSearch}
                activeOpacity={0.88}
              >
                <Search size={20} color={COLORS.white} strokeWidth={2.5} />
                <Text style={styles.searchBtnText}>Buscar trayectos</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* Selector de ubicación secundario */}
      <LocationSelectSheet
        visible={activeSelectType !== null}
        onClose={() => setActiveSelectType(null)}
        title={
          activeSelectType === "origin"
            ? "Selecciona origen"
            : "Selecciona destino"
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

      {/* Date picker nativo */}
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.large,
  },
  handleBar: {
    width: 36,
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
    fontSize: FONTS.xl,
    lineHeight: 26,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.md,
  },
  // Route Card
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.md,
    position: "relative",
    marginBottom: SPACING.md,
  },
  routeTimeline: {
    alignItems: "center",
    marginRight: SPACING.md,
    paddingVertical: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    height: 28,
    backgroundColor: COLORS.gray300,
    marginVertical: 3,
  },
  routeInputs: {
    flex: 1,
    paddingRight: SPACING.lg,
  },
  routeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  routeInputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputText: {
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "700",
    color: COLORS.gray900,
    marginTop: 2,
  },
  placeholderText: {
    color: COLORS.gray400,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  inputDivider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.xs,
  },
  swapButton: {
    position: "absolute",
    right: SPACING.md,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  // Saved section
  savedSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  savedRow: {
    gap: SPACING.sm,
  },
  savedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  savedIconChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  savedChipText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  // Dates
  section: {
    marginBottom: SPACING.md,
  },
  dateRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  datePresetCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  datePresetCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  datePresetLabel: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.gray800,
  },
  datePresetTextActive: {
    color: COLORS.primaryDark,
  },
  datePresetSub: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
    color: COLORS.gray400,
    marginTop: 2,
  },
  datePresetSubActive: {
    color: COLORS.primaryDark,
  },
  dateMoreBtn: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    gap: 2,
  },
  dateMoreText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  // Passenger
  passengerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.md,
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  passengerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  passengerTitle: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  passengerSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    marginTop: 1,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnDisabled: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
  },
  counterValue: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.gray900,
    minWidth: 20,
    textAlign: "center",
  },
  // Recents
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray50,
    marginBottom: SPACING.xs,
  },
  recentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  recentTexts: {
    flex: 1,
  },
  recentRoute: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  recentDate: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray400,
    marginTop: 1,
  },
  recentDeleteBtn: {
    padding: 6,
  },
  // Footer Button
  footerAction: {
    paddingTop: SPACING.xs,
  },
  searchBtn: {
    minHeight: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  searchBtnDisabled: {
    backgroundColor: COLORS.gray300,
  },
  searchBtnText: {
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "800",
    color: COLORS.white,
  },
});

export default SearchBottomSheet;
