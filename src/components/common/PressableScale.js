// YouConnext - PressableScale (feedback táctil suave con esquinas redondeadas y sombras limpias)
import React, { useRef } from "react";
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
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

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
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default PressableScale;
