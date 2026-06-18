# APP_CONTEXT — Living Architecture Snapshot

**Status:** MVP Complete (Phase 7 ✅). Ready for TestFlight + signed APK. **Post-MVP (2026-06-13): Client-UX revamp** — Ionicons nav, Home dashboard with charts/stats, animated primitives, `progressStats` lib. See the "(Client-UX revamp)" notes in §1, §4, §10, §13. Gates green (type-check + lint + 38 tests); full Metro bundle exports clean. Not yet visually run on a device.

**Project:** Fitness & Muscles — single-coach roster training app (React Native / Expo SDK 55 + Supabase). See [`CLAUDE.md`](./CLAUDE.md) for the elevator pitch and tech stack; [`plan.md`](./plan.md) for the 7-phase build plan; [`README.md`](./stride-fitness-app/README.md) for setup and deployment.

This file is the **single source of truth for the current shape of the codebase**. Every phase agent reads it FIRST (before re-exploring) and updates the relevant sections at its stop point. Keeping this current is the cheapest token-saver in the project — stale context forces re-exploration that burns thousands of tokens per phase.

**Companion documents:**
- [`plan.md`](./plan.md) — the 7-phase build plan, model assignments, stop points, verification checklist. Open for phase-level questions or schema specifics.
- [`CLAUDE.md`](./CLAUDE.md) — project conventions, non-negotiables, common pitfalls, token-discipline rules. Open before writing any code.

**Status legend** for each section below:
- `[empty]` — skeleton placeholder, not yet filled
- `[stub]` — partial; will be expanded by a later phase
- `[live]` — current and accurate as of the noted phase / commit

---

## §1 File map
**Owned by:** Phase 0 (skeleton) → updated at every stop point as new top-level files/dirs appear.
**Status:** `[live]` _(Phase 0 — Opus, 2026-06-04)_

> **Structural note:** the git repo + app live in the `stride-fitness-app/` subfolder; these docs (`CLAUDE.md`, `plan.md`, `APP_CONTEXT.md`) sit one level up in `Fitness&Muscles/`. Paths below are relative to `stride-fitness-app/`.

- `app/` — Expo Router screens. `_layout.tsx` **(Phase 3)** (root: Reanimated-first import, RTL force, Sentry.wrap, providers, `<RoleGate>` routing hook), `index.tsx` (loading splash — `<RoleGate>` handles all redirects), `role-select.tsx` (unused post-Phase 3; remove in Phase 7), `auth/` (login ✅, signup ✅, forgot-password scaffold), `onboarding-form/` (8 steps + request-sent — scaffolded; wired in Phase 6), `(client)/` (home, training, chat, profile ✅, meal-plan), `(coach)/` **(Phase 3)** (home scaffold — Phase 4 fills tabs).
- `src/components/ui/` — design-system primitives (Button, Card, TextInput, ChipSelector, ProgressBar, StepIndicator, ToggleOption). **(Client-UX revamp)** added: `Icon` (Ionicons wrapper, RTL-flip aware), `StatCard`, `ProgressRing` (svg + Reanimated animated ring), `TrendChart` (gifted-charts bar wrapper, RTL-aware + empty state), `SectionHeader`, `EmptyState`, `StreakBadge`. `ProgressBar` now animates its fill via Reanimated.
- `src/config/` — `env.ts`, `supabase.ts` (SecureStore-backed client), `queryClient.ts`, `api.ts` (fetch wrapper, token-attaching; axios removed).
- `src/stores/` — `sessionStore.ts` **(Phase 2/3)** — `{ session, profile, role, hasActiveAssignment, isLoading }` TanStack Store + `initSession()` + `refreshAssignmentStatus()`. `authStore.ts` **DELETED (Phase 3)**. `onboardingStore.ts` — still present, rewritten in Phase 6.
- `src/providers/` — **(Phase 3)** `SessionProvider.tsx` — calls `initSession()` once, starts/stops `subscribeRealtime()` based on session state.
- `src/db/` — **(Phase 2)** `collections.ts` (10 TanStack DB collections + `subscribeRealtime()`), `mutations.ts` (optimistic mutations), `index.ts` (barrel + `useLiveQuery` re-export), `__tests__/collections.test.ts`.
- `src/api/` — **(Phase 2)** TanStack Query hooks for non-collection ops: `useGenerateInvite`, `useUploadAvatar`, `index.ts`.
- `src/lib/` — `i18n.ts`, `formError.ts`, **(Phase 2)** `youtube.ts`, `uuid.ts`, `pacer.ts`, `list.ts`, `__tests__/youtube.test.ts`. **(Phase 5)** `planDay.ts` (date-arithmetic helpers: `getTodaysPlanDay`, `isTodayInPlanRange`, `getWeekPlanDays`, `currentWeekNumber`, `planDayToDate`, `isPlanDayPast`, `isPlanDayToday`). **(Client-UX revamp)** `progressStats.ts` (+ `progressStats.test.ts`, 21 tests) — pure stat derivations from `progress_logs`/`set_logs`: `currentStreak`, `weekVolume`, `avgEffort`, `workoutsCompleted`, `planProgressPct`, `weeklyVolumeSeries`. All take explicit `now`/`weekStart`/`sinceDate` for deterministic tests; reuses `currentWeekNumber`.
- `src/components/` — **(Phase 2)** `ErrorBoundary.tsx` (Sentry-logging top-level boundary), `feedback/Toast.tsx` (`burnt` wrapper: `toast.success/error/info(i18nKey)`).
- `src/config/__mocks__/supabase.ts` — **(Phase 2)** configurable jest manual mock (state on `globalThis`).
- `src/locales/` — `en.json` / `ar.json` (both `{}` so far; parity mandatory).
- `src/theme/tokens.ts` — design tokens. `src/global.css` — NativeWind entry.
- `__tests__/smoke.test.ts` — Jest smoke placeholder. Config: `jest.config.js` (`jest-expo` preset), `babel.config.js`, `metro.config.js` (NativeWind), `tailwind.config.js`.
- `supabase/` — **(Phase 1)** `config.toml`, `migrations/` (`0001_init.sql` schema+RLS, `0002_storage.sql`, `0003_rpc.sql`), `tests/rls_test.sql` (pgTAP).
- `scripts/` — **(Phase 1)** `seed-coach.ts` (promote coach via service-role key).
- `src/types/` — **(Phase 1)** `db.ts` (generated from local DB via `supabase gen types`).
- Not yet created (later phases): `app/(coach)/`, `e2e/`, `src/db/`.

