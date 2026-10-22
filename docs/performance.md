# Performance maintenance

The homepage runs the static Three.js/Vue game in `public/assets`; changes to React components do not optimize this game.

## HD asset delivery

- Seven large static GLBs use the existing Draco worker decoder. All triangles remain, all texture bytes and resolutions are unchanged, and geometry uses 20-bit position/UV precision. The conversion checked materials, transforms, triangle counts and decoded positions. Maximum measured vertex displacement was 0.00000164 model units.
- `npm run assets:compress` reproduces compression from the original pre-Draco backup in `backups/performance/pre-draco`. It requires those backups. Do not recompress already quantized geometry repeatedly.
- `npm run assets:cache` generates `config/asset-versions.json` and `public/assets/asset-urls.js`. It runs before `npm run dev` and `npm run build`. Run it after changing models during an existing development session.
- `/asset-cache/<content-hash>/models/...` has one-year immutable browser caching. Next routes only the currently generated hash to each asset; arbitrary hashes return 404. Unversioned JavaScript remains revalidated, since some vendored filenames no longer reflect their contents.
- Returning visitors skip the intro boat, horizon logo and intro wordmark. The checks must run in `beforePreload`, after `game.init()` binds `game.savestate`. Checking during plugin installation causes startup to stall at 60%.
- House interiors load when opened and reuse the loaded model on subsequent visits.

## Sustained rendering

- Lulo IK reuses scratch vectors and quaternions, reads already propagated world matrices, and skips hidden dancers. An equivalence test over 180 frames compared 201,600 pose scalars with no differences. Math object allocations went from 67,200 to zero; matrix updates went from 284,880 to 31,920.
- Player accessory selection is indexed once and updated when the outfit/geometry changes. Actor-specific empty geometries are disposed on detachment. Animation diagnostics reuse their objects.
- Opening the full-screen interior suspends the outdoor render loop. Closing it restores the prior running state without overriding the native phone/menu stop condition. The interior loop also stops while the document is hidden.
- Phone DOM observers ignore unrelated game text changes. Shell localization ignores text-only mutations, avoiding global scans for changing counters/typewriter text.
- Loader progress follows actual tasks. A stalled/offline/error message provides a retry action without pretending the scene is ready. Native task failures are logged instead of silently swallowed.

## Validation and limits

Local fresh-context measurements: initial encoded response bodies decreased from 27.82 MB to 18.72 MB (about 33%). The earlier pre-texture-optimization measurement was 47.56 MB. The seven Draco assets alone decreased from 17.98 MB to 8.86 MB over gzip.

Evidence is in `artifacts/performance/`: `performance-current.json`, `network-hd-fixed.json`, `geometry-compression.json`, `render-equivalence.json`, and `interior-performance.json`. Three consecutive interior open/close cycles reused one model request and produced no page errors; the hidden outdoor frame count stopped during each visit and resumed afterward.

These are local functional and workload measurements, not a promised FPS or loading duration on every device/network. Headless software WebGL was too slow to give representative FPS figures. A proposed collision rewrite was reverted after a floor-penetration regression; the original contact math is retained.

Production build and targeted ESLint checks pass. When replacing the vendored engine, preserve the preloader factory/error integration and custom plugin imports.
