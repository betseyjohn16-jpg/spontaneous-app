import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/expo";
import { router } from "expo-router";
import type { Href } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  usePreferences,
  ALLERGY_OPTIONS,
  ACCESSIBILITY_OPTIONS,
  RADIUS_OPTIONS,
} from "@/context/PreferencesContext";
import { useUsage, FREE_LIMIT } from "@/context/UsageContext";

export default function PreferencesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    preferences,
    toggleAllergy,
    toggleAccessibility,
    setRadiusMiles,
    setUseLocation,
    resetPreferences,
  } = usePreferences();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [locationStatus, setLocationStatus] = useState<"granted" | "denied" | "undetermined">("undetermined");

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setLocationStatus(status as "granted" | "denied" | "undetermined");
    });
  }, []);

  const handleLocationToggle = async (val: boolean) => {
    Haptics.selectionAsync();
    if (val) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(status as "granted" | "denied" | "undetermined");
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "Please enable location access in your device settings to use distance features.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    setUseLocation(val);
  };

  const handleReset = () => {
    Alert.alert("Reset Preferences", "Clear all your preferences?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          resetPreferences();
        },
      },
    ]);
  };

  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { requestsUsed, isSubscribed, subscriptionStatus } = useUsage();
  const activeCount = preferences.allergies.length + preferences.accessibility.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Preferences</Text>
          {activeCount > 0 && (
            <Text style={[styles.subtitle, { color: colors.purple }]}>
              {activeCount} filter{activeCount !== 1 ? "s" : ""} active
            </Text>
          )}
        </View>
        <Pressable onPress={handleReset}>
          <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Location & Radius" icon="map-pin" iconColor={colors.gold} colors={colors}>
          <View style={[styles.locationRow, { borderColor: colors.border }]}>
            <View style={styles.locationLeft}>
              <View style={[styles.locationDot, { backgroundColor: locationStatus === "granted" ? colors.success : colors.mutedForeground }]} />
              <View>
                <Text style={[styles.locationLabel, { color: colors.foreground }]}>Use My Location</Text>
                <Text style={[styles.locationSub, { color: colors.mutedForeground }]}>
                  {locationStatus === "granted" ? "Location enabled" : locationStatus === "denied" ? "Permission denied" : "Not requested yet"}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.useLocation}
              onValueChange={handleLocationToggle}
              trackColor={{ false: colors.border, true: colors.gold + "88" }}
              thumbColor={preferences.useLocation ? colors.gold : colors.mutedForeground}
            />
          </View>

          <View style={styles.radiusSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Search Radius
            </Text>
            <View style={styles.radiusChips}>
              {RADIUS_OPTIONS.map((miles) => {
                const active = preferences.radiusMiles === miles;
                return (
                  <Pressable
                    key={miles}
                    style={[
                      styles.radiusChip,
                      {
                        backgroundColor: active ? colors.gold : colors.card,
                        borderColor: active ? colors.gold : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setRadiusMiles(miles);
                    }}
                  >
                    <Text
                      style={[
                        styles.radiusChipText,
                        { color: active ? colors.background : colors.mutedForeground },
                      ]}
                    >
                      {miles < 1 ? `${miles * 5280 / 5280}` : ""}{miles} mi
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Section>

        <Section title="Dietary & Allergies" icon="alert-circle" iconColor={colors.destructive} colors={colors}>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            AI will only suggest places that can accommodate your needs.
          </Text>
          <View style={styles.chipGrid}>
            {ALLERGY_OPTIONS.map((option) => {
              const active = preferences.allergies.includes(option);
              return (
                <ToggleChip
                  key={option}
                  label={option}
                  active={active}
                  color={colors.destructive}
                  colors={colors}
                  onPress={() => {
                    Haptics.selectionAsync();
                    toggleAllergy(option);
                  }}
                />
              );
            })}
          </View>
        </Section>

        <Section title="Accessibility" icon="heart" iconColor={colors.purple} colors={colors}>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            All suggested venues will meet your accessibility requirements.
          </Text>
          <View style={styles.chipGrid}>
            {ACCESSIBILITY_OPTIONS.map((option) => {
              const active = preferences.accessibility.includes(option);
              return (
                <ToggleChip
                  key={option}
                  label={option}
                  active={active}
                  color={colors.purple}
                  colors={colors}
                  onPress={() => {
                    Haptics.selectionAsync();
                    toggleAccessibility(option);
                  }}
                />
              );
            })}
          </View>
        </Section>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Your preferences are saved locally on your device and shared with AI to find the best spots for you.
          </Text>
        </View>

        <Section title="Account" icon="user" iconColor={colors.purple} colors={colors}>
          {isSignedIn ? (
            <View style={{ gap: 12 }}>
              <View style={[styles.accountRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.accountAvatar, { backgroundColor: colors.purple + "33" }]}>
                  <Feather name="user" size={16} color={colors.purple} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.accountEmail, { color: colors.foreground }]} numberOfLines={1}>
                    {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
                  </Text>
                  {isSubscribed ? (
                    <Text style={[styles.accountSub, { color: colors.success }]}>
                      Pro · Active
                    </Text>
                  ) : subscriptionStatus === "past_due" ? (
                    <Text style={[styles.accountSub, { color: colors.destructive }]}>
                      Pro · Payment issue
                    </Text>
                  ) : (
                    <Text style={[styles.accountSub, { color: colors.mutedForeground }]}>
                      Free · {Math.max(0, FREE_LIMIT - requestsUsed)} picks left
                    </Text>
                  )}
                </View>
              </View>
              {!isSubscribed && (
                <Pressable
                  style={[styles.upgradeBtn, { backgroundColor: colors.gold }]}
                  onPress={() => router.push("/paywall" as Href)}
                >
                  <Feather name="zap" size={14} color={colors.background} />
                  <Text style={[styles.upgradeBtnText, { color: colors.background }]}>
                    Upgrade to Pro · $2.99/mo
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.signOutBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  signOut();
                }}
              >
                <Feather name="log-out" size={14} color={colors.mutedForeground} />
                <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>Sign out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                {requestsUsed >= FREE_LIMIT
                  ? "You've used all your free picks. Subscribe for unlimited access."
                  : `${FREE_LIMIT - requestsUsed} free pick${FREE_LIMIT - requestsUsed !== 1 ? "s" : ""} remaining before a subscription is required.`}
              </Text>
              <Pressable
                style={[styles.upgradeBtn, { backgroundColor: colors.gold }]}
                onPress={() => router.push("/paywall" as Href)}
              >
                <Feather name="zap" size={14} color={colors.background} />
                <Text style={[styles.upgradeBtnText, { color: colors.background }]}>
                  Get Spontaneous Pro
                </Text>
              </Pressable>
              <Pressable
                style={[styles.signOutBtn, { borderColor: colors.border }]}
                onPress={() => router.push("/(auth)/sign-in" as Href)}
              >
                <Feather name="log-in" size={14} color={colors.mutedForeground} />
                <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>Sign in</Text>
              </Pressable>
            </View>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  iconColor,
  colors,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIconWrap, { backgroundColor: iconColor + "22" }]}>
          <Feather name={icon} size={15} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ToggleChip({
  label,
  active,
  color,
  colors,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        {
          backgroundColor: active ? color + "22" : colors.card,
          borderColor: active ? color : colors.border,
        },
      ]}
      onPress={onPress}
    >
      {active && <Feather name="check" size={11} color={color} />}
      <Text style={[styles.chipText, { color: active ? color : colors.mutedForeground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: { fontSize: 32, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 28 },
  section: { gap: 14 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: -4 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  locationLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  locationDot: { width: 8, height: 8, borderRadius: 4 },
  locationLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  locationSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  radiusSection: { gap: 0 },
  radiusChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  radiusChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: -8,
  },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  accountAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  accountEmail: { fontSize: 14, fontFamily: "Inter_500Medium" },
  accountSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14 },
  upgradeBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  signOutText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
