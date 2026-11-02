// YouConnext - EnterpriseHeader (Cabecera Corporativa B2B)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Building2, ArrowLeftRight, ShieldCheck, Sparkles } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";
import { useUser } from "../../context/UserContext";

const EnterpriseHeader = ({
  title,
  subtitle,
  showSwitcher = true,
  onSwitchPersonal,
  rightAction,
}) => {
  const { selectedEnterprise, identity, permissions } = useUser();

  const orgName = selectedEnterprise?.name || selectedEnterprise?.enterprise_name || identity?.display_name || "Mi Organización";
  const orgSub = subtitle || selectedEnterprise?.sector || selectedEnterprise?.department || "Suite de Sostenibilidad y Eventos";
  const canSwitch = permissions?.can_access_personal_mode !== false;

  return (
    <View style={styles.container}>
      {/* Barra superior con distintivo B2B y Switcher a Modo Personal */}
      <View style={styles.topBar}>
        <View style={styles.orgBadge}>
          <Building2 size={13} color={COLORS.primary} strokeWidth={2.4} />
          <Text style={styles.orgBadgeText}>ORGANIZACIÓN</Text>
        </View>

        {showSwitcher && canSwitch && (
          <PressableScale
            style={styles.switchButton}
            onPress={onSwitchPersonal}
            scaleTo={0.96}
            accessibilityLabel="Volver a Modo Personal"
          >
            <ArrowLeftRight size={13} color={COLORS.gray700} strokeWidth={2.2} />
            <Text style={styles.switchButtonText}>Modo Personal</Text>
          </PressableScale>
        )}
      </View>

      {/* Nombre de la entidad y subtítulo */}
      <View style={styles.contentRow}>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.orgName} numberOfLines={1}>
              {title || orgName}
            </Text>
            {selectedEnterprise?.verified ? (
              <ShieldCheck size={18} color={COLORS.primary} strokeWidth={2.4} />
            ) : null}
          </View>
          <Text style={styles.orgSubtitle} numberOfLines={1}>
            {orgSub}
          </Text>
        </View>

        {rightAction ? (
          <View style={styles.rightActionBox}>{rightAction}</View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orgBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg || "#E3F4EA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    gap: 5,
  },
  orgBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 6,
  },
  switchButtonText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orgName: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  orgSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray500,
    marginTop: 2,
  },
  rightActionBox: {
    marginLeft: 8,
  },
});

export default EnterpriseHeader;
