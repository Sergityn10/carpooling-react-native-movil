// YouConnext - PermissionBlockedSheet Component
// Diálogo Bottom Sheet para redirigir a Ajustes del Sistema cuando un permiso está bloqueado

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings,
  AlertTriangle,
  ExternalLink,
  X,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import { PERMISSIONS_CONFIG, PERMISSION_TYPES } from "../../constants/permissionsConfig";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.55, 460);

const PermissionBlockedSheet = ({
  visible,
  permissionType,
  onClose,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const config =
    PERMISSIONS_CONFIG[permissionType] ||
    PERMISSIONS_CONFIG[PERMISSION_TYPES.LOCATION_FOREGROUND];

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
          toValue: SHEET_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOpenSettings = async () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      try {
        await Linking.openSettings();
      } catch (err) {
        console.warn("No se pudo abrir ajustes:", err);
      }
    }
    if (onClose) onClose();
  };

  if (!visible && slideAnim._value === SHEET_HEIGHT) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Header con botón de cerrar */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Settings size={32} color="#D97706" strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>Permiso Desactivado</Text>
            <Text style={styles.message}>
              {config.settingsMessage ||
                `El permiso de ${config.shortName} está desactivado en la configuración de tu teléfono.`}
            </Text>

            <View style={styles.infoBox}>
              <AlertTriangle size={16} color="#B45309" strokeWidth={2} />
              <Text style={styles.infoText}>
                Para habilitar esta función, accede a los Ajustes de la aplicación y concede el permiso correspondiente.
              </Text>
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.openButton}
                activeOpacity={0.88}
                onPress={handleOpenSettings}
              >
                <Text style={styles.openButtonText}>Abrir Ajustes del Teléfono</Text>
                <ExternalLink size={16} color={COLORS.white} strokeWidth={2.2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.7}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Continuar en modo manual</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gray600,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.gray700,
    lineHeight: 16,
  },
  actionContainer: {
    width: "100%",
    gap: SPACING.xs,
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    ...SHADOWS.sm,
  },
  openButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.bold,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.gray500,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.medium,
  },
});

export default PermissionBlockedSheet;
