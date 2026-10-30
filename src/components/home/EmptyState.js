// YouConnext - EmptyState (Guía de Estilo v2, Pág. 6)
// "Un estado vacío nunca es un callejón sin salida: siempre propone el siguiente paso"
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import Button from "../common/Button";

const EmptyState = ({
  icon: Icon,
  tint = BRAND.greenOnLight,
  tintSoft = "#E3F4EA",
  title,
  subtitle,
  actionLabel,
  onActionPress,
  actionVariant = "driver", // por defecto acción de conductor negro estructurado (pág. 6)
}) => (
  <View style={styles.card}>
    {Icon ? (
      <View style={[styles.iconOuter, { backgroundColor: tintSoft }]}>
        <View style={styles.iconInner}>
          <Icon size={24} color={tint} strokeWidth={2.2} />
        </View>
      </View>
    ) : null}

    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

    {actionLabel && onActionPress ? (
      <Button
        title={actionLabel}
        onPress={onActionPress}
        variant={actionVariant}
        size="medium"
        style={styles.actionButton}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card, // 16px
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  iconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  iconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2EAE5",
  },
  title: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: BRAND.black,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.gray600,
    textAlign: "center",
    marginBottom: SPACING.md,
    paddingHorizontal: 8,
  },
  actionButton: {
    minWidth: 180,
  },
});

export default EmptyState;
