# Coach Flow UI/UX Overhaul

## Model assignments per phase

| Phase | Work | Model | Why |
|---|---|---|---|
| **A** | Foundation: 4 primitives, `danger` token, `profilesCollection`, `coachStats.ts` + tests | **Sonnet** | Isolated, well-specified primitives + pure helpers; mechanical with a clear spec. ✅ **DONE** (commits `fdd1d45`, `bd8885d`) |
| **B** | Navigation restructure: 5 tabs + Programs hub; extract Library/Workouts/Plans into views; delete old routes; i18n migration | **Opus** | Multi-file refactor with route deletion + behavior-preserving extraction; integration risk is high — use the most capable model. ✅ **DONE** (commit `6cf22ca`) |
| **C** | Home dashboard rebuild (charts, stat cards, recent activity) | **Sonnet** | Pattern is established by `app/(client)/home.tsx`; mirror it with coach data. ✅ **DONE** (commits `df54499`, `3afedf7`) |
| **D** | Clients redesign (avatars, names, badges, adherence) | **Sonnet** | Screen rewrite with a clear data join; standard judgment. ✅ **DONE** |
| **E** | Programs sub-views polish (Library filters/thumbnails, Workouts edit/delete, Plans grid) | **Sonnet** | Multiple coordinated UI changes across three views. |
| **F** | Tips + Profile polish | **Haiku** | Small, mechanical swaps (IconButton, Avatar, EmptyState) over existing logic. |
| **G** | RTL + i18n audit + final gates + `APP_CONTEXT.md` update | **Haiku** | Verification/cleanup pass; low reasoning load. |

Review subagents (spec compliance + code quality) after each phase: run on **Opus** for the high-risk phases (B), **Sonnet** otherwise.

---

## Context

The coach side of Fitness & Muscles feels confusing, flat, and unprofessional. Root causes, confirmed in code:

- **7 bottom tabs** (Home, Clients, Library, Workouts, Plans, Tips, Profile) — too many; three of them (Library + Workouts + Plans) are really one "build a program" workflow split apart.
- **Coach screens ignore the design system.** `app/(coach)/home.tsx` defines a *local* `StatCard` and `profile.tsx` renders a raw `👤` emoji — even though polished shared primitives exist and the **client** screens already use them beautifully.
- **No data visualization on the coach side**, despite rich data (completion logs, `perceived_effort` 1–10, per-set reps/weight, assignments).
- **Clients are unreadable** — `clients.tsx` shows `client_id.slice(0,8)…` instead of names/avatars.
- **No `danger` color** — delete/remove actions improvise red.

**Goal:** bring the coach flow up to the same visual quality as the client flow — simpler navigation (5 tabs), an icon-and-chart dashboard, recognizable clients — by **reusing the existing design system**, with **zero new dependencies and zero schema/RLS changes**.

### ⚠️ Important: most infra already exists
The icon library, chart library, and primitives like `Icon`/`StatCard`/`ProgressRing`/`TrendChart`/`EmptyState` **already exist and are installed.** Do **not** re-add dependencies or re-create these. The reference implementation is `app/(client)/home.tsx` — mirror it.

---

## Ground truth — what ALREADY EXISTS (REUSE, do not rebuild)

**Dependencies (installed + declared in `package.json`):**
- `@expo/vector-icons ^15.0.2` (Ionicons) · `react-native-svg 15.15.3` · `react-native-gifted-charts 1.4.77` · `react-native-reanimated 4.2.1`

**Theme — `src/theme/tokens.ts`:** `colors` (primary, background, surface, surfaceElevated, textPrimary/Secondary/Muted, success, warning, border, progressTrack/Fill, **danger** added in Phase A), `spacing`, `borderRadius`.

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
| `Avatar`, `Badge`, `SegmentedControl`, `IconButton` | **added in Phase A** |
| `Button` (`PrimaryButton`/`SecondaryButton`), `Card`, `TextInput`, `ChipSelector`, `StepIndicator`, `ToggleOption` | form/layout basics |

**Stats helpers:** `src/lib/progressStats.ts` (client) and `src/lib/coachStats.ts` (coach, added Phase A: `activeClientCount`, `weeklyCompletionSeries`, `avgEffortAcrossClients`, `lastActivityAt`, `clientAdherence`). Shared date utilities in `src/lib/dateWeeks.ts`.

**RLS already permits the Clients redesign:** `profiles_select_coach` / `profiles_select_client` (`supabase/migrations/0001_init.sql:335–338`) let a coach SELECT their clients' profile rows. Avatars are usable URLs — `profile.tsx` renders `avatar_url` directly via `expo-image`.

