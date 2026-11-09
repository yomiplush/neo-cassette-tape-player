# Neo Cassette design

Approved direction: mobile-first, independently designed 1980s cassette player, self-hosted static app; GitHub delivery only, with manual Cloudflare Pages deployment later.

## Experience
Original NEO / NC-85 identity, petrol blue metal, ivory controls, orange accents, smoked cassette window. No reference image, third-party logos or copied product silhouettes shipped. Main player and dedicated tape-library drawer. Tape insertion requires opening the door; playback locks the door until stopped. Two sides, persistent per-tape/side positions, manual flip, no default auto-reverse. Reel rotation and tape-pack radius follow transport position. Play, pause, stop/eject, rewind, fast-forward, mechanical counter/reset and end-stop.

## Audio
Web Audio engine handles decoded local same-origin demo audio and user imports. Always-colored music path: low-pass/high-pass, saturation, wow/flutter, hiss, modest dropout. Adjustable wear with a nonzero baseline. Mechanical clicks, door clunks, spool squeaks and motor noise are synthesized locally. Independent master volume controls everything. No microphone, upload, authentication or external runtime services. Audio starts only after a gesture; interruptions pause transport.

## Library and storage
Bundle 4–6 redistributable open-source tracks with source commit, notices and checksums. Do not infer music permission from a synth's code license; inspect composition/demo licensing. Imported browser-decodable audio stays in IndexedDB; metadata/positions/settings persist. Validate import and report storage/decode failures visibly. Finite sides stop at end; imports can be assigned via dedicated tape-creation GUI.

## Architecture
Vite + vanilla JavaScript modules and CSS. Pure transport model separated from audio engine, library/persistence and DOM view. Static dist output, no server dependencies. Relative asset paths support subdirectory self-hosting. Responsive at 360px and desktop; accessible controls, reduced-motion, keyboard transport and dismissible drawers.

## Verification
Node tests for transport transitions, side memory and endpoint behavior. Browser interaction tests for insertion/play/pause/wind/flip/eject/import/persistence and responsive overflow, plus real Web Audio rendering checks. Production build and HTTP asset checks before GitHub push. Document mobile Safari lifecycle limitations honestly; no guarantee of background playback.
