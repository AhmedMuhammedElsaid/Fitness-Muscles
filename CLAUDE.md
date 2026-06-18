# Fitness & Muscles — Project Guide

React Native (Expo SDK 55, RN 0.83, React 19) mobile app. **Single-tenant**: one fitness coach trains his own roster of clients. Both roles live in the same app, gated by `profiles.role`.

## Where to look first

- **`APP_CONTEXT.md`** — living architectural snapshot. Starts as a skeleton in Phase 0; sections fill at each phase's 🛑 STOP marker. **Read this before exploring the codebase** — even when sections are still empty, the section headers tell you which phase owns what.
- **`plan.md`** — the full build spec. Only open for phase-level questions or when `APP_CONTEXT.md` is insufficient.
- Source-of-truth files (when answering "what exists?"): `package.json`, `supabase/migrations/0001_init.sql`, `src/types/db.ts`, `src/db/collections.ts`.

## MVP scope

**In:** exercise library (with YouTube-hosted instructional video), reusable workouts, multi-week plan builder, plan assignment to clients, daily tips feed, client workout execution + progress logging, invite-code onboarding (8 steps), English + Arabic with RTL.

**Out (v1):** meal plans, real-time chat, multi-tenant / multi-coach, social features, wearables integration.

## Tech stack

| Layer | Library |
|---|---|
| Runtime | React Native 0.83 + Expo SDK 55 + React 19 |
| Architecture | **Fabric + TurboModules + Bridgeless** (`newArchEnabled: true`) |
| Router | Expo Router v5 (file-based) |
| Server state | `@tanstack/react-query` v5 |
| Reactive data + offline sync | `@tanstack/db` + `@tanstack/query-db-collection` |
| Client state | `@tanstack/react-store` (NOT Zustand) |
| Forms | `@tanstack/react-form` + `zod` (NOT react-hook-form) |
| Debounce/throttle | `@tanstack/react-pacer` |
| Styling | NativeWind v4 + Tailwind 3.4 |
| Animations | Reanimated 4 (Fabric-only) |
| Gestures | Gesture Handler 2.30 |
| Backend | Supabase (auth + Postgres + Storage + Realtime) |
| Secure storage | `expo-secure-store` |
| Video | `react-native-webview` (YouTube iframe embeds — videos hosted on YouTube as unlisted; zero storage cost) |
| Image | `expo-image` |
| Image picker | `expo-image-picker` (avatars only) |
| Utility natives | `expo-sharing` (invite-code share button, Phase 4) · `expo-haptics` (rest-timer buzz, Phase 5) |
| Long lists | `@shopify/flash-list` v2 (NOT `FlatList` for >50 rows) |
| i18n | `i18next` + `react-i18next` + `expo-localization` + `intl-pluralrules` |
| Crash reporting | `@sentry/react-native` |
| Toasts | `burnt` (native iOS/Android) |

## Architectural non-negotiables

