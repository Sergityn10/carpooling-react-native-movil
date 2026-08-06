// YouConnext - Event Hero Image Component
import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Tag } from "lucide-react-native";
import { COLORS } from "../../constants";

const EventHeroImage = ({ image }) => {
  const hasImage = image && image.length > 100;

  if (hasImage) {
    return (
      <Image
        source={{
          uri: image.startsWith("data:")
            ? image
            : `data:image/jpeg;base64,${image}`,
        }}
        style={styles.heroImage}
      />
    );
  }

  return (
    <View style={styles.heroPlaceholder}>
      <Tag size={48} color={COLORS.gray300} strokeWidth={1.5} />
    </View>
  );
};

const styles = StyleSheet.create({
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EventHeroImage;
