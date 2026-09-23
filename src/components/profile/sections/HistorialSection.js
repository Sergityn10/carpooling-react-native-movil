import React from "react";
import {
  View,
  Text,
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
} from "lucide-react-native";
import { COLORS, SPACING } from "../../../constants";
import styles from "../profileStyles";
import SubViewHeader from "./SubViewHeader";

const HistorialSection = ({
  viajes,
  loadingViajes,
  errorViajes,
  expandedViajeId,
  viajePasajeros,
  loadingPasajeros,
  resumingPagoId,
  navigation,
  onRetry,
  onTogglePasajeros,
  onRetomarPago,
  onBack,
}) => {
  const agruparViajesPorFecha = (listaViajes) => {
    const grupos = {};
    listaViajes.forEach((viaje) => {
      if (!viaje.hora) return;
      const fechaObj = new Date(viaje.hora);

      if (isNaN(fechaObj.getTime())) {
        const desc = "Fecha por confirmar";
        if (!grupos[desc]) grupos[desc] = [];
        grupos[desc].push(viaje);
        return;
      }

      const hoy = new Date();
      const mañana = new Date();
      mañana.setDate(hoy.getDate() + 1);

      let fechaLegible = "";
      if (fechaObj.toDateString() === hoy.toDateString()) {
        fechaLegible = "Hoy";
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
  };

  if (loadingViajes) {
    return (
      <ScrollView
        style={styles.sectionContent}
        showsVerticalScrollIndicator={false}
      >
        <SubViewHeader title="Historial de trayectos" onBack={onBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tus viajes...</Text>
        </View>
      </ScrollView>
    );
  }

  if (errorViajes) {
    return (
      <ScrollView
        style={styles.sectionContent}
        showsVerticalScrollIndicator={false}
      >
        <SubViewHeader title="Historial de trayectos" onBack={onBack} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorViajes}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (viajes.length === 0) {
    return (
      <ScrollView
        style={styles.sectionContent}
        showsVerticalScrollIndicator={false}
      >
        <SubViewHeader title="Historial de trayectos" onBack={onBack} />
        <View style={styles.centerContainer}>
          <View style={styles.placeholderIconBg}>
            <Route size={40} color={COLORS.gray300} strokeWidth={1.5} />
          </View>
          <Text style={styles.placeholderTitle}>Sin viajes programados</Text>
          <Text style={styles.placeholderSubtitle}>
            Aun no tienes trayectos publicados ni reservas de viaje activas.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const viajesAgrupados = agruparViajesPorFecha(viajes);
  const keys = Object.keys(viajesAgrupados);

  return (
    <ScrollView
      style={styles.sectionContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.viajesScrollContent}
    >
      <SubViewHeader title="Historial de trayectos" onBack={onBack} />
      {keys.map((fecha) => (
        <View key={fecha} style={styles.fechaGrupoContainer}>
          <Text style={styles.fechaGrupoTitulo}>{fecha}</Text>
          {viajesAgrupados[fecha].map((viaje) => {
            const esConductor = viaje.rol === "conductor";
            const isEnCurso =
              viaje.status === "en curso" || viaje.status === "activo";
            const formattedTime = viaje.hora
              ? new Date(viaje.hora).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--";

            return (
              <View key={viaje.keyId} style={styles.viajeCard}>
                <TouchableOpacity
                  onPress={() => {
                    if (isEnCurso) {
                      navigation.navigate("ViajeEnCurso", {
                        viaje: viaje.originalData,
                      });
                    } else if (esConductor) {
                      navigation.navigate("ViajeDetalle", {
                        viaje: viaje.originalData,
                      });
                    } else {
                      navigation.navigate("MiViaje", {
                        viaje: viaje.originalData,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {/* Card Header */}
                  <View style={styles.viajeCardHeader}>
                    <View style={styles.badgeWrapper}>
                      <View
                        style={[
                          styles.rolBadge,
                          esConductor
                            ? styles.conductorBadge
                            : styles.pasajeroBadge,
                        ]}
                      >
                        {esConductor ? (
                          <Car
                            size={12}
                            color={COLORS.primary}
                            strokeWidth={2.5}
                          />
                        ) : (
                          <UserIcon
                            size={12}
                            color={COLORS.secondary}
                            strokeWidth={2.5}
                          />
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

                      {/* Estado del trayecto */}
                      <View
                        style={[
                          styles.statusBadge,
                          viaje.status === "finalizado"
                            ? styles.successStatusBadge
                            : isEnCurso
                              ? styles.activeStatusBadge
                              : styles.pendingStatusBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            viaje.status === "finalizado"
                              ? styles.successStatusBadgeText
                              : isEnCurso
                                ? styles.activeStatusBadgeText
                                : styles.pendingStatusBadgeText,
                          ]}
                        >
                          {viaje.status.charAt(0).toUpperCase() +
                            viaje.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.viajePrice}>
                      {viaje.precio_conductor != null
                        ? `${viaje.precio_conductor}€`
                        : viaje.precio != null
                          ? `${viaje.precio}€`
                          : "Gratis"}
                    </Text>
                  </View>

                  {/* Card Route */}
                  <View style={styles.viajeCardRoute}>
                    <View style={styles.routeTimeline}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: COLORS.primary },
                        ]}
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
                        {viaje.origen}
                      </Text>
                      <Text style={styles.routePlaceText} numberOfLines={1}>
                        {viaje.destino}
                      </Text>
                    </View>
                  </View>

                  {/* Pago pendiente (solo pasajeros con reserva pending) */}
                  {!esConductor && viaje.reservaStatus === "pending" && (
                    <View style={styles.pagoPendienteBanner}>
                      <View style={styles.pagoPendienteInfo}>
                        <AlertCircle
                          size={16}
                          color={COLORS.warning}
                          strokeWidth={2.5}
                        />
                        <Text style={styles.pagoPendienteText}>
                          Pago pendiente
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.retornarPagoBtn}
                        onPress={() =>
                          onRetomarPago(viaje.id_reserva, viaje.id)
                        }
                        disabled={resumingPagoId === viaje.id_reserva}
                        activeOpacity={0.8}
                      >
                        {resumingPagoId === viaje.id_reserva ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                        ) : (
                          <>
                            <CreditCard
                              size={14}
                              color={COLORS.white}
                              strokeWidth={2.5}
                            />
                            <Text style={styles.retornarPagoBtnText}>
                              Retomar pago
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Card Footer */}
                  <View style={styles.viajeCardFooter}>
                    <View style={styles.footerInfoRow}>
                      <View style={styles.footerInfoItem}>
                        <Clock
                          size={14}
                          color={COLORS.gray500}
                          strokeWidth={2}
                        />
                        <Text style={styles.footerInfoText}>
                          {formattedTime} h
                        </Text>
                      </View>

                      <View style={styles.footerInfoItem}>
                        <Users
                          size={14}
                          color={COLORS.gray500}
                          strokeWidth={2}
                        />
                        <Text style={styles.footerInfoText} numberOfLines={1}>
                          {esConductor
                            ? `${viaje.disponible || 0} plazas libres`
                            : `Con: ${viaje.conductorName}`}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight
                      size={16}
                      color={COLORS.gray400}
                      strokeWidth={2.5}
                    />
                  </View>
                </TouchableOpacity>

                {/* Ver pasajeros (solo conductor) */}
                {esConductor && (
                  <TouchableOpacity
                    style={styles.verPasajerosBtn}
                    onPress={() => onTogglePasajeros(viaje.id)}
                    activeOpacity={0.7}
                  >
                    <Users size={16} color={COLORS.primary} strokeWidth={2.5} />
                    <Text style={styles.verPasajerosText}>
                      {expandedViajeId === viaje.id
                        ? "Ocultar pasajeros"
                        : "Ver pasajeros"}
                    </Text>
                    <ChevronRight
                      size={14}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                      style={{
                        transform: [
                          {
                            rotate:
                              expandedViajeId === viaje.id ? "90deg" : "0deg",
                          },
                        ],
                      }}
                    />
                  </TouchableOpacity>
                )}

                {/* Lista de pasajeros expandible */}
                {esConductor && expandedViajeId === viaje.id && (
                  <View style={styles.pasajerosExpandible}>
                    {loadingPasajeros[viaje.id] ? (
                      <View style={styles.pasajerosLoading}>
                        <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                        />
                        <Text style={styles.pasajerosLoadingText}>
                          Cargando pasajeros...
                        </Text>
                      </View>
                    ) : viajePasajeros[viaje.id]?.length > 0 ? (
                      viajePasajeros[viaje.id].map((p, idx) => {
                        const nombre =
                          p.usuario?.nombre || p.nombre || "Pasajero";
                        const apellidos =
                          p.usuario?.apellidos || p.apellidos || "";
                        const imgPerfil = p.usuario?.img_perfil || p.img_perfil;
                        return (
                          <View
                            key={p.id_reserva || idx}
                            style={styles.pasajeroRow}
                          >
                            <View style={styles.pasajeroAvatar}>
                              {imgPerfil ? (
                                <Image
                                  source={{ uri: imgPerfil }}
                                  style={styles.pasajeroAvatarImg}
                                />
                              ) : (
                                <Text style={styles.pasajeroAvatarText}>
                                  {nombre?.charAt(0) || "?"}
                                </Text>
                              )}
                            </View>
                            <View style={styles.pasajeroInfo}>
                              <Text style={styles.pasajeroNombre}>
                                {`${nombre} ${apellidos}`.trim()}
                              </Text>
                              <View
                                style={[
                                  styles.pasajeroStatusBadge,
                                  p.status === "completed"
                                    ? styles.pasajeroStatusCompleted
                                    : p.status === "pending"
                                      ? styles.pasajeroStatusPending
                                      : styles.pasajeroStatusOther,
                                ]}
                              >
                                <Text style={styles.pasajeroStatusText}>
                                  {p.status === "completed"
                                    ? "Pago completado"
                                    : p.status === "pending"
                                      ? "Pago pendiente"
                                      : p.status || "Desconocido"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.pasajerosEmpty}>
                        No hay pasajeros con reserva activa
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
};

export default HistorialSection;
