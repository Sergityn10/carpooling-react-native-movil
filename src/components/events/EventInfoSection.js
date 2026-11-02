// YouConnext - Event Info Section Component (Modern UX/UI)
import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Building2, CalendarDays, MapPin, Navigation, Clock } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const formatEventDateRange = (startDate, endDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;

  const optsDate = { day: "numeric", month: "short", year: "numeric" };
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

const EventInfoSection = ({
  name,
  company,
  tags,
  startDate,
  endDate,
  address,
  latitude,
  longitude,
  onOpenMaps,
}) => {
  const companyName = company?.name || "";
  const tagList = tags || [];
  const dateLabel = formatEventDateRange(startDate, endDate);
  const statusBadge = useMemo(
    () => getEventStatusBadge(startDate, endDate),
    [startDate, endDate]
  );

  const handleOpenGps = () => {
    if (onOpenMaps) {
      onOpenMaps();
      return;
    }
    const lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
    const lng = typeof longitude === "number" ? longitude : parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
      const label = encodeURIComponent(name || "Evento");
      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      });
      Linking.openURL(url).catch(() => {});
    }
  };

  const hasCoords = useMemo(() => {
    const lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
    const lng = typeof longitude === "number" ? longitude : parseFloat(longitude);
    return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
  }, [latitude, longitude]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {companyName ? (
          <View style={styles.companyBadge}>
            <Building2 size={13} color={COLORS.primaryDark} strokeWidth={2.5} />
            <Text style={styles.companyName} numberOfLines={1}>
              {companyName}
            </Text>
          </View>
        ) : <View />}

        {statusBadge && (
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
            <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.eventName}>{name}</Text>

      <View style={styles.metaCol}>
        {dateLabel ? (
          <View style={styles.metaItem}>
            <View style={styles.iconBox}>
              <CalendarDays
                size={16}
                color={COLORS.primary}
                strokeWidth={2.2}
              />
            </View>
            <View style={styles.metaTextCol}>
              <Text style={styles.metaLabel}>Fecha y horario</Text>
              <Text style={styles.metaValue}>{dateLabel}</Text>
            </View>
          </View>
        ) : null}

        {address ? (
          <View style={styles.metaItem}>
            <View style={styles.iconBox}>
              <MapPin size={16} color={COLORS.secondary} strokeWidth={2.2} />
            </View>
            <View style={styles.metaTextCol}>
              <Text style={styles.metaLabel}>Ubicación / Sede</Text>
              <Text style={styles.metaValue} numberOfLines={2}>
                {address}
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
        ) : null}
      </View>

      {tagList.length > 0 && (
        <View style={styles.tagsRow}>
          {tagList.map((t, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>
                #{t.tag?.name || t.name || ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  companyBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  companyName: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  eventName: {
    fontSize: FONTS.xxl,
    lineHeight: 30,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  metaCol: {
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.sm + 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  metaTextCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.gray400,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    color: COLORS.gray800,
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
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    color: COLORS.gray600,
    fontWeight: "600",
  },
});

export default EventInfoSection;