---

## §2 Run commands
**Owned by:** Phase 0.
**Status:** `[live]` _(Phase 0 — Opus, 2026-06-04)_

Standard scripts (run from `stride-fitness-app/`): `npm start` (Expo dev server), `npm run type-check`, `npm run lint`, `npm test`.

> ⚠️ **`&` in the path breaks npm `.bin` shims.** The directory `Fitness&Muscles` contains `&`, which Windows `cmd` splits, so `npm run <script>` and `npx <tool>` fail with `Cannot find module`. Workaround until the folder is renamed: invoke tools through node directly, e.g. `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/eslint/bin/eslint.js src/ app/`, `node node_modules/jest/bin/jest.js`, `node node_modules/expo/bin/cli start`. See §13.

**Supabase (local, needs Docker running; invoke as `npx supabase …`):** `npx supabase start` (boot stack) · `npx supabase db reset` (re-apply migrations) · `npx supabase test db` (pgTAP RLS suite) · `npx supabase gen types typescript --local > src/types/db.ts` (regenerate types) · `npx supabase stop`. Coach seed: `npx tsx scripts/seed-coach.ts <coach-email>`.

**Deployment (EAS):** see [`deploy.md`](./deploy.md) — step-by-step for development / preview / production builds (iOS + Android) via EAS Build, store submission, and EAS Update. **Configured:** `eas.json` (3 profiles: development / preview / production) + `extra.eas.projectId` in `app.json` exist. A **preview Android APK** has built green (`eas build -p android --profile preview`). Run `eas` via the global install (`/c/temp/npm-packages/eas`) — it's a self-contained shim, so the `&` path doesn't affect it (only project-local npm/npx shims break). **Still pending:** `expo-updates` not installed (the declared `channel`s are inert until it is), store-submit credentials in `eas.json submit` are placeholders.

_Later phases add: Maestro E2E._

---

## §3 Routes
**Owned by:** Phase 3 (initial map); refined in Phases 4, 5, 6.
**Status:** `[live]` _(Phase 3 — Sonnet 4.6, 2026-06-04)_

Expo Router file-based. Root `app/_layout.tsx` mounts all providers + `<RoleGate>` (routing logic). Auth group uses a plain `auth/` folder (not `(auth)/`) — canonical paths are:

**Auth group** (`app/auth/` — Stack)
| Route | File | Status |
|---|---|---|
| `/auth/login` | `app/auth/login.tsx` | `[final]` |
| `/auth/signup` | `app/auth/signup.tsx` | `[final]` |
| `/auth/forgot-password` | `app/auth/forgot-password.tsx` | `[scaffolded]` |

**Coach group** (`app/(coach)/` — 7-tab Tabs navigator)
| Route | File | Status |
|---|---|---|
| `/(coach)/home` | `app/(coach)/home.tsx` | `[final]` — dashboard (active client count, recent logs) |
| `/(coach)/clients` | `app/(coach)/clients.tsx` | `[final]` — client list + invite code modal + detail modal |
| `/(coach)/library` | `app/(coach)/library.tsx` | `[final]` — exercise CRUD + YouTube WebView |
| `/(coach)/workouts` | `app/(coach)/workouts.tsx` | `[final]` — workout builder with TanStack Form field arrays |
| `/(coach)/plans` | `app/(coach)/plans.tsx` | `[final]` — plan grid editor + assign modal |
| `/(coach)/tips` | `app/(coach)/tips.tsx` | `[final]` — tips feed (FlashList) + composer |
| `/(coach)/profile` | `app/(coach)/profile.tsx` | `[final]` — name/avatar/language/sign-out |

**Client group** (`app/(client)/` — Tabs)
| Route | File | Status |
|---|---|---|
| `/(client)/home` | `app/(client)/home.tsx` | `[final]` — today's workout card + latest 3 tips + resume-workout banner |
| `/(client)/training` | `app/(client)/training.tsx` | `[final]` — full week view with Start/Log-retroactively buttons |
| `/(client)/workout/[planDayId]` | `app/(client)/workout/[planDayId].tsx` | `[final]` — workout execution: sets/reps/weight inputs, rest timer, finish sheet |
| `/(client)/chat` | `app/(client)/chat.tsx` | `[final]` — tips feed (FlashList, newest-first, read-only) |
| `/(client)/meal-plan` | `app/(client)/meal-plan.tsx` | `[scaffolded]` (hidden via `href: null`) |
| `/(client)/profile` | `app/(client)/profile.tsx` | `[final]` — name/avatar/language/assignment-history/sign-out |

