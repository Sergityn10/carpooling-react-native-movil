// YouConnext - AnimatedCardEntrance (Entrada suave con retardo escalonado)
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

const AnimatedCardEntrance = ({
  children,
  index = 0,
  delayStep = 50,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const delay = Math.min(index * delayStep, 350);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }),
    ]).start();
  }, [index, delayStep, fadeAnim, translateYAnim]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedCardEntrance;
