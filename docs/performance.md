# Performance maintenance

The homepage runs the static Three.js/Vue game in `public/assets`; changes to React components do not optimize this game.

## HD asset delivery

- Seven large static GLBs use the existing Draco worker decoder. All triangles remain, all texture bytes and resolutions are unchanged, and geometry uses 20-bit position/UV precision. The conversion checked materials, transforms, triangle counts and decoded positions. Maximum measured vertex displacement was 0.00000164 model units.
- `npm run assets:compress` reproduces compression from the original pre-Draco backup in `backups/performance/pre-draco`. It requires those backups. Do not recompress already quantized geometry repeatedly.
- `npm run assets:cache` generates `config/asset-versions.json` and `public/assets/asset-urls.js`. It runs before `npm run dev` and `npm run build`. Run it after changing models during an existing development session.
- `/asset-cache/<content-hash>/models/...` has one-year immutable browser caching. Next routes only the currently generated hash to each asset; arbitrary hashes return 404. Unversioned JavaScript remains revalidated, since some vendored filenames no longer reflect their contents.
- Returning visitors skip the intro boat, horizon logo and intro wordmark. The checks must run in `beforePreload`, after `game.init()` binds `game.savestate`. Checking during plugin installation causes startup to stall at 60%.
- House interiors load when opened and reuse the loaded model on subsequent visits.
- Let the game request the seven startup models after its loader initializes. The previous HTML fetch preloads competed with fonts and engine imports on mobile; removing them and preloading both visible Gilmer weights brought the measured LCP back onto the initial paint path. Loading feedback now paints without an entrance fade.
- `textResponse()` compresses complete HTML with negotiated Brotli/gzip and caches up to eight encoded representations. In this Next version the Route Handler was sending the HTML uncompressed despite `compress: true`. The final document is 212,603 bytes decoded, 31,435 bytes over Brotli or 33,871 over gzip. Content, weak ETag revalidation, `HEAD`, and SEO endpoints are preserved; `Vary` includes both Host and Accept-Encoding.
- The native GLTF `In()` loader must honor `noCache` before calling `scene.toJSON()`, on both reads and writes. Previously the HD model loaders requested `noCache: true` but still expanded geometry arrays and re-encoded texture images as base64 PNG for a disk cache. This consumed about three seconds of CPU in the local startup profile. The narrow guard removes that work; HTTP asset caching and ordinary native scene-cache hits/misses remain intact. Verify with `node scripts/check-gltf-cache.mjs`.
- `sultra-startup.js` defers optional sound preloads until the native preloader reveals the game, plus 100 ms. Music keeps its original pending promise and starts after the sound buffer arrives; user-triggered sounds retain their native loading path. This removes about 2.64 MB of audio and its decoding work from the startup path.
- The horizon logo uses lossless WebP with identical decoded pixels at 1173 × 1341 and unchanged geometry values. Regenerate with `node scripts/optimize-startup-textures.mjs` then `npm run assets:cache`; the original is retained in `backups/performance/pre-lossless`. The lightweight logo reader requires contiguous attributes, so the writer uses `VertexLayout.SEPARATE`. Terrain/grass masks remain PNG because RGB values under transparent pixels are data used by the shaders.

## Sustained rendering

- Lulo IK reuses scratch vectors and quaternions, reads already propagated world matrices, and skips hidden dancers. An equivalence test over 180 frames compared 201,600 pose scalars with no differences. Math object allocations went from 67,200 to zero; matrix updates went from 284,880 to 31,920.
- Player accessory selection is indexed once and updated when the outfit/geometry changes. Actor-specific empty geometries are disposed on detachment. Animation diagnostics reuse their objects.
- Initial player skinning reuses seven candidate slots and a stable top-four selection. All 168,712 skin indices/weights for the 21,089-vertex model are byte-identical to the prior version, including reversed bone order and additional joint-boundary cases. `node artifacts/performance/check-skinning-startup.mjs` reproduces the comparison. This changes preparation cost, not animation or physics.
- Opening the full-screen interior suspends the outdoor render loop. Closing it restores the prior running state without overriding the native phone/menu stop condition. The interior loop also stops while the document is hidden.
- Phone DOM observers ignore unrelated game text changes. Shell localization ignores text-only mutations, avoiding global scans for changing counters/typewriter text.
- Loader progress follows actual tasks. A stalled/offline/error message provides a retry action without pretending the scene is ready. Native task failures are logged instead of silently swallowed.

## Validation and limits

Local fresh-context measurements: initial encoded response bodies decreased from 27.82 MB to 18.72 MB (about 33%). The earlier pre-texture-optimization measurement was 47.56 MB. The seven Draco assets alone decreased from 17.98 MB to 8.86 MB over gzip.

The subsequent startup-only pass reduced the current 16.94 MB baseline to 14.05 MB before reveal. In the production browser test with 4 Mbps / 80 ms latency, a cold first visit revealed in 36.46 seconds, a cached intro in 9.91 seconds, and a saved returning player in 10.57 seconds. All six house/monument templates and the character were ready; the first visit also had the boat, logo and wordmark ready. No audio completed before reveal, no GLB was downloaded twice, and returning players requested none of the three intro-only data assets. These checks passed with no page errors or failed requests; see `startup-final.json`. Native intro music and ambience playback after reveal were separately verified in `startup-audio-check.json`.

Evidence is in `artifacts/performance/`: `performance-current.json`, `network-hd-fixed.json`, `geometry-compression.json`, `render-equivalence.json`, and `interior-performance.json`. Three consecutive interior open/close cycles reused one model request and produced no page errors; the hidden outdoor frame count stopped during each visit and resumed afterward.

