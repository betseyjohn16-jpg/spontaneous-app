import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

router.post("/user/init", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const email: string | undefined = req.body?.email;

  const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (existing.length > 0) {
    res.json(existing[0]);
    return;
  }

  let stripeCustomerId: string | undefined;
  try {
    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkUserId: userId },
    });
    stripeCustomerId = customer.id;
  } catch {}

  const [user] = await db
    .insert(usersTable)
    .values({ id: userId, email, stripeCustomerId })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { email, stripeCustomerId },
    })
    .returning();

  res.json(user);
});

export default router;
