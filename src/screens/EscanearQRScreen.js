// YouConnext - EscanearQRScreen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "expo-camera";
import { CameraView } from "expo-camera";
import {
  ChevronLeft,
  Camera as CameraIcon,
  Keyboard,
  Lightbulb,
  ScanLine,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { useViaje } from "../context/ViajeContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button } from "../components";
import * as Location from "expo-location";

const EscanearQRScreen = ({ navigation }) => {
  const { user } = useUser();
  const { unirseViajeQR } = useViaje();

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);

    try {
      // Extraer ID del viaje del QR
      // El QR tiene formato: youconnext://unirse/<viajeId>
      const match = data.match(/unirse\/([a-zA-Z0-9-]+)/);
      const viajeId = match ? match[1] : data;

      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión para unirte a un viaje.");
        setScanned(false);
        return;
      }

      // Obtener ubicación actual del pasajero para registrar la recogida
      let lat = 0;
      let lng = 0;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = location.coords.latitude;
          lng = location.coords.longitude;
        }
      } catch (e) {
        console.warn("No se pudo obtener ubicación:", e?.message);
      }

      const response = await unirseViajeQR(viajeId, lat, lng);

      Alert.alert(
        "Te has unido",
        `Te has unido al viaje de ${response.viajePasajero?.viaje?.conductor?.nombre || "un conductor"}`,
        [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              }),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo unir al viaje.");
      setScanned(false);
    }
  };

  const handleUnirseManual = async () => {
    if (!codigoManual.trim()) {
      Alert.alert("Error", "Ingresa un código válido.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para unirte a un viaje.");
      return;
    }

    try {
      // Obtener ubicación actual del pasajero para registrar la recogida
      let lat = 0;
      let lng = 0;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = location.coords.latitude;
          lng = location.coords.longitude;
        }
      } catch (e) {
        console.warn("No se pudo obtener ubicación:", e?.message);
      }

      const response = await unirseViajeQR(
        codigoManual.trim().toUpperCase(),
        lat,
        lng,
      );

      Alert.alert(
        "Te has unido",
        `Te has unido al viaje de ${response.viajePasajero?.viaje?.conductor?.nombre || "un conductor"}`,
        [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              }),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "No se pudo unir al viaje. Verifica el código.",
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Solicitando permiso de cámara...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <View style={styles.noPermissionIconBg}>
            <CameraIcon size={40} color={COLORS.gray400} strokeWidth={1.5} />
          </View>
          <Text style={styles.noPermissionTitle}>Sin acceso a la camara</Text>
          <Text style={styles.noPermissionText}>
            Necesitamos acceso a tu cámara para escanear códigos QR.
          </Text>
          <Button
            title="Usar código manual"
            onPress={() => setModoManual(true)}
            variant="primary"
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Escanear QR</Text>
        <TouchableOpacity
          style={styles.toggleIconButton}
          onPress={() => setModoManual(!modoManual)}
        >
          {modoManual ? (
            <CameraIcon size={22} color={COLORS.primary} strokeWidth={2.5} />
          ) : (
            <Keyboard size={22} color={COLORS.primary} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      {modoManual ? (
        // Modo manual
        <View style={styles.manualContainer}>
          <View style={styles.manualIcon}>
            <Keyboard size={36} color={COLORS.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.manualTitle}>Ingresa el código</Text>
          <Text style={styles.manualSubtitle}>
            Escribe el código que aparece en el viaje del conductor
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej: A1B2C3D4"
            placeholderTextColor={COLORS.gray400}
            value={codigoManual}
            onChangeText={setCodigoManual}
            autoCapitalize="characters"
            maxLength={20}
          />

          <Button
            title="Unirse al viaje"
            onPress={handleUnirseManual}
            variant="primary"
            size="large"
            disabled={!codigoManual.trim()}
          />
        </View>
      ) : (
        // Modo cámara
        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.instruction}>
                Apunta la cámara al código QR
              </Text>
            </View>
          </CameraView>

          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>
                Toca para escanear de nuevo
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Lightbulb size={16} color={COLORS.warning} strokeWidth={2} />
          <Text style={styles.infoText}>
            Tambien puedes pedirle al conductor el codigo textual para
            escribirlo manualmente.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  toggleIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray700,
  },
  toggleButton: {
    fontSize: FONTS.xxl,
  },
  backButton: {
    fontSize: FONTS.xxl,
    color: COLORS.gray700,
  },
  message: {
    fontSize: FONTS.md,
    color: COLORS.gray600,
    textAlign: "center",
    marginTop: SPACING.xxl,
  },
  noPermissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  noPermissionIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  noPermissionTitle: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
  },
  noPermissionText: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  manualContainer: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: "center",
  },
  manualIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  manualIconText: {
    fontSize: 40,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  manualTitle: {
    fontSize: FONTS.xl,
    fontWeight: "bold",
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  manualSubtitle: {
    fontSize: FONTS.md,
    color: COLORS.gray500,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONTS.xl,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 4,
    color: COLORS.gray700,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: COLORS.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instruction: {
    color: COLORS.white,
    fontSize: FONTS.md,
    marginTop: SPACING.xl,
    textAlign: "center",
  },
  rescanButton: {
    position: "absolute",
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  rescanButtonText: {
    backgroundColor: COLORS.white,
    color: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    fontSize: FONTS.md,
    fontWeight: "600",
  },
  infoContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.gray100,
  },
  infoText: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    textAlign: "center",
  },
});

export default EscanearQRScreen;