**Workout store** (`app/(client)/workout/_store.ts`):
- TanStack Store: `{ activePlanDayId, assignmentId, startedAt, sets }` — persists in-memory across nav; cleared on finish/discard.
- `startWorkout(planDayId, assignmentId)` — call on screen mount if not already active.
- `upsertSet(exerciseId, SetLog)` / `addSet(exerciseId)` — optimistic set tracking.

**Onboarding** (`app/onboarding-form/` — Stack, 8 steps)
| Step | Route | File | Status |
|---|---|---|---|
| 1 | `/onboarding-form/trainer-code` | `app/onboarding-form/trainer-code.tsx` | `[final]` — calls `redeemInvite` RPC; inline error on 22023/23505 |
| 2 | `/onboarding-form/basic-info` | `app/onboarding-form/basic-info.tsx` | `[final]` — TanStack Form + Zod; persists to store+SecureStore |
| 3 | `/onboarding-form/body-metrics` | `app/onboarding-form/body-metrics.tsx` | `[final]` — height/weight/target in cm/kg |
| 4 | `/onboarding-form/fitness-goals` | `app/onboarding-form/fitness-goals.tsx` | `[final]` — ChipSelector for goal + workout types |
| 5 | `/onboarding-form/health-restrictions` | `app/onboarding-form/health-restrictions.tsx` | `[final]` — toggle+detail fields |
| 6 | `/onboarding-form/nutrition` | `app/onboarding-form/nutrition.tsx` | `[final]` — dietary preference ChipSelector |
| 7 | `/onboarding-form/workout-preferences` | `app/onboarding-form/workout-preferences.tsx` | `[final]` — preferred days + time of day |
| 8 | `/onboarding-form/request-sent` | `app/onboarding-form/request-sent.tsx` | `[final]` — writes `client_intake`, updates `full_name`, `refreshAssignmentStatus`, redirect |

`choose-trainer.tsx` — **deleted** (single-tenant; no trainer discovery).

**Onboarding store** (`src/stores/onboardingStore.ts`):
- Rewritten for Phase 6: TanStack Store + `expo-secure-store` persistence (`'onboarding_draft'` key).
- `hydrateOnboardingStore()` — call once on app mount (root `_layout.tsx`); restores draft from SecureStore.
- `patchDraft(patch)` — merges patch into draft and persists to SecureStore.
- `clearOnboardingDraft()` — clears store + SecureStore after successful submission.
- Draft shape: `{ trainerCodeRedeemed, basicInfo, bodyMetrics, fitnessGoals, healthRestrictions, nutritionPrefs, workoutPrefs }`.

**Intake schemas** (`src/db/intake-schemas.ts`):
- One Zod schema per step: `basicInfoSchema`, `bodyMetricsSchema`, `fitnessGoalsSchema`, `healthRestrictionsSchema`, `nutritionSchema`, `workoutPrefsSchema`.
- Shared by form validation and the final `client_intake` upsert — drift is impossible by construction.
| `/onboarding-form/request-sent` | `app/onboarding-form/request-sent.tsx` | `[scaffolded]` → Phase 6 |

**Routing logic** (`app/_layout.tsx` → `<RoleGate>`):
- `isLoading=true` → stay on `/` (loading splash); hide SplashScreen on first false
- no session → `/auth/login`
- `role=coach` → `/(coach)/home`
- `role=client` + `hasActiveAssignment=null` → wait (loading assignment status)
- `role=client` + `hasActiveAssignment=true` → `/(client)/home`
- `role=client` + `hasActiveAssignment=false` → `/onboarding-form/trainer-code`
- Sign-out → `onAuthStateChange(SIGNED_OUT)` → clears store → `RoleGate` redirects to `/auth/login`

---

## §4 Screens
**Owned by:** Phases 4 (coach), 5 (client), 6 (onboarding).
**Status:** `[stub]` _(Phase 4 — Sonnet 4.6, 2026-06-04; client + onboarding owed by Phases 5/6)_

**Coach screens** (all in `app/(coach)/`):

| Screen | Collections read | Mutations fired | i18n prefix |
|---|---|---|---|
| `home.tsx` | `coachClientsCollection`, `plansCollection`, `progressLogsCollection` | — | `coach.home.*` |
| `clients.tsx` | `coachClientsCollection`, `planAssignmentsCollection` | `removeClient`, `useGenerateInvite` | `coach.clients.*` |
| `library.tsx` | `exercisesCollection` | `createExercise`, `updateExercise`, `deleteExercise` | `coach.library.*` |
| `workouts.tsx` | `workoutsCollection`, `exercisesCollection`, `workoutExercisesCollection` | `createWorkout`, `addWorkoutExercise` | `coach.workouts.*` |
| `plans.tsx` | `plansCollection`, `planDaysCollection`, `workoutsCollection`, `coachClientsCollection`, `planAssignmentsCollection` | `createPlan`, `setPlanDay`, `clearPlanDay`, `assignPlan` | `coach.plans.*` |
| `tips.tsx` | `tipsCollection` | `postTip` | `coach.tips.*` |
| `profile.tsx` | `sessionStore` | `useUploadAvatar`, `supabase.from('profiles').update` | `coach.profile.*` |

**Client screens** (all in `app/(client)/`):

