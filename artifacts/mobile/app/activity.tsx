import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { ActivityPlan, ActivityEvent } from "@/context/HistoryContext";
import { shareText, formatActivityMessage } from "@/utils/share";

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Food: "coffee",
  Culture: "book",
  Nature: "wind",
  Shopping: "shopping-bag",
  Entertainment: "music",
  Relaxation: "sunset",
  Adventure: "zap",
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#E8C97A",
  Culture: "#A66EE0",
  Nature: "#2ECC71",
  Shopping: "#E74C3C",
  Entertainment: "#3498DB",
  Relaxation: "#1ABC9C",
  Adventure: "#E67E22",
};

function EventCard({
  event,
  isLast,
  colors,
}: {
  event: ActivityEvent & { distanceMiles?: number };
  isLast: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const iconName = CATEGORY_ICONS[event.category] ?? "circle";
  const catColor = CATEGORY_COLORS[event.category] ?? colors.mutedForeground;

  return (
    <View style={styles.eventRow}>
      <View style={styles.timelineCol}>
        <View style={[styles.dot, { backgroundColor: catColor }]} />
        {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
      </View>
      <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.eventTop}>
          <Text style={[styles.eventTime, { color: colors.mutedForeground }]}>{event.time}</Text>
          <View style={[styles.catBadge, { backgroundColor: catColor + "22" }]}>
            <Feather name={iconName} size={10} color={catColor} />
            <Text style={[styles.catText, { color: catColor }]}>{event.category}</Text>
          </View>
        </View>
        <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
        <Text style={[styles.eventDesc, { color: colors.mutedForeground }]}>{event.description}</Text>
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.duration}</Text>
          </View>
          <View style={styles.metaRight}>
            {event.estimatedCost > 0 ? (
              <Text style={[styles.eventCost, { color: colors.gold }]}>${event.estimatedCost}</Text>
            ) : (
              <Text style={[styles.eventCost, { color: colors.success }]}>Free</Text>
            )}
            {event.distanceMiles !== undefined && (
              <View style={styles.distanceTag}>
                <Feather name="navigation" size={9} color={colors.gold} />
                <Text style={[styles.distanceTagText, { color: colors.gold }]}>
                  {event.distanceMiles.toFixed(1)} mi
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string }>();
  const plan: ActivityPlan & { events: (ActivityEvent & { distanceMiles?: number })[] } =
    JSON.parse(params.data ?? "{}");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await shareText(formatActivityMessage(plan), plan.theme);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.card }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.navRight}>
            <View style={[styles.costBadge, { backgroundColor: colors.purple + "22" }]}>
              <Feather name="dollar-sign" size={13} color={colors.purple} />
              <Text style={[styles.costBadgeText, { color: colors.purple }]}>
                ~${plan.totalEstimatedCost} total
              </Text>
            </View>
            <Pressable
              style={[styles.shareBtn, { backgroundColor: colors.card }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <Text style={[styles.theme, { color: colors.foreground }]}>{plan.theme}</Text>
            <Text style={[styles.tagline, { color: colors.purple }]}>{plan.tagline}</Text>
          </View>

          <View style={styles.timeline}>
            {plan.events.map((event, i) => (
              <EventCard
                key={i}
                event={event}
                isLast={i === plan.events.length - 1}
                colors={colors}
              />
            ))}
          </View>

          <View
            style={[
              styles.totalCard,
              { backgroundColor: colors.card, borderColor: colors.gold + "55" },
            ]}
          >
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                Estimated Total
              </Text>
              <Text style={[styles.totalAmount, { color: colors.gold }]}>
                ${plan.totalEstimatedCost}
              </Text>
            </View>
            <Text style={[styles.totalSub, { color: colors.mutedForeground }]}>
              Prices are approximate and may vary.
            </Text>
            <Pressable
              style={[styles.shareCardBtn, { backgroundColor: colors.purple + "22", borderColor: colors.purple + "44" }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={15} color={colors.purple} />
              <Text style={[styles.shareCardBtnText, { color: colors.purple }]}>
                Share this itinerary
              </Text>
            </Pressable>
          </View>
        </ScrollView>
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
    paddingBottom: 12,
  },
  navRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  shareBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  costBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24 },
  heroSection: { gap: 8 },
  theme: { fontSize: 32, fontFamily: "Inter_700Bold", lineHeight: 38 },
  tagline: { fontSize: 15, fontFamily: "Inter_500Medium" },
  timeline: { gap: 0 },
  eventRow: { flexDirection: "row", gap: 14 },
  timelineCol: { alignItems: "center", width: 20 },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 18 },
  line: { width: 2, flex: 1, marginTop: 4, marginBottom: -4 },
  eventCard: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, gap: 8, marginBottom: 12 },
  eventTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eventTime: { fontSize: 12, fontFamily: "Inter_500Medium" },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  catText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  eventTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  eventDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventCost: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  distanceTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  distanceTagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  totalCard: { padding: 18, borderRadius: 18, borderWidth: 1, gap: 10 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalAmount: { fontSize: 26, fontFamily: "Inter_700Bold" },
  totalSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  shareCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  shareCardBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
