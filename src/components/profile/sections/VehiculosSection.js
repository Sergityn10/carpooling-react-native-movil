import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Car, Users, Pencil, X, Calendar, Sparkles } from "lucide-react-native";
import { COLORS, SPACING } from "../../../constants";
import {
  POPULAR_CARS,
  FUEL_TYPES,
  CAR_COLORS,
} from "../../../constants/carsData";
import styles from "../profileStyles";
import SubViewHeader from "./SubViewHeader";

const VehiculosSection = ({
  showCocheForm,
  editingCocheId,
  savingCoche,
  cocheFormData,
  showMarcaSuggestions,
  showModeloSuggestions,
  coches,
  loadingCoches,
  errorCoches,
  onCocheInputChange,
  onCreateOrUpdateCoche,
  onResetCocheForm,
  onEditCoche,
  onDeleteCoche,
  onFetchCoches,
  onShowCocheForm,
  onBack,
}) => {
  if (showCocheForm) {
    const marcasSugeridas = Object.keys(POPULAR_CARS).filter((m) =>
      m.toLowerCase().includes((cocheFormData.marca || "").toLowerCase()),
    );

    const modelosDeMarca = POPULAR_CARS[cocheFormData.marca] || [];
    const modelosSugeridos = modelosDeMarca.filter((mod) =>
      mod.toLowerCase().includes((cocheFormData.modelo || "").toLowerCase()),
    );

    return (
      <ScrollView
        style={styles.sectionContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sectionScroll}
        keyboardShouldPersistTaps="handled"
      >
        <SubViewHeader
          title={editingCocheId ? "Editar vehículo" : "Registrar vehículo"}
          onBack={onResetCocheForm}
        />

        <View style={styles.editFormCard}>
          {/* Matrícula */}
          <View style={styles.editField}>
            <Text style={styles.editFieldLabel}>Matrícula</Text>
            <View style={styles.editInputWrapper}>
              <Car size={18} color={COLORS.gray400} strokeWidth={2} />
              <TextInput
                style={[styles.editInput, { textTransform: "uppercase" }]}
                value={cocheFormData.matricula}
                onChangeText={(v) => {
                  let cleaned = v.toUpperCase().replace(/\s+/g, "");
                  if (cleaned.length > 4) {
                    cleaned =
                      cleaned.substring(0, 4) + " " + cleaned.substring(4);
                  }
                  onCocheInputChange("matricula", cleaned);
                }}
                placeholder="Ej: 1234 BCD"
                placeholderTextColor={COLORS.gray400}
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>
          </View>

          {/* Marca (Con Autocompletado) */}
          <View style={styles.editField}>
            <Text style={styles.editFieldLabel}>Marca</Text>
            <View style={styles.editInputWrapper}>
              <Sparkles size={18} color={COLORS.gray400} strokeWidth={2} />
              <TextInput
                style={styles.editInput}
                value={cocheFormData.marca}
                onChangeText={(v) => {
                  onCocheInputChange("marca", v);
                  onCocheInputChange("modelo", "");
                  onCocheInputChange("_showMarcaSuggestions", true);
                }}
                onFocus={() =>
                  onCocheInputChange("_showMarcaSuggestions", true)
                }
                placeholder="Ej: Toyota"
                placeholderTextColor={COLORS.gray400}
              />
            </View>
            {showMarcaSuggestions &&
              cocheFormData.marca.trim().length > 0 &&
              marcasSugeridas.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {marcasSugeridas.slice(0, 5).map((marca) => (
                    <TouchableOpacity
                      key={marca}
                      style={styles.suggestionItem}
                      onPress={() => {
                        onCocheInputChange("marca", marca);
                        onCocheInputChange("_showMarcaSuggestions", false);
                      }}
                    >
                      <Text style={styles.suggestionText}>{marca}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
          </View>

          {/* Modelo (Con Autocompletado) */}
          <View style={styles.editField}>
            <Text style={styles.editFieldLabel}>Modelo</Text>
            <View style={styles.editInputWrapper}>
              <Sparkles size={18} color={COLORS.gray400} strokeWidth={2} />
              <TextInput
                style={styles.editInput}
                value={cocheFormData.modelo}
                onChangeText={(v) => {
                  onCocheInputChange("modelo", v);
                  onCocheInputChange("_showModeloSuggestions", true);
                }}
                onFocus={() =>
                  onCocheInputChange("_showModeloSuggestions", true)
                }
                disabled={!cocheFormData.marca}
                placeholder={
                  cocheFormData.marca
                    ? "Ej: Corolla"
                    : "Primero selecciona una marca"
                }
                placeholderTextColor={COLORS.gray400}
              />
            </View>
            {showModeloSuggestions &&
              cocheFormData.modelo.trim().length > 0 &&
              modelosSugeridos.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {modelosSugeridos.slice(0, 5).map((modelo) => (
                    <TouchableOpacity
                      key={modelo}
                      style={styles.suggestionItem}
                      onPress={() => {
                        onCocheInputChange("modelo", modelo);
                        onCocheInputChange("_showModeloSuggestions", false);
                      }}
                    >
                      <Text style={styles.suggestionText}>{modelo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
          </View>

          {/* Tipo de Combustible (Botones de Chip Modernos) */}
          <View style={styles.editField}>
            <Text style={styles.editFieldLabel}>Tipo de combustible</Text>
            <View style={styles.chipsRow}>
              {FUEL_TYPES.map((fuel) => {
                const seleccionado =
                  cocheFormData.tipo_combustible === fuel.value;
                return (
                  <TouchableOpacity
                    key={fuel.value}
                    style={[
                      styles.chipBtn,
                      seleccionado && styles.chipBtnSelected,
                    ]}
                    onPress={() =>
                      onCocheInputChange("tipo_combustible", fuel.value)
                    }
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        seleccionado && styles.chipBtnTextSelected,
                      ]}
                    >
                      {fuel.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color */}
          <View style={styles.editField}>
            <Text style={styles.editFieldLabel}>Color</Text>
            <View style={styles.chipsRow}>
              {CAR_COLORS.slice(0, 6).map((col) => {
                const seleccionado = cocheFormData.color === col;
                return (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.colorChipBtn,
                      seleccionado && styles.colorChipBtnSelected,
                    ]}
                    onPress={() => onCocheInputChange("color", col)}
                  >
                    <Text
                      style={[
                        styles.colorChipText,
                        seleccionado && styles.colorChipTextSelected,
                      ]}
                    >
                      {col}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: SPACING.md }}>
            {/* Número de Plazas */}
            <View style={[styles.editField, { flex: 1 }]}>
              <Text style={styles.editFieldLabel}>Número de plazas</Text>
              <View style={styles.editInputWrapper}>
                <Users size={18} color={COLORS.gray400} strokeWidth={2} />
                <TextInput
                  style={styles.editInput}
                  value={cocheFormData.num_plazas}
                  onChangeText={(v) => onCocheInputChange("num_plazas", v)}
                  placeholder="Ej: 5"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  maxLength={1}
                />
              </View>
            </View>

            {/* Año de fabricación */}
            <View style={[styles.editField, { flex: 1 }]}>
              <Text style={styles.editFieldLabel}>Año fabricación</Text>
              <View style={styles.editInputWrapper}>
                <Calendar size={18} color={COLORS.gray400} strokeWidth={2} />
                <TextInput
                  style={styles.editInput}
                  value={cocheFormData.year}
                  onChangeText={(v) => onCocheInputChange("year", v)}
                  placeholder="Ej: 2020"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: SPACING.md,
            marginTop: SPACING.md,
          }}
        >
          <TouchableOpacity
            style={[
              styles.saveProfileBtn,
              { flex: 1, backgroundColor: COLORS.gray300 },
            ]}
            onPress={onResetCocheForm}
          >
            <Text
              style={[styles.saveProfileBtnText, { color: COLORS.gray700 }]}
            >
              Cancelar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveProfileBtn, { flex: 2 }]}
            onPress={onCreateOrUpdateCoche}
            disabled={savingCoche}
          >
            {savingCoche ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveProfileBtnText}>
                {editingCocheId ? "Actualizar" : "Registrar"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    );
  }

  // Listado de vehículos registrados
  return (
    <ScrollView
      style={styles.sectionContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.sectionScroll}
    >
      <SubViewHeader title="Mis vehículos" onBack={onBack} />

      {/* Botón para añadir coche */}
      <TouchableOpacity
        style={styles.addCocheMainBtn}
        onPress={onShowCocheForm}
      >
        <Sparkles size={20} color={COLORS.white} strokeWidth={2} />
        <Text style={styles.addCocheMainBtnText}>Registrar nuevo vehículo</Text>
      </TouchableOpacity>

      {loadingCoches ? (
        <View style={[styles.centerContainer, { minHeight: 200 }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tus vehículos...</Text>
        </View>
      ) : errorCoches ? (
        <View style={[styles.centerContainer, { minHeight: 200 }]}>
          <Text style={styles.errorText}>{errorCoches}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onFetchCoches}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : coches.length === 0 ? (
        <View style={[styles.centerContainer, { minHeight: 240 }]}>
          <View style={styles.placeholderIconBg}>
            <Car size={40} color={COLORS.gray300} strokeWidth={1.5} />
          </View>
          <Text style={styles.placeholderTitle}>Sin vehículos registrados</Text>
          <Text style={styles.placeholderSubtitle}>
            Registra tu vehículo para poder publicar trayectos como conductor y
            compartir gastos de viaje.
          </Text>
        </View>
      ) : (
        <View style={styles.cochesListContainer}>
          {coches.map((coche) => {
            const matOriginal = coche.matricula || "";
            const matriculaFormateada =
              matOriginal.length === 7
                ? `${matOriginal.substring(0, 4)} ${matOriginal.substring(4)}`
                : matOriginal;

            return (
              <View
                key={coche.id_coche || coche.matricula}
                style={styles.cocheItemCard}
              >
                {/* Fila superior con marca, modelo y acciones */}
                <View style={styles.cocheCardHeader}>
                  <View style={styles.cocheCardInfoMain}>
                    <View style={styles.cocheCardIconContainer}>
                      <Car size={22} color={COLORS.primary} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={styles.cocheCardBrandModel}>
                        {coche.marca} {coche.modelo}
                      </Text>
                      <Text style={styles.cocheCardColorYear}>
                        {coche.color || "Blanco"} • Año {coche.year || "2020"}
                      </Text>
                    </View>
                  </View>

                  {/* Acciones */}
                  <View style={styles.cocheCardActions}>
                    <TouchableOpacity
                      style={styles.cocheActionBtn}
                      onPress={() => onEditCoche(coche)}
                    >
                      <Pencil
                        size={15}
                        color={COLORS.gray600}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.cocheActionBtn,
                        styles.cocheActionBtnDelete,
                      ]}
                      onPress={() => onDeleteCoche(coche.id_coche)}
                    >
                      <X size={15} color={COLORS.error} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Placa de Matrícula Realista */}
                <View style={styles.matriculaPlacaOuter}>
                  <View style={styles.matriculaPlacaInner}>
                    {/* Banda europea */}
                    <View style={styles.placaBandaUE}>
                      <Text style={styles.placaStars}>★</Text>
                      <Text style={styles.placaPais}>E</Text>
                    </View>
                    {/* Dígitos */}
                    <View style={styles.placaDigitosContainer}>
                      <Text style={styles.placaDigitosText}>
                        {matriculaFormateada}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Características secundarias */}
                <View style={styles.cocheSpecsRow}>
                  <View style={styles.cocheSpecBadge}>
                    <Users size={13} color={COLORS.gray500} strokeWidth={2} />
                    <Text style={styles.cocheSpecText}>
                      {coche.num_plazas || 5} plazas
                    </Text>
                  </View>
                  <View style={styles.cocheSpecBadge}>
                    <View
                      style={[
                        styles.combustibleIndicatorDot,
                        {
                          backgroundColor:
                            coche.tipo_combustible?.toLowerCase() ===
                            "electrico"
                              ? "#10B981"
                              : coche.tipo_combustible?.toLowerCase() ===
                                  "hibrido"
                                ? "#3B82F6"
                                : "#F59E0B",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.cocheSpecText,
                        { textTransform: "capitalize" },
                      ]}
                    >
                      {coche.tipo_combustible || "Gasolina"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
};

export default VehiculosSection;
