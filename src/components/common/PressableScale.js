// YouConnext - PressableScale (feedback táctil suave con esquinas redondeadas y sombras limpias)
import React, { useRef, useCallback } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

const PressableScale = ({
  children,
  style,
  onPress,
  disabled,
  scaleTo = 0.97,
  accessibilityRole = "button",
  ...rest
}) => {
  const scaleRef = useRef(null);
  if (!scaleRef.current) {
    scaleRef.current = new Animated.Value(1);
  }

  const animateTo = useCallback((value) => {
    if (scaleRef.current) {
      Animated.spring(scaleRef.current, {
        toValue: value,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }).start();
    }
  }, []);

  const flatStyle = StyleSheet.flatten(style) || {};
  const borderRadius = flatStyle.borderRadius;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      accessibilityRole={accessibilityRole}
      style={borderRadius ? { borderRadius } : undefined}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleRef.current }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default PressableScale;
