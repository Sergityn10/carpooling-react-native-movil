// YouConnext - MiPerfilSection Component (Pro UI/UX Redesign)
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Mail,
  Phone,
  Calendar,
  Pencil,
  Shield,
  Star,
  ChevronRight,
  User as UserIcon,
  MapPin,
  MessageSquare,
  Award,
  Camera,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../../constants";
import SubViewHeader from "./SubViewHeader";
import { PlaceAutocompleteInput } from "../../";
import PressableScale from "../../common/PressableScale";

const MiPerfilSection = ({
  user,
  navigation,
  formData,
  editingSection,
  saving,
  showDatePicker,
  datePickerDate,
  uploadingImage,
  selectedPlace,
  onInputChange,
  onDateChange,
  onShowDatePicker,
  onPlaceSelect,
  onSaveSection,
  onCancelSection,
  onEditSection,
  onPickImage,
  onBack,
}) => {
  const completion = user?.completitud?.porcentaje_total ?? 0;
  const initial = (user?.name || user?.nombre || "U").charAt(0).toUpperCase();
  const displayName = `${user?.name || user?.nombre || "Usuario"} ${user?.surname || user?.apellidos || ""}`.trim();

  const renderSectionEditButton = (section) => (
    <TouchableOpacity
      style={styles.sectionEditBtn}
      onPress={() => onEditSection(section)}
      activeOpacity={0.8}
    >
      <Pencil size={13} color={COLORS.primaryDark} strokeWidth={2.4} />
      <Text style={styles.sectionEditBtnText}>Editar</Text>
    </TouchableOpacity>
  );

  const renderSectionButtons = (section) => (
    <View style={styles.editButtonRow}>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => onCancelSection(section)}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelBtnText}>Cancelar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => onSaveSection(section)}
        disabled={saving}
        activeOpacity={0.88}
      >
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.saveBtnText}>Guardar cambios</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "android" ? 0 : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SubViewHeader title="Mis datos personales" onBack={onBack} />

        {/* Tarjeta Hero del Avatar y Estado */}
        <View style={styles.avatarHeroCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={onPickImage}
            disabled={uploadingImage}
            activeOpacity={0.85}
          >
            {user?.img_perfil ? (
              <Image
                source={{ uri: user.img_perfil }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Camera size={14} color={COLORS.white} strokeWidth={2.5} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.avatarName}>{displayName}</Text>
          {(user.ciudad || user.provincia) && (
            <View style={styles.locationRow}>
              <MapPin size={13} color={COLORS.gray400} strokeWidth={2.2} />
              <Text style={styles.locationText}>
                {[user.ciudad, user.provincia].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {/* Banner de Completitud de Perfil */}
          {completion < 100 && (
            <View style={styles.completionCard}>
              <View style={styles.completionHeaderRow}>
                <View style={styles.completionTextCol}>
                  <Text style={styles.completionTitle}>Completa tu perfil</Text>
                  <Text style={styles.completionSubtitle}>
                    {user?.completitud?.campos_faltantes?.length || 0} campos restantes para 100%
                  </Text>
                </View>
                <Text style={styles.completionPercent}>{completion}%</Text>
              </View>

              <View style={styles.completionBarBg}>
                <View
                  style={[
                    styles.completionBarFill,
                    { width: `${Math.max(6, completion)}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* SECCIÓN 1: DATOS PERSONALES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBox}>
                <UserIcon size={18} color={COLORS.gray800} strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionTitle}>Datos personales</Text>
            </View>
            {editingSection !== "datos-personales" &&
              renderSectionEditButton("datos-personales")}
          </View>

          {editingSection === "datos-personales" ? (
            <View style={styles.editForm}>
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(v) => onInputChange("name", v)}
                    placeholder="Tu nombre"
                    placeholderTextColor={COLORS.gray400}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Apellidos</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={formData.surname}
                    onChangeText={(v) => onInputChange("surname", v)}
                    placeholder="Tus apellidos"
                    placeholderTextColor={COLORS.gray400}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={onShowDatePicker}
                  activeOpacity={0.8}
                >
                  <Calendar size={16} color={COLORS.gray500} strokeWidth={2.2} />
                  <Text
                    style={[
                      styles.textInput,
                      !formData.fecha_nacimiento && styles.placeholderText,
                    ]}
                  >
                    {formData.fecha_nacimiento
                      ? new Date(formData.fecha_nacimiento).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "Selecciona tu fecha"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Género</Text>
                <View style={styles.genderOptionsRow}>
                  {["Masculino", "Femenino", "Otro"].map((g) => {
                    const isSelected = formData.genero === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderPill,
                          isSelected && styles.genderPillSelected,
                        ]}
                        onPress={() => onInputChange("genero", g)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.genderPillText,
                            isSelected && styles.genderPillTextSelected,
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {renderSectionButtons("datos-personales")}
            </View>
          ) : (
            <View style={styles.viewList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre completo</Text>
                <Text style={styles.infoValue}>
                  {user.name || user.surname
                    ? `${user.name || ""} ${user.surname || ""}`.trim()
                    : "No especificado"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
                <Text style={styles.infoValue}>
                  {user.fecha_nacimiento
                    ? new Date(user.fecha_nacimiento).toLocaleDateString(
                        "es-ES",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "No especificada"}
                </Text>
              </View>

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Género</Text>
                <Text style={styles.infoValue}>
                  {user.genero || "No especificado"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* SECCIÓN 2: DATOS DE LA CUENTA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBox}>
                <Shield size={18} color={COLORS.gray800} strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionTitle}>Datos de la cuenta</Text>
            </View>
            {editingSection !== "datos-cuenta" &&
              renderSectionEditButton("datos-cuenta")}
          </View>

          {editingSection === "datos-cuenta" ? (
            <View style={styles.editForm}>
              <View style={styles.inputField}>
                <View style={styles.labelWithLock}>
                  <Text style={styles.fieldLabel}>Correo electrónico</Text>
                  <Lock size={12} color={COLORS.gray400} strokeWidth={2} />
                </View>
                <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
                  <Mail size={16} color={COLORS.gray400} strokeWidth={2.2} />
                  <TextInput
                    value={formData.email}
                    editable={false}
                    style={[styles.textInput, { color: COLORS.gray500 }]}
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Teléfono móvil</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={16} color={COLORS.gray500} strokeWidth={2.2} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.phone}
                    onChangeText={(v) => onInputChange("phone", v)}
                    placeholder="600 000 000"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>DNI / NIE</Text>
                <View style={styles.inputWrapper}>
                  <Shield size={16} color={COLORS.gray500} strokeWidth={2.2} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.dni}
                    onChangeText={(v) => onInputChange("dni", v.toUpperCase())}
                    placeholder="12345678A"
                    placeholderTextColor={COLORS.gray400}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {renderSectionButtons("datos-cuenta")}
            </View>
          ) : (
            <View style={styles.viewList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Correo electrónico</Text>
                <Text style={styles.infoValue}>
                  {user.email || "No especificado"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono móvil</Text>
                <Text style={styles.infoValue}>
                  {user.phone || "No especificado"}
                </Text>
              </View>

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>DNI / NIE</Text>
                <Text style={styles.infoValue}>
                  {user.dni || "No especificado"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* SECCIÓN 3: SOBRE MÍ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBox}>
                <MessageSquare size={18} color={COLORS.gray800} strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionTitle}>Sobre mí</Text>
            </View>
            {editingSection !== "sobre-mi" &&
              renderSectionEditButton("sobre-mi")}
          </View>

          {editingSection === "sobre-mi" ? (
            <View style={styles.editForm}>
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Biografía</Text>
                <TextInput
                  style={[styles.textInput, styles.aboutMeTextArea]}
                  value={formData.about_me}
                  onChangeText={(v) => onInputChange("about_me", v)}
                  placeholder="Cuéntale a la comunidad tus gustos, tus trayectos habituales o tu música favorita para viajar..."
                  placeholderTextColor={COLORS.gray400}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.charCountText}>
                  {formData.about_me?.length || 0}/500 caracteres
                </Text>
              </View>

              {renderSectionButtons("sobre-mi")}
            </View>
          ) : (
            <View style={styles.aboutMeContainer}>
              {user.about_me ? (
                <Text style={styles.aboutMeText}>{user.about_me}</Text>
              ) : (
                <View style={styles.aboutMeEmptyBox}>
                  <Text style={styles.aboutMeEmptyText}>
                    Aún no has escrito una descripción sobre ti. Añade detalles para generar mayor confianza con tus compañeros de viaje.
                  </Text>
                  <TouchableOpacity
                    style={styles.writeBioBtn}
                    onPress={() => onEditSection("sobre-mi")}
                    activeOpacity={0.8}
                  >
                    <Pencil size={13} color={COLORS.primaryDark} strokeWidth={2.5} />
                    <Text style={styles.writeBioBtnText}>Escribir biografía</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* SECCIÓN 4: UBICACIÓN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBox}>
                <MapPin size={18} color={COLORS.gray800} strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionTitle}>Ubicación principal</Text>
            </View>
            {editingSection !== "ubicacion" &&
              renderSectionEditButton("ubicacion")}
          </View>

          {editingSection === "ubicacion" ? (
            <View style={styles.editForm}>
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Buscar dirección</Text>
                <PlaceAutocompleteInput
                  placeholder="Introduce tu calle o zona..."
                  value={formData.direccion}
                  onChangeText={(v) => onInputChange("direccion", v)}
                  onSelectPlace={onPlaceSelect}
                  components="country:es"
                />
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Ciudad</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={formData.ciudad}
                    onChangeText={(v) => onInputChange("ciudad", v)}
                    placeholder="Tu ciudad"
                    placeholderTextColor={COLORS.gray400}
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Provincia</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={formData.provincia}
                    onChangeText={(v) => onInputChange("provincia", v)}
                    placeholder="Tu provincia"
                    placeholderTextColor={COLORS.gray400}
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Código postal</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={formData.codigo_postal}
                    onChangeText={(v) => onInputChange("codigo_postal", v)}
                    placeholder="28001"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>País</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={formData.pais}
                    onChangeText={(v) => onInputChange("pais", v)}
                    placeholder="España"
                    placeholderTextColor={COLORS.gray400}
                  />
                </View>
              </View>

              {renderSectionButtons("ubicacion")}
            </View>
          ) : (
            <View style={styles.viewList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>
                  {user.direccion || "No especificada"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ciudad / Población</Text>
                <Text style={styles.infoValue}>
                  {user.ciudad || "No especificada"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Provincia</Text>
                <Text style={styles.infoValue}>
                  {user.provincia || "No especificada"}
                </Text>
              </View>

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Código postal / País</Text>
                <Text style={styles.infoValue}>
                  {[user.codigo_postal, user.pais].filter(Boolean).join(", ") || "No especificado"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* SECCIÓN 5: VALORACIONES Y REPUTACIÓN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBox}>
                <Star size={18} color={COLORS.warning} strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionTitle}>Reputación y valoraciones</Text>
            </View>
          </View>

          <View style={styles.reputationCard}>
            <View style={styles.reputationMainRow}>
              <Text style={styles.reputationRatingNumber}>
                {user.averageRating ? user.averageRating.toFixed(1) : "5.0"}
              </Text>

              <View style={styles.reputationStarsCol}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      color={
                        i <= Math.round(user.averageRating || 5)
                          ? COLORS.warning
                          : COLORS.gray300
                      }
                      fill={
                        i <= Math.round(user.averageRating || 5)
                          ? COLORS.warning
                          : "none"
                      }
                      strokeWidth={2}
                    />
                  ))}
                </View>
                <Text style={styles.reputationCountText}>
                  {user.numOpinions || 0} {user.numOpinions === 1 ? "opinión recibida" : "opiniones recibidas"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.seeReviewsBtn}
                onPress={() => navigation.navigate("Opiniones")}
                activeOpacity={0.8}
              >
                <Text style={styles.seeReviewsBtnText}>Ver todas</Text>
                <ChevronRight size={14} color={COLORS.primaryDark} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />

        {showDatePicker && (
          <DateTimePicker
            value={datePickerDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={onDateChange}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  // Hero Avatar Card
  avatarHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: SPACING.sm + 2,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: COLORS.gray100,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.small,
  },
  avatarInitial: {
    fontSize: FONTS.xxxl,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarName: {
    fontSize: FONTS.xl,
    lineHeight: 26,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  completionCard: {
    width: "100%",
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  completionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completionTextCol: {
    flex: 1,
  },
  completionTitle: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  completionSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.gray500,
    marginTop: 1,
  },
  completionPercent: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  completionBarBg: {
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
  },
  completionBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  // Section Cards
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: FONTS.md,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.gray900,
    letterSpacing: -0.2,
  },
  sectionEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  sectionEditBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  // View mode list
  viewList: {
    gap: SPACING.xs,
  },
  infoRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: 2,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.gray400,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FONTS.sm,
    lineHeight: 20,
    color: COLORS.gray900,
    fontWeight: "600",
  },
  // Edit mode form
  editForm: {
    gap: SPACING.md,
  },
  inputField: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: FONTS.xs,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  labelWithLock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputWrapperDisabled: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
  },
  textInput: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.gray900,
    fontWeight: "600",
    padding: 0,
  },
  placeholderText: {
    color: COLORS.gray400,
    fontWeight: "500",
  },
  genderOptionsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  genderPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
  },
  genderPillSelected: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  genderPillText: {
    fontSize: FONTS.xs,
    fontWeight: "700",
    color: COLORS.gray600,
  },
  genderPillTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: "800",
  },
  aboutMeTextArea: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: 100,
  },
  charCountText: {
    fontSize: 10,
    color: COLORS.gray400,
    textAlign: "right",
    marginTop: 2,
  },
  editButtonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    minHeight: 46,
  },
  cancelBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  saveBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minHeight: 46,
    ...SHADOWS.small,
  },
  saveBtnText: {
    fontSize: FONTS.sm,
    fontWeight: "800",
    color: COLORS.white,
  },
  // About Me Container
  aboutMeContainer: {
    paddingTop: 2,
  },
  aboutMeText: {
    fontSize: FONTS.sm,
    lineHeight: 22,
    color: COLORS.gray800,
    fontWeight: "500",
  },
  aboutMeEmptyBox: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  aboutMeEmptyText: {
    fontSize: FONTS.xs,
    lineHeight: 18,
    color: COLORS.gray500,
  },
  writeBioBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  writeBioBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  // Reputation Card
  reputationCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  reputationMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reputationRatingNumber: {
    fontSize: FONTS.xxxl,
    lineHeight: 36,
    fontWeight: "800",
    color: COLORS.gray900,
  },
  reputationStarsCol: {
    gap: 2,
    flex: 1,
    marginLeft: SPACING.md,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  reputationCountText: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  seeReviewsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  seeReviewsBtnText: {
    fontSize: FONTS.xs,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
});

export default MiPerfilSection;
