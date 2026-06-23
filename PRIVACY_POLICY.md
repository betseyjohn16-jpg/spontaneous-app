# Privacy Policy

**App name:** Spontaneous  
**Package:** com.spontaneous.app  
**Last updated:** June 23, 2026

---

## 1. Who We Are

Spontaneous ("we", "us", "our") is a mobile application that randomly picks restaurants and activities for you using AI. This policy explains what personal information we collect, why we collect it, and how we handle it.

---

## 2. Information We Collect

### 2.1 Account Information
When you create an account we collect:
- **Email address** — used to identify your account, send verification codes, and communicate with you about your subscription.
- **Password** — stored as a secure hash by Clerk (our authentication provider). We never see your plaintext password.

We use **Clerk** (clerk.com) for authentication. Clerk may independently collect device identifiers and session metadata as described in their own privacy policy.

### 2.2 Location Data
If you enable the "Use my location" preference, we collect your approximate GPS coordinates at the moment you request a suggestion. This data is:
- Sent to our server solely to generate a relevant restaurant or activity recommendation.
- Passed to the OpenAI API as part of the prompt.
- **Not stored** after your suggestion is returned.

Location access is optional. You can disable it at any time in the Preferences tab or your device settings.

### 2.3 Preferences
We store the following preferences on-device (AsyncStorage) and, when you are signed in, associate them with your account to personalize suggestions:
- Dietary restrictions and allergies
- Accessibility needs
- Search radius (miles)
- Location preference toggle

### 2.4 Usage Data
We track how many free suggestions you have used (up to 3) using on-device storage (AsyncStorage). This count is never linked to your identity unless you create an account.

### 2.5 Payment Information
Subscriptions are processed by **Stripe** (stripe.com). We do not store your card number, CVV, or full payment details on our servers. Stripe provides us with:
- Subscription status (active / cancelled / past due)
- Subscription start and renewal dates

Stripe's handling of your payment information is governed by their own privacy policy.

### 2.6 AI-Generated Content and Prompts
When you tap "Dinner Tonight" or "Plan My Day", we send the following to **OpenAI** (openai.com) to generate your suggestion:
- Your preferences (allergies, accessibility, radius)
- Your approximate coordinates (if location is enabled)
- No other personal identifiers

OpenAI's use of this data is governed by their API usage policy. We do not use your prompts to train AI models.

### 2.7 Reviews and History
If you submit a review, we store:
- The text of your review
- A star rating
- The suggestion ID it belongs to
- Your user ID (to attribute the review to your account)

Your suggestion history (restaurants and activities you have seen) is stored on-device and, if signed in, associated with your account so it persists across devices.

### 2.8 Push Notifications
If you opt in to reservation reminders, we store a push notification token on our server linked to your account. We use this only to send you the specific reminders you requested. You can withdraw consent at any time in your device notification settings.

### 2.9 Automatically Collected Data
Our server logs standard HTTP metadata for each request, including:
- IP address
- Request path and HTTP method
- Timestamp and response time

These logs are retained for up to 30 days for security and debugging purposes and are then deleted.

---

## 3. How We Use Your Information

| Purpose | Data Used | Legal Basis |
|--------|-----------|-------------|
| Authenticate your account | Email, password hash | Contract performance |
| Generate restaurant / activity suggestions | Location, preferences | Contract performance |
| Enforce the free tier limit | Usage count (on-device) | Legitimate interest |
| Process subscription payments | Email, Stripe subscription data | Contract performance |
| Send reservation reminders | Push token | Consent |
| Debug and secure our service | Server logs, IP address | Legitimate interest |
| Display your history and favorites | Stored suggestions | Contract performance |

We do **not** sell your personal information to third parties. We do **not** use your data for advertising.

---

## 4. Data Sharing

We share data only with the following processors, and only to the extent necessary to operate the app:

| Processor | Purpose | Data Shared |
|-----------|---------|-------------|
| **Clerk** (clerk.com) | Authentication | Email, session tokens |
| **Stripe** (stripe.com) | Payment processing | Email, subscription events |
| **OpenAI** (openai.com) | AI suggestions | Preferences, coordinates |
| **Replit** (replit.com) | Hosting and infrastructure | All server traffic |

Each processor is contractually bound to handle your data in accordance with applicable privacy laws.

---

## 5. Data Retention

| Data | Retention Period |
|------|-----------------|
| Account data (email, auth) | Until you delete your account |
| Suggestion history | Until you clear history or delete account |
| Reviews | Until you delete the review or your account |
| Payment records | As required by Stripe and financial regulations (typically 7 years) |
| Server logs | 30 days |
| Push notification token | Until you revoke notification permission or delete your account |
| On-device usage count | Until you uninstall the app or clear app data |

---

## 6. Your Rights

Depending on where you live, you may have the right to:

- **Access** the personal data we hold about you.
- **Correct** inaccurate data.
- **Delete** your account and associated data.
- **Object** to or **restrict** certain processing.
- **Export** your data in a portable format.
- **Withdraw consent** for push notifications at any time.

To exercise any of these rights, email us at the address below. We will respond within 30 days.

---

## 7. Children's Privacy

Spontaneous is not directed at children under the age of 13 (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If you believe a child has provided us with their information, please contact us and we will delete it promptly.

---

## 8. International Data Transfers

Our servers and third-party processors are based in the United States. If you access the app from outside the US, your data will be transferred to and processed in the US. We rely on Standard Contractual Clauses and our processors' own compliance frameworks for cross-border transfers.

---

## 9. Security

We implement appropriate technical and organisational measures to protect your data, including:
- HTTPS encryption in transit for all API traffic
- Secure credential storage via Clerk (hashed passwords, token rotation)
- Payment data handled exclusively by Stripe (PCI-DSS compliant)
- Server access limited to authorised personnel

No method of transmission over the internet is 100% secure. We cannot guarantee absolute security but we take commercially reasonable steps to protect your information.

---

## 10. Third-Party Links

Suggestions may reference restaurants or venues whose websites we do not control. This policy does not cover third-party websites. We encourage you to review the privacy policies of any websites you visit.

---

## 11. Changes to This Policy

We may update this policy from time to time. When we do, we will update the "Last updated" date at the top of this document. For material changes, we will notify you via email or an in-app notice. Continued use of the app after changes take effect constitutes your acceptance of the revised policy.

---

## 12. Contact Us

If you have questions about this privacy policy or wish to exercise your rights, contact us at:

**Email:** privacy@spontaneous.app  
**App:** Spontaneous (com.spontaneous.app)
