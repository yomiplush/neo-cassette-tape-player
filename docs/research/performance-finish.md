# Performance finish — 2026-11-10

The existing cassette interactions, manual/auto-reverse models, five finishes, portable mode, imports and two deployment editions are preserved. Rendering, decoded audio ownership and scheduler ownership are now separate modules.

## Measurements

A five-second playing sample per CPU setting in headless Chromium, 390×844, captured by `scripts/profile-performance.mjs` on the same development host. These are single smoke measurements with host scheduling variability, not a statistical benchmark or a device certification.

| CPU setting | Before mutations | After mutations | Before mean rAF FPS | After mean rAF FPS |
| --- | ---: | ---: | ---: | ---: |
| Normal | 1,569 | 308 | 44.4 | 51.7 |
| 6× slowdown | 828 | 211 | 27.6 | 34.4 |

Only mutations within the physical player are counted. Normal sample DOM mutations decreased about 80%; the artificial CPU-throttled sample averaged above 30 FPS. Individual frames still miss deadlines (after: p95 about 33 / 67 ms). CPU throttling does not reproduce low-end GPU fill rate, native audio memory, thermal throttling or mobile power policies. There is no universal 30/60 FPS guarantee.

[Raw before](../performance/before.json) · [Raw after](../performance/after.json). Post-GC JS heap was roughly 2.14 / 2.19 MB; that small difference includes added modules and is not evidence about native audio memory or leak freedom. Resource regressions instead verify bounded cache bytes, closed contexts, cancelled decoded results, disconnected voices and document listener counts returning to baseline after twelve create/dispose cycles.

## Policy and resource budgets

- Hardware hints choose an initial tier; rolling one-second frame windows drive changes. Two slow seconds lower detail, twelve stable seconds restore one step. Repeated sub-30 FPS pressure at minimum detail drops extra decoration. Manual overrides remain authoritative.
- Texture dimensions: 100 / 75 / 50%. CSS 3D geometry, text and hit targets retain their size. This is not WebGL framebuffer scaling or FSR. Frame pacing tolerates fractional rAF timestamps.
- Decoded LRU: 48 MiB on low-memory/two-core hints, 128 MiB when memory reports at least 8 GiB, otherwise 80 MiB; at most two sides. A buffer larger than the budget is not cached. Active AudioBufferSourceNode ownership and browser decoder allocation remain outside this budget.
- Low-end hints request 32 kHz processing; the browser default is used if unsupported. Tape filters, modulation, hiss and mechanism sounds remain. Native decoding cannot be interrupted once started; aborted results are not cached and cannot start stale playback.
- Silent stopped/paused audio suspends after one second; pending music loading defers suspension. Unlocking resumes before transport actions. Hidden playing tabs retain audio.
- Transport polling sleeps when stopped/paused, persists position during active work, and coalesces wake requests. Renderer and model listeners, resize observers, RAF callbacks, mechanism fetches and audio resources have explicit disposal. Back/forward suspension pauses and resumes schedulers without recreating audio.
- Mechanism samples retry only missing clips after all pending requests settle. One-shots are bounded and disconnect when done; click pressure does not evict the continuous winding voice.
- Three original generated header icons were resized to 96×96 lossless WebP for 32 px UI display: approximately 845 KB to 11 KB combined. No runtime dependency was added.

## Verification

Node tests cover LRU eviction, byte accounting, idle scheduler ownership, fractional frame pacing, mixed pressure, recovery, manual overrides and cassette transport. Browser regressions cover static-label mutation counts, audio disposal/cancelled decodes, idle suspension/resume, repeated renderer/model disposal, bounded mechanism voices, winding protection and page lifecycle restoration. Existing audio-signal, transport, responsive, skin, flip/eject and self-hosted suites remain required.
