# Coach Flow UI/UX Overhaul

## Context

The coach side of Fitness & Muscles feels confusing, flat, and unprofessional. Root causes, confirmed in code:

- **7 bottom tabs** (Home, Clients, Library, Workouts, Plans, Tips, Profile) — too many; three of them (Library + Workouts + Plans) are really one "build a program" workflow split apart.
- **Coach screens ignore the design system.** `app/(coach)/home.tsx` defines a *local* `StatCard` and `profile.tsx` renders a raw `👤` emoji — even though polished shared primitives exist and the **client** screens already use them beautifully.
- **No data visualization on the coach side**, despite rich data (completion logs, `perceived_effort` 1–10, per-set reps/weight, assignments).
- **Clients are unreadable** — `clients.tsx` shows `client_id.slice(0,8)…` instead of names/avatars.
- **No `danger` color** — delete/remove actions improvise red.

**Goal:** bring the coach flow up to the same visual quality as the client flow — simpler navigation (5 tabs), an icon-and-chart dashboard, recognizable clients — by **reusing the existing design system**, with **zero new dependencies and zero schema/RLS changes**.

### ⚠️ Correction to the first draft of this plan (read this)
An earlier version of this plan assumed the icon library, chart library, and primitives like `Icon`/`StatCard`/`ProgressRing`/`TrendChart`/`EmptyState` did **not** exist and needed to be built. **They already exist and are installed.** Do **not** re-add dependencies or re-create these. The reference implementation is `app/(client)/home.tsx` — mirror it.

---

## Ground truth — what ALREADY EXISTS (REUSE, do not rebuild)

**Dependencies (installed + declared in `package.json`):**
- `@expo/vector-icons ^15.0.2` (Ionicons) · `react-native-svg 15.15.3` · `react-native-gifted-charts 1.4.77` · `react-native-reanimated 4.2.1`

**Theme — `src/theme/tokens.ts`:** `colors` (primary, background, surface, surfaceElevated, textPrimary/Secondary/Muted, success, warning, border, progressTrack/Fill), `spacing`, `borderRadius`. No `danger` yet.

**Primitives — `src/components/ui/` (exported from `index.ts`):**
| Component | What it does |
|---|---|
| `Icon` | Ionicons wrapper, `IconName` type, `flipRTL` prop for directional glyphs |
| `StatCard` | Card with `icon` + `value` + `label` + optional `iconColor` |
| `ProgressRing` | Animated SVG ring (Reanimated), `progress` 0–100, accepts children for center label |
| `TrendChart` | gifted-charts `BarChart` wrapper; `TrendPoint[]`; **already RTL-aware** and renders `EmptyState` when no data |
| `ProgressBar` | Linear bar with %/label |
| `SectionHeader` | Icon + title + optional action link |
| `EmptyState` | Icon + message |
| `StreakBadge` | Flame + day count |
| `Button` (`PrimaryButton`/`SecondaryButton`), `Card`, `TextInput`, `ChipSelector`, `StepIndicator`, `ToggleOption` | form/layout basics |

**Stats helper pattern — `src/lib/progressStats.ts`** (client-side): `currentStreak`, `avgEffort`, `workoutsCompleted`, `planProgressPct`, `weeklyVolumeSeries`. Also `src/lib/planDay.ts`. The coach build mirrors this with a new coach-side helper module (below).

**RLS already permits the Clients redesign:** `profiles_select_coach` / `profiles_select_client` (`supabase/migrations/0001_init.sql:335–338`) let a coach SELECT their clients' profile rows. Avatars are usable URLs — `profile.tsx:109–119` renders `avatar_url` directly via `expo-image`.

**Gold-standard reference to mirror:** `app/(client)/home.tsx` — icon-led `SectionHeader`s, a row of `StatCard`s, a `TrendChart`, `ProgressBar`, `StreakBadge`, `EmptyState`. The coach dashboard should feel like its sibling.

---

## What's actually MISSING (BUILD these)

1. **`Avatar`** primitive — `expo-image` circular avatar + initials fallback from `full_name` when `avatar_url` is null. Sizes sm/md/lg. (Extract the pattern from `profile.tsx:106–126`.)
2. **`Badge`** primitive — status pill, variants `success | warning | danger | muted`, `label`. (Plan status, effort tier, "No plan".)
3. **`SegmentedControl`** primitive — `segments: {key,label}[]`, `value`, `onChange`; RTL-aware order. Powers the Programs hub.
4. **`IconButton`** primitive — icon-only touchable; variants `default | danger`; **required `accessibilityLabel`**; ≥44×44 hit target. Replaces `▶`/text-glyph action buttons.
5. **`danger` color token** — add `danger: '#EF4444'` to **both** `src/theme/tokens.ts` and `tailwind.config.js`.
6. **`profilesCollection`** — `export const profilesCollection = defineCollection('profiles', ['id']);` in `src/db/collections.ts`. Resolves `coach_clients.client_id → profiles{ full_name, avatar_url }` (FK on `profiles.id`). `profiles` Row type already in `src/types/db.ts` — read it, don't invent fields.
7. **`src/lib/coachStats.ts`** — pure, unit-testable helpers mirroring `progressStats.ts`: `activeClientCount`, `weeklyCompletionSeries(progressLogs, weeks)` (→ `TrendPoint[]`), `avgEffortAcrossClients`, `lastActivityAt(clientId, logs)`, `clientAdherence(assignment, planDays, logs)`.

