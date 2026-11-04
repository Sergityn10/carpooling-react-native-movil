// YouConnext - EventImagePicker (Selector de Imagen de Portada para Eventos)
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  Link2,
  Trash2,
  UploadCloud,
  X,
  Check,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";

export const formatImageUri = (img) => {
  if (!img || typeof img !== "string") return null;
  const trimmed = img.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `data:image/jpeg;base64,${trimmed}`;
};

const EventImagePicker = ({
  image,
  onChangeImage,
  onRemoveImage,
  label = "Imagen o portada del evento",
  sublabel = "Banner en formato 16:9 para destacar tu evento en la plataforma",
}) => {
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

  const formattedUri = formatImageUri(image);

  // 1. Abrir Galería multimedia del dispositivo
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a tus fotos para que puedas seleccionar una imagen de portada."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        onChangeImage && onChangeImage(dataUri);
      }
    } catch (err) {
      console.warn("Error abriendo galería:", err);
      Alert.alert("Error", "No se pudo cargar la imagen desde la galería.");
    }
  };

  // 2. Tomar foto con la Cámara del dispositivo
  const handlePickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a la cámara para tomar una foto para el evento."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        onChangeImage && onChangeImage(dataUri);
      }
    } catch (err) {
      console.warn("Error abriendo cámara:", err);
      Alert.alert("Error", "No se pudo acceder a la cámara del dispositivo.");
    }
  };

  // 3. Confirmar URL manual
  const handleConfirmUrl = () => {
    const trimmed = tempUrl.trim();
    if (!trimmed) {
      Alert.alert("URL vacía", "Por favor introduce un enlace web válido de imagen.");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      Alert.alert("URL inválida", "El enlace debe comenzar por https:// o http://");
      return;
    }
    onChangeImage && onChangeImage(trimmed);
    setUrlModalVisible(false);
    setTempUrl("");
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}

      {formattedUri ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: formattedUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />

          {/* Botones de acción flotantes sobre la imagen */}
          <View style={styles.floatingActions}>
            <PressableScale
              style={styles.floatingActionBtn}
              onPress={handlePickFromGallery}
              scaleTo={0.94}
              accessibilityLabel="Cambiar foto de portada"
            >
              <Camera size={14} color={COLORS.white} strokeWidth={2.4} />
              <Text style={styles.floatingActionText}>Cambiar</Text>
            </PressableScale>

            <PressableScale
              style={[styles.floatingActionBtn, styles.deleteActionBtn]}
              onPress={() => onRemoveImage && onRemoveImage()}
              scaleTo={0.94}
              accessibilityLabel="Eliminar foto de portada"
            >
              <Trash2 size={14} color={COLORS.white} strokeWidth={2.4} />
              <Text style={styles.floatingActionText}>Quitar</Text>
            </PressableScale>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <UploadCloud size={24} color={COLORS.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.emptyTitle}>Sube una portada para el evento</Text>
          <Text style={styles.emptySubtitle}>
            Una imagen atractiva incrementa la inscripción y participación
          </Text>

          {/* Opciones de carga */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionPill}
              onPress={handlePickFromGallery}
              activeOpacity={0.8}
            >
              <ImageIcon size={14} color={BRAND.black} strokeWidth={2.2} />
              <Text style={styles.optionPillText}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionPill}
              onPress={handlePickFromCamera}
              activeOpacity={0.8}
            >
              <Camera size={14} color={BRAND.black} strokeWidth={2.2} />
              <Text style={styles.optionPillText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionPill}
              onPress={() => setUrlModalVisible(true)}
              activeOpacity={0.8}
            >
              <Link2 size={14} color={BRAND.black} strokeWidth={2.2} />
              <Text style={styles.optionPillText}>URL Web</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal para introducir URL externa de imagen */}
      <Modal
        visible={urlModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUrlModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Link2 size={18} color={COLORS.primary} strokeWidth={2.4} />
                <Text style={styles.modalTitle}>Enlace de Imagen</Text>
              </View>
              <TouchableOpacity
                onPress={() => setUrlModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={COLORS.gray600} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Pega la URL directa de la imagen (por ejemplo desde Unsplash o el sitio web de tu organización).
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="https://ejemplo.com/portada-evento.jpg"
              placeholderTextColor={COLORS.gray400}
              value={tempUrl}
              onChangeText={setTempUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setUrlModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <PressableScale
                style={styles.modalConfirmBtn}
                onPress={handleConfirmUrl}
                scaleTo={0.96}
              >
                <Check size={16} color={COLORS.white} strokeWidth={2.6} />
                <Text style={styles.modalConfirmText}>Aplicar Imagen</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.black,
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 11.5,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  previewContainer: {
    width: "100%",
    height: 180,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
    ...SHADOWS.card,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  floatingActions: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },
  floatingActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    gap: 5,
  },
  deleteActionBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.85)",
  },
  floatingActionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.white,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: RADIUS.card,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EBF7EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: BRAND.black,
    marginBottom: 3,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: "center",
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.black,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.screenMargin,
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.black,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 14,
    lineHeight: 17,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: RADIUS.control,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: BRAND.black,
    marginBottom: 18,
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  modalConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.control,
    gap: 6,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default EventImagePicker;