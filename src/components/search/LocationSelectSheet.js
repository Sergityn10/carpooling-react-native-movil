// YouConnext - LocationSelectSheet Component
import React, { useState, useEffect, useRef, useMemo } from "react";
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
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;

const DEFAULT_SAVED_PLACES = [
  { id: "casa", label: "Casa", iconName: "Home", address: "", isCustom: true },
  {
    id: "universidad",
    label: "Universidad",
    iconName: "BookOpen",
    address: "",
    isCustom: true,
  },
  {
    id: "trabajo",
    label: "Trabajo",
    iconName: "Briefcase",
    address: "",
    isCustom: true,
  },
  {
    id: "gimnasio",
    label: "Gimnasio",
    iconName: "Dumbbell",
    address: "",
    isCustom: true,
  },
];

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
  const [savedPlaces, setSavedPlaces] = useState(DEFAULT_SAVED_PLACES);
  const [recentPlaces, setRecentPlaces] = useState([]);
  const [isAddingPlace, setIsAddingPlace] = useState(null); // Almacena el ID del slot que estamos editando

  const { getUbicacionActual } = useViaje();
  const { user } = useUser();
  const requestIdRef = useRef(0);

  // Mapeo seguro de componentes de iconos de lucide-react-native
  const IconMap = {
    Home: Home,
    BookOpen: BookOpen,
    Briefcase: Briefcase,
    Dumbbell: Dumbbell,
  };

  const IconNameMap = {
    home: "Home",
    work: "Briefcase",
    university: "BookOpen",
    gym: "Dumbbell",
    other: "MapPin",
  };

  const SafeIconComp = ({ iconName, ...props }) => {
    const Component = IconMap[iconName] || MapPin;
    if (!Component) return <MapPin {...props} />;
    return <Component {...props} />;
  };

  // Cargar lugares guardados y recientes desde AsyncStorage
  useEffect(() => {
    if (visible) {
      loadData();
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
  }, [visible]);

  const loadData = async () => {
    try {
      // Cargar ubicaciones guardadas del API
      if (user?.id) {
        try {
          const res = await ubicacionTravelService.obtenerUbicacionesPorUsuario(
            user.id,
          );
          const apiLocations = res.data || res.ubicaciones || res || [];
          if (Array.isArray(apiLocations) && apiLocations.length > 0) {
            const mapped = apiLocations.map((loc) => ({
              id: loc.id || loc.id_ubicacion,
              label: loc.nombre || loc.tipo || "Otro",
              iconName: IconNameMap[loc.tipo] || "MapPin",
              address: loc.direccion || "",
              coords: loc.latitud
                ? {
                    latitude: Number(loc.latitud),
                    longitude: Number(loc.longitud),
                  }
                : null,
              isCustom: false,
              tipo: loc.tipo,
            }));
            setSavedPlaces(mapped);
          }
        } catch (e) {
          console.log("Error al cargar ubicaciones del API:", e);
        }
      }

      // Cargar recientes desde AsyncStorage
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
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSearchQuery("");
      setPredictions([]);
      setIsAddingPlace(null);
      onClose();
    });
  };

  // Buscar en Google Places
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

  // Manejar selección de una predicción de Google
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

      if (isAddingPlace) {
        // Guardar la dirección en el slot correspondiente
        const updated = savedPlaces.map((p) =>
          p.id === isAddingPlace
            ? {
                ...p,
                address: location.address,
                coords: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
              }
            : p,
        );
        setSavedPlaces(updated);
        await AsyncStorage.setItem("saved_places", JSON.stringify(updated));
        setIsAddingPlace(null);
        setSearchQuery("");
      } else {
        // Añadir a recientes
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
      }
    } catch (e) {
      console.log("Error al obtener detalles del lugar:", e);
    } finally {
      setLoading(false);
    }
  };

  // Obtener Ubicación Actual
  const handleSelectCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await getUbicacionActual();

      // Obtener dirección real mediante Reverse Geocoding
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

  // Seleccionar un lugar guardado
  const handleSelectSavedPlace = (place) => {
    if (!place.address) {
      // Activar modo "Agregar dirección"
      setIsAddingPlace(place.id);
      return;
    }
    onSelect({
      name: place.label,
      address: place.address,
      latitude: place.coords?.latitude,
      longitude: place.coords?.longitude,
    });
    handleClose();
  };

  // Eliminar dirección de un slot guardado
  const handleDeleteSavedAddress = async (id, e) => {
    e.stopPropagation();
    const updated = savedPlaces.map((p) =>
      p.id === id ? { ...p, address: "" } : p,
    );
    setSavedPlaces(updated);
    await AsyncStorage.setItem("saved_places", JSON.stringify(updated));
  };

  // Eliminar de recientes
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
            <Text style={styles.title}>
              {isAddingPlace
                ? `Guardar dirección para ${savedPlaces.find((p) => p.id === isAddingPlace)?.label}`
                : title}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color={COLORS.gray600} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Buscador */}
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
                placeholder={
                  isAddingPlace
                    ? "Introduce la dirección..."
                    : "Buscar dirección"
                }
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

          {/* Contenido / Listado */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.listContainer}
          >
            {searchQuery.trim().length >= 2 ? (
              // Modo búsqueda (Predicciones)
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => handleSelectPrediction(item)}
                  >
                    <View style={styles.iconContainerPurple}>
                      <MapPin
                        size={18}
                        color={COLORS.primary}
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
              // Modo lista por defecto (como en la foto del usuario)
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* 1. Ubicación Actual (solo si no estamos añadiendo dirección a un slot) */}
                {!isAddingPlace && (
                  <TouchableOpacity
                    style={styles.rowItem}
                    onPress={handleSelectCurrentLocation}
                  >
                    <View style={styles.iconContainerPink}>
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
                )}

                {/* 2. Ubicaciones Guardadas */}
                {savedPlaces.map((place) => {
                  return (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.rowItem}
                      onPress={() => handleSelectSavedPlace(place)}
                    >
                      <View
                        style={[
                          styles.iconContainerPink,
                          !place.address && styles.iconContainerGray,
                        ]}
                      >
                        <SafeIconComp
                          iconName={place.iconName}
                          size={18}
                          color={
                            place.address ? COLORS.primary : COLORS.gray500
                          }
                          strokeWidth={2.5}
                        />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.rowTitle}>{place.label}</Text>
                        <Text
                          style={[
                            styles.rowSubtitle,
                            !place.address && styles.addAddressText,
                          ]}
                        >
                          {place.address || "Agregar dirección"}
                        </Text>
                      </View>
                      {!!place.address && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => handleDeleteSavedAddress(place.id, e)}
                        >
                          <X
                            size={16}
                            color={COLORS.gray400}
                            strokeWidth={2.5}
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Divider si hay recientes */}
                {recentPlaces.length > 0 && <View style={styles.divider} />}

                {/* 3. Recientes */}
                {recentPlaces.map((place, index) => (
                  <TouchableOpacity
                    key={`recent-${index}`}
                    style={styles.rowItem}
                    onPress={() => {
                      onSelect(place);
                      handleClose();
                    }}
                  >
                    <View style={styles.iconContainerPink}>
                      <Clock
                        size={18}
                        color={COLORS.primary}
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
                      <X size={16} color={COLORS.gray400} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
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
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray50,
  },
  iconContainerPink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FCE7F3", // Rosa clarito como en la captura
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  iconContainerPurple: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE", // Azul clarito
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  iconContainerGray: {
    backgroundColor: COLORS.gray100,
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  rowSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  addAddressText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.sm,
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
  errorText: {
    marginTop: SPACING.xs,
    color: COLORS.error,
    fontSize: FONTS.xs,
  },
});

export default LocationSelectSheet;
