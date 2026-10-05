// YouConnext - Event Hero Image Component (Pro Design with Badges & Gradient)
import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Ticket } from "lucide-react-native";
import { COLORS, RADIUS } from "../../constants";
import GradientBackground from "../common/GradientBackground";

const EventHeroImage = ({ image }) => {
  const hasImage = Boolean(image && typeof image === "string" && image.length > 20);

  const getImageUri = (img) => {
    if (img.startsWith("data:") || img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  return (
    <View style={styles.container}>
      {hasImage ? (
        <Image
          source={{
            uri: getImageUri(image),
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.heroPlaceholder}>
          <GradientBackground
            colors={[COLORS.secondarySoft, COLORS.primarySoft]}
          />
          <Ticket size={48} color={COLORS.primary} strokeWidth={1.5} />
        </View>
      )}
      <GradientBackground
        colors={["#000000", "#000000"]}
        opacities={[0, 0.6]}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 220,
    backgroundColor: COLORS.gray100,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EventHeroImage;
