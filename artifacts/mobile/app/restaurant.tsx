import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router, useLocalSearchParams, Stack } from "expo-router";
import {
  useMakeReservation,
  useSuggestRestaurant,
  useGetReviews,
  useCreateReview,
} from "@workspace/api-client-react";
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
import type { RestaurantSuggestion } from "@/context/HistoryContext";
import { usePreferences } from "@/context/PreferencesContext";
import { useFavorites } from "@/context/FavoritesContext";
import { shareText, formatRestaurantMessage } from "@/utils/share";
import { StarRating } from "@/components/StarRating";

function InfoChip({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[chipStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: { padding: 14, borderRadius: 14, borderWidth: 1, flex: 1, gap: 4 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8 },
  value: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

type ExtendedRestaurant = RestaurantSuggestion & {
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  accessibilityFeatures?: string[];
};

export default function RestaurantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string }>();
  const { preferences } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [restaurant, setRestaurant] = useState<ExtendedRestaurant>(
    JSON.parse(params.data ?? "{}")
  );
  const [partySize, setPartySize] = useState(2);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const { mutateAsync: makeReservation, isPending: reserving } = useMakeReservation();
  const { mutateAsync: suggestRestaurant, isPending: spinning } = useSuggestRestaurant();
  const { mutateAsync: submitReview, isPending: submittingReview } = useCreateReview();
  const { data: reviews, refetch: refetchReviews } = useGetReviews(
    { params: { restaurantId: restaurant.id } },
    { enabled: !!restaurant.id }
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const favorited = isFavorite(restaurant.id);

  const handleReserve = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const confirmation = await makeReservation({
        body: {
          restaurantName: restaurant.name,
          restaurantId: restaurant.id,
          partySize,
          reservationTime: restaurant.reservationTime,
        },
      });
      router.push({ pathname: "/reservation", params: { data: JSON.stringify(confirmation) } });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpinAgain = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let coords: { lat: number; lng: number } | null = null;
      if (preferences.useLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        }
      }
      const data = await suggestRestaurant({
        body: {
          allergies: preferences.allergies.length > 0 ? preferences.allergies : undefined,
          accessibility: preferences.accessibility.length > 0 ? preferences.accessibility : undefined,
          radiusMiles: preferences.radiusMiles,
          userLat: coords?.lat,
          userLng: coords?.lng,
        },
      });
      setRestaurant(data as ExtendedRestaurant);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewName.trim() || !reviewText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await submitReview({
        body: {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          userName: reviewName.trim(),
          rating: reviewRating,
          text: reviewText.trim(),
        },
      });
      setReviewName("");
      setReviewText("");
      setReviewRating(5);
      setShowReviewForm(false);
      refetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const attireColor =
    {
      Casual: colors.success,
      "Smart Casual": colors.gold,
      "Business Casual": colors.goldLight,
      Formal: colors.purple,
    }[restaurant.attire] ?? colors.mutedForeground;

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.navRight}>
            <View style={[styles.badge, { backgroundColor: colors.gold + "22" }]}>
              <Text style={[styles.badgeText, { color: colors.gold }]}>{restaurant.cuisine}</Text>
            </View>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.card }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleFavorite("restaurant", restaurant);
              }}
            >
              <Feather
                name="heart"
                size={18}
                color={favorited ? "#E74C3C" : colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.card }]}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await shareText(formatRestaurantMessage(restaurant), `Dinner at ${restaurant.name}`);
              }}
            >
              <Feather name="share-2" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 130 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{restaurant.name}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color={colors.gold} />
              <Text style={[styles.ratingText, { color: colors.gold }]}>
                {restaurant.rating?.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.location, { color: colors.mutedForeground }]}>
              {restaurant.neighborhood} · {restaurant.address}
            </Text>
          </View>

          {restaurant.distanceMiles !== undefined && (
            <View style={[styles.distanceBadge, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "44" }]}>
              <Feather name="navigation" size={12} color={colors.gold} />
              <Text style={[styles.distanceText, { color: colors.gold }]}>
                {restaurant.distanceMiles.toFixed(1)} miles from you
              </Text>
            </View>
          )}

          <Text style={[styles.description, { color: colors.foreground + "CC" }]}>
            {restaurant.description}
          </Text>

          <View style={styles.grid}>
            <InfoChip label="Attire" value={restaurant.attire} color={attireColor} colors={colors} />
            <InfoChip label="Est. Cost" value={`$${restaurant.estimatedCostPerPerson} pp`} color={colors.gold} colors={colors} />
          </View>
          <View style={styles.grid}>
            <InfoChip label="Time" value={restaurant.reservationTime} color={colors.purple} colors={colors} />
            <InfoChip label="Walk-in" value={restaurant.waitTime} color={colors.mutedForeground} colors={colors} />
          </View>

          <Section title="Dress Code" icon="user" iconColor={colors.gold} colors={colors}>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
              {restaurant.attireDescription}
            </Text>
          </Section>

          <Section title="Must Order" icon="award" iconColor={colors.gold} colors={colors}>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
              {restaurant.specialtyDish}
            </Text>
          </Section>

          <Section title="Ambiance" icon="moon" iconColor={colors.purple} colors={colors}>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
              {restaurant.ambiance}
            </Text>
          </Section>

          {restaurant.accessibilityFeatures && restaurant.accessibilityFeatures.length > 0 && (
            <Section title="Accessibility" icon="heart" iconColor={colors.purple} colors={colors} borderColor={colors.purple + "55"}>
              <View style={styles.chipRow}>
                {restaurant.accessibilityFeatures.map((feat) => (
                  <View key={feat} style={[styles.accessChip, { backgroundColor: colors.purple + "22", borderColor: colors.purple + "44" }]}>
                    <Feather name="check" size={10} color={colors.purple} />
                    <Text style={[styles.accessChipText, { color: colors.purple }]}>{feat}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          <View style={styles.partySizeRow}>
            <Text style={[styles.partySizeLabel, { color: colors.foreground }]}>Party Size</Text>
            <View style={styles.partySizeControls}>
              <Pressable
                style={[styles.sizeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { if (partySize > 1) { setPartySize((p) => p - 1); Haptics.selectionAsync(); } }}
              >
                <Feather name="minus" size={16} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.sizeNum, { color: colors.foreground }]}>{partySize}</Text>
              <Pressable
                style={[styles.sizeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { if (partySize < 10) { setPartySize((p) => p + 1); Haptics.selectionAsync(); } }}
              >
                <Feather name="plus" size={16} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsHeader}>
            <View style={styles.reviewsTitle}>
              <Feather name="message-square" size={16} color={colors.gold} />
              <Text style={[styles.reviewsTitleText, { color: colors.foreground }]}>
                Reviews {reviews && reviews.length > 0 ? `(${reviews.length})` : ""}
              </Text>
              {avgRating !== null && (
                <View style={styles.avgRating}>
                  <StarRating value={Math.round(avgRating)} size={13} color={colors.gold} emptyColor={colors.secondary} />
                  <Text style={[styles.avgRatingText, { color: colors.gold }]}>
                    {avgRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              style={[styles.writeReviewBtn, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}
              onPress={() => { Haptics.selectionAsync(); setShowReviewForm((v) => !v); }}
            >
              <Feather name={showReviewForm ? "x" : "edit-3"} size={13} color={colors.gold} />
              <Text style={[styles.writeReviewText, { color: colors.gold }]}>
                {showReviewForm ? "Cancel" : "Write a Review"}
              </Text>
            </Pressable>
          </View>

          {showReviewForm && (
            <View style={[styles.reviewForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Your Name</Text>
              <TextInput
                style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                value={reviewName}
                onChangeText={setReviewName}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Rating</Text>
              <StarRating value={reviewRating} onChange={setReviewRating} size={28} color={colors.gold} emptyColor={colors.secondary} />
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Review</Text>
              <TextInput
                style={[styles.formTextArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share your experience..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.gold, opacity: submittingReview ? 0.6 : 1 }]}
                onPress={handleSubmitReview}
                disabled={submittingReview || !reviewName.trim() || !reviewText.trim()}
              >
                {submittingReview ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={[styles.submitBtnText, { color: colors.background }]}>Submit Review</Text>
                )}
              </Pressable>
            </View>
          )}

          {reviews && reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map((review) => (
                <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.reviewTop}>
                    <View style={styles.reviewUser}>
                      <View style={[styles.reviewAvatar, { backgroundColor: colors.gold + "22" }]}>
                        <Text style={[styles.reviewAvatarText, { color: colors.gold }]}>
                          {review.userName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.reviewName, { color: colors.foreground }]}>{review.userName}</Text>
                        <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                          {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </Text>
                      </View>
                    </View>
                    <StarRating value={review.rating} size={13} color={colors.gold} emptyColor={colors.secondary} />
                  </View>
                  <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{review.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            !showReviewForm && (
              <View style={[styles.emptyReviews, { borderColor: colors.border }]}>
                <Feather name="message-circle" size={24} color={colors.mutedForeground} />
                <Text style={[styles.emptyReviewsText, { color: colors.mutedForeground }]}>
                  No reviews yet. Be the first!
                </Text>
              </View>
            )
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomPad + 24, backgroundColor: colors.background }]}>
          <Pressable
            style={[styles.reserveBtn, { backgroundColor: colors.gold, opacity: reserving ? 0.7 : 1 }]}
            onPress={handleReserve}
            disabled={reserving}
          >
            {reserving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Feather name="calendar" size={18} color={colors.background} />
                <Text style={[styles.reserveBtnText, { color: colors.background }]}>
                  Reserve for {restaurant.reservationTime}
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.spinAgainBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: spinning ? 0.7 : 1 }]}
            onPress={handleSpinAgain}
            disabled={spinning}
          >
            {spinning ? (
              <ActivityIndicator color={colors.mutedForeground} size="small" />
            ) : (
              <>
                <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
                <Text style={[styles.spinAgainText, { color: colors.mutedForeground }]}>Spin Again</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function Section({
  title,
  icon,
  iconColor,
  colors,
  borderColor,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  colors: ReturnType<typeof useColors>;
  borderColor?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: borderColor ?? colors.border }]}>
      <View style={styles.sectionHeader}>
        <Feather name={icon} size={16} color={iconColor} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  name: { fontSize: 30, fontFamily: "Inter_700Bold", flex: 1, lineHeight: 36 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 6 },
  ratingText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  location: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  distanceBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  distanceText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  description: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  grid: { flexDirection: "row", gap: 12 },
  section: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  accessChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  accessChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  partySizeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  partySizeLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  partySizeControls: { flexDirection: "row", alignItems: "center", gap: 20 },
  sizeBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sizeNum: { fontSize: 20, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "center" },
  reviewsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  reviewsTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewsTitleText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  avgRating: { flexDirection: "row", alignItems: "center", gap: 5 },
  avgRatingText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  writeReviewBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  writeReviewText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  reviewForm: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  formLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8 },
  formInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  formTextArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 90 },
  submitBtn: { padding: 14, borderRadius: 12, alignItems: "center" },
  submitBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  reviewsList: { gap: 12 },
  reviewCard: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  reviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewUser: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reviewAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  reviewName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  reviewText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  emptyReviews: { alignItems: "center", gap: 8, paddingVertical: 24, borderRadius: 14, borderWidth: 1, borderStyle: "dashed" },
  emptyReviewsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footer: { paddingHorizontal: 24, gap: 10 },
  reserveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 18, borderRadius: 18 },
  reserveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  spinAgainBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  spinAgainText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
