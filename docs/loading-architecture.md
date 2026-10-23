# Loading and bundle architecture

The active stack is Next 16.3.8 serving a prebuilt Three.js/Vue game from `public/assets`. There is no Vite project, engine source tree, or source map in this repository. Adding `manualChunks` to a new Vite config would not split the existing vendor file. The 380 KiB transfer is also not the same thing as CPU execution time: GPU uploads, shader compilation and scene preparation are attributed to functions in that file.

## Implemented loading boundaries

```text
HTML + inline loading CSS + visible fonts
  ├─ async vendor/shell CSS (complete rules retained)
  └─ sultra-bootstrap.js
       ├─ shell-copy: localization and manifest overrides
       └─ after styles are ready: engine + visible scene models
            ├─ Draco workers decode compressed GLBs
            ├─ noCache bypasses expensive scene JSON serialization
            ├─ reveal only after native scene readiness/prerender
            └─ active music/ambience can load after reveal

About click       → import(sultra-about.js)
Enter house       → import(sultra-house-interior.js) + CSS → HD interior GLB
First sound effect → native audio loader → shared sprite (cached/reused)
```

`sultra-bootstrap.js` uses ordered imports because `sultra-shell-copy.js` changes initial app data and intercepts native content requests. Independent `async` tags would introduce an initialization race. `sultra-lazy-interior.js` shares one import promise, supports cancelling a pending open, waits for interior CSS, and retains the native room/model cache. First-time module loading reports progress and permits retry on failure.

The optional `sfx_UI_dialog_next` startup warmup is suppressed. Actual playback still uses the native loader, and music/ambience promises are retained. The sprite is about 1.97 MB; its first real effect still needs the file. Separating individual audio clips would require a new sprite manifest/asset pipeline and playback tests, rather than changing URLs without adjusting offsets.

`banua-tada.glb`, `mekongga.glb`, `laika.glb`, `opening-boat.glb`, `player-anoa.glb` and the other converted models already contain `KHR_draco_mesh_compression`. Keep the decoder worker and existing geometry-validation pipeline. Repeatedly quantizing these files would add error without addressing their texture bytes.

## Cache policy applied in next.config.ts

```ts
// Broad rule comes first; exact immutable paths override it afterward.
{ source: '/assets/:path*', headers: [
  { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }
] }
// For each actual content hash in config/asset-versions.json:
{ source: '/asset-cache/<hash>/models/<file>', headers: [
  { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
] }
```

The model entries above are generated as exact routes in the real config, not literal placeholder routes. Four unchanged font files and the Draco decoder are also immutable. Moving the broad rule first fixes it overriding the font rules. Plain model/audio URLs retain their bounded one-day policy. JavaScript and CSS with historical filenames are edited in place, so they must revalidate; browsers can reuse their bodies after a 304 without mixing stale code from a previous deployment. HTML remains private/revalidated and is compressed with Brotli/gzip.

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

## Changes requiring concept approval

The six house/monument models total about 7.3 MB transferred and are part of the opening skyline. Loading them only as the camera approaches could reduce the initial barrier, but on slow networks the visitor could see a missing object before it arrives. This has not been implemented pending the user's explicit choice. A click-to-start screen, low-resolution first scene or removal of the boat introduction likewise changes the agreed experience and is not included.

HD textures and all visible models remain in the initial readiness barrier. Thus this pass reduces unnecessary transfer and parser blocking, but cannot honestly promise a subsecond fully loaded 3D world on a slow connection.

## Reproducible checks

- `node scripts/check-startup-audio.mjs`: optional warmup, pending music and restored native API.
- `node scripts/check-gltf-cache.mjs`: noCache serialization and ordinary cache hit/miss behavior.
- `node artifacts/performance/check-loading-styles.cjs`: computed mobile/desktop loading appearance, with full CSS blocked and loaded.
- `node artifacts/performance/check-demand-features.cjs`: absent feature/audio requests before use; one download on first use; repeated About/interior use, cancelled open and outdoor pause/resume.
- Production audit isolation: set `SULTRA_BUILD_DIR=.next-performance` for both `npm run build` and `next start -p 3001`, preserving a running developer server's `.next` directory.

Results for this pass are in `lighthouse-streaming.json`, `demand-features.json`, `loading-style-parity.json` and `cache-delivery.json` under `artifacts/performance`. Lighthouse reports are local mobile simulations, not the deployed PageSpeed result.
