// YouConnext - OnboardingScreen
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Calendar,
  Phone,
  User as UserIcon,
  IdCard,
  MapPin,
  Bell,
  ShieldCheck,
  Check,
  ChevronRight,
} from "lucide-react-native";
import { useUser } from "../context/UserContext";
import { usePermission } from "../context/PermissionContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../constants";
import { Button } from "../components";

const OnboardingScreen = () => {
  const { user, actualizarUsuario } = useUser();
  const {
    permissionsState,
    requestPermissionWithDisclosure,
    PERMISSION_TYPES,
    PERMISSION_CHOICE_STATUS,
  } = usePermission();

  const [step, setStep] = useState(0);
  const [fechaNacimiento, setFechaNacimiento] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  const needsNameStep = !user?.name;
  const [nombre, setNombre] = useState(user?.name || "");
  const [apellido, setApellido] = useState(user?.surname || "");
  const [dni, setDni] = useState("");

  // Añadimos el paso final de Permisos y Privacidad
  const totalSteps = needsNameStep ? 5 : 4;
  const stepOffset = needsNameStep ? 2 : 1;
  const permissionsStepIndex = needsNameStep ? 4 : 3;

  const formatDate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    if (!date) return "Selecciona tu fecha de nacimiento";
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const onDateChange = useCallback((event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setFechaNacimiento(selectedDate);
    }
  }, []);

  const validateTelefono = (value) => {
    const cleaned = value.replace(/[\s\-+()]/g, "");
    return cleaned.length >= 9 && /^\d+$/.test(cleaned);
  };

  const validateDni = (value) => {
    const cleaned = value.replace(/[\s\-]/g, "").toUpperCase();
    return /^\d{8}[A-Z]$/.test(cleaned);
  };

  const handleNext = () => {
    if (needsNameStep && step === 0) {
      if (!nombre.trim() || !apellido.trim()) {
        Alert.alert(
          "Datos requeridos",
          "Por favor, introduce tu nombre y apellidos",
        );
        return;
      }
      setStep(1);
    } else if (needsNameStep && step === 1) {
      if (!validateDni(dni)) {
        Alert.alert(
          "DNI inválido",
          "Introduce un DNI válido (8 números y 1 letra)",
        );
        return;
      }
      setStep(2);
    } else if (!needsNameStep && step === 0) {
      if (!validateDni(dni)) {
        Alert.alert(
          "DNI inválido",
          "Introduce un DNI válido (8 números y 1 letra)",
        );
        return;
      }
      setStep(1);
    } else if (step === stepOffset) {
      if (!fechaNacimiento) {
        Alert.alert(
          "Fecha requerida",
          "Por favor, selecciona tu fecha de nacimiento",
        );
        return;
      }
      setStep(stepOffset + 1);
    } else if (step === stepOffset + 1) {
      if (!validateTelefono(telefono)) {
        Alert.alert(
          "Teléfono inválido",
          "Introduce un número de teléfono válido (mínimo 9 dígitos)",
        );
        return;
      }
      // Pasar al paso de Permisos y Privacidad
      setStep(permissionsStepIndex);
    }
  };

  const handleTogglePermission = async (type) => {
    await requestPermissionWithDisclosure(type, { forcePrompt: true });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const cleanedPhone = telefono.replace(/[\s\-+()]/g, "");
      const updateData = {
        fecha_nacimiento: formatDate(fechaNacimiento),
        phone: cleanedPhone,
        onboarding_ended: true,
      };
      if (needsNameStep) {
        updateData.name = nombre.trim();
        updateData.surname = apellido.trim();
      }
      updateData.dni = dni.replace(/[\s\-]/g, "").toUpperCase();
      await actualizarUsuario(updateData);
    } catch (e) {
      const status = e.status;
      const msg = e.message || "";
      if (status === 409 || /dni|nie/i.test(msg)) {
        Alert.alert(
          "DNI ya registrado",
          "Ya existe un usuario con este DNI/NIE. Por favor, introduce un DNI diferente.",
          [
            {
              text: "Ir al DNI",
              onPress: () => setStep(needsNameStep ? 1 : 0),
            },
          ],
        );
      } else if (status === 400) {
        Alert.alert(
          "Datos inválidos",
          msg || "Revisa los datos introducidos e inténtalo de nuevo.",
        );
      } else {
        Alert.alert(
          "Error",
          msg || "No se pudo completar el onboarding. Inténtalo de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocationGranted =
    permissionsState[PERMISSION_TYPES.LOCATION_FOREGROUND]?.status ===
    PERMISSION_CHOICE_STATUS.GRANTED;

  const isNotificationsGranted =
    permissionsState[PERMISSION_TYPES.NOTIFICATIONS]?.status ===
    PERMISSION_CHOICE_STATUS.GRANTED;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "android" ? StatusBar.currentHeight : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i <= step && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Step 0 (email only): Nombre y apellidos */}
          {needsNameStep && step === 0 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconWrapper}>
                <UserIcon size={48} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Tus datos personales</Text>
              <Text style={styles.subtitle}>
                Necesitamos tu nombre y apellidos para tu perfil
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor={COLORS.gray400}
                  value={nombre}
                  onChangeText={setNombre}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Apellidos</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tus apellidos"
                  placeholderTextColor={COLORS.gray400}
                  value={apellido}
                  onChangeText={setApellido}
                  autoCapitalize="words"
                />
              </View>

              <Button
                title="Continuar"
                onPress={handleNext}
                disabled={!nombre.trim() || !apellido.trim()}
                style={styles.button}
              />
            </View>
          )}

          {/* Step 1 (email) / Step 0 (google): DNI */}
          {(needsNameStep ? step === 1 : step === 0) && (
            <View style={styles.stepContainer}>
              <View style={styles.iconWrapper}>
                <IdCard size={48} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Tu DNI</Text>
              <Text style={styles.subtitle}>
                Necesitamos tu DNI para verificar tu identidad
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>DNI</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12345678A"
                  placeholderTextColor={COLORS.gray400}
                  value={dni}
                  onChangeText={(v) => setDni(v.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={10}
                />
              </View>

              {needsNameStep ? (
                <View style={styles.buttonContainer}>
                  <Button
                    title="Atrás"
                    onPress={() => setStep(0)}
                    variant="outline"
                    style={styles.backButton}
                  />
                  <Button
                    title="Continuar"
                    onPress={handleNext}
                    disabled={!validateDni(dni)}
                    style={styles.button}
                  />
                </View>
              ) : (
                <Button
                  title="Continuar"
                  onPress={handleNext}
                  disabled={!validateDni(dni)}
                  style={styles.button}
                />
              )}
            </View>
          )}

          {/* Step 0/2: Fecha de nacimiento */}
          {step === stepOffset && (
            <View style={styles.stepContainer}>
              <View style={styles.iconWrapper}>
                <Calendar size={48} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.title}>¿Cuándo naciste?</Text>
              <Text style={styles.subtitle}>
                Necesitamos tu fecha de nacimiento para verificar tu edad
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateButtonText,
                      !fechaNacimiento && styles.dateButtonPlaceholder,
                    ]}
                  >
                    {formatDateDisplay(fechaNacimiento)}
                  </Text>
                  <Calendar size={20} color={COLORS.gray400} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={fechaNacimiento || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={onDateChange}
                  textColor={COLORS.primary}
                  accentColor={COLORS.primary}
                />
              )}

              {Platform.OS === "ios" && showDatePicker && (
                <TouchableOpacity
                  style={styles.confirmDateButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.confirmDateText}>Confirmar fecha</Text>
                </TouchableOpacity>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  title="Atrás"
                  onPress={() => setStep(needsNameStep ? 1 : 0)}
                  variant="outline"
                  style={styles.backButton}
                />
                <Button
                  title="Continuar"
                  onPress={handleNext}
                  disabled={!fechaNacimiento}
                  style={styles.button}
                />
              </View>
            </View>
          )}

          {/* Step 1/3: Teléfono */}
          {step === stepOffset + 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconWrapper}>
                <Phone size={48} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Tu teléfono</Text>
              <Text style={styles.subtitle}>
                Usaremos tu número para contactarte sobre tus viajes
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Número de teléfono</Text>
                <TextInput
                  style={styles.input}
                  placeholder="600 123 456"
                  placeholderTextColor={COLORS.gray400}
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                  maxLength={12}
                />
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Atrás"
                  onPress={() => setStep(stepOffset)}
                  variant="outline"
                  style={styles.backButton}
                />
                <Button
                  title="Continuar"
                  onPress={handleNext}
                  disabled={!validateTelefono(telefono)}
                  style={styles.button}
                />
              </View>
            </View>
          )}

          {/* Step Final: Permisos y Privacidad (Transparencia & Cumplimiento) */}
          {step === permissionsStepIndex && (
            <View style={styles.stepContainer}>
              <View style={styles.iconWrapper}>
                <ShieldCheck size={48} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Configura tu experiencia</Text>
              <Text style={styles.subtitle}>
                Personaliza los permisos para sacar el máximo partido a tus viajes compartidos
              </Text>

              <View style={styles.permissionsCardsContainer}>
                {/* Tarjeta Ubicación */}
                <TouchableOpacity
                  style={styles.permissionCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    handleTogglePermission(PERMISSION_TYPES.LOCATION_FOREGROUND)
                  }
                >
                  <View
                    style={[
                      styles.permissionCardIcon,
                      { backgroundColor: "#D1FAE5" },
                    ]}
                  >
                    <MapPin size={22} color={COLORS.primary} strokeWidth={2.2} />
                  </View>
                  <View style={styles.permissionCardContent}>
                    <Text style={styles.permissionCardTitle}>Ubicación</Text>
                    <Text style={styles.permissionCardSubtitle}>
                      Búsqueda de viajes y cálculo de rutas cercanas
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isLocationGranted
                        ? styles.statusPillGranted
                        : styles.statusPillAction,
                    ]}
                  >
                    {isLocationGranted ? (
                      <>
                        <Check size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
                        <Text style={styles.statusPillTextGranted}>Activo</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.statusPillTextAction}>Configurar</Text>
                        <ChevronRight size={14} color={COLORS.gray600} strokeWidth={2} />
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Tarjeta Notificaciones */}
                <TouchableOpacity
                  style={styles.permissionCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    handleTogglePermission(PERMISSION_TYPES.NOTIFICATIONS)
                  }
                >
                  <View
                    style={[
                      styles.permissionCardIcon,
                      { backgroundColor: "#E0F2FE" },
                    ]}
                  >
                    <Bell size={22} color={COLORS.secondary} strokeWidth={2.2} />
                  </View>
                  <View style={styles.permissionCardContent}>
                    <Text style={styles.permissionCardTitle}>
                      Notificaciones
                    </Text>
                    <Text style={styles.permissionCardSubtitle}>
                      Alertas de reservas, llegadas y mensajes de chat
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isNotificationsGranted
                        ? styles.statusPillGranted
                        : styles.statusPillAction,
                    ]}
                  >
                    {isNotificationsGranted ? (
                      <>
                        <Check size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
                        <Text style={styles.statusPillTextGranted}>Activo</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.statusPillTextAction}>Configurar</Text>
                        <ChevronRight size={14} color={COLORS.gray600} strokeWidth={2} />
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.privacyNote}>
                Podrás cambiar estos ajustes o continuar en modo manual en cualquier momento desde tu Perfil.
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title="Atrás"
                  onPress={() => setStep(stepOffset + 1)}
                  variant="outline"
                  style={styles.backButton}
                />
                {loading ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : (
                  <Button
                    title="Entrar a YouConnext"
                    onPress={handleFinish}
                    style={styles.button}
                  />
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray200,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  stepContainer: {
    alignItems: "center",
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes["2xl"],
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.medium,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.gray900,
  },
  dateButton: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gray900,
  },
  dateButtonPlaceholder: {
    color: COLORS.gray400,
  },
  confirmDateButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
    alignItems: "center",
  },
  confirmDateText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.semibold,
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  backButton: {
    flex: 1,
  },
  button: {
    flex: 2,
  },
  loadingWrapper: {
    flex: 2,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionsCardsContainer: {
    width: "100%",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.xs,
  },
  permissionCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  permissionCardContent: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  permissionCardTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.weights.bold,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  permissionCardSubtitle: {
    fontSize: 11,
    color: COLORS.gray500,
    lineHeight: 15,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  statusPillGranted: {
    backgroundColor: COLORS.primarySoft,
  },
  statusPillAction: {
    backgroundColor: COLORS.gray100,
  },
  statusPillTextGranted: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.bold,
    color: COLORS.primaryDark,
  },
  statusPillTextAction: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.weights.medium,
    color: COLORS.gray700,
  },
  privacyNote: {
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
});

export default OnboardingScreen;
