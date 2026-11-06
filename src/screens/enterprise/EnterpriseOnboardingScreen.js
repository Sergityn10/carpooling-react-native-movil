// YouConnext - EnterpriseOnboardingScreen (Configuración Institucional Post-Registro v2)
// Wizard inicial corporativo para completar sede y datos B2B (docs/api/enterprise.md)
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Building2,
  MapPin,
  FileText,
  Phone,
  Globe,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  LogOut,
} from "lucide-react-native";
import { useUser } from "../../context/UserContext";
import { enterpriseService } from "../../services/enterpriseService";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import { Button, Input } from "../../components";

const EnterpriseOnboardingScreen = () => {
  const {
    user,
    setUser,
    actualizarOrganizacion,
    actualizarUsuario,
    selectedEnterprise,
    setSelectedEnterprise,
    refreshUser,
    cerrarSesion,
  } = useUser();

  const [name, setName] = useState(
    selectedEnterprise?.name || user?.name || ""
  );
  const [description, setDescription] = useState(
    selectedEnterprise?.description || ""
  );
  const [location, setLocation] = useState(
    selectedEnterprise?.location || ""
  );
  const [cif, setCif] = useState(selectedEnterprise?.cif || "");
  const [contactPerson, setContactPerson] = useState(
    selectedEnterprise?.contactPerson || selectedEnterprise?.contact_person || ""
  );
  const [phone, setPhone] = useState(
    selectedEnterprise?.phone || user?.phone || ""
  );
  const [sector, setSector] = useState(
    selectedEnterprise?.sector || "Movilidad y Sostenibilidad"
  );
  const [website, setWebsite] = useState(
    selectedEnterprise?.website || ""
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "El nombre de la organización debe tener al menos 2 caracteres.";
    }

    if (!location.trim() || location.trim().length < 2) {
      newErrors.location = "Indica la sede principal o ciudad de la organización.";
    }

    if (!description.trim() || description.trim().length < 10) {
      newErrors.description =
        "Añade una descripción institucional de al menos 10 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExitToAuth = () => {
    Alert.alert(
      "Volver al inicio",
      "¿Deseas salir del asistente y volver a la pantalla de inicio? Se cerrará la sesión actual.",
      [
        { text: "Continuar configurando", style: "cancel" },
        {
          text: "Salir e ir al inicio",
          style: "destructive",
          onPress: async () => {
            try {
              if (typeof cerrarSesion === "function") {
                await cerrarSesion();
              }
            } catch (err) {
              console.warn(
                "Error cerrando sesión en onboarding corporativo:",
                err
              );
            }
          },
        },
      ]
    );
  };

  const handleFinish = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        cif: cif.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        contact_person: contactPerson.trim() || null,
        sector: sector.trim() || null,
        onboarding_ended: true,
      };

      if (typeof actualizarOrganizacion === "function") {
        await actualizarOrganizacion(payload);
      } else if (typeof actualizarUsuario === "function") {
        await actualizarUsuario(payload);
      } else {
        const updated = await enterpriseService.updateEnterpriseProfile(payload);
        const updatedUser = {
          ...user,
          ...updated,
          name: updated.name || name.trim(),
          onboarding_ended: true,
          enterprise: updated,
        };
        if (typeof setUser === "function") {
          setUser(updatedUser);
        }
        if (typeof setSelectedEnterprise === "function") {
          setSelectedEnterprise(updated);
        }
      }

      if (typeof refreshUser === "function") {
        refreshUser().catch(() => {});
      }
    } catch (error) {
      Alert.alert(
        "Error al guardar datos",
        error?.message ||
          "No se pudo completar el onboarding de la organización. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Barra Superior de Navegación: Volver al inicio y Cerrar sesión */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleExitToAuth}
              activeOpacity={0.7}
              accessibilityLabel="Volver a la pantalla de inicio"
              accessibilityRole="button"
            >
              <ArrowLeft size={18} color={BRAND.black} strokeWidth={2.4} />
              <Text style={styles.backButtonText}>Volver al inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleExitToAuth}
              activeOpacity={0.7}
              accessibilityLabel="Cerrar sesión"
              accessibilityRole="button"
            >
              <LogOut size={14} color="#DC2626" strokeWidth={2.4} />
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Cabecera */}
          <View style={styles.header}>
            <View style={styles.badgeContainer}>
              <ShieldCheck size={16} color={BRAND.green} strokeWidth={2.2} />
              <Text style={styles.badgeText}>Configuración de Bienvenida</Text>
            </View>

            <Text style={styles.title}>Perfil de tu Organización</Text>
            <Text style={styles.subtitle}>
              Completa los datos de tu sede corporativa para comenzar a emitir eventos, acreditar empleados y acceder a tus métricas de impacto ambiental.
            </Text>
          </View>

          {/* Tarjeta de Formulario */}
          <View style={styles.card}>
            {/* Nombre de la entidad */}
            <Input
              label="Nombre oficial de la entidad *"
              icon={Building2}
              placeholder="Ej: EcoMobility Extremadura S.L."
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
            />

            {/* Sede principal / Ubicación */}
            <Input
              label="Sede principal / Ciudad *"
              icon={MapPin}
              placeholder="Ej: Cáceres, Madrid, Parque Científico..."
              value={location}
              onChangeText={(t) => {
                setLocation(t);
                if (errors.location)
                  setErrors((prev) => ({ ...prev, location: undefined }));
              }}
              error={errors.location}
            />

            {/* Descripción institucional */}
            <Input
              label="Descripción o compromiso sostenible *"
              icon={FileText}
              placeholder="Ej: Entidad colaboradora para el fomento de trayectos compartidos..."
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                if (errors.description)
                  setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              error={errors.description}
              multiline
              numberOfLines={3}
              inputStyle={styles.textArea}
            />

            {/* CIF / NIF (Opcional) */}
            <Input
              label="CIF / NIF (Opcional)"
              placeholder="B12345678"
              value={cif}
              onChangeText={setCif}
            />

            {/* Persona o departamento de contacto */}
            <Input
              label="Persona o Dpto. de contacto (Opcional)"
              icon={UserCheck}
              placeholder="Ej: Laura Sánchez (Recursos Humanos)"
              value={contactPerson}
              onChangeText={setContactPerson}
            />

            {/* Teléfono institucional */}
            <Input
              label="Teléfono corporativo (Opcional)"
              icon={Phone}
              placeholder="+34 927 123 456"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Sitio web */}
            <Input
              label="Sitio web de la entidad (Opcional)"
              icon={Globe}
              placeholder="https://tuempresa.es"
              value={website}
              onChangeText={setWebsite}
              keyboardType="url"
              autoCapitalize="none"
            />

            {/* Botón de Finalización */}
            <Button
              title="Completar y Entrar al Panel"
              onPress={handleFinish}
              variant="primary"
              loading={loading}
              icon={
                <CheckCircle2 size={18} color={COLORS.white} strokeWidth={2.4} />
              }
              style={styles.submitButton}
            />

            {/* Enlace para cancelar y salir */}
            <TouchableOpacity
              style={styles.cancelExitButton}
              onPress={handleExitToAuth}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelExitText}>
                Cancelar y volver a la pantalla de inicio
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // #EEF5F0
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  cancelExitButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelExitText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray600,
    textDecorationLine: "underline",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft || "#E3F4EA",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  badgeText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.greenOnLight,
  },
  title: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: BRAND.black,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray600,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
});

export default EnterpriseOnboardingScreen;
