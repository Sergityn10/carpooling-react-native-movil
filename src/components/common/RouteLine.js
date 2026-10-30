// YouConnext - RouteLine Component (Guía de Estilo v2, Pág. 5)
// Línea de ruta con punto verde (origen), conector vertical y punto ámbar (destino)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BRAND, COLORS, FONTS } from "../../constants";

const RouteLine = ({
  origen,
  destino,
  horaSalida,
  horaVuelta,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Columna gráfica de puntos y línea */}
      <View style={styles.lineContainer}>
        <View style={styles.greenDot} />
        <View style={styles.verticalLine} />
        <View style={styles.amberDot} />
      </View>

      {/* Columna de textos */}
      <View style={styles.textContainer}>
        {/* Parada de Origen */}
        <View style={styles.stopBlock}>
          <Text style={styles.stopName} numberOfLines={1}>
            {origen || "Origen"}
          </Text>
          {horaSalida ? (
            <Text style={styles.stopMeta}>
              {horaSalida.startsWith("Sale") ? horaSalida : `Sale ${horaSalida}`}
            </Text>
          ) : null}
        </View>

        {/* Parada de Destino */}
        <View style={styles.stopBlockDestination}>
          <Text style={styles.stopName} numberOfLines={1}>
            {destino || "Destino"}
          </Text>
          {horaVuelta ? (
            <Text style={styles.stopMeta}>{horaVuelta}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 4,
  },
  lineContainer: {
    width: 16,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
    marginRight: 10,
  },
  greenDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: BRAND.green,
    shadowColor: BRAND.green,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 2,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#C6D6CE",
    marginVertical: 3,
    borderRadius: 1,
  },
  amberDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: BRAND.accent,
    shadowColor: BRAND.accent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  stopBlock: {
    marginBottom: 10,
  },
  stopBlockDestination: {},
  stopName: {
    fontFamily: FONTS.typography?.fonts?.display || "Sora",
    fontSize: 14,
    fontWeight: "600",
    color: BRAND.black,
  },
  stopMeta: {
    fontFamily: FONTS.typography?.fonts?.body || "Inter",
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
});

export default RouteLine;
