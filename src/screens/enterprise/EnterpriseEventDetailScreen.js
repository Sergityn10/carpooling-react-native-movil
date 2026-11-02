// YouConnext - EnterpriseEventDetailScreen (Detalle y Control Operativo del Evento con Datos Reales)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Car,
  QrCode,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Share2,
  Navigation,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../../components/common/PressableScale";
import { enterpriseService } from "../../services/enterpriseService";
import { eventService } from "../../services/eventService";
import { trayectoService } from "../../services/travels/trayectoService";
import { enrichTripsWithDriverProfiles } from "../../utils";
import { ViajeCard } from "../../components";

const formatEventDateRange = (startDate, endDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;

  const optsDate = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  const optsTime = { hour: "2-digit", minute: "2-digit" };

  const startStr = start.toLocaleDateString("es-ES", optsDate);
  const startTime = start.toLocaleTimeString("es-ES", optsTime);

  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      const startDay = start.toDateString();
      const endDay = end.toDateString();
      if (startDay === endDay) {
        const endTime = end.toLocaleTimeString("es-ES", optsTime);
        return `${startStr} · ${startTime} - ${endTime}`;
      } else {
        const endStr = end.toLocaleDateString("es-ES", optsDate);
        return `${startStr} - ${endStr}`;
      }
    }
  }

  return `${startStr} · ${startTime}`;
};

const getEventStatusBadge = (startDate, endDate) => {
  if (!startDate) return null;
  const now = new Date();
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;

  const end = endDate ? new Date(endDate) : null;

  if (end && !isNaN(end.getTime()) && now > end) {
    return {
      label: "Finalizado",
      color: COLORS.gray600,
      bg: COLORS.gray100,
    };
  }

  if (now >= start && (!end || isNaN(end.getTime()) || now <= end)) {
    return {
      label: "En curso",
      color: "#10B981",
      bg: "#10B98118",
    };
  }

  const diffMs = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      label: "Hoy",
      color: COLORS.primaryDark,
      bg: `${COLORS.primary}20`,
    };
  }
  if (diffDays === 1) {
    return {
      label: "Mañana",
      color: COLORS.primaryDark,
      bg: `${COLORS.primary}20`,
    };
  }
  if (diffDays <= 30) {
    return {
      label: `En ${diffDays} días`,
      color: "#0284C7",
      bg: "#0284C715",
    };
  }

  return {
    label: "Próximamente",
    color: "#6366F1",
    bg: "#6366F115",
  };
};

