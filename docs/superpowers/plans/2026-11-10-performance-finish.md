# Performance and lifecycle finish

Preserve the cassette UI, mechanics, audio character, imports, portable mode and both deployment editions. Target 60 FPS with a 30 FPS economy budget; do not promise a minimum on arbitrary hardware. This app uses CSS 3D, so resolution refers to material textures, not a nonexistent WebGL framebuffer.

1. Measure DOM mutations and CPU-throttled frame cadence on current code. Add regressions for bounded decoded buffers, cleanup, mixed slow-frame pressure and minimal-effects recovery.
2. Extract player rendering from main into a cached DOM view. Update static state only when it changes, live time at displayed precision, reuse meter samples, and stop the transport timer while idle.
3. Make audio cache byte-bounded and LRU with device-aware budgets. Avoid compressed-buffer copies, reject aborted decoded results, evict deleted imports, and dispose audio nodes, fetches and timers explicitly. Retain the same audio graph and sound quality.
4. Use measured rolling frame windows with hysteresis for quality changes. Keep 50/75/100% textures and 30/60 FPS budgets; remove extra decorative work under sustained pressure. Add disposal to rendering, gestures, observers and presentation listeners. Preserve background music and back/forward navigation.
5. Verify existing Node/browser/self-host suites, repeated lifecycle/memory checks, CPU throttling and before/after DOM work. Document measured limits, build both editions, review, commit and push.
