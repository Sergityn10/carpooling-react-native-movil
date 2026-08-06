// YouConnext - Event Location Component
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";
import { COLORS, SPACING, FONTS } from "../../constants";

const EventLocation = ({ latitude, longitude }) => {
  if (!latitude || !longitude) return null;

  const lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
  const lng = typeof longitude === "number" ? longitude : parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ubicación</Text>
      <View style={styles.locationRow}>
        <MapPin size={18} color={COLORS.primary} strokeWidth={2.5} />
        <Text style={styles.locationText}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.md,
    fontWeight: "bold",
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  locationText: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
  },
});

export default EventLocation;
