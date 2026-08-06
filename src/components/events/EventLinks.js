// YouConnext - Event Links Component (compact chips)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Globe, Ticket } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS } from "../../constants";

const EventLinks = ({ url, ticketUrl, onOpenUrl }) => {
  if (!url && !ticketUrl) return null;

  return (
    <View style={styles.container}>
      {url && (
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onOpenUrl(url)}
          activeOpacity={0.7}
        >
          <Globe size={14} color={COLORS.secondary} strokeWidth={2.5} />
          <Text style={styles.chipText}>Sitio web</Text>
        </TouchableOpacity>
      )}
      {ticketUrl && (
        <TouchableOpacity
          style={[styles.chip, styles.chipTicket]}
          onPress={() => onOpenUrl(ticketUrl)}
          activeOpacity={0.7}
        >
          <Ticket size={14} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={[styles.chipText, styles.chipTextTicket]}>Entradas</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  chipTicket: {
    backgroundColor: COLORS.primarySoft,
  },
  chipText: {
    fontSize: FONTS.xs,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  chipTextTicket: {
    color: COLORS.primary,
  },
});

export default EventLinks;
