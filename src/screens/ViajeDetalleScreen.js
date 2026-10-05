// YouConnext - ViajeDetalleScreen (Professional Redesign)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Play,
  Car,
  MapPin,
  Users,
  Navigation as NavIcon,
  ChevronRight,
  CreditCard,
  QrCode,
  AlertCircle,
  Flag,
  MessageCircle,
  ShieldCheck,
  Star,
  Leaf,
  Music,
  Wind,
  Luggage,
  ExternalLink,
  Share2,
  Ticket,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { useViaje } from "../context/ViajeContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { TripMapPreview, QRCodeModal, Skeleton } from "../components";
import { trayectoService } from "../services/travels/trayectoService";
import { reservaService } from "../services/travels/reservaService";
import { carService } from "../services/carService";
import { usuarioService } from "../services/usuarioService";
import { paymentService } from "../services/paymentService";
import * as Location from "expo-location";
import {
  parseTripDate,
  formatTripDate,
  formatTripTime,
} from "../services/dateUtils";
import { getEstadoConfig } from "../utils/viajeEstado";

const ViajeDetalleScreen = ({ route, navigation }) => {
  const { viaje: viajeInicial, id: idDirecto } = route.params || {};
  const targetId = idDirecto || viajeInicial?.id;
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const {
    trackingActivo,
    iniciarViaje,
    completarViaje,
    iniciarTrackingPasajero,
    detenerTrackingPasajero,
  } = useViaje();

  const [viaje, setViaje] = useState(viajeInicial);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reservaExistente, setReservaExistente] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [estadoPasajero, setEstadoPasajero] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [vehiculo, setVehiculo] = useState(null);
  const [conductorInfo, setConductorInfo] = useState(null);
  const [llegadaRegistrada, setLlegadaRegistrada] = useState(false);

  useEffect(() => {
    if (targetId) {
      cargarDetalleViaje();
    } else {
      setLoading(false);
    }
  }, [targetId]);

  const cargarDetalleViaje = async () => {
    setLoading(true);
    try {
      const detalle = await trayectoService.obtenerTrayectoCompleto(targetId);

      let pasajerosList = detalle?.pasajeros || detalle?.pasajerosList || [];

      if (!pasajerosList || pasajerosList.length === 0) {
        try {
          const reservasData =
            await reservaService.obtenerReservasPorTrayecto(targetId);
          pasajerosList = reservasData?.pasajerosList || reservasData || [];
        } catch (e) {
          console.log("[ViajeDetalle] Fallback reservas fallido:", e);
        }
      }

      const viajeConPasajeros = { ...detalle, pasajeros: pasajerosList };
      setViaje(viajeConPasajeros);

      // Cargar vehículo
      const vehiculoId = detalle?.vehiculo_id;
      if (vehiculoId) {
        try {
          const carRes = await carService.obtenerCochePorId(vehiculoId);
          const carData = carRes?.car || null;
          setVehiculo(carData);
        } catch (e) {
          setVehiculo(null);
        }
      }

      // Cargar info pública del conductor
      const conductorId = detalle?.conductor_id || detalle?.conductor?.id;
      if (conductorId) {
        try {
          const publicInfo =
            await usuarioService.getUserPublicProfile(conductorId);
          const conductorData = publicInfo?.user || publicInfo || null;
          setConductorInfo(conductorData);
        } catch (e) {
          setConductorInfo(null);
        }
      }

      // Buscar reserva del usuario actual
      if (user?.id) {
        const mia = pasajerosList.find(
          (p) => p.user_id === user.id || p.usuario_id === user.id,
        );
        setReservaExistente(mia || null);

        if (mia) {
          try {
            const estado =
              await trayectoService.obtenerEstadoTrayecto(targetId);
            setEstadoPasajero(estado);
            if (
              estado?.pasajero?.recogido &&
              !estado?.pasajero?.en_destino &&
              !trackingActivo
            ) {
              try {
                await iniciarTrackingPasajero(viajeConPasajeros);
              } catch (e) {
                console.warn("[ViajeDetalle] Error tracking:", e?.message);
              }
            }
          } catch (e) {
            console.log("[ViajeDetalle] Error estado pasajero:", e);
          }
        }
      }
    } catch (error) {
      console.log("Error al cargar detalle:", error);
      Alert.alert("Error", "No se pudo obtener el detalle de este trayecto.");
    } finally {
      setLoading(false);
    }
  };

  const esConductor =
    user?.id ===
    (viaje?.conductor_id || viaje?.conductorId || viaje?.conductor);

  const estadoViaje = (viaje?.status || viaje?.estado || "").toLowerCase();
  const estaCompletado =
    estadoViaje === "finalizado" ||
    estadoViaje === "completado" ||
    estadoViaje === "cancelado";

  const puedeIniciar =
    esConductor &&
    (estadoViaje === "pendiente" ||
      estadoViaje === "programado" ||
      estadoViaje === "pendiente_pago");
  const puedeFinalizar =
    esConductor &&
    (estadoViaje === "activo" ||
      estadoViaje === "en curso" ||
      estadoViaje === "en_curso");
  const estaEnCurso =
    estadoViaje === "activo" ||
    estadoViaje === "en curso" ||
    estadoViaje === "en_curso";

  const handleReservar = async () => {
    if (!user?.id || !viaje?.id) return;
    if (viaje.disponible <= 0) {
      Alert.alert("Sin plazas", "Este trayecto no tiene plazas disponibles.");
      return;
    }
    setReserving(true);
    try {
      const returnUrl = `https://app.youconnext.es/redirect?to=viaje-detalle&id=${viaje.id}`;
      const response = await reservaService.crearReserva(
        user.id,
        viaje.id,
        returnUrl,
      );
      const idReserva =
        response?.reserva?.id || response?.id_reserva || response?.id;
      if (idReserva) {
        if (response?.stripe_url) {
          await Linking.openURL(response.stripe_url);
        } else {
          Alert.alert(
            "Reserva creada",
            response?.message || "Tu reserva se ha creado correctamente.",
          );
        }
      } else {
        Alert.alert(
          "Reserva creada",
          response?.message || "Tu reserva se ha creado correctamente.",
        );
      }
      cargarDetalleViaje();
    } catch (error) {
      Alert.alert("Error", error?.message || "No se pudo crear la reserva.");
    } finally {
      setReserving(false);
    }
  };

  const handleCancelarReserva = () => {
    if (!reservaExistente?.id_reserva) return;
    Alert.alert(
      "Cancelar reserva",
      "¿Estás seguro de que quieres cancelar tu reserva en este viaje?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setReserving(true);
            try {
              await reservaService.cancelarReserva(reservaExistente.id_reserva);
              setReservaExistente(null);
              Alert.alert("Reserva cancelada", "Tu reserva ha sido cancelada.");
              cargarDetalleViaje();
            } catch (error) {
              Alert.alert(
                "Error",
                error?.message || "No se pudo cancelar la reserva.",
              );
            } finally {
              setReserving(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirmarRecogida = async () => {
    if (!reservaExistente?.id_reserva || !viaje?.id) return;
    setReserving(true);
    try {
      let lat = 0;
      let lng = 0;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = location.coords.latitude;
          lng = location.coords.longitude;
        }
      } catch (e) {
        console.warn("No se pudo obtener ubicación:", e?.message);
      }

      await trayectoService.crearEventoTrayecto(viaje.id, {
        lat,
        lng,
        tipo_evento: "recogida",
        id_reserva: reservaExistente.id_reserva,
      });
      Alert.alert(
        "Recogida confirmada",
        "Has confirmado que el conductor te ha recogido.",
      );
      setReservaExistente({
        ...reservaExistente,
        trip_outcome: "success",
      });
      setEstadoPasajero((prev) => ({
        ...prev,
        pasajero: { ...(prev?.pasajero || {}), recogido: true },
      }));
      try {
        await iniciarTrackingPasajero(viaje);
      } catch (e) {
        console.warn("No se pudo iniciar tracking de pasajero:", e?.message);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo confirmar la recogida.",
      );
    } finally {
      setReserving(false);
    }
  };

  const handleLlegadaDestino = async () => {
    if (!viaje?.id) return;
    setReserving(true);
    try {
      let lat = 0;
      let lng = 0;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = location.coords.latitude;
          lng = location.coords.longitude;
        }
      } catch (e) {
        console.warn("No se pudo obtener ubicación:", e?.message);
      }

      await trayectoService.registrarLlegadaDestino(viaje.id, { lat, lng });
      Alert.alert(
        "Llegada registrada",
        "Has confirmado que has llegado a tu destino.",
      );
      setLlegadaRegistrada(true);
      setEstadoPasajero((prev) => ({
        ...prev,
        pasajero: { ...(prev?.pasajero || {}), en_destino: true },
      }));
      try {
        await detenerTrackingPasajero();
      } catch (e) {
        console.warn("No se pudo detener tracking de pasajero:", e?.message);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo registrar la llegada.",
      );
    } finally {
      setReserving(false);
    }
  };

  const handleRetornarPago = async () => {
    if (!reservaExistente?.id_reserva) return;
    setReserving(true);
    try {
      const returnUrl = viaje?.id
        ? `https://app.youconnext.es/redirect?to=viaje-detalle&id=${viaje.id}`
        : "https://app.youconnext.es/redirect?to=perfil";
      const response = await reservaService.resumePago(
        reservaExistente.id_reserva,
        returnUrl,
      );
      if (response?.stripe_url) {
        await Linking.openURL(response.stripe_url);
      } else {
        Alert.alert("Error", "No se pudo retomar el pago.");
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "No se pudo retomar el pago.");
    } finally {
      setReserving(false);
    }
  };

  const handleIniciarViaje = async () => {
    setActionLoading(true);
    try {
      await iniciarViaje(viaje);
      const viajeActualizado = { ...viaje, status: "en curso" };
      setViaje(viajeActualizado);
      Alert.alert(
        "Viaje iniciado",
        "El tracking GPS está activo. ¡Buen viaje!",
        [
          {
            text: "Ver recorrido",
            onPress: () =>
              navigation.navigate("ViajeEnCurso", { viaje: viajeActualizado }),
          },
          { text: "OK" },
        ],
      );
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo iniciar el viaje.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizarViaje = async () => {
    Alert.alert(
      "Finalizar viaje",
      "¿Estás seguro de que quieres finalizar este trayecto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await completarViaje(viaje);
              setViaje({ ...viaje, status: "finalizado" });

              const tuvoPasajeros =
                Array.isArray(viaje.pasajeros) && viaje.pasajeros.length > 0;

              if (tuvoPasajeros) {
                Alert.alert(
                  "Viaje finalizado",
                  "El trayecto se ha completado correctamente. Ahora puedes valorar a tus pasajeros.",
                  [
                    {
                      text: "Valorar pasajeros",
                      onPress: () =>
                        navigation.replace("ValorarPasajeros", { viaje }),
                    },
                    {
                      text: "Más tarde",
                      onPress: () => navigation.goBack(),
                    },
                  ],
                );
              } else {
                Alert.alert(
                  "Viaje finalizado",
                  "El trayecto se ha completado correctamente.",
                  [
                    {
                      text: "OK",
                      onPress: () => navigation.goBack(),
                    },
                  ],
                );
              }
            } catch (e) {
              Alert.alert(
                "Error",
                e?.message || "No se pudo finalizar el viaje.",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleShareTrip = async () => {
    try {
      const origin = viaje?.origen || viaje?.puntoInicialNombre || "Origen";
      const destination = viaje?.destino || viaje?.puntoFinalNombre || "Destino";
      await Share.share({
        message: `¡Mira este trayecto en YouConnext! ${origin} → ${destination} por ${viaje?.precio != null ? `${viaje.precio}€` : "Gratis"}. https://app.youconnext.es/trayecto/${targetId}`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleOpenGPS = () => {
    const dLat = viaje?.destino_lat || viaje?.puntoFinalLat;
    const dLng = viaje?.destino_lng || viaje?.puntoFinalLng;
    const oLat = viaje?.origen_lat || viaje?.puntoInicialLat;
    const oLng = viaje?.origen_lng || viaje?.puntoInicialLng;

    if (!dLat || !dLng) {
      Alert.alert("GPS", "No hay coordenadas disponibles para este trayecto.");
      return;
    }

    const url =
      Platform.OS === "ios"
        ? `maps://app?saddr=${oLat || ""},${oLng || ""}&daddr=${dLat},${dLng}`
        : `google.navigation:q=${dLat},${dLng}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}`,
          );
        }
      })
      .catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}`,
        );
      });
  };

  // --- SKELETON SCREEN ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del viaje</Text>
          <Skeleton width={80} height={28} borderRadius={RADIUS.full} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          scrollEnabled={false}
        >
          {/* Skeleton Route Card */}
          <View style={styles.heroRouteCard}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineVisual}>
                <Skeleton width={12} height={12} borderRadius={6} />
                <View style={styles.timelineDashedSkeleton} />
                <Skeleton width={12} height={12} borderRadius={6} />
              </View>
              <View style={styles.timelineDetails}>
                <View>
                  <Skeleton width={60} height={12} />
                  <Skeleton width={200} height={18} style={{ marginTop: 6 }} />
                </View>
                <View style={{ marginTop: 26 }}>
                  <Skeleton width={60} height={12} />
                  <Skeleton width={180} height={18} style={{ marginTop: 6 }} />
                </View>
              </View>
            </View>
            <View style={styles.heroStatsDivider} />
            <View style={styles.heroStatsRow}>
              <Skeleton width={90} height={28} borderRadius={RADIUS.full} />
              <Skeleton width={75} height={28} borderRadius={RADIUS.full} />
              <Skeleton width={85} height={28} borderRadius={RADIUS.full} />
            </View>
          </View>

          {/* Skeleton Map Preview */}
          <View style={styles.mapCard}>
            <Skeleton width="100%" height={180} borderRadius={RADIUS.lg} />
          </View>

          {/* Skeleton Driver Card */}
          <View style={styles.sectionHeaderRow}>
            <Skeleton width={130} height={14} />
          </View>
          <View style={styles.card}>
            <View style={styles.driverRow}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={styles.driverInfo}>
                <Skeleton width={140} height={16} />
                <Skeleton width={90} height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.driverRow}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={styles.driverInfo}>
                <Skeleton width={110} height={16} />
                <Skeleton width={130} height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          </View>

          {/* Skeleton Passengers */}
          <View style={styles.sectionHeaderRow}>
            <Skeleton width={100} height={14} />
          </View>
          <View style={styles.card}>
            <View style={styles.passengerRow}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={styles.passengerInfo}>
                <Skeleton width={120} height={15} />
                <Skeleton width={70} height={12} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Skeleton Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          <View>
            <Skeleton width={60} height={12} />
            <Skeleton width={80} height={22} style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={160} height={48} borderRadius={RADIUS.full} />
        </View>
      </SafeAreaView>
    );
  }

  if (!viaje && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del viaje</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <AlertCircle size={36} color={COLORS.error} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Trayecto no disponible</Text>
          <Text style={styles.emptySubtitle}>
            No se pudo cargar la información de este trayecto o ya no está activo.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyButtonText}>Volver atrás</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const origen =
    viaje?.origen_lat != null && viaje?.origen_lng != null
      ? {
          latitude: viaje.origen_lat,
          longitude: viaje.origen_lng,
          name: viaje?.origen || "Origen",
        }
      : viaje?.puntoInicialLat != null && viaje?.puntoInicialLng != null
        ? {
            latitude: viaje.puntoInicialLat,
            longitude: viaje.puntoInicialLng,
            name: viaje?.puntoInicialNombre || "Origen",
          }
        : null;

  const destino =
    viaje?.destino_lat != null && viaje?.destino_lng != null
      ? {
          latitude: viaje.destino_lat,
          longitude: viaje.destino_lng,
          name: viaje?.destino || "Destino",
        }
      : viaje?.puntoFinalLat != null && viaje?.puntoFinalLng != null
        ? {
            latitude: viaje.puntoFinalLat,
            longitude: viaje.puntoFinalLng,
            name: viaje?.puntoFinalNombre || "Destino",
          }
        : null;

  const estadoCfg = getEstadoConfig(estadoViaje);
  const tripDate = parseTripDate(viaje);
  const fechaLabel = tripDate ? formatTripDate(viaje) : "";
  const horaLabel = tripDate ? formatTripTime(viaje) : "";
  const plazasDisponibles = viaje?.disponible ?? 0;
  const precio = viaje?.precio != null ? `${Number(viaje.precio).toFixed(2)}€` : "Gratis";

  const conductorId = viaje?.conductor_id || viaje?.conductor?.id;
  const conductorNombre = conductorInfo?.name
    ? conductorInfo.name
    : typeof viaje?.conductor === "object"
      ? `${viaje?.conductor?.nombre || ""} ${viaje?.conductor?.apellidos || ""}`.trim() ||
        "Conductor"
      : viaje?.conductor || "Conductor";

  const conductorAvatar = conductorInfo?.img_perfil || viaje?.conductor?.img_perfil;
  const conductorRating = conductorInfo?.rating || "4.9";
  const conductorValoraciones = conductorInfo?.total_reviews || "18";

  const matricula = vehiculo?.matricula || viaje?.matricula || "";
  const modeloAuto = vehiculo
    ? `${vehiculo.marca || ""} ${vehiculo.modelo || ""}`.trim()
    : viaje?.modeloVehiculo || "Vehículo verificado";
  const colorAuto = vehiculo?.color || viaje?.colorVehiculo || "";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle del trayecto
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconHeaderBtn}
            onPress={handleShareTrip}
            hitSlop={6}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={COLORS.gray700} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={[styles.statusPill, { backgroundColor: estadoCfg.bg }]}>
            <View
              style={[styles.statusDot, { backgroundColor: estadoCfg.dot }]}
            />
            <Text style={[styles.statusPillText, { color: estadoCfg.color }]}>
              {estadoCfg.label}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: estaCompletado ? insets.bottom + 24 : insets.bottom + 110 },
        ]}
      >
        {/* HERO ROUTE CARD */}
        <View style={styles.heroRouteCard}>
          <View style={styles.timelineRow}>
            <View style={styles.timelineVisual}>
              <View style={styles.originCircle} />
              <View style={styles.timelineLine} />
              <View style={styles.destPinBox}>
                <Flag size={12} color={COLORS.error} fill={COLORS.error} />
              </View>
            </View>

            <View style={styles.timelineDetails}>
              {/* Origen */}
              <View style={styles.stopBlock}>
                <View style={styles.stopTimeRow}>
                  <Text style={styles.stopTime}>{horaLabel || "Salida"}</Text>
                  <Text style={styles.stopBadge}>ORIGEN</Text>
                </View>
                <Text style={styles.stopLocation} numberOfLines={2}>
                  {viaje?.origen ||
                    viaje?.puntoInicialNombre ||
                    "Punto de partida"}
                </Text>
              </View>

              {/* Destino */}
              <View style={[styles.stopBlock, { marginTop: SPACING.md + 4 }]}>
                <View style={styles.stopTimeRow}>
                  <Text style={styles.stopTime}>Llegada</Text>
                  <Text style={[styles.stopBadge, styles.destBadge]}>DESTINO</Text>
                </View>
                <Text style={styles.stopLocation} numberOfLines={2}>
                  {viaje?.destino ||
                    viaje?.puntoFinalNombre ||
                    "Punto de destino"}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Info Tags */}
          <View style={styles.heroStatsDivider} />
          <View style={styles.heroStatsRow}>
            {!!fechaLabel && (
              <View style={styles.statChip}>
                <Calendar size={13} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.statChipText}>{fechaLabel}</Text>
              </View>
            )}

            <View style={styles.statChip}>
              <Users size={13} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.statChipText}>
                {plazasDisponibles > 0
                  ? `${plazasDisponibles} ${plazasDisponibles === 1 ? "plaza libre" : "plazas libres"}`
                  : "Completo"}
              </Text>
            </View>

            <View style={[styles.statChip, styles.priceStatChip]}>
              <Text style={styles.priceStatText}>
                {precio} <Text style={styles.priceSubText}>/ plaza</Text>
              </Text>
            </View>
          </View>

          {/* Event Tag if linked */}
          {(viaje?.evento_nombre || viaje?.event_name || viaje?.evento) && (
            <TouchableOpacity
              style={styles.eventBanner}
              activeOpacity={0.8}
              onPress={() => {
                const eventId = viaje?.evento_id || viaje?.eventId;
                if (eventId) {
                  navigation.navigate("EventDetalle", { eventId });
                }
              }}
            >
              <Ticket size={15} color={COLORS.secondary} strokeWidth={2.5} />
              <Text style={styles.eventBannerText} numberOfLines={1}>
                Conexión con evento:{" "}
                <Text style={styles.eventBannerBold}>
                  {viaje?.evento_nombre || viaje?.event_name || viaje?.evento?.title || "Evento"}
                </Text>
              </Text>
              <ChevronRight size={14} color={COLORS.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* MAP PREVIEW & GPS NAVIGATION */}
        <View style={styles.mapCard}>
          <TripMapPreview origin={origen} destination={destino} height={180} />
          <TouchableOpacity
            style={styles.mapGpsButton}
            onPress={handleOpenGPS}
            activeOpacity={0.85}
          >
            <NavIcon size={13} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.mapGpsText}>Abrir en GPS</Text>
            <ExternalLink size={12} color={COLORS.white} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* IMPACTO ECOLÓGICO / SOSTENIBILIDAD */}
        <View style={styles.ecoCard}>
          <View style={styles.ecoIconBox}>
            <Leaf size={18} color={COLORS.primary} strokeWidth={2.5} />
          </View>
          <View style={styles.ecoTextBox}>
            <Text style={styles.ecoTitle}>Trayecto Sostenible</Text>
            <Text style={styles.ecoSubtitle}>
              Compartiendo este trayecto ahorras ~4.5 kg de CO₂ frente al viaje individual.
            </Text>
          </View>
        </View>

        {/* CONDUCTOR */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Conductor</Text>
          {conductorId && conductorId !== user?.id && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("PerfilPublico", { userId: conductorId })
              }
            >
              <Text style={styles.sectionLink}>Ver perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.driverRow}
            onPress={() => {
              if (conductorId && conductorId !== user?.id) {
                navigation.navigate("PerfilPublico", { userId: conductorId });
              }
            }}
            disabled={!conductorId || conductorId === user?.id}
            activeOpacity={0.7}
          >
            <View style={styles.driverAvatarWrap}>
              {conductorAvatar ? (
                <Image
                  source={{ uri: conductorAvatar }}
                  style={styles.driverAvatarImg}
                />
              ) : (
                <View style={styles.driverAvatarFallback}>
                  <Text style={styles.driverAvatarText}>
                    {conductorNombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={11} color={COLORS.white} strokeWidth={3} />
              </View>
            </View>

            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName} numberOfLines={1}>
                  {conductorNombre}
                </Text>
              </View>
              <View style={styles.driverRatingRow}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.driverRatingScore}>{conductorRating}</Text>
                <Text style={styles.driverRatingCount}>
                  ({conductorValoraciones} opiniones)
                </Text>
              </View>
            </View>

            {conductorId && conductorId !== user?.id && (
              <ChevronRight
                size={18}
                color={COLORS.gray400}
                strokeWidth={2.5}
              />
            )}
          </TouchableOpacity>

          {/* Botón mensaje directo al conductor */}
          {!esConductor && conductorId && conductorId !== user?.id && (
            <TouchableOpacity
              style={styles.chatDriverBtn}
              onPress={() =>
                navigation.navigate("DirectChat", {
                  peerId: conductorId,
                  peerName: conductorNombre,
                })
              }
              activeOpacity={0.8}
            >
              <MessageCircle
                size={16}
                color={COLORS.primary}
                strokeWidth={2.5}
              />
              <Text style={styles.chatDriverBtnText}>
                Enviar mensaje al conductor
              </Text>
            </TouchableOpacity>
          )}

          {/* Vehículo */}
          <View style={styles.cardDivider} />
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIconBox}>
              <Car size={20} color={COLORS.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {modeloAuto}
              </Text>
              <Text style={styles.vehicleSub}>
                {colorAuto ? `Color ${colorAuto} · ` : ""}Vehículo verificado
              </Text>
            </View>
            {!!matricula && (
              <View style={styles.licensePlate}>
                <View style={styles.plateFlag}>
                  <Text style={styles.plateFlagText}>E</Text>
                </View>
                <Text style={styles.plateText}>{matricula}</Text>
              </View>
            )}
          </View>
        </View>

        {/* COMODIDADES Y PREFERENCIAS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Comodidades</Text>
        </View>
        <View style={styles.amenitiesGrid}>
          <View style={styles.amenityChip}>
            <Luggage size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
            <Text style={styles.amenityText}>Equipaje en maletero</Text>
          </View>
          <View style={styles.amenityChip}>
            <Wind size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
            <Text style={styles.amenityText}>Climatización A/C</Text>
          </View>
          <View style={styles.amenityChip}>
            <Music size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
            <Text style={styles.amenityText}>Música permitida</Text>
          </View>
          <View style={styles.amenityChip}>
            <CheckCircle2 size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
            <Text style={styles.amenityText}>Espacio cómodo</Text>
          </View>
        </View>

        {/* PASAJEROS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Pasajeros ({viaje?.pasajeros?.length || 0})
          </Text>
        </View>

        {viaje?.pasajeros?.length > 0 ? (
          <View style={styles.card}>
            {viaje.pasajeros.map((p, index) => {
              const nombre =
                `${p.usuario?.nombre || p.nombre || "Pasajero"} ${p.usuario?.apellidos || p.apellidos || ""}`.trim();
              const imgPerfil = p.usuario?.img_perfil || p.img_perfil;
              const pasajeroId = p.user_id || p.usuario_id || p.usuario?.id;
              const esUltimo = index === viaje.pasajeros.length - 1;

              const isConfirmed =
                p.status === "completed" || p.trip_outcome === "success";

              return (
                <TouchableOpacity
                  key={p.id_reserva || index}
                  style={[
                    styles.passengerRow,
                    !esUltimo && styles.passengerRowBorder,
                  ]}
                  onPress={() => {
                    if (pasajeroId && pasajeroId !== user?.id) {
                      navigation.navigate("PerfilPublico", {
                        userId: pasajeroId,
                      });
                    }
                  }}
                  disabled={!pasajeroId || pasajeroId === user?.id}
                  activeOpacity={0.7}
                >
                  <View style={styles.passengerAvatar}>
                    {imgPerfil ? (
                      <Image
                        source={{ uri: imgPerfil }}
                        style={styles.passengerAvatarImg}
                      />
                    ) : (
                      <Text style={styles.passengerAvatarText}>
                        {nombre.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName} numberOfLines={1}>
                      {nombre}
                    </Text>
                    <Text style={styles.passengerSub}>
                      {isConfirmed ? "Plaza confirmada" : "Reserva en proceso"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.passengerStatusPill,
                      isConfirmed
                        ? styles.statusPillGreen
                        : styles.statusPillYellow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.passengerStatusText,
                        isConfirmed
                          ? styles.statusTextGreen
                          : styles.statusTextYellow,
                      ]}
                    >
                      {isConfirmed ? "Confirmado" : "Pendiente"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyPassengersCard}>
            <View style={styles.emptyPassengersIcon}>
              <Users size={22} color={COLORS.gray400} strokeWidth={2} />
            </View>
            <Text style={styles.emptyPassengersTitle}>
              Aún no hay pasajeros
            </Text>
            <Text style={styles.emptyPassengersSubtitle}>
              Sé el primero en reservar plaza para este trayecto.
            </Text>
          </View>
        )}

        {/* CÓDIGO QR DEL VIAJE (Solo conductor y si el viaje aún no ha finalizado) */}
        {esConductor && !estaCompletado && (
          <TouchableOpacity
            style={[styles.card, styles.qrCard]}
            onPress={() => setShowQR(true)}
            activeOpacity={0.8}
          >
            <View style={styles.qrIconBox}>
              <QrCode size={22} color={COLORS.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.qrTextBox}>
              <Text style={styles.qrTitle}>Código QR de validación</Text>
              <Text style={styles.qrSubtitle}>
                Toca para mostrar el QR a tus pasajeros al subir
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.gray400} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* FIXED BOTTOM ACTION BAR (Solo si el viaje no ha finalizado) */}
      {!estaCompletado && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {esConductor ? (
            // Acciones Conductor
            <View style={styles.bottomBarFull}>
              {puedeIniciar && (
                <TouchableOpacity
                  style={styles.primaryCtaBtn}
                  onPress={handleIniciarViaje}
                  disabled={actionLoading}
                  activeOpacity={0.9}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Play size={18} color={COLORS.white} fill={COLORS.white} />
                      <Text style={styles.primaryCtaBtnText}>Iniciar trayecto</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {estaEnCurso && (
                <TouchableOpacity
                  style={styles.primaryCtaBtn}
                  onPress={() => navigation.navigate("ViajeEnCurso", { viaje })}
                  activeOpacity={0.9}
                >
                  <NavIcon size={18} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={styles.primaryCtaBtnText}>
                    Ver recorrido en vivo
                  </Text>
                </TouchableOpacity>
              )}

              {puedeFinalizar && (
                <TouchableOpacity
                  style={styles.dangerOutlineBtn}
                  onPress={handleFinalizarViaje}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dangerOutlineBtnText}>
                    {actionLoading ? "Finalizando..." : "Finalizar trayecto"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : reservaExistente ? (
            // Acciones Pasajero con Reserva
            <View style={styles.bottomBarFull}>
              {reservaExistente.status === "pending" ? (
                <TouchableOpacity
                  style={styles.warningCtaBtn}
                  onPress={handleRetornarPago}
                  disabled={reserving}
                  activeOpacity={0.9}
                >
                  {reserving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <CreditCard size={18} color={COLORS.white} strokeWidth={2.5} />
                      <Text style={styles.primaryCtaBtnText}>Completar pago</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : estaEnCurso &&
                reservaExistente.trip_outcome !== "success" &&
                !estadoPasajero?.pasajero?.recogido ? (
                <TouchableOpacity
                  style={styles.successCtaBtn}
                  onPress={handleConfirmarRecogida}
                  disabled={reserving}
                  activeOpacity={0.9}
                >
                  {reserving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color={COLORS.white} strokeWidth={2.5} />
                      <Text style={styles.primaryCtaBtnText}>Ya me ha recogido</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : estaEnCurso ? (
                <TouchableOpacity
                  style={styles.primaryCtaBtn}
                  onPress={() => navigation.navigate("ViajeEnCurso", { viaje })}
                  activeOpacity={0.9}
                >
                  <NavIcon size={18} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={styles.primaryCtaBtnText}>
                    Ver recorrido en vivo
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.bookedStatusBox}>
                  <View style={styles.bookedStatusLeft}>
                    <CheckCircle2
                      size={20}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.bookedStatusText}>
                      Tienes una plaza reservada
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCancelarReserva}
                    disabled={reserving}
                    hitSlop={8}
                  >
                    <Text style={styles.cancelBookingText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            // Acciones Pasajero sin Reserva
            <View style={styles.bottomBarSplit}>
              <View style={styles.bottomPriceBox}>
                <Text style={styles.bottomPriceLabel}>Total por plaza</Text>
                <Text style={styles.bottomPriceValue}>{precio}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.reserveCtaBtn,
                  plazasDisponibles <= 0 && styles.reserveCtaBtnDisabled,
                ]}
                onPress={handleReservar}
                disabled={reserving || plazasDisponibles <= 0}
                activeOpacity={0.9}
              >
                {reserving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.reserveCtaBtnText}>
                    {plazasDisponibles <= 0 ? "Sin plazas" : "Reservar plaza"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        viaje={viaje}
        codigoQR={viaje?.codigoQR}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Top Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    ...SHADOWS.small,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.md + 1,
    fontWeight: "800",
    color: COLORS.gray900,
    marginHorizontal: SPACING.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  iconHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: FONTS.xs - 1,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  // Hero Route Card
  heroRouteCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineVisual: {
    width: 24,
    alignItems: "center",
    paddingTop: 4,
    marginRight: SPACING.md,
  },
  originCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.primarySoft,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 4,
  },
  timelineDashedSkeleton: {
    width: 2,
    height: 48,
    backgroundColor: COLORS.gray200,
    marginVertical: 4,
  },
  destPinBox: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDetails: {
    flex: 1,
  },
  stopBlock: {
    flex: 1,
  },
  stopTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 2,
  },
  stopTime: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  stopBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    letterSpacing: 0.5,
  },
  destBadge: {
    color: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  stopLocation: {
    fontSize: FONTS.sm + 1,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  heroStatsDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.md,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  statChipText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  priceStatChip: {
    backgroundColor: COLORS.primarySoft,
    marginLeft: "auto",
  },
  priceStatText: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  priceSubText: {
    fontSize: FONTS.xs - 1,
    fontWeight: "600",
    color: COLORS.primary,
  },
  eventBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.secondarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  eventBannerText: {
    flex: 1,
    fontSize: FONTS.xs,
    color: COLORS.secondaryDark,
  },
  eventBannerBold: {
    fontWeight: "800",
  },
  // Map Card
  mapCard: {
    position: "relative",
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  mapGpsButton: {
    position: "absolute",
    bottom: SPACING.sm,
    right: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.gray900,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    ...SHADOWS.medium,
  },
  mapGpsText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.white,
  },
  // Eco Sustainability Card
  ecoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(13, 159, 110, 0.15)",
  },
  ecoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  ecoTextBox: {
    flex: 1,
  },
  ecoTitle: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  ecoSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.primary,
    marginTop: 2,
    lineHeight: 16,
  },
  // Section Headers
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.sm + 1,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.primary,
  },
  // Shared Card Container
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.sm,
  },
  // Driver Details
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  driverAvatarWrap: {
    position: "relative",
    marginRight: SPACING.md,
  },
  driverAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  driverAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverName: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  driverRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  driverRatingScore: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  driverRatingCount: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
  },
  chatDriverBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primarySoft,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
  },
  chatDriverBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  // Vehicle
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  vehicleIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  vehicleSub: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  licensePlate: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray800,
    borderRadius: RADIUS.xs,
    overflow: "hidden",
    marginLeft: SPACING.sm,
  },
  plateFlag: {
    backgroundColor: "#003399",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  plateFlagText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFCC00",
  },
  plateText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.gray900,
    paddingHorizontal: 6,
    paddingVertical: 2,
    letterSpacing: 0.5,
  },
  // Amenities
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  amenityText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  // Passengers
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  passengerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  passengerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    overflow: "hidden",
  },
  passengerAvatarImg: {
    width: "100%",
    height: "100%",
  },
  passengerAvatarText: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.secondaryDark,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  passengerSub: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 1,
  },
  passengerStatusPill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusPillGreen: {
    backgroundColor: COLORS.primarySoft,
  },
  statusPillYellow: {
    backgroundColor: COLORS.warningSoft,
  },
  passengerStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statusTextGreen: {
    color: COLORS.primaryDark,
  },
  statusTextYellow: {
    color: COLORS.warning,
  },
  emptyPassengersCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.small,
  },
  emptyPassengersIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  emptyPassengersTitle: {
    fontSize: FONTS.sm + 1,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  emptyPassengersSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: 2,
  },
  // QR Card
  qrCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.md,
  },
  qrIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  qrTextBox: {
    flex: 1,
  },
  qrTitle: {
    fontSize: FONTS.sm + 1,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  qrSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  // FIXED BOTTOM ACTION BAR
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    ...SHADOWS.large,
  },
  bottomBarSplit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomPriceBox: {
    justifyContent: "center",
  },
  bottomPriceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomPriceValue: {
    fontSize: FONTS.xl,
    fontWeight: "900",
    color: COLORS.gray900,
  },
  reserveCtaBtn: {
    minWidth: 170,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.medium,
  },
  reserveCtaBtnDisabled: {
    backgroundColor: COLORS.gray300,
  },
  reserveCtaBtnText: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.white,
  },
  bottomBarFull: {
    width: "100%",
  },
  primaryCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    height: 50,
    ...SHADOWS.medium,
  },
  primaryCtaBtnText: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.white,
  },
  warningCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.full,
    height: 50,
    ...SHADOWS.medium,
  },
  successCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
    height: 50,
    ...SHADOWS.medium,
  },
  dangerOutlineBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    height: 46,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    marginTop: SPACING.xs,
  },
  dangerOutlineBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.error,
  },
  bookedStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  bookedStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 2,
  },
  bookedStatusText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  cancelBookingText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.error,
  },
  // Empty State Screen
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.errorSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  emptySubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.gray900,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.full,
  },
  emptyButtonText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default ViajeDetalleScreen;