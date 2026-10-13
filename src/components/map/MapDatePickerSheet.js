// YouConnext - Selector de Días y Fechas para Mapa de Exploración
// Permite filtrar viajes por días específicos (Hoy, Mañana, Fin de semana, Próximos 14 días o Fecha personalizada)

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Calendar,
  CalendarDays,
  Sparkles,
  Sun,
  Sunrise,
  Check,
  X,
  ChevronRight,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import PressableScale from "../common/PressableScale";

const MapDatePickerSheet = ({
  visible = false,
  selectedDate = null, // formato 'YYYY-MM-DD' o null
  onSelectDate,
  onClose,
  theme = "light",
}) => {
  const isDark = theme === "dark";
  const [showNativePicker, setShowNativePicker] = useState(false);

  // Helper para obtener fecha local en formato YYYY-MM-DD (evita problemas de zona horaria con toISOString)
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Generar los próximos 14 días con nombres de día
  const daysList = useMemo(() => {
    const list = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const iso = getLocalDateString(d);
      const dayNumber = d.getDate();
      const dayName =
        i === 0
          ? "Hoy"
          : i === 1
          ? "Mañana"
          : d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().replace(".", "");
      const monthName = d.toLocaleDateString("es-ES", { month: "short" });

      list.push({
        iso,
        dayNumber,
        dayName,
        monthName,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return list;
  }, []);

  const handleQuickSelect = (dateStr) => {
    onSelectDate(dateStr);
    onClose?.();
  };

  const handleNativeDateChange = (event, date) => {
    setShowNativePicker(Platform.OS === "ios");
    if (date) {
      const iso = getLocalDateString(date);
      onSelectDate(iso);
      onClose?.();
    }
  };

  // Calcular próximo fin de semana (Sábado)
  const weekendIso = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
    const nextSat = new Date(today);
    nextSat.setDate(today.getDate() + diff);
    return getLocalDateString(nextSat);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sheetContainer, isDark && styles.sheetContainerDark]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera del modal */}
          <View style={styles.headerRow}>
            <View style={styles.titleCol}>
              <View style={styles.titleIconRow}>
                <CalendarDays size={20} color={COLORS.primary} strokeWidth={2.4} />
                <Text style={[styles.title, isDark && styles.textWhite]}>
                  Filtrar viajes por día
                </Text>
              </View>
              <Text style={styles.subtitle}>
                Explora los trayectos disponibles según tu fecha
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, isDark && styles.closeBtnDark]}
              onPress={onClose}
              hitSlop={8}
            >
              <X size={18} color={isDark ? COLORS.white : COLORS.gray600} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Opciones Rápidas */}
          <View style={styles.quickGrid}>
            {/* Opción 1: Todos los días */}
            <PressableScale
              style={[
                styles.quickCard,
                isDark && styles.quickCardDark,
                selectedDate === null && styles.quickCardSelected,
              ]}
              onPress={() => handleQuickSelect(null)}
              scaleTo={0.97}
            >
              <Sparkles
                size={18}
                color={selectedDate === null ? COLORS.white : COLORS.primary}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.quickText,
                  isDark && styles.textWhite,
                  selectedDate === null && styles.quickTextSelected,
                ]}
              >
                Cualquier día
              </Text>
            </PressableScale>

            {/* Opción 2: Hoy */}
            <PressableScale
              style={[
                styles.quickCard,
                isDark && styles.quickCardDark,
                selectedDate === daysList[0]?.iso && styles.quickCardSelected,
              ]}
              onPress={() => handleQuickSelect(daysList[0]?.iso)}
              scaleTo={0.97}
            >
              <Sun
                size={18}
                color={selectedDate === daysList[0]?.iso ? COLORS.white : COLORS.accent}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.quickText,
                  isDark && styles.textWhite,
                  selectedDate === daysList[0]?.iso && styles.quickTextSelected,
                ]}
              >
                Hoy ({daysList[0]?.dayNumber} {daysList[0]?.monthName})
              </Text>
            </PressableScale>

            {/* Opción 3: Mañana */}
            <PressableScale
              style={[
                styles.quickCard,
                isDark && styles.quickCardDark,
                selectedDate === daysList[1]?.iso && styles.quickCardSelected,
              ]}
              onPress={() => handleQuickSelect(daysList[1]?.iso)}
              scaleTo={0.97}
            >
              <Sunrise
                size={18}
                color={selectedDate === daysList[1]?.iso ? COLORS.white : COLORS.secondary}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.quickText,
                  isDark && styles.textWhite,
                  selectedDate === daysList[1]?.iso && styles.quickTextSelected,
                ]}
              >
                Mañana ({daysList[1]?.dayNumber} {daysList[1]?.monthName})
              </Text>
            </PressableScale>

            {/* Opción 4: Fin de semana */}
            <PressableScale
              style={[
                styles.quickCard,
                isDark && styles.quickCardDark,
                selectedDate === weekendIso && styles.quickCardSelected,
              ]}
              onPress={() => handleQuickSelect(weekendIso)}
              scaleTo={0.97}
            >
              <Calendar
                size={18}
                color={selectedDate === weekendIso ? COLORS.white : COLORS.gray700}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.quickText,
                  isDark && styles.textWhite,
                  selectedDate === weekendIso && styles.quickTextSelected,
                ]}
              >
                Fin de semana
              </Text>
            </PressableScale>
          </View>

          {/* Carrusel de los próximos 14 días */}
          <Text style={[styles.sectionLabel, isDark && styles.textWhite]}>
            Próximos días
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {daysList.map((item) => {
              const isSelected = selectedDate === item.iso;
              return (
                <PressableScale
                  key={item.iso}
                  style={[
                    styles.dayPill,
                    isDark && styles.dayPillDark,
                    isSelected && styles.dayPillSelected,
                  ]}
                  onPress={() => handleQuickSelect(item.iso)}
                  scaleTo={0.95}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isSelected ? styles.dayNameSelected : isDark ? styles.textWhite : styles.dayNameInactive,
                    ]}
                  >
                    {item.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected ? styles.dayNumberSelected : isDark && styles.textWhite,
                    ]}
                  >
                    {item.dayNumber}
                  </Text>
                  <Text
                    style={[
                      styles.monthLabel,
                      isSelected ? styles.monthLabelSelected : styles.monthLabelInactive,
                    ]}
                  >
                    {item.monthName}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          {/* Selector de Fecha Personalizada en Calendario */}
          <PressableScale
            style={[styles.customDateBtn, isDark && styles.customDateBtnDark]}
            onPress={() => setShowNativePicker(true)}
            scaleTo={0.98}
          >
            <View style={styles.customDateLeft}>
              <Calendar size={18} color={COLORS.primary} strokeWidth={2.2} />
              <Text style={[styles.customDateText, isDark && styles.textWhite]}>
                Elegir otra fecha en el calendario
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.gray400} strokeWidth={2.2} />
          </PressableScale>

          {/* Picker nativo */}
          {showNativePicker && (
            <DateTimePicker
              value={selectedDate ? new Date(selectedDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={handleNativeDateChange}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 1.5,
    ...SHADOWS.xl,
  },
  sheetContainerDark: {
    backgroundColor: "#1E293B",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  titleCol: {
    flex: 1,
  },
  titleIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.gray900,
  },
  subtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnDark: {
    backgroundColor: "#334155",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickCard: {
    flex: 1,
    minWidth: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 2,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  quickCardDark: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
  },
  quickCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  quickText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: COLORS.gray800,
  },
  quickTextSelected: {
    color: COLORS.white,
  },
  sectionLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.gray800,
    marginBottom: SPACING.sm,
  },
  daysScroll: {
    flexDirection: "row",
    gap: SPACING.xs + 2,
    paddingBottom: SPACING.md,
  },
  dayPill: {
    width: 62,
    height: 74,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray50,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 2,
  },
  dayPillDark: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
  },
  dayPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  dayName: {
    fontSize: 10,
    fontWeight: FONTS.bold,
  },
  dayNameInactive: {
    color: COLORS.gray500,
  },
  dayNameSelected: {
    color: COLORS.white,
  },
  dayNumber: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.extrabold,
    color: COLORS.gray900,
  },
  dayNumberSelected: {
    color: COLORS.white,
  },
  monthLabel: {
    fontSize: 9,
    fontWeight: FONTS.medium,
  },
  monthLabelInactive: {
    color: COLORS.gray400,
  },
  monthLabelSelected: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  customDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    marginTop: SPACING.xs,
  },
  customDateBtnDark: {
    backgroundColor: "#064E3B",
    borderColor: COLORS.primary,
  },
  customDateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  customDateText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: COLORS.primaryDark,
  },
  textWhite: {
    color: COLORS.white,
  },
});

export default MapDatePickerSheet;