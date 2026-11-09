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
