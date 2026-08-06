import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  ScrollView,
} from "react-native";
import {
  MapPin,
  Home,
  Briefcase,
  BookOpen,
  Dumbbell,
  X,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../../constants";
import {
  autocompletePlaces,
  getPlaceDetails,
} from "../../services/googlePlaces";

const SAVED_LOCATION_ICONS = {
  home: Home,
  work: Briefcase,
  university: BookOpen,
  gym: Dumbbell,
  other: MapPin,
};

const PlaceAutocompleteInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  onSelectPlace,
  biasLocation,
  radius = 50000,
  components,
  disabled = false,
  savedLocations = [],
  showCurrentLocation = false,
  onUseCurrentLocation = null,
  onFocus = null,
}) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const requestIdRef = useRef(0);
  const inputRef = useRef(null);

  const SCREEN_HEIGHT = Dimensions.get("window").height;

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const trimmed = useMemo(() => (value || "").trim(), [value]);

  useEffect(() => {
    if (!open) return;

    if (!trimmed || trimmed.length < 2) {
      setPredictions([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorText("");
        const items = await autocompletePlaces({
          input: trimmed,
          location: biasLocation,
          radius,
          components,
        });
        if (requestIdRef.current !== requestId) return;
        setPredictions(items);
      } catch (e) {
        if (requestIdRef.current !== requestId) return;
        setPredictions([]);
        setErrorText(
          e?.message || "No se pudo obtener sugerencias. Revisa tu API key.",
        );
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [trimmed, open, biasLocation, radius, components]);

  const measureAndOpen = () => {
    setOpen(true);
  };

  const handlePick = async (prediction) => {
    try {
      setLoading(true);
      setErrorText("");
      setOpen(false);
      const details = await getPlaceDetails({ placeId: prediction.place_id });
      onSelectPlace?.({
        placeId: prediction.place_id,
        name: details.name || prediction.structured_formatting?.main_text,
        address: details.address || prediction.description,
        latitude: details.latitude,
        longitude: details.longitude,
        addressComponents: details.addressComponents || [],
      });
      setPredictions([]);
    } catch (e) {
      setErrorText(
        e?.message || "No se pudo cargar la dirección seleccionada.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputRow}>
        <View style={styles.inputIconWrapper}>
          <MapPin size={18} color={COLORS.gray400} strokeWidth={2.5} />
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(t) => {
            onChangeText?.(t);
            if (!open) setOpen(true);
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          style={[styles.input, disabled && styles.inputDisabled]}
          editable={!disabled}
          onFocus={() => {
            setOpen(true);
            onFocus?.();
          }}
        />
        {loading && (
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
        {!loading && value && value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onChangeText?.("");
              onSelectPlace?.(null);
              setPredictions([]);
            }}
            activeOpacity={0.7}
          >
            <X size={16} color={COLORS.gray400} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {open && (
        <View
          style={[
            styles.dropdown,
            dropUp ? styles.dropdownUp : styles.dropdownDown,
          ]}
          pointerEvents="box-none"
        >
          {/* Saved locations + current location section */}
          {(savedLocations.length > 0 || showCurrentLocation) && (
            <View style={styles.savedSection}>
              {showCurrentLocation && onUseCurrentLocation && (
                <TouchableOpacity
                  style={styles.savedItem}
                  onPress={() => {
                    onUseCurrentLocation();
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.savedIcon,
                      { backgroundColor: COLORS.primarySoft },
                    ]}
                  >
                    <MapPin
                      size={16}
                      color={COLORS.primary}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View style={styles.savedContent}>
                    <Text style={styles.savedLabel}>Mi ubicacion actual</Text>
                    <Text style={styles.savedAddress} numberOfLines={1}>
                      Usar GPS
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {savedLocations.map((loc) => {
                const IconComp =
                  SAVED_LOCATION_ICONS[loc.tipo] || SAVED_LOCATION_ICONS.other;
                return (
                  <TouchableOpacity
                    key={loc.id || loc.name}
                    style={styles.savedItem}
                    onPress={() => {
                      onSelectPlace?.({
                        name: loc.nombre || loc.name,
                        address: loc.direccion || loc.address,
                        latitude: Number(loc.latitud || loc.latitude),
                        longitude: Number(loc.longitud || loc.longitude),
                      });
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.savedIcon,
                        { backgroundColor: loc.bg || COLORS.gray100 },
                      ]}
                    >
                      <IconComp
                        size={16}
                        color={loc.color || COLORS.gray600}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View style={styles.savedContent}>
                      <Text style={styles.savedLabel}>
                        {loc.nombre || loc.name}
                      </Text>
                      <Text style={styles.savedAddress} numberOfLines={1}>
                        {loc.direccion || loc.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Autocomplete predictions */}
          {predictions.length > 0 && (
            <>
              {(savedLocations.length > 0 || showCurrentLocation) && (
                <View style={styles.dropdownDivider} />
              )}
              <FlatList
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => handlePick(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemIcon}>
                      <MapPin
                        size={14}
                        color={COLORS.gray400}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemMain}>
                        {item.structured_formatting?.main_text ||
                          item.description}
                      </Text>
                      {!!item.structured_formatting?.secondary_text && (
                        <Text style={styles.itemSecondary}>
                          {item.structured_formatting.secondary_text}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {predictions.length === 0 &&
            !loading &&
            trimmed.length >= 2 &&
            savedLocations.length === 0 &&
            !showCurrentLocation && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  No se encontraron resultados
                </Text>
              </View>
            )}
        </View>
      )}

      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    zIndex: 9999,
    elevation: 9999,
  },
  label: {
    fontSize: FONTS.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  inputRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.small,
    shadowOpacity: 0,
    elevation: 0,
  },
  inputIconWrapper: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.md,
    color: COLORS.gray700,
  },
  inputDisabled: {
    backgroundColor: COLORS.gray100,
    color: COLORS.gray500,
  },
  loadingIcon: {
    justifyContent: "center",
    paddingHorizontal: SPACING.xs,
  },
  clearButton: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    maxHeight: 320,
    overflow: "hidden",
    zIndex: 10000,
    elevation: 10000,
    ...SHADOWS.medium,
  },
  dropdownDown: {
    top: "100%",
    marginTop: SPACING.xs,
  },
  dropdownUp: {
    bottom: "100%",
    marginBottom: SPACING.xs,
  },
  savedSection: {
    paddingVertical: SPACING.xs,
  },
  savedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  savedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  savedContent: {
    flex: 1,
  },
  savedLabel: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  savedAddress: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginHorizontal: SPACING.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemMain: {
    fontSize: FONTS.sm,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  itemSecondary: {
    fontSize: FONTS.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  noResults: {
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: FONTS.sm,
    color: COLORS.gray400,
  },
  errorText: {
    marginTop: SPACING.xs,
    color: COLORS.danger,
    fontSize: FONTS.xs,
  },
});

export default PlaceAutocompleteInput;
