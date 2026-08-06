// YouConnext - Event Code Card Component
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Copy } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS } from "../../constants";

const EventCodeCard = ({ code, onCopy }) => {
  if (!code) return null;

  return (
    <TouchableOpacity
      style={styles.codeCard}
      onPress={onCopy}
      activeOpacity={0.7}
    >
      <Text style={styles.codeLabel}>Código</Text>
      <Text style={styles.codeValue}>{code}</Text>
      <Copy size={14} color={COLORS.gray400} strokeWidth={2.5} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  codeLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray400,
    fontWeight: "500",
  },
  codeValue: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray600,
    letterSpacing: 1,
  },
});

export default EventCodeCard;
