import { Share, Platform, Clipboard } from "react-native";

export interface RestaurantShareData {
  name: string;
  cuisine: string;
  neighborhood: string;
  address: string;
  attire: string;
  attireDescription: string;
  estimatedCostPerPerson: number;
  costRange: string;
  rating: number;
  ambiance: string;
  specialtyDish: string;
  reservationTime: string;
  distanceMiles?: number;
}

export interface ActivityShareData {
  theme: string;
  tagline: string;
  totalEstimatedCost: number;
  events: {
    time: string;
    title: string;
    location: string;
    estimatedCost: number;
    duration: string;
    category: string;
    distanceMiles?: number;
  }[];
}

export function formatRestaurantMessage(r: RestaurantShareData): string {
  const lines: string[] = [
    `🍽️ Dinner tonight at ${r.name}!`,
    `📍 ${r.neighborhood} — ${r.address}`,
    r.distanceMiles !== undefined ? `🧭 ${r.distanceMiles.toFixed(1)} miles away` : "",
    `🌟 ${r.rating.toFixed(1)} stars · ${r.cuisine}`,
    `✨ ${r.ambiance}`,
    ``,
    `👗 Dress Code: ${r.attire}`,
    `   ${r.attireDescription}`,
    ``,
    `💰 ~$${r.estimatedCostPerPerson} per person (${r.costRange})`,
    `🕒 Reservation at ${r.reservationTime}`,
    ``,
    `🥇 Must Order: ${r.specialtyDish}`,
    ``,
    `— Picked by Spontaneous 🎲`,
  ];

  return lines.filter((l, i) => l !== "" || (i > 0 && lines[i - 1] !== "")).join("\n");
}

export function formatActivityMessage(p: ActivityShareData): string {
  const eventLines = p.events
    .map((e) => {
      const cost = e.estimatedCost > 0 ? `$${e.estimatedCost}` : "Free";
      const dist = e.distanceMiles !== undefined ? ` · ${e.distanceMiles.toFixed(1)} mi` : "";
      return [
        `⏰ ${e.time} — ${e.title}`,
        `   📍 ${e.location}`,
        `   💰 ${cost} · ⏱ ${e.duration}${dist}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `📅 ${p.theme}`,
    `"${p.tagline}"`,
    ``,
    eventLines,
    ``,
    `💵 Total: ~$${p.totalEstimatedCost}`,
    ``,
    `— Planned by Spontaneous 🎲`,
  ].join("\n");
}

export async function shareText(message: string, title: string): Promise<void> {
  if (Platform.OS === "web") {
    if (navigator.share) {
      await navigator.share({ title, text: message });
    } else {
      Clipboard.setString(message);
    }
    return;
  }

  await Share.share(
    Platform.OS === "ios"
      ? { message }
      : { message, title },
    { dialogTitle: title }
  );
}
