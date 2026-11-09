# Case refinement, adaptive quality and reversing

## Original reference

The user's [BCN article dated April 29, 2018](https://www.bcnretail.com/market/detail/20180429_59290.html) contrasts manual cassette removal/turning with auto-reverse transport and discusses the loss of contemporary supply for those mechanisms at that time. It is a historical design reference, not evidence about today's market. No article images, manufacturer logos, enclosure geometry or text excerpts are distributed.

NEO NC-85 and NR-88 remain original fictional models. NR-88 models closed-door direction/head switching, not a tape physically flipping inside the chassis. The current interface continuously alternates both sides from zero until STOP; this is an explicit interface decision, not a claim about every historical deck. Its 48–88px case depth versus the manual model's 50–96px is an illustrative CSS dimension, not a measured hardware specification.

## Browser rendering limits and choices

- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) supplies visible-frame timing. The governor samples the unthrottled callback stream, separately from its throttled pose updates. Hidden/resume gaps reset evidence; two seconds of sustained pressure reduces quality and twelve seconds of stable headroom allows recovery.
- [navigator.deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory) is optional and approximate. Missing hints start at Balanced. The player does not require this API or use browser-name sniffing. Manual overrides are retained because hints alone cannot establish rendering capability.
- [backface-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/backface-visibility) handles compositor-interpolated turns. At settled poses and during directly manipulated poses, face-normal calculations hide surfaces facing away without removing their layout dimensions. All surfaces remain available while a compositor transition is in flight.
- The old nonrotating top/bottom strips were a layout artifact: those decorations were siblings of the 3D object. They are removed in favor of the object's existing actual top/bottom faces.
- Texture levels rasterize original SVG artwork at half or three-quarter intrinsic dimensions. Native control text and geometry are not rasterized or scaled. There is no WebGL render target or FSR upscaler, so claiming whole-model pixel resolution or FSR would be inaccurate.

The quality policy has deterministic tests. Browser tests verify literal low-tier asset selection, fixed control size, geometry bounds, face visibility, manual/auto model selection and cancellation. Performance on physical low-end phones remains device-dependent; these checks do not establish a universal FPS claim.
