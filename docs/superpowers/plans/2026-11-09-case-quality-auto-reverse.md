# Case quality and auto-reverse implementation plan

User-authorized refinement of the existing cassette player. Preserve English UI, skins, tape import, background playback and portrait settings curtain.

## Decisions

- Remove the old flat device-top/device-bottom decorations from outside the rotating object. Increase real six-face depth to roughly 50–96 CSS pixels depending on case width/model.
- Provide a stable TURN / FRONT toolbar. TURN rotates 90 degrees; existing drag/keyboard gestures remain available. Cull back-facing surfaces without removing layout.
- Add original NC-85 manual and NR-88 auto-reverse variants. Auto-reverse changes head/direction with the door shut; no cassette flip animation. Default two-side pass permits one automatic reversal per user play cycle, then stops. Winding must never trigger auto-reverse.
- Add Auto / Economy / Balanced / Full display options. A pure governor selects 24/30/60 model updates and 50/75/100% material texture resolution using conservative hardware hints, measured frame cadence and hysteresis. This is browser-native DOM/CSS geometry, not a WebGL FSR pipeline; text/buttons remain native-resolution. Stop background visual monitoring and keep audio-clock transport independent.

## Tasks and tests

1. `src/performance.js` and `tests/performance.test.js`: independent adaptive governor, deterministic downgrade/recovery/override tests. No DOM or browser globals in pure policy.
2. `src/case-model.js`, `src/style.css`: cleanup decorations, depth, toolbar, measured/throttled pointer rendering, explicit hidden-face culling. Browser tests for no floating strips, depth, visible buttons, rotation/reset.
3. `src/transport.js`, tests: model choice, end-of-playback/pending reversal, single reversal budget, physical direction switching, manual behavior unchanged.
4. `src/main.js`: persist model/quality; original model markings; cancellable end transition shared by timer and audio ended event; maintain STOP/pagehide cancellation. Browser tests use short local WAVs for A→B→STOP and cancellation; no long fixture waits.
5. Material texture preparation and CSS: original SVG textures rasterized at 50/75% for lighter tiers; original SVG at full detail. Fonts and native input geometry are never downscaled. Verify viewport bounds including selectors.
6. Document limitations and pinned reference, update screenshots, run Node + browser + self-hosted tests and both builds. Independent review, commit and authorized push to main; public deployment stays manual.
