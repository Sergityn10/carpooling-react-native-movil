// YouConnext - PermissionDisclosureSheet Component
// Bottom Sheet de Aviso Destacado y Consentimiento (Cumplimiento Google Play & App Store)

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MapPin,
  Radio,
  Camera,
  Image as ImageIcon,
  Bell,
  ShieldCheck,
  CheckCircle2,
  Info,
  AlertCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import { PERMISSIONS_CONFIG, PERMISSION_TYPES } from "../../constants/permissionsConfig";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 680);

const ICON_MAP = {
  MapPin,
  Radio,
  Camera,
  Image: ImageIcon,
  Bell,
};

const PermissionDisclosureSheet = ({
  visible,
  permissionType,
  onAccept,
  onDecline,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const config =
    PERMISSIONS_CONFIG[permissionType] ||
    PERMISSIONS_CONFIG[PERMISSION_TYPES.LOCATION_FOREGROUND];

  const IconComponent = ICON_MAP[config?.icon] || ShieldCheck;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SHEET_MAX_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === SHEET_MAX_HEIGHT) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        {/* Backdrop desenfocado/oscurecido */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

        {/* Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Indicador de arrastre superior */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header con Icono Temático y Badge de Privacidad */}
            <View style={styles.header}>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: config.badgeBg || COLORS.primarySoft },
                ]}
              >
                <IconComponent
                  size={32}
                  color={config.badgeColor || COLORS.primary}
                  strokeWidth={2.3}
                />
              </View>
              <View style={styles.badgeContainer}>
                <ShieldCheck size={14} color={COLORS.primary} strokeWidth={2.2} />
                <Text style={styles.badgeText}>Aviso de Privacidad y Permisos</Text>
              </View>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.summary}>{config.summary}</Text>
            </View>

            {/* Cuadro destacado de Recopilación de Datos */}
            <View style={styles.highlightCard}>
              <View style={styles.highlightHeader}>
                <Info size={16} color={COLORS.secondary} strokeWidth={2.2} />
                <Text style={styles.highlightTitle}>Datos que se recopilan</Text>
              </View>
              {config.dataCollected.map((item, idx) => (
                <View key={idx} style={styles.dataItem}>
                  <Text style={styles.dataItemTitle}>• {item.title}</Text>
                  <Text style={styles.dataItemDesc}>{item.description}</Text>
                </View>
              ))}
            </View>

            {/* Finalidades y Beneficios */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>¿Para qué se utiliza?</Text>
              {config.purposeList.map((item, idx) => (
                <View key={idx} style={styles.purposeItem}>
                  <View style={styles.purposeDot}>
                    <CheckCircle2
                      size={16}
                      color={COLORS.primary}
                      strokeWidth={2.2}
                    />
                  </View>
                  <View style={styles.purposeContent}>
                    <Text style={styles.purposeItemTitle}>{item.title}</Text>
                    <Text style={styles.purposeItemDesc}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Instrucción especial para segundo plano en Android (si aplica) */}
            {config.osInstructionNotice ? (
              <View style={styles.osInstructionBox}>
                <AlertCircle size={18} color="#D97706" strokeWidth={2.2} />
                <View style={styles.osInstructionTextContainer}>
                  <Text style={styles.osInstructionTitle}>
                    Paso importante en el sistema:
                  </Text>
                  <Text style={styles.osInstructionDesc}>
                    {config.osInstructionNotice}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Aviso de degradación elegante (si elige 'Ahora no') */}
            <View style={styles.degradationBox}>
              <Text style={styles.degradationText}>
                {config.degradationNotice}
              </Text>
            </View>
          </ScrollView>

          {/* Botones de Acción (Consentimiento Explícito) */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              activeOpacity={0.88}
              onPress={onAccept}
            >
              <Text style={styles.acceptButtonText}>
                {config.ctaAcceptText || "Entendido y permitir"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              activeOpacity={0.7}
              onPress={onDecline}
            >
              <Text style={styles.declineButtonText}>
                {config.ctaDeclineText || "Ahora no"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 9, 11, 0.55)",
  },
  sheetContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: RADIUS["2xl"],
    borderTopRightRadius: RADIUS["2xl"],
    maxHeight: SHEET_MAX_HEIGHT,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    ...SHADOWS.xl,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.gray300,
  },
  scrollContent: {
    paddingVertical: SPACING.sm,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.semibold,
    color: COLORS.primaryDark,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray900,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 4,
  },
  summary: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray600,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SPACING.xs,
  },
  highlightCard: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  highlightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.xs,
  },
  highlightTitle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.bold,
    color: COLORS.secondaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dataItem: {
    marginTop: 4,
  },
  dataItemTitle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.semibold,
    color: COLORS.gray800,
  },
  dataItemDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray600,
    marginTop: 2,
    lineHeight: 16,
    paddingLeft: 8,
  },
  sectionContainer: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
  },
  purposeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: SPACING.sm,
  },
  purposeDot: {
    marginTop: 2,
  },
  purposeContent: {
    flex: 1,
  },
  purposeItemTitle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.semibold,
    color: COLORS.gray800,
  },
  purposeItemDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray600,
    marginTop: 2,
    lineHeight: 16,
  },
  osInstructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  osInstructionTextContainer: {
    flex: 1,
  },
  osInstructionTitle: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.bold,
    color: "#92400E",
  },
  osInstructionDesc: {
    fontSize: FONTS.sizes.xs,
    color: "#78350F",
    marginTop: 2,
    lineHeight: 16,
  },
  degradationBox: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  degradationText: {
    fontSize: 11,
    color: COLORS.gray500,
    lineHeight: 15,
    fontStyle: "italic",
    textAlign: "center",
  },
  actionContainer: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.bold,
  },
  declineButton: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButtonText: {
    color: COLORS.gray500,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.medium,
  },
});

export default PermissionDisclosureSheet;
