// YouConnext - Event Detail Screen
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
} from "lucide-react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { COLORS, SPACING, RADIUS, FONTS } from "../constants";
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
} from "../components";
import { messageService } from "../services/messages/messageService";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.32);
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.9);

const EventDetailScreen = ({ route, navigation }) => {
  const { eventId, event: passedEvent } = route.params || {};
  const [event, setEvent] = useState(passedEvent || null);
  const [loading, setLoading] = useState(!passedEvent);
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
  const [filterMode, setFilterMode] = useState("todos"); // "todos" | "cerca" | "ciudad"
  const [ciudadInput, setCiudadInput] = useState("");
  const [nearbyTrips, setNearbyTrips] = useState(null); // null = no filtrado, [] = filtrado vacío
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const mapRef = useRef(null);
  const [eventAddress, setEventAddress] = useState(null);

  const { user } = useUser();

  const insets = useSafeAreaInsets();
  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const currentHeightRef = useRef(COLLAPSED_HEIGHT);
  const isExpandedRef = useRef(false);

  const lat =
    typeof event?.latitude === "number"
      ? event.latitude
      : parseFloat(event?.latitude);
  const lng =
    typeof event?.longitude === "number"
      ? event.longitude
      : parseFloat(event?.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (hasValidCoords) {
      reverseGeocode({ latitude: lat, longitude: lng })
        .then((place) => {
          console.log("[EventDetail] reverseGeocode result:", place);
          setEventAddress(place?.address || null);
        })
        .catch((err) => {
          console.warn("[EventDetail] reverseGeocode error:", err?.message);
          setEventAddress(null);
        });
    }
  }, [lat, lng, hasValidCoords]);

  const recenterMap = () => {
    if (mapRef.current && hasValidCoords) {
      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        300,
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

      // Obtener info pública de los conductores en batch
      const conductorIds = [
        ...new Set(
          [...idaList, ...vueltaList]
            .map((t) => t.conductor_id || t.conductor_id)
            .filter(Boolean),
        ),
      ];

      if (conductorIds.length > 0) {
        try {
          const batchRes =
            await usuarioService.getUsersPublicBatch(conductorIds);
          const usersMap = {};
          const usersList = batchRes.users || [];
          usersList.forEach((u) => {
            usersMap[u.id] = u;
          });
          const enrichTrayectos = (list) =>
            list.map((t) => {
              const conductorId = t.conductor_id || t.conductor_id;
              const conductorInfo = usersMap[conductorId];
              if (conductorInfo) {
                return {
                  ...t,
                  conductor: `${conductorInfo.name}${conductorInfo.surname ? " " + conductorInfo.surname : ""}`,
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
    } catch (err) {
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
      } catch (err) {
        // Si no existe chat, lo creamos
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
          } catch (err) {
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
        message: `${event.name} - Código: ${event.unique_code}`,
      });
    } catch {}
  };

  const handleCopyCode = () => {
    // Clipboard would require expo-clipboard
    if (!event?.unique_code) return;
    Share.share({ message: event.unique_code });
  };

  const handleOpenUrl = (url) => {
    if (url) Linking.openURL(url);
  };

  const handleCrearViaje = () => {
    navigation.navigate("CrearViaje", { evento: event });
  };

  const handleBuscarCerca = async () => {
    if (!eventId) return;
    setLoadingNearby(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos tu ubicación para buscar viajes cerca.",
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
      const trips = res.trayectos || res.data || [];
      setNearbyTrips(Array.isArray(trips) ? trips : []);
      setFilterMode("cerca");
    } catch (e) {
      Alert.alert("Error", "No se pudieron buscar viajes cercanos.");
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleBuscarCiudad = async () => {
    if (!eventId || !ciudadInput.trim()) return;
    setLoadingNearby(true);
    try {
      const res = await trayectoService.buscarTrayectosPorEventoCerca(eventId, {
        ciudad: ciudadInput.trim(),
        direccion: activeTripTab,
        radius: 5,
      });
      const trips = res.trayectos || res.data || [];
      setNearbyTrips(Array.isArray(trips) ? trips : []);
      setFilterMode("ciudad");
    } catch (e) {
      Alert.alert("Error", "No se pudieron buscar viajes en esa ciudad.");
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleResetFilter = () => {
    setFilterMode("todos");
    setNearbyTrips(null);
    setCiudadInput("");
  };

  const handleBuscarViaje = async (direction = "ida") => {
    const lat =
      typeof event.latitude === "number"
        ? event.latitude
        : parseFloat(event.latitude);
    const lng =
      typeof event.longitude === "number"
        ? event.longitude
        : parseFloat(event.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert(
        "Ubicación no disponible",
        "Este evento no tiene coordenadas válidas.",
      );
      return;
    }

    let eventPlace;
    try {
      eventPlace = await reverseGeocode({ latitude: lat, longitude: lng });
    } catch {
      eventPlace = {
        name: event.name || "Ubicación del evento",
        address: event.name || `${lat}, ${lng}`,
        latitude: lat,
        longitude: lng,
      };
    }

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
          originText = originPlace.address;
        }
      } catch {
        // Si no hay permiso o falla, se deja el origen vacío
      }
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
    navigation.navigate("ViajeDetalle", { viaje });
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
        <StatusBar barStyle="dark-content" />
        <View style={styles.simpleHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>Evento</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.simpleHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>Evento</Text>
          <View style={{ width: 24 }} />
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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 40.4168,
        longitude: -3.7038,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  const activeTrips = activeTripTab === "ida" ? trayectosIda : trayectosVuelta;

  const uniqueDates = [
    ...new Set(
      activeTrips
        .map((t) => {
          const d = parseTripDate(t);
          return d ? d.toDateString() : null;
        })
        .filter(Boolean),
    ),
  ].sort((a, b) => new Date(a) - new Date(b));

  const filteredTrips =
    filterMode !== "todos" && nearbyTrips
      ? nearbyTrips
      : selectedDate
        ? activeTrips.filter((t) => {
            const d = parseTripDate(t);
            return d && d.toDateString() === selectedDate;
          })
        : activeTrips;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

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
            <View style={styles.eventMarker}>
              <MapPin
                size={36}
                color={COLORS.primary}
                strokeWidth={2.5}
                fill={COLORS.white}
              />
            </View>
          </Marker>
        )}

        {/* Driver markers: origin for ida, destination for vuelta */}
        {filteredTrips.map((viaje, index) => {
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

          const conductorNombre =
            typeof viaje.conductor === "string" ? viaje.conductor : `Conductor`;

          return (
            <Marker
              key={viaje.id || index}
              coordinate={{
                latitude: parseFloat(tripLat),
                longitude: parseFloat(tripLng),
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
                    {conductorNombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Marker>
          );
        })}
      </MapView>

      {hasValidCoords && (
        <TouchableOpacity
          style={[styles.recenterBtn, { top: insets.top + 120 }]}
          onPress={recenterMap}
          activeOpacity={0.85}
        >
          <LocateFixed size={22} color={COLORS.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <View
        style={[styles.floatingHeader, { paddingTop: insets.top + SPACING.xs }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Share2 size={22} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Filtros flotantes sobre el mapa */}
      <View style={[styles.mapFilterContainer, { top: insets.top + 52 }]}>
        {/* Segmented control Ida / Vuelta */}
        <View style={styles.mapFilterSegment}>
          <TouchableOpacity
            style={[
              styles.mapFilterSegmentBtn,
              activeTripTab === "ida" && styles.mapFilterSegmentBtnActive,
            ]}
            onPress={() => {
              setActiveTripTab("ida");
              setSelectedDate(null);
            }}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.mapFilterSegmentText,
                activeTripTab === "ida" && styles.mapFilterSegmentTextActive,
              ]}
            >
              Ida
            </Text>
            {trayectosIda.length > 0 && (
              <View
                style={[
                  styles.mapFilterSegmentBadge,
                  activeTripTab === "ida" && styles.mapFilterSegmentBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.mapFilterSegmentBadgeText,
                    activeTripTab === "ida" &&
                      styles.mapFilterSegmentBadgeTextActive,
                  ]}
                >
                  {trayectosIda.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mapFilterSegmentBtn,
              activeTripTab === "vuelta" && styles.mapFilterSegmentBtnActive,
            ]}
            onPress={() => {
              setActiveTripTab("vuelta");
              setSelectedDate(null);
            }}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.mapFilterSegmentText,
                activeTripTab === "vuelta" && styles.mapFilterSegmentTextActive,
              ]}
            >
              Vuelta
            </Text>
            {trayectosVuelta.length > 0 && (
              <View
                style={[
                  styles.mapFilterSegmentBadge,
                  activeTripTab === "vuelta" &&
                    styles.mapFilterSegmentBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.mapFilterSegmentBadgeText,
                    activeTripTab === "vuelta" &&
                      styles.mapFilterSegmentBadgeTextActive,
                  ]}
                >
                  {trayectosVuelta.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filtro de fecha */}
        {uniqueDates.length > 0 && (
          <TouchableOpacity
            style={styles.mapFilterDateBtn}
            onPress={() => setShowDatePicker((v) => !v)}
            activeOpacity={0.85}
          >
            <Calendar size={15} color={COLORS.gray700} strokeWidth={2.5} />
            <Text style={styles.mapFilterDateText} numberOfLines={1}>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                  })
                : "Fecha"}
            </Text>
            {selectedDate && (
              <TouchableOpacity
                onPress={() => setSelectedDate(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.mapFilterDateClear}>✕</Text>
              </TouchableOpacity>
            )}
            <ChevronDown
              size={14}
              color={COLORS.gray500}
              strokeWidth={2.5}
              style={{
                transform: [{ rotate: showDatePicker ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>
        )}

        {/* Dropdown de fechas */}
        {showDatePicker && uniqueDates.length > 0 && (
          <View style={styles.mapFilterDateDropdown}>
            <TouchableOpacity
              style={[
                styles.mapFilterDateOption,
                !selectedDate && styles.mapFilterDateOptionActive,
              ]}
              onPress={() => {
                setSelectedDate(null);
                setShowDatePicker(false);
              }}
            >
              <Text
                style={[
                  styles.mapFilterDateOptionText,
                  !selectedDate && styles.mapFilterDateOptionTextActive,
                ]}
              >
                Todas las fechas
              </Text>
            </TouchableOpacity>
            {uniqueDates.map((dateStr) => {
              const label = new Date(dateStr).toLocaleDateString("es-ES", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              });
              const count = activeTrips.filter((t) => {
                const d = parseTripDate(t);
                return d && d.toDateString() === dateStr;
              }).length;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.mapFilterDateOption,
                    selectedDate === dateStr &&
                      styles.mapFilterDateOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedDate(dateStr);
                    setShowDatePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.mapFilterDateOptionText,
                      selectedDate === dateStr &&
                        styles.mapFilterDateOptionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                  <Text style={styles.mapFilterDateOptionCount}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
        <View style={styles.sheetHeader} {...panResponder.panHandlers}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          <View style={styles.peekContent}>
            <Text style={styles.peekEventName} numberOfLines={1}>
              {event.name}
            </Text>
            {event.company?.name ? (
              <Text style={styles.peekCompany} numberOfLines={1}>
                {event.company.name}
              </Text>
            ) : null}
            {event.start_date ? (
              <Text style={styles.peekDate} numberOfLines={1}>
                {new Date(event.start_date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {event.end_date
                  ? ` - ${new Date(event.end_date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""}
              </Text>
            ) : null}
            <View style={styles.swipeHint}>
              <ChevronUp size={16} color={COLORS.gray400} strokeWidth={2.5} />
              <Text style={styles.swipeHintText}>Desliza hacia arriba</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
          contentContainerStyle={{
            paddingBottom: SPACING.xxl + insets.bottom,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <EventHeroImage image={event.image} />

          <EventInfoSection
            name={event.name}
            company={event.company}
            tags={event.tags}
            startDate={event.start_date}
            endDate={event.end_date}
          />

          <EventCodeCard code={event.unique_code} onCopy={handleCopyCode} />

          {/* Participación */}
          <View style={styles.joinSection}>
            {isJoined ? (
              <View style={styles.joinedRow}>
                <View style={styles.joinedInfo}>
                  <Users size={16} color={COLORS.primary} strokeWidth={2.5} />
                  <Text style={styles.joinedText}>
                    Ya participas · {participants.length}{" "}
                    {participants.length === 1
                      ? "participante"
                      : "participantes"}
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
            ) : (
              <>
                <View style={styles.participantsInfo}>
                  <Users size={16} color={COLORS.gray500} strokeWidth={2.5} />
                  <Text style={styles.participantsText}>
                    {participants.length}{" "}
                    {participants.length === 1
                      ? "participante"
                      : "participantes"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    joining && styles.joinButtonDisabled,
                  ]}
                  onPress={handleJoin}
                  disabled={joining}
                  activeOpacity={0.8}
                >
                  {joining ? (
                    <ActivityIndicator size={18} color={COLORS.white} />
                  ) : (
                    <UserPlus
                      size={18}
                      color={COLORS.white}
                      strokeWidth={2.5}
                    />
                  )}
                  <Text style={styles.joinButtonText}>
                    {joining ? "..." : "Unirse al evento"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Chat del evento — solo si se ha unido */}
          {isJoined && (
            <View style={styles.chatSection}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={handleOpenChat}
                activeOpacity={0.8}
              >
                <MessageCircle
                  size={18}
                  color={COLORS.primary}
                  strokeWidth={2.5}
                />
                <Text style={styles.chatButtonText}>Chat del evento</Text>
              </TouchableOpacity>
            </View>
          )}

          <EventDescription description={event.description} />

          <EventLinks
            url={event.url}
            ticketUrl={event.ticket_url}
            onOpenUrl={handleOpenUrl}
          />

          {/* Botón de filtros */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.8}
            >
              <SlidersHorizontal
                size={16}
                color={COLORS.primary}
                strokeWidth={2.5}
              />
              <Text style={styles.filterBtnText}>Filtrar viajes</Text>
              {filterMode !== "todos" && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {filterMode === "cerca" ? "Cerca" : "Ciudad"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {filterMode !== "todos" && (
              <TouchableOpacity
                style={styles.resetFilterChip}
                onPress={handleResetFilter}
                activeOpacity={0.7}
              >
                <X size={12} color={COLORS.gray500} strokeWidth={2.5} />
                <Text style={styles.resetFilterChipText}>Quitar filtro</Text>
              </TouchableOpacity>
            )}
          </View>

          <EventTripsSection
            trayectosIda={
              activeTripTab === "ida" ? filteredTrips : trayectosIda
            }
            trayectosVuelta={
              activeTripTab === "vuelta" ? filteredTrips : trayectosVuelta
            }
            loading={loadingTrayectos || loadingNearby}
            onCrearViaje={handleCrearViaje}
            onBuscarViaje={handleBuscarViaje}
            onViajePress={handleViajePress}
            activeTab={activeTripTab}
            onTabChange={(tab) => {
              setActiveTripTab(tab);
              setSelectedDate(null);
              handleResetFilter();
            }}
          />
        </ScrollView>
      </Animated.View>

      {/* Modal de filtros */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtrar viajes</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <X size={22} color={COLORS.gray600} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Opción: Cerca de ti */}
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterMode === "cerca" && styles.filterOptionActive,
              ]}
              onPress={() => {
                handleBuscarCerca();
              }}
              disabled={loadingNearby}
              activeOpacity={0.8}
            >
              <View style={styles.filterOptionLeft}>
                <MapPin size={20} color={COLORS.primary} strokeWidth={2.5} />
                <View>
                  <Text style={styles.filterOptionTitle}>Cerca de ti</Text>
                  <Text style={styles.filterOptionDesc}>
                    Usa tu ubicación actual (radio 5 km)
                  </Text>
                </View>
              </View>
              {loadingNearby && filterMode !== "ciudad" ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : filterMode === "cerca" ? (
                <View style={styles.filterOptionCheck} />
              ) : null}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.filterDivider} />

            {/* Opción: Por ciudad */}
            <View
              style={[
                styles.filterOption,
                filterMode === "ciudad" && styles.filterOptionActive,
                { flexDirection: "column", alignItems: "stretch" },
              ]}
            >
              <View style={styles.filterOptionLeft}>
                <Search size={20} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.filterOptionTitle}>Por ciudad</Text>
              </View>
              <View style={styles.cityInputRow}>
                <TextInput
                  style={styles.cityInputModal}
                  placeholder="Escribe una ciudad..."
                  placeholderTextColor={COLORS.gray400}
                  value={ciudadInput}
                  onChangeText={setCiudadInput}
                  onSubmitEditing={() => {
                    handleBuscarCiudad();
                  }}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={[
                    styles.citySearchBtn,
                    !ciudadInput.trim() && styles.citySearchBtnDisabled,
                  ]}
                  onPress={() => {
                    handleBuscarCiudad();
                  }}
                  disabled={!ciudadInput.trim() || loadingNearby}
                  activeOpacity={0.8}
                >
                  {loadingNearby && filterMode !== "cerca" ? (
                    <ActivityIndicator size={16} color={COLORS.white} />
                  ) : (
                    <Search size={16} color={COLORS.white} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Separador */}
            <View style={styles.filterDivider} />

            {/* Opción: Ver todos */}
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterMode === "todos" && styles.filterOptionActive,
              ]}
              onPress={() => {
                handleResetFilter();
                setShowFilterModal(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.filterOptionLeft}>
                <SlidersHorizontal
                  size={20}
                  color={COLORS.gray500}
                  strokeWidth={2.5}
                />
                <Text style={styles.filterOptionTitle}>Ver todos</Text>
              </View>
              {filterMode === "todos" && (
                <View style={styles.filterOptionCheck} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterApplyBtn}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterApplyBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  eventMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  driverMarkerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.gray200,
  },
  driverMarkerFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  driverMarkerInitial: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  mapFilterContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 15,
    elevation: 15,
  },
  mapFilterSegment: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  mapFilterSegmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
  },
  mapFilterSegmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  mapFilterSegmentText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  mapFilterSegmentTextActive: {
    color: COLORS.white,
  },
  mapFilterSegmentBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  mapFilterSegmentBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  mapFilterSegmentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.gray500,
  },
  mapFilterSegmentBadgeTextActive: {
    color: COLORS.white,
  },
  mapFilterDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    minWidth: 120,
    justifyContent: "center",
  },
  mapFilterDateText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  mapFilterDateClear: {
    fontSize: 12,
    color: COLORS.gray400,
    fontWeight: "600",
  },
  mapFilterDateDropdown: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
    minWidth: 200,
    maxWidth: 280,
  },
  mapFilterDateOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  mapFilterDateOptionActive: {
    backgroundColor: COLORS.primarySoft,
  },
  mapFilterDateOptionText: {
    fontSize: FONTS.sm,
    fontWeight: "500",
    color: COLORS.gray600,
    textTransform: "capitalize",
  },
  mapFilterDateOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  mapFilterDateOptionCount: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray400,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  recenterBtn: {
    position: "absolute",
    right: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    zIndex: 30,
    elevation: 30,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.sm,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 20,
  },
  sheetHeader: {
    paddingBottom: SPACING.sm,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
  },
  peekContent: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  peekEventName: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  peekCompany: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  peekDate: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.xs,
  },
  swipeHintText: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
  },
  sheetScroll: {
    flex: 1,
  },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  simpleHeaderTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.sm,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
  },
  errorText: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sm,
  },
  joinSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  chatSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
  },
  chatButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: FONTS.md,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.primary,
  },
  filterBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  resetFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  resetFilterChipText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  filterModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  filterModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  filterModalTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray50,
    marginBottom: SPACING.xs,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primarySoft,
  },
  filterOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  filterOptionTitle: {
    fontSize: FONTS.md,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  filterOptionDesc: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  filterOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  filterDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.xs,
  },
  cityInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cityInputModal: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray800,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  citySearchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  citySearchBtnDisabled: {
    opacity: 0.5,
  },
  filterApplyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  filterApplyBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: FONTS.md,
  },
  participantsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  participantsText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  joinedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  joinedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  joinedText: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  leaveText: {
    fontSize: FONTS.sm,
    color: COLORS.error,
    fontWeight: "600",
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: FONTS.md,
  },
});

export default EventDetailScreen;