**Gold-standard reference to mirror:** `app/(client)/home.tsx`.

---

## Decisions (confirmed with user)

- **Scope:** full overhaul, all 7 screens.
- **Navigation:** merge Library + Workouts + Plans into one **Programs** hub → final tabs **Home · Clients · Programs · Tips · Profile** (5).
- **Deps/charts/icons:** use what already exists (no new deps).
- **Execution:** on `main` (no feature branch), via subagents, accuracy-focused.

---

## Conventions for the executing agent (phase-per-session)

Each phase is self-contained: **Read-first → Build → Acceptance**. Before any phase:

- **Work on `main`** (user preference — no feature branch). Don't clobber unrelated uncommitted edits (`package.json`, `app/(client)/_layout.tsx`); stage only your phase's files with explicit `git add <paths>`.
- **Read-first list is mandatory.** Never assume a primitive's absence; check `src/components/ui/index.ts`.
- **Reuse before building.**
- **i18n everywhere.** Keys in **both** `src/locales/en.json` and `src/locales/ar.json`, under `coach.*`.
- **Strict TS, no `any`.** `FlashList` (not `FlatList`) for client/exercise/tip lists. Day-of-week `0=Sunday`. Column `position`, never `order`.
- **Keep the optimistic-mutation pattern** (`src/db/mutations.ts`): try/catch + rollback toast `mutation.failed.*`. UI-only refactors — don't change the mutation contract.
- **Gates before done** (path has `&`, so run via node): `node node_modules/typescript/bin/tsc --noEmit` · `node node_modules/eslint/bin/eslint.js src/ app/` · `node node_modules/jest/bin/jest.js`.
- **Commit** conventional style (`feat(coach): …`), update `APP_CONTEXT.md`, then end.

---

## Phased execution

### Phase A — Foundation · *Sonnet* · ✅ DONE
- **Built:** `Avatar`, `Badge`, `SegmentedControl`, `IconButton` (+ exports); `danger` token in `tokens.ts` + `tailwind.config.js`; `profilesCollection`; `src/lib/coachStats.ts` + tests; shared `src/lib/dateWeeks.ts`.
- **Result:** type-check/lint clean, 51 tests pass. Commits `fdd1d45` (build) + `bd8885d` (review fixes: de-duped date helpers, fixed date-only `start_date` parsing, a11y/robustness).

### Phase B — Navigation restructure (5 tabs + Programs hub) · *Opus* · ✅ DONE
- **Built:** Rewrote `app/(coach)/_layout.tsx` → 5 tabs (home, clients, programs, tips, profile) with real Ionicons; created `app/(coach)/programs.tsx` hub with `SegmentedControl`; extracted `src/features/programs/{Library,Workouts,Plans}View.tsx` (verbatim moves); deleted old route files; migrated i18n in both locales.
- **Result:** tsc 0, eslint 0, 51 tests pass. Commit `6cf22ca`. No stale route references.

### Phase C — Home dashboard · *Sonnet* · ✅ DONE
- **Built:** Rebuilt `app/(coach)/home.tsx` — `SectionHeader` + 3 `StatCard`s (active clients, active plans via `planAssignmentsCollection`, this-week completions) + `TrendChart` (6-week series via `weeklyCompletionSeries`) + recent-activity rows (Avatar + `full_name` from `profilesCollection` + effort `Badge`) + `EmptyState` when no logs. Deleted the local `StatCard` definition. Exported `BadgeVariant` from `Badge.tsx` (removed local duplicate).
- **Result:** tsc 0, eslint 0, 51 tests pass. Commits `df54499` (build) + `3afedf7` (fix: export `BadgeVariant` from `Badge.tsx`).

### Phase D — Clients · *Sonnet* · ✅ DONE
- **Read-first:** `app/(coach)/clients.tsx`, `src/db/collections.ts` (profiles + assignments + logs), `src/components/ui/{Avatar,Badge,IconButton}.tsx`.
- **Build:** each row = `Avatar` + real `full_name` (join `profilesCollection` on `id === client_id`) + plan-status `Badge` + last-activity date (`lastActivityAt`). Replace custom invite/remove buttons with `Button`/`IconButton`; remove = `danger`. Detail sheet: avatar, name, assigned plan, adherence `ProgressRing`, remove. Keep `FlashList`.
- **Acceptance:** named/avatar'd clients; no truncated IDs in the UI. Gates green.
- **Built:** Rewrote `app/(coach)/clients.tsx` — invite button → `IconButton` (`person-add`); each `FlashList` row = `Avatar` (md) + `full_name` (joined via `profilesCollection`) + last-activity (`lastActivityAt`) + plan-status `Badge` (success/muted). Detail sheet: `lg` Avatar + name + joined date, adherence `ProgressRing` (`clientAdherence`) with plan name, `danger`-styled Remove. New i18n keys (`unknownClient`, `lastActive`, `neverActive`, `assignedPlan`, `adherence`) in en+ar. No truncated IDs remain.
- **Result:** tsc 0, eslint 0, 51 tests pass.

