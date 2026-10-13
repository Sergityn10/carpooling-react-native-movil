// YouConnext - Marcador de Clúster Animado para Mapa
// Agrupación visual con halo pulsante y conteo dinámico

import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Marker } from "react-native-maps";
import { Car } from "lucide-react-native";
import { COLORS, FONTS, SHADOWS, RADIUS } from "../../constants";

const ClusterMarker = React.memo(({ count, coordinate, onPress, trips }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const size = count < 6 ? 42 : count < 20 ? 48 : 56;
  const isLarge = count >= 20;

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={50}
    >
      <View style={[styles.wrapper, { width: size + 20, height: size + 20 }]}>
        {/* Onda Radar Pulsante */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.35],
                  }),
                },
              ],
              opacity: pulseAnim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0.6, 0.2, 0],
              }),
            },
          ]}
        />

        {/* Burbuja Principal */}
        <View
          style={[
            styles.bubble,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isLarge ? COLORS.secondary : COLORS.primary,
            },
          ]}
        >
          <Car size={size > 46 ? 16 : 13} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.countText}>
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      </View>
    </Marker>
  );
});

ClusterMarker.displayName = "ClusterMarker";

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: COLORS.white,
    ...SHADOWS.lg,
  },
  countText: {
    color: COLORS.white,
    fontWeight: FONTS.bold,
    fontSize: 11,
    marginTop: -1,
  },
});

export default ClusterMarker;