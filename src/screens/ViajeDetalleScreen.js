// YouConnext - ViajeDetalleScreen
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { useViaje } from "../context/ViajeContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { TripMapPreview, QRCodeModal } from "../components";
import { trayectoService } from "../services/travels/trayectoService";
import { reservaService } from "../services/travels/reservaService";
import { carService } from "../services/carService";
import { usuarioService } from "../services/usuarioService";
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
      console.log(
        "[ViajeDetalle] /completo response completa:",
        JSON.stringify(detalle, null, 2),
      );

      // Buscar pasajeros en múltiples posibles campos del response
      let pasajerosList = detalle?.pasajeros || detalle?.pasajerosList || [];
      console.log(
        "[ViajeDetalle] pasajeros desde /completo:",
        JSON.stringify(pasajerosList, null, 2),
      );

      // Si no hay pasajeros en /completo, hacer fallback con reservaService
      if (!pasajerosList || pasajerosList.length === 0) {
        try {
          const reservasData =
            await reservaService.obtenerReservasPorTrayecto(targetId);
          console.log(
            "[ViajeDetalle] fallback reservaService response:",
            JSON.stringify(reservasData, null, 2),
          );
          pasajerosList = reservasData?.pasajerosList || reservasData || [];
          console.log(
            "[ViajeDetalle] pasajeros tras fallback:",
            JSON.stringify(pasajerosList, null, 2),
          );
        } catch (e) {
          console.log("[ViajeDetalle] Fallback reservas fallido:", e);
        }
      }

      const viajeConPasajeros = { ...detalle, pasajeros: pasajerosList };
      setViaje(viajeConPasajeros);

      // Cargar datos del vehículo asociado al trayecto
      const vehiculoId = detalle?.vehiculo_id;
      if (vehiculoId) {
        try {
          const carRes = await carService.obtenerCochePorId(vehiculoId);
          const carData = carRes?.car || null;
          setVehiculo(carData);
        } catch (e) {
          console.log(
            "[ViajeDetalle] No se pudo cargar el vehículo:",
            e?.message,
          );
          setVehiculo(null);
        }
      }

      // Cargar info pública del conductor para obtener foto de perfil
      const conductorId = detalle?.conductor_id || detalle?.conductor?.id;
      if (conductorId) {
        try {
          const publicInfo =
            await usuarioService.getUserPublicProfile(conductorId);
          const conductorData = publicInfo?.user || publicInfo || null;
          setConductorInfo(conductorData);
        } catch (e) {
          console.log(
            "[ViajeDetalle] No se pudo cargar info del conductor:",
            e?.message,
          );
          setConductorInfo(null);
        }
      }

      // Buscar reserva del usuario actual en la lista de pasajeros
      if (user?.id) {
        const mia = pasajerosList.find(
          (p) => p.user_id === user.id || p.usuario_id === user.id,
        );
        console.log(
          "[ViajeDetalle] reserva del usuario actual:",
          JSON.stringify(mia, null, 2),
        );
        setReservaExistente(mia || null);

        // Si el usuario es pasajero con reserva, cargar estado del trayecto
        if (mia) {
          try {
            const estado =
              await trayectoService.obtenerEstadoTrayecto(targetId);
            console.log(
              "[ViajeDetalle] estado del pasajero:",
              JSON.stringify(estado, null, 2),
            );
            setEstadoPasajero(estado);
            // Si el pasajero ya fue recogido y no ha llegado, asegurar tracking
            if (
              estado?.pasajero?.recogido &&
              !estado?.pasajero?.en_destino &&
              !trackingActivo
            ) {
              try {
                await iniciarTrackingPasajero(viajeConPasajeros);
              } catch (e) {
                console.warn(
                  "[ViajeDetalle] No se pudo reanudar tracking:",
                  e?.message,
                );
              }
            }
          } catch (e) {
            console.log(
              "[ViajeDetalle] No se pudo cargar estado del pasajero:",
              e,
            );
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
      const response = await reservaService.crearReserva(user.id, viaje.id);
      if (response?.stripe_url) {
        Alert.alert(
          "Reserva creada",
          "Serás redirigido a la pasarela de pago para completar tu reserva.",
          [
            {
              text: "Ir a pagar",
              onPress: () => {
                Linking.openURL(response.stripe_url);
              },
            },
            { text: "Más tarde" },
          ],
        );
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
      "¿Estás seguro de que quieres cancelar tu reserva?",
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
      // Iniciar tracking GPS del pasajero tras recogida
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

  const [llegadaRegistrada, setLlegadaRegistrada] = useState(false);

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
      // Detener tracking GPS del pasajero al llegar a destino
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
      const response = await reservaService.resumePago(
        reservaExistente.id_reserva,
        "youconnext://perfil",
      );
      if (response?.stripe_url) {
        Linking.openURL(response.stripe_url);
      } else {
        Alert.alert(
          "Error",
          response?.message || "No se pudo retomar el pago.",
        );
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

  if (loading && !viaje) {
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Cargando detalle del trayecto...
          </Text>
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
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            No se pudo cargar la información de este trayecto.
          </Text>
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
  const plazas = viaje?.disponible;
  const conductorId = viaje?.conductor_id || viaje?.conductor?.id;
  const conductorNombre = conductorInfo?.name
    ? conductorInfo.name
    : typeof viaje?.conductor === "object"
      ? `${viaje?.conductor?.nombre || ""} ${viaje?.conductor?.apellidos || ""}`.trim() ||
        "Desconocido"
      : viaje?.conductor || "Desconocido";

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
        <View style={[styles.statusPill, { backgroundColor: estadoCfg.bg }]}>
          <View
            style={[styles.statusDot, { backgroundColor: estadoCfg.dot }]}
          />
          <Text style={[styles.statusPillText, { color: estadoCfg.color }]}>
            {estadoCfg.label}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Ruta */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.timeline}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <Flag size={13} color={COLORS.gray700} fill={COLORS.gray700} />
            </View>
            <View style={styles.routePoints}>
              <View>
                <Text style={styles.routeLabel}>ORIGEN</Text>
                <Text style={styles.routeName} numberOfLines={2}>
                  {viaje?.origen ||
                    viaje?.puntoInicialNombre ||
                    "Ubicación inicial"}
                </Text>
              </View>
              <View style={styles.routePointSpaced}>
                <Text style={styles.routeLabel}>DESTINO</Text>
                <Text style={styles.routeName} numberOfLines={2}>
                  {viaje?.destino ||
                    viaje?.puntoFinalNombre ||
                    "Ubicación final"}
                </Text>
              </View>
            </View>
          </View>

          {(!!fechaLabel || !!horaLabel || plazas != null) && (
            <View style={styles.chipRow}>
              {!!fechaLabel && (
                <View style={styles.chip}>
                  <Calendar
                    size={13}
                    color={COLORS.primaryDark}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.chipText}>{fechaLabel}</Text>
                </View>
              )}
              {!!horaLabel && (
                <View style={styles.chip}>
                  <Clock
                    size={13}
                    color={COLORS.primaryDark}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.chipText}>{horaLabel}</Text>
                </View>
              )}
              {plazas != null && (
                <View style={styles.chip}>
                  <Users
                    size={13}
                    color={COLORS.primaryDark}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.chipText}>
                    {plazas} {plazas === 1 ? "plaza" : "plazas"}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.mapPreview}>
          <TripMapPreview origin={origen} destination={destino} height={170} />
        </View>

        {/* Conductor y vehiculo */}
        <Text style={styles.sectionLabel}>CONDUCTOR Y VEHÍCULO</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.personRow}
            onPress={() => {
              if (conductorId && conductorId !== user?.id) {
                navigation.navigate("PerfilPublico", { userId: conductorId });
              }
            }}
            disabled={!conductorId || conductorId === user?.id}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              {conductorInfo?.img_perfil ? (
                <Image
                  source={{ uri: conductorInfo.img_perfil }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {conductorNombre.charAt(0)}
                </Text>
              )}
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName} numberOfLines={1}>
                {conductorNombre}
              </Text>
              <Text style={styles.personSub}>Conductor</Text>
            </View>
            {conductorId && conductorId !== user?.id && (
              <ChevronRight
                size={18}
                color={COLORS.gray300}
                strokeWidth={2.5}
              />
            )}
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          <View style={styles.personRow}>
            <View style={styles.vehiculoIcon}>
              <Car size={20} color={COLORS.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>
                {vehiculo?.matricula || viaje?.matricula || "—"}
              </Text>
              <Text style={styles.personSub} numberOfLines={1}>
                {vehiculo
                  ? `${vehiculo.marca || ""} ${vehiculo.modelo || ""}`.trim()
                  : viaje?.modeloVehiculo || "Vehículo"}
                {(vehiculo?.color || viaje?.colorVehiculo) &&
                  ` · ${vehiculo?.color || viaje.colorVehiculo}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Pasajeros */}
        <Text style={styles.sectionLabel}>
          PASAJEROS ({viaje?.pasajeros?.length || 0})
        </Text>
        {viaje?.pasajeros?.length > 0 ? (
          <View style={styles.card}>
            {viaje.pasajeros.map((p, index) => {
              const nombre =
                `${p.usuario?.nombre || p.nombre || "Desconocido"} ${p.usuario?.apellidos || p.apellidos || ""}`.trim();
              const imgPerfil = p.usuario?.img_perfil || p.img_perfil;
              const pasajeroId = p.user_id || p.usuario_id || p.usuario?.id;
              const pago =
                p.status === "completed"
                  ? "Pagado"
                  : p.status === "pending"
                    ? "Pago pendiente"
                    : null;
              const pagoColor =
                p.status === "completed"
                  ? COLORS.primaryDark
                  : p.status === "pending"
                    ? COLORS.warning
                    : COLORS.gray400;
              const esUltimo = index === viaje.pasajeros.length - 1;
              return (
                <TouchableOpacity
                  key={p.id_reserva || index}
                  style={[
                    styles.personRow,
                    !esUltimo && styles.personRowBorder,
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
                  <View style={[styles.avatar, styles.avatarPasajero]}>
                    {imgPerfil ? (
                      <Image
                        source={{ uri: imgPerfil }}
                        style={styles.avatarImg}
                      />
                    ) : (
                      <Text style={styles.avatarText}>{nombre.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName} numberOfLines={1}>
                      {nombre}
                    </Text>
                    {!!pago && (
                      <Text style={[styles.personSub, { color: pagoColor }]}>
                        {pago}
                      </Text>
                    )}
                  </View>
                  {p.trip_outcome === "success" && (
                    <CheckCircle2
                      size={18}
                      color={COLORS.success}
                      strokeWidth={2}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Aún no hay pasajeros en este viaje
            </Text>
          </View>
        )}

        {/* Codigo QR */}
        {esConductor && (
          <TouchableOpacity
            style={[styles.card, styles.qrRow]}
            onPress={() => setShowQR(true)}
            activeOpacity={0.8}
          >
            <View style={styles.qrIcon}>
              <QrCode size={20} color={COLORS.primaryDark} strokeWidth={2.2} />
            </View>
            <Text style={styles.qrText}>Código QR del viaje</Text>
            <ChevronRight size={18} color={COLORS.gray300} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Acciones del conductor */}
        {esConductor && (
          <View style={styles.actions}>
            {puedeIniciar && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleIniciarViaje}
                disabled={actionLoading}
                activeOpacity={0.9}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Play size={18} color={COLORS.white} fill={COLORS.white} />
                    <Text style={styles.primaryBtnText}>Iniciar trayecto</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {estaEnCurso && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate("ViajeEnCurso", { viaje })}
                activeOpacity={0.9}
              >
                <NavIcon size={18} color={COLORS.white} strokeWidth={2.2} />
                <Text style={styles.primaryBtnText}>Ver recorrido en vivo</Text>
              </TouchableOpacity>
            )}

            {puedeFinalizar && (
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={handleFinalizarViaje}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.dangerBtnText}>
                  {actionLoading ? "Finalizando..." : "Finalizar trayecto"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Acciones del pasajero (no conductor) */}
        {!esConductor && (
          <View style={styles.actions}>
            {reservaExistente ? (
              <>
                <View style={styles.reservaCard}>
                  {reservaExistente.status === "completed" ? (
                    <CheckCircle2
                      size={22}
                      color={COLORS.primary}
                      strokeWidth={2.2}
                    />
                  ) : reservaExistente.status === "pending" ? (
                    <AlertCircle
                      size={22}
                      color={COLORS.warning}
                      strokeWidth={2.2}
                    />
                  ) : (
                    <XCircle
                      size={22}
                      color={COLORS.gray400}
                      strokeWidth={2.2}
                    />
                  )}
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>
                      {reservaExistente.status === "completed"
                        ? "Reserva confirmada"
                        : reservaExistente.status === "pending"
                          ? "Pago pendiente"
                          : `Estado: ${reservaExistente.status}`}
                    </Text>
                    <Text style={styles.personSub}>
                      {viaje?.precio != null ? `${viaje.precio}€` : "Gratis"}
                    </Text>
                  </View>
                </View>

                {reservaExistente.status === "pending" && (
                  <TouchableOpacity
                    style={styles.warningBtn}
                    onPress={handleRetornarPago}
                    disabled={reserving}
                    activeOpacity={0.9}
                  >
                    {reserving ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <CreditCard
                          size={18}
                          color={COLORS.white}
                          strokeWidth={2.2}
                        />
                        <Text style={styles.primaryBtnText}>Retomar pago</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {estaEnCurso && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() =>
                      navigation.navigate("ViajeEnCurso", { viaje })
                    }
                    activeOpacity={0.9}
                  >
                    <NavIcon size={18} color={COLORS.white} strokeWidth={2.2} />
                    <Text style={styles.primaryBtnText}>
                      Ver recorrido en vivo
                    </Text>
                  </TouchableOpacity>
                )}

                {estaEnCurso &&
                  reservaExistente.status === "completed" &&
                  reservaExistente.trip_outcome !== "success" &&
                  !estadoPasajero?.pasajero?.recogido && (
                    <TouchableOpacity
                      style={styles.successBtn}
                      onPress={handleConfirmarRecogida}
                      disabled={reserving}
                      activeOpacity={0.9}
                    >
                      {reserving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <CheckCircle2
                            size={18}
                            color={COLORS.white}
                            strokeWidth={2.2}
                          />
                          <Text style={styles.primaryBtnText}>
                            Ya me ha recogido
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {(reservaExistente.trip_outcome === "success" ||
                  estadoPasajero?.pasajero?.recogido) && (
                  <View style={styles.confirmCard}>
                    <CheckCircle2
                      size={18}
                      color={COLORS.primaryDark}
                      strokeWidth={2.2}
                    />
                    <Text style={styles.confirmText}>Recogida confirmada</Text>
                  </View>
                )}

                {estaEnCurso &&
                  (reservaExistente.trip_outcome === "success" ||
                    estadoPasajero?.pasajero?.recogido) &&
                  !llegadaRegistrada &&
                  !estadoPasajero?.pasajero?.en_destino && (
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleLlegadaDestino}
                      disabled={reserving}
                      activeOpacity={0.9}
                    >
                      {reserving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <MapPin
                            size={18}
                            color={COLORS.white}
                            strokeWidth={2.2}
                          />
                          <Text style={styles.primaryBtnText}>
                            He llegado a mi destino
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {(llegadaRegistrada ||
                  estadoPasajero?.pasajero?.en_destino) && (
                  <View style={styles.confirmCard}>
                    <MapPin
                      size={18}
                      color={COLORS.primaryDark}
                      strokeWidth={2.2}
                    />
                    <Text style={styles.confirmText}>
                      Llegada a destino confirmada
                    </Text>
                  </View>
                )}

                {reservaExistente.status !== "completed" &&
                  reservaExistente.status !== "canceled" && (
                    <TouchableOpacity
                      style={styles.dangerBtn}
                      onPress={handleCancelarReserva}
                      disabled={reserving}
                      activeOpacity={0.85}
                    >
                      {reserving ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                      ) : (
                        <Text style={styles.dangerBtnText}>
                          Cancelar reserva
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  viaje?.disponible <= 0 && styles.primaryBtnDisabled,
                ]}
                onPress={handleReservar}
                disabled={reserving || viaje?.disponible <= 0}
                activeOpacity={0.9}
              >
                {reserving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Users size={18} color={COLORS.white} strokeWidth={2.2} />
                    <Text style={styles.primaryBtnText}>
                      {viaje?.disponible <= 0
                        ? "Sin plazas disponibles"
                        : `Reservar plaza${viaje?.precio != null ? ` · ${viaje.precio}€` : ""}`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.xl,
    fontWeight: "800",
    color: COLORS.gray800,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  routeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  routeRow: {
    flexDirection: "row",
  },
  timeline: {
    width: 16,
    alignItems: "center",
    alignSelf: "stretch",
    marginRight: SPACING.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primarySoft,
    marginTop: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 3,
  },
  routePoints: {
    flex: 1,
  },
  routePointSpaced: {
    marginTop: SPACING.md,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.gray400,
    marginBottom: 2,
  },
  routeName: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginLeft: 32,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  chipText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
  mapPreview: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginHorizontal: SPACING.md,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  },
  personRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  personSub: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.white,
  },
  avatarPasajero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },
  vehiculoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  emptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray400,
  },
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  qrIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  qrText: {
    flex: 1,
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  primaryBtnDisabled: {
    backgroundColor: COLORS.gray300,
  },
  primaryBtnText: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.white,
  },
  warningBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  successBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  dangerBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.error,
  },
  reservaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  confirmCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.successSoft,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  confirmText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.md,
    color: COLORS.gray600,
    marginTop: SPACING.md,
    fontWeight: "500",
  },
  errorText: {
    fontSize: FONTS.md,
    color: COLORS.error,
    textAlign: "center",
  },
});

export default ViajeDetalleScreen;
