import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface ReservationConfirmation {
  confirmationCode: string;
  restaurantName: string;
  partySize: number;
  reservationTime: string;
  message: string;
}

export default function ReservationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string }>();
  const confirmation: ReservationConfirmation = JSON.parse(params.data ?? "{}");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
        <Pressable
          style={[styles.closeBtn, { backgroundColor: colors.card }]}
          onPress={() => { Haptics.selectionAsync(); router.dismissAll(); }}
        >
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.content}>
          <Animated.View style={[styles.checkCircle, { backgroundColor: colors.success + "22", transform: [{ scale }], opacity }]}>
            <Feather name="check" size={48} color={colors.success} />
          </Animated.View>

          <Animated.View style={{ opacity, transform: [{ translateY: slideUp }], gap: 8, alignItems: "center" }}>
            <Text style={[styles.confirmedLabel, { color: colors.success }]}>Reservation Confirmed</Text>
            <Text style={[styles.restaurantName, { color: colors.foreground }]}>{confirmation.restaurantName}</Text>
          </Animated.View>

          <Animated.View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.gold + "55", opacity, transform: [{ translateY: slideUp }] }]}>
            <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>Confirmation Code</Text>
            <Text style={[styles.code, { color: colors.gold }]}>{confirmation.confirmationCode}</Text>
          </Animated.View>

          <Animated.View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, opacity, transform: [{ translateY: slideUp }] }]}>
            <DetailRow icon="clock" label="Time" value={confirmation.reservationTime} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <DetailRow icon="users" label="Party Size" value={`${confirmation.partySize} ${confirmation.partySize === 1 ? "guest" : "guests"}`} colors={colors} />
          </Animated.View>

          <Animated.View style={{ opacity, transform: [{ translateY: slideUp }] }}>
            <Text style={[styles.message, { color: colors.mutedForeground }]}>{confirmation.message}</Text>
          </Animated.View>
        </View>

        <Pressable
          style={[styles.doneBtn, { backgroundColor: colors.gold }]}
          onPress={() => { Haptics.selectionAsync(); router.dismissAll(); }}
        >
          <Text style={[styles.doneBtnText, { color: colors.background }]}>Done</Text>
        </Pressable>
      </View>
    </>
  );
}

function DetailRow({ icon, label, value, colors }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Feather name={icon} size={15} color={colors.mutedForeground} />
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  closeBtn: { alignSelf: "flex-end", width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 16 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  confirmedLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1 },
  restaurantName: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  codeCard: { width: "100%", padding: 20, borderRadius: 18, borderWidth: 1, alignItems: "center", gap: 6 },
  codeLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  code: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: 6 },
  detailsCard: { width: "100%", borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1 },
  message: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19, paddingHorizontal: 8 },
  doneBtn: { padding: 18, borderRadius: 18, alignItems: "center", marginBottom: 8 },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
