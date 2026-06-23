import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";

const router = Router();

// ── Shared deletion logic ────────────────────────────────────────────────────
async function deleteUserData(clerkUserId: string): Promise<void> {
  // 1. Look up our users row to get stripeCustomerId
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, clerkUserId)).limit(1);
  const user = rows[0];

  // 2. Cancel + delete Stripe data (subscription + customer)
  if (user?.stripeCustomerId) {
    try {
      const stripe = await getUncachableStripeClient();
      // Cancel active subscriptions first
      const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active" });
      await Promise.all(subs.data.map((s) => stripe.subscriptions.cancel(s.id)));
      // Delete the customer record (cascades subscription data in Stripe)
      await stripe.customers.del(user.stripeCustomerId);
    } catch (err) {
      logger.warn({ err }, "Stripe cleanup partial failure — continuing with DB deletion");
    }
    // Delete from synced stripe.subscriptions table
    try {
      await db.execute(sql`DELETE FROM stripe.subscriptions WHERE customer = ${user.stripeCustomerId}`);
      await db.execute(sql`DELETE FROM stripe.customers WHERE id = ${user.stripeCustomerId}`);
    } catch (err) {
      logger.warn({ err }, "stripe.* table cleanup failed — continuing");
    }
  }

  // 3. Delete from our users table (email, stripeCustomerId)
  await db.delete(usersTable).where(eq(usersTable.id, clerkUserId));

  // 4. Delete from Clerk — removes email, phone, sessions, OAuth tokens, devices
  const res = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Clerk deletion failed: ${res.status} ${body}`);
  }
}

// ── Authenticated in-app endpoint ────────────────────────────────────────────
// DELETE /api/user/me  (called from the mobile app with a Clerk Bearer token)
router.delete("/user/me", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await deleteUserData(userId);
    res.json({ deleted: true });
  } catch (err) {
    logger.error({ err }, "Account deletion failed");
    res.status(500).json({ error: "Deletion failed. Please try again or contact support." });
  }
});

// ── Web-based self-service page ──────────────────────────────────────────────
const PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Delete Your Account — Spontaneous</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0F0A1A;
      color: #E8E0F0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #1C1232;
      border: 1px solid #2A1F3D;
      border-radius: 20px;
      padding: 40px 36px;
      max-width: 480px;
      width: 100%;
    }
    .logo { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin-bottom: 28px; }
    h1 { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 10px; }
    .subtitle { font-size: 14px; color: #9B8FB0; line-height: 1.6; margin-bottom: 28px; }
    .what-deleted { background: #130D22; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .what-deleted h3 { font-size: 12px; font-weight: 600; color: #C9A84C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .what-deleted ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .what-deleted li { font-size: 13px; color: #C8BFD8; display: flex; align-items: center; gap: 8px; }
    .what-deleted li::before { content: "✓"; color: #8B45D4; font-weight: 700; }
    .warning { background: #2D0F0F; border: 1px solid #5C1F1F; border-radius: 10px; padding: 12px 14px; margin-bottom: 24px; font-size: 13px; color: #F08080; line-height: 1.5; }
    label { display: block; font-size: 13px; font-weight: 500; color: #9B8FB0; margin-bottom: 6px; }
    input {
      width: 100%;
      background: #0F0A1A;
      border: 1px solid #2A1F3D;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      color: #E8E0F0;
      margin-bottom: 16px;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus { border-color: #8B45D4; }
    input::placeholder { color: #5A4F6A; }
    button {
      width: 100%;
      background: #7B1C1C;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 15px;
      font-weight: 600;
      color: #FFB3B3;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
    }
    button:hover { background: #9B2222; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    .success { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .success .icon { font-size: 48px; }
    .success h2 { font-size: 22px; font-weight: 700; color: #fff; }
    .success p { font-size: 14px; color: #9B8FB0; line-height: 1.6; }
    .error-msg { background: #2D0F0F; border: 1px solid #5C1F1F; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #F08080; margin-bottom: 14px; display: none; }
  </style>
</head>
<body>
  <div class="card" id="formCard">
    <div class="logo">Spontaneous</div>
    <h1>Delete Your Account</h1>
    <p class="subtitle">This permanently removes your account and all personal data from our systems. This action cannot be undone.</p>

    <div class="what-deleted">
      <h3>What gets deleted</h3>
      <ul>
        <li>Email address and password</li>
        <li>Phone numbers linked to your account</li>
        <li>Active subscription and billing records</li>
        <li>Suggestion history and saved favourites</li>
        <li>All account data from our servers</li>
      </ul>
    </div>

    <div class="warning">
      ⚠ Your on-device data (preferences, local history) will be cleared the next time you open the app after deletion.
    </div>

    <div id="errorMsg" class="error-msg"></div>

    <label for="email">Your account email</label>
    <input type="email" id="email" placeholder="you@example.com" autocomplete="email" />

    <label for="confirm">Type DELETE to confirm</label>
    <input type="text" id="confirm" placeholder="DELETE" autocomplete="off" />

    <button id="deleteBtn" disabled onclick="submitDeletion()">Delete My Account</button>
  </div>

  <div class="card success" id="successCard" style="display:none">
    <div class="icon">✓</div>
    <h2>Account deleted</h2>
    <p>Your account and all associated personal data have been permanently removed from our systems.<br/><br/>Thank you for using Spontaneous.</p>
  </div>

  <script>
    const emailEl = document.getElementById('email');
    const confirmEl = document.getElementById('confirm');
    const btn = document.getElementById('deleteBtn');
    const errorEl = document.getElementById('errorMsg');

    function validate() {
      const ok = emailEl.value.includes('@') && confirmEl.value === 'DELETE';
      btn.disabled = !ok;
    }
    emailEl.addEventListener('input', validate);
    confirmEl.addEventListener('input', validate);

    async function submitDeletion() {
      btn.disabled = true;
      btn.textContent = 'Deleting…';
      errorEl.style.display = 'none';
      try {
        const res = await fetch('/api/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailEl.value }),
        });
        const data = await res.json();
        if (res.ok && data.deleted) {
          document.getElementById('formCard').style.display = 'none';
          document.getElementById('successCard').style.display = 'flex';
        } else {
          errorEl.textContent = data.error || 'Something went wrong. Please try again.';
          errorEl.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Delete My Account';
        }
      } catch {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Delete My Account';
      }
    }
  </script>
</body>
</html>`;

// GET /api/delete-account — serve the self-service form
router.get("/delete-account", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(PAGE_HTML);
});

// POST /api/delete-account — process web-based deletion by email
router.post("/delete-account", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }

  try {
    // Look up Clerk user by email
    const lookupRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}&limit=1`,
      { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } },
    );
    const users = await lookupRes.json() as Array<{ id: string }>;

    if (!Array.isArray(users) || users.length === 0) {
      // Return generic success to avoid email enumeration
      res.json({ deleted: true });
      return;
    }

    await deleteUserData(users[0].id);
    res.json({ deleted: true });
  } catch (err) {
    logger.error({ err }, "Web account deletion failed");
    res.status(500).json({ error: "Deletion failed. Please contact privacy@spontaneous.app." });
  }
});

export default router;
