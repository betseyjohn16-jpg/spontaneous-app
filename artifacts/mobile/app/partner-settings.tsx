import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useGetMyRestaurant,
  useUpdateMyRestaurant,
  getGetMyRestaurantQueryKey,
} from "@workspace/api-client-react";
import type { RestaurantUpdate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

function Field({ label, value, onChange, placeholder, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function PartnerSettings() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useGetMyRestaurant();
  const updateMutation = useUpdateMyRestaurant();

  const [form, setForm] = useState({ name: "", cuisine: "", description: "", address: "", phone: "", email: "", openingHours: "", priceRange: "$$", isActive: true });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name ?? "",
        cuisine: restaurant.cuisine ?? "",
        description: restaurant.description ?? "",
        address: restaurant.address ?? "",
        phone: restaurant.phone ?? "",
        email: restaurant.email ?? "",
        openingHours: restaurant.openingHours ?? "",
        priceRange: restaurant.priceRange ?? "$$",
        isActive: restaurant.isActive ?? true,
      });
    }
  }, [restaurant]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;
  const set = (key: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [key]: v }));

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const update: RestaurantUpdate = {
      name: form.name || undefined,
      cuisine: form.cuisine || undefined,
      description: form.description || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      openingHours: form.openingHours || undefined,
      priceRange: form.priceRange || undefined,
      isActive: form.isActive,
    };
    updateMutation.mutate({ data: update }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getGetMyRestaurantQueryKey() });
        Alert.alert("Saved", "Restaurant settings updated.");
      },
      onError: () => Alert.alert("Error", "Failed to save settings."),
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending} hitSlop={8}>
          {updateMutation.isPending ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 20, paddingTop: 20, gap: 0 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Profile</Text>
        <Field label="Restaurant Name" value={form.name} onChange={set("name")} />
        <Field label="Cuisine Type" value={form.cuisine} onChange={set("cuisine")} placeholder="Italian, Japanese…" />
        <Field label="Address" value={form.address} onChange={set("address")} />
        <Field label="Description" value={form.description} onChange={set("description")} placeholder="Short description for users" />
        <Field label="Phone" value={form.phone} onChange={set("phone")} keyboardType="phone-pad" />
        <Field label="Email" value={form.email} onChange={set("email")} keyboardType="email-address" />
        <Field label="Opening Hours" value={form.openingHours} onChange={set("openingHours")} placeholder="Mon–Fri 11am–10pm" />

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>Price Range</Text>
        <View style={styles.priceRow}>
          {PRICE_RANGES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.priceChip, { borderColor: form.priceRange === p ? colors.primary : colors.border, backgroundColor: form.priceRange === p ? colors.primary + "18" : "transparent" }]}
              onPress={() => set("priceRange")(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.priceChipText, { color: form.priceRange === p ? colors.primary : colors.foreground }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>Visibility</Text>
        <View style={[styles.switchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>Active on Spontaneous</Text>
            <Text style={[styles.switchSub, { color: colors.mutedForeground }]}>
              When off, your restaurant won't be suggested to users.
            </Text>
          </View>
          <Switch
            value={form.isActive}
            onValueChange={(v) => set("isActive")(v)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: updateMutation.isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
          activeOpacity={0.8}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="save" size={17} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  priceRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  priceChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  priceChipText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  switchCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 12, marginBottom: 24 },
  switchLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  switchSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
