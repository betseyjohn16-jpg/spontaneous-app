import { Router, type IRouter } from "express";

const router: IRouter = Router();

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — Spontaneous</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0F0A1A;
      color: #E8E0F0;
      line-height: 1.7;
      padding: 40px 20px 80px;
    }
    .container { max-width: 740px; margin: 0 auto; }
    .logo {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #C9A84C;
      margin-bottom: 40px;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .meta {
      font-size: 13px;
      color: #7B6E8E;
      margin-bottom: 48px;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #FFFFFF;
      margin-top: 48px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #2A1F3D;
    }
    h3 {
      font-size: 15px;
      font-weight: 600;
      color: #C9A84C;
      margin-top: 24px;
      margin-bottom: 10px;
    }
    p { margin-bottom: 14px; color: #C8BFD8; font-size: 15px; }
    ul, ol { margin: 0 0 14px 20px; color: #C8BFD8; font-size: 15px; }
    li { margin-bottom: 6px; }
    a { color: #8B45D4; text-decoration: none; }
    a:hover { text-decoration: underline; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 24px;
      font-size: 14px;
    }
    th {
      background: #1C1232;
      color: #C9A84C;
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      border: 1px solid #2A1F3D;
    }
    td {
      padding: 10px 14px;
      border: 1px solid #2A1F3D;
      color: #C8BFD8;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #130D22; }
    strong { color: #E8E0F0; }
    hr { border: none; border-top: 1px solid #2A1F3D; margin: 40px 0; }
    .footer { font-size: 13px; color: #7B6E8E; margin-top: 48px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Spontaneous</div>
    <h1>Privacy Policy</h1>
    <p class="meta">Package: com.spontaneous.app &nbsp;·&nbsp; Last updated: June 23, 2026</p>

    <h2>1. Who We Are</h2>
    <p>Spontaneous ("we", "us", "our") is a mobile application that randomly picks restaurants and activities for you using AI. This policy explains what personal information we collect, why we collect it, and how we handle it.</p>

    <h2>2. Information We Collect</h2>

    <h3>2.1 Account Information</h3>
    <p>When you create an account we collect:</p>
    <ul>
      <li><strong>Email address</strong> — used to identify your account, send verification codes, and communicate with you about your subscription.</li>
      <li><strong>Password</strong> — stored as a secure hash by Clerk (our authentication provider). We never see your plaintext password.</li>
    </ul>
    <p>We use <strong>Clerk</strong> (clerk.com) for authentication. Clerk may independently collect device identifiers and session metadata as described in their own privacy policy.</p>

    <h3>2.2 Location Data</h3>
    <p>If you enable the "Use my location" preference, we collect your approximate GPS coordinates at the moment you request a suggestion. This data is sent to our server solely to generate a relevant recommendation, passed to the OpenAI API as part of the prompt, and <strong>not stored</strong> after your suggestion is returned. Location access is optional and can be disabled at any time in the Preferences tab or your device settings.</p>

    <h3>2.3 Preferences</h3>
    <p>We store the following preferences on-device and, when you are signed in, associate them with your account to personalise suggestions: dietary restrictions and allergies, accessibility needs, search radius, and location preference toggle.</p>

    <h3>2.4 Usage Data</h3>
    <p>We track how many free suggestions you have used (up to 3) using on-device storage (AsyncStorage). This count is never linked to your identity unless you create an account.</p>

    <h3>2.5 Payment Information</h3>
    <p>Subscriptions are processed by <strong>Stripe</strong> (stripe.com). We do not store your card number, CVV, or full payment details on our servers. Stripe provides us with subscription status and renewal dates only. Stripe's handling of your payment information is governed by their own privacy policy.</p>

    <h3>2.6 AI-Generated Content and Prompts</h3>
    <p>When you tap "Dinner Tonight" or "Plan My Day", we send your preferences and approximate coordinates (if location is enabled) to <strong>OpenAI</strong> (openai.com). No other personal identifiers are included. OpenAI's use of this data is governed by their API usage policy. We do not use your prompts to train AI models.</p>

    <h3>2.7 Reviews and History</h3>
    <p>If you submit a review, we store the review text, star rating, suggestion ID, and your user ID. Your suggestion history is stored on-device and, if signed in, associated with your account so it persists across devices.</p>

    <h3>2.8 Push Notifications</h3>
    <p>If you opt in to reservation reminders, we store a push notification token on our server linked to your account. We use this only to send the specific reminders you requested. You can withdraw consent at any time in your device notification settings.</p>

    <h3>2.9 Automatically Collected Data</h3>
    <p>Our server logs standard HTTP metadata for each request, including IP address, request path, timestamp, and response time. These logs are retained for up to 30 days for security and debugging purposes.</p>

    <h2>3. How We Use Your Information</h2>
    <table>
      <tr><th>Purpose</th><th>Data Used</th><th>Legal Basis</th></tr>
      <tr><td>Authenticate your account</td><td>Email, password hash</td><td>Contract performance</td></tr>
      <tr><td>Generate suggestions</td><td>Location, preferences</td><td>Contract performance</td></tr>
      <tr><td>Enforce the free tier limit</td><td>Usage count (on-device)</td><td>Legitimate interest</td></tr>
      <tr><td>Process subscription payments</td><td>Email, Stripe subscription data</td><td>Contract performance</td></tr>
      <tr><td>Send reservation reminders</td><td>Push token</td><td>Consent</td></tr>
      <tr><td>Debug and secure our service</td><td>Server logs, IP address</td><td>Legitimate interest</td></tr>
      <tr><td>Display history and favourites</td><td>Stored suggestions</td><td>Contract performance</td></tr>
    </table>
    <p>We do <strong>not</strong> sell your personal information to third parties. We do <strong>not</strong> use your data for advertising.</p>

    <h2>4. Data Sharing</h2>
    <table>
      <tr><th>Processor</th><th>Purpose</th><th>Data Shared</th></tr>
      <tr><td><strong>Clerk</strong> (clerk.com)</td><td>Authentication</td><td>Email, session tokens</td></tr>
      <tr><td><strong>Stripe</strong> (stripe.com)</td><td>Payment processing</td><td>Email, subscription events</td></tr>
      <tr><td><strong>OpenAI</strong> (openai.com)</td><td>AI suggestions</td><td>Preferences, coordinates</td></tr>
      <tr><td><strong>Replit</strong> (replit.com)</td><td>Hosting and infrastructure</td><td>All server traffic</td></tr>
    </table>

    <h2>5. Data Retention</h2>
    <table>
      <tr><th>Data</th><th>Retention Period</th></tr>
      <tr><td>Account data (email, auth)</td><td>Until you delete your account</td></tr>
      <tr><td>Suggestion history</td><td>Until you clear history or delete account</td></tr>
      <tr><td>Reviews</td><td>Until you delete the review or your account</td></tr>
      <tr><td>Payment records</td><td>As required by Stripe and financial regulations (typically 7 years)</td></tr>
      <tr><td>Server logs</td><td>30 days</td></tr>
      <tr><td>Push notification token</td><td>Until you revoke notification permission or delete your account</td></tr>
      <tr><td>On-device usage count</td><td>Until you uninstall the app or clear app data</td></tr>
    </table>

    <h2>6. Your Rights</h2>
    <p>Depending on where you live, you may have the right to access, correct, delete, restrict, or export your personal data, and to withdraw consent for push notifications at any time. To exercise any of these rights, email us at the address below. We will respond within 30 days.</p>

    <h2>7. Children's Privacy</h2>
    <p>Spontaneous is not directed at children under the age of 13 (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If you believe a child has provided us with their information, please contact us and we will delete it promptly.</p>

    <h2>8. International Data Transfers</h2>
    <p>Our servers and third-party processors are based in the United States. If you access the app from outside the US, your data will be transferred to and processed in the US. We rely on Standard Contractual Clauses and our processors' own compliance frameworks for cross-border transfers.</p>

    <h2>9. Security</h2>
    <p>We implement appropriate technical and organisational measures to protect your data, including HTTPS encryption in transit, secure credential storage via Clerk, and payment data handled exclusively by Stripe (PCI-DSS compliant). No method of transmission over the internet is 100% secure, but we take commercially reasonable steps to protect your information.</p>

    <h2>10. Changes to This Policy</h2>
    <p>We may update this policy from time to time. When we do, we will update the "Last updated" date at the top. For material changes, we will notify you via email or an in-app notice. Continued use of the app after changes take effect constitutes your acceptance of the revised policy.</p>

    <h2>11. Contact Us</h2>
    <p>If you have questions about this privacy policy or wish to exercise your rights, contact us at:<br/>
    <strong>Email:</strong> <a href="mailto:privacy@spontaneous.app">privacy@spontaneous.app</a></p>

    <div class="footer">
      <hr />
      &copy; 2026 Spontaneous &nbsp;·&nbsp; com.spontaneous.app
    </div>
  </div>
</body>
</html>`;

router.get("/privacy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HTML);
});

export default router;
