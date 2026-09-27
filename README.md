# Cultivation Schedule

A daily planner that plays like a xianxia cultivation game. Plan each day in six parts, let the app rate how hard each task is, earn Qi for what you finish, and face Heavenly Tribulations to break through to higher stages. Slack off and the daily reckoning takes Qi back.

Ships three ways from the same `www/` code: in any browser (installable PWA), as an Android APK built by GitHub Actions, and as a private claude.ai page.

## Play

- **Today**: the selected day split into Dawn, Morning, Noon, Afternoon, Dusk and Night. Tap a part (or the brush button) to inscribe a task. Tap its circle to complete it and gather Qi.
- **Inscribing a task**: name it, pick a realm (Body, Mind, Spirit, Mundane), how long it takes, the day and part of day, an optional deadline, and whether it repeats. The rating updates live: five ink dots, a tier name and the Qi it pays, with the breakdown shown so you can see why.
- **Calendar**: a month view with task dots, deadline markers and a seal on every settled day (jade cleared, cinnabar punished).
- **Cultivation**: your Qi ring, stage and title, the tribulation gate, the seven-stage path, titles earned and locked, and the chronicle.

### Rules of the Dao

| System | How it works |
|---|---|
| Qi | The only currency. Tasks pay 3-70 Qi from duration x realm x time-of-day x urgency + keyword bonuses. Streaks add up to +20%; Qi Deviation cuts rewards to 75%; finishing a task after its day pays half. |
| Stages | Mortal 0 · Qi Condensation 150 · Foundation Establishment 500 · Core Formation 1200 · Nascent Soul 2200 · Soul Transformation 3500 · Dao Ascension 5000. Your stage is always read from your **current** Qi, so losing Qi can drop you a stage; a stage you have broken through to is restored as soon as you regain the Qi. |
| Tribulation | Reaching a threshold does not advance you. It opens a Heavenly Tribulation you choose when to face. Pass chance = 40% base + up to 35% for your 7-day completion rate + up to 15% streak + up to 10% realm balance + 10% per previous failure, -15% under Qi Deviation (clamped 15-95%). Pass: breakthrough, +10% of the threshold as bonus Qi, a title. Fail: Qi burned back to 90% of the threshold and a 24 h cooldown. |
| Daily reckoning | When you open the app on a new day, every unsettled day is judged. Cleared (all tasks done): +15% of that day's Qi (min 5) and the streak grows. Half or more done: streak holds. Less than half: -3 Qi per unfinished task and the streak breaks; two poor days in a row cause Qi Deviation for two days. Missed deadlines cost an extra 3 + 25% of the task's Qi and are stamped as debts. Daily losses are capped at 10% of your Qi. Streak milestones pay bonuses at 3, 7, 14 and 30 days. Repeating tasks spawn their next occurrence at settlement. |
| Titles | Permanent. Stage titles on each breakthrough, plus Task Conqueror (10 tasks), Disciplined Cultivator (25), Path of Ascension (50), Unshakeable Will (100), Qi Warrior (100 Qi), Seven Suns (7-day streak), Moon Cycle (30), Dawn Treader (25 dawn tasks), Lightning Eater (pass a tribulation at 50% or less), Scarred Ascendant (pass after two failures), Fourfold Balance (clear a day touching all four realms). |

Progress is one JSON object in the browser's storage (or the artifact's database on claude.ai). v1 saves are migrated automatically.

## Layout

| Path | What it is |
|---|---|
| `www/index.html` | Static shell. The ordered `<link>` and `<script>` tags are the file list every build follows. |
| `www/css/` | `tokens` (palette, type, spacing, fonts), `base` (shell layout, paper grain), `components`, `views`, `fx`. |
| `www/js/` | `game.js` (pure rules engine, no DOM), `icons.js`, `art.js` (generated-art loader), `fx.js` (effects), `sheet.js` (task sheet), `views.js`, `app.js` (controller). |
| `www/assets/` | Bundled fonts, stand-in SVG art, and generated art plus its `manifest.json`. |
| `tools/` | `fetch-fonts.mjs`, `generate-art.mjs` + `art-manifest.json`, `build-artifact.mjs`. |
| `tests/game.test.mjs` | Engine tests (`npm test`). |
| `android/` | Capacitor Android shell. `keystore/debug.keystore` signs debug builds (alias and password `cultivation`). |
| `.github/workflows/android.yml` | Builds the APK on every push and publishes it to the `android-latest` release. |

## Run

```bash
npm ci
npm run serve      # http://localhost:8000
npm test           # engine tests
```

### Android

Every push builds `cultivation-schedule.apk` and attaches it to the **android-latest** release. Download it on your phone and open it; later builds install over the previous one and keep your data. Local build: `npm run android:debug` (needs JDK 21 and the Android SDK).

### claude.ai page

`npm run artifact` writes `dist/artifact.html`, a single file with everything inlined and storage switched to the artifact `db` capability. Publish it with the Artifact tool.

## Generated art

The visuals ship with hand-made SVG stand-ins. To replace them with generated ink-wash art:

1. Allow `api.openai.com` in the environment's network policy and set `OPENAI_API_KEY`.
2. `npm run art -- --dry-run` prints every request; `npm run art` generates whatever is missing (about 15 images, `--only id,id` to pick, `--force` to redo, `--quality medium` to spend less).
3. Add `--android` to also write the adaptive launcher icon from `icon-app`.

The script writes optimised WebP/PNG files into `www/assets/`, updates `www/assets/manifest.json`, and fails if the total passes 6 MB. The app picks up whatever the manifest lists and keeps the stand-ins for anything missing. Prompts live in `tools/art-manifest.json`; its `endpoints` map the `flare` and `sunburst` names to OpenAI image models (`gpt-image-2.5-flare` and `gpt-image-2.5-sunburst`). Each asset is one POST to `https://api.openai.com/v1/images/generations` with `model`, `prompt`, `size` (`WxH`), `quality`, `output_format` and `n`; the image comes back base64-encoded in `data[0].b64_json` and the raw PNG is cached in `art/raw/`.