### Phase E — Programs sub-views polish · *Sonnet*
- **Read-first:** the three `src/features/programs/*View.tsx`, `src/components/ui/{IconButton,ChipSelector,Badge}.tsx`.
- **Build:** **Library** — muscle-group/equipment filter `ChipSelector`, `IconButton` play/edit/delete, optional YouTube thumbnail via `expo-image`. **Workouts** — add edit + delete (currently create-only), icons, clearer sets×reps·rest layout. **Plans** — larger tappable grid cells, day/week legend, `Badge` cell states; keep the week×day matrix.
- **Acceptance:** all three sub-views consistent with the new primitives; existing CRUD still works. Gates green.

### Phase F — Tips + Profile · *Haiku*
- **Read-first:** `app/(coach)/{tips,profile}.tsx`, `src/components/ui/{Avatar,IconButton}.tsx`.
- **Build:** **Tips** — `IconButton` post/delete, `EmptyState`, cleaner feed. **Profile** — replace `👤` with `Avatar`, `Icon`-led rows, `danger` sign-out, consistent `Card` grouping. Keep the existing `useUploadAvatar`/language-toggle logic intact.
- **Acceptance:** gates green; avatar upload + language toggle unchanged in behavior.

### Phase G — RTL + i18n + final gates · *Haiku*
- **Read-first:** `src/locales/{en,ar}.json`, `app/_layout.tsx` (RTL setup).
- **Do:** run in Arabic — verify `SegmentedControl`, tab order, charts, rows, and `flipRTL` glyphs mirror correctly. Confirm every new string has en+ar keys; no hardcoded literals. Final gates. Update `APP_CONTEXT.md` §3/§4/§6/§13.

---

## Risks & gotchas

- **Don't call gifted-charts `BarChart` directly** — it's styled via props, not `className`. Use the `TrendChart` wrapper (already themed + RTL-aware + empty-state).
- **`profiles` is NOT in the realtime publication** (`0001_init.sql:496–505`). `profilesCollection` loads via initial query fine; a client renaming themselves won't *live*-stream to the coach but appears on refetch. Acceptable — do **not** add a migration.
- **Avatar URL** is already a usable URL; `Avatar` shows initials only when null.
- **Programs hub modals:** each extracted `*View` owns its modal/form state; don't hoist into the hub.
- **RTL directional icons:** use `Icon … flipRTL` for back/forward chevrons.
- **Path has `&`:** run npm scripts via `node node_modules/...` (npm/npx shims break).

---

## Verification (end-to-end)

1. Gates green after each phase (via node, see Conventions).
2. `node node_modules/expo/bin/cli start` → walk the coach flow: 5 icon tabs; Programs hub switches Library/Workouts/Plans; Home shows charts + stat cards from real logs; Clients shows names + avatars + plan badges.
3. Ensure one test client has progress logs so charts/adherence aren't empty.
4. Toggle to Arabic and re-walk: layout mirrors, no clipped labels, charts readable, segmented control + tabs in correct RTL order.
5. `grep -rE "\(coach\)/(library|workouts|plans)"` → no stale route references after the merge.

## Critical files

- `src/components/ui/{Avatar,Badge,SegmentedControl,IconButton}.tsx` + `index.ts` — new primitives (Phase A)
- `src/theme/tokens.ts` + `tailwind.config.js` — `danger` token (Phase A)
- `src/db/collections.ts` — `profilesCollection` (Phase A)
- `src/lib/coachStats.ts`, `src/lib/dateWeeks.ts` (+ tests) — coach stat helpers (Phase A)
- `app/(coach)/_layout.tsx` — 5-tab restructure (Phase B)
- `app/(coach)/programs.tsx` + `src/features/programs/{Library,Workouts,Plans}View.tsx` — Programs hub (replaces `(coach)/{library,workouts,plans}.tsx`) (Phase B)
- `app/(coach)/{home,clients,tips,profile}.tsx` — screen rewrites (Phases C/D/F)
- `src/locales/{en,ar}.json` — key migration + new keys
- Reference (do not modify): `app/(client)/home.tsx`, `src/lib/progressStats.ts`
