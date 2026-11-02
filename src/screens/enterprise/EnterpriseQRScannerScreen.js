// YouConnext - EnterpriseQRScannerScreen (Control de Acceso y Acreditación QR Expo 56)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView } from "expo-camera";
import {
  X,
  Flashlight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  QrCode,
  ShieldCheck,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../../components/common/PressableScale";
import { usePermission } from "../../context/PermissionContext";
import { PERMISSION_TYPES } from "../../constants/permissionsConfig";
import { enterpriseService } from "../../services/enterpriseService";

const EnterpriseQRScannerScreen = ({ navigation, route }) => {
  const eventId = route?.params?.eventId;
  const eventTitle = route?.params?.eventTitle || "Evento Corporativo";

  const { requestPermissionWithDisclosure } = usePermission();
  const [hasPermission, setHasPermission] = useState(null);
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [accreditedSessionCount, setAccreditedSessionCount] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await requestPermissionWithDisclosure(
        PERMISSION_TYPES.CAMERA,
        { forcePrompt: false }
      );
      setHasPermission(res.granted);
    })();
  }, []);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const result = await enterpriseService.verifyEventCheckIn(eventId, data);
      setLastScanResult(result);
      if (result.success) {
        setAccreditedSessionCount((prev) => prev + 1);
      }
    } catch (err) {
      setLastScanResult({
        success: false,
        message: err?.message || "Error al validar la acreditación.",
      });
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLastScanResult(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Solicitando acceso a la cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <AlertTriangle size={48} color={BRAND.accent} strokeWidth={2} />
        <Text style={styles.noPermissionTitle}>Acceso a Cámara Necesario</Text>
        <Text style={styles.noPermissionSubtitle}>
          Para acreditar a los empleados y asistentes mediante su pase QR corporativo, permite el uso de la cámara.
        </Text>
        <PressableScale
          style={styles.retryBtn}
          onPress={async () => {
            const res = await requestPermissionWithDisclosure(
              PERMISSION_TYPES.CAMERA,
              { forcePrompt: true }
            );
            setHasPermission(res.granted);
          }}
          scaleTo={0.96}
        >
          <Text style={styles.retryBtnText}>Permitir Cámara</Text>
        </PressableScale>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backLink}
        >
          <Text style={styles.backLinkText}>Volver al evento</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Cámara de pantalla completa */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        {/* Barra superior con título y controles */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Cerrar escáner"
          >
            <X size={20} color={COLORS.white} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.titleBadge}>
            <ShieldCheck size={14} color={COLORS.primary} strokeWidth={2.4} />
            <Text style={styles.titleBadgeText} numberOfLines={1}>
              {eventTitle}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.circleBtn, torch && styles.circleBtnActive]}
            onPress={() => setTorch((prev) => !prev)}
            accessibilityLabel="Alternar linterna"
          >
            <Flashlight
              size={18}
              color={torch ? BRAND.black : COLORS.white}
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        </View>

        {/* Visor de Enfoque */}
        <View style={styles.focusFrameContainer}>
          <View style={styles.focusFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.focusHint}>
            Apunta la cámara al código QR del pase corporativo
          </Text>
        </View>

        {/* Feedback de Escaneo o Estadísticas de Sesión */}
        <View style={styles.bottomSection}>
          {lastScanResult ? (
            <View
              style={[
                styles.resultCard,
                lastScanResult.success
                  ? styles.resultCardSuccess
                  : styles.resultCardWarning,
              ]}
            >
              <View style={styles.resultHeader}>
                {lastScanResult.success ? (
                  <CheckCircle2 size={24} color={COLORS.primary} strokeWidth={2.5} />
                ) : (
                  <AlertTriangle size={24} color="#D97706" strokeWidth={2.5} />
                )}
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultTitle}>
                    {lastScanResult.success ? "¡Acreditado con Éxito!" : "Atención"}
                  </Text>
                  <Text style={styles.resultMessage}>{lastScanResult.message}</Text>
                  {lastScanResult.attendee?.verifiedAt ? (
                    <Text style={styles.resultTime}>
                      Hora: {lastScanResult.attendee.verifiedAt}
                    </Text>
                  ) : null}
                </View>
              </View>

              <PressableScale
                style={styles.nextScanBtn}
                onPress={resetScanner}
                scaleTo={0.97}
              >
                <RotateCcw size={15} color={COLORS.white} strokeWidth={2.4} />
                <Text style={styles.nextScanBtnText}>Escanear Siguiente</Text>
              </PressableScale>
            </View>
          ) : (
            <View style={styles.counterCard}>
              <Text style={styles.counterTitle}>Sesión de Acreditación</Text>
              <Text style={styles.counterSub}>
                Asistentes acreditados en esta sesión:{" "}
                <Text style={styles.counterNumber}>{accreditedSessionCount}</Text>
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.gray600,
  },
  noPermissionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 16,
    textAlign: "center",
  },
  noPermissionSubtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.control,
    marginTop: 20,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  backLink: {
    marginTop: 14,
    padding: 6,
  },
  backLinkText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: "600",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnActive: {
    backgroundColor: BRAND.accent,
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    gap: 6,
    maxWidth: "60%",
  },
  titleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  focusFrameContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  focusFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: BRAND.green,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  focusHint: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
    marginTop: 18,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  bottomSection: {
    paddingHorizontal: SPACING.screenMargin,
    paddingBottom: SPACING.lg,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    ...SHADOWS.card,
  },
  resultCardSuccess: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  resultCardWarning: {
    borderLeftWidth: 5,
    borderLeftColor: "#D97706",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.black,
  },
  resultMessage: {
    fontSize: 12,
    color: COLORS.gray700,
    marginTop: 2,
  },
  resultTime: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 2,
    fontWeight: "500",
  },
  nextScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.control,
    gap: 6,
  },
  nextScanBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  counterCard: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: RADIUS.card,
    padding: 14,
    alignItems: "center",
  },
  counterTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray400,
  },
  counterSub: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
    marginTop: 2,
  },
  counterNumber: {
    color: BRAND.green,
    fontWeight: "800",
  },
});

export default EnterpriseQRScannerScreen;