These are local functional and workload measurements, not a promised FPS or loading duration on every device/network. Headless software WebGL was too slow to give representative FPS figures. A proposed collision rewrite was reverted after a floor-penetration regression; the original contact math is retained.

Production build and targeted ESLint checks pass. When replacing the vendored engine, preserve the preloader factory/error integration and custom plugin imports.

## Mobile Lighthouse investigation (2026-10-23)

The user's screenshot showed 33 but did not include its URL or individual metrics. It is not the same measurement as the previous local network tests. A first Lighthouse attempt with the old headless-shell browser used SwiftShader and failed Speed Index; that incomplete run is excluded.

The comparison below uses production `localhost:3001`, Lighthouse 13.4.1, the standard simulated mobile profile (1.6 Mbps / 150 ms RTT / 4x CPU), and full Chromium with the AMD Radeon 780M enabled. It uses the automatic game startup with all HD assets; no click-to-start or bot-specific path was added.

| Metric | Before this pass | After this pass |
| --- | ---: | ---: |
| Performance score | 29 | 56 |
| First Contentful Paint | 2.91 s | 2.12 s |
| Largest Contentful Paint | 16.29 s | 2.49 s |
| Total Blocking Time | 19.66 s | 3.60 s |
| Speed Index | 32.71 s | 9.11 s |
| Layout shift | 0.073 | 0.073 |

Both reports completed without Lighthouse warnings: `artifacts/performance/lighthouse-mobile-gpu-before.json` and `lighthouse-mobile-gpu-final.json`. These are local lab scores, not a deployed PageSpeed retest or a guarantee on other devices. Blocking time remains above the recommended range, with shader compilation and first-frame preparation still significant. LCP measures the HTML loading screen, not the instant the entire 3D world is ready.

`gltf-cache-browser.json` independently verifies all six house/monument templates, player, boat and logo ready with zero page errors and zero canvas PNG encodes. `html-delivery.json` checks byte-identical decompression, accepted encoding preferences, 304, HEAD and SEO endpoints. `startup-mobile-fast.json` records separate 4 Mbps / 80 ms checks on the GPU browser: cold reveal 30.56 seconds, cached intro 2.06 seconds, returning player 4.62 seconds. All passed without page errors, failed requests, duplicate GLB downloads or audio finishing before reveal. The cold visit still downloads about 14 MB of HD assets; these actual game-reveal timings are separate from Lighthouse's simulated loading-screen metrics. They also use a different renderer from the older 36.46-second software-WebGL test, so that older result is not a controlled comparison.

To reproduce mobile reveal checks against a running production server and GPU browser: set `SULTRA_TEST_CDP=http://localhost:9334`, `SULTRA_TEST_MOBILE=1`, then run `node artifacts/performance/check-startup-final.cjs startup-mobile-fast`. Keep the native readiness barrier: all visible scene assets and prerendering must finish before dismissing the loader.

## Approved distance streaming and CPU batching (2026-10-23)

This section supersedes the historical six-model startup requirement above. The user explicitly approved loading distant houses/monuments progressively. The offshore introduction now downloads none of those six models before reveal; returning visitors await their nearest model. Later requests follow the actor within a 95-unit radius, one house/monument at a time, after scene position/physics are ready. Map destinations await their model before teleporting. Terrain and procedural monument boundaries remain ready independently of streamed HD visuals.

The full shell CSS is an external nonblocking stylesheet with the existing loading appearance retained inline. About, interior code/CSS, the interior model and the sound-effect sprite load on first use. Intro music still plays after reveal. Models retain their existing Draco compression, textures and geometry quality. The asset loader now clears rejected in-flight promises so a failed connection can actually retry. Shared HD textures upload in small tasks before native prerender, and the grass loop omits unused quaternion calculations with byte-identical output.

Controlled local mobile tests use the same full GPU Chromium, production server and 4 Mbps / 80 ms connection as `startup-mobile-fast.json`:

| Actual game readiness | Previous pass | Final streaming pass |
| --- | ---: | ---: |
| Cold first visit | 30.56 s | 15.26 s |
| Encoded asset bodies before reveal | 14.07 MB | 6.80 MB |
| Cached introduction | 2.06 s | 2.42 s |
| Saved returning player | 4.62 s | 4.72 s |

Cold-start bytes decreased by 52%, and time to the actual opening scene decreased by 50%. Cached/returning visits are not faster in this run: the readiness work remains, texture preparation now yields between tasks, and the first return downloads a nearby house that was intentionally absent from the offshore introduction. Results are in `startup-hd-streaming-final.json`; no audio completed before reveal, no GLB downloaded twice, and there were no page errors or failed requests in normal startup.

The final standard simulated mobile Lighthouse audit (`lighthouse-startup-final.json`) reports:

| Metric | Previous GPU pass | Final streaming pass |
| --- | ---: | ---: |
| Performance score | 56 | 60 |
| FCP | 2.12 s | 1.74 s |
| LCP | 2.49 s | 2.42 s |
| TBT | 3.60 s | 2.14 s |
| Speed Index | 9.11 s | 8.26 s |
| Total transfer during audit | 16.74 MB | 7.47 MB |

There are no render-blocking requests in the audit. These are local lab results, separate from the user's reported deployed PageSpeed score of 61. The change does **not** achieve 90. LCP still measures the loading screen; the actual game-ready timing above is the more useful loading metric. Shader setup, physics construction and individual GPU uploads remain significant on slower devices. Do not remove the automatic HD introduction or substitute a click-to-start gate without separate concept approval.

Functional checks cover real HTTP 503 followed by a successful model retry, cancelling an older map destination, all six models attaching exactly once, unchanged procedural boundaries, walking above ground, lazy About/interior/audio use, and cancelled/repeated interior entry. Production build and targeted lint pass. Configuration examples, source-build limitations and test commands are in `loading-architecture.md`.
