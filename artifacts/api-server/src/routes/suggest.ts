import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  SuggestRestaurantBody,
  SuggestActivityBody,
} from "@workspace/api-zod";

const router = Router();

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.post("/suggest/restaurant", async (req, res) => {
  const body = SuggestRestaurantBody.parse(req.body ?? {});
  const cuisineHint = body.cuisine ? `Cuisine preference: ${body.cuisine}.` : "";
  const budgetHint = body.budget
    ? `Budget level: ${body.budget} (cheap=$, moderate=$$, expensive=$$$, luxury=$$$$).`
    : "";
  const allergyHint =
    body.allergies && body.allergies.length > 0
      ? `DIETARY RESTRICTIONS — the restaurant MUST accommodate: ${body.allergies.join(", ")}. Menus and dishes must be compatible.`
      : "";
  const accessHint =
    body.accessibility && body.accessibility.length > 0
      ? `ACCESSIBILITY NEEDS — the restaurant MUST have ALL of these features: ${body.accessibility.join(", ")}.`
      : "";
  const locationHint =
    body.userLat !== undefined && body.userLng !== undefined
      ? `USER LOCATION: latitude ${body.userLat.toFixed(4)}, longitude ${body.userLng.toFixed(4)}. Suggest a restaurant within ${body.radiusMiles ?? 10} miles of this location. Generate realistic coordinates for the restaurant that are within this radius.`
      : `Pick a restaurant in a random major US city (NYC, LA, Chicago, Miami, San Francisco, New Orleans, Austin, Seattle, Nashville, Boston). Set a realistic lat/lng for the restaurant.`;

  const prompt = `You are a creative concierge helping someone discover a restaurant for dinner tonight.
${locationHint}
${cuisineHint} ${budgetHint}
${allergyHint}
${accessHint}
Return ONLY a valid JSON object with exactly these fields:
{
  "id": "rst_" + 8 random alphanumeric chars,
  "name": "creative restaurant name",
  "cuisine": "specific cuisine type",
  "description": "2-3 sentence evocative description of the restaurant",
  "address": "realistic street address",
  "neighborhood": "neighborhood name in that city",
  "attire": one of: "Casual" | "Smart Casual" | "Business Casual" | "Formal",
  "attireDescription": "specific clothing advice",
  "estimatedCostPerPerson": number (e.g. 45),
  "costRange": "$" | "$$" | "$$$" | "$$$$",
  "rating": number between 4.2 and 4.9 (one decimal),
  "ambiance": "brief evocative ambiance description",
  "specialtyDish": "the must-order dish with brief description",
  "reservationTime": "a time tonight e.g. 7:30 PM or 8:00 PM",
  "waitTime": "estimated walk-in wait e.g. 45-60 min or No walk-ins available",
  "latitude": realistic decimal latitude for the restaurant,
  "longitude": realistic decimal longitude for the restaurant,
  "accessibilityFeatures": array of accessibility features this restaurant has (from: "Wheelchair Accessible", "Elevator Access", "Accessible Restroom", "Hearing Loop", "Large Print Menu", "Service Animal Friendly", "Step-Free Entry")
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1200,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful concierge. Always respond with valid JSON only, no markdown, no extra text.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const suggestion = JSON.parse(content);

  if (body.userLat !== undefined && body.userLng !== undefined && suggestion.latitude && suggestion.longitude) {
    suggestion.distanceMiles = Math.round(haversineDistance(body.userLat, body.userLng, suggestion.latitude, suggestion.longitude) * 10) / 10;
  }

  res.json(suggestion);
});

router.post("/suggest/activity", async (req, res) => {
  const body = SuggestActivityBody.parse(req.body ?? {});
  const moodHint = body.mood ? `Mood/vibe preference: ${body.mood}.` : "";
  const allergyHint =
    body.allergies && body.allergies.length > 0
      ? `DIETARY RESTRICTIONS — any food-related activities MUST accommodate: ${body.allergies.join(", ")}.`
      : "";
  const accessHint =
    body.accessibility && body.accessibility.length > 0
      ? `ACCESSIBILITY NEEDS — ALL venues MUST be fully accessible for: ${body.accessibility.join(", ")}. Only include locations that are 100% accessible.`
      : "";
  const locationHint =
    body.userLat !== undefined && body.userLng !== undefined
      ? `USER LOCATION: latitude ${body.userLat.toFixed(4)}, longitude ${body.userLng.toFixed(4)}. All activities MUST be within ${body.radiusMiles ?? 15} miles of this location. Generate realistic coordinates for each event location within this radius.`
      : `Pick a major US city (NYC, LA, Chicago, Miami, San Francisco, New Orleans, Austin, Seattle, Nashville, Boston, Portland, Denver). Set realistic lat/lng for each event.`;

  const prompt = `You are an enthusiastic local guide helping someone plan a spontaneous fun day.
${locationHint}
${moodHint}
${allergyHint}
${accessHint}
Return ONLY a valid JSON object with exactly these fields:
{
  "id": "pln_" + 8 random alphanumeric chars,
  "theme": "a fun creative theme name",
  "tagline": "a punchy exciting one-liner for the day",
  "totalEstimatedCost": total cost number (sum of all events),
  "events": [array of 5-6 events, each with:
    {
      "time": "time of day e.g. 9:00 AM",
      "title": "activity name",
      "description": "1-2 sentence description",
      "location": "venue name and street address",
      "estimatedCost": cost number (0 for free activities),
      "duration": "how long e.g. 1.5 hours",
      "category": one of: "Food" | "Culture" | "Nature" | "Shopping" | "Entertainment" | "Relaxation" | "Adventure",
      "latitude": realistic decimal latitude for the venue,
      "longitude": realistic decimal longitude for the venue
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1800,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful local guide. Always respond with valid JSON only, no markdown, no extra text.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const plan = JSON.parse(content);

  if (body.userLat !== undefined && body.userLng !== undefined && plan.events) {
    plan.events = plan.events.map((evt: { latitude?: number; longitude?: number; [key: string]: unknown }) => {
      if (evt.latitude !== undefined && evt.longitude !== undefined) {
        return {
          ...evt,
          distanceMiles:
            Math.round(haversineDistance(body.userLat!, body.userLng!, evt.latitude, evt.longitude) * 10) / 10,
        };
      }
      return evt;
    });
    plan.totalEstimatedCost = plan.events.reduce((sum: number, evt: { estimatedCost?: number }) => sum + (evt.estimatedCost ?? 0), 0);
  }

  res.json(plan);
});

export default router;
