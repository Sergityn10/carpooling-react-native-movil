// YouConnext - Event Info Section Component (Modern UX/UI)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Building2, CalendarDays, MapPin } from "lucide-react-native";
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

const EventInfoSection = ({
  name,
  company,
  tags,
  startDate,
  endDate,
  address,
}) => {
  const companyName = company?.name || "";
  const tagList = tags || [];
  const dateLabel = formatEventDateRange(startDate, endDate);

  return (
    <View style={styles.card}>
      {companyName ? (
        <View style={styles.companyBadge}>
          <Building2 size={13} color={COLORS.primaryDark} strokeWidth={2.5} />
          <Text style={styles.companyName} numberOfLines={1}>
            {companyName}
          </Text>
        </View>
      ) : null}

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
              <Text style={styles.metaLabel}>Ubicación</Text>
              <Text style={styles.metaValue} numberOfLines={2}>
                {address}
              </Text>
            </View>
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
  companyBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  companyName: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.primaryDark,
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
