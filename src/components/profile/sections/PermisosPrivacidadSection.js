// YouConnext - PermisosPrivacidadSection Component
// Panel de gestión y transparencia de permisos para el usuario

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import {
  MapPin,
  Radio,
  Camera,
  Image as ImageIcon,
  Bell,
  ShieldCheck,
  Check,
  X,
  Settings,
  ExternalLink,
  RotateCcw,
  Info,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../../constants";
import { usePermission } from "../../../context/PermissionContext";
import {
  PERMISSION_TYPES,
  PERMISSION_CHOICE_STATUS,
  PERMISSIONS_CONFIG,
} from "../../../constants/permissionsConfig";

const ICON_MAP = {
  MapPin,
  Radio,
  Camera,
  Image: ImageIcon,
  Bell,
};

const PermisosPrivacidadSection = () => {
  const {
    permissionsState,
    requestPermissionWithDisclosure,
    resetPermission,
    resetAllPermissions,
  } = usePermission();

  const handleConfigurePermission = async (type) => {
    await requestPermissionWithDisclosure(type, { forcePrompt: true });
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (e) {
      Alert.alert(
        "Ajustes",
        "Por favor abre los Ajustes de tu teléfono para modificar los permisos.",
      );
    }
  };

  const handleResetAll = () => {
    Alert.alert(
      "Restablecer elecciones",
      "¿Deseas restablecer las decisiones de permisos guardadas? La app volverá a mostrarte los avisos destacados cuando uses cada función.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restablecer",
          style: "destructive",
          onPress: async () => {
            await resetAllPermissions();
            Alert.alert("Listo", "Se han restablecido las preferencias de permisos.");
          },
        },
      ],
    );
  };

  const permissionList = [
    PERMISSION_TYPES.LOCATION_FOREGROUND,
    PERMISSION_TYPES.LOCATION_BACKGROUND,
    PERMISSION_TYPES.CAMERA,
    PERMISSION_TYPES.MEDIA_LIBRARY,
    PERMISSION_TYPES.NOTIFICATIONS,
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner de Transparencia de Privacidad */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrapper}>
          <ShieldCheck size={28} color={COLORS.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>Tus Datos y Privacidad</Text>
          <Text style={styles.heroSubtitle}>
            En YouConnext tienes el control total. Puedes decidir qué permisos otorgar y la app se adaptará con modos manuales cuando lo prefieras.
          </Text>
        </View>
      </View>

      {/* Lista de Permisos */}
      <Text style={styles.sectionHeader}>Permisos de la Aplicación</Text>

      <View style={styles.listContainer}>
        {permissionList.map((type) => {
          const config = PERMISSIONS_CONFIG[type];
          const state = permissionsState[type];
          const isGranted = state?.status === PERMISSION_CHOICE_STATUS.GRANTED;
          const isDeclined =
            state?.status === PERMISSION_CHOICE_STATUS.DECLINED;
          const isBlocked = state?.status === PERMISSION_CHOICE_STATUS.BLOCKED;

          const IconComponent = ICON_MAP[config.icon] || ShieldCheck;

          return (
            <View key={type} style={styles.permissionItem}>
              <View style={styles.itemTopRow}>
                <View
                  style={[
                    styles.itemIconCircle,
                    { backgroundColor: config.badgeBg || COLORS.gray100 },
                  ]}
                >
                  <IconComponent
                    size={20}
                    color={config.badgeColor || COLORS.gray800}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.itemTitleContainer}>
                  <Text style={styles.itemTitle}>{config.name}</Text>
                  <Text style={styles.itemSubtitle}>{config.shortName}</Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    isGranted
                      ? styles.statusBadgeGranted
                      : isBlocked
                        ? styles.statusBadgeBlocked
                        : styles.statusBadgeDeclined,
                  ]}
                >
                  {isGranted ? (
                    <>
                      <Check size={12} color={COLORS.primaryDark} strokeWidth={2.5} />
                      <Text style={styles.statusBadgeTextGranted}>Activo</Text>
                    </>
                  ) : isBlocked ? (
                    <>
                      <Settings size={12} color="#92400E" strokeWidth={2.5} />
                      <Text style={styles.statusBadgeTextBlocked}>Ajustes</Text>
                    </>
                  ) : (
                    <>
                      <Info size={12} color={COLORS.gray600} strokeWidth={2.5} />
                      <Text style={styles.statusBadgeTextDeclined}>Modo manual</Text>
                    </>
                  )}
                </View>
              </View>

              {/* Explicación de datos y degradación */}
              <Text style={styles.itemDescription}>{config.summary}</Text>

              {isDeclined && (
                <View style={styles.degradedInfoBox}>
                  <Text style={styles.degradedInfoText}>
                    💡 {config.degradationNotice}
                  </Text>
                </View>
              )}

              {/* Botón de acción contextual */}
              <View style={styles.itemActionsRow}>
                {isGranted ? (
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={handleOpenSettings}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnSecondaryText}>
                      Gestionar en Ajustes
                    </Text>
                    <ExternalLink size={12} color={COLORS.gray600} strokeWidth={2} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => handleConfigurePermission(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnPrimaryText}>
                      {isBlocked ? "Abrir Ajustes del Teléfono" : "Activar / Configurar"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Botones de gestión global */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.settingsAllButton}
          activeOpacity={0.8}
          onPress={handleOpenSettings}
        >
          <Settings size={16} color={COLORS.primary} strokeWidth={2.2} />
          <Text style={styles.settingsAllButtonText}>
            Ajustes del Sistema Operativo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          activeOpacity={0.7}
          onPress={handleResetAll}
        >
          <RotateCcw size={14} color={COLORS.gray500} strokeWidth={2} />
          <Text style={styles.resetButtonText}>Restablecer avisos de permisos</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  heroCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: SPACING.lg,
    alignItems: "center",
    gap: SPACING.sm,
    ...SHADOWS.xs,
  },
  heroIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 11,
    color: COLORS.gray600,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  listContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  permissionItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.xs,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray900,
  },
  itemSubtitle: {
    fontSize: 10,
    color: COLORS.gray400,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusBadgeGranted: {
    backgroundColor: COLORS.primarySoft,
  },
  statusBadgeDeclined: {
    backgroundColor: COLORS.gray100,
  },
  statusBadgeBlocked: {
    backgroundColor: "#FEF3C7",
  },
  statusBadgeTextGranted: {
    fontSize: 11,
    fontFamily: FONTS.weights.bold,
    color: COLORS.primaryDark,
  },
  statusBadgeTextDeclined: {
    fontSize: 11,
    fontFamily: FONTS.weights.medium,
    color: COLORS.gray600,
  },
  statusBadgeTextBlocked: {
    fontSize: 11,
    fontFamily: FONTS.weights.bold,
    color: "#92400E",
  },
  itemDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray600,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  degradedInfoBox: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  degradedInfoText: {
    fontSize: 11,
    color: COLORS.gray600,
    lineHeight: 15,
  },
  itemActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: SPACING.xs,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.bold,
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  actionBtnSecondaryText: {
    color: COLORS.gray700,
    fontSize: 11,
    fontFamily: FONTS.weights.medium,
  },
  footerActions: {
    gap: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  settingsAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    width: "100%",
    justifyContent: "center",
  },
  settingsAllButtonText: {
    color: COLORS.primaryDark,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.semibold,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING.xs,
  },
  resetButtonText: {
    color: COLORS.gray500,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.medium,
  },
});

export default PermisosPrivacidadSection;
