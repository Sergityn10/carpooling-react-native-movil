// YouConnext - MisPlanesScreen (Pro UI/UX Redesign)
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Linking,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  Users,
  Car,
  User as UserIcon,
  AlertCircle,
  CreditCard,
  ChevronRight,
  Clock,
  Route,
  Pencil,
  Trash2,
  X,
  MapPin,
  Euro,
  MessageCircle,
  Play,
  CheckCircle2,
  Sparkles,
  QrCode,
  Search,
  PlusCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import {
  EventCard,
  EmptyState,
  CarouselSkeleton,
  PressableScale,
  AnimatedCardEntrance,
  PulseDot,
} from "../components";
import { useUser } from "../context/UserContext";
import { eventService } from "../services/eventService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { trayectoService } from "../services/travels/trayectoService";
import { reservaService } from "../services/travels/reservaService";
import { messageService } from "../services/messages/messageService";
import { parseTripDate, localToUtcApi } from "../services/dateUtils";

const TAB_VIAJES = "viajes";
const TAB_EVENTOS = "eventos";

const FILTER_TODOS = "todos";
const FILTER_PROXIMOS = "proximos";
const FILTER_COMPLETADOS = "completados";

const MisPlanesScreen = ({ navigation }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(TAB_VIAJES);
  const [viajesFilter, setViajesFilter] = useState(FILTER_TODOS);

  // --- Mis viajes ---
  const [viajes, setViajes] = useState([]);
  const [loadingViajes, setLoadingViajes] = useState(true);
  const [errorViajes, setErrorViajes] = useState(null);
  const [refreshingViajes, setRefreshingViajes] = useState(false);
  const [resumingPagoId, setResumingPagoId] = useState(null);

  // --- Edit modal ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingViaje, setEditingViaje] = useState(null);
  const [editForm, setEditForm] = useState({
    origen: "",
    destino: "",
    fecha: new Date(),
    hora: new Date(),
    plazas: "4",
    precio: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editOrigenLocked, setEditOrigenLocked] = useState(false);
  const [editDestinoLocked, setEditDestinoLocked] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  // --- Mis eventos ---
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState(null);
  const [refreshingEventos, setRefreshingEventos] = useState(false);

  const fetchViajes = useCallback(async () => {
    if (!user?.id) return;
    setErrorViajes(null);
    try {
      const [conductorRes, pasajeroRes] = await Promise.allSettled([
        trayectoService.obtenerMisTrayectos({ limit: 100 }),
        reservaService.obtenerMisReservas(user.id, { limit: 100 }),
      ]);

      let misTrayectos = [];
      if (conductorRes.status === "fulfilled") {
        const raw = conductorRes.value;
        misTrayectos = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.trayectos)
              ? raw.trayectos
              : [];
      }

      let misReservas = [];
      if (pasajeroRes.status === "fulfilled") {
        const raw = pasajeroRes.value;
        misReservas = raw?.pasajerosList || raw?.data?.pasajerosList || [];
      }

      const condViajes = misTrayectos.map((t) => ({
        id: t.id,
        origen: t.origen,
        destino: t.destino,
        hora: t.hora || t.fecha,
        plazas: t.plazas,
        disponible: t.disponible,
        precio: t.precio,
        precio_conductor: t.precio_conductor,
        conductorName: `${user.name || user.nombre || "Conductor"}`.trim(),
        status: (t.status || t.estado || "pendiente").toLowerCase(),
        rol: "conductor",
        keyId: `cond-${t.id}`,
        originalData: t,
      }));

      const pasViajes = misReservas.map((r) => {
        const t = r.trayecto || {};
        return {
          id: t.id,
          id_reserva: r.id_reserva,
          origen: t.origen || "Sin especificar",
          destino: t.destino || "Sin especificar",
          hora: t.hora || t.fecha || r.createdAt,
          plazas: t.plazas,
          precio: t.precio,
          conductorName: t.conductor || "Conductor",
          status: (t.status || t.estado || "pendiente").toLowerCase(),
          reservaStatus: r.status,
          rol: "pasajero",
          keyId: `pas-${r.id_reserva}`,
          originalData: t,
        };
      });

      const todos = [...condViajes, ...pasViajes].sort((a, b) => {
        const da = parseTripDate(a);
        const db = parseTripDate(b);
        return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
      });
      setViajes(todos);
    } catch (err) {
      setErrorViajes(err.message || "No se pudieron cargar tus viajes.");
      setViajes([]);
    } finally {
      setLoadingViajes(false);
    }
  }, [user]);

  const fetchEventos = useCallback(async () => {
    setErrorEventos(null);
    try {
      const res = await eventService.getMyJoinedEvents();
      const data = res.events || res.data || [];
      setEventos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorEventos(err.message || "No se pudieron cargar tus eventos.");
      setEventos([]);
    } finally {
      setLoadingEventos(false);
    }
  }, []);

  useEffect(() => {
    fetchViajes();
    fetchEventos();
  }, [fetchViajes, fetchEventos]);

  const handleRefreshViajes = async () => {
    setRefreshingViajes(true);
    await fetchViajes();
    setRefreshingViajes(false);
  };

  const handleRefreshEventos = async () => {
    setRefreshingEventos(true);
    await fetchEventos();
    setRefreshingEventos(false);
  };

  const filteredViajes = useMemo(() => {
    if (viajesFilter === FILTER_PROXIMOS) {
      return viajes.filter(
        (v) => v.status !== "completado" && v.status !== "cancelado",
      );
    }
    if (viajesFilter === FILTER_COMPLETADOS) {
      return viajes.filter(
        (v) => v.status === "completado" || v.status === "cancelado",
      );
    }
    return viajes;
  }, [viajes, viajesFilter]);

  const handleRetomarPago = async (idReserva, tripId) => {
    setResumingPagoId(idReserva);
    try {
      const returnUrl = tripId
        ? `https://app.youconnext.es/redirect?to=viaje-detalle&id=${tripId}`
        : "https://app.youconnext.es/redirect?to=perfil";
      const response = await reservaService.resumePago(idReserva, returnUrl);
      if (response?.stripe_url) {
        await Linking.openURL(response.stripe_url);
      } else {
        Alert.alert("Error", "No se pudo retomar el pago.");
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "No se pudo retomar el pago.");
    } finally {
      setResumingPagoId(null);
    }
  };

  const handleViajePress = (viaje) => {
    const isEnCurso = viaje.status === "en curso" || viaje.status === "activo";
    if (isEnCurso) {
      navigation.navigate("ViajeEnCurso", { viaje: viaje.originalData });
    } else if (viaje.rol === "conductor") {
      navigation.navigate("ViajeDetalle", { viaje: viaje.originalData });
    } else {
      navigation.navigate("MiViaje", { viaje: viaje.originalData });
    }
  };

  const handleOpenChat = async (viaje, e) => {
    e.stopPropagation();
    try {
      const tripId = viaje.id;
      let chat = null;
      try {
        const res = await messageService.obtenerChatPorTripId(tripId);
        chat = res.data || res;
      } catch {
        const created = await messageService.crearChatGrupal({
          trip_id: tripId,
          name: `${viaje.origen} → ${viaje.destino}`,
        });
        chat = created.data || created;
      }
      if (chat && (chat.chat_id || chat.id)) {
        navigation.navigate("ChatDetalle", {
          chat,
          chatId: chat.chat_id || chat.id,
        });
      }
    } catch (err) {
      console.log("Error al abrir chat:", err);
    }
  };

  const handleOpenQR = (viaje, e) => {
    e.stopPropagation();
    navigation.navigate("EscanearQR", { viaje: viaje.originalData });
  };

  const handleEventPress = (event) => {
    navigation.navigate("EventDetalle", { eventId: event.id, event });
  };

  const formatDateForApi = (date, time) => localToUtcApi(date, time);

  const handleEliminarViaje = (viaje) => {
    Alert.alert(
      "Eliminar trayecto",
      "¿Estás seguro de que quieres eliminar este trayecto? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await trayectoService.eliminarTrayecto(viaje.id);
              Alert.alert(
                "Eliminado",
                "El trayecto se ha eliminado correctamente.",
              );
              fetchViajes();
            } catch (e) {
              Alert.alert(
                "Error",
                e?.message || "No se pudo eliminar el trayecto.",
              );
            }
          },
        },
      ],
    );
  };

  const handleEditarViaje = async (viaje) => {
    const t = viaje.originalData;
    const fechaDate = parseTripDate(t) || new Date();
    setEditingViaje(viaje);
    setEditForm({
      origen: t.origen || "",
      destino: t.destino || "",
      fecha: fechaDate,
      hora: fechaDate,
      plazas: String(t.plazas || 4),
      precio: String(t.precio_conductor ?? t.precio ?? ""),
    });
    setEditOrigenLocked(false);
    setEditDestinoLocked(false);

    if (t.evento_id) {
      try {
        const eventRes = await eventService.getEventById(t.evento_id);
        const eventData = eventRes?.event || eventRes;
        const eventLat = Number(eventData?.latitude);
        const eventLng = Number(eventData?.longitude);
        const origLat = Number(t.origen_lat);
        const origLng = Number(t.origen_lng);
        const destLat = Number(t.destino_lat);
        const destLng = Number(t.destino_lng);
        const tol = 0.0001;
        if (
          !isNaN(origLat) &&
          !isNaN(eventLat) &&
          Math.abs(origLat - eventLat) < tol &&
          Math.abs(origLng - eventLng) < tol
        ) {
          setEditOrigenLocked(true);
        } else if (
          !isNaN(destLat) &&
          !isNaN(eventLat) &&
          Math.abs(destLat - eventLat) < tol &&
          Math.abs(destLng - eventLng) < tol
        ) {
          setEditDestinoLocked(true);
        }
      } catch (e) {
        console.warn("No se pudo cargar info del evento:", e?.message);
      }
    }

    setEditModalVisible(true);
  };

  const handleGuardarEdicion = async () => {
    if (!editingViaje) return;
    setEditLoading(true);
    try {
      const { fecha: fechaApi, hora: horaApi } = formatDateForApi(
        editForm.fecha,
        editForm.hora,
      );
      const payload = {
        fecha: fechaApi,
        hora: horaApi,
        plazas: parseInt(editForm.plazas) || 4,
        precio: parseFloat(editForm.precio) || 0,
      };
      if (!editOrigenLocked) payload.origen = editForm.origen;
      if (!editDestinoLocked) payload.destino = editForm.destino;

      await trayectoService.actualizarTrayectoPut(editingViaje.id, payload);
      Alert.alert(
        "Actualizado",
        "El trayecto se ha actualizado correctamente.",
      );
      setEditModalVisible(false);
      setEditingViaje(null);
      fetchViajes();
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo actualizar el trayecto.");
    } finally {
      setEditLoading(false);
    }
  };

  const formatFecha = (item) => {
    const viaje = typeof item === "string" ? { hora: item } : item;
    const date = parseTripDate(viaje);
    if (!date) return "Fecha por confirmar";
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const formatHora = (item) => {
    const viaje = typeof item === "string" ? { hora: item } : item;
    const date = parseTripDate(viaje);
    if (!date) return "--:--";
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderViaje = ({ item, index }) => {
    const esConductor = item.rol === "conductor";
    const isEnCurso = item.status === "en curso" || item.status === "activo";
    const isCompletado = item.status === "completado";
    const isCancelado = item.status === "cancelado";

    return (
      <AnimatedCardEntrance index={index}>
        <PressableScale
          style={[
            styles.viajeCard,
            isEnCurso && styles.viajeCardEnCurso,
            isCompletado && styles.viajeCardCompletado,
          ]}
          onPress={() => handleViajePress(item)}
          scaleTo={0.98}
        >
        {/* Top Header Row */}
        <View style={styles.cardTopRow}>
          <View style={styles.badgeGroup}>
            <View
              style={[
                styles.rolBadge,
                esConductor ? styles.conductorBadge : styles.pasajeroBadge,
              ]}
            >
              {esConductor ? (
                <Car size={12} color={COLORS.primaryDark} strokeWidth={2.5} />
              ) : (
                <UserIcon size={12} color={COLORS.secondaryDark} strokeWidth={2.5} />
              )}
              <Text
                style={[
                  styles.rolBadgeText,
                  esConductor
                    ? styles.conductorBadgeText
                    : styles.pasajeroBadgeText,
                ]}
              >
                {esConductor ? "Conductor" : "Pasajero"}
              </Text>
            </View>

            {isEnCurso && (
              <View style={styles.enCursoBadge}>
                <PulseDot color={COLORS.white} size={6} />
                <Text style={styles.enCursoText}>En curso</Text>
              </View>
            )}

            {isCompletado && (
              <View style={styles.completadoBadge}>
                <CheckCircle2 size={10} color={COLORS.gray600} strokeWidth={2.5} />
                <Text style={styles.completadoText}>Completado</Text>
              </View>
            )}
          </View>

          <View style={styles.priceChip}>
            <Text style={styles.priceChipText}>
              {esConductor
                ? item.precio_conductor != null && item.precio_conductor > 0
                  ? `${item.precio_conductor}€`
                  : item.precio != null && item.precio > 0
                    ? `${item.precio}€`
                    : "Gratis"
                : item.precio != null && item.precio > 0
                  ? `${item.precio}€`
                  : "Gratis"}
            </Text>
          </View>
        </View>

        {/* Ruta */}
        <View style={styles.routeContainer}>
          <View style={styles.routeTimeline}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <View style={styles.routeLine} />
            <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
          </View>
          <View style={styles.routeTexts}>
            <Text style={styles.routePlaceText} numberOfLines={1}>
              {item.origen}
            </Text>
            <Text style={styles.routePlaceText} numberOfLines={1}>
              {item.destino}
            </Text>
          </View>
        </View>

        {/* Pago pendiente banner */}
        {!esConductor && item.reservaStatus === "pending" && (
          <View style={styles.pagoPendienteBanner}>
            <View style={styles.pagoPendienteInfo}>
              <AlertCircle size={15} color={COLORS.warning} strokeWidth={2.5} />
              <Text style={styles.pagoPendienteText}>Pago pendiente</Text>
            </View>
            <TouchableOpacity
              style={styles.retornarPagoBtn}
              onPress={() => handleRetomarPago(item.id_reserva, item.id)}
              disabled={resumingPagoId === item.id_reserva}
              activeOpacity={0.8}
            >
              {resumingPagoId === item.id_reserva ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <CreditCard size={13} color={COLORS.white} strokeWidth={2.5} />
                  <Text style={styles.retornarPagoBtnText}>Retomar pago</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerMetaCol}>
            <View style={styles.metaRow}>
              <Clock size={13} color={COLORS.gray500} strokeWidth={2.2} />
              <Text style={styles.metaText}>
                {formatFecha(item.hora)} · {formatHora(item.hora)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Users size={13} color={COLORS.gray500} strokeWidth={2.2} />
              <Text style={styles.metaText} numberOfLines={1}>
                {esConductor
                  ? `${item.disponible ?? 0} plazas libres`
                  : `Conductor: ${item.conductorName}`}
              </Text>
            </View>
          </View>

          {/* Quick Actions en la tarjeta */}
          <View style={styles.cardQuickActions}>
            {!isCompletado && !isCancelado && (
              <>
                <TouchableOpacity
                  style={styles.quickIconBtn}
                  onPress={(e) => handleOpenChat(item, e)}
                  activeOpacity={0.8}
                  hitSlop={4}
                >
                  <MessageCircle size={16} color={COLORS.primaryDark} strokeWidth={2.4} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickIconBtn}
                  onPress={(e) => handleOpenQR(item, e)}
                  activeOpacity={0.8}
                  hitSlop={4}
                >
                  <QrCode size={16} color={COLORS.secondaryDark} strokeWidth={2.4} />
                </TouchableOpacity>
              </>
            )}

            {esConductor && !isCompletado && !isCancelado && (
              <>
                <TouchableOpacity
                  style={styles.quickIconBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditarViaje(item);
                  }}
                  activeOpacity={0.8}
                  hitSlop={4}
                >
                  <Pencil size={15} color={COLORS.gray700} strokeWidth={2.4} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickIconBtn, styles.quickIconBtnDanger]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEliminarViaje(item);
                  }}
                  activeOpacity={0.8}
                  hitSlop={4}
                >
                  <Trash2 size={15} color={COLORS.error} strokeWidth={2.4} />
                </TouchableOpacity>
              </>
            )}

            <ChevronRight size={18} color={COLORS.gray400} strokeWidth={2.5} />
          </View>
        </View>
      </PressableScale>
    </AnimatedCardEntrance>
    );
  };

  const renderEvento = ({ item, index }) => (
    <AnimatedCardEntrance index={index}>
      <EventCard
        event={item}
        onPress={() => handleEventPress(item)}
        joinedAt={item.joined_at}
      />
    </AnimatedCardEntrance>
  );

  const renderEmptyViajes = () => {
    if (loadingViajes) return null;
    if (errorViajes) {
      return (
        <EmptyState
          icon={Route}
          tint={COLORS.error}
          tintSoft={COLORS.errorSoft}
          title="Error al cargar viajes"
          subtitle={errorViajes}
          actionLabel="Reintentar"
          onActionPress={fetchViajes}
        />
      );
    }
    return (
      <EmptyState
        icon={Route}
        tint={COLORS.primary}
        tintSoft={COLORS.primarySoft}
        title="Sin planes de viaje aún"
        subtitle="Publica tu propio trayecto como conductor o busca viajes disponibles como pasajero."
        actionLabel="Explorar viajes"
        onActionPress={() => navigation.navigate("SearchTab")}
      />
    );
  };

  const renderEmptyEventos = () => {
    if (loadingEventos) return null;
    if (errorEventos) {
      return (
        <EmptyState
          icon={Calendar}
          tint={COLORS.error}
          tintSoft={COLORS.errorSoft}
          title="Error al cargar eventos"
          subtitle={errorEventos}
          actionLabel="Reintentar"
          onActionPress={fetchEventos}
        />
      );
    }
    return (
      <EmptyState
        icon={Calendar}
        tint={COLORS.secondary}
        tintSoft={COLORS.secondarySoft}
        title="No te has unido a eventos"
        subtitle="Descubre eventos, conciertos y festivales cerca de ti en la pestaña Explorar."
        actionLabel="Explorar eventos"
        onActionPress={() => navigation.navigate("SearchTab")}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header con botón para publicar/crear viaje rápido */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Mis planes</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona tus viajes activos y eventos guardados
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addPlanBtn}
          onPress={() => navigation.navigate("CrearViaje")}
          activeOpacity={0.85}
        >
          <PlusCircle size={18} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.addPlanBtnText}>Crear</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control principales (Viajes / Eventos) */}
      <View style={styles.segmentedWrapper}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === TAB_VIAJES && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab(TAB_VIAJES)}
            activeOpacity={0.85}
          >
            <Car
              size={15}
              color={activeTab === TAB_VIAJES ? COLORS.primaryDark : COLORS.gray500}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === TAB_VIAJES && styles.segmentTextActive,
              ]}
            >
              Viajes ({viajes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === TAB_EVENTOS && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab(TAB_EVENTOS)}
            activeOpacity={0.85}
          >
            <Calendar
              size={15}
              color={
                activeTab === TAB_EVENTOS ? COLORS.secondaryDark : COLORS.gray500
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === TAB_EVENTOS && styles.segmentTextActiveSecondary,
              ]}
            >
              Eventos ({eventos.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sub-filtros para viajes */}
        {activeTab === TAB_VIAJES && viajes.length > 0 && (
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                viajesFilter === FILTER_TODOS && styles.filterPillActive,
              ]}
              onPress={() => setViajesFilter(FILTER_TODOS)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  viajesFilter === FILTER_TODOS && styles.filterPillTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                viajesFilter === FILTER_PROXIMOS && styles.filterPillActive,
              ]}
              onPress={() => setViajesFilter(FILTER_PROXIMOS)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  viajesFilter === FILTER_PROXIMOS && styles.filterPillTextActive,
                ]}
              >
                Próximos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                viajesFilter === FILTER_COMPLETADOS && styles.filterPillActive,
              ]}
              onPress={() => setViajesFilter(FILTER_COMPLETADOS)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  viajesFilter === FILTER_COMPLETADOS &&
                    styles.filterPillTextActive,
                ]}
              >
                Completados
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Contenido según tab activo */}
      {activeTab === TAB_VIAJES ? (
        <FlatList
          data={filteredViajes}
          keyExtractor={(item) => item.keyId}
          renderItem={renderViaje}
          ListEmptyComponent={renderEmptyViajes}
          ListHeaderComponent={
            loadingViajes ? (
              <View style={styles.skeletonContainer}>
                <CarouselSkeleton withImage={false} />
              </View>
            ) : null
          }
          contentContainerStyle={
            filteredViajes.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingViajes}
              onRefresh={handleRefreshViajes}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEvento}
          ListEmptyComponent={renderEmptyEventos}
          ListHeaderComponent={
            loadingEventos ? (
              <View style={styles.skeletonContainer}>
                <CarouselSkeleton />
              </View>
            ) : null
          }
          contentContainerStyle={
            eventos.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingEventos}
              onRefresh={handleRefreshEventos}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* Modal de Edición de Trayecto */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar trayecto</Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.modalCloseBtn}
              hitSlop={8}
            >
              <X size={20} color={COLORS.gray700} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Origen</Text>
              <View
                style={[
                  styles.modalInputRow,
                  editOrigenLocked && styles.modalInputLocked,
                ]}
              >
                <MapPin size={18} color={COLORS.success} strokeWidth={2.5} />
                <TextInput
                  style={styles.modalInput}
                  value={editForm.origen}
                  onChangeText={(v) => setEditForm({ ...editForm, origen: v })}
                  editable={!editOrigenLocked}
                  placeholder="Origen del trayecto"
                  placeholderTextColor={COLORS.gray400}
                />
                {editOrigenLocked && (
                  <Text style={styles.lockedBadge}>Evento</Text>
                )}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Destino</Text>
              <View
                style={[
                  styles.modalInputRow,
                  editDestinoLocked && styles.modalInputLocked,
                ]}
              >
                <MapPin size={18} color={COLORS.error} strokeWidth={2.5} />
                <TextInput
                  style={styles.modalInput}
                  value={editForm.destino}
                  onChangeText={(v) => setEditForm({ ...editForm, destino: v })}
                  editable={!editDestinoLocked}
                  placeholder="Destino del trayecto"
                  placeholderTextColor={COLORS.gray400}
                />
                {editDestinoLocked && (
                  <Text style={styles.lockedBadge}>Evento</Text>
                )}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Fecha</Text>
              <TouchableOpacity
                style={styles.modalInputRow}
                onPress={() => setShowEditDatePicker(true)}
                activeOpacity={0.8}
              >
                <Calendar size={18} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.modalInputText}>
                  {editForm.fecha.toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Hora salida</Text>
              <TouchableOpacity
                style={styles.modalInputRow}
                onPress={() => setShowEditTimePicker(true)}
                activeOpacity={0.8}
              >
                <Clock size={18} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.modalInputText}>
                  {editForm.hora.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Plazas disponibles</Text>
              <View style={styles.plazasRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.plazaButton,
                      parseInt(editForm.plazas) === n &&
                        styles.plazaButtonActive,
                    ]}
                    onPress={() =>
                      setEditForm({ ...editForm, plazas: String(n) })
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.plazaButtonText,
                        parseInt(editForm.plazas) === n &&
                          styles.plazaButtonTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>
                Precio por pasajero (€)
              </Text>
              <View style={styles.modalInputRow}>
                <Euro size={18} color={COLORS.primary} strokeWidth={2.5} />
                <TextInput
                  style={styles.modalInput}
                  value={editForm.precio}
                  onChangeText={(v) => setEditForm({ ...editForm, precio: v })}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleGuardarEdicion}
              disabled={editLoading}
              activeOpacity={0.88}
            >
              {editLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {showEditDatePicker && (
            <DateTimePicker
              value={editForm.fecha}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowEditDatePicker(false);
                if (selectedDate) {
                  setEditForm({ ...editForm, fecha: selectedDate });
                }
              }}
            />
          )}
          {showEditTimePicker && (
            <DateTimePicker
              value={editForm.hora}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedTime) => {
                setShowEditTimePicker(false);
                if (selectedTime) {
                  setEditForm({ ...editForm, hora: selectedTime });
                }
              }}
            />
          )}
        </SafeAreaView>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.xxl,
    lineHeight: 30,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    marginTop: 2,
  },
  addPlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  addPlanBtnText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  segmentedWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 38,
    borderRadius: RADIUS.full,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  segmentText: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  segmentTextActive: {
    color: COLORS.primaryDark,
  },
  segmentTextActiveSecondary: {
    color: COLORS.secondaryDark,
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginTop: SPACING.sm + 2,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  filterPillActive: {
    backgroundColor: COLORS.primarySoft,
  },
  filterPillText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  filterPillTextActive: {
    color: COLORS.primaryDark,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  emptyListContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: "center",
  },
  skeletonContainer: {
    paddingVertical: SPACING.md,
  },
  // ---- Tarjeta de Viaje ----
  viajeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  viajeCardEnCurso: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  viajeCardCompletado: {
    opacity: 0.85,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  rolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  conductorBadge: {
    backgroundColor: COLORS.primarySoft,
  },
  pasajeroBadge: {
    backgroundColor: COLORS.secondarySoft,
  },
  rolBadgeText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
  },
  conductorBadgeText: {
    color: COLORS.primaryDark,
  },
  pasajeroBadgeText: {
    color: COLORS.secondaryDark,
  },
  enCursoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  enCursoText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  completadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  completadoText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  priceChip: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  priceChipText: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
  },
  routeTimeline: {
    alignItems: "center",
    paddingVertical: 2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.gray200,
    marginVertical: 2,
  },
  routeTexts: {
    flex: 1,
    gap: SPACING.xs + 2,
  },
  routePlaceText: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  pagoPendienteBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pagoPendienteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pagoPendienteText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.warning,
  },
  retornarPagoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  retornarPagoBtnText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: SPACING.sm + 2,
  },
  footerMetaCol: {
    gap: 3,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  cardQuickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  quickIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIconBtnDanger: {
    backgroundColor: COLORS.errorSoft,
  },
  // Modal edición
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: FONTS.xl,
    lineHeight: 26,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  modalField: {
    marginBottom: SPACING.lg,
  },
  modalFieldLabel: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
    backgroundColor: COLORS.white,
  },
  modalInputLocked: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
  },
  modalInput: {
    flex: 1,
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.gray900,
    padding: 0,
  },
  modalInputText: {
    flex: 1,
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.gray900,
  },
  lockedBadge: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    color: COLORS.secondaryDark,
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  plazasRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  plazaButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.lg,
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
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  plazaButtonTextActive: {
    color: COLORS.primaryDark,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
    ...SHADOWS.medium,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "800",
  },
});

export default MisPlanesScreen;
