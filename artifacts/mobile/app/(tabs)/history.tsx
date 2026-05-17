import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
import { useFavorites, type FavoriteItem } from "@/context/FavoritesContext";
import type { RestaurantSuggestion, ActivityPlan } from "@/context/HistoryContext";

type Tab = "history" | "favorites";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearHistory } = useHistory();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [tab, setTab] = useState<Tab>("history");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleClearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Clear History", "Remove all past picks?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearHistory },
    ]);
  };

  const renderCard = (item: HistoryItem | FavoriteItem, isFav: boolean) => {
    const isRestaurant = item.type === "restaurant";
    const data = item.data;
    const color = isRestaurant ? colors.gold : colors.purple;
    const icon: keyof typeof Feather.glyphMap = isRestaurant ? "coffee" : "map";
    const dataId = (data as RestaurantSuggestion).id ?? (data as ActivityPlan).id;

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
    const favored = isFavorite(dataId);

    return (
      <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.itemIcon, { backgroundColor: color + "22" }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{subtitle}</Text>
          <Text style={[styles.itemDetail, { color }]}>{detail}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>{dateStr}</Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              toggleFavorite(item.type, data as RestaurantSuggestion);
            }}
          >
            <Feather name="heart" size={18} color={favored ? "#E74C3C" : colors.border} />
          </Pressable>
        </View>
      </View>
    );
  };

  const activeList = tab === "history" ? history : favorites;
  const isEmpty = activeList.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Library</Text>
        {tab === "history" && history.length > 0 && (
          <Pressable onPress={handleClearHistory}>
            <Feather name="trash-2" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Segmented control */}
      <View style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["history", "favorites"] as Tab[]).map((t) => {
          const active = tab === t;
          const count = t === "history" ? history.length : favorites.length;
          return (
            <Pressable
              key={t}
              style={[styles.segment, active && { backgroundColor: colors.background }]}
              onPress={() => { Haptics.selectionAsync(); setTab(t); }}
            >
              <Text style={[styles.segmentText, { color: active ? colors.foreground : colors.mutedForeground }]}>
                {t === "history" ? "History" : "Favorites"}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isEmpty ? (
        <View style={styles.empty}>
          <Feather
            name={tab === "history" ? "clock" : "heart"}
            size={40}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {tab === "history" ? "No picks yet" : "No favorites yet"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {tab === "history"
              ? "Your restaurant picks and day plans will appear here."
              : "Tap the heart on any restaurant or day plan to save it here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderCard(item, tab === "favorites")}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold" },
  segmented: { flexDirection: "row", marginHorizontal: 24, borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 16 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  segmentText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 24, gap: 12 },
  item: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, gap: 14, marginBottom: 12 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemContent: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  itemSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  itemDetail: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  itemRight: { alignItems: "flex-end", gap: 8 },
  itemDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
