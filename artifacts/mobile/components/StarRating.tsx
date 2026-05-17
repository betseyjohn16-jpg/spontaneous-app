import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  size?: number;
  color?: string;
  emptyColor?: string;
}

export function StarRating({
  value,
  onChange,
  size = 18,
  color = "#C9A84C",
  emptyColor = "#2D1F4A",
}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange?.(star)}
          disabled={!onChange}
          hitSlop={6}
        >
          <Feather
            name={value >= star ? "star" : "star"}
            size={size}
            color={value >= star ? color : emptyColor}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 4 },
});
