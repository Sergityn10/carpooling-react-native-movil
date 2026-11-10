// YouConnext - EnterpriseEmployeesScreen (Directorio de Miembros e Invitación con Roles)
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  User,
  Mail,
  Building,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import { EnterpriseHeader, InviteMemberModal } from "../../components/enterprise";
import PressableScale from "../../components/common/PressableScale";
import { useUser } from "../../context/UserContext";
import { enterpriseService } from "../../services/enterpriseService";

const ROLE_FILTERS = ["Todos", "Admins", "Managers", "Empleados"];

const EnterpriseEmployeesScreen = ({ navigation }) => {
  const { switchMode, permissions, selectedEnterprise } = useUser();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const data = await enterpriseService.getEnterpriseMembers(selectedEnterprise?.id);
      setMembers(data || []);
    } catch (e) {
      console.warn("Error al cargar miembros de empresa:", e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEnterprise?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handleInviteSubmit = async (payload) => {
    const newMember = await enterpriseService.inviteEnterpriseMember(
      selectedEnterprise?.id,
      payload
    );
    Alert.alert(
      "Invitación Enviada",
      `Se ha enviado la invitación por correo a ${payload.email} con el rol de ${payload.role}.`
    );
    loadMembers();
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === "Admins") return (m.role || "").toLowerCase() === "admin";
    if (selectedFilter === "Managers") return (m.role || "").toLowerCase() === "manager";
    if (selectedFilter === "Empleados") return (m.role || "").toLowerCase() === "empleado";
    return true;
  });

  const getRoleIcon = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return <Shield size={12} color="#DC2626" strokeWidth={2.4} />;
    if (r === "manager") return <Briefcase size={12} color="#0284C7" strokeWidth={2.4} />;
    return <User size={12} color={COLORS.primary} strokeWidth={2.4} />;
  };

  const getRoleColor = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return { bg: "#FEE2E2", text: "#DC2626" };
    if (r === "manager") return { bg: "#E0F2FE", text: "#0284C7" };
    return { bg: "#E3F4EA", text: COLORS.primary };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <EnterpriseHeader
        title="Directorio del Equipo"
        subtitle={
          members.length === 0
            ? "Sin colaboradores aún"
            : members.length === 1
            ? "1 colaborador vinculado"
            : `${members.length} colaboradores vinculados`
        }
        onSwitchPersonal={() => switchMode("personal")}
        rightAction={
          <PressableScale
            style={styles.addBtn}
            onPress={() => setShowInviteModal(true)}
            scaleTo={0.96}
            accessibilityLabel="Invitar nuevo miembro"
          >
            <UserPlus size={15} color={COLORS.white} strokeWidth={2.5} />
            <Text style={styles.addBtnText}>Invitar</Text>
          </PressableScale>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Buscador */}
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.gray400} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o departamento..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filtros por Rol */}
        <View style={styles.filtersRow}>
          {ROLE_FILTERS.map((f) => {
            const isSelected = selectedFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedFilter(f)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Lista o Estado Vacío de Colaboradores */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando colaboradores...</Text>
          </View>
        ) : filteredMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={40} color={COLORS.gray400} strokeWidth={1.8} />
            <Text style={styles.emptyTitle}>
              {members.length === 0
                ? "No hay colaboradores vinculados"
                : "Sin resultados de búsqueda"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {members.length === 0
                ? "Aún no has incorporado colaboradores a la organización. Pulsa 'Invitar' para sumar el primer miembro a tu equipo."
                : searchQuery
                ? `No se encontraron colaboradores que coincidan con "${searchQuery}".`
                : "No se encontraron colaboradores para el filtro de rol seleccionado."}
            </Text>
            {members.length === 0 ? (
              <PressableScale
                style={styles.emptyBtn}
                onPress={() => setShowInviteModal(true)}
                scaleTo={0.98}
              >
                <UserPlus size={16} color={COLORS.white} strokeWidth={2.6} />
                <Text style={styles.emptyBtnText}>Invitar Colaborador</Text>
              </PressableScale>
            ) : (
              <PressableScale
                style={styles.emptyResetBtn}
                onPress={() => {
                  setSearchQuery("");
                  setSelectedFilter("Todos");
                }}
                scaleTo={0.98}
              >
                <Text style={styles.emptyResetBtnText}>Restablecer filtros</Text>
              </PressableScale>
            )}
          </View>
        ) : (
          <View style={styles.membersList}>
            {filteredMembers.map((member) => {
              const roleStyle = getRoleColor(member.role);
              const initial = (member.name || "U").charAt(0).toUpperCase();

              return (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberAvatarBox}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                    ) : (
                      <View style={styles.memberInitialBox}>
                        <Text style={styles.memberInitialText}>{initial}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.name}
                      </Text>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: roleStyle.bg },
                        ]}
                      >
                        {getRoleIcon(member.role)}
                        <Text
                          style={[styles.roleBadgeText, { color: roleStyle.text }]}
                        >
                          {member.role || "Empleado"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.email}
                    </Text>

                    <View style={styles.memberMetaRow}>
                      <Text style={styles.deptText}>
                        {member.department || "General"}
                      </Text>
                      {member.employee_code ? (
                        <Text style={styles.codeText}>• {member.employee_code}</Text>
                      ) : null}
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              member.status === "Activo"
                                ? COLORS.primary
                                : BRAND.accent,
                          },
                        ]}
                      />
                      <Text style={styles.statusText}>{member.status || "Activo"}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Modal para invitar miembros */}
      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={handleInviteSubmit}
      />
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
    paddingBottom: SPACING.xl,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.round,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.screenMargin,
    marginTop: SPACING.md,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: RADIUS.control,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: BRAND.black,
  },
  filtersRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.screenMargin,
    marginVertical: SPACING.md,
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  filterChipSelected: {
    backgroundColor: BRAND.black,
    borderColor: BRAND.black,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  filterChipTextSelected: {
    color: COLORS.white,
  },
  membersList: {
    marginHorizontal: SPACING.screenMargin,
    gap: 8,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  memberAvatarBox: {
    marginRight: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInitialBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4FAF6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberInitialText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.black,
    flex: 1,
    marginRight: 6,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    gap: 3,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  memberEmail: {
    fontSize: 11.5,
    color: COLORS.gray500,
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  deptText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  codeText: {
    fontSize: 10.5,
    color: COLORS.gray500,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    marginHorizontal: SPACING.screenMargin,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
    ...SHADOWS.card,
  },
  emptyTitle: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.black,
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.control,
    gap: 6,
  },
  emptyBtnText: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  emptyResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.control,
  },
  emptyResetBtnText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: COLORS.gray700,
  },
});

export default EnterpriseEmployeesScreen;
