// YouConnext - HomeScreen
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import {
  ScanLine,
  Search,
  Car,
  ChevronRight,
  Sparkles,
  Ticket,
  ArrowRight,
  Clock,
  MessageCircle,
  Users,
  Navigation as NavIcon,
  PlusCircle,
  CheckCircle2,
  Building2,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { SearchBottomSheet, EventCard } from "../components";
import { trayectoService } from "../services/travels/trayectoService";
import { eventService } from "../services/eventService";
import { homeCache } from "../services/homeCache";
import {
  parseTripDate,
  formatTripDate as _formatTripDate,
  formatTripTime as _formatTripTime,
  formatTripCountdown as _formatTripCountdown,
} from "../services/dateUtils";

const CARD_WIDTH = Dimensions.get("window").width * 0.72;

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const [searchSheetVisible, setSearchSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [proximosViajes, setProximosViajes] = useState(
    homeCache.getProximosViajes() || [],
  );
  const [loadingProximos, setLoadingProximos] = useState(
    !homeCache.getProximosViajes(),
  );

  const [joinedEvents, setJoinedEvents] = useState(
    homeCache.getJoinedEvents() || [],
  );
  const [loadingJoined, setLoadingJoined] = useState(
    !homeCache.getJoinedEvents(),
  );

  const [eventosCercanos, setEventosCercanos] = useState(
    homeCache.getEventosCercanos() || [],
  );
  const [loadingEventos, setLoadingEventos] = useState(
    !homeCache.getEventosCercanos(),
  );

  const [viajesPopulares, setViajesPopulares] = useState(
    homeCache.getViajesPopulares() || [],
  );
  const [loadingPopulares, setLoadingPopulares] = useState(
    !homeCache.getViajesPopulares(),
  );

  const handleSearch = (params) => {
    navigation.navigate("SearchTrayectos", { searchParams: params });
  };

  const fetchProximosViajes = useCallback(async () => {
    const cached = homeCache.getProximosViajes();
    if (cached) {
      setProximosViajes(cached);
      setLoadingProximos(false);
      return;
    }
    setLoadingProximos(true);
    try {
      const res = await trayectoService.obtenerProximosTrayectos();
      const data = Array.isArray(res) ? res : [];
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
    if (cached) {
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
    if (cached) {
      setEventosCercanos(cached);
      setLoadingEventos(false);
      return;
    }
    setLoadingEventos(true);
    try {
      let lat = 40.4168;
      let lng = -3.7038;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {
        // fallback a Madrid
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
    if (cached) {
      setViajesPopulares(cached);
      setLoadingPopulares(false);
      return;
    }
    setLoadingPopulares(true);
    try {
      const res = await trayectoService.obtenerTrayectos();
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

  useFocusEffect(
    useCallback(() => {
      const cached = homeCache.getProximosViajes();
      if (cached) {
        setProximosViajes(cached);
      }
    }, []),
  );

  const formatHora = (viaje) =>
    _formatTripTime(typeof viaje === "string" ? { hora: viaje } : viaje);

  const formatFecha = (viaje) =>
    _formatTripDate(typeof viaje === "string" ? { hora: viaje } : viaje);

  const formatCountdown = (viaje) =>
    _formatTripCountdown(typeof viaje === "string" ? { hora: viaje } : viaje);

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 6) return "Buenas noches";
    if (hora < 12) return "Buenos dias";
    if (hora < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const getIniciales = () => {
    if (user?.nombre) return user.nombre.charAt(0).toUpperCase();
    if (user?.name) return user.name.charAt(0).toUpperCase();
    return "?";
  };

  const quickActions = [
    {
      icon: Car,
      label: "Crear viaje",
      color: COLORS.primary,
      bg: COLORS.primarySoft,
      onPress: () => navigation.navigate("CrearViaje"),
    },
    {
      icon: ScanLine,
      label: "Escanear QR",
      color: COLORS.secondary,
      bg: COLORS.secondarySoft,
      onPress: () => navigation.navigate("EscanearQR"),
    },
  ];

  const loadingInitial =
    (loadingProximos || loadingJoined) &&
    proximosViajes.length === 0 &&
    joinedEvents.length === 0;

  const hasActivity = proximosViajes.length > 0 || joinedEvents.length > 0;

  // El viaje/evento más inminente. Priorizamos un viaje ya concretado.
  const heroViaje = proximosViajes.length > 0 ? proximosViajes[0] : null;
  const heroEvento =
    !heroViaje && joinedEvents.length > 0 ? joinedEvents[0] : null;

  // Eventos unidos que aparecen en el carrusel "Lo pendiente" (excluye el que ya se muestra como hero)
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

  const renderHeroCard = () => {
    if (heroViaje) {
      const conductorNombre =
        typeof heroViaje.conductor === "object"
          ? heroViaje.conductor?.nombre || "Conductor"
          : heroViaje.conductor || "Conductor";
      return (
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("ViajeDetalle", { viaje: heroViaje })
          }
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Clock size={13} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>
                {formatCountdown(heroViaje.hora)}
              </Text>
            </View>
            <Text style={styles.heroBadgeSecondary}>
              {formatFecha(heroViaje.hora)} · {formatHora(heroViaje.hora)}
            </Text>
          </View>

          <Text style={styles.heroLabel}>Tu próximo viaje</Text>

          <View style={styles.heroRoute}>
            <View style={styles.heroRoutePoint}>
              <View
                style={[styles.heroDot, { backgroundColor: COLORS.success }]}
              />
              <Text style={styles.heroRouteText} numberOfLines={1}>
                {heroViaje.origen || "Origen"}
              </Text>
            </View>
            <View style={styles.heroRouteLine} />
            <View style={styles.heroRoutePoint}>
              <View
                style={[styles.heroDot, { backgroundColor: COLORS.white }]}
              />
              <Text style={styles.heroRouteText} numberOfLines={1}>
                {heroViaje.destino || "Destino"}
              </Text>
            </View>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.heroPersonRow}>
              {heroViaje.img_perfil ? (
                <Image
                  source={{ uri: heroViaje.img_perfil }}
                  style={styles.heroAvatar}
                />
              ) : (
                <View style={styles.heroAvatarFallback}>
                  <Text style={styles.heroAvatarText}>
                    {conductorNombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.heroPersonLabel}>Conductor</Text>
                <Text style={styles.heroPersonName} numberOfLines={1}>
                  {conductorNombre}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.heroChatBtn}
              onPress={() =>
                navigation.navigate("ViajeDetalle", { viaje: heroViaje })
              }
              activeOpacity={0.8}
            >
              <MessageCircle
                size={16}
                color={COLORS.primary}
                strokeWidth={2.5}
              />
              <Text style={styles.heroChatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    if (heroEvento) {
      const tieneViaje = eventTieneViajeAsociado(heroEvento.id);
      return (
        <TouchableOpacity
          style={[styles.heroCard, styles.heroCardEvento]}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("EventDetalle", {
              eventId: heroEvento.id,
              event: heroEvento,
            })
          }
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, styles.heroBadgeEvento]}>
              <Ticket size={13} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>Te has unido</Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>Tu próximo plan</Text>
          <Text style={styles.heroEventoTitle} numberOfLines={2}>
            {heroEvento.name}
          </Text>

          {tieneViaje ? (
            <View style={styles.heroTripReadyBadge}>
              <CheckCircle2 size={16} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.heroTripReadyText}>
                Ya tienes un viaje para este evento
              </Text>
            </View>
          ) : (
            <View style={styles.heroCtaRow}>
              <TouchableOpacity
                style={styles.heroCtaBtn}
                onPress={() =>
                  navigation.navigate("SearchTrayectos", {
                    searchParams: { destination: heroEvento.name },
                  })
                }
                activeOpacity={0.85}
              >
                <Search size={15} color={COLORS.secondary} strokeWidth={2.5} />
                <Text style={styles.heroCtaBtnText}>Buscar viaje</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroCtaBtn, styles.heroCtaBtnOutline]}
                onPress={() =>
                  navigation.navigate("CrearViaje", { evento: heroEvento })
                }
                activeOpacity={0.85}
              >
                <PlusCircle size={15} color={COLORS.white} strokeWidth={2.5} />
                <Text
                  style={[styles.heroCtaBtnText, styles.heroCtaBtnTextOutline]}
                >
                  Ofrecer plazas
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderEventoPendienteCard = ({ item }) => {
    const tieneViaje = eventTieneViajeAsociado(item.id);
    const hasImage = item.image && item.image.length > 100;
    return (
      <TouchableOpacity
        style={styles.pendienteCard}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate("EventDetalle", { eventId: item.id, event: item })
        }
      >
        {hasImage ? (
          <Image
            source={{
              uri: item.image.startsWith("data:")
                ? item.image
                : `data:image/jpeg;base64,${item.image}`,
            }}
            style={styles.pendienteImage}
          />
        ) : (
          <View style={styles.pendienteImagePlaceholder}>
            <Ticket size={28} color={COLORS.gray300} strokeWidth={1.5} />
          </View>
        )}
        <View style={styles.pendienteBody}>
          <Text style={styles.pendienteTitle} numberOfLines={1}>
            {item.name}
          </Text>
          {item.company?.name ? (
            <View style={styles.pendienteCompanyRow}>
              <Building2 size={11} color={COLORS.gray400} strokeWidth={2.5} />
              <Text style={styles.pendienteCompany} numberOfLines={1}>
                {item.company.name}
              </Text>
            </View>
          ) : null}

          {tieneViaje ? (
            <View style={styles.pendienteReadyBadge}>
              <CheckCircle2
                size={13}
                color={COLORS.success}
                strokeWidth={2.5}
              />
              <Text style={styles.pendienteReadyText}>Viaje listo</Text>
            </View>
          ) : (
            <View style={styles.pendienteCtaRow}>
              <TouchableOpacity
                style={styles.pendienteCtaBtn}
                onPress={() =>
                  navigation.navigate("SearchTrayectos", {
                    searchParams: { destination: item.name },
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.pendienteCtaText}>Buscar viaje</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pendienteCtaBtn, styles.pendienteCtaBtnAlt]}
                onPress={() =>
                  navigation.navigate("CrearViaje", { evento: item })
                }
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.pendienteCtaText, styles.pendienteCtaTextAlt]}
                >
                  Ofrecer plazas
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderViajePopularCard = ({ item }) => (
    <TouchableOpacity
      style={styles.popularCard}
      activeOpacity={0.88}
      onPress={() => navigation.navigate("ViajeDetalle", { viaje: item })}
    >
      <View style={styles.popularHeader}>
        <View style={styles.popularDateBadge}>
          <Text style={styles.popularDateText}>{formatFecha(item.hora)}</Text>
          <Text style={styles.popularTimeText}>{formatHora(item.hora)}</Text>
        </View>
        {item.precio != null && (
          <View style={styles.popularPriceBadge}>
            <Text style={styles.popularPriceText}>{item.precio} €</Text>
          </View>
        )}
      </View>
      <View style={styles.popularRoute}>
        <View style={styles.popularRoutePoint}>
          <View
            style={[styles.popularDot, { backgroundColor: COLORS.success }]}
          />
          <Text style={styles.popularRouteText} numberOfLines={1}>
            {item.origen || "Origen"}
          </Text>
        </View>
        <View style={styles.popularRoutePoint}>
          <View
            style={[styles.popularDot, { backgroundColor: COLORS.error }]}
          />
          <Text style={styles.popularRouteText} numberOfLines={1}>
            {item.destino || "Destino"}
          </Text>
        </View>
      </View>
      <View style={styles.popularFooter}>
        <Users size={13} color={COLORS.gray400} strokeWidth={2.5} />
        <Text style={styles.popularFooterText}>
          {item.disponible ?? item.plazas ?? "?"} plazas libres
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.saludo}>{getSaludo()}</Text>
          <Text style={styles.userName}>
            {user?.nombre || user?.name || "Usuario"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("Chats")}
            activeOpacity={0.8}
          >
            <MessageCircle size={20} color={COLORS.gray700} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.perfilButton}
            onPress={() => navigation.navigate("Perfil")}
            activeOpacity={0.8}
          >
            {user?.img_perfil ? (
              <Image
                source={{ uri: user.img_perfil }}
                style={styles.perfilAvatar}
              />
            ) : (
              <Text style={styles.perfilInicial}>{getIniciales()}</Text>
            )}
            {user?.completitud && user.completitud.porcentaje_total < 100 && (
              <View style={styles.perfilCompletionBadge}>
                <Text style={styles.perfilCompletionText}>
                  {user.completitud.porcentaje_total}%
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

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
        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => setSearchSheetVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.searchIconWrapper}>
            <Search size={20} color={COLORS.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.searchPlaceholder}>A donde quieres ir?</Text>
          <View style={styles.searchBadge}>
            <ArrowRight size={16} color={COLORS.white} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Quick actions grid */}
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionItem}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[styles.quickActionIcon, { backgroundColor: action.bg }]}
              >
                <action.icon size={22} color={action.color} strokeWidth={2.5} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingInitial ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Preparando tu inicio...</Text>
          </View>
        ) : hasActivity ? (
          <>
            {/* Lo inminente */}
            <View style={styles.section}>{renderHeroCard()}</View>

            {/* Lo pendiente: eventos a los que te has unido */}
            {eventosPendientes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ticket
                      size={20}
                      color={COLORS.secondary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.sectionTitle}>Tus eventos</Text>
                  </View>
                </View>
                <FlatList
                  data={eventosPendientes}
                  keyExtractor={(item) => `pend-${item.id}`}
                  renderItem={renderEventoPendienteCard}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: SPACING.md }} />
                  )}
                />
              </View>
            )}

            {/* El descubrimiento: eventos cercanos secundario */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles
                    size={20}
                    color={COLORS.secondary}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.sectionTitle}>Descubre más eventos</Text>
                </View>
              </View>
              {loadingEventos ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="small" color={COLORS.secondary} />
                  <Text style={styles.loadingText}>Buscando eventos...</Text>
                </View>
              ) : eventosDescubrir.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrapper}>
                    <Ticket
                      size={28}
                      color={COLORS.gray300}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Sin novedades por ahora</Text>
                  <Text style={styles.emptySubtitle}>
                    Vuelve mas tarde para descubrir eventos cerca de ti
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={eventosDescubrir}
                  keyExtractor={(item) => `disc-${item.id}`}
                  renderItem={renderEventoPendienteCard}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: SPACING.md }} />
                  )}
                />
              )}
            </View>
          </>
        ) : (
          <>
            {/* Estado vacío: 100% descubrimiento */}
            <View style={styles.discoverHeader}>
              <Text style={styles.discoverTitle}>
                ¿Listo para tu próximo plan?
              </Text>
              <Text style={styles.discoverSubtitle}>
                Descubre eventos y viajes cerca de ti
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles
                    size={20}
                    color={COLORS.secondary}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.sectionTitle}>Eventos cerca de ti</Text>
                </View>
              </View>

              {loadingEventos ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="small" color={COLORS.secondary} />
                  <Text style={styles.loadingText}>Buscando eventos...</Text>
                </View>
              ) : eventosCercanos.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrapper}>
                    <Ticket
                      size={32}
                      color={COLORS.gray300}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No hay eventos cercanos</Text>
                  <Text style={styles.emptySubtitle}>
                    Vuelve mas tarde para descubrir eventos cerca de ti
                  </Text>
                </View>
              ) : (
                <View style={styles.cardsContainer}>
                  <EventCard
                    event={eventosCercanos[0]}
                    featured
                    onPress={() =>
                      navigation.navigate("EventDetalle", {
                        eventId: eventosCercanos[0].id,
                        event: eventosCercanos[0],
                      })
                    }
                  />
                  {eventosCercanos.slice(1).map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onPress={() =>
                        navigation.navigate("EventDetalle", {
                          eventId: ev.id,
                          event: ev,
                        })
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <NavIcon size={20} color={COLORS.primary} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Viajes disponibles</Text>
                </View>
              </View>

              {loadingPopulares ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Buscando viajes...</Text>
                </View>
              ) : viajesPopulares.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrapper}>
                    <Car size={32} color={COLORS.gray300} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.emptyTitle}>Sin viajes disponibles</Text>
                  <Text style={styles.emptySubtitle}>
                    Sé el primero en crear un viaje
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAction}
                    onPress={() => navigation.navigate("CrearViaje")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyActionText}>Crear un viaje</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={viajesPopulares}
                  keyExtractor={(item) => `pop-${item.id}`}
                  renderItem={renderViajePopularCard}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: SPACING.md }} />
                  )}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Search Bottom Sheet */}
      <SearchBottomSheet
        visible={searchSheetVisible}
        onClose={() => setSearchSheetVisible(false)}
        onSearch={handleSearch}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  headerLeft: {
    flex: 1,
  },
  saludo: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  userName: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginTop: 2,
  },
  perfilButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  perfilAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  perfilInicial: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.white,
  },
  perfilCompletionBadge: {
    position: "absolute",
    bottom: -6,
    left: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  perfilCompletionText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  searchIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: FONTS.md,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  searchBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xs,
  },
  quickActionItem: {
    alignItems: "center",
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  quickActionLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray600,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  verTodosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verTodosText: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  verTodosTextSecondary: {
    fontSize: FONTS.sm,
    color: COLORS.secondary,
    fontWeight: "600",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray400,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  emptyAction: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  emptyActionText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: FONTS.sm,
  },
  cardsContainer: {
    gap: SPACING.sm,
  },
  viajeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  viajeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  viajeDateBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 64,
  },
  viajeDateDay: {
    fontSize: FONTS.xs,
    fontWeight: "bold",
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  viajeDateTime: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  viajeRoute: {
    flex: 1,
  },
  viajePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  viajePointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  viajePointText: {
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    flex: 1,
  },
  viajeRouteDots: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.gray300,
    marginLeft: 3,
    marginVertical: 2,
  },
  viajeCardDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.sm,
  },
  viajeCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viajeConductor: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
  },
  viajeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  viajeAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  viajeAvatarText: {
    fontSize: FONTS.xs,
    fontWeight: "bold",
    color: COLORS.white,
  },
  viajeConductorName: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    flex: 1,
  },
  viajePriceBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  viajePriceText: {
    fontSize: FONTS.sm,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalListContent: {
    paddingRight: SPACING.lg,
  },
  discoverHeader: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  discoverTitle: {
    fontSize: FONTS.xxl,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  discoverSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: 4,
  },
  // ---- Hero card ("Lo inminente") ----
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  heroCardEvento: {
    backgroundColor: COLORS.secondary,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  heroBadgeEvento: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  heroBadgeText: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    fontWeight: "700",
  },
  heroBadgeSecondary: {
    fontSize: FONTS.xs,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  heroLabel: {
    fontSize: FONTS.xs,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heroEventoTitle: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  heroRoute: {
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  heroRoutePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  heroDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  heroRouteLine: {
    width: 2,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginLeft: 3.5,
  },
  heroRouteText: {
    fontSize: FONTS.md,
    color: COLORS.white,
    fontWeight: "600",
    flex: 1,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroPersonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  heroAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  heroAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarText: {
    fontSize: FONTS.sm,
    fontWeight: "bold",
    color: COLORS.white,
  },
  heroPersonLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroPersonName: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    fontWeight: "700",
  },
  heroChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  heroChatBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  heroTripReadyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: "flex-start",
  },
  heroTripReadyText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.white,
  },
  heroCtaRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  heroCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    flex: 1,
  },
  heroCtaBtnOutline: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  heroCtaBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  heroCtaBtnTextOutline: {
    color: COLORS.white,
  },
  // ---- Carrusel "Lo pendiente" / "Descubre" ----
  pendienteCard: {
    width: CARD_WIDTH * 0.72,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.small,
  },
  pendienteImage: {
    width: "100%",
    height: 100,
  },
  pendienteImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  pendienteBody: {
    padding: SPACING.md,
    gap: 4,
  },
  pendienteTitle: {
    fontSize: FONTS.sm,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  pendienteCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  pendienteCompany: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
  },
  pendienteReadyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.xs,
  },
  pendienteReadyText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.success,
  },
  pendienteCtaRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  pendienteCtaBtn: {
    flex: 1,
    backgroundColor: COLORS.secondarySoft,
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    alignItems: "center",
  },
  pendienteCtaBtnAlt: {
    backgroundColor: COLORS.primary,
  },
  pendienteCtaText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  pendienteCtaTextAlt: {
    color: COLORS.white,
  },
  // ---- Carrusel "Viajes populares" ----
  popularCard: {
    width: CARD_WIDTH * 0.72,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  popularHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  popularDateBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  popularDateText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  popularTimeText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  popularPriceBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  popularPriceText: {
    fontSize: FONTS.xs,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  popularRoute: {
    gap: 4,
    marginBottom: SPACING.sm,
  },
  popularRoutePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  popularDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  popularRouteText: {
    fontSize: FONTS.sm,
    color: COLORS.gray700,
    flex: 1,
  },
  popularFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: SPACING.xs,
  },
  popularFooterText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "600",
  },
});

export default HomeScreen;