---

## Decisions (confirmed with user)

- **Scope:** full overhaul, all 7 screens.
- **Navigation:** merge Library + Workouts + Plans into one **Programs** hub → final tabs **Home · Clients · Programs · Tips · Profile** (5).
- **Deps/charts/icons:** use what already exists (the earlier "add both libraries" answer is now moot — they're installed).

---

## Conventions for the executing agent (this is an AI-friendly, phase-per-session plan)

This repo runs **one phase per fresh agent session** (CLAUDE.md). Each phase below is self-contained: **Read-first → Build → Acceptance**. Before any phase:

- **Branch first.** Working tree has uncommitted changes (`M package.json`, `M app/(client)/_layout.tsx`). Do `git switch -c feat/coach-ui-overhaul` and do **not** clobber those edits.
- **Read-first list is mandatory** — open exactly those files plus the 1–2 they depend on. Never assume a primitive's absence; check `src/components/ui/index.ts`.
- **Reuse before building.** If a primitive exists, use it. Only the 7 "missing" items above are new.
- **i18n everywhere.** Every user-facing string → `t('key')` with keys in **both** `src/locales/en.json` and `src/locales/ar.json`. Coach keys live under `coach.*`.
- **Strict TS, no `any`.** `FlashList` (not `FlatList`) for client/exercise/tip lists. Day-of-week `0=Sunday`. Column `position`, never `order`.
- **Keep the optimistic-mutation pattern** (`src/db/mutations.ts`): wrap in try/catch, rollback toast `mutation.failed.*`. Refactors are UI-only — do not touch the mutation layer's contract.
- **Gates before done:** `npm run type-check && npm run lint && npm test` must pass.
- **Commit** with conventional style (`feat(coach): …`), update `APP_CONTEXT.md`, then **end the session**.

---

## Phased execution

### Phase A — Foundation (4 primitives + token + collection + stats helper) · *Sonnet*
- **Read-first:** `src/components/ui/index.ts`, `src/components/ui/{StatCard,EmptyState,Icon}.tsx`, `src/theme/tokens.ts`, `tailwind.config.js`, `src/db/collections.ts`, `src/lib/progressStats.ts`, `app/(coach)/profile.tsx` (avatar pattern), `src/types/db.ts` (profiles + progress_logs Row types).
- **Build:** `Avatar`, `Badge`, `SegmentedControl`, `IconButton` (+ export from `index.ts`); add `danger` to tokens.ts + tailwind.config.js; add `profilesCollection`; create `src/lib/coachStats.ts`.
- **Acceptance:** type-check/lint/test green; each new primitive strict-typed; `coachStats` functions pure (no I/O) and ideally covered by a small `__tests__/coachStats.test.ts`.

### Phase B — Navigation restructure (5 tabs + Programs hub) · *Sonnet*
- **Read-first:** `app/(coach)/_layout.tsx`, `app/(client)/_layout.tsx` (real-icon tab reference), `app/(coach)/{library,workouts,plans}.tsx`, `src/locales/{en,ar}.json` (the `coach.tabs.*` block).
- **Build:** rewrite coach `_layout.tsx` → 5 `Tabs.Screen` (home, clients, programs, tips, profile) using `Icon` (e.g. `stats-chart`, `people`, `albums`, `bulb`, `person`); drop the emoji `TabIcon`. Create `app/(coach)/programs.tsx` hosting `SegmentedControl` (Library/Workouts/Plans). Extract each screen body into `src/features/programs/{Library,Workouts,Plans}View.tsx` (move logic verbatim, each keeps its own modal/form state), then delete `app/(coach)/{library,workouts,plans}.tsx`. Migrate i18n: drop `coach.tabs.{library,workouts,plans}`, add `coach.tabs.programs` + `coach.programs.{library,workouts,plans}`.
- **Acceptance:** `grep -rE "\(coach\)/(library|workouts|plans)"` → no stale `<Link>`/`router.push`. Programs hub switches sub-views; create/edit modals still work. Gates green.

### Phase C — Home dashboard · *Sonnet*
- **Read-first:** `app/(client)/home.tsx` (mirror this), `app/(coach)/home.tsx`, `src/lib/coachStats.ts`, `src/components/ui/index.ts`.
- **Build:** rebuild coach `home.tsx` using `SectionHeader` + `StatCard` row (active clients, plans, this-week completions) + `TrendChart` (weekly completions, `0=Sunday`) + optional adherence `ProgressRing` + `EmptyState`. Recent-activity rows resolve client name + `Avatar` (via `profilesCollection`) with a `Badge` for effort tier. Delete the local `StatCard`.
- **Acceptance:** dashboard renders with real data; empty/zero states use `EmptyState`/`TrendChart`'s built-in empty. Gates green.

### Phase D — Clients · *Sonnet*
- **Read-first:** `app/(coach)/clients.tsx`, `src/db/collections.ts` (profiles + assignments + logs), `src/components/ui/{Avatar,Badge,IconButton}.tsx`.
- **Build:** each row = `Avatar` + real `full_name` (join `profilesCollection` on `id === client_id`) + plan-status `Badge` + last-activity date (`lastActivityAt`). Replace custom invite/remove buttons with `Button`/`IconButton`; remove = `danger`. Detail sheet: avatar, name, assigned plan, adherence `ProgressRing`, remove. Keep `FlashList`.
- **Acceptance:** named/avatar'd clients; no more truncated IDs in the UI. Gates green.

### Phase E — Programs sub-views polish · *Sonnet*
- **Read-first:** the three `src/features/programs/*View.tsx`, `src/components/ui/{IconButton,ChipSelector,Badge}.tsx`.
- **Build:** **Library** — muscle-group/equipment filter `ChipSelector`, `IconButton` play/edit/delete, optional YouTube thumbnail via `expo-image`. **Workouts** — add edit + delete (currently create-only), icons, clearer sets×reps·rest layout. **Plans** — larger tappable grid cells, day/week legend, `Badge` cell states; keep the week×day matrix.
- **Acceptance:** all three sub-views consistent with the new primitives; existing CRUD still works. Gates green.

### Phase F — Tips + Profile · *Haiku/Sonnet*
- **Read-first:** `app/(coach)/{tips,profile}.tsx`, `src/components/ui/{Avatar,IconButton}.tsx`.
- **Build:** **Tips** — `IconButton` post/delete, `EmptyState`, cleaner feed. **Profile** — replace `👤` with `Avatar`, `Icon`-led rows, `danger` sign-out, consistent `Card` grouping. Keep the existing `useUploadAvatar`/language-toggle logic intact.
- **Acceptance:** gates green; avatar upload + language toggle unchanged in behavior.

### Phase G — RTL + i18n + final gates · *Haiku*
- **Read-first:** `src/locales/{en,ar}.json`, `app/_layout.tsx` (RTL setup).
- **Do:** run in Arabic — verify `SegmentedControl`, tab order, charts, rows, and `flipRTL` glyphs mirror correctly. Confirm every new string has en+ar keys; no hardcoded literals. Final `type-check && lint && test`. Update `APP_CONTEXT.md` §3/§4/§6/§13.

---

## Risks & gotchas (carry into the relevant phase)

- **Don't call gifted-charts `BarChart` directly** — it's styled via props, not `className`. Use the `TrendChart` wrapper (already themed + RTL-aware + empty-state).
- **`profiles` is NOT in the realtime publication** (`0001_init.sql:496–505` lists other tables, not `profiles`). `profilesCollection` loads via initial query fine; a client renaming themselves won't *live*-stream to the coach but appears on refetch. Acceptable — do **not** add a migration.
- **Avatar URL** is already a usable URL (`profile.tsx` passes `avatar_url` straight to `expo-image`). `Avatar` should do the same; initials only when null.
- **Programs hub modals:** each extracted `*View` owns its modal/form state; don't hoist into the hub or you'll cross-wire forms.
- **RTL directional icons:** use `Icon … flipRTL` for back/forward chevrons (see `home.tsx:157`).
- **Pre-flight:** branch first; preserve the uncommitted `package.json` / `(client)/_layout.tsx` edits.

---

## Verification (end-to-end)

1. `npm run type-check && npm run lint && npm test` green after each phase.
2. `npx expo start` (or `/run`) → walk the coach flow: 5 icon tabs; Programs hub switches Library/Workouts/Plans; Home shows charts + stat cards from real logs; Clients shows names + avatars + plan badges.
3. Ensure one test client has progress logs so charts/adherence aren't empty.
4. Toggle to Arabic and re-walk: layout mirrors, no clipped labels, charts readable, segmented control + tabs in correct RTL order.
5. `grep -rE "\(coach\)/(library|workouts|plans)"` → confirm no stale route references after the merge.

## Critical files

- `src/components/ui/{Avatar,Badge,SegmentedControl,IconButton}.tsx` + `index.ts` — new primitives
- `src/theme/tokens.ts` + `tailwind.config.js` — `danger` token
- `src/db/collections.ts` — `profilesCollection`
- `src/lib/coachStats.ts` (+ `__tests__/coachStats.test.ts`) — coach stat helpers
- `app/(coach)/_layout.tsx` — 5-tab restructure
- `app/(coach)/programs.tsx` + `src/features/programs/{Library,Workouts,Plans}View.tsx` — Programs hub (replaces `(coach)/{library,workouts,plans}.tsx`)
- `app/(coach)/{home,clients,tips,profile}.tsx` — screen rewrites
- `src/locales/{en,ar}.json` — key migration + new keys
- Reference (do not modify): `app/(client)/home.tsx`, `src/lib/progressStats.ts`
