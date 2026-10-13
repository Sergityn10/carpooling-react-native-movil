// YouConnext - Barra de Filtros Flotante en Mapa con Selector de Días
// Chips interactivos con selector de fecha, feedback táctil y contador en vivo

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Calendar, Users, Tag, Ticket, RotateCcw, ChevronDown } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";

const STATIC_FILTERS = [
  { id: "seats", label: "+1 Plaza", icon: Users, filter: { minSeats: 2 } },
  { id: "price", label: "< 15€", icon: Tag, filter: { maxPrice: 15 } },
  { id: "events", label: "Eventos", icon: Ticket, filter: { hasEvent: true } },
];

const MapFilterBar = ({
  activeFilters = {},
  selectedDate = null,
  onFilterChange,
  onOpenDatePicker,
  onClearAll,
  theme = "light",
  tripCount = 0,
  topOffset = 0,
}) => {
  const isDark = theme === "dark";
  const hasActiveFilters = Object.values(activeFilters).some(Boolean) || selectedDate !== null;

  // Formato de texto para el chip de fecha
  const dateLabel = useMemo(() => {
    if (!selectedDate) return "Día: Todos";
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    if (selectedDate === todayStr) return "Hoy";
    if (selectedDate === tomorrowStr) return "Mañana";

    const d = new Date(selectedDate + "T00:00:00"); // Parse as local date
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }, [selectedDate]);

  return (
    <View style={[styles.floatingContainer, { top: topOffset > 0 ? topOffset : 72 }]}>
      {/* Contador en vivo */}
      <View style={[styles.badgePill, isDark && styles.badgePillDark]}>
        <View style={styles.liveDot} />
        <Text style={[styles.badgeText, isDark && styles.textWhite]}>
          {tripCount} {tripCount === 1 ? "viaje" : "viajes"}
        </Text>
      </View>

      {/* Chips horizontales */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Chip Principal: Selector de Día / Fecha */}
        <PressableScale
          style={[
            styles.chip,
            styles.dateChip,
            isDark && styles.chipDark,
            selectedDate !== null && styles.chipActive,
          ]}
          onPress={onOpenDatePicker}
          scaleTo={0.96}
          accessibilityLabel="Abrir selector de fechas"
          hitSlop={6}
        >
          <Calendar
            size={13}
            color={selectedDate !== null ? COLORS.white : isDark ? COLORS.white : COLORS.primary}
            strokeWidth={2.4}
          />
          <Text
            style={[
              styles.chipText,
              styles.dateChipText,
              isDark && styles.textWhite,
              selectedDate !== null && styles.chipTextActive,
            ]}
          >
            {dateLabel}
          </Text>
          <ChevronDown
            size={12}
            color={selectedDate !== null ? COLORS.white : isDark ? COLORS.white : COLORS.gray500}
            strokeWidth={2.4}
          />
        </PressableScale>

        {/* Chips de Atributos */}
        {STATIC_FILTERS.map((item) => {
          const isActive = !!activeFilters[item.id];
          const Icon = item.icon;
          return (
            <PressableScale
              key={item.id}
              style={[
                styles.chip,
                isDark && styles.chipDark,
                isActive && styles.chipActive,
              ]}
              onPress={() => onFilterChange(item.id, !isActive, item.filter)}
              scaleTo={0.96}
              accessibilityLabel={`Filtro ${item.label}`}
              hitSlop={6}
            >
              <Icon
                size={13}
                color={isActive ? COLORS.white : isDark ? COLORS.white : COLORS.gray600}
                strokeWidth={2.4}
              />
              <Text
                style={[
                  styles.chipText,
                  isDark && styles.textWhite,
                  isActive && styles.chipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </PressableScale>
          );
        })}

        {/* Botón limpiar todos los filtros */}
        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.resetChip, isDark && styles.resetChipDark]}
            onPress={onClearAll}
            hitSlop={6}
            accessibilityLabel="Limpiar todos los filtros"
          >
            <RotateCcw size={12} color={COLORS.error} strokeWidth={2.4} />
            <Text style={styles.resetText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 95,
    gap: SPACING.xs,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 6,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgePillDark: {
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    borderColor: "#334155",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
    color: COLORS.gray800,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: SPACING.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 5,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateChip: {
    borderColor: COLORS.primaryLight,
  },
  dateChipText: {
    fontWeight: FONTS.bold,
  },
  chipDark: {
    backgroundColor: "rgba(30, 41, 59, 0.92)",
    borderColor: "#334155",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  chipText: {
    fontSize: 11,
    fontWeight: FONTS.semibold,
    color: COLORS.gray700,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  resetChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.errorSoft,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  resetChipDark: {
    backgroundColor: "#7F1D1D",
    borderColor: "#991B1B",
  },
  resetText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
    color: COLORS.error,
  },
  textWhite: {
    color: COLORS.white,
  },
});

export default MapFilterBar;