| Screen | Collections read | Mutations fired | i18n prefix |
|---|---|---|---|
| `home.tsx` | `planAssignmentsCollection`, `planDaysCollection`, `plansCollection`, `workoutsCollection`, `workoutExercisesCollection`, `tipsCollection`, `progressLogsCollection`, `setLogsCollection` | — | `client.home.*` |
| `training.tsx` | `planAssignmentsCollection`, `planDaysCollection`, `plansCollection`, `workoutsCollection`, `progressLogsCollection` | — | `client.training.*`, `client.days.*` |
| `workout/[planDayId].tsx` | `planDaysCollection`, `planAssignmentsCollection`, `workoutExercisesCollection`, `exercisesCollection` | `logProgress` | `client.workout.*` |
| `chat.tsx` (tips feed) | `tipsCollection` | — | `client.tips.*` |
| `profile.tsx` | `planAssignmentsCollection`, `plansCollection`, `sessionStore` | `useUploadAvatar`, `supabase.from('profiles').update` | `client.profile.*` |

**(Client-UX revamp)** Client surface redesigned: Ionicons tab bar (`home`/`barbell`/`bulb`/`person`); Home is now a dashboard (streak, today card, plan-progress bar, volume/effort/workout stat tiles, weekly-volume `TrendChart`, condensed tips with "see all"); Training marks completed days via `progressLogsCollection`; Tips/Profile gained icons + section headers + empty states; workout screen uses icon glyphs + an animated rest-timer ring.

_Onboarding screens: §4 will be extended in Phase 6._

---

## §5 Schema
**Owned by:** Phase 1.
**Status:** `[live]` _(Phase 1 — Opus, 2026-06-04)_

Source of truth: `supabase/migrations/0001_init.sql` (tables + RLS + helpers + realtime), `0002_storage.sql` (avatars), `0003_rpc.sql` (`set_updated_at` triggers + invite RPCs). Verified: `supabase db reset` applies all three cleanly; 29/29 pgTAP RLS assertions pass (`supabase test db`); `src/types/db.ts` generated. **All tables in `public`; all have RLS enabled.**

**Tables** (PK = `id uuid default gen_random_uuid()` + `created_at`/`updated_at` unless noted):
- `profiles` — `id` = `auth.users.id` (not generated; FK cascade). `full_name`, `role text check in('coach','client') default 'client'`, `avatar_url?`, `locale default 'en'`. Auto-created by `handle_new_user()` trigger on `auth.users` insert. Role changes blocked except `service_role` (escalation guard trigger).
- `client_intake` — `profile_id` UNIQUE FK (one row/client). Six jsonb columns + `completed_at`. Populated by Phase 6 onboarding. **jsonb shapes** (→ Zod in `src/db/intake-schemas.ts`): `basic_info{age:number,gender:'male'|'female'|'other',occupation?}` · `body_metrics{height_cm,weight_kg,body_fat_pct?}` · `fitness_goals{primary_goal:'lose_weight'|'gain_muscle'|'maintain'|'endurance',target_weight_kg?,timeline_weeks?}` · `health_restrictions{injuries:string[],conditions:string[],allergies:string[]}` · `nutrition_prefs{diet_type:'omnivore'|'vegetarian'|'vegan'|'keto'|'other',dislikes:string[],meals_per_day:number}` · `workout_prefs{days_per_week,session_minutes,equipment_access:'home'|'gym'|'both',preferred_time?:'morning'|'afternoon'|'evening'}`.
- `coach_invites` — PK `code text` (6-char, alphabet `A-Z2-9` minus I/O/0/1). `coach_id` FK, `used_by?` FK, `single_use default true`, `expires_at default now()+7d`. **created_at only, no updated_at.**
- `coach_clients` — composite PK `(coach_id, client_id)`. `status check in('active','removed') default 'active'`, `accepted_at`. Index on `client_id`. INSERT only via `redeem_invite()`.
- `exercises` — `coach_id` FK, `name`, `description?`, `video_url?` (CHECK matches youtube.com/youtu.be), `muscle_group?`, `equipment?`. Trigram GIN index on `name`.
- `workouts` — `coach_id` FK, `name`, `notes?`.
- `workout_exercises` — composite PK `(workout_id, position)` (**`position`, not `order`**). `workout_id` cascade FK, `exercise_id` FK, `sets/reps/rest_seconds` defaults 3/10/60, `weight_hint?`. **No timestamps.**
- `plans` — `coach_id` FK, `name`, `duration_weeks check 1..52`, `description?`.
- `plan_days` — `plan_id` cascade FK, `week_number>=1`, `day_of_week 0..6` (**0=Sunday**), `workout_id?` (set null; null = rest day). UNIQUE `(plan_id,week_number,day_of_week)`. **No timestamps.**
- `plan_assignments` — `plan_id` FK, `client_id` FK, `start_date date`, `status check in('active','completed','paused')`. Partial unique index `(client_id) where status='active'` → one active plan/client.
- `progress_logs` — `assignment_id` cascade FK, `plan_day_id` cascade FK, `client_id` FK, `completed_at`, `notes?`, `perceived_effort 1..10`. UNIQUE `(assignment_id,plan_day_id)` → one log/plan-day; upsert for retroactive logging.
- `set_logs` — `progress_log_id` cascade FK (**renamed from `log_id`**), `exercise_id` FK, `set_number`, `reps_done?`, `weight_done numeric(6,2)?`. UNIQUE `(progress_log_id,exercise_id,set_number)`. **created_at only.**
- `tips` — `coach_id` FK, `body text check len<=2000`. **created_at only**; indexed `coach_id`, `created_at desc`.

