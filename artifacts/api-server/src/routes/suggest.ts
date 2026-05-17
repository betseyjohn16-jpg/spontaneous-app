import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  SuggestRestaurantBody,
  SuggestActivityBody,
} from "@workspace/api-zod";

const router = Router();

router.post("/suggest/restaurant", async (req, res) => {
  const body = SuggestRestaurantBody.parse(req.body ?? {});
  const cuisineHint = body.cuisine ? `Cuisine preference: ${body.cuisine}.` : "";
  const budgetHint = body.budget
    ? `Budget level: ${body.budget} (cheap=$, moderate=$$, expensive=$$$, luxury=$$$$).`
    : "";

  const prompt = `You are a creative concierge helping someone discover a restaurant for dinner tonight.
Generate a realistic, specific restaurant recommendation for a major US city (pick one randomly from: NYC, LA, Chicago, Miami, San Francisco, New Orleans, Austin, Seattle, Nashville, Boston).
${cuisineHint} ${budgetHint}
Return ONLY a valid JSON object with exactly these fields:
{
  "id": "rst_" + 8 random alphanumeric chars,
  "name": "creative restaurant name",
  "cuisine": "specific cuisine type",
  "description": "2-3 sentence evocative description of the restaurant",
  "address": "realistic street address",
  "neighborhood": "neighborhood name in that city",
  "attire": one of: "Casual" | "Smart Casual" | "Business Casual" | "Formal",
  "attireDescription": "specific clothing advice, e.g. Dark jeans and a blazer for men; a midi dress or tailored pants for women",
  "estimatedCostPerPerson": number (e.g. 45),
  "costRange": "$" | "$$" | "$$$" | "$$$$",
  "rating": number between 4.2 and 4.9 (one decimal),
  "ambiance": "brief evocative ambiance description",
  "specialtyDish": "the must-order dish with brief description",
  "reservationTime": "a time tonight e.g. 7:30 PM or 8:00 PM",
  "waitTime": "estimated walk-in wait e.g. 45-60 min or No walk-ins available"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: "You are a helpful concierge. Always respond with valid JSON only, no markdown, no extra text." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const suggestion = JSON.parse(content);

  res.json(suggestion);
});

router.post("/suggest/activity", async (req, res) => {
  const body = SuggestActivityBody.parse(req.body ?? {});
  const moodHint = body.mood ? `Mood/vibe preference: ${body.mood}.` : "";

  const prompt = `You are an enthusiastic local guide helping someone plan a spontaneous fun day.
Generate a creative, themed day plan for a major US city (pick one randomly from: NYC, LA, Chicago, Miami, San Francisco, New Orleans, Austin, Seattle, Nashville, Boston, Portland, Denver).
${moodHint}
Return ONLY a valid JSON object with exactly these fields:
{
  "id": "pln_" + 8 random alphanumeric chars,
  "theme": "a fun creative theme name e.g. Art & Bites Day, Adventure Seeker, Cultural Deep Dive",
  "tagline": "a punchy exciting one-liner for the day",
  "totalEstimatedCost": total cost number (sum of all events),
  "events": [array of 5-6 events, each with:
    {
      "time": "time of day e.g. 9:00 AM",
      "title": "activity name",
      "description": "1-2 sentence description of the activity",
      "location": "venue name and street address",
      "estimatedCost": cost number in dollars (0 for free activities),
      "duration": "how long e.g. 1.5 hours or 45 min",
      "category": one of: "Food" | "Culture" | "Nature" | "Shopping" | "Entertainment" | "Relaxation" | "Adventure"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1500,
    messages: [
      { role: "system", content: "You are a helpful local guide. Always respond with valid JSON only, no markdown, no extra text." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const plan = JSON.parse(content);

  res.json(plan);
});

export default router;
