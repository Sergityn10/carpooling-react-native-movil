// YouConnext - Event Detail Screen (Pro UI/UX Redesign)
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  RefreshControl,
  StatusBar,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  Image,
  TextInput,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  ChevronUp,
  UserPlus,
  Users,
  MapPin,
  Calendar,
  ChevronDown,
  MessageCircle,
  Navigation as NavIcon,
  Search,
  SlidersHorizontal,
  X,
  LocateFixed,
  Car,
  CheckCircle2,
  Sparkles,
} from "lucide-react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { eventService } from "../services/eventService";
import { trayectoService } from "../services/travels/trayectoService";
import { usuarioService } from "../services/usuarioService";
import { reverseGeocode } from "../services/googlePlaces";
import { parseTripDate } from "../services/dateUtils";
import { useUser } from "../context/UserContext";
import {
  EventHeroImage,
  EventInfoSection,
  EventCodeCard,
  EventDescription,
  EventLinks,
  EventTripsSection,
  EventAllTripsModal,
} from "../components";
import { messageService } from "../services/messages/messageService";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.34);
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.9);

const EventDetailScreen = ({ route, navigation }) => {
  const { eventId: paramEventId, id: paramId, event: passedEvent } =
    route.params || {};
  const eventId = paramEventId || paramId || passedEvent?.id;
  const [event, setEvent] = useState(passedEvent || null);
  const [loading, setLoading] = useState(!passedEvent && Boolean(eventId));
  const [error, setError] = useState(null);
  const [trayectosIda, setTrayectosIda] = useState([]);
  const [trayectosVuelta, setTrayectosVuelta] = useState([]);
  const [loadingTrayectos, setLoadingTrayectos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [activeTripTab, setActiveTripTab] = useState("ida");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAllTripsModal, setShowAllTripsModal] = useState(false);
  const [allTripsModalTab, setAllTripsModalTab] = useState("ida");
  const [nearbyTrips, setNearbyTrips] = useState(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const mapRef = useRef(null);
  const [eventAddress, setEventAddress] = useState(null);

  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const currentHeightRef = useRef(COLLAPSED_HEIGHT);
  const isExpandedRef = useRef(false);

  const { lat, lng, isValid: hasValidCoords } = React.useMemo(() => {
    if (!event) return { lat: NaN, lng: NaN, isValid: false };
    const rawLat =
      event.latitude ??
      event.lat ??
      event.latitud ??
      event.location?.latitude ??
      event.coords?.latitude;
    const rawLng =
      event.longitude ??
      event.lng ??
      event.longitud ??
      event.location?.longitude ??
      event.coords?.longitude;
    const parsedLat = typeof rawLat === "number" ? rawLat : parseFloat(rawLat);
    const parsedLng = typeof rawLng === "number" ? rawLng : parseFloat(rawLng);
    const isValid =
      !isNaN(parsedLat) &&
      !isNaN(parsedLng) &&
      (parsedLat !== 0 || parsedLng !== 0);
    return { lat: parsedLat, lng: parsedLng, isValid };
  }, [event]);

  // Geocodificación inversa para obtener la dirección exacta
  useEffect(() => {
    if (hasValidCoords) {
      reverseGeocode({ latitude: lat, longitude: lng })
        .then((place) => {
          setEventAddress(place?.address || null);
        })
        .catch(() => {
          setEventAddress(null);
        });
    }
  }, [lat, lng, hasValidCoords]);

  // Auto-centrar el mapa al cargar o actualizar coordenadas
  useEffect(() => {
    if (hasValidCoords && mapRef.current) {
      const timeout = setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          600,
        );
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [lat, lng, hasValidCoords]);

  const recenterMap = () => {
    if (mapRef.current && hasValidCoords) {
      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        400,
      );
    }
  };

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await eventService.getEventById(eventId);
      const eventData = res.event !== undefined ? res.event : res;
      if (!eventData) {
        setError("Evento no encontrado.");
      } else {
        setEvent(eventData);
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar el evento.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchTrayectos = useCallback(async () => {
    if (!eventId) return;
    setLoadingTrayectos(true);
    try {
      const [resIda, resVuelta] = await Promise.all([
        trayectoService.obtenerTrayectosPorEvento(eventId, "ida"),
        trayectoService.obtenerTrayectosPorEvento(eventId, "vuelta"),
      ]);

      const dataIda =
        resIda.trayectos ||
        resIda.data ||
        (Array.isArray(resIda) ? resIda : []);
      const dataVuelta =
        resVuelta.trayectos ||
        resVuelta.data ||
        (Array.isArray(resVuelta) ? resVuelta : []);
      let idaList = Array.isArray(dataIda) ? dataIda : [];
      let vueltaList = Array.isArray(dataVuelta) ? dataVuelta : [];

      const conductorIds = [
        ...new Set(
          [...idaList, ...vueltaList]
            .map((t) => t.conductor_id || t.conductor)
            .filter(Boolean),
        ),
      ];

      if (conductorIds.length > 0) {
        try {
          const batchRes =
            await usuarioService.getUsersPublicBatch(conductorIds);
          const usersMap = {};
          const usersList = Array.isArray(batchRes?.users)
            ? batchRes.users
            : Array.isArray(batchRes?.data)
              ? batchRes.data
              : Array.isArray(batchRes)
                ? batchRes
                : [];
          usersList.forEach((u) => {
            if (u && u.id) {
              usersMap[u.id] = u;
            }
          });
          const enrichTrayectos = (list) =>
            list.map((t) => {
              const conductorId = t.conductor_id || t.conductor;
              const conductorInfo = usersMap[conductorId];
              if (conductorInfo) {
                return {
                  ...t,
                  conductor: `${conductorInfo.name || "Conductor"}${conductorInfo.surname ? " " + conductorInfo.surname : ""}`,
                  conductor_img: conductorInfo.img_perfil,
                };
              }
              return t;
            });
          idaList = enrichTrayectos(idaList);
          vueltaList = enrichTrayectos(vueltaList);
        } catch (err) {
          console.warn("Error al obtener info de conductores:", err.message);
        }
      }

      setTrayectosIda(idaList);
      setTrayectosVuelta(vueltaList);
    } catch (err) {
      console.warn("Error al cargar trayectos del evento:", err.message);
      setTrayectosIda([]);
      setTrayectosVuelta([]);
    } finally {
      setLoadingTrayectos(false);
    }
  }, [eventId]);

  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;
    setLoadingParticipants(true);
    try {
      const res = await eventService.getParticipants(eventId);
      const list = res.participants || res.data || [];
      setParticipants(Array.isArray(list) ? list : []);
      const myId = String(user?.id || user?.userId || user?.user_id || "");
      setIsJoined(list.some((p) => String(p.id) === myId));
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    if (!passedEvent && eventId) {
      fetchEvent();
    }
  }, [fetchEvent, passedEvent, eventId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (eventId) {
        fetchTrayectos();
        fetchParticipants();
      }
    });
    return unsubscribe;
  }, [navigation, eventId, fetchTrayectos, fetchParticipants]);

  const handleJoin = async () => {
    if (!eventId || joining) return;
    setJoining(true);
    try {
      await eventService.joinEvent(eventId);
      setIsJoined(true);
      fetchParticipants();
    } catch (err) {
      if (err.message?.includes("409")) {
        setIsJoined(true);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleOpenChat = async () => {
    if (!eventId) return;
    try {
      let chat = null;
      try {
        const res = await messageService.obtenerChatPorTripId(eventId, "EVENT");
        chat = res.data || res;
      } catch {
        const created = await messageService.crearChatGrupal({
          trip_id: eventId,
          chat_type: "EVENT",
          name: event?.name || event?.nombre || "Chat del evento",
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
      console.log("Error al abrir chat del evento:", e);
      Alert.alert("Error", "No se pudo abrir el chat del evento.");
    }
  };

  const handleLeave = () => {
    if (!eventId || joining) return;
    Alert.alert("Salir del evento", "¿Seguro que quieres salir del evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          setJoining(true);
          try {
            await eventService.leaveEvent(eventId);
            setIsJoined(false);
            fetchParticipants();
          } catch {
          } finally {
            setJoining(false);
          }
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchEvent(), fetchTrayectos(), fetchParticipants()]);
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `¡Mira este evento en YouConnext! ${event.name} ${event.unique_code ? `- Código: ${event.unique_code}` : ""}`,
      });
    } catch {}
  };

  const handleCopyCode = () => {
    if (!event?.unique_code) return;
    Share.share({ message: event.unique_code });
  };

  const handleOpenUrl = (url) => {
    if (url) Linking.openURL(url);
  };

  const handleCrearViaje = () => {
    setShowAllTripsModal(false);
    navigation.navigate("CrearViaje", { evento: event });
  };

  const handleBuscarViaje = async (direction = "ida") => {
    setShowAllTripsModal(false);
    if (!hasValidCoords) {
      Alert.alert(
        "Ubicación no disponible",
        "Este evento no tiene coordenadas válidas.",
      );
      return;
    }

    let eventPlace = {
      name: event.name || "Ubicación del evento",
      address: eventAddress || event.name || `${lat}, ${lng}`,
      latitude: lat,
      longitude: lng,
    };

    let originPlace = null;
    let originText = "";

    if (direction === "ida") {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          originPlace = await reverseGeocode({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          originText = originPlace?.address || "";
        }
      } catch {}
    }

    const searchParams = { openSheet: true };

    if (direction === "ida") {
      searchParams.destination = eventPlace.address;
      searchParams.destPlace = eventPlace;
      if (originPlace) {
        searchParams.origin = originText;
        searchParams.originPlace = originPlace;
      }
    } else {
      searchParams.origin = eventPlace.address;
      searchParams.originPlace = eventPlace;
    }

    navigation.navigate("SearchTrayectos", { searchParams });
  };

  const handleViajePress = (viaje) => {
    setShowAllTripsModal(false);
    navigation.navigate("ViajeDetalle", { viaje });
  };

  const handleBuscarCerca = async () => {
    if (!eventId) return;
    setLoadingNearby(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso de ubicación",
          "Necesitamos acceso a tu ubicación para encontrar trayectos que pasen cerca de ti.",
        );
        setLoadingNearby(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const res = await trayectoService.buscarTrayectosPorEventoCerca(eventId, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        direccion: activeTripTab,
        radius: 5,
      });

      const trips = res.trayectos || res.data || (Array.isArray(res) ? res : []);
      const tripsList = Array.isArray(trips) ? trips : [];
      setNearbyTrips(tripsList);
      setIsNearbyActive(true);
    } catch (e) {
      console.warn("Error al buscar viajes cercanos:", e);
      Alert.alert("Aviso", "No se encontraron trayectos cerca de tu ubicación actual.");
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleResetFiltros = () => {
    setIsNearbyActive(false);
    setNearbyTrips(null);
  };

  const handleVerTodosViajes = (tab = "ida") => {
    setAllTripsModalTab(tab);
    setShowAllTripsModal(true);
  };

  const animateSheet = (toHeight) => {
    Animated.spring(sheetHeight, {
      toValue: toHeight,
      useNativeDriver: false,
      tension: 50,
      friction: 12,
    }).start();
    currentHeightRef.current = toHeight;
    isExpandedRef.current = toHeight === EXPANDED_HEIGHT;
    setIsExpanded(toHeight === EXPANDED_HEIGHT);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const baseHeight = currentHeightRef.current;
        const newHeight = Math.max(
          COLLAPSED_HEIGHT,
          Math.min(EXPANDED_HEIGHT, baseHeight - gestureState.dy),
        );
        sheetHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) < 5) {
          animateSheet(
            isExpandedRef.current ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT,
          );
        } else {
          const baseHeight = currentHeightRef.current;
          const finalHeight = baseHeight - gestureState.dy;
          if (finalHeight > (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2) {
            animateSheet(EXPANDED_HEIGHT);
          } else {
            animateSheet(COLLAPSED_HEIGHT);
          }
        }
      },
    }),
  ).current;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.simpleHeader}>
          <TouchableOpacity
            style={styles.simpleBackBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>Evento</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando información del evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.simpleHeader}>
          <TouchableOpacity
            style={styles.simpleBackBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>Evento</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {error || "No se pudo cargar el evento."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvent}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mapRegion = hasValidCoords
    ? {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }
    : {
        latitude: 40.4168,
        longitude: -3.7038,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  const displayTripsIda =
    isNearbyActive && activeTripTab === "ida" && nearbyTrips
      ? nearbyTrips
      : trayectosIda;
  const displayTripsVuelta =
    isNearbyActive && activeTripTab === "vuelta" && nearbyTrips
      ? nearbyTrips
      : trayectosVuelta;

  const activeTrips =
    activeTripTab === "ida" ? displayTripsIda : displayTripsVuelta;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Mapa interactivo de fondo */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation
      >
        {hasValidCoords && (
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            title={event.name}
            description={eventAddress || undefined}
            zIndex={100}
          >
            <View style={styles.eventMarkerOuter}>
              <View style={styles.eventMarkerInner}>
                <MapPin size={22} color={COLORS.white} strokeWidth={2.5} />
              </View>
            </View>
          </Marker>
        )}

        {/* Conductores disponibles en el mapa */}
        {activeTrips.map((viaje, index) => {
          const tripLat =
            activeTripTab === "ida" ? viaje.origen_lat : viaje.destino_lat;
          const tripLng =
            activeTripTab === "ida" ? viaje.origen_lng : viaje.destino_lng;
          if (
            tripLat == null ||
            tripLng == null ||
            isNaN(parseFloat(tripLat)) ||
            isNaN(parseFloat(tripLng))
          )
            return null;

          const parsedTripLat = parseFloat(tripLat);
          const parsedTripLng = parseFloat(tripLng);
          if (
            parsedTripLat < -90 ||
            parsedTripLat > 90 ||
            parsedTripLng < -180 ||
            parsedTripLng > 180 ||
            (parsedTripLat === 0 && parsedTripLng === 0)
          )
            return null;

          const conductorNombre =
            typeof viaje.conductor === "string" ? viaje.conductor : "Conductor";

          return (
            <Marker
              key={viaje.id || index}
              coordinate={{
                latitude: parsedTripLat,
                longitude: parsedTripLng,
              }}
              title={conductorNombre}
              description={viaje.origen || viaje.destino || ""}
              zIndex={50}
            >
              {viaje.conductor_img ? (
                <Image
                  source={{ uri: viaje.conductor_img }}
                  style={styles.driverMarkerAvatar}
                />
              ) : (
                <View style={styles.driverMarkerFallback}>
                  <Text style={styles.driverMarkerInitial}>
                    {(conductorNombre || "C").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Marker>
          );
        })}
      </MapView>

      {/* Botón flotante para recentrar mapa */}
      {hasValidCoords && (
        <TouchableOpacity
          style={[styles.recenterBtn, { top: insets.top + 70 }]}
          onPress={recenterMap}
          activeOpacity={0.85}
        >
          <LocateFixed size={20} color={COLORS.primaryDark} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Cabecera superior flotante con Glassmorphism */}
      <View
        style={[styles.floatingHeader, { paddingTop: insets.top + SPACING.xs }]}
      >
        <TouchableOpacity
          style={styles.headerGlassBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ChevronLeft size={22} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {event.name}
        </Text>

        <TouchableOpacity
          style={styles.headerGlassBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Share2 size={20} color={COLORS.white} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet deslizable */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
        {/* Barra de cabecera / Peek Bar interactiva */}
        <View style={styles.sheetHeader} {...panResponder.panHandlers}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.peekContent}>
            <View style={styles.peekTopRow}>
              <View style={styles.peekBadgeGroup}>
                {isJoined && (
                  <View style={styles.joinedPill}>
                    <CheckCircle2 size={11} color={COLORS.white} strokeWidth={2.5} />
                    <Text style={styles.joinedPillText}>Te has unido</Text>
                  </View>
                )}
                {event.company?.name ? (
                  <Text style={styles.peekCompany} numberOfLines={1}>
                    {event.company.name}
                  </Text>
                ) : null}
              </View>

              <View style={styles.peekSwipeHint}>
                <ChevronUp
                  size={14}
                  color={COLORS.gray400}
                  strokeWidth={2.5}
                  style={{
                    transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                  }}
                />
                <Text style={styles.peekSwipeText}>
                  {isExpanded ? "Deslizar para ver mapa" : "Deslizar para más"}
                </Text>
              </View>
            </View>

            <Text style={styles.peekEventName} numberOfLines={1}>
              {event.name}
            </Text>

            {event.start_date ? (
              <View style={styles.peekDateRow}>
                <Calendar size={13} color={COLORS.primary} strokeWidth={2.4} />
                <Text style={styles.peekDate} numberOfLines={1}>
                  {new Date(event.start_date).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Contenido expandido del evento */}
        <ScrollView
          style={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
          contentContainerStyle={{
            paddingBottom: SPACING.xxl + insets.bottom + 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Imagen Hero */}
          <EventHeroImage image={event.image} />

          {/* Información principal */}
          <EventInfoSection
            name={event.name}
            company={event.company}
            tags={event.tags}
            startDate={event.start_date}
            endDate={event.end_date}
            address={eventAddress}
          />

          {/* Código del evento */}
          <EventCodeCard code={event.unique_code} onCopy={handleCopyCode} />

          {/* Tarjeta de Participación y Comunidad */}
          <View style={styles.participationCard}>
            {isJoined ? (
              <View style={styles.joinedContainer}>
                <View style={styles.joinedHeaderRow}>
                  <View style={styles.joinedStatusBadge}>
                    <CheckCircle2
                      size={14}
                      color={COLORS.primaryDark}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.joinedStatusText}>
                      Participando en este evento
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleLeave}
                    disabled={joining}
                    activeOpacity={0.7}
                  >
                    {joining ? (
                      <ActivityIndicator size={14} color={COLORS.error} />
                    ) : (
                      <Text style={styles.leaveText}>Salir</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Botón para ver lista de participantes y de dónde son */}
                <TouchableOpacity
                  style={styles.viewParticipantsBtn}
                  onPress={() =>
                    navigation.navigate("EventParticipants", {
                      eventId,
                      event,
                      eventName: event?.name || event?.title,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.viewParticipantsLeft}>
                    {participants.length > 0 ? (
                      <View style={styles.avatarStack}>
                        {participants.slice(0, 3).map((p, idx) => (
                          <View
                            key={p.id || idx}
                            style={[
                              styles.stackAvatarWrap,
                              { marginLeft: idx === 0 ? 0 : -8, zIndex: 3 - idx },
                            ]}
                          >
                            {p.img_perfil ? (
                              <Image
                                source={{ uri: p.img_perfil }}
                                style={styles.stackAvatarImg}
                              />
                            ) : (
                              <View style={styles.stackAvatarFallback}>
                                <Text style={styles.stackAvatarText}>
                                  {(p.name || "U").charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Users size={18} color={COLORS.primary} strokeWidth={2.2} />
                    )}
                    <View style={styles.viewParticipantsTexts}>
                      <Text style={styles.viewParticipantsTitle}>
                        {participants.length}{" "}
                        {participants.length === 1
                          ? "asistente registrado"
                          : "asistentes registrados"}
                      </Text>
                      <Text style={styles.viewParticipantsSub}>
                        Ver de dónde son y chatear
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={COLORS.gray400} strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Botón directo al chat grupal del evento */}
                <TouchableOpacity
                  style={styles.chatEventBtn}
                  onPress={handleOpenChat}
                  activeOpacity={0.88}
                >
                  <MessageCircle
                    size={18}
                    color={COLORS.white}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.chatEventBtnText}>
                    Abrir chat grupal del evento
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.notJoinedContainer}>
                <TouchableOpacity
                  style={styles.notJoinedInfo}
                  onPress={() =>
                    navigation.navigate("EventParticipants", {
                      eventId,
                      event,
                      eventName: event?.name || event?.title,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.notJoinedIconWrap}>
                    <Users size={18} color={COLORS.primary} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notJoinedTitle}>¿Asistirás a este evento?</Text>
                    <Text style={styles.notJoinedSubtitle}>
                      {participants.length}{" "}
                      {participants.length === 1
                        ? "persona se ha unido · Ver asistentes"
                        : "personas se han unido · Ver asistentes"}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.gray400} strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.joinBtn,
                    joining && styles.joinBtnDisabled,
                  ]}
                  onPress={handleJoin}
                  disabled={joining}
                  activeOpacity={0.88}
                >
                  {joining ? (
                    <ActivityIndicator size={18} color={COLORS.white} />
                  ) : (
                    <>
                      <UserPlus
                        size={18}
                        color={COLORS.white}
                        strokeWidth={2.5}
                      />
                      <Text style={styles.joinBtnText}>Unirme al evento</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Enlaces y Entradas */}
          <EventLinks
            url={event.url}
            ticketUrl={event.ticket_url}
            onOpenUrl={handleOpenUrl}
          />

          {/* Descripción */}
          <EventDescription description={event.description} />

          {/* Sección de Trayectos Compartidos hacia / desde el Evento */}
          <EventTripsSection
            trayectosIda={displayTripsIda}
            trayectosVuelta={displayTripsVuelta}
            loading={loadingTrayectos}
            onCrearViaje={handleCrearViaje}
            onBuscarViaje={handleBuscarViaje}
            onViajePress={handleViajePress}
            onVerTodos={handleVerTodosViajes}
            onBuscarCerca={handleBuscarCerca}
            onResetFiltros={handleResetFiltros}
            isNearbyActive={isNearbyActive}
            loadingNearby={loadingNearby}
            activeTab={activeTripTab}
            onTabChange={(tab) => {
              setActiveTripTab(tab);
              setIsNearbyActive(false);
              setNearbyTrips(null);
            }}
          />
        </ScrollView>
      </Animated.View>

      {/* Modal / Vista Dedicada para Todos los Trayectos */}
      <EventAllTripsModal
        visible={showAllTripsModal}
        onClose={() => setShowAllTripsModal(false)}
        eventName={event.name}
        trayectosIda={displayTripsIda}
        trayectosVuelta={displayTripsVuelta}
        initialTab={allTripsModalTab}
        loading={loadingTrayectos}
        loadingNearby={loadingNearby}
        isNearbyActive={isNearbyActive}
        onBuscarCerca={handleBuscarCerca}
        onResetFiltroCerca={handleResetFiltros}
        onViajePress={handleViajePress}
        onCrearViaje={handleCrearViaje}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width: "100%",
    height: "100%",
    ...StyleSheet.absoluteFillObject,
  },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  simpleBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  simpleHeaderTitle: {
    fontSize: FONTS.lg,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
    fontWeight: "600",
  },
  errorText: {
    fontSize: FONTS.md,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: FONTS.sm,
  },
  // Map Markers
  eventMarkerOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(13, 159, 110, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventMarkerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  driverMarkerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    backgroundColor: COLORS.gray200,
  },
  driverMarkerFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  driverMarkerInitial: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  recenterBtn: {
    position: "absolute",
    right: SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerGlassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Bottom Sheet
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...SHADOWS.large,
  },
  sheetHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingBottom: SPACING.xs,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
  },
  peekContent: {
    gap: 4,
  },
  peekTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  peekBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  joinedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  joinedPillText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    color: COLORS.white,
  },
  peekCompany: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  peekSwipeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  peekSwipeText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: "600",
  },
  peekEventName: {
    fontSize: FONTS.lg,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  peekDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  peekDate: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },
  sheetScroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // Participación Card
  participationCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.md,
  },
  joinedContainer: {
    gap: SPACING.sm + 2,
  },
  joinedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  joinedStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  joinedStatusText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  leaveText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.error,
  },
  viewParticipantsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  viewParticipantsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: "hidden",
  },
  stackAvatarImg: {
    width: "100%",
    height: "100%",
  },
  stackAvatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stackAvatarText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  viewParticipantsTexts: {
    flex: 1,
  },
  viewParticipantsTitle: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  viewParticipantsSub: {
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.primaryDark,
    fontWeight: "600",
  },
  notJoinedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  chatEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    minHeight: 46,
    ...SHADOWS.small,
  },
  chatEventBtnText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
  notJoinedContainer: {
    gap: SPACING.md,
  },
  notJoinedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  notJoinedTitle: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  notJoinedSubtitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray500,
    marginTop: 2,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minHeight: 48,
    ...SHADOWS.medium,
  },
  joinBtnDisabled: {
    backgroundColor: COLORS.gray300,
  },
  joinBtnText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
});

export default EventDetailScreen;
