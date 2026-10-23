# Loading and bundle architecture

The active stack is Next 16.3.8 serving a prebuilt Three.js/Vue game from `public/assets`. There is no Vite project, engine source tree, or source map in this repository. Adding `manualChunks` to a new Vite config would not split the existing vendor file. The 380 KiB transfer is also not the same thing as CPU execution time: GPU uploads, shader compilation and scene preparation are attributed to functions in that file.

## Implemented loading boundaries

```text
HTML + inline loading CSS + visible fonts
  ├─ async vendor/shell CSS (complete rules retained)
  └─ sultra-bootstrap.js
       ├─ shell-copy: localization and manifest overrides
       └─ after styles are ready: engine + required scene assets
            ├─ Draco workers decode compressed GLBs
            ├─ noCache bypasses expensive scene JSON serialization
            ├─ reveal only after native scene readiness/prerender
            └─ active music/ambience can load after reveal

First offshore intro → no custom house/monument GLBs in startup barrier
Returning player     → nearest custom model required before reveal
Player approaches    → stream nearby HD models, one at a time
About click       → import(sultra-about.js)
Enter house       → import(sultra-house-interior.js) + CSS → HD interior GLB
First sound effect → native audio loader → shared sprite (cached/reused)
```

`sultra-bootstrap.js` uses ordered imports because `sultra-shell-copy.js` changes initial app data and intercepts native content requests. Independent `async` tags would introduce an initialization race. `sultra-lazy-interior.js` shares one import promise, supports cancelling a pending open, waits for interior CSS, and retains the native room/model cache. First-time module loading reports progress and permits retry on failure.

The optional `sfx_UI_dialog_next` startup warmup is suppressed. Actual playback still uses the native loader, and music/ambience promises are retained. The sprite is about 1.97 MB; its first real effect still needs the file. Separating individual audio clips would require a new sprite manifest/asset pipeline and playback tests, rather than changing URLs without adjusting offsets.

`banua-tada.glb`, `mekongga.glb`, `laika.glb`, `opening-boat.glb`, `player-anoa.glb` and the other converted models already contain `KHR_draco_mesh_compression`. Keep the decoder worker and existing geometry-validation pipeline. Repeatedly quantizing these files would add error without addressing their texture bytes.

## Approved distance streaming

The user explicitly approved loading distant models progressively, including possible delayed appearance on slow connections. `sultra-model-stream.js` implements a 95-world-unit radius, checks proximity at most every 500 ms, and loads one custom house or monument at a time. Completed HD templates stay cached in memory and attach once per scene. Returning to a visited site does not reload its model.

The first visit starts offshore, outside every custom site's streaming radius. Its initial barrier therefore includes zero custom house/monument models; the native boat, character, terrain and scene readiness checks remain required. A saved returning visit requires the model nearest the saved position, falling back to the normal spawn position. Proximity streaming starts after reveal; on the main island it additionally waits for physics readiness, the player body and the end of scene transitions, so temporary spawn coordinates do not trigger unrelated downloads. Intro coordinates are converted back from the preview island transform before checking distance.

Phone-map travel prioritizes the selected model and waits for it before teleporting. A status message remains visible while it loads. A navigation generation counter prevents an older pending choice from teleporting the player after they select a different destination. Guide destinations that do not have a model need no extra GLB request.

Failed nearby downloads wait 30 seconds before an automatic retry; an explicit destination request can retry immediately. The native vendor asset loader now clears its in-flight promise on both success and failure, allowing those retries to make a fresh request. Required startup-model failures propagate to the native loading error/reload flow rather than reporting a ready but incomplete scene.

Terrain and rock collision loading stays in the native readiness flow. Both monument collision footprints and their lightweight procedural rope boundaries are created from layout data independently of HD model downloads, making boundaries visible while a model is delayed. Incremental house attachment preserves existing interactions and open UI; scene changes dispose procedural rope geometry without disposing the retained model templates.

The HD model assets and the boat introduction are retained. This changes when distant objects arrive, not their final geometry or texture quality. The initial scene still needs its required assets and GPU preparation; distance streaming does not guarantee a subsecond fully loaded world on a slow connection.

## Cache policy applied in next.config.ts

```ts
const assetHeaders = [
  // Broad binary-asset rule comes first.
  { source: '/assets/:path*', headers: [
    { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=86400' }
  ] },
  // Historical build filenames are edited in place; revalidate code.
  ...['js', 'css'].map(extension => ({
    source: `/assets/:file(.*\\.${extension})`, headers: [
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }
    ]
  })),
  // assetVersions is imported from config/asset-versions.json.
  ...Object.entries(assetVersions).map(([asset, version]) => ({
    source: `/asset-cache/${version}${asset}`, headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
    ]
  })),
];
```

The model entries above are generated as exact routes. The one-year immutable rules for content-hashed models, fonts and the Draco decoder follow the broad rule and the JS/CSS overrides. Moving the broad rule first prevents it from overriding the font rules. Native binaries under `/assets` are fresh for five minutes and may be served stale while revalidating for one day, so repeated scene loaders can reuse them. Plain `/models` and `/audio` URLs retain their separate one-day fresh window and seven-day stale-while-revalidate policy. JavaScript and CSS with historical filenames must revalidate; browsers can reuse their bodies after a 304 without mixing stale code from a previous deployment. HTML remains private/revalidated and is compressed with Brotli/gzip.

Next config supplies these headers on Vercel too; a second overlapping `vercel.json` policy is unnecessary. A future source build should emit actual content-hashed JS/CSS, then apply the same one-year policy to those outputs. Do not mark today's edited `vendor.75f6e6ae65453426.js` immutable just because its filename looks hashed. See [Vercel cache headers](https://vercel.com/docs/caching/cache-control-headers).

