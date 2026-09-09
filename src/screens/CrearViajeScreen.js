// YouConnext - Crear Viaje Screen (Wizard multi-paso)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Car,
  Euro,
  Navigation as NavIcon,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Gift,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { useViaje } from "../context/ViajeContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button, PlaceAutocompleteInput, TripMapPreview } from "../components";
import { getDirectionsRoute } from "../services/googlePlaces";
import { trayectoService } from "../services/travels/trayectoService";
import { carService } from "../services/carService";
import { ubicacionTravelService } from "../services/travels/ubicacionService";
import { homeCache } from "../services/homeCache";
import { localToUtcApi, parseTripDate } from "../services/dateUtils";
import { paymentService } from "../services/paymentService";

const PRICE_PER_KM = parseFloat(
  process.env.EXPO_PUBLIC_RECOMMENDED_PRICE_PER_KM || "0.06",
);
const MIN_PRICE_PER_KM = parseFloat(
  process.env.EXPO_PUBLIC_MIN_PRICE_PER_KM || "0.06",
);
const MAX_PRICE_PER_KM = parseFloat(
  process.env.EXPO_PUBLIC_MAX_PRICE_PER_KM || "0.08",
);

const esProximoViaje = (trayecto, fechaApi, horaApi) => {
  try {
    let fechaViaje;
    if (trayecto && (trayecto.hora || trayecto.fecha)) {
      fechaViaje = parseTripDate(trayecto);
    } else if (fechaApi && horaApi) {
      fechaViaje = new Date(`${fechaApi}T${horaApi}:00Z`);
    } else {
      return false;
    }
    if (isNaN(fechaViaje.getTime())) return false;
    const ahora = Date.now();
    const diffMs = fechaViaje.getTime() - ahora;
    const dosDiasMs = 2 * 24 * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs <= dosDiasMs;
  } catch {
    return false;
  }
};

const calculateRecommendedPrice = (distanceMeters) => {
  if (!distanceMeters) return 0;
  const km = distanceMeters / 1000;
  return Math.round(km * PRICE_PER_KM * 100) / 100;
};

const calculateMinPrice = (distanceMeters) => {
  if (!distanceMeters) return 0;
  const km = distanceMeters / 1000;
  return Math.round(km * MIN_PRICE_PER_KM * 100) / 100;
};

const calculateMaxPrice = (distanceMeters) => {
  if (!distanceMeters) return 0;
  const km = distanceMeters / 1000;
  return Math.round(km * MAX_PRICE_PER_KM * 100) / 100;
};
const STEPS = {
  FECHA_HORA: 0,
  MAPA: 1,
  VEHICULO: 2,
  PRECIO: 3,
};

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const validateEventTripDate = (evento, direccionEvento, fecha, hora) => {
  if (!evento) return null;
  const tripDate = new Date(fecha);
  tripDate.setHours(
    new Date(hora).getHours(),
    new Date(hora).getMinutes(),
    0,
    0,
  );

  const eventStart = new Date(evento.start_date);
  const eventEnd = new Date(evento.end_date || evento.start_date);
  if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) return null;

  const minDate = new Date(eventStart.getTime() - TWO_DAYS_MS);
  const maxDate = new Date(eventEnd.getTime() + TWO_DAYS_MS);

  if (tripDate < minDate || tripDate > maxDate) {
    const minStr = minDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const maxStr = maxDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const dir = direccionEvento === "ida" ? "ida" : "vuelta";
    return `La fecha del viaje de ${dir} debe estar entre el ${minStr} y el ${maxStr} (2 días antes hasta 2 días después del evento).`;
  }
  return null;
};

// ==================== Date/Time Picker Modal ====================
const DateTimePickerModal = ({
  visible,
  mode,
  currentDate,
  currentTime,
  onConfirm,
  onCancel,
  minDate,
  maxDate,
}) => {
  const currentValue =
    mode === "date" ? new Date(currentDate) : new Date(currentTime);

  const handleChange = (event, date) => {
    if (event.type === "dismissed" || event.type === "neutral") {
      onCancel();
      return;
    }
    if (event.type === "set" && date) {
      if (mode === "date") {
        const newDate = new Date(date);
        const time = new Date(currentTime);
        newDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
        onConfirm(newDate, time);
      } else {
        const newTime = new Date(date);
        const d = new Date(currentDate);
        onConfirm(d, newTime);
      }
    }
  };

  if (!visible) return null;

  return (
    <DateTimePicker
      value={currentValue}
      mode={mode}
      display={mode === "date" ? "calendar" : "spinner"}
      minimumDate={mode === "date" ? minDate : undefined}
      maximumDate={mode === "date" ? maxDate : undefined}
      onChange={handleChange}
      locale="es-ES"
    />
  );
};

