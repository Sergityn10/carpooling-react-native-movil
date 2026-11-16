// YouConnext - CrearAlertaModal Component (Modal para crear alerta DESTINO o EVENTO)
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  MapPin,
  Calendar,
  Search,
  Check,
  BellOff,
  AlertCircle,
  BellPlus,
} from "lucide-react-native";
import { BRAND, COLORS, FONTS, RADIUS, SHADOWS, SPACING } from "../../constants";
import { alertaService } from "../../services/travels/alertaService";
import { eventService } from "../../services/eventService";
import { eventCache } from "../../services/eventCache";
import { autocompletePlaces } from "../../services/googlePlaces";
import {
  TIPO_ALERTA,
  buildCreateAlertaPayload,
  extractCityName,
  findDuplicateAlerta,
  getAlertaErrorMessage,
} from "../../utils/alertaUtils";
import { normalizeEventSummary } from "../../utils/eventResolutionCache";
import Button from "../common/Button";

function formatEventDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const CrearAlertaModal = ({
  visible,
  onClose,
  onCreated,
  existingAlertas = [],
  initialTipo = TIPO_ALERTA.DESTINO,
  initialDestino = "",
  initialEvent = null,
  notificationsGranted = true,
  onRequestNotifications,
}) => {
  const [tipo, setTipo] = useState(initialTipo);
  const [destinoText, setDestinoText] = useState(initialDestino);
  const [cityPredictions, setCityPredictions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const [eventSearch, setEventSearch] = useState("");
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const cityTimerRef = useRef(null);
  const eventTimerRef = useRef(null);
  const suppressCityAutocompleteRef = useRef(false);

  // Sincronizar estado al abrir el modal
  useEffect(() => {
    if (!visible) return;
    const nextTipo =
      initialTipo === TIPO_ALERTA.EVENTO
        ? TIPO_ALERTA.EVENTO
        : TIPO_ALERTA.DESTINO;
    setTipo(nextTipo);
    setDestinoText(initialDestino ? extractCityName(initialDestino) || initialDestino : "");
    setCityPredictions([]);
    setShowCitySuggestions(false);
    setSelectedEvent(initialEvent ? normalizeEventSummary(initialEvent) : null);
    setEventSearch("");
    setFormError("");
    setEventsError("");
  }, [visible, initialTipo, initialDestino, initialEvent]);

  const loadEvents = useCallback(async (search = "") => {
    setLoadingEvents(true);
    setEventsError("");
    try {
      const params = { limit: 40 };
      if (search.trim()) params.search = search.trim();
      const res = await eventService.getEvents(params);
      const rawList = res?.events || res?.data || (Array.isArray(res) ? res : []);
      const safeList = Array.isArray(rawList) ? rawList : [];
      eventCache.seedEventsCache(safeList);
      setEventsList(safeList);
    } catch (err) {
      setEventsError(
        err?.message || "No se pudieron cargar los eventos disponibles.",
      );
      setEventsList([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Cargar catálogo de eventos al cambiar a pestaña EVENTO
  useEffect(() => {
    if (!visible || tipo !== TIPO_ALERTA.EVENTO) return;
    if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
    eventTimerRef.current = setTimeout(() => {
      loadEvents(eventSearch);
    }, eventSearch ? 280 : 0);

    return () => {
      if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
    };
  }, [visible, tipo, eventSearch, loadEvents]);

  // Autocompletado de ciudades para alertas de DESTINO (degradación suave si falla Places)
  useEffect(() => {
    if (!visible || tipo !== TIPO_ALERTA.DESTINO) return;
    if (suppressCityAutocompleteRef.current) {
      suppressCityAutocompleteRef.current = false;
      return;
    }

    const trimmed = destinoText.trim();
    if (trimmed.length < 2 || !showCitySuggestions) {
      setCityPredictions([]);
      return;
    }

    if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
    cityTimerRef.current = setTimeout(async () => {
      try {
        setLoadingCities(true);
        const items = await autocompletePlaces({
          input: trimmed,
          types: "(cities)",
        });
        setCityPredictions(Array.isArray(items) ? items.slice(0, 5) : []);
      } catch {
        // Fallback silencioso a entrada manual
        setCityPredictions([]);
      } finally {
        setLoadingCities(false);
      }
    }, 260);

    return () => {
      if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
    };
  }, [visible, tipo, destinoText, showCitySuggestions]);

  const handleSelectCityPrediction = (prediction) => {
    const cleanCity =
      prediction?.structured_formatting?.main_text ||
      extractCityName(prediction?.description) ||
      "";
    suppressCityAutocompleteRef.current = true;
    setDestinoText(cleanCity);
    setCityPredictions([]);
    setShowCitySuggestions(false);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setFormError("");

    let payload;
    try {
      payload = buildCreateAlertaPayload(
        tipo === TIPO_ALERTA.DESTINO
          ? { tipo, destino: destinoText }
          : { tipo, eventoId: selectedEvent?.id },
      );
    } catch (validationError) {
      setFormError(validationError.message);
      return;
    }

    const duplicate = findDuplicateAlerta(existingAlertas, payload);
    if (duplicate) {
      setFormError(
        tipo === TIPO_ALERTA.DESTINO
          ? `Ya tienes una alerta creada para ${payload.destino}.`
          : "Ya tienes una alerta creada para este evento.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await alertaService.crearAlerta(payload);
      if (tipo === TIPO_ALERTA.EVENTO && selectedEvent) {
        eventCache.seedEventsCache([selectedEvent.raw || selectedEvent]);
      }
      onCreated?.(created, tipo === TIPO_ALERTA.EVENTO ? selectedEvent : null);
      onClose?.();
    } catch (error) {
      setFormError(getAlertaErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    (tipo === TIPO_ALERTA.DESTINO
      ? destinoText.trim().length >= 2
      : Boolean(selectedEvent?.id));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardWrapper}
        >
          <SafeAreaView style={styles.sheet} edges={["bottom"]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconBox}>
                  <BellPlus size={18} color={COLORS.primaryDark} strokeWidth={2.4} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Nueva alerta de trayecto</Text>
                  <Text style={styles.headerSubtitle}>
                    Te avisaremos cuando alguien publique plazas
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                disabled={isSubmitting}
                hitSlop={8}
                accessibilityLabel="Cerrar"
              >
                <X size={20} color={COLORS.gray700} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Aviso si permisos de push desactivados */}
              {!notificationsGranted && (
                <View style={styles.permissionWarning}>
                  <BellOff size={16} color={COLORS.accentDark} strokeWidth={2.3} />
                  <Text style={styles.permissionWarningText}>
                    Las notificaciones push están desactivadas. Puedes crear la alerta igualmente.
                  </Text>
                  {onRequestNotifications && (
                    <TouchableOpacity
                      onPress={onRequestNotifications}
                      hitSlop={6}
                    >
                      <Text style={styles.permissionActionText}>Activar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Selector segmentado: Por destino | Por evento */}
              <Text style={styles.label}>¿De qué quieres que te avisemos?</Text>
              <View style={styles.segmentedContainer}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    tipo === TIPO_ALERTA.DESTINO && styles.segmentBtnActive,
                  ]}
                  onPress={() => {
                    setTipo(TIPO_ALERTA.DESTINO);
                    setFormError("");
                  }}
                  activeOpacity={0.85}
                >
                  <MapPin
                    size={16}
                    color={
                      tipo === TIPO_ALERTA.DESTINO
                        ? COLORS.primaryDark
                        : COLORS.gray500
                    }
                    strokeWidth={2.3}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      tipo === TIPO_ALERTA.DESTINO && styles.segmentTextActive,
                    ]}
                  >
                    Por destino
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    tipo === TIPO_ALERTA.EVENTO && styles.segmentBtnActiveEvento,
                  ]}
                  onPress={() => {
                    setTipo(TIPO_ALERTA.EVENTO);
                    setFormError("");
                  }}
                  activeOpacity={0.85}
                >
                  <Calendar
                    size={16}
                    color={
                      tipo === TIPO_ALERTA.EVENTO
                        ? COLORS.accentDark
                        : COLORS.gray500
                    }
                    strokeWidth={2.3}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      tipo === TIPO_ALERTA.EVENTO &&
                        styles.segmentTextActiveEvento,
                    ]}
                  >
                    Por evento
                  </Text>
                </TouchableOpacity>
              </View>

              {tipo === TIPO_ALERTA.DESTINO ? (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Ciudad o localidad de destino</Text>
                  <View style={styles.inputBox}>
                    <MapPin size={18} color={COLORS.primary} strokeWidth={2.2} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ej. Valencia, Madrid, Bilbao..."
                      placeholderTextColor={COLORS.gray400}
                      value={destinoText}
                      onFocus={() => setShowCitySuggestions(true)}
                      onChangeText={(txt) => {
                        setDestinoText(txt);
                        setShowCitySuggestions(true);
                        setFormError("");
                      }}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                    {loadingCities && (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    )}
                    {destinoText.length > 0 && !loadingCities && (
                      <TouchableOpacity
                        onPress={() => {
                          setDestinoText("");
                          setCityPredictions([]);
                        }}
                        hitSlop={6}
                      >
                        <X size={16} color={COLORS.gray500} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {cityPredictions.length > 0 && showCitySuggestions && (
                    <View style={styles.suggestionsBox}>
                      {cityPredictions.map((pred) => (
                        <TouchableOpacity
                          key={pred.place_id}
                          style={styles.suggestionItem}
                          onPress={() => handleSelectCityPrediction(pred)}
                        >
                          <MapPin
                            size={14}
                            color={COLORS.primary}
                            strokeWidth={2.2}
                          />
                          <Text style={styles.suggestionText} numberOfLines={1}>
                            {pred.description}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.helperText}>
                    Recibirás un aviso cuando un conductor publique un trayecto cuyo destino coincida con esta ciudad.
                  </Text>
                </View>
              ) : (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Selecciona un evento</Text>

                  {selectedEvent && (
                    <View style={styles.selectedEventBanner}>
                      <View style={styles.selectedEventInfo}>
                        <Text style={styles.selectedEventKicker}>
                          EVENTO SELECCIONADO
                        </Text>
                        <Text style={styles.selectedEventTitle} numberOfLines={1}>
                          {selectedEvent.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setSelectedEvent(null)}
                        hitSlop={6}
                      >
                        <X size={16} color={COLORS.accentDark} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.inputBox}>
                    <Search size={18} color={COLORS.gray500} strokeWidth={2.2} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Buscar evento por nombre o ciudad..."
                      placeholderTextColor={COLORS.gray400}
                      value={eventSearch}
                      onChangeText={setEventSearch}
                      returnKeyType="search"
                    />
                    {eventSearch.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setEventSearch("")}
                        hitSlop={6}
                      >
                        <X size={16} color={COLORS.gray500} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {loadingEvents ? (
                    <View style={styles.eventsLoadingBox}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.eventsLoadingText}>
                        Cargando eventos...
                      </Text>
                    </View>
                  ) : eventsError ? (
                    <View style={styles.eventsEmptyBox}>
                      <Text style={styles.eventsErrorText}>{eventsError}</Text>
                      <TouchableOpacity onPress={() => loadEvents(eventSearch)}>
                        <Text style={styles.retryLink}>Reintentar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : eventsList.length === 0 ? (
                    <View style={styles.eventsEmptyBox}>
                      <Text style={styles.eventsEmptyText}>
                        No encontramos eventos con esa búsqueda.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.eventsList}>
                      {eventsList.map((ev) => {
                        const isSelected =
                          String(selectedEvent?.id) === String(ev.id);
                        const dateStr = formatEventDate(ev.start_date);
                        const orgName =
                          ev.company?.name || ev.enterprise?.name || ev.city;
                        return (
                          <TouchableOpacity
                            key={ev.id}
                            style={[
                              styles.eventOption,
                              isSelected && styles.eventOptionSelected,
                            ]}
                            onPress={() => {
                              setSelectedEvent(normalizeEventSummary(ev));
                              setFormError("");
                            }}
                            activeOpacity={0.82}
                          >
                            <View style={styles.eventOptionTextCol}>
                              <Text
                                style={[
                                  styles.eventOptionTitle,
                                  isSelected && styles.eventOptionTitleSelected,
                                ]}
                                numberOfLines={1}
                              >
                                {ev.name || ev.title}
                              </Text>
                              {(dateStr || orgName) && (
                                <Text
                                  style={styles.eventOptionMeta}
                                  numberOfLines={1}
                                >
                                  {[dateStr, orgName]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </Text>
                              )}
                            </View>
                            {isSelected && (
                              <View style={styles.checkCircle}>
                                <Check
                                  size={13}
                                  color={COLORS.white}
                                  strokeWidth={2.8}
                                />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {formError ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color={COLORS.error} strokeWidth={2.2} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title={isSubmitting ? "Creando alerta..." : "Crear alerta"}
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={isSubmitting}
                variant="primary"
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 14, 0.55)",
    justifyContent: "flex-end",
  },
  keyboardWrapper: {
    width: "100%",
    maxHeight: "90%",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "100%",
    ...SHADOWS.large,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
    flex: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: BRAND.black,
  },
  headerSubtitle: {
    fontSize: FONTS.xs + 1,
    color: COLORS.gray600,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    maxHeight: 480,
  },
  bodyContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  permissionWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.accentSoft,
    padding: SPACING.md,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: "rgba(242, 163, 60, 0.35)",
  },
  permissionWarningText: {
    flex: 1,
    fontSize: FONTS.xs + 1,
    color: COLORS.accentDark,
    lineHeight: 16,
  },
  permissionActionText: {
    fontSize: FONTS.xs + 1,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  label: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.control,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.sm + 2,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.xs,
  },
  segmentBtnActiveEvento: {
    backgroundColor: COLORS.white,
    ...SHADOWS.xs,
  },
  segmentText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  segmentTextActive: {
    color: COLORS.primaryDark,
    fontWeight: "800",
  },
  segmentTextActiveEvento: {
    color: COLORS.accentDark,
    fontWeight: "800",
  },
  fieldBlock: {
    gap: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONTS.xs + 1,
    fontWeight: "700",
    color: COLORS.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1.2,
    borderColor: COLORS.borderField,
    borderRadius: RADIUS.control,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
    backgroundColor: COLORS.white,
  },
  textInput: {
    flex: 1,
    fontSize: FONTS.md,
    color: BRAND.black,
    paddingVertical: SPACING.sm,
  },
  suggestionsBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.control,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  suggestionText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray800,
  },
  helperText: {
    fontSize: FONTS.xs + 1,
    color: COLORS.gray600,
    lineHeight: 17,
  },
  selectedEventBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: "rgba(242, 163, 60, 0.35)",
  },
  selectedEventInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  selectedEventKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accentDark,
    letterSpacing: 0.5,
  },
  selectedEventTitle: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 1,
  },
  eventsLoadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  eventsLoadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
  },
  eventsEmptyBox: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  eventsEmptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    textAlign: "center",
  },
  eventsErrorText: {
    fontSize: FONTS.sm,
    color: COLORS.error,
    textAlign: "center",
  },
  retryLink: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.primary,
  },
  eventsList: {
    gap: SPACING.xs + 2,
  },
  eventOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  eventOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  eventOptionTextCol: {
    flex: 1,
  },
  eventOptionTitle: {
    fontSize: FONTS.sm + 1,
    fontWeight: "700",
    color: BRAND.black,
  },
  eventOptionTitleSelected: {
    color: COLORS.accentDark,
  },
  eventOptionMeta: {
    fontSize: FONTS.xs + 1,
    color: COLORS.gray600,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accentDark,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.errorSoft,
    padding: SPACING.md,
    borderRadius: RADIUS.control,
  },
  errorText: {
    flex: 1,
    fontSize: FONTS.xs + 1,
    fontWeight: "600",
    color: COLORS.error,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
});

export default CrearAlertaModal;
