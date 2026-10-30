// YouConnext - EventMiniCard (Guía de Estilo v2, Pág. 5 y 7)
// Categoría en ámbar, cabecera negra si no hay foto, contador de viajes/plazas
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { MapPin, Calendar } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";
import Chip from "../common/Chip";

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const formatEventDate = (startDate) => {
  if (!startDate) return "";
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const EventMiniCard = ({
  event,
  tieneViaje,
  onPress,
  onSearchTrip,
  onOfferSeats,
}) => {
  const hasImage = event.image && event.image.length > 100;
  const category = (event.category || event.tipo || "Evento").toUpperCase();
  const dateStr = formatEventDate(event.start_date || event.fecha);
  const locationStr = event.location || event.lugar || event.recinto || "Recinto principal";
  const tripsCount = event.total_viajes ?? event.viajes_count ?? (tieneViaje ? 1 : 0);
  const seatsCount = event.total_plazas ?? event.plazas_count ?? (tripsCount * 3);

  const hasTrips = tripsCount > 0;
  const isFewSeats = hasTrips && seatsCount <= 3;

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      scaleTo={0.97}
      accessibilityLabel={`Evento ${event.name}`}
    >
      {/* Cabecera: Foto real o cabecera negra estructurada (Pág. 5) */}
      <View style={styles.mediaContainer}>
        {hasImage ? (
          <Image
            source={{
              uri: event.image.startsWith("data:")
                ? event.image
                : `data:image/jpeg;base64,${event.image}`,
            }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.blackHeader}>
            <Text style={styles.recintoText} numberOfLines={1}>
              {locationStr}
            </Text>
          </View>
        )}

        {/* Badge de categoría oficial en ámbar (Pág. 5 y 7) */}
        <View style={styles.badgeTopLeft}>
          <View style={styles.amberCategoryBadge}>
            <Text style={styles.amberCategoryText}>{category}</Text>
          </View>
        </View>

        {/* Indicador de urgencia si quedan pocas plazas */}
        {isFewSeats && (
          <View style={styles.badgeTopRight}>
            <Chip label="quedan pocas" variant="amber" size="small" />
          </View>
        )}
      </View>

      {/* Cuerpo de la tarjeta */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {event.name}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {locationStr} {dateStr ? `· ${dateStr}` : ""}
          </Text>
        </View>

        {/* Fila de impacto: viajes/plazas o llamada a publicar el primero */}
        <View style={styles.bottomRow}>
          {hasTrips ? (
            <Text style={styles.tripsStats}>
              {tripsCount} {tripsCount === 1 ? "viaje" : "viajes"} · {seatsCount} {seatsCount === 1 ? "plaza" : "plazas"}
            </Text>
          ) : (
            <PressableScale onPress={onOfferSeats} scaleTo={0.96}>
              <Text style={styles.firstTripPrompt}>
                Sé el primero en publicar viaje →
              </Text>
            </PressableScale>
          )}

          <Text style={styles.viewTripsLink}>Ver</Text>
        </View>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 250,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card, // 16px
    marginRight: SPACING.cardGap, // 12px
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.card, // 0 2 8 al 8%
  },
  mediaContainer: {
    height: 105,
    backgroundColor: BRAND.black,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  blackHeader: {
    width: "100%",
    height: "100%",
    backgroundColor: BRAND.black,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingTop: 24,
  },
  recintoText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "700",
    color: "#A7B2AE",
  },
  badgeTopLeft: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  amberCategoryBadge: {
    backgroundColor: BRAND.accent, // #F2A33C
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amberCategoryText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 10,
    fontWeight: "800",
    color: BRAND.black,
    letterSpacing: 0.5,
  },
  badgeTopRight: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  body: {
    padding: SPACING.cardPadding, // 16px
  },
  title: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 15, // Sora 600 / 15
    lineHeight: 20,
    fontWeight: "700",
    color: BRAND.black,
    marginBottom: 4,
  },
  metaRow: {
    marginBottom: 10,
  },
  metaText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.gray600,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEF5F0",
  },
  tripsStats: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.greenOnLight, // #0B7A3B
  },
  firstTripPrompt: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.greenOnLight,
  },
  viewTripsLink: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.black,
  },
});

export default EventMiniCard;