**RLS model** (single-coach). Enforced via `security definer` helpers (`is_coach()`, `my_coach_id()`, `is_my_client(uuid)`, `owns_plan/owns_workout(uuid)`, `client_has_plan`, `client_can_see_workout/exercise`, `client_owns_assignment/log`, `coach_can_see_log`) that bypass RLS to break policy recursion. Summary:
- `profiles`: read own + own coach + (coach reads own clients); update own (role change blocked).
- `coach_invites`: coach reads/inserts own. **No public SELECT** (would let anyone enumerate codes) — redemption is via the `redeem_invite()` RPC only.
- `exercises`/`workouts`/`workout_exercises`/`plans`/`plan_days`: coach full CRUD on own (ownership via `coach_id`, or parent for the two child tables); client SELECT only what's reachable from their `plan_assignments`.
- `plan_assignments`: coach CRUD (insert requires `owns_plan` AND `is_my_client`); client SELECT own.
- `progress_logs`/`set_logs`: client insert/read/update own (log insert requires `client_owns_assignment`); coach reads own clients'.
- `tips`: coach CRUD own; client SELECT tips by their coach.
- `coach_clients`: coach + client read own; coach update/delete; insert only via RPC.
- `client_intake`: client CRUD own; coach SELECT own clients'.

**Realtime publication** (`supabase_realtime`): exercises, workouts, workout_exercises, plans, plan_days, plan_assignments, progress_logs, set_logs, tips, coach_clients. (Not: profiles, coach_invites, client_intake.)

---

## §6 Collections
**Owned by:** Phase 2.
**Status:** `[live]` _(Phase 2 — Opus, 2026-06-04)_

Source: `src/db/collections.ts`. Built with `@tanstack/db` `createCollection` + `@tanstack/query-db-collection` `queryCollectionOptions`, all sharing `queryClient` (`src/config/queryClient.ts`). Read hook for screens: `useLiveQuery` from `@tanstack/react-db` (re-exported via `src/db/index.ts`). One collection per **realtime-published** table (10); `profiles`/`client_intake`/`coach_invites` are NOT collections (handled via `sessionStore` / Phase 6 direct writes / `redeem_invite` RPC).

| Export | Table | Key (`getKey`) | Notes |
|---|---|---|---|
| `exercisesCollection` | `exercises` | `id` | |
| `workoutsCollection` | `workouts` | `id` | |
| `workoutExercisesCollection` | `workout_exercises` | `workout_id:position` | composite key (no `id` col) |
| `plansCollection` | `plans` | `id` | |
| `planDaysCollection` | `plan_days` | `id` | |
| `planAssignmentsCollection` | `plan_assignments` | `id` | plan.md's `myAssignmentCollection` — renamed; serves coach + client (RLS scopes rows) |
| `progressLogsCollection` | `progress_logs` | `id` | insert = upsert on `assignment_id,plan_day_id` |
| `setLogsCollection` | `set_logs` | `id` | insert = upsert on `progress_log_id,exercise_id,set_number` |
| `tipsCollection` | `tips` | `id` | |
| `coachClientsCollection` | `coach_clients` | `coach_id:client_id` | composite key |

- **`queryFn`** re-reads `supabase.auth.getSession()` at call time; returns `[]` when no session (avoids 401 on signed-out fetch). The `sessionStore` listener calls `queryClient.invalidateQueries()` on `TOKEN_REFRESHED`/`SIGNED_OUT` (§7).
- **Write handlers** (`onInsert`/`onUpdate`/`onDelete`) defined generically per collection → optimistic; `onUpdate`/`onDelete` locate rows by `.match(pk)`. RLS rejects unauthorized writes → handler throws → automatic rollback.
- **Realtime:** `subscribeRealtime()` subscribes each table's `postgres_changes` stream. **(Phase 3)** Wired into `SessionProvider` — starts on first sign-in, tears down on sign-out.

---

## §7 Auth/session
**Owned by:** Phase 1 (seed/role rules) + Phase 3 (router wiring).
**Status:** `[live]` _(Phase 3 — Sonnet 4.6, 2026-06-04)_

- **Roles** live in `profiles.role` (`'coach'`/`'client'`, default `'client'`). New signups get a `client` profile auto-created by the `handle_new_user()` trigger.
- **Role-escalation guard:** the `prevent_role_escalation` trigger rejects any `role` change unless the caller's JWT role is `service_role`. So a client can never self-promote — the only way to set `role='coach'` is the seed script / dashboard.
- **Coach-seed ordering rule (GATE):** the trainer's `profiles.role` MUST be flipped to `'coach'` BEFORE any client redeems an invite — `redeem_invite()` inserts a `coach_clients` row whose `is_my_client`/assignment logic assumes the coach exists. Run `npx tsx scripts/seed-coach.ts <coach-email>` (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`) once after the coach signs up. Phase 6 onboarding can't be exercised end-to-end until this is done.
- **Invite flow:** coach calls `generate_invite_code()` RPC (coach-only, returns 6-char code) → client calls `redeem_invite(invite_code)` RPC (note arg name `invite_code`). Redeem is atomic + idempotent: re-redeeming raises `23505` (→409); invalid/expired raises `22023`.
- **JWT-refresh handling — complete (Phase 2/3).** Collections' `queryFn` re-reads `supabase.auth.getSession()` at call time. `initSession()` (called by `SessionProvider`) subscribes `onAuthStateChange`: loads `profiles` row + (client only) queries `plan_assignments` for `active`/`paused` row → sets `{ session, profile, role, hasActiveAssignment, isLoading }`. `TOKEN_REFRESHED`/`SIGNED_OUT` both call `queryClient.invalidateQueries()`. Read via `useSessionStore()`.
- **`SessionProvider`** (`src/providers/SessionProvider.tsx`) — mounts in `app/_layout.tsx`. Calls `initSession()` once; starts `subscribeRealtime()` on first sign-in; tears down realtime on sign-out. No React context needed — state lives in `sessionStore` (TanStack Store).
- **`RoleGate`** — a headless component rendered inside `<Stack>` in `_layout.tsx`. Watches `{ session, role, isLoading, hasActiveAssignment, segments }`. Hides splash screen on first `isLoading=false`. Only redirects if currently in the wrong segment group (prevents redirect loops on in-group navigation).
- **`refreshAssignmentStatus()`** exported from `sessionStore.ts` — call after onboarding completes (Phase 6 `request-sent.tsx`) to transition client from onboarding → `/(client)/home`.

