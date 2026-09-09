import React from "react";
import {
  View,
  Text,
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
  Info,
  Camera,
} from "lucide-react-native";
import { COLORS, SPACING } from "../../../constants";
import styles from "../profileStyles";
import SubViewHeader from "./SubViewHeader";
import { PlaceAutocompleteInput } from "../../";

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
  const renderSectionEditButton = (section) => (
    <TouchableOpacity
      style={styles.sectionEditBtn}
      onPress={() => onEditSection(section)}
    >
      <Pencil size={16} color={COLORS.secondary} strokeWidth={2.5} />
      <Text style={styles.sectionEditBtnText}>Editar</Text>
    </TouchableOpacity>
  );

  const renderSectionButtons = (section) => (
    <View style={styles.editButtonRow}>
      <TouchableOpacity
        style={[
          styles.saveProfileBtn,
          { flex: 1, backgroundColor: COLORS.gray200 },
        ]}
        onPress={() => onCancelSection(section)}
        disabled={saving}
      >
        <Text style={[styles.saveProfileBtnText, { color: COLORS.gray700 }]}>
          Cancelar
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.saveProfileBtn, { flex: 2 }]}
        onPress={() => onSaveSection(section)}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.saveProfileBtnText}>Guardar</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.sectionContent}
      keyboardVerticalOffset={Platform.OS === "android" ? 0 : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sectionScroll}
        keyboardShouldPersistTaps="handled"
      >
        <SubViewHeader title="Mi perfil" onBack={onBack} />

        {/* Avatar con imagen y botón de editar */}
        <View style={styles.editAvatarSection}>
          <TouchableOpacity
            onPress={onPickImage}
            disabled={uploadingImage}
            activeOpacity={0.8}
          >
            <View style={styles.editAvatarWithCamera}>
              {user.img_perfil ? (
                <Image
                  source={{ uri: user.img_perfil }}
                  style={styles.editAvatarImage}
                />
              ) : (
                <View style={styles.editAvatar}>
                  <Text style={styles.editAvatarText}>
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View style={styles.editAvatarCameraBtn}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Camera size={16} color={COLORS.white} strokeWidth={2.5} />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.editAvatarName}>
            {user.name} {user.surname}
          </Text>
          {(user.ciudad || user.provincia) && (
            <View style={styles.editAvatarLocation}>
              <MapPin size={13} color={COLORS.gray400} strokeWidth={2} />
              <Text style={styles.editAvatarLocationText}>
                {[user.ciudad, user.provincia].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}
          <Text style={styles.editAvatarSubHint}>
            Toca la imagen para cambiar tu foto
          </Text>
        </View>

        {/* Barra de completitud del perfil */}
        {user.completitud && user.completitud.porcentaje_total < 100 && (
          <View style={styles.completionBanner}>
            <View style={styles.completionBannerLeft}>
              <Text style={styles.completionBannerTitle}>
                Completa tu perfil
              </Text>
              <Text style={styles.completionBannerSubtitle}>
                {user.completitud.campos_faltantes?.length || 0} campos
                restantes
              </Text>
            </View>
            <View style={styles.completionBannerRight}>
              <Text style={styles.completionBannerPercent}>
                {user.completitud.porcentaje_total || 0}%
              </Text>
              <View style={styles.completionBarBackground}>
                <View
                  style={[
                    styles.completionBarFill,
                    { width: `${user.completitud.porcentaje_total || 0}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* SECCIÓN 1: DATOS PERSONALES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <UserIcon size={20} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.sectionTitle}>Datos personales</Text>
            {editingSection !== "datos-personales" &&
              renderSectionEditButton("datos-personales")}
          </View>

          {editingSection === "datos-personales" ? (
            <>
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Nombre</Text>
                <View style={styles.editInputWrapper}>
                  <UserIcon size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.name}
                    onChangeText={(v) => onInputChange("name", v)}
                    placeholder="Tu nombre"
                    placeholderTextColor={COLORS.gray400}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Apellidos</Text>
                <View style={styles.editInputWrapper}>
                  <UserIcon size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.surname}
                    onChangeText={(v) => onInputChange("surname", v)}
                    placeholder="Tus apellidos"
                    placeholderTextColor={COLORS.gray400}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Fecha de nacimiento</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={onShowDatePicker}
                  activeOpacity={0.7}
                >
                  <View style={styles.editInputWrapper}>
                    <Calendar
                      size={18}
                      color={COLORS.gray400}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.editInput,
                        !formData.fecha_nacimiento &&
                          styles.editInputPlaceholder,
                      ]}
                    >
                      {formData.fecha_nacimiento
                        ? new Date(
                            formData.fecha_nacimiento,
                          ).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "Seleccionar fecha"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Género</Text>
                <View style={styles.genderPicker}>
                  {["Masculino", "Femenino", "Otro"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderOption,
                        formData.genero === g && styles.genderOptionSelected,
                      ]}
                      onPress={() => onInputChange("genero", g)}
                    >
                      <View
                        style={[
                          styles.genderRadio,
                          formData.genero === g && styles.genderRadioSelected,
                        ]}
                      />
                      <Text
                        style={[
                          styles.genderOptionText,
                          formData.genero === g &&
                            styles.genderOptionTextSelected,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {renderSectionButtons("datos-personales")}
            </>
          ) : (
            <>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.primarySoft },
                  ]}
                >
                  <UserIcon size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Nombre</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.name || "No especificado"}
                  </Text>
                </View>
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.primarySoft },
                  ]}
                >
                  <UserIcon size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Apellidos</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.surname || "No especificado"}
                  </Text>
                </View>
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.secondarySoft },
                  ]}
                >
                  <Calendar
                    size={16}
                    color={COLORS.secondary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Fecha de nacimiento</Text>
                  <Text style={styles.viewFieldValue}>
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
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.primarySoft },
                  ]}
                >
                  <UserIcon size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Género</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.genero || "No especificado"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* SECCIÓN 2: DATOS DE LA CUENTA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Shield size={20} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.sectionTitle}>Datos de la cuenta</Text>
            {editingSection !== "datos-cuenta" &&
              renderSectionEditButton("datos-cuenta")}
          </View>

          {editingSection === "datos-cuenta" ? (
            <>
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Correo electrónico</Text>
                <View style={styles.editInputWrapper}>
                  <Mail size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    value={formData.email}
                    onChangeText={(v) => onInputChange("email", v)}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={false}
                    style={[styles.editInput, { color: COLORS.gray500 }]}
                  />
                </View>
              </View>
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Teléfono</Text>
                <View style={styles.editInputWrapper}>
                  <Phone size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.phone}
                    onChangeText={(v) => onInputChange("phone", v)}
                    placeholder="600 000 000"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>DNI/NIE</Text>
                <View style={styles.editInputWrapper}>
                  <Shield size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.dni}
                    onChangeText={(v) => onInputChange("dni", v.toUpperCase())}
                    placeholder="12345678A"
                    placeholderTextColor={COLORS.gray400}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              {renderSectionButtons("datos-cuenta")}
            </>
          ) : (
            <>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.secondarySoft },
                  ]}
                >
                  <Mail size={16} color={COLORS.secondary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Correo electrónico</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.email || "No especificado"}
                  </Text>
                </View>
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.secondarySoft },
                  ]}
                >
                  <Phone size={16} color={COLORS.secondary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Teléfono</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.phone || "No especificado"}
                  </Text>
                </View>
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.gray100 },
                  ]}
                >
                  <Shield size={16} color={COLORS.gray600} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>DNI/NIE</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.dni || "No especificado"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* SECCIÓN 3: SOBRE MÍ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconWrapper,
                { backgroundColor: COLORS.secondarySoft },
              ]}
            >
              <Pencil size={20} color={COLORS.secondary} strokeWidth={2.5} />
            </View>
            <Text style={styles.sectionTitle}>Sobre mí</Text>
            {editingSection !== "sobre-mi" &&
              renderSectionEditButton("sobre-mi")}
          </View>

          {editingSection === "sobre-mi" ? (
            <>
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Descripción</Text>
                <TextInput
                  style={[styles.editInput, styles.aboutMeInput]}
                  value={formData.about_me}
                  onChangeText={(v) => onInputChange("about_me", v)}
                  placeholder="Cuéntanos algo sobre ti..."
                  placeholderTextColor={COLORS.gray400}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.aboutMeHint}>
                  {formData.about_me?.length || 0}/500 caracteres
                </Text>
              </View>
              {renderSectionButtons("sobre-mi")}
            </>
          ) : (
            <View style={styles.viewAboutMeContainer}>
              {user.about_me ? (
                <Text style={styles.viewAboutMe}>{user.about_me}</Text>
              ) : (
                <View style={styles.viewAboutMeEmpty}>
                  <Pencil size={24} color={COLORS.gray300} strokeWidth={2} />
                  <Text style={styles.viewAboutMeEmptyText}>
                    Aún no has añadido una descripción sobre ti.
                  </Text>
                  <TouchableOpacity
                    style={styles.sectionEditBtn}
                    onPress={() => onEditSection("sobre-mi")}
                  >
                    <Pencil
                      size={14}
                      color={COLORS.secondary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.sectionEditBtnText}>
                      Escribir ahora
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* SECCIÓN 4: UBICACIÓN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconWrapper,
                { backgroundColor: COLORS.primarySoft },
              ]}
            >
              <MapPin size={20} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            {editingSection !== "ubicacion" &&
              renderSectionEditButton("ubicacion")}
          </View>

          {editingSection === "ubicacion" ? (
            <>
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Buscar dirección</Text>
                <PlaceAutocompleteInput
                  placeholder="Busca tu dirección o lugar..."
                  value={formData.direccion}
                  onChangeText={(v) => onInputChange("direccion", v)}
                  onSelectPlace={onPlaceSelect}
                  components="country:es"
                />
              </View>

              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Ciudad</Text>
                <View style={styles.editInputWrapper}>
                  <MapPin size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.ciudad}
                    onChangeText={(v) => onInputChange("ciudad", v)}
                    placeholder="Tu ciudad"
                    placeholderTextColor={COLORS.gray400}
                  />
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Provincia</Text>
                <View style={styles.editInputWrapper}>
                  <MapPin size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.provincia}
                    onChangeText={(v) => onInputChange("provincia", v)}
                    placeholder="Tu provincia"
                    placeholderTextColor={COLORS.gray400}
                  />
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Código postal</Text>
                <View style={styles.editInputWrapper}>
                  <MapPin size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.codigo_postal}
                    onChangeText={(v) => onInputChange("codigo_postal", v)}
                    placeholder="Código postal"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>País</Text>
                <View style={styles.editInputWrapper}>
                  <MapPin size={18} color={COLORS.gray400} strokeWidth={2} />
                  <TextInput
                    style={styles.editInput}
                    value={formData.pais}
                    onChangeText={(v) => onInputChange("pais", v)}
                    placeholder="Tu país"
                    placeholderTextColor={COLORS.gray400}
                  />
                </View>
              </View>

              {renderSectionButtons("ubicacion")}
            </>
          ) : (
            <>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.primarySoft },
                  ]}
                >
                  <MapPin size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Dirección</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.direccion || "No especificada"}
                  </Text>
                </View>
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.primarySoft },
                  ]}
                >
                  <MapPin size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Ciudad</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.ciudad || "No especificada"}
                  </Text>
                </View>
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.primarySoft },
                  ]}
                >
                  <MapPin size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>Provincia</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.provincia || "No especificada"}
                  </Text>
                </View>
              </View>
              <View style={styles.viewField}>
                <View
                  style={[
                    styles.viewFieldIcon,
                    { backgroundColor: COLORS.primarySoft },
                  ]}
                >
                  <MapPin size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.viewFieldContent}>
                  <Text style={styles.viewFieldLabel}>País</Text>
                  <Text style={styles.viewFieldValue}>
                    {user.pais || "No especificado"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* SECCIÓN 5: VALORACIONES (solo lectura) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconWrapper,
                { backgroundColor: COLORS.warning + "20" },
              ]}
            >
              <Award size={20} color={COLORS.warning} strokeWidth={2.5} />
            </View>
            <Text style={styles.sectionTitle}>Valoraciones</Text>
          </View>

          <View style={styles.ratingsCard}>
            <View style={styles.ratingSummary}>
              <View style={styles.ratingMain}>
                <Text style={styles.ratingValue}>
                  {user.averageRating ? user.averageRating.toFixed(1) : "5.0"}
                </Text>
                <View style={styles.ratingStars}>
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
                <Text style={styles.ratingCount}>
                  {user.numOpinions || 0} valoraciones
                </Text>
              </View>
              <View style={styles.ratingAction}>
                <Text style={styles.ratingActionText}>
                  {user.myNumOpinions || 0} opiniones escritas
                </Text>
                <ChevronRight
                  size={18}
                  color={COLORS.gray400}
                  strokeWidth={2}
                />
              </View>
            </View>
            <View style={styles.ratingDivider} />
            <View style={styles.ratingInfo}>
              <TouchableOpacity
                style={styles.ratingInfoRow}
                onPress={() => navigation.navigate("Opiniones")}
              >
                <View style={styles.ratingInfoIcon}>
                  <MessageSquare
                    size={18}
                    color={COLORS.primary}
                    strokeWidth={2}
                  />
                </View>
                <Text style={styles.ratingInfoText}>Ver mis opiniones</Text>
                <ChevronRight
                  size={16}
                  color={COLORS.gray400}
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.ratingInfoRow}>
                <View style={styles.ratingInfoIcon}>
                  <Info size={18} color={COLORS.primary} strokeWidth={2} />
                </View>
                <Text style={styles.ratingInfoText}>Cómo se calcula</Text>
                <ChevronRight
                  size={16}
                  color={COLORS.gray400}
                  strokeWidth={2}
                />
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
            textColor={COLORS.primary}
            accentColor={COLORS.primary}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MiPerfilSection;
