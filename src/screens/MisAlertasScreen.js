// YouConnext - MisAlertasScreen (Gestión de Alertas de Trayectos y Eventos en Ajustes)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  ScrollView,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Bell,
  BellOff,
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";
import { BRAND, COLORS, FONTS, RADIUS, SHADOWS, SPACING } from "../constants";
import { useUser } from "../context/UserContext";
import { usePermission } from "../context/PermissionContext";
import { alertaService } from "../services/travels/alertaService";
import { eventCache } from "../services/eventCache";
import {
  getNotificationPushStatus,
  enablePushNotificationsForUser,
} from "../services/notifications/pushRegistration";
import {
  TIPO_ALERTA,
  getAlertaErrorMessage,
} from "../utils/alertaUtils";
import AlertaCard from "../components/alerts/AlertaCard";
import CrearAlertaModal from "../components/alerts/CrearAlertaModal";
import EmptyState from "../components/home/EmptyState";
import Skeleton from "../components/common/Skeleton";

const FILTERS = [
  { id: "ALL", label: "Todas" },
  { id: "ACTIVE", label: "Activas" },
  { id: "PAUSED", label: "Pausadas" },
  { id: "DESTINO", label: "Por destino" },
  { id: "EVENTO", label: "Por evento" },
];

const MisAlertasScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const { requestPermissionWithDisclosure } = usePermission();

  const [alertas, setAlertas] = useState([]);
  const [eventsMap, setEventsMap] = useState(() => eventCache.getSnapshot());
  const [resolvingEvents, setResolvingEvents] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [togglingIds, setTogglingIds] = useState({});
  const [deletingIds, setDeletingIds] = useState({});

  const [modalVisible, setModalVisible] = useState(
    Boolean(route?.params?.openCreateModal),
  );
  const [modalDefaults, setModalDefaults] = useState({
    tipo: route?.params?.initialTipo || TIPO_ALERTA.DESTINO,
    destino: route?.params?.initialDestino || "",
    event: route?.params?.initialEvent || null,
  });

  const [pushStatus, setPushStatus] = useState({
    granted: true,
    hasRegisteredToken: true,
  });
  const [activatingPush, setActivatingPush] = useState(false);

  const checkPushStatus = useCallback(async () => {
    const status = await getNotificationPushStatus();
    setPushStatus(status);
  }, []);

  const resolveEventNames = useCallback(async (alertasList) => {
    const eventIds = alertasList
      .filter((a) => a?.tipo === TIPO_ALERTA.EVENTO && a?.eventoId)
      .map((a) => a.eventoId);

    if (eventIds.length === 0) return;

    setResolvingEvents(true);
    try {
      const snapshot = await eventCache.resolveEventsByIds(eventIds);
      setEventsMap(snapshot);
    } finally {
      setResolvingEvents(false);
    }
  }, []);

  const fetchAlertas = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const list = await alertaService.obtenerMisAlertas();
        setAlertas(list);
        resolveEventNames(list);
      } catch (err) {
        setError(
          getAlertaErrorMessage(err, "No se pudieron cargar tus alertas."),
        );
      } finally {
        setLoading(false);
      }
    },
    [resolveEventNames],
  );

  useEffect(() => {
    fetchAlertas();
    checkPushStatus();
  }, [fetchAlertas, checkPushStatus]);

  useEffect(() => {
    const unsubFocus = navigation.addListener("focus", () => {
      checkPushStatus();
      fetchAlertas({ silent: true });
    });
    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        checkPushStatus();
      }
    });
    return () => {
      unsubFocus?.();
      appStateSub?.remove?.();
    };
  }, [navigation, checkPushStatus, fetchAlertas]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAlertas({ silent: true }), checkPushStatus()]);
    setRefreshing(false);
  };

  const handleActivatePush = async () => {
    if (activatingPush) return;
    setActivatingPush(true);
    try {
      await enablePushNotificationsForUser({
        requestPermissionWithDisclosure,
        userId: user?.id,
      });
      await checkPushStatus();
    } catch (err) {
      Alert.alert(
        "Notificaciones",
        err?.message || "No se pudieron activar las notificaciones.",
      );
    } finally {
      setActivatingPush(false);
    }
  };

  const handleToggleAlerta = async (alerta, nextActiva) => {
    const id = alerta?.id;
    if (id === undefined || id === null || togglingIds[id]) return;

    const prevActiva = Boolean(alerta.activa);

    // Actualización optimista
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    setAlertas((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, activa: nextActiva } : item,
      ),
    );

    try {
      const updated = await alertaService.actualizarEstadoAlerta(id, nextActiva);
      setAlertas((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...(updated || {}), activa: nextActiva }
            : item,
        ),
      );
    } catch (err) {
      // Rollback si falla
      setAlertas((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, activa: prevActiva } : item,
        ),
      );
      Alert.alert("No se pudo actualizar", getAlertaErrorMessage(err));
    } finally {
      setTogglingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleDeleteAlerta = (alerta) => {
    const id = alerta?.id;
    if (id === undefined || id === null || deletingIds[id]) return;

    const label =
      alerta.tipo === TIPO_ALERTA.EVENTO
        ? eventsMap[alerta.eventoId]?.name || "este evento"
        : alerta.destino || "este destino";

    Alert.alert(
      "Eliminar alerta",
      `¿Quieres eliminar la alerta para ${label}? Dejarás de recibir avisos de nuevos viajes.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeletingIds((prev) => ({ ...prev, [id]: true }));
            try {
              await alertaService.eliminarAlerta(id);
              setAlertas((prev) => prev.filter((item) => item.id !== id));
            } catch (err) {
              Alert.alert("No se pudo eliminar", getAlertaErrorMessage(err));
            } finally {
              setDeletingIds((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              });
            }
          },
        },
      ],
    );
  };

  const handleOpenCreateModal = () => {
    setModalDefaults({
      tipo: TIPO_ALERTA.DESTINO,
      destino: "",
      event: null,
    });
    setModalVisible(true);
  };

  const handleCreated = (created, resolvedEvent) => {
    if (!created) {
      fetchAlertas({ silent: true });
      return;
    }
    setAlertas((prev) => {
      const filtered = prev.filter((a) => a.id !== created.id);
      return [created, ...filtered];
    });
    if (resolvedEvent?.id) {
      setEventsMap((prev) => ({
        ...prev,
        [resolvedEvent.id]: resolvedEvent,
      }));
    } else if (created?.tipo === TIPO_ALERTA.EVENTO && created?.eventoId) {
      resolveEventNames([created]);
    }
  };

  const handleCardPress = (alerta, eventInfo) => {
    if (alerta?.tipo === TIPO_ALERTA.EVENTO && alerta?.eventoId) {
      navigation.navigate("EventDetalle", {
        eventId: alerta.eventoId,
        event: eventInfo?.raw || undefined,
      });
      return;
    }

    if (alerta?.tipo === TIPO_ALERTA.DESTINO && alerta?.destino) {
      navigation.navigate("SearchTrayectos", {
        tab: "trayectos",
        searchParams: {
          origin: "",
          destination: alerta.destino,
          date: "",
          passengers: 1,
        },
      });
    }
  };

  const filteredAlertas = useMemo(() => {
    switch (activeFilter) {
      case "ACTIVE":
        return alertas.filter((a) => Boolean(a.activa));
      case "PAUSED":
        return alertas.filter((a) => !a.activa);
      case "DESTINO":
        return alertas.filter((a) => a.tipo === TIPO_ALERTA.DESTINO);
      case "EVENTO":
        return alertas.filter((a) => a.tipo === TIPO_ALERTA.EVENTO);
      default:
        return alertas;
    }
  }, [alertas, activeFilter]);

  const activeCount = useMemo(
    () => alertas.filter((a) => Boolean(a.activa)).length,
    [alertas],
  );

  const showPushWarning = !pushStatus.granted || !pushStatus.hasRegisteredToken;

  const renderSkeletons = () => (
    <View style={styles.skeletonList}>
      {[1, 2, 3].map((k) => (
        <View key={k} style={styles.skeletonCard}>
          <View style={styles.skeletonTop}>
            <Skeleton width={80} height={22} borderRadius={RADIUS.full} />
            <Skeleton width={100} height={24} borderRadius={RADIUS.full} />
          </View>
          <View style={styles.skeletonMid}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="65%" height={18} />
              <Skeleton width="90%" height={13} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    if (alertas.length === 0 && !error) {
      return (
        <EmptyState
          icon={Bell}
          tint={COLORS.primary}
          tintSoft={COLORS.primarySoft}
          title="Aún no tienes alertas"
          subtitle="Crea una alerta por destino o para un evento que te interese y te avisaremos en cuanto alguien publique un viaje."
          actionLabel="Crear mi primera alerta"
          onActionPress={handleOpenCreateModal}
          actionVariant="primary"
        />
      );
    }
    if (alertas.length > 0 && filteredAlertas.length === 0) {
      return (
        <EmptyState
          icon={Bell}
          tint={COLORS.gray600}
          tintSoft={COLORS.gray100}
          title="Sin alertas en este filtro"
          subtitle="Prueba a cambiar el filtro o crea una nueva alerta."
          actionLabel="Ver todas"
          onActionPress={() => setActiveFilter("ALL")}
          actionVariant="secondary"
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Alertas de trayectos
          </Text>
          <Text style={styles.headerSubtitle}>
            {alertas.length === 0
              ? "Avisos automáticos por destino o evento"
              : `${activeCount} ${activeCount === 1 ? "activa" : "activas"} de ${alertas.length}`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={handleOpenCreateModal}
          activeOpacity={0.85}
          accessibilityLabel="Crear nueva alerta"
        >
          <Plus size={16} color={COLORS.white} strokeWidth={2.8} />
          <Text style={styles.newBtnText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de permisos push si faltan permisos o token */}
      {showPushWarning && (
        <View style={styles.pushBanner}>
          <View style={styles.pushBannerIcon}>
            <BellOff size={18} color={COLORS.accentDark} strokeWidth={2.3} />
          </View>
          <View style={styles.pushBannerTextCol}>
            <Text style={styles.pushBannerTitle}>
              {!pushStatus.granted
                ? "Notificaciones desactivadas"
                : "Dispositivo pendiente de vincular"}
            </Text>
            <Text style={styles.pushBannerSubtitle}>
              Activa los avisos push para recibir alertas instantáneas cuando aparezca un trayecto.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.pushBannerBtn}
            onPress={handleActivatePush}
            disabled={activatingPush}
            activeOpacity={0.85}
          >
            <Text style={styles.pushBannerBtnText}>
              {activatingPush ? "..." : "Activar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filtros rápidos */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((f) => {
            const isSelected = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Banner de error con reintento */}
      {error ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color={COLORS.error} strokeWidth={2.2} />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchAlertas()}
            activeOpacity={0.8}
          >
            <RefreshCw size={13} color={COLORS.error} strokeWidth={2.4} />
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        renderSkeletons()
      ) : (
        <FlatList
          data={filteredAlertas}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AlertaCard
              alerta={item}
              eventInfo={item.eventoId ? eventsMap[item.eventoId] : null}
              resolvingEvent={resolvingEvents}
              toggling={Boolean(togglingIds[item.id])}
              deleting={Boolean(deletingIds[item.id])}
              onToggle={handleToggleAlerta}
              onDelete={handleDeleteAlerta}
              onPress={handleCardPress}
            />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={
            filteredAlertas.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <CrearAlertaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={handleCreated}
        existingAlertas={alertas}
        initialTipo={modalDefaults.tipo}
        initialDestino={modalDefaults.destino}
        initialEvent={modalDefaults.event}
        notificationsGranted={pushStatus.granted}
        onRequestNotifications={handleActivatePush}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
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
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.xs,
  },
  newBtnText: {
    fontSize: FONTS.xs + 1,
    fontWeight: "800",
    color: COLORS.white,
  },
  pushBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.accentSoft,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: "rgba(242, 163, 60, 0.35)",
  },
  pushBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  pushBannerTextCol: {
    flex: 1,
  },
  pushBannerTitle: {
    fontSize: FONTS.xs + 1,
    fontWeight: "800",
    color: COLORS.accentDark,
  },
  pushBannerSubtitle: {
    fontSize: 11,
    color: COLORS.gray700,
    marginTop: 2,
    lineHeight: 15,
  },
  pushBannerBtn: {
    backgroundColor: COLORS.accentDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.full,
  },
  pushBannerBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.white,
  },
  filtersWrapper: {
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  filtersContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs + 2,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: BRAND.black,
    borderColor: BRAND.black,
  },
  filterChipText: {
    fontSize: FONTS.xs + 1,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.errorSoft,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.control,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FONTS.xs + 1,
    fontWeight: "600",
    color: COLORS.error,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.error,
  },
  listContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  skeletonList: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  skeletonTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonMid: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
});

export default MisAlertasScreen;
