import { Feather } from "@expo/vector-icons";
import { useSignIn } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import type { Href } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await signIn.password({ emailAddress, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            // web fallback — should not happen in Expo
          } else {
            router.replace("/(tabs)" as Href);
          }
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (!url.startsWith("http")) router.replace("/(tabs)" as Href);
        },
      });
    }
  };

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 20, paddingBottom: bottomPad }]}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.card, marginHorizontal: 28 }]} onPress={() => signIn.reset()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={[styles.contentBlock, { paddingTop: 40 }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.gold + "22" }]}>
            <Feather name="mail" size={28} color={colors.gold} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Verify your account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Enter the code we sent to {emailAddress}</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            value={code} onChangeText={setCode}
            placeholder="6-digit code" placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric" autoFocus
          />
          {errors.fields.code && <Text style={[styles.error, { color: "#E74C3C" }]}>{errors.fields.code.message}</Text>}
          <Pressable style={[styles.primaryBtn, { backgroundColor: colors.gold, opacity: fetchStatus === "fetching" ? 0.6 : 1 }]} onPress={handleVerify} disabled={fetchStatus === "fetching"}>
            {fetchStatus === "fetching" ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.primaryBtnText, { color: colors.background }]}>Verify</Text>}
          </Pressable>
          <Pressable onPress={() => signIn.mfa.sendEmailCode()}>
            <Text style={[styles.linkText, { color: colors.gold, textAlign: "center" }]}>Resend code</Text>
          </Pressable>
          <Pressable onPress={() => signIn.reset()}>
            <Text style={[styles.linkText, { color: colors.mutedForeground, textAlign: "center" }]}>Start over</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 20, paddingBottom: bottomPad + 40 }]} keyboardShouldPersistTaps="handled">
        <Pressable style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.logoRow}>
          <View style={[styles.logoCircle, { backgroundColor: colors.gold + "22" }]}><Text style={styles.logoEmoji}>🎲</Text></View>
          <Text style={[styles.appName, { color: colors.gold }]}>Spontaneous</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to your account</Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            value={emailAddress} onChangeText={setEmailAddress}
            placeholder="you@example.com" placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none" keyboardType="email-address" autoComplete="email"
          />
          {errors.fields.identifier && <Text style={[styles.error, { color: "#E74C3C" }]}>{errors.fields.identifier.message}</Text>}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            value={password} onChangeText={setPassword}
            placeholder="Your password" placeholderTextColor={colors.mutedForeground}
            secureTextEntry
          />
          {errors.fields.password && <Text style={[styles.error, { color: "#E74C3C" }]}>{errors.fields.password.message}</Text>}
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.gold, opacity: (!emailAddress || !password || fetchStatus === "fetching") ? 0.6 : 1 }]}
            onPress={handleSubmit} disabled={!emailAddress || !password || fetchStatus === "fetching"}
          >
            {fetchStatus === "fetching" ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.primaryBtnText, { color: colors.background }]}>Sign In</Text>}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account? </Text>
          <Link href={"/(auth)/sign-up" as Href} asChild>
            <Pressable><Text style={[styles.linkText, { color: colors.gold }]}>Sign up</Text></Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, gap: 4 },
  contentBlock: { paddingHorizontal: 28, gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  logoCircle: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 24 },
  appName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  iconBox: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8, alignSelf: "center" },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 28 },
  form: { gap: 10 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  error: { fontSize: 13, fontFamily: "Inter_400Regular" },
  primaryBtn: { padding: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 28 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
