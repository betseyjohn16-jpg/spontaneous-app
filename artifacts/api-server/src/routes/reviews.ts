import { Router } from "express";
import { db, reviewsTable } from "@workspace/db";
import { insertReviewSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/reviews", async (req, res) => {
  const restaurantId = req.query.restaurantId as string;
  if (!restaurantId) {
    res.status(400).json({ error: "restaurantId is required" });
    return;
  }
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.restaurantId, restaurantId))
    .orderBy(reviewsTable.createdAt);
  res.json(reviews.reverse());
});

router.post("/reviews", async (req, res) => {
  const body = insertReviewSchema.parse(req.body);
  const [review] = await db.insert(reviewsTable).values(body).returning();
  res.status(201).json(review);
});

export default router;
