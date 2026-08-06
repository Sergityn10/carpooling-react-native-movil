import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, Pencil } from "lucide-react-native";
import { COLORS } from "../../../constants";
import styles from "../profileStyles";

const SubViewHeader = ({ title, onBack, onEdit }) => (
  <View style={styles.subViewHeader}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <ChevronLeft size={24} color={COLORS.gray800} strokeWidth={2.5} />
    </TouchableOpacity>
    <Text style={styles.subViewHeaderTitle}>{title}</Text>
    {onEdit ? (
      <TouchableOpacity style={styles.editHeaderBtn} onPress={onEdit}>
        <Pencil size={18} color={COLORS.secondary} strokeWidth={2.5} />
      </TouchableOpacity>
    ) : (
      <View style={{ width: 40 }} />
    )}
  </View>
);

export default SubViewHeader;
