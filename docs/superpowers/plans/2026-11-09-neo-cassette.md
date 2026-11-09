# Neo Cassette Implementation Plan

> Execute inline using executing-plans, task by task; keep this dedicated clone on its feature branch.

**Goal:** Ship a mobile cassette player with mechanical transport, colored audio, tape library, imports and licensed demos.
**Architecture:** Pure transport state, Web Audio engine, IndexedDB library, DOM UI.
**Tech Stack:** Vite, browser JavaScript/CSS, Node test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-11-09-neo-cassette-design.md

## Global constraints
- Static dist output, original NC-85 design, no runtime remote services.
- Audio always includes cassette coloration; volume applies to every sound.
- Deliver GitHub source; user deploys Cloudflare Pages manually.
- Bundle 4–6 tracks only after inspecting original source and license.

## Task 1 — transport and project foundation
- [x] Write tests in tests/transport.test.js for empty-door interlock, load/play/pause/wind/end-stop and A/B position memory. Run `node --test` to observe missing-module failure.
- [x] Implement src/transport.js with TapeTransport: insert(tape), door(), play(), pause(), stop(), wind(direction), flip(), tick(seconds), snapshot(). Finite side lengths clamp position and stop at endpoints; busy door rejects insertion/ejection.
- [x] Configure Vite and package scripts; run `npm test`.

## Task 2 — audio and licensed demos
- [x] Inspect upstream demo song licenses; clone selected source, retain original songs/license plus pinned provenance, render/convert 4–6 tracks locally.
- [x] Implement src/audio.js: gesture unlock, decode/cache, colored graph, motor/hiss/operation sounds, transport synchronization, capped decoded-buffer cache.
- [x] Verify rendered signal and source assets in browser and asset audit.

## Task 3 — library and interface
- [x] Add IndexedDB import persistence and validated saved settings/positions.
- [x] Build original player, tape shelf, insert/eject/flip/wind flows, wear panel and two-side import form. Add responsive layout, keyboard shortcuts, reduced motion, semantic dialogs and visible errors.
- [x] Test browser workflows with Playwright; verify no mobile overflow and persistent imported tapes.

## Task 4 — delivery
- [x] Document controls, audio model, license provenance, self-hosting and Pages build settings; add Docker static hosting and CI.
- [x] Run `npm test`, browser checks, `npm run build` and license/asset audit. Inspect screenshots.
- [x] Review final changes, commit and push exact tested state to target repository; verify remote commit.
