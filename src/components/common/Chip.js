// YouConnext - Chip & Badge Component (Guía de Estilo v2)
// Radio 9999, activo en negro #0B0F0E, inactivo en niebla suave
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, FONTS, BRAND } from "../../constants";
import PressableScale from "./PressableScale";

const Chip = ({
  label,
  active = false,
  onPress,
  variant = "filter", // 'filter', 'amber' (avisos), 'green' (éxito/verificado), 'neutral'
  icon = null,
  style,
  textStyle,
  size = "medium", // 'small', 'medium'
}) => {
  const isButton = Boolean(onPress);

  const getContainerStyle = () => {
    const list = [styles.base, styles[`size_${size}`]];

    if (variant === "amber") {
      list.push(styles.variantAmber);
    } else if (variant === "green") {
      list.push(styles.variantGreen);
    } else if (variant === "neutral") {
      list.push(styles.variantNeutral);
    } else {
      // Filter chip
      if (active) {
        list.push(styles.filterActive);
      } else {
        list.push(styles.filterInactive);
      }
    }

    return list;
  };

  const getTextStyle = () => {
    const list = [styles.text, styles[`textSize_${size}`]];

    if (variant === "amber") {
      list.push(styles.textAmber);
    } else if (variant === "green") {
      list.push(styles.textGreen);
    } else if (variant === "neutral") {
      list.push(styles.textNeutral);
    } else {
      if (active) {
        list.push(styles.textFilterActive);
      } else {
        list.push(styles.textFilterInactive);
      }
    }

    return list;
  };

  const content = (
    <View style={styles.contentRow}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[...getTextStyle(), textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (isButton) {
    return (
      <PressableScale
        style={[...getContainerStyle(), style]}
        onPress={onPress}
        scaleTo={0.95}
      >
        {content}
      </PressableScale>
    );
  }

  return <View style={[...getContainerStyle(), style]}>{content}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.round, // 9999px
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  size_small: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  size_medium: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  // Filtros activos en negro estructurado (Pág. 4)
  filterActive: {
    backgroundColor: BRAND.black,
  },
  filterInactive: {
    backgroundColor: "#E4ECE7",
    borderWidth: 1,
    borderColor: "#D6E2DB",
  },
  // Estado ámbar suave para avisos ("quedan pocas", categoría)
  variantAmber: {
    backgroundColor: "#FBF0DE",
    borderWidth: 1,
    borderColor: "#F7DDB2",
  },
  // Estado verde suave para bien ("nuevo", "conductor verificado")
  variantGreen: {
    backgroundColor: "#E3F4EA",
    borderWidth: 1,
    borderColor: "#BDEBCF",
  },
  variantNeutral: {
    backgroundColor: "#EDF2EE",
    borderWidth: 1,
    borderColor: "#D6E2DB",
  },
  text: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontWeight: "600",
  },
  textSize_small: {
    fontSize: 11,
    lineHeight: 14,
  },
  textSize_medium: {
    fontSize: 13,
    lineHeight: 18,
  },
  textFilterActive: {
    color: COLORS.white,
  },
  textFilterInactive: {
    color: COLORS.gray600,
  },
  textAmber: {
    color: "#8A5200", // Pág. 2: texto ámbar sobre claro
    fontWeight: "700",
  },
  textGreen: {
    color: BRAND.greenOnLight,
    fontWeight: "700",
  },
  textNeutral: {
    color: COLORS.gray600,
  },
  iconContainer: {
    marginRight: 5,
  },
});

export default Chip;
