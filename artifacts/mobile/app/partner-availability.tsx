import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useListAvailabilitySlots,
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useListBlackouts,
  useCreateBlackout,
  useDeleteBlackout,
  getListAvailabilitySlotsQueryKey,
  getListBlackoutsQueryKey,
} from "@workspace/api-client-react";
import type { AvailabilitySlotInput, BlackoutInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

type Tab = "slots" | "blackouts";

export default function PartnerAvailability() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("slots");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  // Slots
  const { data: slots = [], isLoading: slotsLoading } = useListAvailabilitySlots();
  const createSlotMutation = useCreateAvailabilitySlot();
  const deleteSlotMutation = useDeleteAvailabilitySlot();

  // Blackouts
  const { data: blackouts = [], isLoading: blackoutsLoading } = useListBlackouts();
  const createBlackoutMutation = useCreateBlackout();
  const deleteBlackoutMutation = useDeleteBlackout();

  // Add slot form
  const today = new Date().toISOString().split("T")[0]!;
  const [slotForm, setSlotForm] = useState({ date: today, time: "18:00", partyMin: "1", partyMax: "6", capacity: "4" });
  const [blackoutForm, setBlackoutForm] = useState({ startDate: today, endDate: today, reason: "" });

  const handleAddSlot = () => {
    if (!slotForm.date || !slotForm.time) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const data: AvailabilitySlotInput = {
      date: slotForm.date,
      time: slotForm.time,
      partyMin: parseInt(slotForm.partyMin),
      partyMax: parseInt(slotForm.partyMax),
      capacity: parseInt(slotForm.capacity),
    };
    createSlotMutation.mutate({ data }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAvailabilitySlotsQueryKey() }),
    });
  };

  const handleDeleteSlot = (id: number) => {
    Alert.alert("Remove slot?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteSlotMutation.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAvailabilitySlotsQueryKey() }) }) },
    ]);
  };

  const handleAddBlackout = () => {
    if (!blackoutForm.startDate || !blackoutForm.endDate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const data: BlackoutInput = {
      startDate: blackoutForm.startDate,
      endDate: blackoutForm.endDate,
      reason: blackoutForm.reason || undefined,
    };
    createBlackoutMutation.mutate({ data }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBlackoutsQueryKey() }),
    });
  };

  const handleDeleteBlackout = (id: number) => {
    Alert.alert("Remove blackout?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteBlackoutMutation.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBlackoutsQueryKey() }) }) },
    ]);
  };

  const inputStyle = [styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Availability</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(["slots", "blackouts"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && { borderBottomColor: colors.primary }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabLabel, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t === "slots" ? `Time Slots (${slots.length})` : `Blackouts (${blackouts.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "slots" ? (
        <FlatList
          data={slots}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={!!slots.length}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: bottomPad }}
          ListHeaderComponent={
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>Add Time Slot</Text>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Date</Text>
                  <TextInput style={inputStyle} value={slotForm.date} onChangeText={(v) => setSlotForm((f) => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Time</Text>
                  <TextInput style={inputStyle} value={slotForm.time} onChangeText={(v) => setSlotForm((f) => ({ ...f, time: v }))} placeholder="HH:MM" placeholderTextColor={colors.mutedForeground} />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Min party</Text>
                  <TextInput style={inputStyle} value={slotForm.partyMin} onChangeText={(v) => setSlotForm((f) => ({ ...f, partyMin: v }))} keyboardType="number-pad" placeholderTextColor={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Max party</Text>
                  <TextInput style={inputStyle} value={slotForm.partyMax} onChangeText={(v) => setSlotForm((f) => ({ ...f, partyMax: v }))} keyboardType="number-pad" placeholderTextColor={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Capacity</Text>
                  <TextInput style={inputStyle} value={slotForm.capacity} onChangeText={(v) => setSlotForm((f) => ({ ...f, capacity: v }))} keyboardType="number-pad" placeholderTextColor={colors.mutedForeground} />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary, opacity: createSlotMutation.isPending ? 0.7 : 1 }]}
                onPress={handleAddSlot}
                disabled={createSlotMutation.isPending}
                activeOpacity={0.8}
              >
                {createSlotMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <><Feather name="plus" size={16} color="#fff" /><Text style={styles.addBtnText}>Add Slot</Text></>}
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={slotsLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: "center", marginTop: 20 }]}>No availability slots yet.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemPrimary, { color: colors.foreground }]}>{item.date} · {item.time}</Text>
                <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>Party {item.partyMin}–{item.partyMax} · {item.booked}/{item.capacity} booked</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteSlot(item.id)} hitSlop={10}>
                <Feather name="trash-2" size={17} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={blackouts}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={!!blackouts.length}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: bottomPad }}
          ListHeaderComponent={
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>Add Blackout Period</Text>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Start Date</Text>
                  <TextInput style={inputStyle} value={blackoutForm.startDate} onChangeText={(v) => setBlackoutForm((f) => ({ ...f, startDate: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>End Date</Text>
                  <TextInput style={inputStyle} value={blackoutForm.endDate} onChangeText={(v) => setBlackoutForm((f) => ({ ...f, endDate: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />
                </View>
              </View>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Reason (optional)</Text>
                <TextInput style={inputStyle} value={blackoutForm.reason} onChangeText={(v) => setBlackoutForm((f) => ({ ...f, reason: v }))} placeholder="Private event, renovation…" placeholderTextColor={colors.mutedForeground} />
              </View>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary, opacity: createBlackoutMutation.isPending ? 0.7 : 1 }]}
                onPress={handleAddBlackout}
                disabled={createBlackoutMutation.isPending}
                activeOpacity={0.8}
              >
                {createBlackoutMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <><Feather name="plus" size={16} color="#fff" /><Text style={styles.addBtnText}>Add Blackout</Text></>}
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={blackoutsLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: "center", marginTop: 20 }]}>No blackout periods.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemPrimary, { color: colors.foreground }]}>
                  {item.startDate === item.endDate ? item.startDate : `${item.startDate} → ${item.endDate}`}
                </Text>
                {item.reason ? <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{item.reason}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDeleteBlackout(item.id)} hitSlop={10}>
                <Feather name="trash-2" size={17} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 8, gap: 12 },
  formTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  formRow: { flexDirection: "row", gap: 10 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { height: 42, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 10 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  listItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  itemPrimary: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
