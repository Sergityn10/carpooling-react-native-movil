// YouConnext - Event Description Component
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONTS } from "../../constants";

const EventDescription = ({ description }) => {
  if (!description) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Descripción</Text>
      <Text style={styles.descriptionText}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray800,
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    lineHeight: 22,
  },
});

export default EventDescription;
