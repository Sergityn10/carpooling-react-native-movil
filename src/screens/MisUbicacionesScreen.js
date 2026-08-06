// YouConnext - Mis Ubicaciones Screen
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import {
  ChevronLeft,
  MapPin,
  Home,
  Briefcase,
  BookOpen,
  Dumbbell,
  Plus,
  Pencil,
  Trash2,
  X,
  Crosshair,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { useViaje } from "../context/ViajeContext";
import { ubicacionTravelService } from "../services/travels/ubicacionService";
import {
  autocompletePlaces,
  getPlaceDetails,
  reverseGeocode,
} from "../services/googlePlaces";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";

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

const getTypeConfig = (type) => {
  const key = (type || "other").toLowerCase();
  return TYPE_CONFIG[key] || TYPE_CONFIG.other;
};

const DEFAULT_REGION = {
  latitude: 40.4168,
  longitude: -3.7038,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MisUbicacionesScreen = ({ navigation }) => {
  const { user } = useUser();
  const { getUbicacionActual } = useViaje();

  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerStep, setPickerStep] = useState("details");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [mapRegion, setMapRegion] = useState(null);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const mapRef = useRef(null);
  const reverseTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    display_name: "",
    address: "",
    type: "home",
    lat: null,
    lng: null,
    city: "",
    province: "",
    country: "",
    postal_code: "",
  });

  const fetchUbicaciones = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await ubicacionTravelService.obtenerUbicacionesPorUsuario(
        user.id,
      );
      setUbicaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error);
      Alert.alert("Error", "No se pudieron cargar tus ubicaciones.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUbicaciones();
  }, [fetchUbicaciones]);

  // Search predictions
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setPredictions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const items = await autocompletePlaces({ input: trimmed });
        setPredictions(items);
      } catch {
        setPredictions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openAddModal = async () => {
    setEditingId(null);
    setFormData({
      display_name: "",
      address: "",
      type: "home",
      lat: null,
      lng: null,
      city: "",
      province: "",
      country: "",
      postal_code: "",
    });
    setSearchQuery("");
    setPredictions([]);
    setSelectedCoords(null);
    setSelectedAddress("");
    setMapRegion(DEFAULT_REGION);
    setPickerStep("details");
    setModalVisible(true);
    try {
      const location = await getUbicacionActual();
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch {
      // Se mantiene el DEFAULT_REGION si no se puede obtener la ubicación
    }
  };

  const openEditModal = (ubic) => {
    setEditingId(ubic.id);
    setFormData({
      display_name: ubic.display_name || "",
      address: ubic.address || "",
      type: ubic.type || "other",
      lat: ubic.lat || null,
      lng: ubic.lng || null,
      city: ubic.city || "",
      province: ubic.province || "",
      country: ubic.country || "",
      postal_code: ubic.postal_code || "",
    });
    setSearchQuery(ubic.address || "");
    setPredictions([]);
    setSelectedCoords(
      ubic.lat ? { latitude: ubic.lat, longitude: ubic.lng } : null,
    );
    setSelectedAddress(ubic.address || "");
    setMapRegion(
      ubic.lat
        ? {
            latitude: ubic.lat,
            longitude: ubic.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        : DEFAULT_REGION,
    );
    setPickerStep("details");
    setModalVisible(true);
  };

  const handleSelectPrediction = async (prediction) => {
    try {
      setSearchLoading(true);
      const details = await getPlaceDetails({ placeId: prediction.place_id });
      const coords = {
        latitude: details.latitude,
        longitude: details.longitude,
      };
      setSelectedCoords(coords);
      setSelectedAddress(details.address || prediction.description);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setFormData((prev) => ({
        ...prev,
        address: details.address || prediction.description,
        lat: details.latitude,
        lng: details.longitude,
        city: details.city || "",
        province: details.province || "",
        country: details.country || "",
        postal_code: details.postal_code || "",
        display_name:
          prev.display_name ||
          prediction.structured_formatting?.main_text ||
          "",
      }));
      setSearchQuery(details.address || prediction.description);
      setPredictions([]);
    } catch (e) {
      Alert.alert("Error", "No se pudo obtener la dirección.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setSearchLoading(true);
      const location = await getUbicacionActual();
      const result = await reverseGeocode({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedCoords(coords);
      setSelectedAddress(result.address || "");
      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setFormData((prev) => ({
        ...prev,
        address: result.address || "",
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        city: result.city || "",
        province: result.province || "",
        country: result.country || "",
        postal_code: result.postal_code || "",
        display_name: prev.display_name || "Mi ubicación",
      }));
      setSearchQuery(result.address || "");
    } catch (e) {
      Alert.alert("Error", "No se pudo obtener tu ubicación actual.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      Alert.alert(
        "Faltan datos",
        "Por favor, introduce un nombre para esta ubicación.",
      );
      return;
    }
    if (!formData.address.trim() || !formData.lat || !formData.lng) {
      Alert.alert(
        "Faltan datos",
        "Por favor, selecciona una dirección en el buscador o usa tu ubicación actual.",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        userId: user.id,
        display_name: formData.display_name.trim(),
        address: formData.address.trim(),
        type: formData.type,
        lat: formData.lat,
        lng: formData.lng,
        city: formData.city || undefined,
        province: formData.province || undefined,
        country: formData.country || undefined,
        postal_code: formData.postal_code || undefined,
      };

      if (editingId) {
        await ubicacionTravelService.actualizarUbicacion(editingId, payload);
        Alert.alert(
          "Actualizado",
          "La ubicación se ha actualizado correctamente.",
        );
      } else {
        await ubicacionTravelService.crearUbicacion(payload);
        Alert.alert("Creado", "La ubicación se ha guardado correctamente.");
      }
      setModalVisible(false);
      fetchUbicaciones();
    } catch (error) {
      console.error("Error al guardar ubicación:", error);
      Alert.alert(
        "Error",
        error?.message || "No se pudo guardar la ubicación.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (ubic) => {
    Alert.alert(
      "Eliminar ubicación",
      `¿Estás seguro de que quieres eliminar "${ubic.display_name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await ubicacionTravelService.eliminarUbicacion(ubic.id);
              fetchUbicaciones();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la ubicación.");
            }
          },
        },
      ],
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSearchQuery("");
    setPredictions([]);
    setMapRegion(null);
    setPickerStep("details");
  };

  const handleContinueToLocation = () => {
    if (!formData.display_name.trim()) {
      Alert.alert(
        "Falta el nombre",
        "Por favor, introduce un nombre para esta ubicación.",
      );
      return;
    }
    setPickerStep("location");
  };

  const handleBackToDetails = () => {
    setPickerStep("details");
  };

  // Reverse geocode del centro del mapa cuando el usuario deja de arrastrar
  const handleMapRegionChangeComplete = useCallback(
    (region) => {
      if (!mapRegion) return;
      const { latitude, longitude } = region;
      setSelectedCoords({ latitude, longitude });

      // Debounce reverse geocode
      if (reverseTimerRef.current) {
        clearTimeout(reverseTimerRef.current);
      }
      reverseTimerRef.current = setTimeout(async () => {
        try {
          setReverseGeocoding(true);
          const result = await reverseGeocode({ latitude, longitude });
          setSelectedAddress(result.address || "");
          setSearchQuery(result.address || "");
          setFormData((prev) => ({
            ...prev,
            address: result.address || "",
            lat: latitude,
            lng: longitude,
            display_name: prev.display_name || result.name || "",
          }));
        } catch (e) {
          // Si falla, al menos guardar las coordenadas
          setFormData((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
          }));
        } finally {
          setReverseGeocoding(false);
        }
      }, 500);
    },
    [mapRegion],
  );

  // Animar el mapa a unas coordenadas concretas
  const animateToCoords = (coords) => {
    if (mapRef.current && coords) {
      mapRef.current.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    }
  };

  const renderTypeSelector = () => {
    const types = Object.keys(TYPE_CONFIG);
    return (
      <View style={styles.typeSelectorRow}>
        {types.map((typeKey) => {
          const cfg = TYPE_CONFIG[typeKey];
          const isSelected = formData.type === typeKey;
          const Icon = cfg.Icon;
          return (
            <TouchableOpacity
              key={typeKey}
              style={[
                styles.typeChip,
                isSelected && {
                  backgroundColor: cfg.bg,
                  borderColor: cfg.color,
                },
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, type: typeKey }))
              }
            >
              <Icon
                size={16}
                color={isSelected ? cfg.color : COLORS.gray500}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.typeChipText,
                  { color: isSelected ? cfg.color : COLORS.gray500 },
                ]}
              >
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderUbicacionCard = (ubic) => {
    const cfg = getTypeConfig(ubic.type);
    const Icon = cfg.Icon;
    return (
      <View key={ubic.id} style={styles.ubicacionCard}>
        <View style={[styles.ubicacionIcon, { backgroundColor: cfg.bg }]}>
          <Icon size={24} color={cfg.color} strokeWidth={2.5} />
        </View>
        <View style={styles.ubicacionInfo}>
          <Text style={styles.ubicacionName}>{ubic.display_name}</Text>
          <Text style={styles.ubicacionAddress} numberOfLines={2}>
            {ubic.address}
          </Text>
          {ubic.city ? (
            <Text style={styles.ubicacionCity}>{ubic.city}</Text>
          ) : null}
        </View>
        <View style={styles.ubicacionActions}>
          <TouchableOpacity
            style={styles.iconActionButton}
            onPress={() => openEditModal(ubic)}
          >
            <Pencil size={18} color={COLORS.gray500} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconActionButton}
            onPress={() => handleDelete(ubic)}
          >
            <Trash2 size={18} color={COLORS.error} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis direcciones</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando direcciones...</Text>
        </View>
      ) : ubicaciones.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyIconBg}>
            <MapPin size={48} color={COLORS.gray300} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Sin direcciones guardadas</Text>
          <Text style={styles.emptySubtitle}>
            Guarda tus direcciones frecuentes como casa, trabajo o universidad
            para acceder a ellas rápidamente al crear un viaje.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        >
          <Text style={styles.sectionHint}>
            Toca una dirección para editarla o eliminarla. Tus direcciones se
            usan al buscar trayectos.
          </Text>
          {ubicaciones.map(renderUbicacionCard)}
        </ScrollView>
      )}

      {/* Botón flotante para añadir */}
      {!loading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Plus size={26} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Modal de crear/editar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
      >
        {pickerStep === "location" ? (
          <View style={styles.pickerFullScreen}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={mapRegion || DEFAULT_REGION}
              onRegionChangeComplete={handleMapRegionChangeComplete}
              showsUserLocation
            />

            {/* Pin fijo en el centro del mapa */}
            <View style={styles.centerPinOverlay} pointerEvents="none">
              <MapPin
                size={44}
                color={COLORS.primary}
                strokeWidth={2.5}
                fill={COLORS.white}
              />
            </View>

            {/* Barra de búsqueda superior */}
            <SafeAreaView style={styles.pickerTopBar} edges={["top"]}>
              <View style={styles.pickerSearchRow}>
                <TouchableOpacity
                  style={styles.pickerBackButton}
                  onPress={handleBackToDetails}
                >
                  <ChevronLeft
                    size={22}
                    color={COLORS.gray700}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
                <View style={styles.pickerSearchBox}>
                  <TextInput
                    style={styles.pickerSearchInput}
                    placeholder="Buscar aquí"
                    placeholderTextColor={COLORS.gray400}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      if (text !== selectedAddress) {
                        setSelectedCoords(null);
                      }
                    }}
                  />
                  {searchLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : searchQuery.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery("");
                        setPredictions([]);
                      }}
                    >
                      <X size={18} color={COLORS.gray400} strokeWidth={2.5} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Predicciones */}
              {predictions.length > 0 && (
                <View style={styles.pickerPredictions}>
                  {predictions.slice(0, 5).map((pred) => (
                    <TouchableOpacity
                      key={pred.place_id}
                      style={styles.predictionItem}
                      onPress={() => handleSelectPrediction(pred)}
                    >
                      <MapPin
                        size={16}
                        color={COLORS.gray400}
                        strokeWidth={2.5}
                      />
                      <View style={styles.predictionTexts}>
                        <Text style={styles.predictionMain} numberOfLines={1}>
                          {pred.structured_formatting?.main_text ||
                            pred.description}
                        </Text>
                        <Text style={styles.predictionSub} numberOfLines={1}>
                          {pred.structured_formatting?.secondary_text || ""}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </SafeAreaView>

            {/* Botón centrar en mi ubicación */}
            <TouchableOpacity
              style={styles.pickerLocateButton}
              onPress={handleUseCurrentLocation}
            >
              <Crosshair size={20} color={COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Tarjeta inferior con dirección y confirmación */}
            <SafeAreaView style={styles.pickerBottomCard} edges={["bottom"]}>
              <View style={styles.pickerHandle} />
              {reverseGeocoding ? (
                <View style={styles.pickerAddressLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.pickerAddressLoadingText}>
                    Buscando dirección...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.pickerAddressTitle} numberOfLines={2}>
                    {selectedAddress ||
                      "Mueve el mapa para elegir una ubicación"}
                  </Text>
                  {(formData.city || formData.postal_code) && (
                    <Text style={styles.pickerAddressSubtitle}>
                      {[formData.postal_code, formData.city, formData.country]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  )}
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.pickerConfirmButton,
                  (!selectedCoords || saving) &&
                    styles.pickerConfirmButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!selectedCoords || saving || reverseGeocoding}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.pickerConfirmButtonText}>
                    Establecer {getTypeConfig(formData.type).label}
                  </Text>
                )}
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        ) : (
          <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
              style={styles.modalKeyboardView}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseModal}>
                  <X size={24} color={COLORS.gray600} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingId ? "Editar dirección" : "Nueva dirección"}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: SPACING.xxl }}
              >
                {/* Dirección seleccionada (si ya se eligió) */}
                {selectedAddress ? (
                  <TouchableOpacity
                    style={styles.selectedAddressCard}
                    onPress={() => setPickerStep("location")}
                  >
                    <MapPin
                      size={18}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.selectedAddressText} numberOfLines={2}>
                      {selectedAddress}
                    </Text>
                    <Pencil
                      size={16}
                      color={COLORS.gray400}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                ) : null}

                {/* Tipo de ubicación */}
                <Text style={styles.fieldLabel}>Tipo de ubicación</Text>
                {renderTypeSelector()}

                {/* Nombre */}
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: Mi casa, Universidad..."
                  placeholderTextColor={COLORS.gray400}
                  value={formData.display_name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, display_name: text }))
                  }
                />

                {/* Botón continuar a la selección de ubicación */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleContinueToLocation}
                  activeOpacity={0.85}
                >
                  <MapPin size={20} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={styles.saveButtonText}>
                    {selectedAddress ? "Cambiar ubicación" : "Elegir ubicación"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        )}
      </Modal>
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
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionHint: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  // Cards
  ubicacionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  ubicacionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ubicacionInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    gap: 2,
  },
  ubicacionName: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  ubicacionAddress: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  ubicacionCity: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
  },
  ubicacionActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  // FAB
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.large,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  fieldLabel: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  // Type selector
  typeSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeChipText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
  },
  // Text input
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.md,
    color: COLORS.gray800,
  },
  // Predictions
  predictionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    ...SHADOWS.small,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  predictionTexts: {
    flex: 1,
    gap: 2,
  },
  predictionMain: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  predictionSub: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
  },
  // Tarjeta de dirección seleccionada
  selectedAddressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    fontWeight: "600",
  },
  // Selector de ubicación en pantalla completa (estilo Google Maps)
  pickerFullScreen: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  centerPinOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
  },
  pickerTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  pickerSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  pickerBackButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  pickerSearchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 44,
    ...SHADOWS.medium,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: FONTS.md,
    color: COLORS.gray800,
  },
  pickerPredictions: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    overflow: "hidden",
    ...SHADOWS.medium,
  },
  pickerLocateButton: {
    position: "absolute",
    right: SPACING.md,
    bottom: 200,
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  pickerBottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    ...SHADOWS.large,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray200,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  pickerAddressTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  pickerAddressSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  pickerAddressLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  pickerAddressLoadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  pickerConfirmButton: {
    backgroundColor: COLORS.gray800,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.lg,
  },
  pickerConfirmButtonDisabled: {
    opacity: 0.5,
  },
  pickerConfirmButtonText: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.white,
  },
  // Save button
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

export default MisUbicacionesScreen;
