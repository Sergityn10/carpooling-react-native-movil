// YouConnext - Event Links Component
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Globe, Ticket, ExternalLink } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";

const EventLinks = ({ url, ticketUrl, onOpenUrl }) => {
  if (!url && !ticketUrl) return null;

  return (
    <View style={styles.container}>
      {ticketUrl && (
        <TouchableOpacity
          style={[styles.btn, styles.btnTicket]}
          onPress={() => onOpenUrl(ticketUrl)}
          activeOpacity={0.85}
        >
          <Ticket size={16} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.btnTicketText}>Comprar entradas</Text>
          <ExternalLink size={14} color={COLORS.white} strokeWidth={2.2} />
        </TouchableOpacity>
      )}

      {url && (
        <TouchableOpacity
          style={[styles.btn, styles.btnWeb]}
          onPress={() => onOpenUrl(url)}
          activeOpacity={0.85}
        >
          <Globe size={16} color={COLORS.gray700} strokeWidth={2.2} />
          <Text style={styles.btnWebText}>Sitio web oficial</Text>
          <ExternalLink size={14} color={COLORS.gray500} strokeWidth={2.2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
  },
  btnTicket: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  btnTicketText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
  btnWeb: {
    backgroundColor: COLORS.gray100,
  },
  btnWebText: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.gray800,
  },
});

export default EventLinks;