- **New Architecture only.** Refuse any dep without New Arch support. Verify on [reactnative.directory](https://reactnative.directory) before `npm install`.
- **TanStack-first.** Never add Zustand, react-hook-form, or `@hookform/resolvers`. If a need arises that doesn't fit the TanStack stack, raise it in `plan.md` first.
- **`FlashList` for long lists.** `FlatList` is banned anywhere >50 rows is realistic (exercises, plans, tips, history).
- **i18n everywhere.** Every user-facing string goes through `t('key')`. Keys exist in both `src/locales/en.json` and `src/locales/ar.json`. RTL handled via `I18nManager.forceRTL` in `app/_layout.tsx` before first render.
- **RLS is the security boundary.** Client-side filtering on `coach_id`/`client_id` is defense-in-depth, not security. If a query "needs" the service-role key, fix the RLS policy instead.
- **Optimistic mutations.** All TanStack DB mutations are optimistic; wrap in try/catch; on rollback, surface a `burnt` toast with an i18n key (`mutation.failed.*`).

## Code conventions

- **Strict TypeScript.** No `any`. If a type is unknown, read the source; don't escape.
- **No comments except WHY.** Self-documenting code. A comment describing what the code does is wrong; a comment explaining a non-obvious constraint or workaround is right.
- **Reuse design-system primitives** in `src/components/ui/`. Do not introduce a new primitive without proposing it in `plan.md` first.
- **Day-of-week is 0=Sunday** to match JS `Date.getDay()`. Never switch to ISO (1=Monday) midway.
- **`order` is a SQL reserved word.** Use `position` in schema/columns.
- **Imports in `app/_layout.tsx`:** Reanimated 4 MUST be the first import. Out-of-order silently breaks the worklet runtime.

## Branding

| | |
|---|---|
| Display name | Fitness & Muscles |
| Slug | `fitness-and-muscles` |
| iOS bundle | `com.fitnessandmuscles.app` |
| Android package | `com.fitnessandmuscles.app` |
| iOS min | 15.1 |
| Android minSdk | 24 |
| Primary color | `#E8DEB5` (cream/gold) |
| Splash background | `#1A1A1A` |
| Languages | English (default) + Arabic (RTL) |

## Environment variables

`.env` (gitignored). See `plan.md` §"Environment variables" for descriptions.

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`
- `SUPABASE_SERVICE_ROLE_KEY` (local-only `.env.local`; **never** prefix with `EXPO_PUBLIC_`)
- `EAS_PROJECT_ID` (in `app.json`)
- `SENTRY_AUTH_TOKEN` (EAS secret only; never in `.env`)

## Workflow rules

- **One phase per agent run.** Don't span phases — context balloons and quality drops. Hand off via `plan.md` and `APP_CONTEXT.md`.
- **Read before writing.** Always read `package.json`, `src/types/db.ts`, and the relevant slice of `src/db/collections.ts` before writing a screen. Never invent a field name.
- **Update `APP_CONTEXT.md` after meaningful work.** New table → §5. New collection → §6. New screen → §3 + §4. New mutation → §8. New gotcha → §13. Stale context costs more tokens than a 30-second update.
- **Gates per phase:** `npm run type-check && npm run lint && npm test` must pass before declaring done.
- **Never `git push` without explicit user approval.** Never use `--no-verify`. Never amend a published commit.
- **No new dep without New-Arch verification** (see above).
- **Model + session reset per phase.** Each phase in `plan.md` has an assigned model (Haiku 4.5 / Sonnet 4.6 / Opus 4.7) and ends at a 🛑 STOP marker. When you hit one, commit, update `APP_CONTEXT.md`, and END the session — Phase N+1 opens in a fresh window on its assigned model.

## Common pitfalls

- **Reanimated 4 import order** — first import in `app/_layout.tsx`, no exceptions.
- **NativeWind v4 className types** — `nativewind-env.d.ts` must be in `tsconfig.json` `include`, else every `className` is red.
- **Supabase Realtime + RLS** — broadcasts respect RLS only if `alter publication supabase_realtime add table <t>` was run AND RLS is enabled. Both required.
- **`expo-image-picker` on iOS** — needs `NSPhotoLibraryUsageDescription` in `app.json` `ios.infoPlist`, else silent failure.
- **TanStack DB v0.x churn** — pin exact versions; bump intentionally.
- **Invite-code race** — `redeem_invite` RPC atomically claims via `update ... where used_by is null returning *`. Don't reimplement client-side.
- **YouTube WebView embed** — needs `allowsFullscreenVideo` and `mediaPlaybackRequiresUserAction={false}` on `<WebView>`, else the play button is unresponsive on iOS.
- **Supabase JWT refresh** — supabase-js auto-refreshes the access token roughly every 60 min. TanStack DB collections' `queryFn` MUST call `supabase.auth.getSession()` at call time (not at module init), and the session store MUST invalidate queries on `TOKEN_REFRESHED` / `SIGNED_OUT` events. Skip this and long-running sessions 401 silently.
- **Coach seed precedes client onboarding** — the trainer's `profiles.role` must be flipped to `'coach'` (via Supabase dashboard or `scripts/seed-coach.ts`) BEFORE any client can redeem an invite. Otherwise the `coach_clients` FK insert fails.

## Token discipline (mandatory)

Building this app on a tight token budget. Apply to every agent run:

- **Read targeted, not greedy.** Open only the file you're about to edit + the 1–2 it depends on. Never `cat` the whole repo.
- **No re-reads after Edit.** The harness tracks file state; re-reading to "verify" wastes tokens.
- **Batch tool calls when independent.** Same message, multiple tool blocks → one round-trip instead of N.
- **Defer to `APP_CONTEXT.md`** for schema/collection lookups; it exists so you don't reopen `0001_init.sql`.
- **No exploratory `find` / `grep` over the whole tree** when you can name the file. Use globs that match ≤10 files.
- **Stop at the phase boundary.** When the phase acceptance checks pass, hand off via `APP_CONTEXT.md` — do NOT start the next phase in the same context.

## Phase status

Tick boxes as phases complete. Format: ☐ not started · 🟡 in progress · ✅ done

- ✅ Phase 0 — Bootstrap (Haiku)
- ✅ Phase 1 — Backend schema + RLS (Opus)
- ✅ Phase 2 — Domain layer / TanStack DB (Opus)
- ✅ Phase 3 — Routing & role gate (Sonnet)
- ✅ Phase 4 — Coach UI (Sonnet)
- ✅ Phase 5 — Client UI (Sonnet)
- ✅ Phase 6 — Onboarding wire-up (Sonnet)
- ✅ Phase 7 — Cleanup + README + RTL audit (Haiku)
