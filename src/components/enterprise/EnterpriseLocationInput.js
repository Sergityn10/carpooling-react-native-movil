import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  MapPin,
  Building2,
  CheckCircle2,
  X,
  Search,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, BRAND } from "../../constants";
import {
  autocompletePlaces,
  getPlaceDetails,
} from "../../services/googlePlaces";

const EnterpriseLocationInput = ({
  value = "",
  onChangeText,
  onSelectPlace,
  selectedCoords = null,
  placeholder = "Buscar sede, recinto o dirección (ej. IFEMA, Gran Vía 28...)",
  components = "country:es",
  types = "geocode|establishment",
  disabled = false,
  label = null,
  containerStyle = null,
}) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorText, setErrorText] = useState("");
  const requestIdRef = useRef(0);
  const inputRef = useRef(null);

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
          language: "es",
          types,
          components,
        });
        if (requestIdRef.current !== requestId) return;
        setPredictions(Array.isArray(items) ? items : []);
      } catch (e) {
        if (requestIdRef.current !== requestId) return;
        setPredictions([]);
        setErrorText(
          e?.message || "No se pudieron cargar sugerencias de Google Maps."
        );
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [trimmed, open, types, components]);

  const handlePick = async (prediction) => {
    try {
      setLoading(true);
      setErrorText("");
      setOpen(false);
      setPredictions([]);

      const details = await getPlaceDetails({
        placeId: prediction.place_id,
        language: "es",
      });

      const placeName = details?.name || prediction.structured_formatting?.main_text || "";
      const placeAddress = details?.address || prediction.description || "";
      const latitude = details?.latitude;
      const longitude = details?.longitude;

      onSelectPlace?.({
        placeId: prediction.place_id,
        name: placeName,
        address: placeAddress,
        latitude,
        longitude,
        addressComponents: details?.addressComponents || [],
      });
    } catch (e) {
      setErrorText(
        e?.message || "No se pudieron obtener los detalles de la ubicación seleccionada."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onChangeText?.("");
    onSelectPlace?.(null);
    setPredictions([]);
    setOpen(false);
    setErrorText("");
  };

  const isVerified = Boolean(
    selectedCoords?.latitude && selectedCoords?.longitude
  );

  return (
    <View
      style={[
        styles.wrapper,
        {
          zIndex: open ? 9999 : 1,
          elevation: Platform.OS === "android" ? (open ? 9999 : 1) : undefined,
        },
        containerStyle,
      ]}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputBox,
          isFocused && styles.inputBoxFocused,
          open && styles.inputBoxOpen,
          disabled && styles.inputBoxDisabled,
        ]}
      >
        <MapPin
          size={16}
          color={isVerified ? "#16A34A" : isFocused ? COLORS.primary : COLORS.gray400}
          strokeWidth={2.2}
        />
        <TextInput
          ref={inputRef}
          style={[styles.textInput, disabled && styles.textInputDisabled]}
          value={value}
          onChangeText={(text) => {
            onChangeText?.(text);
            if (!open) setOpen(true);
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          editable={!disabled}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
        />

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.actionIcon} />
        ) : value ? (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Limpiar ubicación"
          >
            <X size={15} color={COLORS.gray500} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Pill de Coordenadas Verificadas con Google Maps */}
      {isVerified && !open ? (
        <View style={styles.verifiedBadge}>
          <CheckCircle2 size={12} color="#16A34A" strokeWidth={2.5} />
          <Text style={styles.verifiedText}>
            Ubicación verificada ({Number(selectedCoords.latitude).toFixed(4)},{" "}
            {Number(selectedCoords.longitude).toFixed(4)})
          </Text>
        </View>
      ) : null}

      {/* Dropdown de Sugerencias de Google Maps */}
      {open && (
        <View style={styles.dropdownContainer}>
          {predictions.length > 0 ? (
            <ScrollView
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {predictions.map((item) => {
                const isEstablishment =
                  Array.isArray(item.types) &&
                  (item.types.includes("establishment") ||
                    item.types.includes("point_of_interest"));
                const mainText =
                  item.structured_formatting?.main_text || item.description;
                const secondaryText =
                  item.structured_formatting?.secondary_text || "";

                return (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.predictionRow}
                    onPress={() => handlePick(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        isEstablishment && styles.iconCircleEstablishment,
                      ]}
                    >
                      {isEstablishment ? (
                        <Building2 size={14} color={COLORS.primary} strokeWidth={2.2} />
                      ) : (
                        <MapPin size={14} color={COLORS.gray600} strokeWidth={2.2} />
                      )}
                    </View>
                    <View style={styles.predictionContent}>
                      <Text style={styles.mainText} numberOfLines={1}>
                        {mainText}
                      </Text>
                      {secondaryText ? (
                        <Text style={styles.secondaryText} numberOfLines={1}>
                          {secondaryText}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : !loading && trimmed.length >= 2 ? (
            <View style={styles.noResultsBox}>
              <Search size={14} color={COLORS.gray400} />
              <Text style={styles.noResultsText}>
                No se encontraron lugares en Google Maps. Puedes conservar el texto actual.
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {errorText ? (
        <Text style={styles.errorSubtext}>{errorText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 12,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.control,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  inputBoxFocused: {
    borderColor: COLORS.primary,
  },
  inputBoxOpen: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  inputBoxDisabled: {
    backgroundColor: COLORS.gray100,
    opacity: 0.7,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: BRAND.black,
    paddingVertical: 0,
  },
  textInputDisabled: {
    color: COLORS.gray500,
  },
  actionIcon: {
    marginLeft: 4,
  },
  actionBtn: {
    padding: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.gray100,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
    paddingHorizontal: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  dropdownContainer: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.control,
    maxHeight: 220,
    zIndex: 99999,
    elevation: 20,
    ...SHADOWS.card,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleEstablishment: {
    backgroundColor: "#EFF6FF",
  },
  predictionContent: {
    flex: 1,
  },
  mainText: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.black,
  },
  secondaryText: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 1,
  },
  noResultsBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  noResultsText: {
    fontSize: 11.5,
    color: COLORS.gray500,
    flex: 1,
  },
  errorSubtext: {
    fontSize: 11,
    color: "#DC2626",
    marginTop: 4,
    paddingHorizontal: 4,
  },
});

export default EnterpriseLocationInput;
