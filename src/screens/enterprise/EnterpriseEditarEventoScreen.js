// YouConnext - EnterpriseEditarEventoScreen (Edición de Evento Corporativo)
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  Trash2,
  CheckCircle2,
  Globe,
  Ticket,
  Link2,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../../components/common/PressableScale";
import { enterpriseService } from "../../services/enterpriseService";
import { EnterpriseLocationInput, EventImagePicker } from "../../components/enterprise";

const STATUS_OPTIONS = [
  { key: "upcoming", label: "Próximo" },
  { key: "active", label: "En curso" },
  { key: "completed", label: "Completado" },
];

const EnterpriseEditarEventoScreen = ({ navigation, route }) => {
  const event = route?.params?.event || {};

  const [image, setImage] = useState(event.image || null);
  const [name, setName] = useState(event.name || event.title || "");
  const [description, setDescription] = useState(event.description || "");
  const [location, setLocation] = useState(event.location || event.address_line1 || "");
  const [locationCoords, setLocationCoords] = useState(
    event.latitude && event.longitude
      ? { latitude: Number(event.latitude), longitude: Number(event.longitude) }
      : null
  );
  const [capacity, setCapacity] = useState(
    event.capacity !== undefined && event.capacity !== null ? String(event.capacity) : ""
  );
  const [status, setStatus] = useState(event.status || "upcoming");
  const [url, setUrl] = useState(event.url || "");
  const [ticketUrl, setTicketUrl] = useState(event.ticket_url || event.ticketUrl || "");
  const initialStart = event.start_date || event.start_at || event.startDate;
  const initialEnd = event.end_date || event.end_at || event.endDate;
  const [startDate, setStartDate] = useState(
    initialStart ? new Date(initialStart) : new Date(Date.now() + 86400000)
  );
  const [endDate, setEndDate] = useState(
    initialEnd ? new Date(initialEnd) : new Date(Date.now() + 86400000 + 3600000 * 8)
  );
  const [pickerConfig, setPickerConfig] = useState({
    visible: false,
    mode: "date",
    target: "start",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const openPicker = (target, mode) => {
    setPickerConfig({
      visible: true,
      mode,
      target,
    });
  };

  const handlePickerChange = (eventEvt, selectedDate) => {
    setPickerConfig((prev) => ({ ...prev, visible: false }));
    if (eventEvt?.type === "dismissed" || !selectedDate) return;

    if (pickerConfig.target === "start") {
      if (pickerConfig.mode === "date") {
        const next = new Date(startDate);
        next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
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
        next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setEndDate(next);
      } else {
        const next = new Date(endDate);
        next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setEndDate(next);
      }
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg("El título del evento es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      await enterpriseService.updateEnterpriseEvent(event.id, {
        name: name.trim(),
        title: name.trim(),
        description: description.trim(),
        location: location.trim(),
        latitude: locationCoords?.latitude,
        longitude: locationCoords?.longitude,
        capacity: capacity.trim() && !isNaN(Number(capacity)) ? Number(capacity.trim()) : null,
        status,
        image: image || null,
        url: url.trim() || undefined,
        ticket_url: ticketUrl.trim() || undefined,
        ticketUrl: ticketUrl.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      Alert.alert(
        "Evento Actualizado",
        "Los cambios se han guardado con éxito.",
        [
          {
            text: "Aceptar",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e) {
      const errMsg = e?.message || "No se pudo actualizar el evento.";
      setErrorMsg(errMsg);
      Alert.alert("Error al actualizar evento", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Evento",
      "¿Seguro que deseas eliminar este evento corporativo? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await enterpriseService.deleteEnterpriseEvent(event.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert("Error", err?.message || "No se pudo eliminar el evento.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={BRAND.black} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Evento</Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.deleteBtn}
          accessibilityLabel="Eliminar evento"
        >
          <Trash2 size={18} color="#DC2626" strokeWidth={2.2} />
        </TouchableOpacity>
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

        {/* Portada del Evento */}
        <EventImagePicker
          image={image}
          onChangeImage={setImage}
          onRemoveImage={() => setImage(null)}
          label="Portada del evento"
          sublabel="Banner en formato 16:9 (galería, cámara o enlace web)"
        />

        {/* Estado del Evento */}
        <Text style={styles.label}>Estado del evento</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((st) => {
            const isSelected = status === st.key;
            return (
              <TouchableOpacity
                key={st.key}
                style={[
                  styles.statusChip,
                  isSelected && styles.statusChipSelected,
                ]}
                onPress={() => setStatus(st.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    isSelected && styles.statusChipTextSelected,
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Título */}
        <Text style={styles.label}>Título del evento</Text>
        <View style={styles.inputBox}>
          <FileText size={16} color={COLORS.gray400} strokeWidth={2.2} />
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Título del evento"
          />
        </View>

        {/* Fechas de Inicio y Fin */}
        <Text style={styles.label}>Inicio del evento</Text>
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

        <Text style={styles.label}>Finalización del evento</Text>
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

        {/* Ubicación */}
        <Text style={styles.label}>Sede o Dirección</Text>
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
          placeholder="Buscar sede, recinto o dirección"
        />

        {/* Aforo */}
        <Text style={styles.label}>Aforo estimado</Text>
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

        {/* Descripción */}
        <Text style={styles.label}>Descripción</Text>
        <View style={[styles.inputBox, styles.textAreaBox]}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
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

        {/* Botón Guardar */}
        <PressableScale
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading || deleting}
          scaleTo={0.98}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  deleteBtn: {
    padding: 6,
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
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
  },
  statusChipSelected: {
    backgroundColor: BRAND.black,
    borderColor: BRAND.black,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  statusChipTextSelected: {
    color: COLORS.white,
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
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.control,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
    ...SHADOWS.card,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default EnterpriseEditarEventoScreen;
