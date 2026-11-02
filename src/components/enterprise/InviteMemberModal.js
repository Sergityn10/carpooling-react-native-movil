// YouConnext - InviteMemberModal (Modal de Invitación de Miembro con Rol y Departamento)
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  X,
  UserPlus,
  Mail,
  User,
  Briefcase,
  Shield,
  Hash,
  CheckCircle2,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, BRAND, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";

const ROLES = [
  {
    key: "Empleado",
    label: "Empleado",
    desc: "Accede a rutas corporativas exclusivas y carnet digital.",
    icon: User,
  },
  {
    key: "Manager",
    label: "Manager",
    desc: "Crea y gestiona eventos, acredita asistentes y revisa métricas.",
    icon: Briefcase,
  },
  {
    key: "Admin",
    label: "Administrador",
    desc: "Gestión total de miembros, roles, sedes y configuración.",
    icon: Shield,
  },
];

const DEPARTMENTS = [
  "Sostenibilidad",
  "Operaciones",
  "Tecnología / IT",
  "Recursos Humanos",
  "Ventas & Marketing",
  "Dirección",
];

const InviteMemberModal = ({ visible, onClose, onInviteSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("Empleado");
  const [selectedDept, setSelectedDept] = useState("Sostenibilidad");
  const [employeeCode, setEmployeeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setSelectedRole("Empleado");
    setSelectedDept("Sostenibilidad");
    setEmployeeCode("");
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose && onClose();
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg("Introduce el nombre completo del colaborador.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("Introduce un correo electrónico corporativo válido.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole,
        department: selectedDept,
        employeeCode: employeeCode.trim() || undefined,
      };

      if (onInviteSuccess) {
        await onInviteSuccess(payload);
      }
      handleClose();
    } catch (err) {
      setErrorMsg(err?.message || "No se pudo enviar la invitación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View style={styles.iconCircle}>
                <UserPlus size={18} color={COLORS.primary} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.title}>Invitar a la Organización</Text>
                <Text style={styles.subtitle}>
                  Asigna un rol y departamento al nuevo miembro
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              accessibilityLabel="Cerrar modal"
            >
              <X size={20} color={COLORS.gray500} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
          >
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Campo: Nombre */}
            <Text style={styles.inputLabel}>Nombre completo</Text>
            <View style={styles.inputBox}>
              <User size={16} color={COLORS.gray400} strokeWidth={2.2} />
              <TextInput
                style={styles.textInput}
                placeholder="Ej. María Fernández"
                placeholderTextColor={COLORS.gray400}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Campo: Email */}
            <Text style={styles.inputLabel}>Correo electrónico corporativo</Text>
            <View style={styles.inputBox}>
              <Mail size={16} color={COLORS.gray400} strokeWidth={2.2} />
              <TextInput
                style={styles.textInput}
                placeholder="colaborador@empresa.com"
                placeholderTextColor={COLORS.gray400}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Selector de Rol */}
            <Text style={styles.inputLabel}>Rol en la organización</Text>
            <View style={styles.rolesContainer}>
              {ROLES.map((r) => {
                const IconComponent = r.icon;
                const isSelected = selectedRole === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.roleCard,
                      isSelected && styles.roleCardSelected,
                    ]}
                    onPress={() => setSelectedRole(r.key)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleCardHeader}>
                      <View style={styles.roleTitleGroup}>
                        <IconComponent
                          size={15}
                          color={isSelected ? COLORS.primary : COLORS.gray600}
                          strokeWidth={2.4}
                        />
                        <Text
                          style={[
                            styles.roleTitle,
                            isSelected && styles.roleTitleSelected,
                          ]}
                        >
                          {r.label}
                        </Text>
                      </View>
                      {isSelected ? (
                        <CheckCircle2
                          size={16}
                          color={COLORS.primary}
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selector de Departamento */}
            <Text style={styles.inputLabel}>Departamento</Text>
            <View style={styles.deptWrap}>
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDept === dept;
                return (
                  <TouchableOpacity
                    key={dept}
                    style={[
                      styles.deptChip,
                      isSelected && styles.deptChipSelected,
                    ]}
                    onPress={() => setSelectedDept(dept)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.deptChipText,
                        isSelected && styles.deptChipTextSelected,
                      ]}
                    >
                      {dept}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Código de Empleado (Opcional) */}
            <Text style={styles.inputLabel}>Código de empleado (opcional)</Text>
            <View style={styles.inputBox}>
              <Hash size={16} color={COLORS.gray400} strokeWidth={2.2} />
              <TextInput
                style={styles.textInput}
                placeholder="Ej. EMP-402"
                placeholderTextColor={COLORS.gray400}
                value={employeeCode}
                onChangeText={setEmployeeCode}
                autoCapitalize="characters"
              />
            </View>

            {/* Botón de Enviar Invitación */}
            <PressableScale
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              scaleTo={0.98}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Enviar Invitación</Text>
              )}
            </PressableScale>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "90%",
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F4EA",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.black,
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
  },
  subtitle: {
    fontSize: 11.5,
    color: COLORS.gray500,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    paddingHorizontal: SPACING.screenMargin,
    paddingTop: SPACING.md,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: RADIUS.control,
    padding: 10,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray800,
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.control,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: BRAND.black,
  },
  rolesContainer: {
    gap: 8,
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  roleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F4FAF6",
  },
  roleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  roleTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  roleTitleSelected: {
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 2,
  },
  deptWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  deptChip: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  deptChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deptChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  deptChipTextSelected: {
    color: COLORS.white,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.control,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
});

export default InviteMemberModal;
