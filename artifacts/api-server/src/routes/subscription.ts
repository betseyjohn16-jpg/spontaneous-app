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
    res.json({ subscribed: false, status: null, interval: null });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
      expand: ["data.items.data.price"],
    });

    if (subs.data.length > 0) {
      const sub = subs.data[0] as unknown as { status: string; items: { data: Array<{ id: string; price: { recurring?: { interval?: string } | null } | null }> } };
      const price = sub.items.data[0]?.price;
      const interval = (price?.recurring as { interval?: string } | null)?.interval ?? null;
      res.json({
        subscribed: true,
        status: sub.status,
        interval,
      });
      return;
    }

    // Fall back to DB sync table for trialing
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
      res.json({ subscribed: true, status: row.status, interval: null, currentPeriodEnd: row.current_period_end });
    } else {
      res.json({ subscribed: false, status: null, interval: null });
    }
  } catch {
    res.json({ subscribed: false, status: null, interval: null });
  }
});

router.post("/stripe/create-checkout", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const plan: "monthly" | "annual" = req.body?.plan === "annual" ? "annual" : "monthly";
  const interval = plan === "annual" ? "year" : "month";

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) {
    res.status(404).json({ error: "User not found. Call /api/user/init first." });
    return;
  }

  const stripe = await getUncachableStripeClient();

  const prices = await stripe.prices.search({
    query: "product_name:'Spontaneous Pro' AND active:'true' AND type:'recurring'",
  });

  const price = prices.data.find((p) => p.recurring?.interval === interval);
  if (!price) {
    res.status(500).json({ error: `${plan} price not found. Run seed-products script first.` });
    return;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : "http://localhost:8080";

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId ?? undefined,
    customer_email: !user.stripeCustomerId ? (user.email ?? undefined) : undefined,
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${baseUrl}/api/stripe/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/api/stripe/checkout-cancel`,
    metadata: { clerkUserId: userId, plan },
  });

  res.json({ url: session.url });
});

router.post("/stripe/upgrade-to-annual", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user?.stripeCustomerId) {
    res.status(404).json({ error: "No subscription found" });
    return;
  }

  const stripe = await getUncachableStripeClient();

  const subs = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 1,
    expand: ["data.items.data.price"],
  });

  if (!subs.data.length) {
    res.status(404).json({ error: "No active subscription found" });
    return;
  }

  const sub = subs.data[0];
  const currentInterval = (sub.items.data[0]?.price?.recurring as { interval?: string } | null)?.interval;
  if (currentInterval === "year") {
    res.status(400).json({ error: "Already on annual plan" });
    return;
  }

  const prices = await stripe.prices.search({
    query: "product_name:'Spontaneous Pro' AND active:'true' AND type:'recurring'",
  });
  const annualPrice = prices.data.find((p) => p.recurring?.interval === "year");
  if (!annualPrice) {
    res.status(500).json({ error: "Annual price not found. Run seed-products first." });
    return;
  }

  const updatedSub = await stripe.subscriptions.update(sub.id, {
    items: [{ id: sub.items.data[0].id, price: annualPrice.id }],
    proration_behavior: "create_prorations",
    billing_cycle_anchor: "now",
  });

  res.json({ success: true, status: updatedSub.status, interval: "year" });
});

router.get("/stripe/checkout-success", async (_req, res) => {
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
