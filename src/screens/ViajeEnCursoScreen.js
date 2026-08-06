// YouConnext - ViajeEnCursoScreen
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ChevronLeft,
  Play,
  Clock,
  Calendar,
  QrCode,
  Flag,
  Car,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { useViaje } from "../context/ViajeContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { QRCodeModal, TripMapPreview, LiveTripMap } from "../components";
import {
  parseTripDate,
  formatTripDate,
  formatTripTime,
} from "../services/dateUtils";
import { getEstadoConfig } from "../utils/viajeEstado";
import useDriverTracking from "../hooks/useDriverTracking";
import usePassengerTracking from "../hooks/usePassengerTracking";

const ViajeEnCursoScreen = ({ route, navigation }) => {
  const { user } = useUser();
  const { viajeActivo, iniciarViaje, completarViaje } = useViaje();

  const viaje = route?.params?.viaje || viajeActivo;
  const [showQR, setShowQR] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const origen = useMemo(() => {
    const lat = viaje?.origen_lat ?? viaje?.puntoInicialLat;
    const lng = viaje?.origen_lng ?? viaje?.puntoInicialLng;
    if (lat == null || lng == null) return null;
    return {
      latitude: Number(lat),
      longitude: Number(lng),
      name: viaje?.origen || viaje?.puntoInicialNombre || "Origen",
      address:
        viaje?.origen ||
        viaje?.puntoInicialDireccion ||
        viaje?.puntoInicialNombre ||
        "",
    };
  }, [viaje]);

  const destino = useMemo(() => {
    const lat = viaje?.destino_lat ?? viaje?.puntoFinalLat;
    const lng = viaje?.destino_lng ?? viaje?.puntoFinalLng;
    if (lat == null || lng == null) return null;
    return {
      latitude: Number(lat),
      longitude: Number(lng),
      name: viaje?.destino || viaje?.puntoFinalNombre || "Destino",
      address:
        viaje?.destino ||
        viaje?.puntoFinalDireccion ||
        viaje?.puntoFinalNombre ||
        "",
    };
  }, [viaje]);

  const estadoViaje = (viaje?.status || viaje?.estado || "").toLowerCase();
  const canStart =
    estadoViaje === "pendiente" || estadoViaje === "pendiente_pago";

  const esConductor =
    !!user?.id &&
    [viaje?.conductor, viaje?.conductor_id, viaje?.conductorId].some(
      (id) => id === user.id,
    );
  const enCurso = estadoViaje === "en curso" || estadoViaje === "activo";

  useDriverTracking(viaje?.id, enCurso && esConductor);

  const {
    driverLocation,
    isRecovered,
    waitingLocation,
    trackingEnded,
    reconnecting,
    error: passengerError,
  } = usePassengerTracking(viaje?.id, enCurso && !esConductor);

  const estadoCfg = getEstadoConfig(estadoViaje);
  const tripDate = useMemo(() => parseTripDate(viaje), [viaje]);
  const fechaLabel = tripDate ? formatTripDate(viaje) : "";
  const horaLabel = tripDate ? formatTripTime(viaje) : "";

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const collapsedHeight = 214;
  const expandedHeight = Math.round(windowHeight * 0.68);
  const dragRange = Math.max(expandedHeight - collapsedHeight, 1);

  const [mapHeight, setMapHeight] = useState(400);

  const handleMapLayout = (e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && Math.abs(h - mapHeight) > 2) setMapHeight(h);
  };

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const dragStart = useRef(0);
  const sheetTranslate = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [dragRange, 0],
    extrapolate: "clamp",
  });

  const animateSheet = (toValue) => {
    setSheetExpanded(toValue === 1);
    Animated.spring(sheetAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        sheetAnim.stopAnimation((v) => {
          dragStart.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(
          1,
          Math.max(0, dragStart.current - g.dy / dragRange),
        );
        sheetAnim.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const current = Math.min(
          1,
          Math.max(0, dragStart.current - g.dy / dragRange),
        );
        const target =
          g.vy < -0.4 ? 1 : g.vy > 0.4 ? 0 : current >= 0.5 ? 1 : 0;
        animateSheet(target);
      },
    }),
  ).current;

  const handleStart = async () => {
    try {
      if (!user) {
        Alert.alert(
          "Inicia sesión",
          "Debes iniciar sesión para iniciar el viaje.",
        );
        return;
      }
      await iniciarViaje(viaje);
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo iniciar el viaje.");
    }
  };

  const handleFinalizar = () => {
    Alert.alert(
      "Finalizar trayecto",
      "¿Seguro que quieres finalizar el trayecto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            try {
              await completarViaje(viaje);
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
                  [{ text: "OK", onPress: () => navigation.goBack() }],
                );
              }
            } catch (e) {
              Alert.alert(
                "Error",
                e?.message || "No se pudo finalizar el viaje.",
              );
            }
          },
        },
      ],
    );
  };

  if (!viaje) {
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
          <Text style={styles.headerTitle}>Tu trayecto</Text>
        </View>

        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay viaje activo</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa a pantalla completa */}
      <View style={styles.mapContainer} onLayout={handleMapLayout}>
        {enCurso ? (
          <LiveTripMap
            origin={origen}
            destination={destino}
            driverLocation={driverLocation}
            isRecovered={isRecovered}
            waitingLocation={esConductor ? false : waitingLocation}
            trackingEnded={trackingEnded}
            reconnecting={reconnecting}
            height={mapHeight}
            bottomInset={collapsedHeight - 32}
            fullBleed
          />
        ) : (
          <TripMapPreview
            origin={origen}
            destination={destino}
            height={mapHeight}
          />
        )}
      </View>

      {/* Header flotante sobre el mapa */}
      <SafeAreaView
        style={styles.headerOverlay}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color={COLORS.gray800} strokeWidth={2.5} />
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
      </SafeAreaView>

      {/* Bottom sheet deslizante */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: expandedHeight,
            paddingBottom: Math.max(insets.bottom, SPACING.xs),
            transform: [{ translateY: sheetTranslate }],
          },
        ]}
      >
        {/* Zona siempre visible + arrastrable */}
        <View {...panResponder.panHandlers}>
          <TouchableOpacity
            onPress={() => animateSheet(sheetExpanded ? 0 : 1)}
            activeOpacity={1}
          >
            <View style={styles.grabber} />
          </TouchableOpacity>

          <View style={styles.sheetSummary}>
            <View style={styles.summaryTextWrap}>
              {enCurso ? (
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>
                    {esConductor
                      ? "Compartiendo tu ubicación en vivo"
                      : "Siguiendo al conductor en vivo"}
                  </Text>
                </View>
              ) : (
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {origen?.name || "Origen"} → {destino?.name || "Destino"}
                </Text>
              )}
              <Text style={styles.sheetSubtitle} numberOfLines={1}>
                {enCurso
                  ? `${origen?.name || "Origen"} → ${destino?.name || "Destino"}`
                  : "El viaje aún no ha comenzado"}
              </Text>
            </View>
            {sheetExpanded ? (
              <ChevronDown size={18} color={COLORS.gray400} strokeWidth={2.5} />
            ) : (
              <ChevronUp size={18} color={COLORS.gray400} strokeWidth={2.5} />
            )}
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => setShowQR(true)}
              activeOpacity={0.85}
            >
              <QrCode size={16} color={COLORS.primaryDark} strokeWidth={2.2} />
              <Text style={styles.quickChipText}>Mi QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => navigation.navigate("ViajeDetalle", { viaje })}
              activeOpacity={0.85}
            >
              <Info size={16} color={COLORS.primaryDark} strokeWidth={2.2} />
              <Text style={styles.quickChipText}>Detalle</Text>
            </TouchableOpacity>
            {!!horaLabel && (
              <View style={styles.quickChipStatic}>
                <Clock size={14} color={COLORS.gray500} strokeWidth={2.2} />
                <Text style={styles.quickChipStaticText}>{horaLabel}</Text>
              </View>
            )}
          </View>

          {canStart && esConductor && (
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={handleStart}
              activeOpacity={0.9}
            >
              <Play size={18} color={COLORS.white} fill={COLORS.white} />
              <Text style={styles.primaryCtaText}>Empezar viaje</Text>
            </TouchableOpacity>
          )}

          {canStart && !esConductor && (
            <View style={styles.waitingBanner}>
              <Clock size={15} color={COLORS.gray500} strokeWidth={2.2} />
              <Text style={styles.waitingText}>
                El conductor aún no ha iniciado el viaje
              </Text>
            </View>
          )}

          {enCurso && esConductor && (
            <TouchableOpacity
              style={styles.dangerCta}
              onPress={handleFinalizar}
              activeOpacity={0.85}
            >
              <CheckCircle2 size={18} color={COLORS.error} strokeWidth={2.2} />
              <Text style={styles.dangerCtaText}>Finalizar trayecto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contenido expandido */}
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContentContainer}
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
                    {origen?.name || "Punto de salida"}
                  </Text>
                </View>
                <View style={styles.routePointSpaced}>
                  <Text style={styles.routeLabel}>DESTINO</Text>
                  <Text style={styles.routeName} numberOfLines={2}>
                    {destino?.name || "Punto de llegada"}
                  </Text>
                </View>
              </View>
            </View>

            {(!!fechaLabel || !!horaLabel) && (
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
              </View>
            )}
          </View>

          {/* Vehículo (para el pasajero) */}
          {!esConductor && (viaje?.matricula || viaje?.modeloVehiculo) && (
            <>
              <Text style={styles.sectionLabel}>VEHÍCULO</Text>
              <View style={styles.infoCard}>
                <View style={styles.vehiculoIcon}>
                  <Car size={18} color={COLORS.primary} strokeWidth={2.2} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoTitle}>
                    {viaje?.matricula || "—"}
                  </Text>
                  <Text style={styles.infoSub} numberOfLines={1}>
                    {viaje?.modeloVehiculo || "Vehículo"}
                    {!!viaje?.colorVehiculo && ` · ${viaje.colorVehiculo}`}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Pasajeros */}
          <Text style={styles.sectionLabel}>
            PASAJEROS ({viaje?.pasajeros?.length || 0})
          </Text>
          {viaje?.pasajeros?.length > 0 ? (
            <View style={styles.paxCard}>
              {viaje.pasajeros.map((p, index) => {
                const nombre =
                  `${p.usuario?.nombre || p.nombre || "Desconocido"} ${p.usuario?.apellidos || p.apellidos || ""}`.trim();
                const imgPerfil = p.usuario?.img_perfil || p.img_perfil;
                const pasajeroId = p.user_id || p.usuario_id || p.usuario?.id;
                const esUltimo = index === viaje.pasajeros.length - 1;
                const canViewProfile = pasajeroId && pasajeroId !== user?.id;
                return (
                  <TouchableOpacity
                    key={p.id_reserva || index}
                    style={[styles.paxRow, !esUltimo && styles.paxRowBorder]}
                    onPress={() => {
                      if (canViewProfile) {
                        navigation.navigate("PerfilPublico", {
                          userId: pasajeroId,
                        });
                      }
                    }}
                    disabled={!canViewProfile}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paxAvatar}>
                      {imgPerfil ? (
                        <Image
                          source={{ uri: imgPerfil }}
                          style={styles.paxAvatarImg}
                        />
                      ) : (
                        <Text style={styles.paxAvatarText}>
                          {nombre.charAt(0)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.paxName} numberOfLines={1}>
                      {nombre}
                    </Text>
                    {p.trip_outcome === "success" ? (
                      <CheckCircle2
                        size={16}
                        color={COLORS.success}
                        strokeWidth={2.2}
                      />
                    ) : canViewProfile ? (
                      <ChevronRight
                        size={16}
                        color={COLORS.gray300}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.emptyText}>
                Aún no hay pasajeros en este viaje
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        viaje={viaje}
        codigoQR={viaje?.codigoQR}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 1,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    ...SHADOWS.small,
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
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray200,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sheetSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  summaryTextWrap: {
    flex: 1,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  sheetTitle: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  sheetSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  quickChipText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  quickChipStatic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.xs,
  },
  quickChipStaticText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.gray500,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    ...SHADOWS.medium,
  },
  primaryCtaText: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.white,
  },
  dangerCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerCtaText: {
    fontSize: FONTS.md,
    fontWeight: "700",
    color: COLORS.error,
  },
  waitingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  waitingText: {
    fontSize: FONTS.sm,
    fontWeight: "500",
    color: COLORS.gray500,
  },
  sheetContent: {
    flex: 1,
    marginTop: SPACING.sm,
  },
  sheetContentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  routeCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  vehiculoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  infoSub: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  paxCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  paxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
  },
  paxRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  paxAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    overflow: "hidden",
  },
  paxAvatarImg: {
    width: "100%",
    height: "100%",
  },
  paxAvatarText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.white,
  },
  paxName: {
    flex: 1,
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray800,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: FONTS.md,
    color: COLORS.gray600,
  },
});

export default ViajeEnCursoScreen;
