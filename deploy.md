# Deploy Guide — Fitness & Muscles

Step-by-step for building **development**, **preview**, and **production** binaries for **iOS and Android** with [EAS Build](https://docs.expo.dev/build/introduction/).

This project is currently **un-configured for EAS** — there is no `eas.json` and no `EAS_PROJECT_ID` in `app.json`. This guide takes you from zero to a store-ready build.

| Fact | Value |
|---|---|
| Expo SDK | 55 (RN 0.83, React 19, New Architecture) |
| Slug | `fitness-and-muscles` |
| iOS bundle id | `com.fitnessandmuscles.app` |
| Android package | `com.fitnessandmuscles.app` |
| Sentry | `@sentry/react-native` plugin is active → needs a `SENTRY_AUTH_TOKEN` EAS secret |

---

## ⚠️ Path gotcha (read this first)

The project lives in `D:\CodeLab\Fitness&Muscles\...`. The **`&` in the path breaks the `npx` / `npm` shims** on this machine (see your saved memory note). So **do not run `npx eas-cli ...`** here — it will fail or hang.

Two safe options:

1. **Install EAS CLI globally** (recommended — the global install path has no `&`):
   ```powershell
   npm install -g eas-cli
   eas --version
   ```
   Then use plain `eas ...` everywhere below.

2. **Invoke the binary by file path** if you prefer it local to the repo:
   ```powershell
   npm install --save-dev eas-cli
   node node_modules/eas-cli/bin/run --version
   ```
   Then substitute `node node_modules/eas-cli/bin/run` everywhere this guide says `eas`.

The rest of this guide assumes **option 1** (global `eas`).

---

## 1. One-time account + project setup

```powershell
# 1. Log in to your Expo account (creates one at expo.dev if you don't have it)
eas login

# 2. Verify who you're logged in as
eas whoami

# 3. Link this repo to an EAS project. This writes `extra.eas.projectId`
#    into app.json and creates the project on Expo's servers.
eas init
```

After `eas init`, confirm `app.json` gained something like:

```json
"extra": {
  "eas": { "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
}
```

> `CLAUDE.md` references an `EAS_PROJECT_ID`. `eas init` is what produces it — commit the resulting `app.json` change.

---

## 2. The three build profiles, explained

EAS builds are driven by **profiles** in `eas.json`. The three you asked for:

| Profile | What it produces | How you install / use it | Distribution |
|---|---|---|---|
| **development** | A **dev client** — your app shell + native code, but JS is loaded from the Metro dev server (`npm start`). Lets you hot-reload native modules. | Install on device/simulator, then run `expo start --dev-client`. | `internal` |
| **preview** | A **standalone** build that runs the bundled JS (no Metro). Android `.apk` you can sideload; iOS ad-hoc `.ipa` (registered devices) or simulator build. For QA / stakeholder testing. | Install the artifact directly. No store needed. | `internal` |
| **production** | Store-optimized artifacts: Android **`.aab`** (App Bundle for Google Play) and iOS **`.ipa`** signed for the App Store. | Upload to stores via `eas submit`. | `store` |

> **Development builds need the `expo-dev-client` package.** It is **not** installed in this project yet. Add it before building the development profile:
> ```powershell
> npx expo install expo-dev-client
> ```
> (If `npx` misbehaves on the `&` path, run `node node_modules/expo/bin/cli install expo-dev-client` instead — but installing deps via the Expo CLI usually still works; the shim issue mainly bites `eas-cli`.)

---

## 3. Create `eas.json`

You can let the CLI scaffold it:

```powershell
eas build:configure
```

…or create `eas.json` in the project root with this ready-to-use config tailored to this app:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "ios": {
        "simulator": false
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://YOUR-DEV-PROJECT.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-dev-anon-key"
      }
    },
    "development-simulator": {
      "extends": "development",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://YOUR-STAGING-PROJECT.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-staging-anon-key"
      }
    },
    "production": {
      "distribution": "store",
      "channel": "production",
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://YOUR-PROD-PROJECT.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-prod-anon-key"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "0000000000",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "track": "internal",
        "serviceAccountKeyPath": "./google-play-service-account.json"
      }
    }
  }
}
```

**Notes on this config:**
- `appVersionSource: "remote"` + `autoIncrement` lets EAS manage the build/version number so you don't hand-edit `app.json` every release.
- `channel` ties each profile to an EAS Update channel (useful later for OTA — see §8).
- The `env` blocks inline your **public** Supabase values. `EXPO_PUBLIC_*` vars are baked into the JS bundle and are **not secret** (the anon key is meant to be public; RLS is your security boundary per `CLAUDE.md`). For real secrets, use EAS secrets (§4).
- Point dev / preview / production at **different Supabase projects** if you have them, so test data never touches prod.

---

## 4. Secrets (Sentry + anything server-side)

The `@sentry/react-native` plugin uploads source maps at build time and needs an auth token. **Never** put it in `.env` — store it as an EAS secret:

```powershell
# Create the Sentry auth token secret (read it from your Sentry org settings)
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "sntrys_xxx" --type string

