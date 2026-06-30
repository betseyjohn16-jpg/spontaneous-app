import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useListMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  getListMenuItemsQueryKey,
} from "@workspace/api-client-react";
import type { MenuItem, MenuItemInput, MenuItemUpdate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

const CATEGORIES = ["Appetizers", "Mains", "Sides", "Desserts", "Drinks", "Specials", "Other"];

type FormData = {
  name: string;
  description: string;
  price: string;
  category: string;
  dietaryTags: string;
  isAvailable: boolean;
};

function ItemFormModal({
  visible,
  initial,
  onClose,
  onSubmit,
  isPending,
}: {
  visible: boolean;
  initial?: Partial<FormData>;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    category: initial?.category ?? "Mains",
    dietaryTags: initial?.dietaryTags ?? "",
    isAvailable: initial?.isAvailable ?? true,
  });

  const set = (key: keyof FormData) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [key]: v }));

  const inputStyle = [styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 14 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {initial?.name ? "Edit Item" : "Add Item"}
          </Text>
          <TouchableOpacity
            onPress={() => onSubmit(form)}
            disabled={isPending || !form.name || !form.price}
            activeOpacity={0.7}
          >
            {isPending ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[styles.saveText, { color: colors.primary, opacity: !form.name || !form.price ? 0.4 : 1 }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name *</Text>
            <TextInput style={inputStyle} value={form.name} onChangeText={set("name")} placeholder="Grilled Salmon" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Price ($) *</Text>
            <TextInput style={inputStyle} value={form.price} onChangeText={set("price")} placeholder="18.99" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryChip, { borderColor: form.category === c ? colors.primary : colors.border, backgroundColor: form.category === c ? colors.primary + "18" : "transparent" }]}
                    onPress={() => set("category")(c)}
                  >
                    <Text style={[styles.categoryChipText, { color: form.category === c ? colors.primary : colors.foreground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description</Text>
            <TextInput style={inputStyle} value={form.description} onChangeText={set("description")} placeholder="Optional description" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Dietary Tags (comma-separated)</Text>
            <TextInput style={inputStyle} value={form.dietaryTags} onChangeText={set("dietaryTags")} placeholder="vegan, gluten-free" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>Available now</Text>
            <Switch
              value={form.isAvailable}
              onValueChange={set("isAvailable")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function PartnerMenu() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useListMenuItems();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });

  const handleSubmit = (form: FormData) => {
    const tags = form.dietaryTags.split(",").map((t) => t.trim()).filter(Boolean);
    const price = parseFloat(form.price);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (editing) {
      const update: MenuItemUpdate = { name: form.name, description: form.description || undefined, price, category: form.category, dietaryTags: tags, isAvailable: form.isAvailable };
      updateMutation.mutate({ id: editing.id, data: update }, {
        onSuccess: () => { setShowModal(false); setEditing(null); invalidate(); },
      });
    } else {
      const input: MenuItemInput = { name: form.name, description: form.description || undefined, price, category: form.category, dietaryTags: tags, isAvailable: form.isAvailable };
      createMutation.mutate({ data: input }, {
        onSuccess: () => { setShowModal(false); invalidate(); },
      });
    }
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert("Delete item?", `Remove "${item.name}" from the menu?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate({ id: item.id }, { onSuccess: invalidate });
        },
      },
    ]);
  };

  const handleToggle = (item: MenuItem) => {
    updateMutation.mutate({ id: item.id, data: { isAvailable: !item.isAvailable } }, { onSuccess: invalidate });
  };

  const byCategory = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category]!.push(item);
    return acc;
  }, {});

  const sections = Object.entries(byCategory);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Menu</Text>
        <TouchableOpacity onPress={() => { setEditing(null); setShowModal(true); }} hitSlop={8}>
          <Feather name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Feather name="coffee" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No menu items yet.</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => { setEditing(null); setShowModal(true); }} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([cat]) => cat}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: bottomPad }}
          renderItem={({ item: [category, catItems] }) => (
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.catTitle, { color: colors.mutedForeground }]}>{category}</Text>
              {catItems.map((item) => (
                <View key={item.id} style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.isAvailable ? 1 : 0.6 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                    {item.description ? <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text> : null}
                    {(item.dietaryTags ?? []).length > 0 && (
                      <View style={styles.tagRow}>
                        {(item.dietaryTags ?? []).map((tag) => (
                          <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={[styles.itemPrice, { color: colors.foreground }]}>${item.price.toFixed(2)}</Text>
                    <Switch
                      value={item.isAvailable}
                      onValueChange={() => handleToggle(item)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#fff"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <TouchableOpacity onPress={() => { setEditing(item); setShowModal(true); }} hitSlop={8}>
                      <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                      <Feather name="trash-2" size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}

      <ItemFormModal
        visible={showModal}
        initial={editing ? { name: editing.name, description: editing.description ?? "", price: String(editing.price), category: editing.category, dietaryTags: (editing.dietaryTags ?? []).join(", "), isAvailable: editing.isAvailable } : undefined}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  catTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginBottom: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  itemName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  itemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  input: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
