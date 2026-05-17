import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Finding something amazing..." }: LoadingScreenProps) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const dot = (delay: number) => {
    const anim = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }, []);
    return anim;
  };

  const d1 = dot(0);
  const d2 = dot(200);
  const d3 = dot(400);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.Text style={[styles.dice, { transform: [{ rotate: spin }], opacity: pulse }]}>
        🎲
      </Animated.Text>
      <Text style={[styles.message, { color: colors.foreground }]}>{message}</Text>
      <View style={styles.dots}>
        {[d1, d2, d3].map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { backgroundColor: colors.primary, opacity: anim }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  dice: {
    fontSize: 56,
  },
  message: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
