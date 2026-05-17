import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useMakeReservation } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { RestaurantSuggestion } from "@/context/HistoryContext";
import { shareText, formatRestaurantMessage } from "@/utils/share";

function InfoChip({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[chipStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: { padding: 14, borderRadius: 14, borderWidth: 1, flex: 1, gap: 4 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

export default function RestaurantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string }>();
  const [partySize, setPartySize] = useState(2);

  const restaurant: RestaurantSuggestion & {
    latitude?: number;
    longitude?: number;
    distanceMiles?: number;
    accessibilityFeatures?: string[];
  } = JSON.parse(params.data ?? "{}");

  const { mutateAsync: makeReservation, isPending } = useMakeReservation();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleReserve = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const confirmation = await makeReservation({
        body: {
          restaurantName: restaurant.name,
          restaurantId: restaurant.id,
          partySize,
          reservationTime: restaurant.reservationTime,
        },
      });
      router.push({ pathname: "/reservation", params: { data: JSON.stringify(confirmation) } });
    } catch (e) {
      console.error(e);
    }
  };

  const attireColor =
    {
      Casual: colors.success,
      "Smart Casual": colors.gold,
      "Business Casual": colors.goldLight,
      Formal: colors.purple,
    }[restaurant.attire] ?? colors.mutedForeground;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.navRight}>
            <View style={[styles.badge, { backgroundColor: colors.gold + "22" }]}>
              <Text style={[styles.badgeText, { color: colors.gold }]}>{restaurant.cuisine}</Text>
            </View>
            <Pressable
              style={[styles.shareBtn, { backgroundColor: colors.card }]}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await shareText(
                  formatRestaurantMessage(restaurant),
                  `Dinner at ${restaurant.name}`
                );
              }}
            >
              <Feather name="share-2" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{restaurant.name}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color={colors.gold} />
              <Text style={[styles.ratingText, { color: colors.gold }]}>
                {restaurant.rating?.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.location, { color: colors.mutedForeground }]}>
              {restaurant.neighborhood} · {restaurant.address}
            </Text>
          </View>

          {restaurant.distanceMiles !== undefined && (
            <View style={[styles.distanceBadge, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "44" }]}>
              <Feather name="navigation" size={12} color={colors.gold} />
              <Text style={[styles.distanceText, { color: colors.gold }]}>
                {restaurant.distanceMiles.toFixed(1)} miles from you
              </Text>
            </View>
          )}

          <Text style={[styles.description, { color: colors.foreground + "CC" }]}>
            {restaurant.description}
          </Text>

          <View style={styles.grid}>
            <InfoChip label="Attire" value={restaurant.attire} color={attireColor} colors={colors} />
            <InfoChip
              label="Est. Cost"
              value={`$${restaurant.estimatedCostPerPerson} pp`}
              color={colors.gold}
              colors={colors}
            />
          </View>
          <View style={styles.grid}>
            <InfoChip
              label="Time"
              value={restaurant.reservationTime}
              color={colors.purple}
              colors={colors}
            />
            <InfoChip
              label="Walk-in"
              value={restaurant.waitTime}
              color={colors.mutedForeground}
              colors={colors}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Feather name="user" size={16} color={colors.gold} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dress Code</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
              {restaurant.attireDescription}
            </Text>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Feather name="award" size={16} color={colors.gold} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Must Order</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
              {restaurant.specialtyDish}
            </Text>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Feather name="moon" size={16} color={colors.purple} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ambiance</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
              {restaurant.ambiance}
            </Text>
          </View>

          {restaurant.accessibilityFeatures && restaurant.accessibilityFeatures.length > 0 && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.card, borderColor: colors.purple + "55" },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Feather name="heart" size={16} color={colors.purple} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Accessibility
                </Text>
              </View>
              <View style={styles.accessChips}>
                {restaurant.accessibilityFeatures.map((feat) => (
                  <View
                    key={feat}
                    style={[styles.accessChip, { backgroundColor: colors.purple + "22", borderColor: colors.purple + "44" }]}
                  >
                    <Feather name="check" size={10} color={colors.purple} />
                    <Text style={[styles.accessChipText, { color: colors.purple }]}>{feat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.partySizeRow}>
            <Text style={[styles.partySizeLabel, { color: colors.foreground }]}>Party Size</Text>
            <View style={styles.partySizeControls}>
              <Pressable
                style={[
                  styles.sizeBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => {
                  if (partySize > 1) {
                    setPartySize((p) => p - 1);
                    Haptics.selectionAsync();
                  }
                }}
              >
                <Feather name="minus" size={16} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.sizeNum, { color: colors.foreground }]}>{partySize}</Text>
              <Pressable
                style={[
                  styles.sizeBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => {
                  if (partySize < 10) {
                    setPartySize((p) => p + 1);
                    Haptics.selectionAsync();
                  }
                }}
              >
                <Feather name="plus" size={16} color={colors.foreground} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: bottomPad + 24, backgroundColor: colors.background },
          ]}
        >
          <Pressable
            style={[
              styles.reserveBtn,
              { backgroundColor: colors.gold, opacity: isPending ? 0.7 : 1 },
            ]}
            onPress={handleReserve}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Feather name="calendar" size={18} color={colors.background} />
                <Text style={[styles.reserveBtnText, { color: colors.background }]}>
                  Reserve for {restaurant.reservationTime}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  navRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  name: { fontSize: 30, fontFamily: "Inter_700Bold", flex: 1, lineHeight: 36 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 6 },
  ratingText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  location: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  distanceText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  description: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  grid: { flexDirection: "row", gap: 12 },
  section: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  accessChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  accessChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  accessChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  partySizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  partySizeLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  partySizeControls: { flexDirection: "row", alignItems: "center", gap: 20 },
  sizeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    minWidth: 28,
    textAlign: "center",
  },
  footer: { paddingHorizontal: 24 },
  reserveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 18,
  },
  reserveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
