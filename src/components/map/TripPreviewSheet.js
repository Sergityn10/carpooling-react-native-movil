// YouConnext - Tarjeta Flotante Premium de Vista Previa de Viaje (Pro UI)
// Ficha completa de viaje seleccionado con timeline origen-destino, perfil de conductor, vehículo y acciones rápidas

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import {
  Clock,
  User,
  Star,
  MessageCircle,
  Car,
  X,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Navigation,
  Luggage,
  Sparkles,
  Users,
  Timer,
  MapPin,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";
import { formatTripDate, formatTripTime, formatTripCountdown } from "../../services/dateUtils";

const SHEET_DISMISS_THRESHOLD = 80;

const TripPreviewSheet = ({
  trip,
  visible = true,
  onClose,
  onViewDetail,
  onChat,
  onFitRoute,
  theme = "light",
}) => {
  const translateY = useRef(new Animated.Value(300));

  useEffect(() => {
    if (visible && trip) {
      Animated.spring(translateY.current, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5,
        speed: 15,
      }).start();
    }
  }, [visible, trip?.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.current.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > SHEET_DISMISS_THRESHOLD || gesture.vy > 0.8) {
          Animated.timing(translateY.current, {
            toValue: 400,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onClose?.());
        } else {
          Animated.spring(translateY.current, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  if (!trip || !visible) return null;

  const {
    id,
    origen,
    destino,
    hora,
    fecha,
    precio,
    plazasDisponibles,
    plazasTotales,
    disponible,
    plazas,
    conductor,
    conductorRating,
    img_perfil,
    coche,
    vehiculo,
  } = trip;

  const isDark = theme === "dark";

  // Resolver foto y nombre de conductor de forma segura
  const driverAvatar =
    img_perfil ||
    trip.conductor_img ||
    (typeof conductor === "object"
      ? conductor?.img_perfil || conductor?.avatar || conductor?.avatar_url || conductor?.photo
      : null);

  const driverName =
    (typeof conductor === "object" ? conductor?.nombre || conductor?.name : conductor) ||
    trip.conductorNombre ||
    trip.conductor_nombre ||
    "Conductor";

  const rating =
    conductorRating ||
    (typeof conductor === "object" ? conductor?.rating : null) ||
    4.9;

  const availableSeats = plazasDisponibles ?? disponible ?? plazas ?? 1;
  const totalSeats = plazasTotales ?? plazas ?? availableSeats;
  const priceValue = precio ?? 0;

  // Fechas y horas formateadas usando utilidades centralizadas
  const departureTime = formatTripTime(trip);
  const departureDateLabel = formatTripDate(trip);
  const countdownLabel = formatTripCountdown(trip);

  // Extraer nombres de origen/destino de forma segura (string u objeto {nombre, direccion})
  const getLocationName = (loc) => {
    if (!loc) return "—";
    if (typeof loc === "string") return loc;
    return loc.nombre || loc.direccion || loc.address || "—";
  };
  const originName = getLocationName(origen);
  const destinationName = getLocationName(destino);

  // Distancia y duración estimada (si están disponibles en el viaje)
  const distanceKm = trip.distancia_km || trip.distance_km || trip.distance;
  const durationMin = trip.duracion_min || trip.duration_min || trip.duration;

  // Datos del coche si existen
  let vehicleText = "Vehículo verificado";
  if (typeof vehiculo === "object" && vehiculo?.modelo) {
    vehicleText = `${vehiculo.marca || ""} ${vehiculo.modelo} ${vehiculo.color ? `· ${vehiculo.color}` : ""}`.trim();
  } else if (typeof coche === "object" && coche?.modelo) {
    vehicleText = `${coche.marca || ""} ${coche.modelo}`.trim();
  } else if (typeof vehiculo === "string" && vehiculo) {
    vehicleText = vehiculo;
  }

  return (
    <Animated.View
      style={[
        styles.islandContainer,
        isDark && styles.islandContainerDark,
        {
          transform: [{ translateY: translateY.current }],
        },
      ]}
    >
      {/* Handle superior de arrastre */}
      <View {...panResponder.panHandlers} style={styles.handleZone}>
        <View style={[styles.handleBar, isDark && styles.handleBarDark]} />
      </View>

      <View style={styles.content}>
        {/* Fila 1: Chip de salida temporal + Precio + Botón Cerrar */}
        <View style={styles.topBannerRow}>
          <View style={styles.statusPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.statusPillText}>{departureDateLabel}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceNumber}>{priceValue}€</Text>
            <Text style={styles.priceUnit}>/ plaza</Text>
          </View>

          <TouchableOpacity
            style={[styles.closeCircleBtn, isDark && styles.closeCircleBtnDark]}
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="Cerrar ficha"
          >
            <X size={16} color={isDark ? COLORS.white : COLORS.gray500} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Fila 2: Perfil del conductor y datos del vehículo */}
        <View style={styles.driverSection}>
          <View style={styles.driverAvatarContainer}>
            {driverAvatar ? (
              <Image source={{ uri: driverAvatar }} style={styles.driverAvatarImg} />
            ) : (
              <View style={[styles.driverAvatarImg, styles.driverAvatarFallback]}>
                <User size={22} color={COLORS.white} strokeWidth={2.4} />
              </View>
            )}
            <View style={styles.shieldBadge}>
              <ShieldCheck size={12} color={COLORS.primary} strokeWidth={2.6} />
            </View>
          </View>

          <View style={styles.driverDetailsCol}>
            <View style={styles.driverNameLine}>
              <Text style={[styles.driverNameText, isDark && styles.textWhite]} numberOfLines={1}>
                {driverName}
              </Text>
              <View style={styles.ratingStarBox}>
                <Star size={11} color="#B45309" fill="#F59E0B" />
                <Text style={styles.ratingNumber}>{Number(rating).toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.vehicleRow}>
              <Car size={13} color={COLORS.gray500} strokeWidth={2} />
              <Text style={styles.vehicleText} numberOfLines={1}>
                {vehicleText}
              </Text>
            </View>
          </View>
        </View>

        {/* Fila 3: Timeline del itinerario (Origen ➔ Conector con Ver Ruta ➔ Destino) */}
        <View style={[styles.itineraryCard, isDark && styles.itineraryCardDark]}>
          <View style={styles.timelineRow}>
            {/* Indicador visual de línea */}
            <View style={styles.timelineIndicators}>
              <View style={styles.originMarkerDot} />
              <View style={styles.timelineDottedLine} />
              <View style={styles.destMarkerSquare} />
            </View>

            {/* Texto de Origen y Destino */}
            <View style={styles.timelineTextCol}>
              {/* Origen */}
              <View style={styles.itineraryPoint}>
                <View style={styles.originRow}>
                  <MapPin size={12} color={COLORS.primary} strokeWidth={2} />
                  <Text style={[styles.cityTitle, isDark && styles.textWhite]} numberOfLines={1}>
                    {originName}
                  </Text>
                </View>
                <View style={styles.timeTagRow}>
                  <Clock size={10} color={isDark ? COLORS.gray400 : COLORS.gray500} strokeWidth={1.8} />
                  <Text style={[styles.timeTag, isDark && styles.timeTagDark]}>Salida {departureTime}</Text>
                  {countdownLabel && (
                    <>
                      <View style={styles.dotSeparator} />
                      <Text style={styles.countdownTag}>{countdownLabel}</Text>
                    </>
                  )}
                </View>
              </View>

              {/* Info de distancia/duración entre origen y destino */}
              {(distanceKm || durationMin) && (
                <View style={[styles.routeInfoPill, isDark && styles.routeInfoPillDark]}>
                  {distanceKm && (
                    <View style={styles.routeInfoItem}>
                      <Navigation size={10} color={COLORS.secondary} strokeWidth={2} />
                      <Text style={[styles.routeInfoText, isDark && styles.routeInfoTextDark]}>{Number(distanceKm).toFixed(1)} km</Text>
                    </View>
                  )}
                  {durationMin && (
                    <View style={styles.routeInfoItem}>
                      <Timer size={10} color={COLORS.secondary} strokeWidth={2} />
                      <Text style={[styles.routeInfoText, isDark && styles.routeInfoTextDark]}>{Math.round(durationMin)} min</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Botón central para centrar la ruta en el mapa */}
              {onFitRoute && (
                <TouchableOpacity
                  style={[styles.fitRouteActionPill, isDark && styles.fitRouteActionPillDark]}
                  onPress={onFitRoute}
                  activeOpacity={0.8}
                  hitSlop={6}
                >
                  <Navigation size={12} color={COLORS.secondary} strokeWidth={2.5} />
                  <Text style={styles.fitRouteActionText}>Centrar recorrido en el mapa</Text>
                </TouchableOpacity>
              )}

              {/* Destino */}
              <View style={styles.itineraryPoint}>
                <View style={styles.destRow}>
                  <MapPin size={12} color={COLORS.error} strokeWidth={2} />
                  <Text style={[styles.cityTitle, isDark && styles.textWhite]} numberOfLines={1}>
                    {destinationName}
                  </Text>
                </View>
                <Text style={[styles.destSubTag, isDark && styles.textWhite]}>Destino final</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fila 4: Badges de Plazas y Comodidades */}
        <View style={styles.amenitiesRow}>
          <View style={[styles.amenityBadge, isDark && styles.amenityBadgeDark]}>
            <Users size={13} color={COLORS.primary} strokeWidth={2.2} />
            <Text style={[styles.amenityText, isDark && styles.textWhite]}>
              {availableSeats} de {totalSeats} plazas libres
            </Text>
          </View>

          <View style={[styles.amenityBadge, isDark && styles.amenityBadgeDark]}>
            <Luggage size={13} color={COLORS.secondary} strokeWidth={2.2} />
            <Text style={[styles.amenityText, isDark && styles.textWhite]}>
              Equipaje permitido
            </Text>
          </View>

          <View style={[styles.amenityBadge, isDark && styles.amenityBadgeDark]}>
            <Sparkles size={13} color={COLORS.accent} strokeWidth={2.2} />
            <Text style={[styles.amenityText, isDark && styles.textWhite]}>
              Verificado
            </Text>
          </View>
        </View>

        {/* Fila 5: Botones de Acción */}
        <View style={styles.actionButtonGroup}>
          {onChat && (
            <PressableScale
              style={[styles.chatIconButton, isDark && styles.chatIconButtonDark]}
              onPress={onChat}
              accessibilityLabel="Chatear con el conductor"
              hitSlop={6}
            >
              <MessageCircle size={20} color={COLORS.primary} strokeWidth={2.2} />
            </PressableScale>
          )}

          <PressableScale
            style={styles.reserveMainCta}
            onPress={onViewDetail}
            accessibilityLabel="Ver viaje y reservar"
            hitSlop={6}
          >
            <Text style={styles.reserveMainCtaText}>Ver detalles y reservar</Text>
            <ChevronRight size={19} color={COLORS.white} strokeWidth={2.5} />
          </PressableScale>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  islandContainer: {
    position: "absolute",
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    ...SHADOWS.xl,
    zIndex: 110,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  islandContainerDark: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  handleZone: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  handleBarDark: {
    backgroundColor: "#475569",
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  topBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
    color: COLORS.primaryDark,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  priceNumber: {
    fontSize: 20,
    fontWeight: FONTS.extrabold,
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: FONTS.medium,
  },
  closeCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeCircleBtnDark: {
    backgroundColor: "#334155",
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
    paddingVertical: 2,
  },
  driverAvatarContainer: {
    position: "relative",
    width: 48,
    height: 48,
  },
  driverAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  driverAvatarFallback: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 2,
    ...SHADOWS.sm,
  },
  driverDetailsCol: {
    flex: 1,
    gap: 2,
  },
  driverNameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  driverNameText: {
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
    color: COLORS.gray900,
  },
  ratingStarBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  ratingNumber: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: "#B45309",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  vehicleText: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  itineraryCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  itineraryCardDark: {
    backgroundColor: "#0F172A",
    borderColor: "#1E293B",
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10,
  },
  timelineIndicators: {
    alignItems: "center",
    paddingVertical: 4,
    width: 14,
  },
  originMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  timelineDottedLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 4,
  },
  destMarkerSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
  },
  timelineTextCol: {
    flex: 1,
    gap: 6,
  },
  itineraryPoint: {
    gap: 1,
  },
  cityTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.gray900,
  },
  timeTag: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: FONTS.semibold,
  },
  timeTagDark: {
    color: "#60A5FA",
  },
  destSubTag: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  destSubTagDark: {
    color: COLORS.gray400,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray400,
    marginHorizontal: 2,
  },
  countdownTag: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.success,
  },
  routeInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  routeInfoText: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.primaryDark,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fitRouteActionPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 5,
    marginVertical: 2,
  },
  fitRouteActionPillDark: {
    backgroundColor: "#075985",
  },
  routeInfoPillDark: {
    backgroundColor: "#1E3A5F",
  },
  routeInfoTextDark: {
    color: "#93C5FD",
  },
  fitRouteActionText: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.secondaryDark,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  amenityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 5,
  },
  amenityBadgeDark: {
    backgroundColor: "#334155",
  },
  amenityText: {
    fontSize: 11,
    fontWeight: FONTS.medium,
    color: COLORS.gray700,
  },
  actionButtonGroup: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: 2,
  },
  chatIconButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  chatIconButtonDark: {
    backgroundColor: "#064E3B",
    borderColor: COLORS.primary,
  },
  reserveMainCta: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    ...SHADOWS.md,
  },
  reserveMainCtaText: {
    fontSize: FONTS.sm + 1,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },
  textWhite: {
    color: COLORS.white,
  },
});

export default TripPreviewSheet;