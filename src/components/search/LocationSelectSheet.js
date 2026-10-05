// YouConnext - LocationSelectSheet Component
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  X,
  Search as SearchIcon,
  Navigation,
  Home,
  BookOpen,
  Briefcase,
  Dumbbell,
  Clock,
  MapPin,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import {
  autocompletePlaces,
  getPlaceDetails,
  reverseGeocode,
} from "../../services/googlePlaces";
import { useViaje } from "../../context/ViajeContext";
import { useUser } from "../../context/UserContext";
import { ubicacionTravelService } from "../../services/travels/ubicacionService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

const TYPE_CONFIG = {
  home: {
    label: "Casa",
    Icon: Home,
    color: COLORS.primary,
    bg: COLORS.primarySoft,
  },
  work: {
    label: "Trabajo",
    Icon: Briefcase,
    color: COLORS.secondary,
    bg: COLORS.secondarySoft,
  },
  university: {
    label: "Universidad",
    Icon: BookOpen,
    color: COLORS.accent,
    bg: COLORS.accentSoft,
  },
  gym: {
    label: "Gimnasio",
    Icon: Dumbbell,
    color: COLORS.warning,
    bg: COLORS.warningSoft,
  },
  other: {
    label: "Otro",
    Icon: MapPin,
    color: COLORS.gray600,
    bg: COLORS.gray100,
  },
};

