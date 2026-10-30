// YouConnext - TripMiniCard (Guía de Estilo v2, Pág. 5)
// Anatomía oficial de 4 bloques: Conductor con verificación, Línea visual verde-ámbar, Precio/plazas y botón Reservar
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Star, BadgeCheck } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";
import RouteLine from "../common/RouteLine";
import Button from "../common/Button";
import {
  getTripDriverName,
  getTripDriverAvatar,
  getTripDriverId,
} from "../../utils";
import userCache from "../../services/messages/userCache";

const TripMiniCard = ({ viaje, dateLabel, timeLabel, onPress }) => {
  const seats = viaje?.disponible ?? viaje?.plazas ?? 3;
  const isFree = Number(viaje?.precio) === 0;
  const priceDisplay = isFree
    ? "Gratis"
    : `${Number(viaje?.precio || 3).toFixed(2).replace(".", ",")} €`;

  const [driverName, setDriverName] = useState(() => getTripDriverName(viaje, "Conductor"));
  const [driverAvatar, setDriverAvatar] = useState(() => getTripDriverAvatar(viaje));

  useEffect(() => {
    const currentName = getTripDriverName(viaje, "Conductor");
    const currentAvatar = getTripDriverAvatar(viaje);
    setDriverName(currentName);
    setDriverAvatar(currentAvatar);

    // Si aún no se ha resuelto el nombre descifrado del conductor, resolverlo desde el userCache
    if (currentName === "Conductor" || !currentAvatar) {
      const dId = getTripDriverId(viaje);
      if (dId) {
        userCache
          .resolve(dId)
          .then((user) => {
            if (user) {
              const fullName = `${user.name || user.nombre || ""}${user.surname ? " " + user.surname : ""}`.trim();
              if (fullName) {
                setDriverName(fullName);
              }
              if (user.img_perfil && !currentAvatar) {
                setDriverAvatar(user.img_perfil);
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [viaje]);

  const conductor = viaje?.conductor || {};
  const conductorRating =
    viaje?.valoracion_media ||
    viaje?.conductorRating ||
    conductor.rating ||
    conductor.valoracion ||
    "4,8";
  const initial = (driverName || "C").charAt(0).toUpperCase();

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      scaleTo={0.98}
      accessibilityLabel={`Viaje con ${driverName} de ${viaje?.origen} a ${viaje?.destino}`}
    >
      {/* 1. Bloque Conductor: Avatar, Nombre descifrado, Estrella y Verificación (Pág. 5) */}
      <View style={styles.driverRow}>
        <View style={styles.driverLeft}>
          {driverAvatar ? (
            <Image source={{ uri: driverAvatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.driverInfoText}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName} numberOfLines={1}>
                {driverName}
              </Text>
              <View style={styles.ratingBadge}>
                <Star size={12} color="#F2A33C" fill="#F2A33C" />
                <Text style={styles.ratingText}>{conductorRating}</Text>
              </View>
            </View>
            <View style={styles.verifiedRow}>
              <BadgeCheck size={13} color={BRAND.greenOnLight} strokeWidth={2.4} />
              <Text style={styles.verifiedText}>Conductor verificado</Text>
            </View>
          </View>
        </View>

        {/* Precio por plaza visible sin entrar */}
        <View style={styles.priceCol}>
          <Text style={styles.priceAmount}>{priceDisplay}</Text>
          <Text style={styles.priceSub}>por plaza</Text>
        </View>
      </View>

      {/* 2. La ruta como línea: punto verde (origen), línea, punto ámbar (destino) */}
      <View style={styles.routeSection}>
        <RouteLine
          origen={viaje?.origen || "Origen"}
          destino={viaje?.destino || "Destino"}
          horaSalida={timeLabel || viaje?.hora_salida || "18:30"}
          horaVuelta={viaje?.vuelta ? "Vuelta al terminar" : undefined}
        />
      </View>

      {/* 3 y 4. Plazas libres y Un solo botón: "Reservar plaza" */}
      <View style={styles.actionRow}>
        <Text style={styles.seatsAvailable}>
          {seats} {seats === 1 ? "plaza libre" : "plazas libres"}
        </Text>

        <Button
          title="Reservar plaza"
          onPress={onPress}
          variant="primary"
          size="small"
          style={styles.reserveButton}
        />
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card, // 16px
    padding: SPACING.cardPadding, // 16px
    marginBottom: SPACING.cardGap, // 12px
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card, // 0 2 8 con 8%
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  driverLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1D2522",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F3A36",
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1D2522",
  },
  avatarInitial: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 14,
    fontWeight: "800",
    color: "#F2F5F4",
  },
  driverInfoText: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driverName: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.black,
    flexShrink: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  ratingText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.black,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  verifiedText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: BRAND.greenOnLight,
    fontWeight: "600",
  },
  priceCol: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 18,
    fontWeight: "800",
    color: BRAND.black,
    letterSpacing: -0.4,
  },
  priceSub: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 11,
    color: COLORS.gray600,
  },
  routeSection: {
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#F4FAF6",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEF5F0",
  },
  seatsAvailable: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.greenOnLight, // #0B7A3B
  },
  reserveButton: {
    minWidth: 130,
  },
});

export default TripMiniCard;
