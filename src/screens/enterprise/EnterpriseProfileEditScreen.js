// YouConnext - EnterpriseProfileEditScreen (Edición y Completitud del Perfil Institucional v2)
// Gestión de todas las propiedades de base de datos admitidas en docs/api/enterprise.md
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileBadge,
  Users,
  UserCheck,
  FileText,
  ChevronLeft,
  Save,
  ShieldCheck,
} from "lucide-react-native";
import { useUser } from "../../context/UserContext";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import { Button, Input, PressableScale } from "../../components";

const EnterpriseProfileEditScreen = ({ navigation, route }) => {
  const { user, selectedEnterprise, actualizarOrganizacion } = useUser();

  const current = route?.params?.profile || selectedEnterprise || user?.enterprise || {};

  // Estados correspondientes al modelo de datos de la organización
  const [name, setName] = useState(current.name || user?.name || "");
  const [cif, setCif] = useState(current.cif || "");
  const [sector, setSector] = useState(current.sector || "");
  const [employeeCount, setEmployeeCount] = useState(
    current.employeeCount || current.employee_count
      ? String(current.employeeCount || current.employee_count)
      : ""
  );

  const [location, setLocation] = useState(current.location || "");
  const [addressLine1, setAddressLine1] = useState(
    current.addressLine1 || current.address_line1 || ""
  );
  const [city, setCity] = useState(current.city || "");
  const [province, setProvince] = useState(current.province || "");
  const [postalCode, setPostalCode] = useState(
    current.postalCode || current.postal_code || ""
  );
  const [country, setCountry] = useState(current.country || "ES");

  const [contactPerson, setContactPerson] = useState(
    current.contactPerson || current.contact_person || ""
  );
  const [phone, setPhone] = useState(current.phone || user?.phone || "");
  const [website, setWebsite] = useState(current.website || "");
  const [description, setDescription] = useState(current.description || "");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "El nombre oficial debe tener al menos 2 caracteres.";
    }

    if (!location.trim() || location.trim().length < 2) {
      newErrors.location = "Indica la sede principal o campus de la organización.";
    }

    if (!description.trim() || description.trim().length < 10) {
      newErrors.description =
        "La descripción institucional debe tener al menos 10 caracteres.";
    }

    if (employeeCount.trim() && isNaN(Number(employeeCount))) {
      newErrors.employeeCount = "Introduce un número válido de empleados.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        cif: cif.trim() || null,
        sector: sector.trim() || null,
        employee_count: employeeCount.trim() ? Number(employeeCount.trim()) : null,
        address_line1: addressLine1.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || "ES",
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        onboarding_ended: true,
      };

      await actualizarOrganizacion(payload);

      Alert.alert(
        "Perfil Guardado",
        "Los datos de tu organización se han actualizado con éxito en la plataforma.",
        [
          {
            text: "Aceptar",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error al guardar",
        error?.message ||
          "No se pudieron actualizar los datos de la entidad. Inténtalo de nuevo."
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
        {/* Barra superior con botón volver */}
        <View style={styles.headerBar}>
          <PressableScale
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver atrás"
          >
            <ChevronLeft size={22} color={BRAND.black} strokeWidth={2.4} />
          </PressableScale>

          <Text style={styles.headerBarTitle}>Editar Perfil Corporativo</Text>

          <View style={styles.headerBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabecera descriptiva */}
          <View style={styles.headerSection}>
            <View style={styles.badgeWrap}>
              <ShieldCheck size={16} color={BRAND.greenOnLight} strokeWidth={2.2} />
              <Text style={styles.badgeText}>Identidad & Sede B2B</Text>
            </View>
            <Text style={styles.title}>Datos Institucionales</Text>
            <Text style={styles.subtitle}>
              Completa los datos de tu entidad para emitir certificados de sostenibilidad, personalizar tus eventos y acreditar empleados.
            </Text>
          </View>

          {/* Bloque 1: Identidad Corporativa */}
          <Text style={styles.groupTitle}>1. Identidad de la Entidad</Text>
          <View style={styles.formCard}>
            <Input
              label="Nombre oficial de la organización *"
              icon={Building2}
              placeholder="Ej: EcoMobility S.L., Universidad..."
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
            />

            <Input
              label="CIF / NIF fiscal (Opcional)"
              icon={FileBadge}
              placeholder="Ej: B12345678"
              value={cif}
              onChangeText={setCif}
              autoCapitalize="characters"
            />

            <Input
              label="Sector de actividad (Opcional)"
              placeholder="Ej: Transporte, Sostenibilidad, Educación, IT..."
              value={sector}
              onChangeText={setSector}
            />

            <Input
              label="Número estimado de empleados (Opcional)"
              icon={Users}
              placeholder="Ej: 50, 250, 1500..."
              value={employeeCount}
              onChangeText={(t) => {
                setEmployeeCount(t);
                if (errors.employeeCount)
                  setErrors((prev) => ({ ...prev, employeeCount: undefined }));
              }}
              error={errors.employeeCount}
              keyboardType="numeric"
            />
          </View>

          {/* Bloque 2: Sede y Dirección Física */}
          <Text style={styles.groupTitle}>2. Sede y Dirección</Text>
          <View style={styles.formCard}>
            <Input
              label="Denominación de la sede principal / Campus *"
              icon={MapPin}
              placeholder="Ej: Sede Central Cáceres, Campus Norte..."
              value={location}
              onChangeText={(t) => {
                setLocation(t);
                if (errors.location)
                  setErrors((prev) => ({ ...prev, location: undefined }));
              }}
              error={errors.location}
            />

            <Input
              label="Dirección física (Opcional)"
              placeholder="Ej: Av. de la Innovación 4"
              value={addressLine1}
              onChangeText={setAddressLine1}
            />

            <View style={styles.inlineInputsRow}>
              <View style={styles.inlineInputFlex}>
                <Input
                  label="Ciudad"
                  placeholder="Ej: Cáceres"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.inlineInputFlex}>
                <Input
                  label="Provincia"
                  placeholder="Ej: Cáceres"
                  value={province}
                  onChangeText={setProvince}
                />
              </View>
            </View>

            <View style={styles.inlineInputsRow}>
              <View style={styles.inlineInputFlex}>
                <Input
                  label="Código Postal"
                  placeholder="10004"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inlineInputFlex}>
                <Input
                  label="País (ISO)"
                  placeholder="ES"
                  value={country}
                  onChangeText={setCountry}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          {/* Bloque 3: Contacto y Representación */}
          <Text style={styles.groupTitle}>3. Contacto y Comunicación</Text>
          <View style={styles.formCard}>
            <Input
              label="Persona o Dpto. de contacto (Opcional)"
              icon={UserCheck}
              placeholder="Ej: Laura Sánchez (Dpto. RRHH)"
              value={contactPerson}
              onChangeText={setContactPerson}
            />

            <Input
              label="Teléfono corporativo (Opcional)"
              icon={Phone}
              placeholder="+34 927 123 456"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Input
              label="Página web oficial (Opcional)"
              icon={Globe}
              placeholder="https://tuempresa.es"
              value={website}
              onChangeText={setWebsite}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Bloque 4: Descripción y Compromiso */}
          <Text style={styles.groupTitle}>4. Compromiso Sostenible</Text>
          <View style={styles.formCard}>
            <Input
              label="Descripción institucional / Objetivos de movilidad *"
              icon={FileText}
              placeholder="Describe el compromiso de tu organización con el carpooling, la reducción de emisiones y eventos corporativos..."
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                if (errors.description)
                  setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              error={errors.description}
              multiline
              numberOfLines={4}
              inputStyle={styles.textArea}
            />
          </View>

          {/* Botón de Guardado */}
          <Button
            title="Guardar Cambios Institucionales"
            onPress={handleSave}
            variant="primary"
            loading={loading}
            icon={<Save size={18} color={COLORS.white} strokeWidth={2.4} />}
            style={styles.saveButton}
          />
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
  flex: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: SPACING.screenMargin,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  headerBarTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.black,
  },
  headerBarSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  headerSection: {
    marginBottom: SPACING.md,
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft || "#E3F4EA",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  badgeText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 11,
    fontWeight: "700",
    color: BRAND.greenOnLight,
  },
  title: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: BRAND.black,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.gray600,
  },
  groupTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.cardPadding,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  inlineInputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  inlineInputFlex: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  saveButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
});

export default EnterpriseProfileEditScreen;
