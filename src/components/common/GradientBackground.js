// YouConnext - GradientBackground (degradado lineal con soporte de esquinas redondeadas)
import React, { useRef } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

let gradientCounter = 0;

const GradientBackground = ({
  colors,
  opacities,
  locations,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  borderRadius = 0,
  style,
}) => {
  const idRef = useRef(null);
  if (idRef.current === null) {
    gradientCounter += 1;
    idRef.current = `yc-gradient-${gradientCounter}`;
  }
  const id = idRef.current;
  const lastIndex = Math.max(colors.length - 1, 1);

  const flatStyle = StyleSheet.flatten(style) || {};
  const radius = borderRadius || flatStyle.borderRadius || 0;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        radius > 0 && { borderRadius: radius, overflow: "hidden" },
        style,
      ]}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient
            id={id}
            x1={String(start.x)}
            y1={String(start.y)}
            x2={String(end.x)}
            y2={String(end.y)}
          >
            {colors.map((color, index) => (
              <Stop
                key={`${color}-${index}`}
                offset={String(locations?.[index] ?? index / lastIndex)}
                stopColor={color}
                stopOpacity={opacities?.[index] ?? 1}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={radius}
          ry={radius}
          fill={`url(#${id})`}
        />
      </Svg>
    </View>
  );
};

export default GradientBackground;
