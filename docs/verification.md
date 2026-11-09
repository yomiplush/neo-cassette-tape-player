# Verification — 2026-11-09

## Automated

- Node: seven tests pass, including mechanical interlocks, end-stop, independent side memory, corrupted saved positions, six unique licensed audio hashes and identical distributed CC0 notices.
- Chromium: nine browser tests pass at a 390px default viewport. Covers insert/play/pause/wind/flip/eject; one-second imported WAV auto-stop; IndexedDB survival across reload and deletion; escaped tape titles; invalid audio; all six MP3s decode; no overflow at 320/360/390/768/1440px; hide/STOP/keyboard cancellation of delayed loading; 25-second loading timeout.
- Production build served through Vite preview: eight integration tests also pass against the compiled assets (all UI/library tests, excluding the source-module-only OfflineAudioContext harness).
- Audio rendering: real OfflineAudioContext signal checks confirm high-frequency attenuation, nonzero tape hiss and effectively silent master mute after gain smoothing.
- Regression: delayed hidden playback and keyboard loading cancellation tests failed on the original implementation and pass after corrections.
- Import test disables `crypto.randomUUID`, confirming compatibility with ordinary LAN HTTP where that secure-context API may be absent. IDs use `crypto.getRandomValues`.
- `npm run build`: Vite production build passes. Production runtime JavaScript has zero third-party imports/services. Six audio files total approximately 15MB.
- `npm audit`: zero reported vulnerabilities at verification time.

- Docker: `docker build --network=host -t neo-cassette:verify .` passes under Node 22 / nginx Alpine; index, manifest and MP3 return successful HTTP responses inside the container. This host has IPv4 forwarding disabled, so a host-to-bridge published port could not be exercised; no kernel settings were changed.

## Visual and review

Desktop and mobile screenshots inspected. UI is original CSS artwork with no copied reference photo, real-world branding or external font dependencies. Reduced motion disables reel animation. Four native dialogs have visible headings linked by aria-labelledby.

An independent reviewer checked the transport/audio/persistence/UI integration. Reported hidden-load race, stalled-load cancellation, end-stop audio synchronization and unnamed dialogs were corrected. A follow-up review found no high-severity issues; its keyboard cancellation observation was also corrected and tested.

## Limits

Chromium automation is not a real iPhone/Android listening test. WebKit was downloaded but cannot run on this host due to missing compatible ICU/XML shared libraries; no Safari compatibility claim is made from that installation. Browser autoplay/OS interruptions and auditory preference should be checked on target devices. Recording and exact electrical emulation of a real machine are outside this implementation. No public deployment is performed; Cloudflare Pages instructions are in README.

## Lived-in hardware and Self-hosted edition refinement

- Current suite: 7 Node tests, 13 Chromium browser tests, 2 Self-hosted viewport tests pass.
- FLIP lifts an actual two-face clone out of the window, swaps the transport side edge-on, then seats the opposite face. Tested normal/reduced motion, locked controls, cancellation and restoration when resizing, and no delayed side changes after cancellation.
- Winding is a continuous layered signal rather than periodic isolated chirps. Real OfflineAudioContext rendering verifies sustained forward/reverse rumble after 1.3 seconds and near-silence after stop. Every enabled custom button activation gets a two-impact latch click; keyboard transport uses the same dispatcher.
- Fixed original SVG textures add corner paint wear, scratches, dusty plastic, faded labels and aged screws without loading external imagery. Static textures do not change randomly during playback.
- DEMO remains `npm run build` -> `dist/`. Self-hosted uses `npm run build:selfhost` -> `dist-selfhost/`, sharing the audio and transport implementation.
- Self-hosted keys are at least 44px and remain within 320x568, 360x640, 390x844, 430x932, 667x375, 844x390, 932x430, 956x440 and 1024x500 viewports. An initially missed wide-phone landscape case was reproduced by a failing test and corrected. Drawers and imports fit after rotation.
- All 11 UI/library integration tests and both viewport tests additionally pass against compiled Self-hosted assets served through Vite preview. Source-only OfflineAudioContext tests are run through the normal dev test server.
- Both production builds pass. Docker defaults to the Self-hosted profile and builds successfully under Node 22 / nginx Alpine. Official Docker Compose v5.7.0 temporary binary was SHA-256 checked; `compose config --quiet` passes. QA Compose service starts, nginx configuration checks pass, container-local index/manifest/MP3 responses succeed, and health status is healthy. Host bridge port forwarding remains unavailable on this host as described above.
- Desktop, narrow/normal portrait, landscape, tape-library and FLIP screenshots inspected. Mobile controls were moved outside the case stacking context to keep the patina/overlay layers from obscuring the fixed keys.
- Re-review found no significant actionable issues after verifying current files. Actual phone listening and Safari/device-specific behavior remain outside these Chromium checks.
