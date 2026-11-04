// YouConnext - EnterpriseCrearEventoScreen (Alta Ágil de Evento Corporativo)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Tag,
  Link2,
  Globe,
  Ticket,
  CheckCircle2,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../../components/common/PressableScale";
import { enterpriseService } from "../../services/enterpriseService";
import { eventService } from "../../services/eventService";
import { EnterpriseLocationInput, EventImagePicker } from "../../components/enterprise";
import { useUser } from "../../context/UserContext";

const CATEGORIES = [
  "Sostenibilidad",
  "Convención",
  "Team Building",
  "Formación",
  "Voluntariado",
  "Tecnología",
  "Reunión General",
];

const EnterpriseCrearEventoScreen = ({ navigation }) => {
  const { selectedEnterprise } = useUser();
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [capacity, setCapacity] = useState("");
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 + 3600000 * 8));
  const [availableTags, setAvailableTags] = useState(CATEGORIES);
  const [selectedTags, setSelectedTags] = useState(["Sostenibilidad"]);
  const [url, setUrl] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");

  const [pickerConfig, setPickerConfig] = useState({
    visible: false,
    mode: "date", // "date" | "time"
    target: "start", // "start" | "end"
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Cargar etiquetas dinámicas de la API con fallback a categorías predefinidas
  useEffect(() => {
    let isMounted = true;
    const loadApiTags = async () => {
      try {
        const res = await eventService.getTags();
        const list = res?.tags || res?.data || (Array.isArray(res) ? res : null);
        if (isMounted && list && Array.isArray(list) && list.length > 0) {
          const names = list.map((t) => (typeof t === "string" ? t : t.name)).filter(Boolean);
          const combined = Array.from(new Set([...CATEGORIES, ...names]));
          setAvailableTags(combined);
        }
      } catch (err) {
        // En caso de fallo o modo sin conexión, se mantienen CATEGORIES
      }
    };
    loadApiTags();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const openPicker = (target, mode) => {
    setPickerConfig({
      visible: true,
      mode,
      target,
    });
  };

  const handlePickerChange = (event, selectedDate) => {
    // Cerrar inmediatamente el picker en Android e iOS
    setPickerConfig((prev) => ({ ...prev, visible: false }));

    if (event?.type === "dismissed" || !selectedDate) {
      return;
    }

    if (pickerConfig.target === "start") {
      if (pickerConfig.mode === "date") {
        const next = new Date(startDate);
        next.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        setStartDate(next);
        if (next > endDate) {
          setEndDate(new Date(next.getTime() + 3600000 * 4));
        }
      } else {
        const next = new Date(startDate);
        next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setStartDate(next);
        if (next > endDate) {
          setEndDate(new Date(next.getTime() + 3600000 * 4));
        }
      }
    } else {
      if (pickerConfig.mode === "date") {
        const next = new Date(endDate);
        next.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        setEndDate(next);
      } else {
        const next = new Date(endDate);
        next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setEndDate(next);
      }
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg("Introduce el título o nombre del evento.");
      return;
    }
    if (!location.trim()) {
      setErrorMsg("Indica la dirección o sede donde se celebrará.");
      return;
    }

    setLoading(true);
    try {
      await enterpriseService.createEnterpriseEvent({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        latitude: locationCoords?.latitude,
        longitude: locationCoords?.longitude,
        capacity: capacity.trim() && !isNaN(Number(capacity)) ? Number(capacity.trim()) : null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        tags: selectedTags,
        image: image || undefined,
        url: url.trim() || undefined,
        ticketUrl: ticketUrl.trim() || undefined,
      });

      Alert.alert(
        "Evento Creado",
        "El evento corporativo ha sido dado de alta correctamente.",
        [
          {
            text: "Aceptar",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e) {
      const errMsg = e?.message || "No se pudo crear el evento corporativo.";
      setErrorMsg(errMsg);
      Alert.alert("Error al crear el evento", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Volver atrás"
        >
          <ChevronLeft size={22} color={BRAND.black} strokeWidth={2.4} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Crear Evento Corporativo</Text>
          <Text style={styles.headerSubtitle}>
            {selectedEnterprise?.name || "Organización"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Selector de Imagen / Portada del Evento */}
        <EventImagePicker
          image={image}
          onChangeImage={setImage}
          onRemoveImage={() => setImage(null)}
          label="Portada del evento"
          sublabel="Banner en formato 16:9 (galería, cámara o enlace web)"
        />

        {/* Nombre del Evento */}
        <Text style={styles.label}>Título del evento *</Text>
        <View style={styles.inputBox}>
          <FileText size={16} color={COLORS.gray400} strokeWidth={2.2} />
          <TextInput
            style={styles.textInput}
            placeholder="Ej. Jornada de Sostenibilidad 2026"
            placeholderTextColor={COLORS.gray400}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Fecha y Hora de Inicio */}
        <Text style={styles.label}>Inicio del evento *</Text>
        <View style={styles.rowDates}>
          <TouchableOpacity
            style={[styles.dateSelector, { flex: 1.3 }]}
            onPress={() => openPicker("start", "date")}
            activeOpacity={0.8}
          >
            <Calendar size={15} color={COLORS.primary} strokeWidth={2.4} />
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateSelector, { flex: 0.9 }]}
            onPress={() => openPicker("start", "time")}
            activeOpacity={0.8}
          >
            <Clock size={15} color={COLORS.primary} strokeWidth={2.4} />
            <Text style={styles.dateText}>
              {startDate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fecha y Hora de Fin */}
        <Text style={styles.label}>Finalización del evento *</Text>
        <View style={styles.rowDates}>
          <TouchableOpacity
            style={[styles.dateSelector, { flex: 1.3 }]}
            onPress={() => openPicker("end", "date")}
            activeOpacity={0.8}
          >
            <Calendar size={15} color={COLORS.gray600} strokeWidth={2.4} />
            <Text style={styles.dateText}>
              {endDate.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateSelector, { flex: 0.9 }]}
            onPress={() => openPicker("end", "time")}
            activeOpacity={0.8}
          >
            <Clock size={15} color={COLORS.gray600} strokeWidth={2.4} />
            <Text style={styles.dateText}>
              {endDate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {pickerConfig.visible && (
          <DateTimePicker
            value={pickerConfig.target === "start" ? startDate : endDate}
            mode={pickerConfig.mode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handlePickerChange}
            minimumDate={
              pickerConfig.mode === "date"
                ? pickerConfig.target === "end"
                  ? startDate
                  : new Date()
                : undefined
            }
          />
        )}

        {/* Ubicación / Sede */}
        <Text style={styles.label}>Sede o Dirección del evento *</Text>
        <EnterpriseLocationInput
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            if (locationCoords) setLocationCoords(null);
          }}
          onSelectPlace={(place) => {
            if (place) {
              const displayLocation =
                place.name && place.address && !place.address.startsWith(place.name)
                  ? `${place.name}, ${place.address}`
                  : place.address || place.name || "";
              setLocation(displayLocation);
              setLocationCoords(
                place.latitude && place.longitude
                  ? { latitude: place.latitude, longitude: place.longitude }
                  : null
              );
            } else {
              setLocation("");
              setLocationCoords(null);
            }
          }}
          selectedCoords={locationCoords}
          placeholder="Buscar sede, recinto o dirección (ej. IFEMA, Gran Vía 28...)"
        />

        {/* Aforo Máximo */}
        <Text style={styles.label}>Aforo estimado (asistentes)</Text>
        <View style={styles.inputBox}>
          <Users size={16} color={COLORS.gray400} strokeWidth={2.2} />
          <TextInput
            style={styles.textInput}
            placeholder="Ej. 20 (opcional)"
            placeholderTextColor={COLORS.gray400}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />
        </View>

        {/* Etiquetas / Categorías */}
        <View style={styles.labelWithIconRow}>
          <Tag size={14} color={COLORS.gray600} strokeWidth={2.2} />
          <Text style={styles.labelWithIcon}>Categorías y Etiquetas</Text>
        </View>
        <View style={styles.tagsWrapper}>
          {availableTags.map((cat) => {
            const isSelected = selectedTags.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                onPress={() => toggleTag(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    isSelected && styles.tagPillTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Descripción */}
        <Text style={styles.label}>Descripción y programa</Text>
        <View style={[styles.inputBox, styles.textAreaBox]}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Detalles sobre el punto de encuentro, horarios de carpooling y agenda..."
            placeholderTextColor={COLORS.gray400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Web Oficial / Landing Page */}
        <Text style={styles.label}>Sitio Web Oficial o Landing (opcional)</Text>
        <View style={styles.inputBox}>
          <Globe size={16} color={COLORS.gray400} strokeWidth={2.2} />
          <TextInput
            style={styles.textInput}
            placeholder="https://empresa.com/jornada-2026"
            placeholderTextColor={COLORS.gray400}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Enlace para comprar o reservar entradas */}
        <Text style={styles.label}>Enlace para comprar o reservar entradas (opcional)</Text>
        <View style={styles.inputBox}>
          <Ticket size={16} color={COLORS.gray400} strokeWidth={2.2} />
          <TextInput
            style={styles.textInput}
            placeholder="https://entradas.empresa.com/reserva"
            placeholderTextColor={COLORS.gray400}
            value={ticketUrl}
            onChangeText={setTicketUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Botón de Enviar */}
        <PressableScale
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          scaleTo={0.98}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Publicar Evento</Text>
          )}
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: RADIUS.control,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 12,
    marginBottom: 6,
  },
  labelWithIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  labelWithIcon: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.control,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  textAreaBox: {
    height: 90,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: BRAND.black,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  rowDates: {
    flexDirection: "row",
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.control,
    paddingHorizontal: 10,
    height: 46,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.black,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagPill: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
  },
  tagPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  tagPillTextSelected: {
    color: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.control,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
    ...SHADOWS.card,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default EnterpriseCrearEventoScreen;
