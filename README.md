# NEO CASSETTE — NC-85

**A little imperfection. Just right.**

An original, weathered 1980s cassette player for desktop and mobile browsers. No accounts, backend or external music service required. The application is **MIT licensed**; six included demo tracks and mechanical recordings are **CC0 1.0**.

[Play the demo](https://neo-cassette-tape-player-demo.yomiplush.dev/) · [Creator](https://www.yomiplush.dev/) · [Support](https://github.com/sponsors/yomiplush)

![NEO NC-85](docs/screenshots/desktop.png)

## Features

- Aged paint, scuffed plastic, faded labels and worn screws, made with original SVG textures.
- A dedicated tape collection with three cassettes and six distinct A/B tracks.
- Play, pause, stop, 12x fast forward/rewind, door controls, eject and manual side switching.
- Automatic safe sequences: FLIP stops playback, opens the door, turns a thick 3D-style cassette and closes the door. An already open door stays open. EJECT stops playback and opens the door before removing the tape.
- Animated reels and tape packs, a mechanical-style counter, counter reset and automatic end stop.
- Tape hiss, wow/flutter, softened highs, saturation and irregular gentle dropouts. Tape character remains at minimum wear.
- Edited CC0 recordings for winding, button presses, stopping and opening/closing the hatch, with a procedural fallback.
- Master volume and tape wear controls. Position is remembered separately for each tape and side. Flipping from the end of either side starts the opposite side at zero.
- Local mixtapes made from your own audio files, stored in IndexedDB without uploading them.
- Keyboard controls, accessible dialogs, reduced-motion support and mobile layouts. Transport and service symbols are original SVG image assets, avoiding platform-dependent emoji rendering.

## Development

Use Node.js 22.12+ or a supported version matching `package.json` (20.19+ is also supported).

```bash
npm ci
npm run dev
```

Open the displayed URL. A phone on the same LAN can use your development computer's LAN address and port.

```bash
npm run build
npm run preview
```

The default build outputs `dist/`. Relative asset paths support subdirectory hosting. Serve the files over HTTP rather than opening them with `file://`.

## Demo and self-hosted editions

Both editions share the same player, audio engine and storage model.

| Edition | Build | Output | Layout |
| --- | --- | --- | --- |
| Demo / Pages | `npm run build` or `npm run build:demo` | `dist/` | Single-viewport player, fitted deck and compact controls |
| Self-hosted | `npm run build:selfhost` | `dist-selfhost/` | Player-focused, fixed mobile transport keys, landscape columns |

The demo fits the deck and essential controls into one viewport, with internally scrolling collection/help dialogs. The self-hosted layout supports narrow phones, safe areas, scrolling controls, orientation changes and dialogs that fit the viewport. Both editions include the weathered visuals, mechanical sounds and cassette animations.

## Cloudflare Pages

Connect the repository through Pages Git integration with these settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |
| Environment variable | `NODE_VERSION=22` |

See Cloudflare's [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) and [build image documentation](https://developers.cloudflare.com/pages/configuration/build-image/). No API keys, Workers or database are required. Direct Upload of the built `dist/` directory is also supported.

## Self-hosting

With Docker and Compose v2 or later:

```bash
git clone https://github.com/yomiplush/neo-cassette-tape-player.git
cd neo-cassette-tape-player
docker compose up -d --build
```

Open `http://localhost:8080`, or `http://YOUR_SERVER_LAN_ADDRESS:8080` from a phone on the same LAN. Set a different port with `NEO_PORT=8090 docker compose up -d --build`. Stop with `docker compose down`.

The Dockerfile builds the self-hosted edition by default and serves static files through nginx with compression, audio caching and a health check. To update, run `git pull` followed by `docker compose up -d --build`.

Without Docker:

```bash
npm ci
npm run build:selfhost
npm run preview:selfhost -- --port 8080
```

For ongoing hosting, serve `dist-selfhost/` with a static web server. Use `npm run dev:selfhost` during development. HTTPS reverse proxies are supported; importing also works over LAN HTTP without depending on secure-context-only `randomUUID`.

Standalone Docker commands:

```bash
docker build -t neo-cassette .
docker run --rm -p 8080:80 neo-cassette
# Optional demo container:
docker build --build-arg PLAYER_EDITION=demo -t neo-cassette-demo .
```

**Imported music stays in the browser on the current device.** Self-hosting does not add server uploads or synchronization. A different browser, device or origin uses separate storage. The six demos are served locally; normal builds do not download music from external services.

<img src="docs/screenshots/selfhost-mobile.png" alt="Self-hosted player on a phone" width="320">

## Controls

1. Open **TAPE BOX** and select **Load this tape**. The deck stops, opens, loads and closes automatically.
2. **▶** plays, **Ⅱ** pauses/resumes and **■** stops without resetting position.
3. **◀◀ / ▶▶** winds continuously at 12x speed until stopped or at the end. Winding plays mechanical sound rather than music.
4. **FLIP A / B** performs the complete safe side-switching sequence. Press play to resume.
5. **EJECT TAPE** stops, opens and removes the cassette. Choose another from TAPE BOX.
6. **RESET** changes the counter display only.
7. Choose **Make your own mixtape** to import audio: up to 30 MB and 10 minutes per side. Omitting side B uses side A on both sides. Eject an imported tape before deleting it with **×** in the collection.

Keyboard: `Space` play/pause, `←` rewind, `→` fast forward, `S` stop, `E` door, `F` flip. Shortcuts are suppressed while using forms and dialogs.

## Audio and browser behavior

The first interaction enables Web Audio. This is an expressive simulation of a fictional deck, not a circuit-accurate model of a particular machine. Recording and noise-reduction standards are not implemented.

- Music passes through input gain, a 65 Hz high-pass, tanh saturation, a 3.5–7.3 kHz low-pass, modulated delay, irregular dropouts and a playback envelope.
- Electrical hiss and physical mechanism recordings use separate paths. Recorded winding loops change rate slightly with spool position and fade on stopping. Filtered stochastic noise provides a fallback.
- Slow wow and faster flutter vary with wear. Minimum wear still retains filtering, noise and modulation.
- Decoded audio is cached for up to two recordings with an 80 MiB budget. A single playing file must still be fully decoded, so longer files use more temporary memory.
- Switching tabs preserves playback and pending play requests. The transport uses the audio clock, and natural audio completion stops the tape effects even if UI timers are throttled. Closing or navigating away from the page stops playback. Screen-lock/background behavior can still be restricted by the browser or OS. STOP cancels pending loads; network loads time out after 25 seconds.
- Supported formats depend on the browser's decoder. MP3, WAV and M4A are typical choices; OGG support varies.
- Browser storage cleanup can delete imported audio. Keep your original files.

## Music and licenses

Application source: [MIT](LICENSE). Included audio retains its original **CC0 1.0** status rather than being relicensed under MIT.

Demo music comes from [uncle-sheepsky/duru-ai-cc0-bgm](https://github.com/uncle-sheepsky/duru-ai-cc0-bgm), pinned to `c801be93348701ac65442769b1841e9ccba67c4e`. The upstream repository identifies all six selected tracks as original/pure code synthesis without external samples.

| Tape | Side | Track file | Duration |
| --- | --- | --- | --- |
| AFTER HOURS | A | hyak-ep1-rhythm | 2:40 |
| AFTER HOURS | B | hyak-ep3-suika | 2:40 |
| OUTER SIGNAL | A | hyak-ep4-blackhole | 2:38 |
| OUTER SIGNAL | B | hyak-ep6-galaxy | 2:40 |
| SUNDAY RADIO | A | hyak-ep5-2048 | 2:40 |
| SUNDAY RADIO | B | duru-ai-ep2-music | 2:00 |

Tape names are original collection titles. Upstream documentation, license and generation code are preserved in `vendor/duru-ai/`. Served license copies are in `public/licenses/`; sources and SHA-256 hashes are in `public/audio/manifest.json`. The original 320 kbps tracks were converted to 128 kbps MP3, approximately 15 MB total. Tape effects are applied during playback.

To reproduce the music conversion, install Git, Python and ffmpeg:

```bash
git clone https://github.com/uncle-sheepsky/duru-ai-cc0-bgm.git /tmp/duru-ai
cd /tmp/duru-ai
git checkout c801be93348701ac65442769b1841e9ccba67c4e
# Return to this player repository:
python scripts/prepare-audio.py /tmp/duru-ai
```

Mechanical recordings are by stecman, Joseph SARDIN / BigSoundBank and Spring Spring, all CC0. Source links and edits are in `public/sfx/credits.json`, license text in `public/licenses/SFX-CC0.txt`, and measurements/design rationale in [the sound research notes](docs/research/cassette-sound.md). No YouTube audio is redistributed.

Reference photographs, manufacturer logos and product images are not included. No external fonts, CDN or analytics are used. Dependency notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Social previews and generated assets

The demo's initial HTML contains Open Graph metadata and a Twitter large-image card. The 1200×630 cover at `public/social/neo-cassette.png` is rendered from the actual UI by `scripts/social-preview.mjs`. X and Discord control their own preview caches.

For self-hosted social previews, build with your public URL:

```bash
VITE_SITE_URL=https://your.example npm run build:selfhost
```

Without this setting, self-hosted builds do not publish the demo's canonical URL.

The top-right generated image icons link to home, source and sponsorship in that order. Originals and exact prompts are preserved in [vendor/generated-icons](vendor/generated-icons/README.md).

## Verification

```bash
npm test
npx playwright install chromium
npm run test:browser
npm run test:selfhost
npm run build:demo
npm run build:selfhost
```

Checks cover transport boundaries, saved positions, actual Web Audio rendering, recorded sound decoding/retries, imports and deletion, six demo decodes, cancellation, cassette animations, reduced motion, responsive layouts and initial-HTML social metadata. Browser automation uses Chromium. Listening tests and OS interruption behavior on physical iOS/Android devices require separate verification.

A GitHub Actions example is provided at `docs/ci-check.example.yml`. Copy it to `.github/workflows/check.yml` to enable it; it is not installed as an active workflow.

## Source layout

- `src/transport.js`: DOM-independent cassette transport.
- `src/flip.js`: cassette geometry, flip/eject animations and cleanup.
- `src/audio.js`, `src/mechanisms.js`: Web Audio, caching, tape effects and mechanical recordings.
- `src/library.js`: demo definitions, settings and IndexedDB.
- `src/main.js`, `src/style.css`: interface, controls, lifecycle and responsive styling.
- `src/assets/`: original weathering textures and generated navigation icons.
- `compose.yml`, `deploy/nginx.conf`: self-hosted static serving.
- `public/audio/`, `public/sfx/`: audio, credits and integrity manifests.

## Turn the deck, change the finish

Drag the case or its turn handle to inspect its sides, headphone sockets, volume wheel, belt clip and battery cover. The front, back and four edges are real browser-native CSS 3D surfaces; the existing front controls remain native buttons. **FRONT** returns to the operating view. On the turn handle, arrow keys rotate and `Home` restores the front. A drag does not also press the window latch. FLIP/EJECT return the case to the front before servicing the tape.

Five original finishes are included: **Harbor Blue, Silver Line, Midnight Graphite, Signal Red and Ivory Studio**. Each includes original paint wear and exposed-metal patches. No manufacturer logos, reference photos or copied product skins are distributed.

On phones/tablets up to 1024px in portrait, the image gear button lowers a fabric-like settings curtain. **BACK TO THE DECK** or Escape lifts it away. Rotation to landscape restores the same settings controls to the liner. The controls are moved rather than duplicated, values persist, playback continues, and reduced-motion preferences are respected. Horizontal/desktop layouts retain inline settings.

**TAPE CHARACTER** adds optional Light / Home dub, Medium / Street copy and Heavy / Attic find profiles based on tone targets from the creator's [MIT cassette filter](https://github.com/yomiplush/youtube-cassette-filter). The original Archive profile remains the default. These are coloration choices, not measured hardware emulations. The current engine retains its own subtle modulation and separate CC0 mechanics; no audio samples were found or copied from the old project. Pinned sources and measurements: [legacy filter research](docs/research/legacy-filter.md). Original MIT notice: `vendor/youtube-cassette-filter/LICENSE`.

<img src="docs/screenshots/skin-silver.png" alt="Original silver finish" width="240"> <img src="docs/screenshots/case-back.png" alt="Rotated case showing its belt clip and battery cover" width="240"> <img src="docs/screenshots/settings-curtain.png" alt="Portrait settings curtain" width="240">

Regenerate these previews against the development server with `node scripts/screenshots-case.mjs`.
