import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { router, Stack } from "expo-router";
import type { Href } from "expo-router";
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
import { useUsage, FREE_LIMIT } from "@/context/UsageContext";

const FEATURES = [
  "Unlimited restaurant picks",
  "Unlimited day plan generation",
  "Spin Again as many times as you like",
  "Reviews visible to the community",
  "Reservation reminders",
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { requestsUsed, isSubscribed, refreshSubscription } = useUsage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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

      // Ensure user is initialized
      await fetch(`${baseUrl}/api/user/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: user?.primaryEmailAddress?.emailAddress }),
      });

      const res = await fetch(`${baseUrl}/api/stripe/create-checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
          <View style={styles.successBox}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + "22" }]}>
              <Feather name="check" size={40} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>You're subscribed!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Enjoy unlimited picks. Let's go.</Text>
            <Pressable style={[styles.doneBtn, { backgroundColor: colors.gold }]} onPress={() => router.replace("/(tabs)")}>
              <Text style={[styles.doneBtnText, { color: colors.background }]}>Start discovering</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
          <Pressable style={[styles.closeBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.iconBox, { backgroundColor: colors.gold + "22" }]}>
            <Text style={styles.iconEmoji}>🎲</Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>You've used your{"\n"}free picks</Text>
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

          <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.gold + "55" }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.gold }]}>$2.99</Text>
              <Text style={[styles.pricePer, { color: colors.mutedForeground }]}>/month</Text>
            </View>
            <Text style={[styles.priceDesc, { color: colors.mutedForeground }]}>Cancel anytime</Text>
          </View>

          <View style={styles.featureList}>
            {FEATURES.map((feat) => (
              <View key={feat} style={styles.featureRow}>
                <View style={[styles.featureCheck, { backgroundColor: colors.success + "22" }]}>
                  <Feather name="check" size={12} color={colors.success} />
                </View>
                <Text style={[styles.featureText, { color: colors.foreground }]}>{feat}</Text>
              </View>
            ))}
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: "#E74C3C" }]}>{error}</Text>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomPad + 24, backgroundColor: colors.background }]}>
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
                  <Text style={[styles.subscribeBtnText, { color: colors.background }]}>Subscribe for $2.99/month</Text>
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
  navBar: { paddingHorizontal: 24, paddingBottom: 8, alignItems: "flex-end" },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 28, gap: 20 },
  iconBox: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  iconEmoji: { fontSize: 40 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", textAlign: "center", lineHeight: 40 },
  usedText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  progressRow: { flexDirection: "row", gap: 12, justifyContent: "center" },
  progressDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  priceCard: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", gap: 6 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  price: { fontSize: 48, fontFamily: "Inter_700Bold", lineHeight: 52 },
  pricePer: { fontSize: 18, fontFamily: "Inter_400Regular", paddingBottom: 8 },
  priceDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  featureList: { gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureCheck: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  footer: { paddingHorizontal: 24, gap: 10 },
  subscribeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 18, borderRadius: 18 },
  subscribeBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  signInBtn: { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  signInBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  successBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  doneBtn: { padding: 18, borderRadius: 18, paddingHorizontal: 40 },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
