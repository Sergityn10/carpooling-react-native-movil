// YouConnext - HistorialSection Component (Pro UI/UX Redesign)
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Car,
  Users,
  Route,
  ChevronRight,
  User as UserIcon,
  Clock,
  AlertCircle,
  CreditCard,
  Star,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ChevronDown,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../../constants";
import SubViewHeader from "./SubViewHeader";
import PressableScale from "../../common/PressableScale";
import AnimatedCardEntrance from "../../common/AnimatedCardEntrance";
import PulseDot from "../../common/PulseDot";
import EmptyState from "../../home/EmptyState";
import { parseTripDate } from "../../../services/dateUtils";

const FILTER_TODOS = "todos";
const FILTER_CONDUCTOR = "conductor";
const FILTER_PASAJERO = "pasajero";

const HistorialSection = ({
  viajes = [],
  loadingViajes,
  errorViajes,
  expandedViajeId,
  viajePasajeros = {},
  loadingPasajeros = {},
  resumingPagoId,
  navigation,
  onRetry,
  onTogglePasajeros,
  onRetomarPago,
  onBack,
}) => {
  const [activeFilter, setActiveFilter] = useState(FILTER_TODOS);

  // Filtrado de viajes por rol
  const filteredViajes = useMemo(() => {
    if (activeFilter === FILTER_CONDUCTOR) {
      return viajes.filter((v) => v.rol === "conductor");
    }
    if (activeFilter === FILTER_PASAJERO) {
      return viajes.filter((v) => v.rol === "pasajero");
    }
    return viajes;
  }, [viajes, activeFilter]);

  const countConductor = useMemo(
    () => viajes.filter((v) => v.rol === "conductor").length,
    [viajes],
  );
  const countPasajero = useMemo(
    () => viajes.filter((v) => v.rol === "pasajero").length,
    [viajes],
  );

  // Agrupación por fechas
  const viajesAgrupados = useMemo(() => {
    const grupos = {};
    filteredViajes.forEach((viaje) => {
      if (!viaje.hora) return;
      const fechaObj = parseTripDate(viaje);

      if (!fechaObj || isNaN(fechaObj.getTime())) {
        const desc = "Fecha por confirmar";
        if (!grupos[desc]) grupos[desc] = [];
        grupos[desc].push(viaje);
        return;
      }

      const hoy = new Date();
      const ayer = new Date();
      ayer.setDate(hoy.getDate() - 1);
      const mañana = new Date();
      mañana.setDate(hoy.getDate() + 1);

      let fechaLegible = "";
      if (fechaObj.toDateString() === hoy.toDateString()) {
        fechaLegible = "Hoy";
      } else if (fechaObj.toDateString() === ayer.toDateString()) {
        fechaLegible = "Ayer";
      } else if (fechaObj.toDateString() === mañana.toDateString()) {
        fechaLegible = "Mañana";
      } else {
        fechaLegible = fechaObj.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        fechaLegible =
          fechaLegible.charAt(0).toUpperCase() + fechaLegible.slice(1);
      }

      if (!grupos[fechaLegible]) {
        grupos[fechaLegible] = [];
      }
      grupos[fechaLegible].push(viaje);
    });
    return grupos;
  }, [filteredViajes]);

  const groupKeys = Object.keys(viajesAgrupados);

  const handleViajeNavigation = (viaje) => {
    const isEnCurso =
      viaje.status === "en curso" || viaje.status === "activo";
    if (isEnCurso) {
      navigation.navigate("ViajeEnCurso", { viaje: viaje.originalData });
    } else if (viaje.rol === "conductor") {
      navigation.navigate("ViajeDetalle", { viaje: viaje.originalData });
    } else {
      navigation.navigate("MiViaje", { viaje: viaje.originalData });
    }
  };

  const handleRateTrip = (viaje, e) => {
    e.stopPropagation();
    if (viaje.rol === "conductor") {
      navigation.navigate("ValorarPasajeros", { viaje: viaje.originalData });
    } else {
      navigation.navigate("ValorarViaje", { viaje: viaje.originalData });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <SubViewHeader title="Historial de trayectos" onBack={onBack} />

      {/* Píldoras de Filtro por Rol */}
      {!loadingViajes && !errorViajes && viajes.length > 0 && (
        <View style={styles.filterPillsContainer}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === FILTER_TODOS && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter(FILTER_TODOS)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === FILTER_TODOS && styles.filterPillTextActive,
              ]}
            >
              Todos ({viajes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === FILTER_CONDUCTOR && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter(FILTER_CONDUCTOR)}
            activeOpacity={0.8}
          >
            <Car
              size={13}
              color={
                activeFilter === FILTER_CONDUCTOR
                  ? COLORS.primaryDark
                  : COLORS.gray600
              }
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === FILTER_CONDUCTOR && styles.filterPillTextActive,
              ]}
            >
              Conductor ({countConductor})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === FILTER_PASAJERO && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter(FILTER_PASAJERO)}
            activeOpacity={0.8}
          >
            <UserIcon
              size={13}
              color={
                activeFilter === FILTER_PASAJERO
                  ? COLORS.primaryDark
                  : COLORS.gray600
              }
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === FILTER_PASAJERO && styles.filterPillTextActive,
              ]}
            >
              Pasajero ({countPasajero})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loadingViajes ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tu historial de viajes...</Text>
        </View>
      ) : errorViajes ? (
        <View style={styles.errorCard}>
          <AlertCircle size={32} color={COLORS.error} strokeWidth={2} />
          <Text style={styles.errorTitle}>Error al cargar viajes</Text>
          <Text style={styles.errorSubtitle}>{errorViajes}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : filteredViajes.length === 0 ? (
        <EmptyState
          icon={Route}
          tint={COLORS.primary}
          tintSoft={COLORS.primarySoft}
          title="Sin viajes registrados"
          subtitle={
            activeFilter === FILTER_CONDUCTOR
              ? "Aún no has publicado viajes como conductor."
              : activeFilter === FILTER_PASAJERO
                ? "No tienes reservas registradas como pasajero."
                : "Tus viajes completados y activos aparecerán listados aquí."
          }
          actionLabel="Explorar viajes"
          onActionPress={() => navigation.navigate("SearchTab")}
        />
      ) : (
        groupKeys.map((fecha) => (
          <View key={fecha} style={styles.dateGroup}>
            <View style={styles.dateHeaderRow}>
              <View style={styles.dateDot} />
              <Text style={styles.dateGroupTitle}>{fecha}</Text>
            </View>

            {viajesAgrupados[fecha].map((viaje, index) => {
              const esConductor = viaje.rol === "conductor";
              const isEnCurso =
                viaje.status === "en curso" || viaje.status === "activo";
              const isFinalizado =
                viaje.status === "finalizado" || viaje.status === "completado";
              const isCancelado = viaje.status === "cancelado";

              const formattedTime = viaje.hora
                ? new Date(viaje.hora).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--";

              const priceValue = esConductor
                ? viaje.precio_conductor ?? viaje.precio
                : viaje.precio;

              const isExpanded = expandedViajeId === viaje.id;
              const pasajerosList = viajePasajeros[viaje.id] || [];
              const isPasajerosLoading = loadingPasajeros[viaje.id];

              return (
                <AnimatedCardEntrance key={viaje.keyId} index={index}>
                  <PressableScale
                    style={[
                      styles.tripCard,
                      isEnCurso && styles.tripCardEnCurso,
                      isCancelado && styles.tripCardCancelado,
                    ]}
                    onPress={() => handleViajeNavigation(viaje)}
                    scaleTo={0.98}
                  >
                    {/* Top Row: Rol + Status + Price */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.badgesLeft}>
                        <View
                          style={[
                            styles.roleBadge,
                            esConductor
                              ? styles.roleBadgeDriver
                              : styles.roleBadgePassenger,
                          ]}
                        >
                          {esConductor ? (
                            <Car
                              size={11}
                              color={COLORS.primaryDark}
                              strokeWidth={2.5}
                            />
                          ) : (
                            <UserIcon
                              size={11}
                              color={COLORS.secondaryDark}
                              strokeWidth={2.5}
                            />
                          )}
                          <Text
                            style={[
                              styles.roleBadgeText,
                              esConductor
                                ? styles.roleBadgeTextDriver
                                : styles.roleBadgeTextPassenger,
                            ]}
                          >
                            {esConductor ? "Conductor" : "Pasajero"}
                          </Text>
                        </View>

                        {/* Status badge */}
                        {isEnCurso ? (
                          <View style={styles.statusBadgeEnCurso}>
                            <PulseDot color={COLORS.white} size={6} />
                            <Text style={styles.statusTextEnCurso}>En curso</Text>
                          </View>
                        ) : isFinalizado ? (
                          <View style={styles.statusBadgeFinalizado}>
                            <CheckCircle2
                              size={11}
                              color={COLORS.gray600}
                              strokeWidth={2.4}
                            />
                            <Text style={styles.statusTextFinalizado}>
                              Finalizado
                            </Text>
                          </View>
                        ) : isCancelado ? (
                          <View style={styles.statusBadgeCancelado}>
                            <XCircle
                              size={11}
                              color={COLORS.error}
                              strokeWidth={2.4}
                            />
                            <Text style={styles.statusTextCancelado}>
                              Cancelado
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.statusBadgePendiente}>
                            <Clock
                              size={11}
                              color={COLORS.warning}
                              strokeWidth={2.4}
                            />
                            <Text style={styles.statusTextPendiente}>
                              Programado
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Precio */}
                      <View style={styles.pricePill}>
                        <Text style={styles.pricePillText}>
                          {priceValue != null && priceValue > 0
                            ? `${priceValue}€`
                            : "Gratis"}
                        </Text>
                      </View>
                    </View>

                    {/* Timeline de la Ruta */}
                    <View style={styles.routeSection}>
                      <View style={styles.timelineCol}>
                        <View style={[styles.dot, styles.dotOrigin]} />
                        <View style={styles.timelineLine} />
                        <View style={[styles.dot, styles.dotDest]} />
                      </View>
                      <View style={styles.placesCol}>
                        <Text style={styles.placeText} numberOfLines={1}>
                          {viaje.origen}
                        </Text>
                        <Text style={styles.placeText} numberOfLines={1}>
                          {viaje.destino}
                        </Text>
                      </View>
                    </View>

                    {/* Pago pendiente si aplica */}
                    {!esConductor && viaje.reservaStatus === "pending" && (
                      <View style={styles.pagoPendienteBanner}>
                        <View style={styles.pagoPendienteLeft}>
                          <AlertCircle
                            size={14}
                            color={COLORS.warning}
                            strokeWidth={2.5}
                          />
                          <Text style={styles.pagoPendienteLabel}>
                            Pago de reserva pendiente
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.retomarPagoBtn}
                          onPress={() =>
                            onRetomarPago(viaje.id_reserva, viaje.id)
                          }
                          disabled={resumingPagoId === viaje.id_reserva}
                          activeOpacity={0.8}
                        >
                          {resumingPagoId === viaje.id_reserva ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <>
                              <CreditCard
                                size={12}
                                color={COLORS.white}
                                strokeWidth={2.5}
                              />
                              <Text style={styles.retomarPagoBtnText}>Pagar</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Footer con Metadatos y Acciones */}
                    <View style={styles.cardFooterRow}>
                      <View style={styles.metaInfoCol}>
                        <View style={styles.metaItem}>
                          <Clock
                            size={12}
                            color={COLORS.gray400}
                            strokeWidth={2.2}
                          />
                          <Text style={styles.metaItemText}>
                            Salida a las {formattedTime}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Users
                            size={12}
                            color={COLORS.gray400}
                            strokeWidth={2.2}
                          />
                          <Text style={styles.metaItemText} numberOfLines={1}>
                            {esConductor
                              ? `${viaje.disponible ?? 0} plazas libres`
                              : `Conductor: ${viaje.conductorName || "Conductor"}`}
                          </Text>
                        </View>
                      </View>

                      {/* Botonera de Acciones Post-Viaje */}
                      <View style={styles.actionsRight}>
                        {isFinalizado && (
                          <TouchableOpacity
                            style={styles.rateBtn}
                            onPress={(e) => handleRateTrip(viaje, e)}
                            activeOpacity={0.8}
                          >
                            <Star
                              size={12}
                              color={COLORS.warning}
                              strokeWidth={2.5}
                              fill={COLORS.warning}
                            />
                            <Text style={styles.rateBtnText}>Valorar</Text>
                          </TouchableOpacity>
                        )}

                        <ChevronRight
                          size={16}
                          color={COLORS.gray400}
                          strokeWidth={2.4}
                        />
                      </View>
                    </View>

                    {/* Desplegable de Pasajeros para el Conductor */}
                    {esConductor && (
                      <TouchableOpacity
                        style={styles.togglePasajerosBtn}
                        onPress={() => onTogglePasajeros(viaje.id)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.togglePasajerosLeft}>
                          <Users
                            size={14}
                            color={COLORS.primaryDark}
                            strokeWidth={2.2}
                          />
                          <Text style={styles.togglePasajerosText}>
                            {isExpanded
                              ? "Ocultar lista de pasajeros"
                              : "Ver pasajeros con reserva"}
                          </Text>
                        </View>
                        <ChevronDown
                          size={14}
                          color={COLORS.primaryDark}
                          strokeWidth={2.5}
                          style={{
                            transform: [
                              { rotate: isExpanded ? "180deg" : "0deg" },
                            ],
                          }}
                        />
                      </TouchableOpacity>
                    )}

                    {/* Contenido expandido de pasajeros */}
                    {esConductor && isExpanded && (
                      <View style={styles.pasajerosDrawer}>
                        {isPasajerosLoading ? (
                          <View style={styles.pasajerosLoading}>
                            <ActivityIndicator
                              size="small"
                              color={COLORS.primary}
                            />
                            <Text style={styles.pasajerosLoadingText}>
                              Cargando pasajeros...
                            </Text>
                          </View>
                        ) : pasajerosList.length > 0 ? (
                          pasajerosList.map((p, idx) => {
                            const nombre =
                              p.usuario?.nombre || p.nombre || "Pasajero";
                            const apellidos =
                              p.usuario?.apellidos || p.apellidos || "";
                            const imgPerfil =
                              p.usuario?.img_perfil || p.img_perfil;
                            const isPaid = p.status === "completed";

                            return (
                              <View
                                key={p.id_reserva || idx}
                                style={[
                                  styles.pasajeroRow,
                                  idx === pasajerosList.length - 1 &&
                                    styles.pasajeroRowLast,
                                ]}
                              >
                                {imgPerfil ? (
                                  <Image
                                    source={{ uri: imgPerfil }}
                                    style={styles.pasajeroAvatarImg}
                                  />
                                ) : (
                                  <View style={styles.pasajeroAvatarFallback}>
                                    <Text style={styles.pasajeroAvatarInitial}>
                                      {nombre.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                )}

                                <View style={styles.pasajeroInfoCol}>
                                  <Text
                                    style={styles.pasajeroName}
                                    numberOfLines={1}
                                  >
                                    {`${nombre} ${apellidos}`.trim()}
                                  </Text>
                                  <Text style={styles.pasajeroSeatText}>
                                    1 plaza reservada
                                  </Text>
                                </View>

                                <View
                                  style={[
                                    styles.pasajeroStatusChip,
                                    isPaid
                                      ? styles.pasajeroPaidChip
                                      : styles.pasajeroPendingChip,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.pasajeroStatusChipText,
                                      isPaid
                                        ? styles.pasajeroPaidText
                                        : styles.pasajeroPendingText,
                                    ]}
                                  >
                                    {isPaid ? "Pagado" : "Pendiente"}
                                  </Text>
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={styles.pasajerosEmptyText}>
                            No hay reservas de pasajeros registradas en este trayecto.
                          </Text>
                        )}
                      </View>
                    )}
                  </PressableScale>
                </AnimatedCardEntrance>
              );
            })}
          </View>
        ))
      )}

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  // Píldoras de Filtro
  filterPillsContainer: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  filterPillActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  filterPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: "800",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  errorCard: {
    alignItems: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    gap: SPACING.xs,
    ...SHADOWS.card,
  },
  errorTitle: {
    fontSize: FONTS.md,
    fontWeight: "800",
    color: COLORS.gray900,
    marginTop: 4,
  },
  errorSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    marginTop: SPACING.sm,
  },
  retryBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.white,
  },
  // Date Group
  dateGroup: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  dateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  dateGroupTitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  // Tarjeta de Viaje
  tripCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  tripCardEnCurso: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  tripCardCancelado: {
    opacity: 0.8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgesLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  roleBadgeDriver: {
    backgroundColor: COLORS.primarySoft,
  },
  roleBadgePassenger: {
    backgroundColor: COLORS.secondarySoft,
  },
  roleBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
  roleBadgeTextDriver: {
    color: COLORS.primaryDark,
  },
  roleBadgeTextPassenger: {
    color: COLORS.secondaryDark,
  },
  statusBadgeEnCurso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  statusTextEnCurso: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.white,
  },
  statusBadgeFinalizado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  statusTextFinalizado: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  statusBadgeCancelado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.errorSoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  statusTextCancelado: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.error,
  },
  statusBadgePendiente: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  statusTextPendiente: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.warning,
  },
  pricePill: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  pricePillText: {
    fontSize: FONTS.sm,
    lineHeight: 18,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  // Route Section
  routeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
    paddingVertical: 2,
  },
  timelineCol: {
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOrigin: {
    backgroundColor: COLORS.success,
  },
  dotDest: {
    backgroundColor: COLORS.error,
  },
  timelineLine: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.gray200,
    marginVertical: 2,
  },
  placesCol: {
    flex: 1,
    gap: SPACING.xs + 2,
  },
  placeText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  // Pago Pendiente
  pagoPendienteBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  pagoPendienteLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pagoPendienteLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.warning,
  },
  retomarPagoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  retomarPagoBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.white,
  },
  // Card Footer
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: SPACING.sm,
  },
  metaInfoCol: {
    gap: 2,
    flex: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaItemText: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  rateBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.warning,
  },
  // Toggle Pasajeros
  togglePasajerosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginTop: 2,
  },
  togglePasajerosLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  togglePasajerosText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  pasajerosDrawer: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  pasajerosLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.sm,
  },
  pasajerosLoadingText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
  },
  pasajeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  pasajeroRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  pasajeroAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  pasajeroAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pasajeroAvatarInitial: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  pasajeroInfoCol: {
    flex: 1,
  },
  pasajeroName: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  pasajeroSeatText: {
    fontSize: 10,
    color: COLORS.gray400,
  },
  pasajeroStatusChip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pasajeroPaidChip: {
    backgroundColor: COLORS.successSoft,
  },
  pasajeroPendingChip: {
    backgroundColor: COLORS.warningSoft,
  },
  pasajeroStatusChipText: {
    fontSize: 9,
    fontWeight: "800",
  },
  pasajeroPaidText: {
    color: COLORS.success,
  },
  pasajeroPendingText: {
    color: COLORS.warning,
  },
  pasajerosEmptyText: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    textAlign: "center",
    paddingVertical: 4,
  },
});

export default HistorialSection;
