import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useListRestaurantReservations,
  useAcceptReservation,
  useDeclineReservation,
  getListRestaurantReservationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

type StatusFilter = "all" | "pending" | "accepted" | "declined";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Declined", value: "declined" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#22c55e",
  declined: "#ef4444",
};

export default function PartnerReservations() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("all");

  const { data: reservations = [], isLoading } = useListRestaurantReservations(
    { status },
    { query: { queryKey: getListRestaurantReservationsQueryKey({ status }) } }
  );

  const acceptMutation = useAcceptReservation();
  const declineMutation = useDeclineReservation();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleAction = (id: number, action: "accept" | "decline") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mutation = action === "accept" ? acceptMutation : declineMutation;
    mutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRestaurantReservationsQueryKey({ status }) });
          queryClient.invalidateQueries({ queryKey: getListRestaurantReservationsQueryKey({ status: "all" }) });
        },
      }
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Reservations</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.filterTab,
              status === tab.value && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setStatus(tab.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: status === tab.value ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }}
          scrollEnabled={!!reservations.length}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="calendar" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No {status === "all" ? "" : status} reservations yet.
              </Text>
            </View>
          }
          renderItem={({ item: res }) => (
            <View style={[styles.resCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.resTop}>
                <Text style={[styles.resName, { color: colors.foreground }]}>{res.customerName}</Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: (STATUS_COLORS[res.status] ?? colors.mutedForeground) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: STATUS_COLORS[res.status] ?? colors.mutedForeground },
                    ]}
                  >
                    {res.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.resMeta, { color: colors.mutedForeground }]}>
                {res.date} · {res.time} · Party of {res.partySize}
              </Text>
              {res.customerEmail ? (
                <Text style={[styles.resMeta, { color: colors.mutedForeground }]}>{res.customerEmail}</Text>
              ) : null}
              {res.specialRequests ? (
                <Text style={[styles.specialReq, { color: colors.mutedForeground }]}>
                  "{res.specialRequests}"
                </Text>
              ) : null}
              <Text style={[styles.code, { color: colors.mutedForeground }]}>#{res.confirmationCode}</Text>

              {res.orderItems.length > 0 && (
                <View style={[styles.orderBox, { backgroundColor: colors.muted + "60", borderColor: colors.border }]}>
                  <Text style={[styles.orderTitle, { color: colors.mutedForeground }]}>
                    Pre-order · ${res.totalOrderAmount.toFixed(2)}
                  </Text>
                  {res.orderItems.map((item) => (
                    <Text key={item.id} style={[styles.orderItem, { color: colors.foreground }]}>
                      {item.quantity}× {item.menuItemName}
                    </Text>
                  ))}
                </View>
              )}

              {res.status === "pending" && (
                <View style={styles.resActions}>
                  <TouchableOpacity
                    style={[styles.actionBtnLarge, { backgroundColor: "#ef444415", borderColor: "#ef444430" }]}
                    onPress={() => handleAction(res.id, "decline")}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={16} color="#ef4444" />
                    <Text style={[styles.actionLabel, { color: "#ef4444" }]}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtnLarge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40", flex: 1 }]}
                    onPress={() => handleAction(res.id, "accept")}
                    activeOpacity={0.7}
                  >
                    <Feather name="check" size={16} color={colors.primary} />
                    <Text style={[styles.actionLabel, { color: colors.primary }]}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  resTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  resName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  resMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  specialReq: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 4,
  },
  code: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  orderBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    gap: 2,
  },
  orderTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderItem: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  resActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
