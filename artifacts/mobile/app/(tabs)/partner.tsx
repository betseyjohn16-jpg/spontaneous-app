import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useGetMyRestaurant,
  useGetRestaurantDashboard,
  useAcceptReservation,
  useDeclineReservation,
  getGetRestaurantDashboardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: color ?? colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.quickLink, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={[styles.quickLinkLabel, { color: colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function PartnerTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading: restaurantLoading, error } = useGetMyRestaurant();
  const { data: stats, isLoading: statsLoading, refetch } = useGetRestaurantDashboard({
    query: { queryKey: getGetRestaurantDashboardQueryKey(), enabled: !!restaurant },
  });

  const acceptMutation = useAcceptReservation();
  const declineMutation = useDeclineReservation();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const is404 = error && (error as any)?.status === 404;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = 80;

  if (restaurantLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="loader" size={28} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading…</Text>
      </View>
    );
  }

  if (is404 || !restaurant) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="briefcase" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Partner Portal</Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
          Register your restaurant to start accepting reservations from Spontaneous users.
        </Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/partner-register")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Register Restaurant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAction = (id: number, action: "accept" | "decline") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mutation = action === "accept" ? acceptMutation : declineMutation;
    mutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRestaurantDashboardQueryKey() });
        },
      }
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Partner Portal</Text>
          <Text style={[styles.restaurantName, { color: colors.foreground }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/partner-settings")}
          activeOpacity={0.7}
        >
          <Feather name="settings" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Active status */}
      <View style={[styles.statusRow, { marginHorizontal: 20 }]}>
        <View style={[styles.statusDot, { backgroundColor: restaurant.isActive ? "#22c55e" : "#ef4444" }]} />
        <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
          {restaurant.isActive ? "Active on Spontaneous" : "Hidden from users"}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Pending" value={stats?.pendingReservations ?? "—"} color={colors.primary} />
        <StatCard label="Today" value={stats?.todayReservations ?? "—"} color={colors.foreground} />
        <StatCard label="Menu Items" value={stats?.totalMenuItems ?? "—"} color={colors.foreground} />
      </View>

      {/* Quick links */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Manage</Text>
      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <QuickLink icon="clipboard" label="Reservations" onPress={() => router.push("/partner-reservations")} />
        <QuickLink icon="menu" label="Menu" onPress={() => router.push("/partner-menu")} />
        <QuickLink icon="clock" label="Availability" onPress={() => router.push("/partner-availability")} />
      </View>

      {/* Upcoming reservations */}
      {stats && stats.upcomingReservations.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
            Pending Requests
          </Text>
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {stats.upcomingReservations.slice(0, 5).map((res) => (
              <View
                key={res.id}
                style={[styles.resCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.resRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resName, { color: colors.foreground }]}>{res.customerName}</Text>
                    <Text style={[styles.resMeta, { color: colors.mutedForeground }]}>
                      {res.date} · {res.time} · Party of {res.partySize}
                    </Text>
                    <Text style={[styles.resCode, { color: colors.mutedForeground }]}>
                      #{res.confirmationCode}
                    </Text>
                  </View>
                  {res.status === "pending" && (
                    <View style={styles.resActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#ef444415" }]}
                        onPress={() => handleAction(res.id, "decline")}
                        activeOpacity={0.7}
                      >
                        <Feather name="x" size={16} color="#ef4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary + "20" }]}
                        onPress={() => handleAction(res.id, "accept")}
                        activeOpacity={0.7}
                      >
                        <Feather name="check" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {stats.upcomingReservations.length > 5 && (
              <TouchableOpacity onPress={() => router.push("/partner-reservations")} activeOpacity={0.7}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  See all {stats.upcomingReservations.length} pending →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 12,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  restaurantName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLinkLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  resCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  resRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  resMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  resCode: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  resActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    paddingVertical: 6,
  },
});
