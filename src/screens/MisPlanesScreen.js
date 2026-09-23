// YouConnext - MisPlanesScreen (Mis viajes + Mis eventos)
import React, { useState, useCallback, useEffect } from "react";
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
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { EventCard } from "../components";
import { useUser } from "../context/UserContext";
import { eventService } from "../services/eventService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { trayectoService } from "../services/travels/trayectoService";
import { reservaService } from "../services/travels/reservaService";
import { paymentService } from "../services/paymentService";
import { parseTripDate, localToUtcApi } from "../services/dateUtils";

const TAB_VIAJES = "viajes";
const TAB_EVENTOS = "eventos";

const MisPlanesScreen = ({ navigation }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(TAB_VIAJES);

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
  const [editEventoInfo, setEditEventoInfo] = useState(null);
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
      } else {
        console.warn(
          "Error al cargar trayectos como conductor:",
          conductorRes.reason,
        );
      }

      let misReservas = [];
      if (pasajeroRes.status === "fulfilled") {
        const raw = pasajeroRes.value;
        misReservas = raw?.pasajerosList || raw?.data?.pasajerosList || [];
      } else {
        console.warn(
          "Error al cargar reservas como pasajero:",
          pasajeroRes.reason,
        );
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
        conductorName: `${user.name} ${user.surname}`.trim(),
        status: t.status || t.estado || "pendiente",
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
          status: t.status || t.estado || "pendiente",
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
  }, [user?.id]);

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

  const handleRetomarPago = async (idReserva, tripId) => {
    setResumingPagoId(idReserva);
    try {
      const returnUrl = tripId
        ? `https://app.youconnext.es/redirect?to=viaje-detalle&id=${tripId}`
        : "https://app.youconnext.es/redirect?to=perfil";
      const response = await reservaService.resumePago(idReserva, returnUrl);
      console.log("[handleRetomarPago] Response:", JSON.stringify(response));
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
    setEditEventoInfo(null);

    if (t.evento_id) {
      try {
        const eventRes = await eventService.getEventById(t.evento_id);
        const eventData = eventRes?.event || eventRes;
        setEditEventoInfo(eventData);
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
        } else if (t.origen === eventData?.name) {
          setEditOrigenLocked(true);
        } else if (t.destino === eventData?.name) {
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
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  const renderViaje = ({ item }) => {
    const esConductor = item.rol === "conductor";
    return (
      <TouchableOpacity
        style={styles.viajeCard}
        onPress={() => handleViajePress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.viajeCardHeader}>
          <View
            style={[
              styles.rolBadge,
              esConductor ? styles.conductorBadge : styles.pasajeroBadge,
            ]}
          >
            {esConductor ? (
              <Car size={12} color={COLORS.primary} strokeWidth={2.5} />
            ) : (
              <UserIcon size={12} color={COLORS.secondary} strokeWidth={2.5} />
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
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              {esConductor
                ? item.precio_conductor != null
                  ? `${item.precio_conductor}€`
                  : item.precio != null
                    ? `${item.precio}€`
                    : "Gratis"
                : item.precio != null
                  ? `${item.precio}€`
                  : "Gratis"}
            </Text>
          </View>
        </View>

        <View style={styles.viajeRoute}>
          <View style={styles.routeTimeline}>
            <View
              style={[styles.timelineDot, { backgroundColor: COLORS.primary }]}
            />
            <View style={styles.timelineLine} />
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: COLORS.secondary },
              ]}
            />
          </View>
          <View style={styles.routePlaces}>
            <Text style={styles.routePlaceText} numberOfLines={1}>
              {item.origen}
            </Text>
            <Text style={styles.routePlaceText} numberOfLines={1}>
              {item.destino}
            </Text>
          </View>
        </View>

        {!esConductor && item.reservaStatus === "pending" && (
          <View style={styles.pagoPendienteBanner}>
            <View style={styles.pagoPendienteInfo}>
              <AlertCircle size={16} color={COLORS.warning} strokeWidth={2.5} />
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
                  <CreditCard
                    size={14}
                    color={COLORS.white}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.retornarPagoBtnText}>Retomar pago</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.viajeCardFooter}>
          <View style={styles.footerInfoRow}>
            <View style={styles.footerInfoItem}>
              <Clock size={14} color={COLORS.gray500} strokeWidth={2} />
              <Text style={styles.footerInfoText}>
                {formatFecha(item.hora)} · {formatHora(item.hora)}
              </Text>
            </View>
            <View style={styles.footerInfoItem}>
              <Users size={14} color={COLORS.gray500} strokeWidth={2} />
              <Text style={styles.footerInfoText} numberOfLines={1}>
                {esConductor
                  ? `${item.disponible ?? 0} plazas libres`
                  : `Con: ${item.conductorName}`}
              </Text>
            </View>
          </View>
          {esConductor ? (
            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleEditarViaje(item)}
                activeOpacity={0.7}
              >
                <Pencil size={16} color={COLORS.primary} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => handleEliminarViaje(item)}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={COLORS.error} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            <ChevronRight size={16} color={COLORS.gray400} strokeWidth={2.5} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEvento = ({ item }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item)}
      joinedAt={item.joined_at}
    />
  );

  const renderEmptyViajes = () => {
    if (loadingViajes) return null;
    if (errorViajes) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{errorViajes}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchViajes}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Route size={40} color={COLORS.gray300} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>Sin viajes programados</Text>
        <Text style={styles.emptyText}>
          Aún no tienes trayectos publicados ni reservas de viaje activas.
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => navigation.navigate("SearchTab")}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyCtaText}>Explorar viajes</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyEventos = () => {
    if (loadingEventos) return null;
    if (errorEventos) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{errorEventos}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEventos}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Calendar size={40} color={COLORS.gray300} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>No tienes eventos</Text>
        <Text style={styles.emptyText}>
          Aún no te has unido a ningún evento. Búscalos en Explorar.
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => navigation.navigate("SearchTab")}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyCtaText}>Explorar eventos</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis planes</Text>
      </View>

      <View style={styles.segmentedWrapper}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === TAB_VIAJES && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab(TAB_VIAJES)}
            activeOpacity={0.8}
          >
            <Car
              size={14}
              color={activeTab === TAB_VIAJES ? COLORS.primary : COLORS.gray500}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === TAB_VIAJES && styles.segmentTextActive,
              ]}
            >
              Viajes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === TAB_EVENTOS && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab(TAB_EVENTOS)}
            activeOpacity={0.8}
          >
            <Calendar
              size={14}
              color={
                activeTab === TAB_EVENTOS ? COLORS.primary : COLORS.gray500
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === TAB_EVENTOS && styles.segmentTextActive,
              ]}
            >
              Eventos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === TAB_VIAJES ? (
        <FlatList
          data={viajes}
          keyExtractor={(item) => item.keyId}
          renderItem={renderViaje}
          ListEmptyComponent={renderEmptyViajes}
          ListHeaderComponent={
            loadingViajes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando tus viajes...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={
            viajes.length === 0 ? styles.emptyList : styles.resultsList
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando tus eventos...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={
            eventos.length === 0 ? styles.emptyList : styles.resultsList
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

      {/* Modal de edición de trayecto */}
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
            >
              <X size={22} color={COLORS.gray600} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Origen */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Origen</Text>
              <View
                style={[
                  styles.modalInputRow,
                  editOrigenLocked && styles.modalInputLocked,
                ]}
              >
                <MapPin size={18} color={COLORS.gray400} strokeWidth={2} />
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

            {/* Destino */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Destino</Text>
              <View
                style={[
                  styles.modalInputRow,
                  editDestinoLocked && styles.modalInputLocked,
                ]}
              >
                <MapPin size={18} color={COLORS.gray400} strokeWidth={2} />
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

            {/* Fecha */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Fecha</Text>
              <TouchableOpacity
                style={styles.modalInputRow}
                onPress={() => setShowEditDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={18} color={COLORS.gray400} strokeWidth={2} />
                <Text style={styles.modalInputText}>
                  {editForm.fecha.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hora */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Hora</Text>
              <TouchableOpacity
                style={styles.modalInputRow}
                onPress={() => setShowEditTimePicker(true)}
                activeOpacity={0.7}
              >
                <Clock size={18} color={COLORS.gray400} strokeWidth={2} />
                <Text style={styles.modalInputText}>
                  {editForm.hora.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Plazas */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Plazas</Text>
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

            {/* Precio */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>
                Precio por pasajero (€)
              </Text>
              <View style={styles.modalInputRow}>
                <Euro size={18} color={COLORS.gray400} strokeWidth={2} />
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
              activeOpacity={0.8}
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
              display={Platform.OS === "ios" ? "inline" : "default"}
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
              display={Platform.OS === "ios" ? "inline" : "default"}
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: FONTS.xxl,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  segmentedWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
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
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  segmentText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  segmentTextActive: {
    color: COLORS.primary,
  },
  resultsList: {
    padding: SPACING.lg,
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sm,
  },
  emptyCta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.lg,
  },
  emptyCtaText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: FONTS.sm,
  },
  // ---- Viaje card ----
  viajeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  viajeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  rolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
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
    fontWeight: "700",
  },
  conductorBadgeText: {
    color: COLORS.primary,
  },
  pasajeroBadgeText: {
    color: COLORS.secondary,
  },
  priceBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  priceBadgeText: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.primary,
  },
  viajeRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  routeTimeline: {
    alignItems: "center",
    gap: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.gray200,
  },
  routePlaces: {
    flex: 1,
    gap: SPACING.sm,
  },
  routePlaceText: {
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    fontWeight: "500",
  },
  pagoPendienteBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pagoPendienteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pagoPendienteText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.warning,
  },
  retornarPagoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  retornarPagoBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.white,
  },
  viajeCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: SPACING.sm,
  },
  footerInfoRow: {
    flexDirection: "row",
    gap: SPACING.md,
    flex: 1,
  },
  footerInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  footerInfoText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  footerActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDanger: {
    backgroundColor: COLORS.errorSoft,
  },
  // ---- Edit modal ----
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
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  modalCloseBtn: {
    padding: SPACING.xs,
  },
  modalBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  modalField: {
    marginBottom: SPACING.lg,
  },
  modalFieldLabel: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  modalInputLocked: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
  },
  modalInput: {
    flex: 1,
    fontSize: FONTS.md,
    color: COLORS.gray800,
    padding: 0,
  },
  modalInputText: {
    flex: 1,
    fontSize: FONTS.md,
    color: COLORS.gray800,
  },
  lockedBadge: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
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
    fontWeight: "600",
    color: COLORS.gray500,
  },
  plazaButtonTextActive: {
    color: COLORS.primary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: "700",
  },
});

export default MisPlanesScreen;
