import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { router, Stack } from "expo-router";
import type { Href } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLayout } from "@/hooks/useLayout";
import { useUsage, FREE_LIMIT } from "@/context/UsageContext";

type Plan = "monthly" | "annual";

const PLANS = {
  monthly: {
    label: "Monthly",
    price: "$2.99",
    period: "/month",
    sub: "Cancel anytime",
    badge: null,
    unitPrice: null,
  },
  annual: {
    label: "Annual",
    price: "$19.99",
    period: "/year",
    sub: "Just $1.67/month · Cancel anytime",
    badge: "Save 44%",
    unitPrice: "$1.67/mo",
  },
} as const;

const FEATURES = [
  { icon: "refresh-cw" as const, text: "Unlimited restaurant & day plan picks" },
  { icon: "rotate-cw" as const, text: "Spin Again as many times as you want" },
  { icon: "star" as const, text: "Leave reviews visible to the community" },
  { icon: "bell" as const, text: "Reservation reminders via push" },
  { icon: "zap" as const, text: "Priority AI responses" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { requestsUsed, isSubscribed, subscriptionInterval, refreshSubscription } = useUsage();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isMonthlySubscriber = isSubscribed && subscriptionInterval === "month";

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      router.push("/(auth)/sign-up" as Href);
      return;
    }
    setLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";

      await fetch(`${baseUrl}/api/user/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: user?.primaryEmailAddress?.emailAddress }),
      });

      const res = await fetch(`${baseUrl}/api/stripe/create-checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!data.url) {
        setError(data.error ?? "Failed to create checkout session");
        return;
      }
      const result = await WebBrowser.openBrowserAsync(data.url);
      if (result.type === "cancel" || result.type === "dismiss") {
        await refreshSubscription();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToAnnual = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Upgrade to Annual",
      "Switch to the annual plan for $19.99/year (~$1.67/month) and save 44%. Your billing will be prorated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: async () => {
            setUpgrading(true);
            setError("");
            try {
              const token = await getToken();
              const domain = process.env.EXPO_PUBLIC_DOMAIN;
              const baseUrl = domain ? `https://${domain}` : "";
              const res = await fetch(`${baseUrl}/api/stripe/upgrade-to-annual`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (data.success) {
                await refreshSubscription();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                setError(data.error ?? "Upgrade failed");
              }
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            } finally {
              setUpgrading(false);
            }
          },
        },
      ]
    );
  };

  if (isSubscribed) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
          <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={[styles.subscribedContent, layout.contentStyle]}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + "22" }]}>
              <Feather name="check" size={40} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>You're Pro!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Enjoy unlimited picks. Let's go.</Text>

            {isMonthlySubscriber && (
              <View style={[styles.upgradeCard, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
                <View style={[styles.upgradeBadge, { backgroundColor: colors.gold + "22" }]}>
                  <Text style={[styles.upgradeBadgeText, { color: colors.gold }]}>💰 Save 44%</Text>
                </View>
                <Text style={[styles.upgradeTitle, { color: colors.foreground }]}>Switch to Annual</Text>
                <Text style={[styles.upgradeDesc, { color: colors.mutedForeground }]}>
                  You're on the monthly plan. Upgrade to annual for $19.99/year — that's $1.67/month instead of $2.99.
                </Text>
                {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
                <Pressable
                  style={[styles.upgradeBtn, { backgroundColor: colors.gold, opacity: upgrading ? 0.7 : 1 }]}
                  onPress={handleUpgradeToAnnual}
                  disabled={upgrading}
                >
                  {upgrading ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <>
                      <Feather name="arrow-up-circle" size={16} color={colors.background} />
                      <Text style={[styles.upgradeBtnText, { color: colors.background }]}>Upgrade to Annual — $19.99/yr</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            <Pressable style={[styles.doneBtn, { backgroundColor: colors.gold }]} onPress={() => router.replace("/(tabs)")}>
              <Text style={[styles.doneBtnText, { color: colors.background }]}>Start discovering</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  const plan = PLANS[selectedPlan];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { paddingTop: topPad + 8, paddingHorizontal: layout.hPad }]}>
          <Pressable style={[styles.closeBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120, paddingHorizontal: layout.hPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.innerContent, layout.contentStyle]}>
            <View style={[styles.iconBox, { backgroundColor: colors.gold + "22" }]}>
              <Text style={styles.iconEmoji}>🎲</Text>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>Unlock unlimited{"\n"}spontaneity</Text>
            <Text style={[styles.usedText, { color: colors.mutedForeground }]}>
              {requestsUsed} of {FREE_LIMIT} free picks used
            </Text>

            <View style={styles.progressRow}>
              {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    { backgroundColor: i < requestsUsed ? colors.gold : colors.card, borderColor: i < requestsUsed ? colors.gold : colors.border },
                  ]}
                />
              ))}
            </View>

            {/* Plan selector */}
            <View style={[styles.planSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["monthly", "annual"] as Plan[]).map((p) => {
                const active = selectedPlan === p;
                return (
                  <Pressable
                    key={p}
                    style={[styles.planTab, active && { backgroundColor: colors.background }]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedPlan(p); }}
                  >
                    <View style={styles.planTabInner}>
                      <Text style={[styles.planTabLabel, { color: active ? colors.foreground : colors.mutedForeground }]}>
                        {PLANS[p].label}
                      </Text>
                      {PLANS[p].badge && (
                        <View style={[styles.savingsBadge, { backgroundColor: colors.success + "22" }]}>
                          <Text style={[styles.savingsBadgeText, { color: colors.success }]}>{PLANS[p].badge}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Price card */}
            <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: colors.gold }]}>{plan.price}</Text>
                <Text style={[styles.pricePer, { color: colors.mutedForeground }]}>{plan.period}</Text>
              </View>
              {plan.unitPrice && (
                <View style={[styles.unitPriceBadge, { backgroundColor: colors.success + "18" }]}>
                  <Text style={[styles.unitPriceText, { color: colors.success }]}>= {plan.unitPrice} billed annually</Text>
                </View>
              )}
              <Text style={[styles.priceDesc, { color: colors.mutedForeground }]}>{plan.sub}</Text>
            </View>

            {/* Features */}
            <View style={styles.featureList}>
              {FEATURES.map((feat) => (
                <View key={feat.text} style={styles.featureRow}>
                  <View style={[styles.featureCheck, { backgroundColor: colors.success + "22" }]}>
                    <Feather name={feat.icon} size={12} color={colors.success} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{feat.text}</Text>
                </View>
              ))}
            </View>

            {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomPad + 24, paddingHorizontal: layout.hPad, backgroundColor: colors.background }]}>
          {!isSignedIn ? (
            <>
              <Pressable
                style={[styles.subscribeBtn, { backgroundColor: colors.gold }]}
                onPress={() => router.push("/(auth)/sign-up" as Href)}
              >
                <Feather name="user-plus" size={18} color={colors.background} />
                <Text style={[styles.subscribeBtnText, { color: colors.background }]}>Create account & Subscribe</Text>
              </Pressable>
              <Pressable
                style={[styles.signInBtn, { borderColor: colors.border }]}
                onPress={() => router.push("/(auth)/sign-in" as Href)}
              >
                <Text style={[styles.signInBtnText, { color: colors.mutedForeground }]}>Already have an account? Sign in</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.subscribeBtn, { backgroundColor: colors.gold, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Feather name="zap" size={18} color={colors.background} />
                  <Text style={[styles.subscribeBtnText, { color: colors.background }]}>
                    {selectedPlan === "annual" ? "Subscribe — $19.99/year" : "Subscribe — $2.99/month"}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { paddingBottom: 8, alignItems: "flex-start" },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  content: { gap: 20 },
  innerContent: { gap: 20 },
  iconBox: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  iconEmoji: { fontSize: 40 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", lineHeight: 36 },
  usedText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  progressRow: { flexDirection: "row", gap: 12, justifyContent: "center" },
  progressDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  planSelector: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4 },
  planTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  planTabInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  planTabLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  savingsBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  savingsBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  priceCard: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  price: { fontSize: 48, fontFamily: "Inter_700Bold", lineHeight: 52 },
  pricePer: { fontSize: 18, fontFamily: "Inter_400Regular", paddingBottom: 8 },
  unitPriceBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  unitPriceText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  priceDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featureList: { gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureCheck: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  footer: { gap: 10 },
  subscribeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 18, borderRadius: 18 },
  subscribeBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  signInBtn: { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  signInBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  subscribedContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  upgradeCard: { width: "100%", borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  upgradeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  upgradeBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  upgradeTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  upgradeDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14 },
  upgradeBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  doneBtn: { padding: 18, borderRadius: 18, paddingHorizontal: 40 },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
