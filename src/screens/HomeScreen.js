// YouConnext - HomeScreen (UI/UX Redesign)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Car, ScanLine, Ticket } from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING } from "../constants";
import {
  HomeHeader,
  QuickActions,
  SectionHeader,
  EmptyState,
  HeroTripCard,
  HeroEventCard,
  TripMiniCard,
  EventMiniCard,
  SearchBottomSheet,
  HeroCardSkeleton,
  CarouselSkeleton,
  AnimatedCardEntrance,
} from "../components";
import { trayectoService } from "../services/travels/trayectoService";
import { eventService } from "../services/eventService";
import { homeCache } from "../services/homeCache";
import {
  parseTripDate,
  formatTripDate as _formatTripDate,
  formatTripTime as _formatTripTime,
  formatTripCountdown as _formatTripCountdown,
} from "../services/dateUtils";
import { messageService } from "../services/messages/messageService";

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [searchSheetVisible, setSearchSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [proximosViajes, setProximosViajes] = useState(
    homeCache.getProximosViajes() || [],
  );
  const [loadingProximos, setLoadingProximos] = useState(
    !(homeCache.getProximosViajes() && homeCache.getProximosViajes().length > 0),
  );

  const [joinedEvents, setJoinedEvents] = useState(
    homeCache.getJoinedEvents() || [],
  );
  const [loadingJoined, setLoadingJoined] = useState(
    !(homeCache.getJoinedEvents() && homeCache.getJoinedEvents().length > 0),
  );

  const [eventosCercanos, setEventosCercanos] = useState(
    homeCache.getEventosCercanos() || [],
  );
  const [loadingEventos, setLoadingEventos] = useState(
    !(homeCache.getEventosCercanos() && homeCache.getEventosCercanos().length > 0),
  );

  const [viajesPopulares, setViajesPopulares] = useState(
    homeCache.getViajesPopulares() || [],
  );
  const [loadingPopulares, setLoadingPopulares] = useState(
    !(homeCache.getViajesPopulares() && homeCache.getViajesPopulares().length > 0),
  );

  const handleSearch = (params) => {
    navigation.navigate("SearchTrayectos", { searchParams: params });
  };

  const fetchProximosViajes = useCallback(async () => {
    const cached = homeCache.getProximosViajes();
    if (cached && cached.length > 0) {
      setProximosViajes(cached);
      setLoadingProximos(false);
      return;
    }
    setLoadingProximos(true);
    try {
      const res = await trayectoService.obtenerProximosTrayectos();
      const data = Array.isArray(res) ? res : res?.data ? res.data : [];
      setProximosViajes(data);
      homeCache.setProximosViajes(data);
    } catch (err) {
      console.warn("Error al cargar próximos viajes:", err.message);
      setProximosViajes([]);
    } finally {
      setLoadingProximos(false);
    }
  }, []);

  const fetchJoinedEvents = useCallback(async () => {
    const cached = homeCache.getJoinedEvents();
    if (cached && cached.length > 0) {
      setJoinedEvents(cached);
      setLoadingJoined(false);
      return;
    }
    setLoadingJoined(true);
    try {
      const res = await eventService.getMyJoinedEvents();
      const data = res.events || res.data || (Array.isArray(res) ? res : []);
      const safeData = Array.isArray(data) ? data : [];
      setJoinedEvents(safeData);
      homeCache.setJoinedEvents(safeData);
    } catch (err) {
      console.warn("Error al cargar eventos unidos:", err.message);
      setJoinedEvents([]);
    } finally {
      setLoadingJoined(false);
    }
  }, []);

  const fetchEventosCercanos = useCallback(async () => {
    const cached = homeCache.getEventosCercanos();
    if (cached && cached.length > 0) {
      setEventosCercanos(cached);
      setLoadingEventos(false);
      return;
    }
    setLoadingEventos(true);
    try {
      let lat = 40.4168;
      let lng = -3.7038;

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {
        // Fallback a coordenadas por defecto
      }

      const res = await eventService.getNearbyEvents({
        lat,
        lng,
        radius: 20,
        limit: 8,
      });
      const data = res.events || res.data || (Array.isArray(res) ? res : []);
      const safeData = Array.isArray(data) ? data : [];
      setEventosCercanos(safeData);
      homeCache.setEventosCercanos(safeData);
    } catch (err) {
      console.warn("Error al cargar eventos cercanos:", err.message);
      setEventosCercanos([]);
    } finally {
      setLoadingEventos(false);
    }
  }, []);

  const fetchViajesPopulares = useCallback(async () => {
    const cached = homeCache.getViajesPopulares();
    if (cached && cached.length > 0) {
      setViajesPopulares(cached);
      setLoadingPopulares(false);
      return;
    }
    setLoadingPopulares(true);
    try {
      const res = await trayectoService.obtenerTrayectos({ limit: 8 });
      const data = res.data || res.trayectos || (Array.isArray(res) ? res : []);
      const now = Date.now();
      const safeData = (Array.isArray(data) ? data : [])
        .filter((t) => {
          const estado = (t.status || t.estado || "").toLowerCase();
          const disponible = t.disponible ?? t.plazas ?? 0;
          const parsed = parseTripDate(t);
          const fecha = parsed ? parsed.getTime() : 0;
          return (
            estado !== "cancelado" &&
            estado !== "completado" &&
            disponible > 0 &&
            fecha > now
          );
        })
        .sort((a, b) => {
          const da = parseTripDate(a);
          const db = parseTripDate(b);
          return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
        })
        .slice(0, 8);
      setViajesPopulares(safeData);
      homeCache.setViajesPopulares(safeData);
    } catch (err) {
      console.warn("Error al cargar viajes populares:", err.message);
      setViajesPopulares([]);
    } finally {
      setLoadingPopulares(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    homeCache.clear();
    await Promise.all([
      fetchProximosViajes(),
      fetchJoinedEvents(),
      fetchEventosCercanos(),
      fetchViajesPopulares(),
    ]);
    setRefreshing(false);
  }, [
    fetchProximosViajes,
    fetchJoinedEvents,
    fetchEventosCercanos,
    fetchViajesPopulares,
  ]);

  useEffect(() => {
    fetchProximosViajes();
    fetchJoinedEvents();
    fetchEventosCercanos();
    fetchViajesPopulares();
  }, [
    fetchProximosViajes,
    fetchJoinedEvents,
    fetchEventosCercanos,
    fetchViajesPopulares,
  ]);

  const formatHora = (viaje) =>
    _formatTripTime(typeof viaje === "string" ? { hora: viaje } : viaje);

  const formatFecha = (viaje) =>
    _formatTripDate(typeof viaje === "string" ? { hora: viaje } : viaje);

  const formatCountdown = (viaje) =>
    _formatTripCountdown(typeof viaje === "string" ? { hora: viaje } : viaje);

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 6) return "Buenas noches";
    if (hora < 12) return "Buenos días";
    if (hora < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const quickActionsData = [
    {
      icon: Car,
      label: "Crear viaje",
      subtitle: "Publica tus plazas libres",
      gradient: COLORS.gradient.hero,
      onPress: () => navigation.navigate("CrearViaje"),
    },
    {
      icon: ScanLine,
      label: "Escanear QR",
      subtitle: "Valida tu billete",
      gradient: COLORS.gradient.ocean,
      onPress: () => navigation.navigate("EscanearQR"),
    },
  ];

  const loadingInitial =
    (loadingProximos || loadingJoined) &&
    proximosViajes.length === 0 &&
    joinedEvents.length === 0;

  // Hero: El viaje o evento más inminente
  const heroViaje = proximosViajes.length > 0 ? proximosViajes[0] : null;
  const heroEvento =
    !heroViaje && joinedEvents.length > 0 ? joinedEvents[0] : null;

  const eventosPendientes = useMemo(() => {
    if (heroEvento) return joinedEvents.slice(1);
    return joinedEvents;
  }, [joinedEvents, heroEvento]);

  const eventTieneViajeAsociado = useCallback(
    (eventId) =>
      proximosViajes.some(
        (v) => v.evento_id === eventId || v.eventoId === eventId,
      ),
    [proximosViajes],
  );

  const joinedEventIds = useMemo(
    () => new Set(joinedEvents.map((e) => e.id)),
    [joinedEvents],
  );

  const eventosDescubrir = useMemo(
    () => eventosCercanos.filter((e) => !joinedEventIds.has(e.id)),
    [eventosCercanos, joinedEventIds],
  );

  const handleOpenHeroChat = async () => {
    if (!heroViaje) return;
    try {
      const tripId = heroViaje.id || heroViaje.viaje_id;
      let chat = null;
      try {
        const res = await messageService.obtenerChatPorTripId(tripId);
        chat = res.data || res;
      } catch {
        const created = await messageService.crearChatGrupal({
          trip_id: tripId,
          name: `${heroViaje.origen} → ${heroViaje.destino}`,
        });
        chat = created.data || created;
      }
      if (chat && (chat.chat_id || chat.id)) {
        navigation.navigate("ChatDetalle", {
          chat,
          chatId: chat.chat_id || chat.id,
        });
      }
    } catch (e) {
      console.log("Error al abrir chat del trayecto:", e);
    }
  };

  const conductorNombre = heroViaje
    ? typeof heroViaje.conductor === "object"
      ? heroViaje.conductor?.nombre || heroViaje.conductor?.name || "Conductor"
      : heroViaje.conductor || "Conductor"
    : "";

  const renderEventoMiniCard = ({ item, index }) => (
    <AnimatedCardEntrance index={index}>
      <EventMiniCard
        event={item}
        tieneViaje={eventTieneViajeAsociado(item.id)}
        onPress={() =>
          navigation.navigate("EventDetalle", { eventId: item.id, event: item })
        }
        onSearchTrip={() =>
          navigation.navigate("SearchTrayectos", {
            searchParams: { destination: item.name },
          })
        }
        onOfferSeats={() =>
          navigation.navigate("CrearViaje", { evento: item })
        }
      />
    </AnimatedCardEntrance>
  );

  const renderTripMiniCard = ({ item, index }) => (
    <AnimatedCardEntrance index={index}>
      <TripMiniCard
        viaje={item}
        dateLabel={formatFecha(item.hora)}
        timeLabel={formatHora(item.hora)}
        onPress={() => navigation.navigate("ViajeDetalle", { viaje: item })}
      />
    </AnimatedCardEntrance>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" transparent backgroundColor="transparent" />

      {/* Header moderno con degradado y buscador superpuesto */}
      <HomeHeader
        user={user}
        greeting={getSaludo()}
        topInset={insets.top}
        onChatPress={() => navigation.navigate("Chats")}
        onProfilePress={() => navigation.navigate("Perfil")}
        onSearchPress={() => setSearchSheetVisible(true)}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Accesos rápidos con microtarjetas */}
        <View style={styles.section}>
          <QuickActions actions={quickActionsData} />
        </View>

        {/* Sección de Actividad Inminente / Próximo Plan */}
        <View style={styles.section}>
          {loadingInitial ? (
            <HeroCardSkeleton />
          ) : heroViaje ? (
            <HeroTripCard
              viaje={heroViaje}
              countdown={formatCountdown(heroViaje.hora)}
              dateLabel={formatFecha(heroViaje.hora)}
              timeLabel={formatHora(heroViaje.hora)}
              conductorNombre={conductorNombre}
              onPress={() =>
                navigation.navigate("ViajeDetalle", { viaje: heroViaje })
              }
              onChatPress={handleOpenHeroChat}
            />
          ) : heroEvento ? (
            <HeroEventCard
              evento={heroEvento}
              tieneViaje={eventTieneViajeAsociado(heroEvento.id)}
              onPress={() =>
                navigation.navigate("EventDetalle", {
                  eventId: heroEvento.id,
                  event: heroEvento,
                })
              }
              onSearchTrip={() =>
                navigation.navigate("SearchTrayectos", {
                  searchParams: { destination: heroEvento.name },
                })
              }
              onOfferSeats={() =>
                navigation.navigate("CrearViaje", { evento: heroEvento })
              }
            />
          ) : null}
        </View>

        {/* Eventos a los que estás unido */}
        {eventosPendientes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Tus eventos"
              subtitle="Planes a los que te has unido"
              actionLabel="Ver todos"
              onActionPress={() => navigation.navigate("MisEventos")}
            />
            <FlatList
              data={eventosPendientes}
              keyExtractor={(item) => `pend-${item.id}`}
              renderItem={renderEventoMiniCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              ItemSeparatorComponent={() => (
                <View style={{ width: SPACING.md }} />
              )}
            />
          </View>
        )}

        {/* Eventos destacados / cerca de ti */}
        <View style={styles.section}>
          <SectionHeader
            title="Descubre eventos"
            subtitle="Cerca de ti para tu próximo viaje"
            actionLabel="Ver todos"
            onActionPress={() => navigation.navigate("SearchTab")}
          />
          {loadingEventos ? (
            <CarouselSkeleton />
          ) : eventosDescubrir.length === 0 ? (
            <EmptyState
              icon={Ticket}
              tint={COLORS.secondary}
              tintSoft={COLORS.secondarySoft}
              title="Sin novedades por ahora"
              subtitle="Vuelve más tarde para descubrir eventos cerca de ti"
            />
          ) : (
            <FlatList
              data={eventosDescubrir}
              keyExtractor={(item) => `disc-${item.id}`}
              renderItem={renderEventoMiniCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              ItemSeparatorComponent={() => (
                <View style={{ width: SPACING.md }} />
              )}
            />
          )}
        </View>

        {/* Viajes disponibles / populares */}
        <View style={styles.section}>
          <SectionHeader
            title="Viajes disponibles"
            subtitle="Trayectos activos con plazas libres"
            actionLabel="Buscar"
            onActionPress={() => navigation.navigate("SearchTab")}
          />
          {loadingPopulares ? (
            <CarouselSkeleton withImage={false} />
          ) : viajesPopulares.length === 0 ? (
            <EmptyState
              icon={Car}
              tint={COLORS.primary}
              tintSoft={COLORS.primarySoft}
              title="Sin viajes disponibles"
              subtitle="Sé el primero en compartir tu trayecto"
              actionLabel="Crear un viaje"
              onActionPress={() => navigation.navigate("CrearViaje")}
            />
          ) : (
            <FlatList
              data={viajesPopulares}
              keyExtractor={(item) => `pop-${item.id}`}
              renderItem={renderTripMiniCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              ItemSeparatorComponent={() => (
                <View style={{ width: SPACING.md }} />
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Hoja de búsqueda emergente */}
      <SearchBottomSheet
        visible={searchSheetVisible}
        onClose={() => setSearchSheetVisible(false)}
        onSearch={handleSearch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  horizontalListContent: {
    paddingRight: SPACING.lg,
  },
});

export default HomeScreen;
