# Reusing the legacy cassette filter

Inspected 2026-11-09 at commit `1f0150146b574b89386abeddb90e68d5fa12532d` from [yomiplush/youtube-cassette-filter](https://github.com/yomiplush/youtube-cassette-filter/tree/1f0150146b574b89386abeddb90e68d5fa12532d). Findings below come from the local checkout of this primary source, not an auditory evaluation.

## Existing presets

Exact values from [src/cassette-engine.js, PRESETS](https://github.com/yomiplush/youtube-cassette-filter/blob/1f0150146b574b89386abeddb90e68d5fa12532d/src/cassette-engine.js#L12):

| Parameter | Light | Medium | Heavy |
| --- | ---: | ---: | ---: |
| High-pass / low-pass, Hz | 50 / 9000 | 80 / 6200 | 110 / 4200 |
| Presence frequency, Hz / gain, dB | 3000 / -2 | 2600 / -3.5 | 2200 / -5 |
| High shelf gain, dB (5500 Hz) | -4 | -7 | -10 |
| Saturation drive | 2.2 | 3.6 | 5.5 |
| Hiss gain | 0.035 | 0.07 | 0.12 |
| Wow rate, Hz / delay depth, ms | 0.5 / 0.8 | 0.65 / 1.6 | 0.85 / 2.8 |
| Flutter rate, Hz / delay depth, ms | 5.5 / 0.25 | 6.8 / 0.45 | 8.2 / 0.7 |
| Base delay, ms | 18 | 20 | 22 |
| Compressor threshold, dB / ratio | -20 / 2.8 | -24 / 4 | -28 / 6 |
| Slow level wander depth / rate, Hz | 0.08 / 0.15 | 0.14 / 0.22 | 0.22 / 0.35 |
| Output gain | 0.95 | 0.9 | 0.86 |

All presets use fully wet processing; the `wet: 1` property is present but routing explicitly sets wet gain to 1. Common settings include a +2.5 dB low shelf at 180 Hz, compressor knee 18 dB, attack 15 ms and release 220 ms. The program chain is high-pass → body shelf → low-pass → presence → high shelf → asymmetric waveshaper → variable delay → compressor → level wander. Hiss is added after that chain. See the [complete engine source](https://github.com/yomiplush/youtube-cassette-filter/blob/1f0150146b574b89386abeddb90e68d5fa12532d/src/cassette-engine.js).

## What can transfer

- The named progression is useful: progressively narrower bandwidth, more saturation and hiss, stronger instability. Port the preset concept or selected tone parameters into the existing `CassetteAudio` graph; preserve its source-buffer playback, transport state, master volume, and mechanism handling.
- The soft asymmetric waveshaper and extra presence/high-shelf stages offer a distinct legacy coloration. The current engine uses a normalized symmetric tanh curve and a different input gain and node order, so equal drive values will not produce equal sound or loudness. If adopting the curve, compare music at matched perceived level and retain output headroom.
- Smooth parameter transitions are already a useful pattern: the legacy engine uses `setTargetAtTime` with approximately 40 ms time constants. Its delay uses a zero intrinsic delay plus constant source and two oscillator inputs, avoiding double-added base delay. The current engine instead uses an intrinsic base delay; do not add another constant unless switching that topology completely.
- Legacy hiss is generated noise, not a recording: a three-second stereo pink-ish/white mixture filtered by a 1200 Hz high-pass and broad 5000 Hz band-pass. Its gain values cannot be copied directly onto current white noise because the source RMS and filters differ. The inspected repository file listing contains no audio recordings; this engine supplies no real button or rewind samples.

## Scoped recommendation for this player

Treat these as coloration profiles, not measured hardware simulations. Start with Light/Medium/Heavy tone targets of 9000/6200/4200 Hz low-pass and 50/80/110 Hz high-pass; keep current subtle hiss and instability initially. Add the presence/shelf stages only if listening confirms they improve the distinction. Output compensation should be measured on representative speech and music, not assumed from the legacy 0.95/0.9/0.86 gains.

Do not transplant the full legacy wow/flutter or periodic level-wander settings by default: they intentionally produce obvious degradation, and regular vibrato/breathing conflicts with the request for less obviously synthesized behavior. For a sinusoidal delay `d(t) = D sin(2πft)`, instantaneous fractional speed deviation has peak magnitude `2πfD` (derivation from the playback argument `t-d(t)`). Thus the legacy flutter alone reaches approximately 0.86%, 1.92%, and 3.61% peak deviation across its presets; these are analytical predictions, not listened measurements or weighted wow/flutter specifications. Retain the current smaller delay depths or use low-level irregular modulation for realistic profiles, reserving legacy-strength instability for an explicitly damaged-tape option.

Keep physical mechanics separate from wear profiles: changing tape coloration should not pitch-shift a real button click or make transport sounds become a fixed periodic whine. The legacy engine does not implement mechanical winding, so it cannot resolve that part of the request.

## License and attribution

The pinned [LICENSE](https://github.com/yomiplush/youtube-cassette-filter/blob/1f0150146b574b89386abeddb90e68d5fa12532d/LICENSE) is MIT, copyright © 2026 YomiPlush. If copying code or substantial portions, retain that copyright and the complete MIT permission/warranty notice in the distribution (for example, a third-party notices file), with the pinned source URL. MIT does not require a visible UI credit. This source license does not grant rights to external YouTube content or unrelated recordings. The noise generator comment names Paul Kellet, but the checkout does not include separate provenance or a separate upstream license for those coefficients; retain that comment if copying the routine, or keep the existing independently generated noise path to avoid expanding the provenance work.