# List secrets to confirm
eas secret:list
```

`EXPO_PUBLIC_SENTRY_DSN` is public (it identifies the project, not a credential) — keep it in the profile `env` block or `.env` like the Supabase values.

> **Never** create an EAS secret or `env` entry for `SUPABASE_SERVICE_ROLE_KEY`. It must never reach the client bundle.

---

## 5. App signing credentials

EAS can generate and store these for you (the easy path). The first build for each platform will prompt; let EAS manage them unless you have existing certs.

- **Android:** EAS generates a keystore and keeps it on its servers. Back it up with `eas credentials` → Android → download keystore. **Losing this keystore means you can never update the Play Store listing**, so save it somewhere safe.
- **iOS:** You need an **Apple Developer Program** membership ($99/yr). EAS will log into your Apple account and create the distribution certificate + provisioning profile. For `internal`/`preview` ad-hoc iOS builds, each test device's UDID must be registered:
  ```powershell
  eas device:create
  ```
  Then re-run the build so the device is included in the profile.

Inspect or manage credentials any time:

```powershell
eas credentials
```

---

## 6. Build each profile

You can build one platform or both (`--platform all`). Builds run on EAS servers; the CLI prints a URL to watch progress and download the artifact.

### Development (dev client)
```powershell
# Android dev client
eas build --profile development --platform android

# iOS dev client (real device — requires registered device + Apple account)
eas build --profile development --platform ios

# iOS dev client for the SIMULATOR (no Apple account / device needed)
eas build --profile development-simulator --platform ios
```
After install, start the JS server and connect:
```powershell
npm start
# press 'a' / 'i', or scan the QR with the dev client
```

### Preview (standalone QA build)
```powershell
# Android — produces an installable .apk
eas build --profile preview --platform android

# iOS — ad-hoc .ipa for registered devices
eas build --profile preview --platform ios

# Both at once
eas build --profile preview --platform all
```
Download the artifact from the build URL and sideload it (Android: open the `.apk`; iOS: install via the QR / TestFlight-free ad-hoc link).

### Production (store binaries)
```powershell
# Android — produces an .aab for Google Play
eas build --profile production --platform android

# iOS — produces a signed .ipa for the App Store
eas build --profile production --platform ios

# Both
eas build --profile production --platform all
```

Check build status / history any time:
```powershell
eas build:list
```

---

## 7. Submit production builds to the stores

### Prerequisites
- **iOS:** an app record created in [App Store Connect](https://appstoreconnect.apple.com). Fill `appleId`, `ascAppId`, and `appleTeamId` in `eas.json` → `submit.production.ios`.
- **Android:** a Google Play Console app + a **service-account JSON** with release permissions, referenced by `serviceAccountKeyPath`. (Keep that JSON out of git — add it to `.gitignore`.)

### Submit
```powershell
# Submit the latest production build
eas submit --profile production --platform ios --latest
eas submit --profile production --platform android --latest

# Or build + submit in one shot
eas build --profile production --platform all --auto-submit
```

iOS lands in **TestFlight** first; promote to the App Store from App Store Connect. Android lands in the **internal** track (per `eas.json`); promote to production in the Play Console.

---

## 8. (Optional) Over-the-air JS updates with EAS Update

For **JS-only** changes (no native/dependency changes) you can ship without a new store build. The `channel` fields in `eas.json` already wire this up.

```powershell
npx expo install expo-updates
eas update:configure

# Push an update to the channel a build is listening on
eas update --channel preview --message "Fix tip feed spacing"
eas update --channel production --message "Hotfix onboarding step 6"
```

> Native changes (new Expo modules, SDK bumps, `app.json` native config) **always** require a fresh `eas build`. OTA only swaps the JS bundle.

---

## 9. Quick reference

```powershell
# Setup (once)
npm install -g eas-cli
eas login
eas init
npx expo install expo-dev-client          # needed for development profile
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "sntrys_xxx"

# Build
eas build --profile development           --platform android   # dev client
eas build --profile development-simulator --platform ios        # iOS simulator
eas build --profile preview               --platform all        # QA
eas build --profile production            --platform all        # store

# Ship
eas submit --profile production --platform all --latest
eas update --channel production --message "JS-only hotfix"

# Inspect
eas build:list
eas credentials
eas device:create
```

---

## Pre-flight checklist

- [ ] `eas login` succeeds and `eas whoami` shows your account
- [ ] `eas init` added `extra.eas.projectId` to `app.json` (committed)
- [ ] `expo-dev-client` installed (only if you build the development profile)
- [ ] `eas.json` created with dev/preview/prod profiles + correct Supabase URLs per env
- [ ] `SENTRY_AUTH_TOKEN` stored as an EAS secret (not in `.env`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **nowhere** in any build config
- [ ] iOS: Apple Developer account active; test device UDIDs registered for ad-hoc builds
- [ ] Android: keystore backed up; Play service-account JSON gitignored
- [ ] App Store Connect + Play Console app records created before `eas submit`
