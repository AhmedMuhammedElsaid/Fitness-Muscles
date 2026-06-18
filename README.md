# Fitness & Muscles — Coach Training App

A single-tenant React Native (Expo) fitness coaching application. One coach manages a roster of clients: creates exercises, builds workout plans, assigns them to clients, posts tips, and monitors progress. Clients execute workouts, log sets/reps/weight, and consume the coach's guidance.

**Status:** MVP complete + two post-MVP overhauls merged (Client-UX revamp + Coach-UI overhaul). Gates green (type-check + lint + 51 tests). Ready for TestFlight + signed APK.

---

## Architecture

### Role-gated routing
- **Coach** (`/(coach)/` — 5 tabs): home, clients, **programs**, tips, profile. The **Programs** tab is a hub that merges Library / Workouts / Plans behind a segmented control.
- **Client** (`/(client)/` — 3 visible tabs): home, training, tips (+ profile). `meal-plan` and the `workout/[planDayId]` execution screen exist but are hidden from the tab bar (`href: null`); meal-plan is scaffolded for a future release.
- **Onboarding** (`/onboarding-form/` stack): 8-step flow (invite code → fitness preferences → profile completion).
- **Routing logic** (`RoleGate`): reads `profiles.role` + assignment status to direct users.

### Coach flow
1. Sign up / log in
2. Open **Programs** → **Library**: create exercises (with YouTube-hosted instructional videos), filter by muscle group / equipment
3. **Programs** → **Workouts**: build reusable workouts (exercises with prescribed sets/reps/rest), edit or delete them
4. **Programs** → **Plans**: compose multi-week plans on a week × day grid, then assign to clients
5. **Clients**: generate invite codes; see each client with avatar, name, plan badge, and adherence ring
6. **Home dashboard**: stat cards (active clients, plans, this-week completions), a weekly-completion chart, and recent activity with client avatars/names
7. **Tips**: post tips (broadcast to all clients in real-time); delete tips

### Client flow
1. Sign up with invite code (redeems invite, marks it used)
2. Complete 8-step onboarding: basic info → body metrics → goals → health/nutrition → preferences
3. **Home dashboard**: streak, plan-progress bar, weekly-volume chart, stat tiles, today's workout, condensed tips
4. **Training**: full week view; start today's workout or log retroactively
5. Execute workout: log sets/reps/weight per exercise, rest timer with haptic buzz, finish with effort + notes
6. **Tips** feed (coach's messages, newest-first)
7. **Profile**: name, avatar, language toggle, past assignments

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
| **Charts / icons** | react-native-svg + react-native-gifted-charts + @expo/vector-icons (Ionicons) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Video** | YouTube embeds (react-native-webview) — zero storage cost |
| **i18n** | i18next + expo-localization (English + Arabic RTL) |
| **Lists** | FlashList v2 (for >50 rows) |
| **Native APIs** | expo-haptics, expo-image-picker, expo-secure-store |

---

## Setup

### Prerequisites
- **Node ≥18** (an older system Node will fail ESLint/tsc — nvm is recommended; the git hooks auto-select a newer nvm Node if the active one is too old)
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
npm test            # Jest (51 tests)
```

---

## Key files

- `app/_layout.tsx` — root routing, Reanimated (FIRST import), RoleGate
- `app/(coach)/` — coach interface (5 tabs: home, clients, programs, tips, profile)
- `app/(coach)/programs.tsx` — Programs hub (segmented Library / Workouts / Plans)
- `src/features/programs/{Library,Workouts,Plans}View.tsx` — the three Programs sub-views
- `app/(client)/` — client interface (home, training, tips, profile + hidden meal-plan/workout)
- `app/onboarding-form/` — 8-step invite-first onboarding
- `src/components/ui/` — 18 design-system primitives (Button, Card, Avatar, Badge, SegmentedControl, IconButton, StatCard, ProgressRing, TrendChart, …)
- `src/db/collections.ts` — 11 TanStack DB collections + Realtime
- `src/db/mutations.ts` — optimistic mutations
- `src/db/intake-schemas.ts` — Zod schemas (onboarding steps)
- `src/stores/sessionStore.ts` — user/role/assignment status
- `src/stores/onboardingStore.ts` — onboarding draft (SecureStore-backed)
- `src/lib/planDay.ts` — date-arithmetic helpers
- `src/lib/progressStats.ts` — client-side stat derivations (streak, volume, adherence)
- `src/lib/coachStats.ts` — coach-side stat derivations (completions, adherence, last activity)
- `supabase/migrations/` — schema + RLS + RPCs + storage

---

## Notes

- **RLS is the security boundary.** All queries respect row-level policies.
- **Optimistic mutations.** All mutations are optimistic; toast on rollback.
- **YouTube videos.** Exercise videos hosted on YouTube (unlisted). Zero storage cost.
- **Token refresh.** Queries call `getSession()` at call time, not module init.
- **Day-of-week = 0 (Sunday).** Matches JS `Date.getDay()`, not ISO 8601.
- **Line endings.** Normalized to LF via `.gitattributes` (Windows/WSL friendly).

---

## Before ship

- [ ] `npm run type-check && npm run lint && npm test` (51 tests pass)
- [ ] `supabase db reset && supabase test db` (29/29 pass)
- [ ] Coach can create exercises/workouts/plans (Programs hub), generate invites
- [ ] Client can redeem invite, complete onboarding, execute workout
- [ ] Rest timer buzzes, tips appear in real-time
- [ ] Language toggle works (English ↔ Arabic + RTL)
- [ ] `npx expo export` succeeds (iOS + Android)

---

**MVP + Client-UX revamp + Coach-UI overhaul shipped.**
