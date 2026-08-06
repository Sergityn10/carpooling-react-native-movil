// YouConnext - SearchBottomSheet Component
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  X,
  Search,
  MapPin,
  Calendar,
  Navigation,
  ChevronRight,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import LocationSelectSheet from "./LocationSelectSheet";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

const SearchBottomSheet = ({ visible, onClose, onSearch, initialParams }) => {
  const [slideAnim] = useState(new Animated.Value(SHEET_HEIGHT));
  const [originText, setOriginText] = useState("");
  const [originPlace, setOriginPlace] = useState(null);
  const [destText, setDestText] = useState("");
  const [destPlace, setDestPlace] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [activeSelectType, setActiveSelectType] = useState(null);
  const scrollViewRef = useRef(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const datePresets = [
    {
      label: "Hoy",
      value: todayStr,
      sublabel: today.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
    },
    {
      label: "Mañana",
      value: tomorrowStr,
      sublabel: tomorrow.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
    },
    {
      label: dayAfter.toLocaleDateString("es-ES", { weekday: "short" }),
      value: dayAfterStr,
      sublabel: dayAfter.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
    },
  ];

  useEffect(() => {
    if (visible) {
      if (initialParams) {
        setOriginText(initialParams.origin || "");
        setOriginPlace(initialParams.originPlace || null);
        setDestText(initialParams.destination || "");
        setDestPlace(initialParams.destPlace || null);
        setSelectedDate(initialParams.date || "");
      }
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialParams]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSearch = () => {
    const params = {
      origin: originPlace?.address || originText,
      destination: destPlace?.address || destText,
      date: selectedDate || new Date().toISOString().split("T")[0],
      passengers: 1,
    };
    onSearch(params);
    handleClose();
  };

  const handleNativeDateChange = (event, date) => {
    setShowNativeDatePicker(false);
    if (event.type === "set" && date) {
      setSelectedDate(date.toISOString().split("T")[0]);
    }
  };

  const dateLabel = () => {
    if (!selectedDate) return "Hoy";
    if (selectedDate === todayStr) return "Hoy";
    if (selectedDate === tomorrowStr) return "Mañana";
    const d = new Date(selectedDate);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  const canSearch = (originPlace || originText) && (destPlace || destText);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Buscar trayecto</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color={COLORS.gray600} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.formContainer}
          >
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Origen */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Navigation
                    size={18}
                    color={COLORS.success}
                    strokeWidth={2.5}
                  />
                </View>
                <TouchableOpacity
                  style={styles.fakeInput}
                  onPress={() => setActiveSelectType("origin")}
                >
                  <Text
                    style={[
                      styles.fakeInputText,
                      originText && styles.fakeInputTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {originText || "Selecciona tu origen"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Destino */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MapPin size={18} color={COLORS.error} strokeWidth={2.5} />
                </View>
                <TouchableOpacity
                  style={styles.fakeInput}
                  onPress={() => setActiveSelectType("destination")}
                >
                  <Text
                    style={[
                      styles.fakeInputText,
                      destText && styles.fakeInputTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {destText || "Selecciona tu destino"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Fecha — chips horizontales */}
              <Text style={styles.sectionLabel}>Fecha</Text>
              <View style={styles.dateChipsRow}>
                {datePresets.map((preset) => {
                  const isActive = (selectedDate || todayStr) === preset.value;
                  return (
                    <TouchableOpacity
                      key={preset.value}
                      style={[
                        styles.dateChip,
                        isActive && styles.dateChipActive,
                      ]}
                      onPress={() => setSelectedDate(preset.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateChipLabel,
                          isActive && styles.dateChipLabelActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                      <Text
                        style={[
                          styles.dateChipSub,
                          isActive && styles.dateChipSubActive,
                        ]}
                      >
                        {preset.sublabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.dateChipMore}
                  onPress={() => setShowNativeDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Calendar
                    size={18}
                    color={COLORS.gray600}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.dateChipMoreText}>Más</Text>
                </TouchableOpacity>
              </View>

              {selectedDate &&
                !datePresets.some((p) => p.value === selectedDate) && (
                  <View style={styles.customDateRow}>
                    <Calendar
                      size={14}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.customDateText}>{dateLabel()}</Text>
                    <TouchableOpacity onPress={() => setSelectedDate("")}>
                      <X size={14} color={COLORS.gray400} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
            </ScrollView>

            {/* Botón buscar */}
            <TouchableOpacity
              style={[
                styles.searchButton,
                !canSearch && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={!canSearch}
            >
              <Search size={20} color={COLORS.white} strokeWidth={2.5} />
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* Selector de ubicación (slide secundario) */}
      <LocationSelectSheet
        visible={activeSelectType !== null}
        onClose={() => setActiveSelectType(null)}
        title={
          activeSelectType === "origin"
            ? "Selecciona tu origen"
            : "Selecciona tu destino"
        }
        onSelect={(location) => {
          if (activeSelectType === "origin") {
            setOriginPlace(location);
            setOriginText(location.address);
          } else {
            setDestPlace(location);
            setDestText(location.address);
          }
        }}
      />

      {/* Native date picker */}
      {showNativeDatePicker && (
        <DateTimePicker
          value={
            selectedDate ? new Date(selectedDate + "T00:00:00") : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={new Date()}
          onChange={handleNativeDateChange}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    ...SHADOWS.large,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    alignSelf: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  fakeInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
  },
  fakeInputText: {
    fontSize: FONTS.md,
    color: COLORS.gray400,
  },
  fakeInputTextActive: {
    color: COLORS.gray800,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  dateChipsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dateChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  dateChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  dateChipLabel: {
    fontSize: FONTS.sm,
    fontWeight: "bold",
    color: COLORS.gray600,
  },
  dateChipLabelActive: {
    color: COLORS.primary,
  },
  dateChipSub: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },
  dateChipSubActive: {
    color: COLORS.primaryDark,
  },
  dateChipMore: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    gap: 2,
  },
  dateChipMoreText: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  customDateText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.primaryDark,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: FONTS.md,
  },
});

export default SearchBottomSheet;
