# Spontaneous

A mobile app that randomly picks restaurants and activities for you. Uses AI to generate hyper-specific, fun suggestions with reservation times, what to wear, and a full day plan. Freemium: 3 free picks, then $2.99/month.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed-products` — create Stripe products in Stripe sandbox
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: Clerk (`@clerk/expo` on mobile, `@clerk/express` on API server)
- Payments: Stripe ($2.99/month via Replit Stripe integration + `stripe-replit-sync`)
- AI: OpenAI gpt-5.1

## Where things live

- `lib/db/src/schema/` — DB schema (reviews, users)
- `artifacts/api-server/src/routes/` — Express routes (suggest, reviews, reservations, user, subscription, health)
- `artifacts/api-server/src/stripeClient.ts` — Stripe credentials via Replit connector
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk proxy (prod only)
- `artifacts/mobile/app/(tabs)/` — Main tabs: Discover, History, Preferences
- `artifacts/mobile/app/(auth)/` — Auth screens: sign-in, sign-up
- `artifacts/mobile/app/paywall.tsx` — Subscription paywall
- `artifacts/mobile/context/UsageContext.tsx` — Tracks free usage (AsyncStorage) + subscription status

## Architecture decisions

- **Client-side usage gate**: Free tier (3 picks) tracked in AsyncStorage — soft gate, acceptable for MVP
- **Server-side subscription verification**: Signed-in users checked against `stripe.subscriptions` table (synced by `stripe-replit-sync`)
- **Stripe sync**: `stripe-replit-sync` creates a `stripe.*` schema in Postgres and syncs Stripe events via webhook. Server calls `runMigrations` on startup.
- **Clerk Core v3 Expo API**: Uses signals-based API (`signIn.password()`, `signIn.finalize()`, `signUp.verifications.*`) — NOT the older `useSignIn` `setActive` pattern
- **No auth gate on tabs**: App works without login; auth is prompted only when free limit is hit or user visits paywall

## Product

- **Discover tab**: "Dinner Tonight" (restaurant pick) and "Plan My Day" (activity plan) — AI-generated with location, cuisine, and accessibility preferences
- **Paywall**: Shows after 3 free picks; sign-up + Stripe checkout for $2.99/month Pro subscription
- **History tab**: Favorites (heart toggle) and full history in segmented control
- **Preferences tab**: Dietary restrictions, accessibility needs, location radius, account section with subscription status
- **Restaurant/Activity screens**: Full AI-generated detail cards, reviews, spin-again, reservation reminder notifications

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Stripe schema tables (`stripe.*`) are created by `stripe-replit-sync` `runMigrations()` on server startup. If they're missing, restart the API server.
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is forwarded from `CLERK_PUBLISHABLE_KEY` in the mobile dev script — it is NOT a static env var.
- API server middleware order is critical: pinoHttp → Clerk proxy → Stripe webhook (raw body) → cors → json → clerkMiddleware → routes
- Do NOT use `setActive` or `isLoaded` from `useSignIn()`/`useSignUp()` — these don't exist in Clerk Core v3 Expo API

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/clerk-auth/references/custom-ui/expo-sdk-email-password.md` for Clerk Expo sign-in/sign-up patterns
