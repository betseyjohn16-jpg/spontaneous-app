import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { useSuggestActivity, useSuggestRestaurant } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useHistory } from "@/context/HistoryContext";
import { usePreferences } from "@/context/PreferencesContext";
import { useUsage } from "@/context/UsageContext";
import type { RestaurantSuggestion, ActivityPlan } from "@/context/HistoryContext";

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToHistory } = useHistory();
  const { preferences } = usePreferences();
  const [loadingType, setLoadingType] = useState<"restaurant" | "activity" | null>(null);

  const { mutateAsync: suggestRestaurant } = useSuggestRestaurant();
  const { mutateAsync: suggestActivity } = useSuggestActivity();
  const { canMakeRequest, incrementUsage } = useUsage();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const getLocationCoords = async () => {
    if (!preferences.useLocation) return null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      return null;
    }
  };

  const buildPrefsPayload = (coords: { lat: number; lng: number } | null) => ({
    allergies: preferences.allergies.length > 0 ? preferences.allergies : undefined,
    accessibility: preferences.accessibility.length > 0 ? preferences.accessibility : undefined,
    radiusMiles: preferences.radiusMiles,
    userLat: coords?.lat,
    userLng: coords?.lng,
  });

  const handleRestaurant = async () => {
    if (loadingType) return;
    if (!canMakeRequest) {
      router.push("/paywall" as Href);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingType("restaurant");
    try {
      const coords = await getLocationCoords();
      const data = await suggestRestaurant({ data: buildPrefsPayload(coords) });
      await addToHistory("restaurant", data as RestaurantSuggestion);
      await incrementUsage();
      router.push({ pathname: "/restaurant", params: { data: JSON.stringify(data) } });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingType(null);
    }
  };

  const handleActivity = async () => {
    if (loadingType) return;
    if (!canMakeRequest) {
      router.push("/paywall" as Href);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingType("activity");
    try {
      const coords = await getLocationCoords();
      const data = await suggestActivity({ data: buildPrefsPayload(coords) });
      await addToHistory("activity", data as ActivityPlan);
      await incrementUsage();
      router.push({ pathname: "/activity", params: { data: JSON.stringify(data) } });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingType(null);
    }
  };

  const activeFilters = preferences.allergies.length + preferences.accessibility.length;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad + 20,
          paddingBottom: bottomPad + 100,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Leave it to chance</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          What's{"\n"}the plan?
        </Text>
        {activeFilters > 0 && (
          <View style={[styles.filtersBadge, { backgroundColor: colors.purple + "22", borderColor: colors.purple + "44" }]}>
            <Feather name="sliders" size={11} color={colors.purple} />
            <Text style={[styles.filtersText, { color: colors.purple }]}>
              {activeFilters} preference{activeFilters !== 1 ? "s" : ""} active
            </Text>
          </View>
        )}
        {preferences.useLocation && (
          <View style={[styles.filtersBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}>
            <Feather name="map-pin" size={11} color={colors.gold} />
            <Text style={[styles.filtersText, { color: colors.gold }]}>
              Within {preferences.radiusMiles} mi
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cards}>
        <BigCard
          icon="coffee"
          label="Dinner Tonight"
          description="We pick the restaurant, reserve your table, and tell you what to wear."
          color={colors.gold}
          loading={loadingType === "restaurant"}
          onPress={handleRestaurant}
          disabled={!!loadingType}
          colors={colors}
        />
        <BigCard
          icon="map"
          label="Plan My Day"
          description="Get a full curated day with times, activities, and exactly what it'll cost."
          color={colors.purple}
          loading={loadingType === "activity"}
          onPress={handleActivity}
          disabled={!!loadingType}
          colors={colors}
        />
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        Powered by spontaneity
      </Text>
    </View>
  );
}

interface BigCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  color: string;
  loading: boolean;
  onPress: () => void;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
}

function BigCard({ icon, label, description, color, loading, onPress, disabled, colors }: BigCardProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: disabled && !loading ? 0.5 : 1,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
          {loading ? (
            <ActivityIndicator color={color} size="small" />
          ) : (
            <Feather name={icon} size={26} color={color} />
          )}
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{description}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={color} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  header: { gap: 8, marginBottom: 8 },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: { fontSize: 46, fontFamily: "Inter_700Bold", lineHeight: 52 },
  filtersBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  filtersText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cards: { flex: 1, gap: 16, justifyContent: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 4 },
  cardLabel: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  footer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingBottom: 8,
    letterSpacing: 1,
  },
});