const EnterpriseEventDetailScreen = ({ navigation, route }) => {
  const initialEvent = route?.params?.event || {};
  const eventId = route?.params?.eventId || initialEvent.id;

  const [event, setEvent] = useState(initialEvent);
  const [participants, setParticipants] = useState([]);
  const [trayectosIda, setTrayectosIda] = useState([]);
  const [trayectosVuelta, setTrayectosVuelta] = useState([]);
  const [checkedInList, setCheckedInList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTripTab, setActiveTripTab] = useState("ida");

  const targetId = eventId || event?.id;

  // Cargar datos coordinados desde la API de Eventos y la API de Trayectos
  const loadAllData = useCallback(async () => {
    if (!targetId) return;

    try {
      const checkinKey = `@youconnext_enterprise_checkins_${targetId}`;
      const [eventRes, participantsRes, idaRes, vueltaRes, checkinsRaw] =
        await Promise.allSettled([
          // 1. Obtener detalles del evento (API de eventos / fallback enterprise)
          (async () => {
            try {
              const res = await eventService.getEventById(targetId);
              if (res?.event) return res.event;
              if (res?.id) return res;
            } catch (e) {}
            try {
              const entEv = await enterpriseService.getEnterpriseEventById(targetId);
              if (entEv) return entEv;
            } catch (e) {}
            const events = await enterpriseService.getEnterpriseEvents();
            return events.find((e) => String(e.id) === String(targetId)) || null;
          })(),

          // 2. Obtener lista detallada de participantes (API de eventos / detalles)
          eventService.getParticipantsDetails(targetId),

          // 3. Obtener trayectos de ida (API de trayectos / travels)
          trayectoService.obtenerTrayectosPorEvento(targetId, "ida"),

          // 4. Obtener trayectos de vuelta (API de trayectos / travels)
          trayectoService.obtenerTrayectosPorEvento(targetId, "vuelta"),

          // 5. Obtener lista de acreditados locales
          AsyncStorage.getItem(checkinKey),
        ]);

      // Procesar Evento
      if (eventRes.status === "fulfilled" && eventRes.value) {
        setEvent((prev) => ({ ...prev, ...eventRes.value }));
      }

      // Procesar Participantes
      if (participantsRes.status === "fulfilled" && participantsRes.value) {
        const list =
          participantsRes.value?.participants ||
          participantsRes.value?.data ||
          (Array.isArray(participantsRes.value) ? participantsRes.value : []);
        setParticipants(list);
      }

      // Procesar Trayectos Ida
      let rawIda = [];
      if (idaRes.status === "fulfilled" && idaRes.value) {
        const val = idaRes.value;
        rawIda = val?.trayectos || val?.data || (Array.isArray(val) ? val : []);
      }

      // Procesar Trayectos Vuelta
      let rawVuelta = [];
      if (vueltaRes.status === "fulfilled" && vueltaRes.value) {
        const val = vueltaRes.value;
        rawVuelta = val?.trayectos || val?.data || (Array.isArray(val) ? val : []);
      }

      setTrayectosIda(rawIda);
      setTrayectosVuelta(rawVuelta);

      // Enriquecer con perfiles de conductor
      const allTrips = [...rawIda, ...rawVuelta];
      if (allTrips.length > 0) {
        enrichTripsWithDriverProfiles(allTrips)
          .then((enriched) => {
            if (Array.isArray(enriched) && enriched.length > 0) {
              const idaMap = {};
              enriched.slice(0, rawIda.length).forEach((t) => {
                if (t?.id) idaMap[t.id] = t;
              });
              setTrayectosIda((prev) => prev.map((t) => idaMap[t.id] || t));

              const vueltaMap = {};
              enriched.slice(rawIda.length).forEach((t) => {
                if (t?.id) vueltaMap[t.id] = t;
              });
              setTrayectosVuelta((prev) => prev.map((t) => vueltaMap[t.id] || t));
            }
          })
          .catch(() => {});
      }

      // Procesar Acreditaciones
      if (checkinsRaw.status === "fulfilled" && checkinsRaw.value) {
        try {
          const parsed = JSON.parse(checkinsRaw.value);
          setCheckedInList(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setCheckedInList([]);
        }
      }
    } catch (err) {
      console.warn("[EnterpriseEventDetailScreen] Error cargando datos:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadAllData();
    });
    return unsubscribe;
  }, [navigation, loadAllData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [loadAllData]);

  // Cómputo de métricas en tiempo real con datos de ambas APIs
  const mobilityMetrics = useMemo(() => {
    const allTrips = [...trayectosIda, ...trayectosVuelta];
    const totalTrayectos = allTrips.length;

    let totalPasajeros = 0;
    let plazasLibres = 0;
    let plazasTotales = 0;

    allTrips.forEach((t) => {
      const plazas =
        typeof t.plazas === "number" ? t.plazas : parseInt(t.plazas, 10) || 0;
      const disponible =
        typeof t.disponible === "number"
          ? t.disponible
          : parseInt(t.disponible, 10) || 0;

      const occupied = Math.max(0, plazas - disponible);
      totalPasajeros += occupied;
      plazasLibres += Math.max(0, disponible);
      plazasTotales += plazas;
    });

    const totalInscritos =
      participants.length > 0
        ? participants.length
        : event.total_participants ??
          event.participants_count ??
          event.inscribed_count ??
          event._count?.participants ??
          (Number(event.registered_attendees) || 0);

    const checkedInCount =
      Number(event.checked_in_count) ||
      participants.filter(
        (p) =>
          checkedInList.includes(String(p.id)) ||
          checkedInList.includes(String(p.user_id)) ||
          checkedInList.includes(String(p.unique_code)) ||
          Boolean(p.checkedIn)
      ).length;

    const checkInPct =
      totalInscritos > 0 ? Math.round((checkedInCount / totalInscritos) * 100) : 0;

    return {
      totalTrayectos,
      trayectosIdaCount: trayectosIda.length,
      trayectosVueltaCount: trayectosVuelta.length,
      totalPasajeros,
      plazasLibres,
      plazasTotales,
      totalInscritos,
      checkedInCount,
      checkInPct,
    };
  }, [trayectosIda, trayectosVuelta, participants, event, checkedInList]);

  const { lat, lng, hasCoords } = useMemo(() => {
    const rawLat = event.latitude ?? event.lat ?? event.location?.latitude;
    const rawLng = event.longitude ?? event.lng ?? event.location?.longitude;
    const parsedLat = typeof rawLat === "number" ? rawLat : parseFloat(rawLat);
    const parsedLng = typeof rawLng === "number" ? rawLng : parseFloat(rawLng);
    const valid =
      !isNaN(parsedLat) &&
      !isNaN(parsedLng) &&
      (parsedLat !== 0 || parsedLng !== 0);
    return { lat: parsedLat, lng: parsedLng, hasCoords: valid };
  }, [event]);

  const dateLabel = useMemo(
    () => formatEventDateRange(event.start_date, event.end_date) || "Fecha por definir",
    [event.start_date, event.end_date]
  );

  const statusBadge = useMemo(
    () => getEventStatusBadge(event.start_date, event.end_date),
    [event.start_date, event.end_date]
  );

  const handleOpenGps = () => {
    if (!hasCoords) return;
    const label = encodeURIComponent(event.name || event.title || "Evento Corporativo");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Te invito al evento corporativo "${event.name || event.title}". Código de acceso: ${event.unique_code || "OFICIAL"}. Descarga YouConnext para coordinar tu viaje en coche compartido.`,
      });
    } catch (e) {}
  };

  const activeTrips = activeTripTab === "ida" ? trayectosIda : trayectosVuelta;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={BRAND.black} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle del Evento
        </Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareBtn}
          accessibilityLabel="Compartir evento"
        >
          <Share2 size={18} color={COLORS.gray700} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Banner */}
        {event.image ? (
          <Image
            source={{ uri: event.image }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.body}>
          {/* Título y Estado */}
          <View style={styles.titleTopRow}>
            <Text style={styles.title}>{event.name || event.title}</Text>
            {statusBadge && (
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
                <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                  {statusBadge.label}
                </Text>
              </View>
            )}
          </View>

          {/* Código de acreditación */}
          {event.unique_code ? (
            <TouchableOpacity
              style={styles.codePill}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.codePillText}>
                Código de acreditación: {event.unique_code}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Fecha y Lugar */}
          <View style={styles.metaBox}>
            <View style={styles.metaItem}>
              <View style={styles.iconBox}>
                <Calendar size={16} color={COLORS.primary} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Fecha y horario</Text>
                <Text style={styles.metaValue}>{dateLabel}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <View style={[styles.iconBox, { backgroundColor: "#F59E0B15" }]}>
                <MapPin size={16} color="#F59E0B" strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Ubicación / Sede</Text>
                <Text style={styles.metaValue} numberOfLines={2}>
                  {event.location || event.address_line1 || event.address || "Sede Corporativa"}
                </Text>
              </View>
              {hasCoords && (
                <TouchableOpacity
                  style={styles.gpsButton}
                  onPress={handleOpenGps}
                  activeOpacity={0.8}
                >
                  <Navigation size={13} color={COLORS.primaryDark} strokeWidth={2.5} />
                  <Text style={styles.gpsButtonText}>Cómo llegar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Botones Principales de Acción */}
          <View style={styles.primaryActionsRow}>
            <PressableScale
              style={styles.scanBtn}
              onPress={() =>
                navigation.navigate("EnterpriseQRScanner", {
                  eventId: targetId,
                  eventTitle: event.name || event.title,
                })
              }
              scaleTo={0.97}
            >
              <QrCode size={18} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.scanBtnText}>Iniciar Acreditación QR</Text>
            </PressableScale>

            <PressableScale
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate("EnterpriseEditarEvento", { event })
              }
              scaleTo={0.97}
            >
              <Edit3 size={16} color={COLORS.gray700} strokeWidth={2.2} />
              <Text style={styles.editBtnText}>Editar</Text>
            </PressableScale>
          </View>

          {/* Métricas en Vivo del Evento (Asistencia + Carpooling) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Control de Aforo y Movilidad</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>En vivo</Text>
            </View>
          </View>

          <View style={styles.kpiGrid}>
            {/* Acreditados */}
            <View style={styles.kpiBox}>
              <View style={styles.kpiCardInner}>
                <Text style={styles.kpiBigNumber}>{mobilityMetrics.checkedInCount}</Text>
                <Text style={styles.kpiBoxLabel}>Acreditados</Text>
                <Text style={styles.kpiBoxHint}>
                  {mobilityMetrics.checkInPct}% de asistencia
                </Text>
              </View>
            </View>

            {/* Inscritos */}
            <View style={styles.kpiBox}>
              <View style={styles.kpiCardInner}>
                <Text style={[styles.kpiBigNumber, { color: "#0284C7" }]}>
                  {mobilityMetrics.totalInscritos}
                </Text>
                <Text style={styles.kpiBoxLabel}>Inscritos</Text>
                <Text style={styles.kpiBoxHint}>
                  Aforo: {event.capacity || 100} plazas
                </Text>
              </View>
            </View>

            {/* Rutas Carpool Reales */}
            <View style={styles.kpiBox}>
              <View style={styles.kpiCardInner}>
                <Text style={[styles.kpiBigNumber, { color: BRAND.accent }]}>
                  {mobilityMetrics.totalTrayectos}
                </Text>
                <Text style={styles.kpiBoxLabel}>Rutas Carpool</Text>
                <Text style={styles.kpiBoxHint}>
                  {mobilityMetrics.trayectosIdaCount} ida · {mobilityMetrics.trayectosVueltaCount} vuelta
                </Text>
              </View>
            </View>

            {/* Pasajeros en Coche Compartido */}
            <View style={styles.kpiBox}>
              <View style={styles.kpiCardInner}>
                <Text style={[styles.kpiBigNumber, { color: "#10B981" }]}>
                  {mobilityMetrics.totalPasajeros}
                </Text>
                <Text style={styles.kpiBoxLabel}>Pasajeros</Text>
                <Text style={styles.kpiBoxHint}>
                  {mobilityMetrics.plazasLibres} plazas libres
                </Text>
              </View>
            </View>
          </View>

          {/* Sección de Rutas y Trayectos Carpool hacia el Evento */}
          <View style={styles.tripsSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Car size={16} color={COLORS.gray900} strokeWidth={2.4} />
                <Text style={styles.sectionLabel}>Rutas Carpooling del Evento</Text>
              </View>
              <Text style={styles.attendeesCount}>
                {mobilityMetrics.totalTrayectos}{" "}
                {mobilityMetrics.totalTrayectos === 1 ? "trayecto" : "trayectos"}
              </Text>
            </View>

            {/* Selector de sentido Ida / Vuelta */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTripTab === "ida" && styles.tabActive]}
                onPress={() => setActiveTripTab("ida")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTripTab === "ida" && styles.tabTextActive,
                  ]}
                >
                  Ida al evento ({trayectosIda.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTripTab === "vuelta" && styles.tabActive]}
                onPress={() => setActiveTripTab("vuelta")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTripTab === "vuelta" && styles.tabTextActive,
                  ]}
                >
                  Vuelta ({trayectosVuelta.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Listado de trayectos activos */}
            {activeTrips.length > 0 ? (
              <View style={styles.tripsListWrap}>
                {activeTrips.map((viaje, idx) => (
                  <ViajeCard
                    key={viaje.id || idx}
                    viaje={viaje}
                    onPress={() => navigation.navigate("ViajeDetalle", { viaje })}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyTripsBox}>
                <Car size={30} color={COLORS.gray300} strokeWidth={1.8} />
                <Text style={styles.emptyTripsTitle}>
                  Sin viajes de {activeTripTab === "ida" ? "ida" : "vuelta"} por ahora
                </Text>
                <Text style={styles.emptyTripsSub}>
                  Los asistentes pueden ofrecer plazas libres en YouConnext vinculándolas a este evento para reducir emisiones y facilitar el transporte.
                </Text>
              </View>
            )}
          </View>

          {/* Descripción */}
          {event.description ? (
            <View style={styles.descSection}>
              <Text style={styles.sectionLabel}>Información del Evento</Text>
              <Text style={styles.descText}>{event.description}</Text>
            </View>
          ) : null}

          {/* Lista Real de Asistentes Inscritos */}
          <View style={styles.attendeesHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Users size={16} color={COLORS.gray900} strokeWidth={2.4} />
              <Text style={styles.sectionLabel}>Registro de Asistentes</Text>
            </View>
            <Text style={styles.attendeesCount}>
              {participants.length} {participants.length === 1 ? "inscrito" : "inscritos"}
            </Text>
          </View>

          <View style={styles.attendeesList}>
            {participants.length > 0 ? (
              participants.map((att, idx) => {
                const isAccredited =
                  checkedInList.includes(String(att.id)) ||
                  checkedInList.includes(String(att.user_id)) ||
                  checkedInList.includes(String(att.unique_code)) ||
                  Boolean(att.checkedIn);

                const locationStr = [att.ciudad, att.provincia]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <View key={att.id || idx} style={styles.attendeeRow}>
                    {/* Avatar */}
                    {att.img_perfil ? (
                      <Image
                        source={{ uri: att.img_perfil }}
                        style={styles.attendeeAvatar}
                      />
                    ) : (
                      <View style={styles.attendeeAvatarFallback}>
                        <Text style={styles.attendeeAvatarText}>
                          {(att.name || "U").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>{att.name || "Asistente"}</Text>
                      <Text style={styles.attendeeDept}>
                        {locationStr ||
                          (att.joined_at
                            ? `Inscrito el ${new Date(att.joined_at).toLocaleDateString("es-ES")}`
                            : "Asistente registrado")}
                      </Text>
                    </View>

                    {isAccredited ? (
                      <View style={styles.badgeSuccess}>
                        <CheckCircle2 size={13} color={COLORS.primary} strokeWidth={2.4} />
                        <Text style={styles.badgeSuccessText}>Acreditado QR</Text>
                      </View>
                    ) : (
                      <View style={styles.badgePending}>
                        <AlertCircle size={13} color={COLORS.gray400} strokeWidth={2.2} />
                        <Text style={styles.badgePendingText}>Pendiente</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyAttendeesBox}>
                <Users size={28} color={COLORS.gray300} strokeWidth={1.8} />
                <Text style={styles.emptyAttendeesTitle}>Aún no hay inscritos</Text>
                <Text style={styles.emptyAttendeesSub}>
                  Comparte el código único ({event.unique_code || "OFICIAL"}) para que los usuarios se unan y registren su participación.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  shareBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  bannerImage: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.gray200,
  },
  body: {
    padding: SPACING.screenMargin,
  },
  titleTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  codePill: {
    backgroundColor: "#EBF7EE",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#C6ECD2",
  },
  codePillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#14532D",
  },
  metaBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    fontSize: 10.5,
    color: COLORS.gray400,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    color: BRAND.black,
    fontWeight: "600",
    marginTop: 1,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  gpsButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  primaryActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  scanBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: RADIUS.control,
    gap: 8,
    ...SHADOWS.card,
  },
  scanBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 6,
  },
  editBtnText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#334155",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginBottom: 16,
  },
  kpiBox: {
    width: "50%",
    padding: 4,
  },
  kpiCardInner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    ...SHADOWS.card,
  },
  kpiBigNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    textAlign: "center",
  },
  kpiBoxLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND.black,
    marginTop: 2,
    textAlign: "center",
  },
  kpiBoxHint: {
    fontSize: 9.5,
    color: COLORS.gray500,
    marginTop: 1,
    textAlign: "center",
  },
  tripsSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.round,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: RADIUS.round,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  tabTextActive: {
    color: BRAND.black,
    fontWeight: "700",
  },
  tripsListWrap: {
    gap: 8,
  },
  emptyTripsBox: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  emptyTripsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 8,
    textAlign: "center",
  },
  emptyTripsSub: {
    fontSize: 11.5,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
  descSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  descText: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 19,
    marginTop: 4,
  },
  attendeesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  attendeesCount: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  attendeesList: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  attendeeAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  attendeeAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  attendeeAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.black,
  },
  attendeeDept: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 1,
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  badgeSuccessText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.primary,
  },
  badgePending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  badgePendingText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  emptyAttendeesBox: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyAttendeesTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 8,
  },
  emptyAttendeesSub: {
    fontSize: 11.5,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
});

export default EnterpriseEventDetailScreen;
