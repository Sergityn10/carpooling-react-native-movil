// YouConnext - Input Component (Guía de Estilo v2)
// Radio 12, borde fino #7A8884, foco verde interactivo, error constructivo
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { AlertCircle, Eye, EyeOff } from "lucide-react-native";
import { COLORS, RADIUS, FONTS, BRAND } from "../../constants";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  icon: Icon,
  rightComponent,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  returnKeyType = "next",
  onSubmitEditing,
  inputRef,
  onFocus,
  onBlur,
  editable = true,
  style,
  inputStyle,
  containerStyle,
  helperText,
  multiline = false,
  numberOfLines,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = Boolean(secureTextEntry);
  const isMultiline = Boolean(multiline);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const getBorderColor = () => {
    if (error) return COLORS.error;
    if (isFocused) return COLORS.primary;
    return COLORS.borderField; // #7A8884
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          isMultiline && styles.inputWrapperMultiline,
          { borderColor: getBorderColor() },
          isFocused && styles.inputWrapperFocused,
          Boolean(error) && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
          style,
        ]}
      >
        {Icon && (
          <View
            style={[
              styles.iconContainer,
              isMultiline && styles.iconContainerMultiline,
            ]}
          >
            <Icon
              size={19}
              color={
                error
                  ? COLORS.error
                  : isFocused
                  ? COLORS.primary
                  : COLORS.gray400
              }
              strokeWidth={2}
            />
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isMultiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          selectionColor={COLORS.primary}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={isMultiline ? "top" : "center"}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={19} color={COLORS.gray400} strokeWidth={2} />
            ) : (
              <Eye size={19} color={COLORS.gray400} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}

        {rightComponent}
      </View>

      {/* Error constructivo con icono (pág. 4 y 9: explica el porqué y cómo arreglarlo) */}
      {Boolean(error) ? (
        <View style={styles.errorRow}>
          <AlertCircle size={13} color={COLORS.error} strokeWidth={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.black,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderRadius: RADIUS.control, // 12px
    height: 48,
    paddingHorizontal: 14,
    shadowColor: BRAND.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapperError: {
    borderWidth: 1.5,
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  inputWrapperDisabled: {
    backgroundColor: "#F4F7F5",
    borderColor: COLORS.gray200,
  },
  inputWrapperMultiline: {
    height: undefined,
    minHeight: 88,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerMultiline: {
    paddingTop: 3,
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 15,
    color: BRAND.black,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 68,
    textAlignVertical: "top",
    paddingTop: 0,
    paddingBottom: 0,
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },
  errorText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "500",
    flex: 1,
  },
  helperText: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 4,
  },
});

export default Input;