All startup assets are same-origin. Extra same-origin preconnect hints cannot open a connection earlier than the document request already did. Add preconnect only if assets genuinely move to a separate CDN; do not introduce an external CDN just for a hint.

## Source-level engine splitting: proposed, not activated

Restore the engine's original ES modules and package versions before replacing the vendor build. Keep one Three.js instance shared by the engine and custom models. Use dynamic imports at actual feature boundaries (About, interior, optional minigames); preserve initialization side effects. Tree-shake unused exports from their source modules, and preserve CSS/plugin side effects. A coverage report for the opening scene alone cannot prove phone, dialog, customization or interior CSS is unused.

For a future Vite 8 source build, a starting configuration is:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    manifest: true,
    sourcemap: 'hidden',
    cssCodeSplit: true,
    rolldownOptions: {
      treeshake: true,
      output: {
        strictExecutionOrder: true,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/, priority: 20 },
            { name: 'vue', test: /node_modules[\\/](?:vue|@vue)[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
});
```

This is a migration example, not a tested build for the current static bundle. Vite's current docs use `build.rolldownOptions.output.codeSplitting`; older Vite/Rollup projects use `build.rollupOptions.output.manualChunks`. Splitting an eagerly required Three.js engine into another file improves caching boundaries but does not remove its initialization cost. See [Vite build options](https://vite.dev/guide/build.html#chunking-strategy) and [Rolldown splitting/order](https://rolldown.rs/reference/OutputOptions.codeSplitting).

For an existing **Vite 7/Rollup source project**, the equivalent grouping is:

```js
build: {
  cssCodeSplit: true,
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (/node_modules[\\/]three[\\/]/.test(id)) return 'three';
        if (/node_modules[\\/](?:vue|@vue)[\\/]/.test(id)) return 'vue';
      },
    },
  },
}
```

Neither example is an active configuration in this Next repository. The shipped feature-level dynamic imports are active; rebuilding/tree-shaking the original engine vendor still requires its source project.

## First-render CPU work

The startup profile identifies texture uploads, shader setup, grass generation and physics acceleration-structure construction inside the vendor's callers. Parsing the vendor file is a small part of its attributed time. File splitting alone cannot remove those operations.

`sultra-texture-warmup.js` collects shared textures on visible materials and initializes them with the existing renderer in approximately 6 ms batches, yielding between batches and before the first draw. The native prerender promise awaits completion. Render targets, depth textures, incomplete cube faces and videos without a frame retain their normal loading path. Texture pixels, dimensions, samplers and quality are unchanged. One GPU upload cannot be interrupted, so this is a best-effort budget rather than a guarantee of zero long tasks. See [Three.js initTexture](https://threejs.org/docs/pages/WebGLRenderer.html#initTexture) and [scheduler.yield](https://developer.chrome.com/blog/use-scheduler-yield?hl=en).

The native grass loop also calculated the same unused Euler/quaternion for every blade. Only that redundant work was removed. Seeded comparisons against a fixed original fixture verify byte-identical instance buffers, RNG consumption, counts and uniforms for 92,000 and 184,000 candidate blades at both tested radii. Terrain collision math remains unchanged.

## Reproducible checks

- `node scripts/check-startup-audio.mjs`: optional warmup, pending music and restored native API.
- `node scripts/check-gltf-cache.mjs`: noCache serialization and ordinary cache hit/miss behavior.
- `node scripts/check-model-stream.mjs`: nearest selection, radius/throttle, serial requests, urgent queue ordering, deduplication, automatic backoff and explicit retry.
- `node scripts/check-asset-retry.mjs`: native asset promise cleanup and successful retry after failure, without unhandled rejections.
- `node scripts/check-grass-geometry.mjs`: exact original-versus-current geometry equivalence.
- `node scripts/check-texture-warmup.mjs`: shared texture deduplication, image/cube/video readiness, hidden material exclusion, yields, timer fallback and error propagation.
- `node artifacts/performance/check-loading-styles.cjs`: computed mobile/desktop loading appearance, with full CSS blocked and loaded.
- `node artifacts/performance/check-demand-features.cjs`: absent feature/audio requests before use; one download on first use; repeated About/interior use, cancelled open and outdoor pause/resume.
- `node artifacts/performance/check-distance-streaming.cjs`: no custom models during offshore startup, real GLB 503/retry, proximity requests, immediate rope boundaries, latest-choice map travel, all six models attached once and player movement above ground.
- `node artifacts/performance/check-startup-final.cjs startup-distance-streaming`: cold/cached/returning visits at 4 Mbps and 80 ms latency; zero initial custom models for intro, one for a returning visit, no initial audio or duplicate GLB transfers. Set `SULTRA_TEST_CDP=http://localhost:9334` to use the GPU-enabled audit browser.
- Production audit isolation: set `SULTRA_BUILD_DIR=.next-performance` for both `npm run build` and `next start -p 3001`, preserving a running developer server's `.next` directory.

Functional streaming evidence is in `distance-streaming.json`; feature, style and cache checks are in `demand-features.json`, `loading-style-parity.json` and `cache-delivery.json` under `artifacts/performance`. Final connection-limited results are in `startup-hd-streaming-final.json`, and the final mobile audit is `lighthouse-startup-final.json`. The earlier `lighthouse-streaming.json` predates distance-based model streaming; do not treat it as the final streaming benchmark. Lighthouse reports are local mobile simulations, not the deployed PageSpeed result. See `docs/performance.md` for measurements and remaining limits.