---

## §8 Mutations
**Owned by:** Phase 2 (foundation); extended in Phases 4, 5, 6.
**Status:** `[live]` _(Phase 2 — Opus, 2026-06-04)_

Source: `src/db/mutations.ts`. Each wraps a collection's optimistic `insert`/`update`, awaits `tx.isPersisted.promise`, and on rollback fires `toast.error('mutation.failed')` then rethrows. Coach/client id comes from `sessionStore.state.profile.id`. Client PKs are generated up-front via `uuidv4()` (`src/lib/uuid.ts`) so the optimistic row and server row share a key.

| Mutation | Writes | Caller (phase) |
|---|---|---|
| `createExercise(input)` | `exercisesCollection.insert` (normalizes `videoUrl` via `src/lib/youtube.ts` → clean watch URL) | coach library (P4) |
| `updateWorkout(id, input)` / `deleteWorkout(id)` | `workoutsCollection.update` / `.delete` (Programs hub workout edit/delete) | coach programs (PE) |
| `assignPlan(input)` | `planAssignmentsCollection.insert` (+ optional `update` old → `completed` when `replaceAssignmentId` set) | coach plans (P4) |
| `logProgress(input)` | `progressLogsCollection.insert` (upsert) + per-set `setLogsCollection.insert` | client workout (P5) |
| `postTip(body)` | `tipsCollection.insert` | coach tips (P4) |
| `redeemInvite(code)` | `supabase.rpc('redeem_invite', { invite_code })` then `coachClientsCollection.refetch()` — NOT a collection mutation; `23505`/`22023` throw | onboarding (P6) |

**Non-collection ops** (`src/api/`, TanStack Query `useMutation`): `useGenerateInvite()` (`generate_invite_code` RPC, coach-only) · `useUploadAvatar()` (uploads to `avatars` bucket at `{userId}/avatar.{ext}`, writes `profiles.avatar_url`). No video upload — videos are YouTube URLs.

---

## §9 Storage
**Owned by:** Phase 1.
**Status:** `[live]` _(Phase 1 — Opus, 2026-06-04)_

One bucket: **`avatars`** (`supabase/migrations/0002_storage.sql`).
- Public read; owner-only insert/update/delete (`auth.uid() = (storage.foldername(name))[1]::uuid`).
- Path convention: `{user_id}/avatar.{ext}`. Max 2 MB. MIME allowlist: `image/jpeg`, `image/png`, `image/webp`.
- No `exercise-videos` bucket — exercise clips are YouTube-hosted (unlisted), kept as plain `video_url` text on `exercises`.

---

## §10 i18n keys
**Owned by:** Phases 4, 5, 6 (incremental); audited in Phase 7.
**Status:** `[live]` _(Client-UX revamp — 2026-06-13)_

_Key namespaces in use (`auth.*`, `coach.*`, `client.*`, `onboarding.*`, `mutation.failed.*`, `common.*`). Parity between `src/locales/en.json` and `src/locales/ar.json` is mandatory. Note RTL-sensitive screens at the bottom._

**(Client-UX revamp)** New client keys (en+ar both authored): `client.home.{streakUnit,noStreak,exerciseCount,planProgress,weekOf,statVolume,statEffort,statWorkouts,volumeTrend,trendEmpty,tipsTitle,seeAll}` (interpolations: `exerciseCount {{count}}`, `weekOf {{current}}/{{total}}`), new group `client.days.{sun..sat}`, `client.training.today`, `client.tips.subtitle`, `client.profile.{memberSince,currentPlan,noPlanActive,goal,targetWeight,account,editProfile}`, `client.workout.{showVideo,hideVideo}`.

---

## §11 Env vars
**Owned by:** Phase 0.
**Status:** `[live]` _(Phase 0 — Opus, 2026-06-04)_

`.env` (gitignored) seeded from `.env.example`. Live vars:
- `EXPO_PUBLIC_SUPABASE_URL` — read by `src/config/env.ts` → `supabase.ts`. Ships to client.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same path. Ships to client.
- `EXPO_PUBLIC_SENTRY_DSN` — read in `app/_layout.tsx`; `Sentry.init` only runs if set. Ships to client.
- `EXPO_PUBLIC_API_URL` — read by `env.ts` → `api.ts` fetch wrapper (placeholder; no backend consumes it yet).

- `SUPABASE_SERVICE_ROLE_KEY` — **(Phase 1)** local `.env.local` only (gitignored; **never** `EXPO_PUBLIC_`-prefixed). Read by `scripts/seed-coach.ts` to promote the coach. Does not ship to client.

- `SENTRY_DISABLE_AUTO_UPLOAD` — **(Deploy)** set to `"true"` in all three `eas.json` build profiles to skip the build-time Sentry source-map upload (see §13). Build-time only; does not ship.

`EAS_PROJECT_ID` is now present as `extra.eas.projectId` in `app.json`. _Not yet present: `SENTRY_AUTH_TOKEN` (needed only when re-enabling Sentry source-map upload; add as an EAS secret)._

