// YouConnext - EnterpriseSettingsScreen (Ajustes y Perfil Institucional de Empresa)
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  ArrowLeftRight,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Pencil,
  Sparkles,
  CheckCircle2,
  Users,
  UserCheck,
  FileText,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import { EnterpriseHeader } from "../../components/enterprise";
import PressableScale from "../../components/common/PressableScale";
import Button from "../../components/common/Button";
import { useUser } from "../../context/UserContext";
import { enterpriseService } from "../../services/enterpriseService";

const EnterpriseSettingsScreen = ({ navigation }) => {
  const {
    user,
    selectedEnterprise,
    corporateMemberships,
    switchMode,
    setSelectedEnterprise,
    cerrarSesion,
    permissions,
  } = useUser();

  const [profile, setProfile] = useState(
    selectedEnterprise || user?.enterprise || {}
  );
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Recarga de perfil al montar y al recuperar foco de la pantalla
  const fetchProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const data = await enterpriseService.getMyEnterpriseProfile();
      if (data) {
        setProfile((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn("Error cargando perfil corporativo:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    const unsubscribe = navigation?.addListener?.("focus", fetchProfile);
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [navigation, fetchProfile]);

  useEffect(() => {
    if (selectedEnterprise) {
      setProfile((prev) => ({ ...prev, ...selectedEnterprise }));
    }
  }, [selectedEnterprise]);

  // Perfil sanitizado contra valores nulos o indefinidos
  const safeProfile =
    typeof profile === "object" && profile !== null ? profile : {};

  // Cálculo dinámico de completitud de perfil (14 propiedades de base de datos)
  const profileFields = [
    {
      key: "name",
      label: "Nombre",
      value: safeProfile.name || selectedEnterprise?.name || user?.name,
    },
    { key: "location", label: "Campus / Sede", value: safeProfile.location },
    {
      key: "description",
      label: "Descripción / Compromiso",
      value: safeProfile.description,
    },
    { key: "cif", label: "CIF", value: safeProfile.cif },
    { key: "sector", label: "Sector", value: safeProfile.sector },
    {
      key: "employee_count",
      label: "Empleados",
      value: safeProfile.employee_count || safeProfile.employeeCount,
    },
    {
      key: "contact_person",
      label: "Persona de Contacto",
      value: safeProfile.contact_person || safeProfile.contactPerson,
    },
    {
      key: "phone",
      label: "Teléfono",
      value: safeProfile.phone || user?.phone,
    },
    { key: "website", label: "Sitio Web", value: safeProfile.website },
    {
      key: "address_line1",
      label: "Dirección",
      value: safeProfile.address_line1 || safeProfile.addressLine1,
    },
    { key: "city", label: "Ciudad", value: safeProfile.city },
    { key: "province", label: "Provincia", value: safeProfile.province },
    {
      key: "postal_code",
      label: "Código Postal",
      value: safeProfile.postal_code || safeProfile.postalCode,
    },
    { key: "country", label: "País", value: safeProfile.country },
  ];

  const filledCount = profileFields.filter(
    (f) => f.value !== null && f.value !== undefined && String(f.value).trim().length > 0
  ).length;
  const totalCount = profileFields.length;
  const completionPercentage = Math.round((filledCount / totalCount) * 100);
  const isComplete = completionPercentage === 100;

  const handleReturnPersonal = () => {
    switchMode("personal");
  };

  const handleNavigateEdit = () => {
    navigation.navigate("EnterpriseProfileEdit", { profile });
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Seguro que deseas salir de tu cuenta corporativa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, salir",
        style: "destructive",
        onPress: async () => {
          await cerrarSesion();
        },
      },
    ]);
  };

  const canSwitchPersonal = permissions?.can_access_personal_mode !== false;

  const formatAddress = () => {
    const parts = [
      safeProfile.address_line1 || safeProfile.addressLine1,
      safeProfile.postal_code || safeProfile.postalCode,
      safeProfile.city,
      safeProfile.province,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return safeProfile.location || "Sin especificar";
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <EnterpriseHeader
        title="Perfil Institucional"
        subtitle="Configuración y sedes corporativas"
        showSwitcher={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Regreso a Modo Personal (Prominente) */}
        {canSwitchPersonal && (
          <PressableScale
            style={styles.switchPersonalCard}
            onPress={handleReturnPersonal}
            scaleTo={0.98}
          >
            <View style={styles.switchIconBox}>
              <ArrowLeftRight size={20} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <View style={styles.switchTextBox}>
              <Text style={styles.switchTitle}>Volver a Modo Personal</Text>
              <Text style={styles.switchSubtitle}>
                Regresa a tus trayectos, reservas de carpooling y monedero de viajero
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.primary} strokeWidth={2.4} />
          </PressableScale>
        )}

        {/* Tarjeta de Completitud y Acceso a Edición de Perfil */}
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <View style={styles.completionTitleRow}>
              {isComplete ? (
                <View style={[styles.badgeIconWrap, { backgroundColor: "#DCFCE7" }]}>
                  <CheckCircle2 size={18} color={COLORS.primary} strokeWidth={2.5} />
                </View>
              ) : (
                <View style={[styles.badgeIconWrap, { backgroundColor: "#FEF3C7" }]}>
                  <Sparkles size={18} color={COLORS.accent} strokeWidth={2.4} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.completionTitle}>
                  {isComplete ? "Perfil Institucional Verificado" : "Completa tu Perfil"}
                </Text>
                <Text style={styles.completionSubtitle}>
                  {isComplete
                    ? "Toda la información técnica y de contacto está al 100%."
                    : `Faltan ${totalCount - filledCount} datos para completar la ficha de la organización.`}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.percentageBadge,
                isComplete && styles.percentageBadgeComplete,
              ]}
            >
              <Text
                style={[
                  styles.percentageText,
                  isComplete && styles.percentageTextComplete,
                ]}
              >
                {completionPercentage}%
              </Text>
            </View>
          </View>

          {/* Barra de Progreso */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(5, Math.min(100, completionPercentage))}%`,
                  backgroundColor: isComplete ? COLORS.primary : COLORS.accent,
                },
              ]}
            />
          </View>

          {/* Botón de Acción Principal */}
          <Button
            title={
              isComplete
                ? "Editar Perfil Institucional"
                : "Completar Perfil de Organización"
            }
            variant={isComplete ? "outline" : "primary"}
            size="medium"
            icon={
              <Pencil
                size={16}
                color={isComplete ? COLORS.primary : COLORS.white}
                strokeWidth={2.4}
              />
            }
            onPress={handleNavigateEdit}
            style={styles.editActionBtn}
          />
        </View>

        {/* Datos de la Organización */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Ficha de la Entidad</Text>
          <TouchableOpacity
            style={styles.editInlineBtn}
            onPress={handleNavigateEdit}
            activeOpacity={0.7}
          >
            <Pencil size={13} color={COLORS.primary} strokeWidth={2.2} />
            <Text style={styles.editInlineText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.orgIconWrap}>
              <Building2 size={24} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <View style={styles.cardHeaderText}>
              <View style={styles.nameRow}>
                <Text style={styles.orgName} numberOfLines={1}>
                  {safeProfile.name || selectedEnterprise?.name || user?.name || "Organización"}
                </Text>
                <ShieldCheck size={18} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.orgSector} numberOfLines={1}>
                {safeProfile.sector || "Sector sin especificar"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Campos de datos mapeados al modelo */}
          <View style={styles.fieldRow}>
            <FileBadge size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>CIF / NIF:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.cif && styles.fieldValueMuted,
              ]}
              numberOfLines={1}
            >
              {safeProfile.cif || "Sin especificar"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <MapPin size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Sede / Dirección:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.address_line1 && !safeProfile.addressLine1 && styles.fieldValueMuted,
              ]}
              numberOfLines={2}
            >
              {formatAddress()}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Building2 size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Campus / Sede:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.location && styles.fieldValueMuted,
              ]}
              numberOfLines={1}
            >
              {safeProfile.location || "Sin especificar"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <UserCheck size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Responsable:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.contact_person && !safeProfile.contactPerson && styles.fieldValueMuted,
              ]}
              numberOfLines={1}
            >
              {safeProfile.contact_person || safeProfile.contactPerson || "Sin especificar"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Mail size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Email Contacto:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.email && !user?.email && styles.fieldValueMuted,
              ]}
              numberOfLines={1}
            >
              {safeProfile.email || user?.email || "Sin especificar"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Phone size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Teléfono:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.phone && !user?.phone && styles.fieldValueMuted,
              ]}
              numberOfLines={1}
            >
              {safeProfile.phone || user?.phone || "Sin especificar"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Globe size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Sitio Web:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.website && styles.fieldValueMuted,
              ]}
              numberOfLines={1}
            >
              {safeProfile.website || "Sin especificar"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Users size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Plantilla:</Text>
            <Text
              style={[
                styles.fieldValue,
                !safeProfile.employee_count && !safeProfile.employeeCount && styles.fieldValueMuted,
              ]}
              numberOfLines={1}
            >
              {safeProfile.employee_count || safeProfile.employeeCount
                ? `${safeProfile.employee_count || safeProfile.employeeCount} personas`
                : "Sin especificar"}
            </Text>
          </View>

          {/* Compromiso Sostenible / Descripción */}
          <View style={styles.descriptionBox}>
            <View style={styles.descriptionHeader}>
              <FileText size={15} color={COLORS.primary} strokeWidth={2.2} />
              <Text style={styles.descriptionTitle}>Compromiso Sostenible</Text>
            </View>
            <Text
              style={[
                styles.descriptionText,
                !safeProfile.description && styles.fieldValueMuted,
              ]}
            >
              {safeProfile.description ||
                "Añade una descripción sobre los valores de movilidad y sostenibilidad de tu entidad."}
            </Text>
          </View>
        </View>

        {/* Conmutador de Empresa si tiene múltiples membresías */}
        {corporateMemberships && corporateMemberships.length > 1 && (
          <>
            <Text style={styles.sectionLabel}>Tus Organizaciones Vinculadas</Text>
            <View style={styles.membershipsCard}>
              {corporateMemberships.map((m) => {
                const isSelected =
                  String(m.enterprise_id || m.id) ===
                  String(selectedEnterprise?.enterprise_id || selectedEnterprise?.id);
                return (
                  <TouchableOpacity
                    key={m.enterprise_id || m.id}
                    style={[
                      styles.membershipItem,
                      isSelected && styles.membershipItemSelected,
                    ]}
                    onPress={() => setSelectedEnterprise(m)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.membershipIconWrap}>
                      <Building2
                        size={16}
                        color={isSelected ? COLORS.primary : COLORS.gray600}
                        strokeWidth={2.2}
                      />
                    </View>
                    <View style={styles.membershipText}>
                      <Text
                        style={[
                          styles.membershipName,
                          isSelected && styles.membershipNameSelected,
                        ]}
                      >
                        {m.enterprise_name || m.name}
                      </Text>
                      <Text style={styles.membershipRole}>
                        Rol: {m.corporate_role_title || m.corporate_role || "Miembro"}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={styles.activeDotBadge}>
                        <Text style={styles.activeDotBadgeText}>Activa</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#DC2626" strokeWidth={2.4} />
          <Text style={styles.logoutBtnText}>Cerrar Sesión Corporativa</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  switchPersonalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
    gap: 12,
    ...SHADOWS.card,
  },
  switchIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E3F4EA",
    alignItems: "center",
    justifyContent: "center",
  },
  switchTextBox: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  switchSubtitle: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    lineHeight: 15,
  },
  completionCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  completionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  badgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  completionSubtitle: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    lineHeight: 15,
  },
  percentageBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  percentageBadgeComplete: {
    backgroundColor: "#DCFCE7",
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accent,
  },
  percentageTextComplete: {
    color: COLORS.primary,
  },
  progressTrack: {
    height: 7,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.round,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.round,
  },
  editActionBtn: {
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.black,
  },
  editInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  editInlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orgIconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.control,
    backgroundColor: "#F4FAF6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orgName: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    flex: 1,
  },
  orgSector: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray600,
    width: 120,
  },
  fieldValue: {
    fontSize: 12.5,
    fontWeight: "600",
    color: BRAND.black,
    flex: 1,
  },
  fieldValueMuted: {
    color: COLORS.gray400,
    fontStyle: "italic",
    fontWeight: "400",
  },
  descriptionBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: RADIUS.input,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.black,
  },
  descriptionText: {
    fontSize: 12,
    color: COLORS.gray700,
    lineHeight: 17,
  },
  membershipsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: SPACING.md,
  },
  membershipItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  membershipItemSelected: {
    backgroundColor: "#F4FAF6",
  },
  membershipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipText: {
    flex: 1,
  },
  membershipName: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.black,
  },
  membershipNameSelected: {
    color: COLORS.primary,
  },
  membershipRole: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 1,
  },
  activeDotBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  activeDotBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: RADIUS.control,
    gap: 8,
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#DC2626",
  },
});

export default EnterpriseSettingsScreen;
