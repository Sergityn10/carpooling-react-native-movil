// YouConnext - Event Info Section Component (title, company, tags)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Building2, CalendarDays } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const formatEventDateRange = (startDate, endDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;

  const optsDate = { day: "numeric", month: "long", year: "numeric" };
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

const EventInfoSection = ({ name, company, tags, startDate, endDate }) => {
  const companyName = company?.name || "";
  const tagList = tags || [];
  const dateLabel = formatEventDateRange(startDate, endDate);

  return (
    <View style={styles.titleSection}>
      <Text style={styles.eventName}>{name}</Text>
      {companyName ? (
        <View style={styles.companyRow}>
          <Building2 size={16} color={COLORS.gray500} strokeWidth={2.5} />
          <Text style={styles.companyName}>{companyName}</Text>
        </View>
      ) : null}
      {dateLabel ? (
        <View style={styles.dateRow}>
          <CalendarDays size={16} color={COLORS.gray500} strokeWidth={2.5} />
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>
      ) : null}

      {tagList.length > 0 && (
        <View style={styles.tagsRow}>
          {tagList.map((t, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{t.tag?.name || t.name || ""}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  titleSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  eventName: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 4,
  },
  dateText: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  companyName: {
    fontSize: FONTS.sm,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: FONTS.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default EventInfoSection;