---

## §12 Tests
**Owned by:** Phase 0 (framework choice + smoke); grown by every later phase.
**Status:** `[live]` _(Phase 0 — Opus, 2026-06-04)_

Runner: **Jest + `jest-expo` preset** (`jest.config.js`). Unit tests live in `__tests__/` (currently just `smoke.test.ts`, asserts `1===1`). `npm test` (script: `jest --passWithNoTests`) passes. Phase 0 gate = type-check + lint + test all green (verified 2026-06-04).

**(Phase 1)** RLS SQL tests: `supabase/tests/rls_test.sql` — pgTAP, **29 assertions** across coach / enrolled-client / unrelated-client, run via `npx supabase test db` (needs the local stack up). Verified green 2026-06-04.

**(Phase 2)** Jest config gained `moduleNameMapper` (`@/` → `src/`) and an extended `transformIgnorePatterns` (adds `fractional-indexing`, an ESM-only transitive dep of `@tanstack/db`). New suites: `src/db/__tests__/collections.test.ts` (fetch → state, optimistic insert apply, rollback-on-error, keyed-collection presence — drives the `__mocks__/supabase.ts` mock), `src/lib/__tests__/youtube.test.ts`. `npm test` green (17 tests, 2026-06-04).

_Later phases add: Maestro E2E in `e2e/`._

---

## §13 Gotchas
**Owned by:** Every phase, at its stop point.
**Status:** `[live]` _(Phase 0 — Opus, 2026-06-04)_

