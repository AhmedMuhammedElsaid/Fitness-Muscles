# Fitness & Muscles — Coach Training App

A single-tenant React Native (Expo) fitness coaching application. One coach manages a roster of clients: creates exercises, builds workout plans, assigns them to clients, posts tips, and monitors progress. Clients execute workouts, log sets/reps/weight, and consume the coach's guidance.

**Status:** MVP complete. Phase 7 (cleanup). Ready for TestFlight + signed APK.

---

## Architecture

### Role-gated routing
- **Coach** (`/(coach)/` tabs): home, clients, library, workouts, plans, tips, profile
- **Client** (`/(client)/` tabs): home, training, tips, profile
- **Onboarding** (`/onboarding-form/` stack): 8-step flow (invite code → fitness preferences → profile completion)
- **Routing logic** (`RoleGate`): reads `profiles.role` + `client_intake.completed_at` to direct users

### Coach flow
1. Sign up / log in
2. Create exercises (with YouTube-hosted instructional videos)
3. Build reusable workouts (exercises with prescribed sets/reps/rest)
4. Compose multi-week plans (assign workouts to specific weeks + days)
5. Generate invite codes and assign plans to clients
6. Monitor live progress logs (coach dashboard shows recent workout completions)
7. Post tips (broadcast to all clients in real-time)

### Client flow
1. Sign up with invite code (redeems invite, marks it used)
2. Complete 8-step onboarding: basic info → body metrics → goals → health/nutrition → preferences
3. View assigned plan (current week) + today's workout
4. Execute workout: log sets/reps/weight per exercise, rest timer with haptic buzz, finish with effort + notes
5. See tips feed (coach's messages, newest-first)
6. Track profile, past assignments, body metrics

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | React Native 0.83 + Expo SDK 55 + React 19 |
| **Architecture** | New Architecture (Fabric + TurboModules + Bridgeless) |
| **Router** | Expo Router v5 (file-based) |
| **Server state** | TanStack Query v5 + TanStack DB collections |
| **Client state** | TanStack Store (NOT Zustand) |
| **Forms** | TanStack Form v1 + Zod (NOT react-hook-form) |
| **Styling** | NativeWind v4 + Tailwind 3.4 |
| **Animations** | Reanimated 4 (Fabric-only) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Video** | YouTube embeds (react-native-webview) — zero storage cost |
| **i18n** | i18next + expo-localization (English + Arabic RTL) |
| **Lists** | FlashList v2 (for >50 rows) |
| **Native APIs** | expo-haptics, expo-image-picker, expo-secure-store |

---

## Setup

### Prerequisites
- Node 18+
- EAS CLI (`npm install -g eas-cli`)
- Supabase CLI (`npm install -g supabase`)
- Docker (for local Supabase)

### Environment variables

Create `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_SENTRY_DSN=https://key@sentry.io/project  # optional
```

Create `.env.local` (local Supabase only):
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Install & run

```bash
npm install
npm start
```

### Local Supabase

```bash
supabase start
supabase db reset          # apply migrations
supabase test db           # pgTAP RLS suite (29/29)
```

---

## Seed the coach account

```bash
npx tsx scripts/seed-coach.ts <coach-email>
```

Example: `npx tsx scripts/seed-coach.ts coach@example.com`

This signs up the coach, sets `role = 'coach'`, and prints their credentials.

---

## Commands

```bash
npm start           # Expo dev server
npm run type-check  # TypeScript
npm run lint        # ESLint
npm test            # Jest
```

---

## Key files

- `app/_layout.tsx` — root routing, Reanimated (FIRST import), RoleGate
- `app/(coach)/` — coach interface (7 tabs)
- `app/(client)/` — client interface (5 tabs)
- `app/onboarding-form/` — 8-step invite-first onboarding
- `src/db/collections.ts` — TanStack DB + Realtime
- `src/db/mutations.ts` — optimistic mutations
- `src/db/intake-schemas.ts` — Zod schemas (onboarding steps)
- `src/stores/sessionStore.ts` — user/role/assignment status
- `src/stores/onboardingStore.ts` — onboarding draft (SecureStore-backed)
- `src/lib/planDay.ts` — date-arithmetic helpers
- `supabase/migrations/` — schema + RLS + RPCs + storage

---

## Notes

- **RLS is the security boundary.** All queries respect row-level policies.
- **Optimistic mutations.** All mutations are optimistic; toast on rollback.
- **YouTube videos.** Exercise videos hosted on YouTube (unlisted). Zero storage cost.
- **Token refresh.** Queries call `getSession()` at call time, not module init.
- **Day-of-week = 0 (Sunday).** Matches JS `Date.getDay()`, not ISO 8601.

---

## Before ship

- [ ] `npm run type-check && npm run lint && npm test`
- [ ] `supabase db reset && supabase test db` (all pass)
- [ ] Coach can create exercises/workouts/plans, generate invites
- [ ] Client can redeem invite, complete onboarding, execute workout
- [ ] Rest timer buzzes, tips appear in real-time
- [ ] Language toggle works (English ↔ Arabic + RTL)
- [ ] `npx expo export` succeeds (iOS + Android)

---

**Phase 7 (cleanup). MVP ready.**