const LocationSelectSheet = ({
  visible,
  onClose,
  onSelect,
  title = "Selecciona ubicación",
}) => {
  const [slideAnim] = useState(new Animated.Value(SHEET_HEIGHT));
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [recentPlaces, setRecentPlaces] = useState([]);

  const { getUbicacionActual } = useViaje();
  const { user } = useUser();
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (visible) {
      loadData();
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
  }, [visible]);

  const loadData = async () => {
    try {
      if (user?.id) {
        try {
          setLoadingSaved(true);
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
                const typeCfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.other;
                const latVal = loc.lat ?? loc.latitud ?? loc.latitude;
                const lngVal = loc.lng ?? loc.longitud ?? loc.longitude;
                return {
                  id: loc.id || loc.id_ubicacion || String(Math.random()),
                  label: loc.display_name || loc.nombre || typeCfg.label,
                  address: loc.address || loc.direccion || "",
                  city: loc.city || loc.ciudad || "",
                  type: typeKey,
                  typeLabel: typeCfg.label,
                  Icon: typeCfg.Icon,
                  color: typeCfg.color,
                  bg: typeCfg.bg,
                  coords:
                    latVal != null && lngVal != null
                      ? {
                          latitude: Number(latVal),
                          longitude: Number(lngVal),
                        }
                      : null,
                };
              });
            setSavedPlaces(mapped);
          }
        } catch (e) {
          console.log("Error al cargar ubicaciones del API:", e);
        } finally {
          setLoadingSaved(false);
        }
      }

      const recents = await AsyncStorage.getItem("recent_places");
      if (recents) {
        setRecentPlaces(JSON.parse(recents));
      }
    } catch (e) {
      console.log("Error al cargar ubicaciones:", e);
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSearchQuery("");
      setPredictions([]);
      onClose();
    });
  };

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setPredictions([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const items = await autocompletePlaces({ input: trimmed });
        if (requestIdRef.current !== requestId) return;
        setPredictions(items);
      } catch (e) {
        if (requestIdRef.current !== requestId) return;
        setPredictions([]);
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleSelectPrediction = async (prediction) => {
    try {
      setLoading(true);
      const details = await getPlaceDetails({ placeId: prediction.place_id });
      const location = {
        name: details.name || prediction.structured_formatting?.main_text,
        address: details.address || prediction.description,
        latitude: details.latitude,
        longitude: details.longitude,
      };

      const updatedRecents = [
        location,
        ...recentPlaces.filter((p) => p.address !== location.address),
      ].slice(0, 5);
      setRecentPlaces(updatedRecents);
      await AsyncStorage.setItem(
        "recent_places",
        JSON.stringify(updatedRecents),
      );

      onSelect(location);
      handleClose();
    } catch (e) {
      console.log("Error al obtener detalles del lugar:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await getUbicacionActual();

      const result = await reverseGeocode({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      onSelect(result);
      handleClose();
    } catch (e) {
      console.log("Error al obtener gps:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSavedPlace = (place) => {
    if (!place.address) return;
    onSelect({
      name: place.label || place.address,
      address: place.address,
      city: place.city,
      latitude: place.coords?.latitude,
      longitude: place.coords?.longitude,
    });
    handleClose();
  };

  const handleDeleteRecent = async (address, e) => {
    e.stopPropagation();
    const updated = recentPlaces.filter((p) => p.address !== address);
    setRecentPlaces(updated);
    await AsyncStorage.setItem("recent_places", JSON.stringify(updated));
  };

  if (!visible) return null;

  return (
    <View style={styles.absoluteContainer}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
          activeOpacity={1}
        >
          <View style={styles.backdrop} />
        </TouchableOpacity>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={18} color={COLORS.gray600} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <SearchIcon
                size={18}
                color={COLORS.gray400}
                strokeWidth={2.5}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar dirección o ciudad..."
                placeholderTextColor={COLORS.gray400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {loading && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={styles.loader}
                />
              )}
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.listContainer}
          >
            {searchQuery.trim().length >= 2 ? (
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => handleSelectPrediction(item)}
                  >
                    <View style={styles.iconContainerBlue}>
                      <MapPin
                        size={18}
                        color={COLORS.secondary}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View style={styles.predictionTextContainer}>
                      <Text style={styles.predictionMainText} numberOfLines={1}>
                        {item.structured_formatting?.main_text ||
                          item.description}
                      </Text>
                      <Text style={styles.predictionSubText} numberOfLines={1}>
                        {item.structured_formatting?.secondary_text ||
                          item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Opción de GPS / Ubicación actual */}
                <TouchableOpacity
                  style={styles.rowItem}
                  onPress={handleSelectCurrentLocation}
                >
                  <View style={styles.iconContainerGreen}>
                    <Navigation
                      size={18}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.rowTitle}>Ubicación actual</Text>
                    <Text style={styles.rowSubtitle}>
                      Mi ubicación GPS en tiempo real
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Ubicaciones guardadas del usuario */}
                {savedPlaces.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderTitle}>
                      Ubicaciones guardadas
                    </Text>
                    {savedPlaces.map((place) => {
                      const IconComp = place.Icon || MapPin;
                      return (
                        <TouchableOpacity
                          key={place.id}
                          style={styles.rowItem}
                          onPress={() => handleSelectSavedPlace(place)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.iconContainerSaved,
                              { backgroundColor: place.bg || COLORS.primarySoft },
                            ]}
                          >
                            <IconComp
                              size={18}
                              color={place.color || COLORS.primary}
                              strokeWidth={2.5}
                            />
                          </View>
                          <View style={styles.textContainer}>
                            <View style={styles.savedTitleRow}>
                              <Text style={styles.rowTitle}>{place.label}</Text>
                              {place.typeLabel && (
                                <View style={styles.typeBadge}>
                                  <Text style={styles.typeBadgeText}>
                                    {place.typeLabel}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text
                              style={styles.rowSubtitle}
                              numberOfLines={1}
                            >
                              {place.address}
                              {place.city ? `, ${place.city}` : ""}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {loadingSaved && (
                  <View style={styles.loadingSavedContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingSavedText}>
                      Cargando tus ubicaciones...
                    </Text>
                  </View>
                )}

                {/* Búsquedas recientes */}
                {recentPlaces.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderTitle}>Recientes</Text>
                    {recentPlaces.map((place, index) => (
                      <TouchableOpacity
                        key={`recent-${index}`}
                        style={styles.rowItem}
                        onPress={() => {
                          onSelect(place);
                          handleClose();
                        }}
                      >
                        <View style={styles.iconContainerRecent}>
                          <Clock
                            size={18}
                            color={COLORS.gray600}
                            strokeWidth={2.5}
                          />
                        </View>
                        <View style={styles.textContainer}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {place.name}
                          </Text>
                          <Text style={styles.rowSubtitle} numberOfLines={1}>
                            {place.address}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => handleDeleteRecent(place.address, e)}
                        >
                          <X
                            size={16}
                            color={COLORS.gray400}
                            strokeWidth={2.5}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    elevation: 2000,
  },
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
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
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
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    marginBottom: SPACING.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.md,
    color: COLORS.gray800,
    height: "100%",
  },
  loader: {
    marginLeft: SPACING.sm,
  },
  listContainer: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: SPACING.md,
  },
  sectionHeaderTitle: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  iconContainerGreen: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  iconContainerSaved: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  iconContainerRecent: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  iconContainerBlue: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  savedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  typeBadge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  rowTitle: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  rowSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  loadingSavedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  loadingSavedText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray50,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  predictionSubText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
});

export default LocationSelectSheet;
