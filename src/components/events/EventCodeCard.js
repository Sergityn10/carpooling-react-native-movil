// YouConnext - Event Code Card Component
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Copy, Check } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS } from "../../constants";

const EventCodeCard = ({ code, onCopy }) => {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handlePress = () => {
    if (onCopy) onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.codeCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.textGroup}>
          <Text style={styles.codeLabel}>CÓDIGO DEL EVENTO</Text>
          <Text style={styles.codeValue}>{code}</Text>
        </View>
        <View style={[styles.copyBtn, copied && styles.copyBtnSuccess]}>
          {copied ? (
            <Check size={14} color={COLORS.white} strokeWidth={2.5} />
          ) : (
            <Copy size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
          )}
          <Text
            style={[styles.copyBtnText, copied && styles.copyBtnTextSuccess]}
          >
            {copied ? "Copiado" : "Copiar"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1.5,
    borderColor: "rgba(13, 159, 110, 0.25)",
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  textGroup: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 9,
    lineHeight: 12,
    color: COLORS.primaryDark,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  codeValue: {
    fontSize: FONTS.md,
    lineHeight: 22,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: 1.2,
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  copyBtnSuccess: {
    backgroundColor: COLORS.success,
  },
  copyBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  copyBtnTextSuccess: {
    color: COLORS.white,
  },
});

export default EventCodeCard;
