# Cultivation Schedule

A weekly task planner with a cultivation-themed progression system. Plan each day's tasks, complete them to earn Qi, face tribulations, break through to higher cultivation stages and unlock titles.

## Layout

| Path | What it is |
|---|---|
| `www/` | The whole app: `index.html`, `styles.css`, `app.js`, plus the PWA `manifest.json` and `service-worker.js`. Every version of the app (browser, PWA, Android) runs this same code. |
| `android/` | Capacitor Android project that wraps `www/` in a native shell. |
| `keystore/debug.keystore` | Debug signing key so each new APK installs over the previous one. Password and alias are both `cultivation`. Debug only; never ship a store release with it. |
| `.github/workflows/android.yml` | Builds the APK on every push and publishes it to the `android-latest` release. |

## Run in a browser

```bash
npm run serve        # serves www/ at http://localhost:8000
```

Chrome and Edge offer to install it as a PWA from the address bar; on a phone use "Add to Home Screen".

## Install on Android

Every push to the development branch builds a fresh debug APK. On your phone:

1. Open the repository's **Releases** page and pick **Cultivation Schedule (latest Android build)**.
2. Download `cultivation-schedule.apk` and open it. Android asks once to allow installs from your browser.
3. Later builds install over the existing app and keep your data.

The build takes a few minutes; the **Actions** tab shows progress. Trigger one by hand from **Actions → Android APK → Run workflow**.

## Build the APK locally

Needs Node 22, JDK 21 and the Android SDK (or Android Studio).

```bash
npm ci
npm run android:debug   # -> android/app/build/outputs/apk/debug/app-debug.apk
```

## Game mechanics

- **Qi**: each task carries a Qi reward (1-100). Completing it awards that much Qi and EXP.
- **Stages**: Mortal → Foundation Building (50 EXP) → Core Formation (150) → Tribulation Transcendence (300) → Immortal Ascension (500) → Heavenly Emperor (800).
- **Tribulations** fire once when EXP first reaches 50, 150, 300 and 500. 60% chance to pass for +20 Qi; failing costs 10% of your Qi.
- **Breakthroughs** happen on reaching a new stage: +50 Qi and the stage's title.
- **Titles** also unlock for task counts: Task Conqueror (10), Disciplined Cultivator (25), Path of Ascension (50), Unshakeable Will (100), and Qi Warrior at 100 Qi.

Progress is stored on the device (browser local storage). Clear site data to reset.
