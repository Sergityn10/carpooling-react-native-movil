// YouConnext - Event Header Component
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronLeft, Share2 } from "lucide-react-native";
import { COLORS, SPACING, FONTS } from "../../constants";

const EventHeader = ({ title, onBack, onShare }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <TouchableOpacity onPress={onShare}>
        <Share2 size={22} color={COLORS.gray600} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: "bold",
    color: COLORS.gray800,
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.sm,
  },
});

export default EventHeader;
