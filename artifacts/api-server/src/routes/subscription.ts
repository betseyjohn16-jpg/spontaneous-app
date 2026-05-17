import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

router.get("/stripe/subscription-status", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];

  if (!user?.stripeCustomerId) {
    res.json({ subscribed: false, status: null });
    return;
  }

  try {
    const result = await db.execute(sql`
      SELECT status, current_period_end
      FROM stripe.subscriptions
      WHERE customer = ${user.stripeCustomerId}
        AND status IN ('active', 'trialing')
      ORDER BY created DESC
      LIMIT 1
    `);

    const row = result.rows?.[0] as { status: string; current_period_end: number } | undefined;
    if (row) {
      res.json({ subscribed: true, status: row.status, currentPeriodEnd: row.current_period_end });
    } else {
      // Check for past_due
      const pastDue = await db.execute(sql`
        SELECT status FROM stripe.subscriptions
        WHERE customer = ${user.stripeCustomerId}
        ORDER BY created DESC LIMIT 1
      `);
      const pdRow = pastDue.rows?.[0] as { status: string } | undefined;
      res.json({ subscribed: false, status: pdRow?.status ?? null });
    }
  } catch {
    res.json({ subscribed: false, status: null });
  }
});

router.post("/stripe/create-checkout", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) {
    res.status(404).json({ error: "User not found. Call /api/user/init first." });
    return;
  }

  const stripe = await getUncachableStripeClient();

  // Find the $2.99/month price
  const prices = await stripe.prices.search({
    query: "product_name:'Spontaneous Pro' AND active:'true' AND type:'recurring'",
  });

  if (!prices.data.length) {
    res.status(500).json({ error: "Subscription price not found. Run seed-products script first." });
    return;
  }

  const priceId = prices.data[0].id;
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : "http://localhost:8080";

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId ?? undefined,
    customer_email: !user.stripeCustomerId ? (user.email ?? undefined) : undefined,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/api/stripe/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/api/stripe/checkout-cancel`,
    metadata: { clerkUserId: userId },
  });

  res.json({ url: session.url });
});

router.get("/stripe/checkout-success", async (req, res) => {
  res.send(`
    <html><body style="background:#0F0A1A;color:#C9A84C;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px">
      <div style="font-size:48px">✓</div>
      <div style="font-size:24px;font-weight:bold">You're subscribed!</div>
      <div style="color:#888">Return to the Spontaneous app to continue.</div>
    </body></html>
  `);
});

router.get("/stripe/checkout-cancel", (_req, res) => {
  res.send(`
    <html><body style="background:#0F0A1A;color:#888;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px">
      <div style="font-size:24px">Cancelled</div>
      <div>Return to the Spontaneous app to try again.</div>
    </body></html>
  `);
});

export default router;
