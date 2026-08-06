// YouConnext - Event Card Component
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  MapPin,
  Ticket,
  Tag,
  ChevronRight,
  CalendarDays,
  Building2,
  CheckCircle2,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const formatEventDate = (startDate, endDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;

  const optsDate = { day: "numeric", month: "short" };
  const optsTime = { hour: "2-digit", minute: "2-digit" };

  let label = start.toLocaleDateString("es-ES", optsDate);
  const startTime = start.toLocaleTimeString("es-ES", optsTime);

  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      const startDay = start.toDateString();
      const endDay = end.toDateString();
      if (startDay === endDay) {
        const endTime = end.toLocaleTimeString("es-ES", optsTime);
        label += ` · ${startTime} - ${endTime}`;
      } else {
        const endLabel = end.toLocaleDateString("es-ES", optsDate);
        label += ` - ${endLabel}`;
      }
      return label;
    }
  }

  label += ` · ${startTime}`;
  return label;
};

const EventCard = ({ event, onPress, featured, joinedAt }) => {
  const tags = event.tags || [];
  const companyName = event.company?.name || "";
  const distanceKm = event.distance_km;
  const hasImage = event.image && event.image.length > 100;
  const dateLabel = formatEventDate(event.start_date, event.end_date);
  const joinedLabel = joinedAt
    ? new Date(joinedAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      })
    : null;

  if (featured) {
    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {hasImage ? (
          <Image
            source={{
              uri: event.image.startsWith("data:")
                ? event.image
                : `data:image/jpeg;base64,${event.image}`,
            }}
            style={styles.featuredImage}
          />
        ) : (
          <View style={styles.featuredImagePlaceholder}>
            <Tag size={40} color={COLORS.gray300} strokeWidth={1.5} />
          </View>
        )}
        <View style={styles.featuredOverlay} />
        <View style={styles.featuredGradientBottom} />
        <View style={styles.featuredContent}>
          {companyName ? (
            <View style={styles.featuredCompanyBadge}>
              <Building2 size={12} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.featuredCompanyText}>{companyName}</Text>
            </View>
          ) : null}
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {event.name}
          </Text>
          {event.description ? (
            <Text style={styles.featuredDescription} numberOfLines={2}>
              {event.description}
            </Text>
          ) : null}
          {dateLabel && (
            <View style={styles.featuredDate}>
              <CalendarDays size={14} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.featuredDateText}>{dateLabel}</Text>
            </View>
          )}
          <View style={styles.featuredFooter}>
            {distanceKm != null && (
              <View style={styles.featuredDistance}>
                <MapPin size={14} color={COLORS.white} strokeWidth={2.5} />
                <Text style={styles.featuredDistanceText}>
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m`
                    : `${distanceKm.toFixed(1)} km`}
                </Text>
              </View>
            )}
            {tags.length > 0 && (
              <View style={styles.featuredTags}>
                {tags.slice(0, 2).map((t, i) => (
                  <View key={i} style={styles.featuredTag}>
                    <Text style={styles.featuredTagText}>
                      {t.tag?.name || t.name || ""}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {hasImage ? (
        <Image
          source={{
            uri: event.image.startsWith("data:")
              ? event.image
              : `data:image/jpeg;base64,${event.image}`,
          }}
          style={styles.cardImage}
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Tag size={24} color={COLORS.gray300} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {event.name}
          </Text>
          {joinedLabel && (
            <View style={styles.joinedBadge}>
              <CheckCircle2
                size={11}
                color={COLORS.primary}
                strokeWidth={2.5}
              />
              <Text style={styles.joinedBadgeText}>{joinedLabel}</Text>
            </View>
          )}
        </View>
        {companyName ? (
          <View style={styles.cardCompanyRow}>
            <Building2 size={11} color={COLORS.gray400} strokeWidth={2.5} />
            <Text style={styles.cardCompany} numberOfLines={1}>
              {companyName}
            </Text>
          </View>
        ) : null}
        {tags.length > 0 && (
          <View style={styles.cardTags}>
            {tags.slice(0, 2).map((t, i) => (
              <View key={i} style={styles.cardTag}>
                <Text style={styles.cardTagText}>
                  {t.tag?.name || t.name || ""}
                </Text>
              </View>
            ))}
          </View>
        )}
        {(dateLabel || distanceKm != null) && (
          <View style={styles.cardMeta}>
            {dateLabel && (
              <>
                <CalendarDays
                  size={12}
                  color={COLORS.gray400}
                  strokeWidth={2.5}
                />
                <Text style={styles.cardMetaText}>{dateLabel}</Text>
              </>
            )}
            {dateLabel && distanceKm != null && (
              <View style={styles.cardMetaDot} />
            )}
            {distanceKm != null && (
              <>
                <MapPin size={12} color={COLORS.gray400} strokeWidth={2.5} />
                <Text style={styles.cardMetaText}>
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m`
                    : `${distanceKm.toFixed(1)} km`}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
      <ChevronRight size={18} color={COLORS.gray300} strokeWidth={2.5} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Featured (hero) card
  featuredCard: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  featuredImage: {
    width: "100%",
    height: 200,
  },
  featuredImagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  featuredGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  featuredContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
  },
  featuredCompanyBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.xs,
    gap: 4,
  },
  featuredCompanyText: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    fontWeight: "600",
  },
  featuredTitle: {
    fontSize: FONTS.xxl,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: FONTS.sm,
    color: "rgba(255,255,255,0.85)",
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  featuredDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: SPACING.xs,
  },
  featuredDateText: {
    fontSize: FONTS.xs,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredDistance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredDistanceText: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    fontWeight: "600",
  },
  featuredTags: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  featuredTag: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  featuredTagText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: "600",
  },
  // Compact card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
  },
  cardImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    marginLeft: SPACING.md,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
    flexShrink: 1,
  },
  joinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  joinedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cardCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardCompany: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
  },
  cardTags: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  cardTag: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  cardTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  cardMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    marginHorizontal: 2,
  },
});

export default EventCard;
