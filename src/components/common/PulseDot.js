// YouConnext - PulseDot (Insignia pulsante para estado 'En curso' / En vivo)
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../constants";

const PulseDot = ({
  color = COLORS.success,
  size = 8,
  pulseScale = 2.4,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, pulseScale],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.75, 0.3, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            backgroundColor: color,
            borderRadius: size,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <View
        style={[
          styles.centerDot,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ring: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  centerDot: {
    zIndex: 2,
  },
});

export default PulseDot;