- **`&` in the project path** (`Fitness&Muscles`) breaks `npm run`/`npx` (`.bin` shims split on `&`). Run tools via `node node_modules/<tool>/...` instead (see §2). **(Phase 1)** This also broke the husky hooks — `.husky/pre-commit` and `.husky/commit-msg` were rewritten to invoke eslint/commitlint through `node node_modules/.../…` directly (NOT `--no-verify`; verification still runs). Renaming the folder would remove the need.
- **`babel-preset-expo` added as explicit devDependency** (v55.0.11). It was only nested under `expo/node_modules` (not hoisted), so root `babel.config.js` / jest couldn't resolve it → "Cannot find module 'babel-preset-expo'". Keep it top-level.
- **Reanimated worklets plugin is auto-added** by `babel-preset-expo` when `react-native-worklets`/Reanimated 4 is installed — do NOT add `react-native-worklets/plugin` to `babel.config.js` manually (duplicate).
- **Stores keep their actions inside store state** (TanStack Store), so existing call sites (`useAuthStore((s) => s.login)`, destructured `useOnboardingStore()`) work unchanged. The exported hooks are overloaded: no-arg returns full state, selector returns the slice.
- **TanStack Form + Zod error shape:** `field.state.meta.errors` holds schema *issue objects*, not strings. Use `firstError()` from `src/lib/formError.ts` for the `TextInput` `error` prop.
- **Optional Zod fields vs form values:** a `z.string().optional()` field clashes with a non-optional `''` default value type. Use plain `z.string()` for "optional" text fields (empty string passes).
- **(Phase 1) RLS recursion → security-definer helpers.** Policies that need to look at another RLS-protected table (e.g. a client's reachable exercises) call `security definer` functions with `set search_path = ''` so they bypass RLS and don't recurse. `authenticated` keeps EXECUTE on them (policy expressions run as the querying role) — so they also show up as callable RPCs in `src/types/db.ts`. Harmless: each only returns a boolean/uuid scoped to `auth.uid()`.
- **(Phase 1) `coach_invites` has NO public SELECT** — a deliberate hardening over plan.md's literal "anyone can read by code". A `using(true)` policy would let any user enumerate every unused code and hijack the roster. Clients never SELECT invites; redemption goes through the `redeem_invite()` security-definer RPC.
- **(Phase 1) `redeem_invite` arg is named `invite_code`** (not `code`) to avoid ambiguity with the `coach_invites.code` column. The Phase 2 `redeemInvite` mutation must call `rpc('redeem_invite', { invite_code })`.
- **(Phase 1) Role escalation is trigger-blocked.** `profiles.role` can only change under a `service_role` JWT, so the seed script MUST use `SUPABASE_SERVICE_ROLE_KEY` — the anon/authenticated client cannot promote anyone.
- **(Phase 1) `pg_trgm` lives in the `extensions` schema**; the `exercises.name` GIN index is declared `using gin (name extensions.gin_trgm_ops)`.
- **(Phase 2) `@tanstack/react-db@0.1.85` added** — provides `useLiveQuery` (Phases 4/5). Its dep is pinned to exactly `@tanstack/db@0.6.7` (matches installed), so the install did NOT bump `db`. Pure-JS, New-Arch-safe.
- **(Phase 2) `npm install` postinstall fails on the `&` path** — the `prepare` → `husky` script resolves to `D:\CodeLab\husky\bin.js` (path split on `&`). Use `npm install --ignore-scripts`. (Husky hooks themselves already invoke tools via `node node_modules/...` per Phase 1.)
- **(Phase 2) `@tanstack/db` is CJS but pulls ESM-only `fractional-indexing`** → jest "Unexpected token 'export'". Fixed by extending `transformIgnorePatterns` in `jest.config.js` (negative-lookahead list, `esmPackages`). Add future ESM-only transitive deps there.
- **(Phase 2) Supabase client is schema-untyped** (`createClient` without `<Database>`), so `.from(table)` is loosely typed — boundary casts (`as Row[]`, `as Partial<Row>`) live only in the `defineCollection` factory. Generic-table `.eq(col, val)` does NOT type-check; use `.match(Record<string,unknown>)` for PK filters instead.
- **(Phase 2) Optimistic PKs are client-generated** (`uuidv4`, prefers `crypto.getRandomValues`, falls back to `Math.random` — no RN crypto polyfill installed). Sent as the real `id` so optimistic + server + realtime-echo rows converge on one key. Don't switch to server-generated ids without solving the reconciliation/duplication problem.
- **(Phase 2) jest manual mocks can double-instantiate** — a `__mocks__` file imported directly by a test is a different instance than the one jest injects. `__mocks__/supabase.ts` anchors its state on `globalThis` so both see the same object.
- **(Phase 3) `@tanstack/react-db` has no `DBProvider`; `burnt` has no `<Toaster>` component.** The plan.md provider chain listed both, but neither exists in the installed versions. TanStack DB collections are module-level singletons — no provider required. `burnt` is purely imperative. Both were omitted from `_layout.tsx` without functional impact.
- **(Phase 3) `TanStack Store .subscribe()` returns a `Subscription` object** with an `.unsubscribe()` method — NOT a plain function. Pattern: `const sub = store.subscribe(fn); return () => sub.unsubscribe();`
- **(Phase 4) `@shopify/flash-list` v2 dropped `estimatedItemSize`.** The prop simply doesn't exist in v2 types — sizes are auto-measured. Remove it from any `<FlashList>` usage; `overrideItemLayout` is the v2 escape hatch for explicit hints.
- **(Phase 4) TanStack Form field array API.** `form.Field name="items"` → the rendered `(field) =>` gives `field.pushValue()`, `field.removeValue(index)`, `field.insertValue(index, value)`, `field.swapValues(a, b)`. For nested fields inside an array use `form.Field name=\`items[${index}].prop\``.
- **(Phase 4) `plansCollection.state.get(id)` for optimistic lookup.** After `createPlan()`, the plan is in the collection's in-memory state immediately (optimistic insert). Use `collection.state.get(id)` to find it before the realtime echo arrives.
- **(Phase 4) `hasActiveAssignment` has a two-phase load for clients.** `applySession` first sets `isLoading=false` with `hasActiveAssignment=null`, then fires a second query. `RoleGate` guards on `hasActiveAssignment === null` to avoid a premature redirect to onboarding. If the assignment query races with a SIGNED_OUT event, the guard is harmless (session becomes null first and the auth branch fires).
- **(Phase 3) Routing uses `useSegments()[0]`** to determine the current group before redirecting — prevents redirect loops when the user navigates within a group. Phase 4/5 can add nested guards using deeper segment checks if needed.
- **(Deploy) Sentry source-map auto-upload breaks release EAS builds until a token is configured.** `@sentry/react-native`'s `sentry.gradle` runs `sentry-cli` on every non-debug build to upload source maps; with no `SENTRY_AUTH_TOKEN`/org/project it exits 1 and fails the whole Gradle build (`:app:createBundleReleaseJsAndAssets_SentryUpload_*`). Fix: `SENTRY_DISABLE_AUTO_UPLOAD: "true"` is set in **all three `eas.json` build profiles** (`shouldSentryAutoUploadGeneral()` guard, `sentry.gradle:11`). Runtime Sentry is unaffected — `Sentry.init` is gated on an empty `EXPO_PUBLIC_SENTRY_DSN`. When integrating Sentry for real: set the DSN, add `SENTRY_AUTH_TOKEN` as an EAS secret (never `.env`), pass `organization`/`project` to the Expo plugin in `app.json`, then remove the disable flag.
- **(Client-UX revamp) Visualization stack: `react-native-svg` (15.15.3, pinned by `expo install`), `@expo/vector-icons` (Ionicons), `react-native-gifted-charts` (pinned `1.4.77`).** gifted-charts is pure-JS (renders through `react-native-svg`, no native module of its own) → New-Arch safe; svg + vector-icons are Expo-managed. Install via `node node_modules/expo/bin/cli install …` (the `&` path breaks `npx`). **Charts/icons must be RTL-aware:** `TrendChart` reverses its data array under `I18nManager.isRTL`; the `Icon` primitive exposes `flipRTL` for directional glyphs only (don't flip checkmarks/non-directional icons). **`ProgressRing`** animates `strokeDashoffset` via `useAnimatedProps` on an `Animated.createAnimatedComponent(Circle)` — the canonical svg+Reanimated pattern; Reanimated is already initialized app-wide (first import in `app/_layout.tsx`), so no extra setup.
- **(Phase 1) Local verification needs Docker + `supabase start`.** First-run image pull is several GB (~15 min here). Gates used: `supabase db reset`, `supabase test db` (pgTAP, 29 assertions), `supabase gen types typescript --local > src/types/db.ts`. Run supabase via `npx supabase …` (the global binary isn't on PATH; npx works in the Bash tool despite the `&` path).

---

## Update protocol

At each phase stop point (see the 🛑 STOP markers in `plan.md`):

1. **Update the sections listed in the stop point's checklist.** No more, no less.
2. **Bump the status** from `[empty]` → `[stub]` → `[live]` as content matures.
3. **Date-stamp non-trivial changes** at the top of the affected section: `_Updated: 2026-MM-DD (Phase N — {model})_`.
4. **Keep entries terse.** If a section grows past ~40 lines, split it into a sub-file under `docs/` and link out.
5. **Stale entries are worse than missing ones.** If reality has diverged from what's written here, fix the entry FIRST, then continue your work.
6. **No code in this file.** Reference paths and contracts; let the source files be the source of truth.
