// YouConnext - EnterpriseSettingsScreen (Ajustes y Perfil Institucional de Empresa)
import React, { useState, useEffect } from "react";
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
  User,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import { EnterpriseHeader } from "../../components/enterprise";
import PressableScale from "../../components/common/PressableScale";
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

  const [profile, setProfile] = useState(selectedEnterprise || {});

  useEffect(() => {
    (async () => {
      const data = await enterpriseService.getMyEnterpriseProfile();
      if (data) setProfile(data);
    })();
  }, []);

  const handleReturnPersonal = () => {
    switchMode("personal");
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Seguro que deseas salir de tu cuenta?", [
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

        {/* Datos de la Organización */}
        <Text style={styles.sectionLabel}>Datos de la Entidad</Text>
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.orgIconWrap}>
              <Building2 size={24} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <View style={styles.cardHeaderText}>
              <View style={styles.nameRow}>
                <Text style={styles.orgName}>
                  {profile.name || selectedEnterprise?.name || "Empresa YouConnext"}
                </Text>
                <ShieldCheck size={18} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.orgSector}>
                {profile.sector || "Movilidad Sostenible y RSC"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Campos de datos */}
          <View style={styles.fieldRow}>
            <FileBadge size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>CIF / Identificador:</Text>
            <Text style={styles.fieldValue}>{profile.cif || "B-88392104"}</Text>
          </View>

          <View style={styles.fieldRow}>
            <MapPin size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Sede Central:</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {profile.address_line1 || "Calle Gran Vía 28, Madrid"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Mail size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Contacto:</Text>
            <Text style={styles.fieldValue}>
              {profile.email || "sostenibilidad@empresa.com"}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Phone size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Teléfono:</Text>
            <Text style={styles.fieldValue}>{profile.phone || "+34 910 00 00 00"}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Globe size={16} color={COLORS.gray500} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Sitio Web:</Text>
            <Text style={styles.fieldValue}>
              {profile.website || "https://youconnext.es"}
            </Text>
          </View>
        </View>

        {/* Conmutador de Empresa si tiene múltiples membresías */}
        {corporateMemberships.length > 1 && (
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 6,
    marginBottom: 8,
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
    fontSize: 17,
    fontWeight: "800",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
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
    paddingVertical: 5,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray600,
    width: 110,
  },
  fieldValue: {
    fontSize: 12.5,
    fontWeight: "600",
    color: BRAND.black,
    flex: 1,
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
