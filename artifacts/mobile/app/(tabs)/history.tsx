import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useHistory, type HistoryItem } from "@/context/HistoryContext";
import type { RestaurantSuggestion, ActivityPlan } from "@/context/HistoryContext";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearHistory } = useHistory();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Clear History", "Remove all past picks?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearHistory },
    ]);
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isRestaurant = item.type === "restaurant";
    const data = item.data;
    const color = isRestaurant ? colors.gold : colors.purple;
    const icon: keyof typeof Feather.glyphMap = isRestaurant ? "coffee" : "map";

    let title = "";
    let subtitle = "";
    let detail = "";

    if (isRestaurant) {
      const r = data as RestaurantSuggestion;
      title = r.name;
      subtitle = r.cuisine;
      detail = `${r.costRange} · ${r.attire}`;
    } else {
      const a = data as ActivityPlan;
      title = a.theme;
      subtitle = a.tagline;
      detail = `$${a.totalEstimatedCost} · ${a.events.length} stops`;
    }

    const date = new Date(item.savedAt);
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return (
      <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: color + "22" }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={[styles.itemDetail, { color: color }]}>{detail}</Text>
        </View>
        <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>{dateStr}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        {history.length > 0 && (
          <Pressable onPress={handleClear}>
            <Feather name="trash-2" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="clock" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No picks yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Your restaurant picks and day plans will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  list: {
    paddingHorizontal: 24,
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 12,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  itemSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  itemDetail: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
