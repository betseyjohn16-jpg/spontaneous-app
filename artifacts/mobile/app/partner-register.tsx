import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useRegisterRestaurant } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function PartnerRegister() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const registerMutation = useRegisterRestaurant();

  const [form, setForm] = useState({
    name: "",
    cuisine: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.cuisine.trim() || !form.address.trim()) {
      Alert.alert("Missing fields", "Name, cuisine, and address are required.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    registerMutation.mutate(
      {
        data: {
          name: form.name.trim(),
          cuisine: form.cuisine.trim(),
          address: form.address.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          description: form.description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)/partner");
        },
        onError: (e: any) => {
          Alert.alert("Error", e?.message ?? "Registration failed. Please try again.");
        },
      }
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Register Restaurant</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 20, paddingTop: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="briefcase" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Join Spontaneous and reach new customers discovering restaurants near them.
        </Text>

        <Field label="Restaurant Name *" value={form.name} onChange={set("name")} placeholder="The Grand Bistro" />
        <Field label="Cuisine Type *" value={form.cuisine} onChange={set("cuisine")} placeholder="Italian, Japanese, American…" />
        <Field label="Address *" value={form.address} onChange={set("address")} placeholder="123 Main St, City" />
        <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" />
        <Field label="Email" value={form.email} onChange={set("email")} placeholder="contact@restaurant.com" keyboardType="email-address" />
        <Field label="Description" value={form.description} onChange={set("description")} placeholder="A short description for users…" />

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: registerMutation.isPending ? 0.7 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={registerMutation.isPending}
          activeOpacity={0.8}
        >
          {registerMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Complete Registration</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 28,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 24,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