// ==================== Main Screen ====================
const CrearViajeScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const { crearViajeRapido } = useViaje();
  const insets = useSafeAreaInsets();
  const evento = route.params?.evento || null;
  const [direccionEvento, setDireccionEvento] = useState("ida");

  const [step, setStep] = useState(STEPS.FECHA_HORA);

  // Rango de fechas permitido para trayectos de evento
  const eventoPickerMinDate = (() => {
    if (!evento) return null;
    const start = new Date(evento.start_date);
    if (isNaN(start.getTime())) return null;
    return new Date(start.getTime() - TWO_DAYS_MS);
  })();

  const eventoPickerMaxDate = (() => {
    if (!evento) return null;
    const end = new Date(evento.end_date || evento.start_date);
    if (isNaN(end.getTime())) return null;
    return new Date(end.getTime() + TWO_DAYS_MS);
  })();

  // Step 1: Fecha y hora
  const [fecha, setFecha] = useState(() => {
    if (evento && eventoPickerMinDate) {
      const now = new Date();
      if (now < eventoPickerMinDate) return new Date(eventoPickerMinDate);
      if (eventoPickerMaxDate && now > eventoPickerMaxDate)
        return new Date(eventoPickerMinDate);
    }
    return new Date();
  });
  const [hora, setHora] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Step 2: Origen y destino
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [origenTexto, setOrigenTexto] = useState("");
  const [origenPlace, setOrigenPlace] = useState(null);
  const eventoPlace = evento
    ? {
        latitude: Number(evento.latitude),
        longitude: Number(evento.longitude),
        name: evento.name,
        address: evento.name,
      }
    : null;
  const [destinoTexto, setDestinoTexto] = useState(evento ? evento.name : "");
  const [destinoPlace, setDestinoPlace] = useState(evento ? eventoPlace : null);
  const [rutaInfo, setRutaInfo] = useState(null);
  const [calculandoRuta, setCalculandoRuta] = useState(false);

  // Step 3: Vehiculo
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true);

  // Saved locations
  const [savedLocations, setSavedLocations] = useState([]);

  // Step 4: Precio
  const [viajeGratis, setViajeGratis] = useState(false);
  const [precio, setPrecio] = useState("");
  const [plazas, setPlazas] = useState("4");
  const [creando, setCreando] = useState(false);

  // Max de plazas ofertables: plazas del coche menos la del conductor
  const maxPlazasOfertables = vehiculoSeleccionado?.num_plazas
    ? Math.max(1, vehiculoSeleccionado.num_plazas - 1)
    : 7;

  const [monederoNoConfigurado, setMonederoNoConfigurado] = useState(
    user?.monedero?.disponible !== true ||
      user?.monedero?.config?.wallet_enabled === false,
  );

  // Verificar estado real de Stripe Connect al llegar al step de precio,
  // igual que hace la sección del Monedero en el perfil
  useEffect(() => {
    if (step !== STEPS.PRECIO) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await paymentService.getStripeConnect();
        if (cancelled) return;
        const acct = res?.account;
        const stripeListo =
          acct?.charges_enabled === true && acct?.details_submitted === true;
        const walletEnabled = user?.monedero?.config?.wallet_enabled !== false;
        setMonederoNoConfigurado(!stripeListo || !walletEnabled);
      } catch (err) {
        if (!cancelled) {
          console.warn("No se pudo verificar Stripe Connect:", err.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const recommendedPrice = rutaInfo
    ? calculateRecommendedPrice(rutaInfo.distanceMeters)
    : 0;
  const minPrice = rutaInfo ? calculateMinPrice(rutaInfo.distanceMeters) : 0;
  const maxPrice = rutaInfo ? calculateMaxPrice(rutaInfo.distanceMeters) : 0;

  // Cargar vehículos del usuario al montar
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await carService.obtenerCochesUsuario(user.id);
        const coches = res?.cars || [];
        setVehiculos(coches);
        if (coches.length === 1) {
          setVehiculoSeleccionado(coches[0]);
          const maxPlazas = Math.max(1, (coches[0].num_plazas || 5) - 1);
          if (parseInt(plazas) > maxPlazas) setPlazas(String(maxPlazas));
        }
      } catch (err) {
        console.warn("Error al cargar vehículos:", err.message);
      } finally {
        setCargandoVehiculos(false);
      }
    })();
  }, [user?.id]);

  // Cargar ubicaciones guardadas del usuario
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await ubicacionTravelService.obtenerUbicacionesPorUsuario(
          user.id,
        );
        const locs = Array.isArray(res) ? res : res?.data || [];
        setSavedLocations(locs);
      } catch (err) {
        console.warn("Error al cargar ubicaciones guardadas:", err.message);
      }
    })();
  }, [user?.id]);

  // Cargar ubicación actual al montar
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = location.coords;
        setUbicacionActual(coords);

        let nombre = "Mi ubicación";
        let direccion;
        try {
          const reversed = await Location.reverseGeocodeAsync({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          const first = reversed?.[0];
          if (first) {
            const parts = [
              first.street,
              first.streetNumber,
              first.city,
              first.region,
            ].filter(Boolean);
            direccion = parts.join(" ");
            if (first.name) nombre = first.name;
          }
        } catch {}

        const userPlace = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: nombre,
          address: direccion,
        };
        setOrigenPlace(userPlace);
        setOrigenTexto(direccion || nombre);
        if (evento && direccionEvento === "vuelta") {
          setDestinoPlace(userPlace);
          setDestinoTexto(direccion || nombre);
        }
      } catch (error) {
        console.log("Error al obtener ubicación:", error);
      }
    })();
  }, []);

  // Cuando se cambia de ida a vuelta, reajustar origen/destino y fecha
  useEffect(() => {
    if (!evento || !eventoPlace) return;
    if (direccionEvento === "ida") {
      setOrigenTexto("");
      setOrigenPlace(null);
      setDestinoTexto(evento.name);
      setDestinoPlace(eventoPlace);
    } else {
      setOrigenTexto(evento.name);
      setOrigenPlace(eventoPlace);
      setDestinoTexto("");
      setDestinoPlace(null);
    }
    // Ajustar fecha al nuevo rango
    const minD = eventoPickerMinDate;
    const maxD = eventoPickerMaxDate;
    if (minD && maxD) {
      const current = new Date(fecha);
      if (current < minD || current > maxD) {
        setFecha(new Date(minD));
      }
    }
  }, [direccionEvento]);

  // Calcular ruta cuando se tienen origen y destino
  useEffect(() => {
    if (!origenPlace?.latitude || !destinoPlace?.latitude) {
      setRutaInfo(null);
      return;
    }

    const calcularRuta = async () => {
      setCalculandoRuta(true);
      try {
        const result = await getDirectionsRoute({
          origin: origenPlace,
          destination: destinoPlace,
        });
        setRutaInfo(result);
      } catch (error) {
        console.log("Error al calcular ruta:", error);
        setRutaInfo(null);
      } finally {
        setCalculandoRuta(false);
      }
    };

    calcularRuta();
  }, [origenPlace, destinoPlace]);

  // Forzar viaje gratis si no hay monedero configurado,
  // o resetear si el refresh confirma que sí está configurado
  useEffect(() => {
    if (step === STEPS.PRECIO) {
      setViajeGratis(monederoNoConfigurado);
    }
  }, [step, monederoNoConfigurado]);

  // Autocompletar precio recomendado al llegar al step PRECIO
  useEffect(() => {
    if (
      step === STEPS.PRECIO &&
      rutaInfo &&
      !precio &&
      !monederoNoConfigurado
    ) {
      setPrecio(String(recommendedPrice));
    }
  }, [step, rutaInfo, monederoNoConfigurado]);

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (time) => {
    const d = new Date(time);
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateForApi = (date, time) => localToUtcApi(date, time);

  const canNextStep = () => {
    if (step === STEPS.FECHA_HORA) return true;
    if (step === STEPS.MAPA) {
      if (evento) {
        if (direccionEvento === "ida") return !!origenPlace?.latitude;
        return !!destinoPlace?.latitude;
      }
      return origenPlace?.latitude && destinoPlace?.latitude;
    }
    if (step === STEPS.VEHICULO) return !!vehiculoSeleccionado;
    if (step === STEPS.PRECIO) {
      if (parseInt(plazas) > maxPlazasOfertables) return false;
      if (viajeGratis) return true;
      const p = parseFloat(precio);
      return precio !== "" && !isNaN(p) && p >= minPrice && p <= maxPrice;
    }
    return false;
  };

  const handleNext = () => {
    if (step === STEPS.FECHA_HORA && evento) {
      const err = validateEventTripDate(evento, direccionEvento, fecha, hora);
      if (err) {
        Alert.alert("Fecha no válida", err);
        return;
      }
    }
    if (step === STEPS.PRECIO) {
      handleCrearViaje();
      return;
    }
    // Si el siguiente paso es VEHICULO y solo hay 1 coche, saltarlo
    if (step === STEPS.MAPA && vehiculos.length === 1) {
      setStep(STEPS.PRECIO);
      return;
    }
    // Si el siguiente paso es VEHICULO y no hay coches, alertar y redirigir
    if (step === STEPS.MAPA && vehiculos.length === 0 && !cargandoVehiculos) {
      Alert.alert(
        "Necesitas un vehículo",
        "Debes añadir al menos un vehículo antes de crear un trayecto. ¿Quieres añadir uno ahora?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Añadir vehículo",
            style: "default",
            onPress: () => {
              navigation.navigate("Main", {
                screen: "Perfil",
                params: { initialSubView: "mis-vehiculos" },
              });
            },
          },
        ],
      );
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === STEPS.FECHA_HORA) {
      navigation.goBack();
      return;
    }
    // Si el paso anterior es VEHICULO y solo hay 1 coche, saltarlo
    if (step === STEPS.PRECIO && vehiculos.length === 1) {
      setStep(STEPS.MAPA);
      return;
    }
    setStep(step - 1);
  };

  const handleCrearViaje = async () => {
    if (!user) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para crear un viaje.");
      return;
    }

    if (evento && direccionEvento === "vuelta") {
      if (!destinoPlace?.latitude) {
        Alert.alert("Faltan datos", "Selecciona el destino.");
        return;
      }
    } else {
      if (!origenPlace?.latitude) {
        Alert.alert("Faltan datos", "Selecciona el origen.");
        return;
      }
    }

    if (!evento && !destinoPlace?.latitude) {
      Alert.alert("Faltan datos", "Selecciona el destino.");
      return;
    }

    if (!vehiculoSeleccionado) {
      Alert.alert("Faltan datos", "Selecciona un vehículo.");
      return;
    }

    const { fecha: fechaApi, hora: horaApi } = formatDateForApi(fecha, hora);
    const precioNum = viajeGratis ? 0 : parseFloat(precio) || 0;
    const plazasNum = parseInt(plazas) || 4;

    setCreando(true);
    try {
      if (evento) {
        const eventoLat =
          typeof evento.latitude === "number"
            ? evento.latitude
            : parseFloat(evento.latitude);
        const eventoLng =
          typeof evento.longitude === "number"
            ? evento.longitude
            : parseFloat(evento.longitude);

        let payload;
        if (direccionEvento === "ida") {
          payload = {
            evento_id: evento.id,
            origen: origenPlace?.address || origenPlace?.name || origenTexto,
            origen_lat: Number(origenPlace?.latitude),
            origen_lng: Number(origenPlace?.longitude),
            destino_lat: eventoLat,
            destino_lng: eventoLng,
            fecha: fechaApi,
            hora: horaApi,
            plazas: plazasNum,
            conductor: user.id,
            vehiculo_id: vehiculoSeleccionado.id_coche,
            disponible: plazasNum,
            precio: precioNum,
          };
        } else {
          payload = {
            evento_id: evento.id,
            origen: evento.name,
            origen_lat: eventoLat,
            origen_lng: eventoLng,
            destino:
              destinoPlace?.address || destinoPlace?.name || destinoTexto,
            destino_lat: Number(destinoPlace?.latitude),
            destino_lng: Number(destinoPlace?.longitude),
            fecha: fechaApi,
            hora: horaApi,
            plazas: plazasNum,
            conductor: user.id,
            vehiculo_id: vehiculoSeleccionado.id_coche,
            disponible: plazasNum,
            precio: precioNum,
          };
        }

        const response = await trayectoService.crearTrayectoEvento(payload);
        const trayecto = response.trayecto || response.viaje || response;
        if (esProximoViaje(trayecto, fechaApi, horaApi)) {
          homeCache.addProximoViaje(trayecto);
        }
        Alert.alert(
          "Viaje creado",
          direccionEvento === "ida"
            ? "Tu viaje hacia el evento se ha creado correctamente."
            : "Tu viaje de vuelta desde el evento se ha creado correctamente.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } else {
        const response = await crearViajeRapido({
          conductorId: user.id,
          origen: origenPlace?.address || origenPlace?.name || origenTexto,
          destino: destinoPlace?.address || destinoPlace?.name || destinoTexto,
          fecha: fechaApi,
          hora: horaApi,
          plazas: plazasNum,
          precio: precioNum,
          vehiculoId: vehiculoSeleccionado.id_coche,
        });

        const trayectoCreado =
          response?.viaje || response?.trayecto || response;
        if (
          trayectoCreado &&
          esProximoViaje(trayectoCreado, fechaApi, horaApi)
        ) {
          homeCache.addProximoViaje(trayectoCreado);
        }

        Alert.alert("Viaje creado", "Tu viaje se ha creado correctamente.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo crear el viaje. Intenta de nuevo.",
      );
    } finally {
      setCreando(false);
    }
  };

  const renderStepIndicator = () => {
    const stepLabels =
      vehiculos.length === 1
        ? [
            { step: STEPS.FECHA_HORA, label: "Fecha" },
            { step: STEPS.MAPA, label: "Ruta" },
            { step: STEPS.PRECIO, label: "Precio" },
          ]
        : [
            { step: STEPS.FECHA_HORA, label: "Fecha" },
            { step: STEPS.MAPA, label: "Ruta" },
            { step: STEPS.VEHICULO, label: "Coche" },
            { step: STEPS.PRECIO, label: "Precio" },
          ];
    return (
      <View style={styles.stepIndicator}>
        {stepLabels.map((s, index) => (
          <React.Fragment key={s.step}>
            <View style={styles.stepItem}>
              <View
                style={[styles.stepDot, step >= s.step && styles.stepDotActive]}
              >
                {step > s.step && (
                  <CheckCircle size={12} color={COLORS.white} strokeWidth={3} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step >= s.step && styles.stepLabelActive,
                ]}
              >
                {s.label}
              </Text>
            </View>
            {index < stepLabels.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  step > s.step && styles.stepConnectorActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderFechaHoraStep = () => (
    <ScrollView
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <Calendar size={32} color={COLORS.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>¿Cuándo salimos?</Text>
        <Text style={styles.stepSubtitle}>
          Selecciona la fecha y hora de salida
        </Text>
      </View>

      <TouchableOpacity
        style={styles.dateCard}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dateCardIcon}>
          <Calendar size={24} color={COLORS.primary} strokeWidth={2} />
        </View>
        <View style={styles.dateCardContent}>
          <Text style={styles.dateCardLabel}>Fecha</Text>
          <Text style={styles.dateCardValue}>{formatDate(fecha)}</Text>
        </View>
        <ChevronRight size={20} color={COLORS.gray400} strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateCard}
        onPress={() => setShowTimePicker(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dateCardIcon}>
          <Clock size={24} color={COLORS.primary} strokeWidth={2} />
        </View>
        <View style={styles.dateCardContent}>
          <Text style={styles.dateCardLabel}>Hora de salida</Text>
          <Text style={styles.dateCardValue}>{formatTime(hora)}</Text>
        </View>
        <ChevronRight size={20} color={COLORS.gray400} strokeWidth={2} />
      </TouchableOpacity>

      <DateTimePickerModal
        visible={showDatePicker}
        mode="date"
        currentDate={fecha}
        currentTime={hora}
        minDate={eventoPickerMinDate}
        maxDate={eventoPickerMaxDate}
        onConfirm={(newDate) => {
          setFecha(new Date(newDate));
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      <DateTimePickerModal
        visible={showTimePicker}
        mode="time"
        currentDate={fecha}
        currentTime={hora}
        onConfirm={(_, newTime) => {
          setHora(new Date(newTime));
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
    </ScrollView>
  );

  const renderMapaStep = () => (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.mapaStepContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stepHeader}>
        <MapPin size={32} color={COLORS.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Origen y destino</Text>
        <Text style={styles.stepSubtitle}>
          {evento
            ? direccionEvento === "ida"
              ? "Selecciona desde dónde saldrás hacia el evento"
              : "Selecciona a dónde volverás desde el evento"
            : "Selecciona desde dónde y hacia dónde vas"}
        </Text>
      </View>

      {evento && (
        <View style={styles.direccionToggle}>
          <TouchableOpacity
            style={[
              styles.direccionButton,
              direccionEvento === "ida" && styles.direccionButtonActive,
            ]}
            onPress={() => setDireccionEvento("ida")}
          >
            <ArrowRight
              size={16}
              color={direccionEvento === "ida" ? COLORS.white : COLORS.gray500}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.direccionText,
                direccionEvento === "ida" && styles.direccionTextActive,
              ]}
            >
              Ida al evento
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.direccionButton,
              direccionEvento === "vuelta" && styles.direccionButtonActive,
            ]}
            onPress={() => setDireccionEvento("vuelta")}
          >
            <ArrowLeft
              size={16}
              color={
                direccionEvento === "vuelta" ? COLORS.white : COLORS.gray500
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.direccionText,
                direccionEvento === "vuelta" && styles.direccionTextActive,
              ]}
            >
              Vuelta del evento
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mapPreviewContainer}>
        <TripMapPreview
          origin={origenPlace}
          destination={destinoPlace}
          height={200}
        />
      </View>

      {rutaInfo && (
        <View style={styles.rutaInfoCard}>
          <View style={styles.rutaInfoItem}>
            <NavIcon size={16} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.rutaInfoText}>
              {(rutaInfo.distanceMeters / 1000).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.rutaInfoItem}>
            <Clock size={16} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.rutaInfoText}>
              {Math.ceil(rutaInfo.durationSeconds / 60)} min
            </Text>
          </View>
        </View>
      )}

      {evento && direccionEvento === "vuelta" ? (
        <View style={styles.eventDestinoCard}>
          <View style={styles.eventDestinoIcon}>
            <MapPin size={20} color={COLORS.primary} strokeWidth={2.5} />
          </View>
          <View style={styles.eventDestinoContent}>
            <Text style={styles.eventDestinoLabel}>Origen (Evento)</Text>
            <Text style={styles.eventDestinoValue} numberOfLines={2}>
              {evento.name}
            </Text>
          </View>
        </View>
      ) : (
        <PlaceAutocompleteInput
          label="Origen"
          placeholder="Tu ubicación"
          value={origenTexto}
          onChangeText={(v) => {
            setOrigenTexto(v);
            if (!v.trim()) setOrigenPlace(null);
          }}
          biasLocation={ubicacionActual}
          onSelectPlace={(p) => {
            setOrigenPlace(p);
            setOrigenTexto(p?.address || p?.name || "");
          }}
          components="country:es"
          savedLocations={savedLocations}
          showCurrentLocation={true}
          onUseCurrentLocation={async () => {
            if (!ubicacionActual) return;
            let nombre = "Mi ubicación";
            let direccion;
            try {
              const reversed = await Location.reverseGeocodeAsync({
                latitude: ubicacionActual.latitude,
                longitude: ubicacionActual.longitude,
              });
              const first = reversed?.[0];
              if (first) {
                const parts = [
                  first.street,
                  first.streetNumber,
                  first.city,
                ].filter(Boolean);
                direccion = parts.join(" ");
                if (first.name) nombre = first.name;
              }
            } catch {}
            const userPlace = {
              latitude: ubicacionActual.latitude,
              longitude: ubicacionActual.longitude,
              name: nombre,
              address: direccion || nombre,
            };
            setOrigenPlace(userPlace);
            setOrigenTexto(direccion || nombre);
          }}
        />
      )}

      {evento ? (
        direccionEvento === "ida" ? (
          <View style={styles.eventDestinoCard}>
            <View style={styles.eventDestinoIcon}>
              <MapPin size={20} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.eventDestinoContent}>
              <Text style={styles.eventDestinoLabel}>Destino (Evento)</Text>
              <Text style={styles.eventDestinoValue} numberOfLines={2}>
                {evento.name}
              </Text>
            </View>
          </View>
        ) : (
          <PlaceAutocompleteInput
            label="Destino"
            placeholder="¿A dónde vuelves?"
            value={destinoTexto}
            onChangeText={(v) => {
              setDestinoTexto(v);
              if (!v.trim()) setDestinoPlace(null);
            }}
            biasLocation={ubicacionActual}
            onSelectPlace={(p) => {
              setDestinoPlace(p);
              setDestinoTexto(p?.address || p?.name || "");
            }}
            components="country:es"
            savedLocations={savedLocations}
          />
        )
      ) : (
        <PlaceAutocompleteInput
          label="Destino"
          placeholder="¿A dónde vas?"
          value={destinoTexto}
          onChangeText={(v) => {
            setDestinoTexto(v);
            if (!v.trim()) setDestinoPlace(null);
          }}
          biasLocation={ubicacionActual}
          onSelectPlace={(p) => {
            setDestinoPlace(p);
            setDestinoTexto(p?.address || p?.name || "");
          }}
          components="country:es"
          savedLocations={savedLocations}
        />
      )}
    </ScrollView>
  );

  const renderVehiculoStep = () => (
    <ScrollView
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <Car size={32} color={COLORS.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Elige tu vehículo</Text>
        <Text style={styles.stepSubtitle}>
          Selecciona el coche con el que harás este viaje
        </Text>
      </View>

      {cargandoVehiculos ? (
        <View style={styles.vehiculoLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.vehiculoLoadingText}>Cargando vehículos...</Text>
        </View>
      ) : vehiculos.length === 0 ? (
        <View style={styles.vehiculoEmpty}>
          <Car size={48} color={COLORS.gray300} strokeWidth={1.5} />
          <Text style={styles.vehiculoEmptyTitle}>No tienes vehículos</Text>
          <Text style={styles.vehiculoEmptyText}>
            Añade un coche en tu perfil para poder crear un viaje
          </Text>
          <TouchableOpacity
            style={styles.vehiculoEmptyButton}
            onPress={() => navigation.navigate("Perfil")}
            activeOpacity={0.8}
          >
            <Text style={styles.vehiculoEmptyButtonText}>Ir al perfil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.vehiculoList}>
          {vehiculos.map((coche) => {
            const isSelected =
              vehiculoSeleccionado?.id_coche === coche.id_coche;
            const matricula = coche.matricula || "";
            const matriculaFormateada =
              matricula.length === 7
                ? `${matricula.substring(0, 4)} ${matricula.substring(4)}`
                : matricula;
            return (
              <TouchableOpacity
                key={coche.id_coche}
                style={[
                  styles.vehiculoCard,
                  isSelected && styles.vehiculoCardActive,
                ]}
                onPress={() => {
                  setVehiculoSeleccionado(coche);
                  const maxPlazas = Math.max(1, (coche.num_plazas || 5) - 1);
                  if (parseInt(plazas) > maxPlazas)
                    setPlazas(String(maxPlazas));
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.vehiculoIcon,
                    isSelected && styles.vehiculoIconActive,
                  ]}
                >
                  <Car
                    size={24}
                    color={isSelected ? COLORS.white : COLORS.primary}
                    strokeWidth={2.5}
                  />
                </View>
                <View style={styles.vehiculoInfo}>
                  <Text style={styles.vehiculoName}>
                    {coche.marca} {coche.modelo}
                  </Text>
                  <Text style={styles.vehiculoMatricula}>
                    {matriculaFormateada}
                  </Text>
                  <Text style={styles.vehiculoDetails}>
                    {coche.color || "—"} · {coche.num_plazas || "?"} plazas
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.vehiculoCheck}>
                    <CheckCircle
                      size={24}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  const renderPrecioStep = () => (
    <ScrollView
      style={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stepHeader}>
        <Euro size={32} color={COLORS.primary} strokeWidth={2} />
        <Text style={styles.stepTitle}>Tu precio por pasajero</Text>
        <Text style={styles.stepSubtitle}>
          Define cuánto quieres recibir por pasajero y cuántas plazas ofreces
        </Text>
      </View>

      {rutaInfo && (
        <View style={styles.rutaResumenCard}>
          <View style={styles.rutaResumenRow}>
            <Text style={styles.rutaResumenLabel}>Distancia</Text>
            <Text style={styles.rutaResumenValue}>
              {(rutaInfo.distanceMeters / 1000).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.rutaResumenRow}>
            <Text style={styles.rutaResumenLabel}>Duración</Text>
            <Text style={styles.rutaResumenValue}>
              {Math.ceil(rutaInfo.durationSeconds / 60)} min
            </Text>
          </View>
        </View>
      )}

      {monederoNoConfigurado ? (
        <View style={styles.inputCard}>
          <View style={styles.monederoWarningRow}>
            <Euro size={20} color={COLORS.warning} strokeWidth={2} />
            <Text style={styles.monederoWarningTitle}>Viaje gratis</Text>
          </View>
          <Text style={styles.monederoWarningText}>
            No tienes el monedero configurado. Para poder recibir los ingresos
            de los pasajeros, configura tu monedero en el perfil. Hasta
            entonces, este viaje será gratuito.
          </Text>
        </View>
      ) : (
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Modalidad de precio</Text>
          <TouchableOpacity
            style={[
              styles.priceOption,
              !viajeGratis && styles.priceOptionActive,
            ]}
            onPress={() => setViajeGratis(false)}
            activeOpacity={0.8}
          >
            <View style={styles.priceOptionLeft}>
              <Euro
                size={20}
                color={!viajeGratis ? COLORS.primary : COLORS.gray400}
                strokeWidth={2}
              />
              <View>
                <Text style={styles.priceOptionTitle}>Precio</Text>
                <Text style={styles.priceOptionSub}>
                  Define tu precio por pasajero según la distancia
                </Text>
              </View>
            </View>
            {!viajeGratis && (
              <CheckCircle size={20} color={COLORS.primary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.priceOption,
              viajeGratis && styles.priceOptionActive,
            ]}
            onPress={() => setViajeGratis(true)}
            activeOpacity={0.8}
          >
            <View style={styles.priceOptionLeft}>
              <Gift
                size={20}
                color={viajeGratis ? COLORS.primary : COLORS.gray400}
                strokeWidth={2}
              />
              <View>
                <Text style={styles.priceOptionTitle}>Viaje gratis</Text>
                <Text style={styles.priceOptionSub}>
                  Los pasajeros no pagan por este trayecto
                </Text>
              </View>
            </View>
            {viajeGratis && (
              <CheckCircle size={20} color={COLORS.primary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          {!viajeGratis && (
            <View style={styles.priceInputContainer}>
              <Text style={styles.inputLabel}>Tu precio por pasajero (€)</Text>
              <View style={styles.priceInputRow}>
                <Euro size={20} color={COLORS.gray400} strokeWidth={2} />
                <TextInput
                  style={styles.priceInput}
                  value={precio}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9.]/g, "");
                    const parsed = parseFloat(cleaned);
                    if (!isNaN(parsed) && parsed > maxPrice) {
                      cleaned = String(maxPrice);
                    }
                    setPrecio(cleaned);
                  }}
                  placeholder={recommendedPrice.toFixed(2)}
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
              <Text style={styles.priceHintText}>
                Rango aceptable: {minPrice.toFixed(2)}€ – {maxPrice.toFixed(2)}€
                {"  "}({MIN_PRICE_PER_KM.toFixed(2)}–
                {MAX_PRICE_PER_KM.toFixed(2)}€/km)
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>
          Plazas disponibles (máx. {maxPlazasOfertables})
        </Text>
        <View style={styles.plazasRow}>
          {Array.from({ length: maxPlazasOfertables }, (_, i) => i + 1).map(
            (n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.plazaButton,
                  parseInt(plazas) === n && styles.plazaButtonActive,
                ]}
                onPress={() => setPlazas(String(n))}
              >
                <Text
                  style={[
                    styles.plazaButtonText,
                    parseInt(plazas) === n && styles.plazaButtonTextActive,
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

      <View style={styles.resumenCard}>
        <View style={styles.resumenHeader}>
          <Text style={styles.resumenHeaderTitle}>Resumen del viaje</Text>
        </View>

        <View style={styles.resumenRouteSection}>
          <View style={styles.resumenRouteRow}>
            <View style={styles.resumenRouteDot} />
            <Text style={styles.resumenRouteText} numberOfLines={1}>
              {origenTexto || "Origen"}
            </Text>
          </View>
          <View style={styles.resumenRouteLine} />
          <View style={styles.resumenRouteRow}>
            <View
              style={[
                styles.resumenRouteDot,
                { backgroundColor: COLORS.error },
              ]}
            />
            <Text style={styles.resumenRouteText} numberOfLines={1}>
              {destinoTexto || "Destino"}
            </Text>
          </View>
        </View>

        <View style={styles.resumenDivider} />

        <View style={styles.resumenInfoGrid}>
          <View style={styles.resumenInfoItem}>
            <Calendar size={16} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.resumenInfoLabel}>Fecha</Text>
            <Text style={styles.resumenInfoValue}>{formatDate(fecha)}</Text>
          </View>
          <View style={styles.resumenInfoItem}>
            <Clock size={16} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.resumenInfoLabel}>Hora</Text>
            <Text style={styles.resumenInfoValue}>{formatTime(hora)}</Text>
          </View>
        </View>

        <View style={styles.resumenDivider} />

        <View style={styles.resumenInfoGrid}>
          <View style={styles.resumenInfoItem}>
            <Car size={16} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.resumenInfoLabel}>Vehiculo</Text>
            <Text style={styles.resumenInfoValue} numberOfLines={1}>
              {vehiculoSeleccionado
                ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}`
                : "—"}
            </Text>
          </View>
          <View style={styles.resumenInfoItem}>
            <Euro size={16} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.resumenInfoLabel}>Plazas</Text>
            <Text style={styles.resumenInfoValue}>
              {plazas} · {viajeGratis ? "Gratis" : `${precio || "—"}€`}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={COLORS.gray700} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {evento
            ? direccionEvento === "ida"
              ? "Viaje a evento"
              : "Vuelta del evento"
            : "Crear viaje"}
        </Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 80 })}
      >
        {step === STEPS.FECHA_HORA && renderFechaHoraStep()}
        {step === STEPS.MAPA && renderMapaStep()}
        {step === STEPS.VEHICULO && renderVehiculoStep()}
        {step === STEPS.PRECIO && renderPrecioStep()}
      </KeyboardAvoidingView>

      {/* Footer con botón */}
      <View
        style={[
          styles.footer,
          { paddingBottom: SPACING.md + (insets.bottom || 0) },
        ]}
      >
        <Button
          title={step === STEPS.PRECIO ? "Crear viaje" : "Siguiente"}
          onPress={handleNext}
          variant="primary"
          size="large"
          disabled={!canNextStep() || creando}
          loading={creando}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  stepItem: {
    alignItems: "center",
    gap: SPACING.xs,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  stepLabelActive: {
    color: COLORS.gray800,
    fontWeight: "600",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.gray200,
    marginBottom: SPACING.xxl,
  },
  stepConnectorActive: {
    backgroundColor: COLORS.primary,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  stepContent: {
    paddingBottom: SPACING.xl,
  },
  mapaStepContent: {
    paddingBottom: SPACING.xxl + 96,
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  stepTitle: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginTop: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  dateCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  dateCardContent: {
    flex: 1,
  },
  dateCardLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  dateCardValue: {
    fontSize: FONTS.md,
    color: COLORS.gray800,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "capitalize",
  },
  mapPreviewContainer: {
    marginBottom: SPACING.md,
  },
  rutaInfoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.lg,
  },
  rutaInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  rutaInfoText: {
    fontSize: FONTS.sm,
    color: COLORS.primaryDark,
    fontWeight: "600",
  },
  rutaResumenCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  rutaResumenRow: {
    flex: 1,
    alignItems: "center",
  },
  rutaResumenLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  rutaResumenValue: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  inputLabel: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  priceInputContainer: {
    marginTop: SPACING.md,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: FONTS.xxl,
    fontWeight: "bold",
    color: COLORS.gray800,
    padding: 0,
  },
  priceHintText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
  },
  monederoWarningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  monederoWarningTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.warning,
  },
  monederoWarningText: {
    fontSize: FONTS.sm,
    color: COLORS.warning,
    lineHeight: 20,
  },
  priceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  priceOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  priceOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  priceOptionTitle: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  priceOptionSub: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  plazasRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  plazaButton: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  plazaButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  plazaButtonText: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray500,
  },
  plazaButtonTextActive: {
    color: COLORS.primary,
  },
  resumenCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  resumenHeader: {
    marginBottom: SPACING.md,
  },
  resumenHeaderTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  resumenRouteSection: {
    paddingLeft: SPACING.xs,
  },
  resumenRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    height: 24,
  },
  resumenRouteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  resumenRouteLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray200,
    marginLeft: 3,
  },
  resumenRouteText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    fontWeight: "500",
  },
  resumenDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.md,
  },
  resumenInfoGrid: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  resumenInfoItem: {
    flex: 1,
    gap: SPACING.xs,
  },
  resumenInfoLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  resumenInfoValue: {
    fontSize: FONTS.sm,
    color: COLORS.gray800,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  footerButton: {
    width: "100%",
  },
  direccionToggle: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  direccionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  direccionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  direccionText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  direccionTextActive: {
    color: COLORS.white,
  },
  eventDestinoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  eventDestinoIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  eventDestinoContent: {
    flex: 1,
  },
  eventDestinoLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  eventDestinoValue: {
    fontSize: FONTS.md,
    color: COLORS.gray800,
    fontWeight: "600",
    marginTop: 2,
  },
  vehiculoList: {
    gap: SPACING.md,
  },
  vehiculoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  vehiculoCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  vehiculoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  vehiculoIconActive: {
    backgroundColor: COLORS.primary,
  },
  vehiculoInfo: {
    flex: 1,
  },
  vehiculoName: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  vehiculoMatricula: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: 2,
    letterSpacing: 1,
  },
  vehiculoDetails: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    marginTop: 2,
  },
  vehiculoCheck: {
    marginLeft: SPACING.sm,
  },
  vehiculoLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  vehiculoLoadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  vehiculoEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  vehiculoEmptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginTop: SPACING.md,
  },
  vehiculoEmptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  vehiculoEmptyButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  vehiculoEmptyButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: "600",
  },
});

export default CrearViajeScreen;
