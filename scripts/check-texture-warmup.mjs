import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/assets/sultra-texture-warmup.js', import.meta.url), 'utf8');
assert.equal((source.match(/export async function prepareSceneTextures/g) || []).length, 1);

function harness({ scheduler = true, uploadCost = 2, failAt } = {}) {
  let now = 0;
  const events = [], calls = [];
  const globals = {
    performance: { now: () => now },
    setTimeout(callback, delay) {
      events.push({ type: 'timeout', delay });
      queueMicrotask(callback);
    },
  };
  if (scheduler) globals.scheduler = {
    yield() { events.push({ type: 'yield' }); return Promise.resolve(); },
  };
  const prepare = runInNewContext(`${source.replace('export async function', 'async function')}; prepareSceneTextures;`, globals);
  const renderer = {
    initTexture(texture) {
      events.push({ type: 'upload', id: texture.id });
      calls.push(texture);
      now += uploadCost;
      if (texture.id === failAt) throw new Error(`GPU upload failed: ${texture.id}`);
    },
  };
  return { prepare, renderer, events, calls };
}

const texture = (id, properties = {}) => ({ id, isTexture: true, image: { complete: true }, ...properties });
function scene(objects, properties = {}) {
  return {
    ...properties,
    traverseVisible(callback) {
      callback(this);
      for (const object of objects) if (object.visible !== false) callback(object);
    },
  };
}

async function sharedTexturesAndUniformArrays() {
  const test = harness();
  const shared = texture('shared');
  const map = texture('map');
  const arrayMap = texture('uniform-array');
  const data = texture('data-texture', { image: { data: new Uint8Array(4), width: 1, height: 1 } });
  const root = scene([
    { material: { map: shared, normalMap: map, uniforms: { maps: { value: [shared, arrayMap, data] } } } },
    { material: [{ map: shared }, { uniforms: { maps: { value: [[arrayMap], map] } } }] },
  ], { background: shared, environment: shared });
  await test.prepare(test.renderer, root);
  assert.deepEqual(test.calls.map(item => item.id), ['shared', 'map', 'uniform-array', 'data-texture']);
  assert.equal(new Set(test.calls).size, test.calls.length, 'Each shared GPU texture must be initialized once');
  console.log('PASS shared maps, scene textures, material arrays, uniform arrays, and data textures');
}

async function skippedTexturesAndHiddenMaterials() {
  const test = harness();
  const valid = texture('visible');
  const root = scene([
    { material: { map: texture('target', { isRenderTargetTexture: true }) } },
    { material: { map: texture('depth', { isDepthTexture: true }) } },
    { material: { map: texture('unloaded', { image: undefined }) } },
    { material: { map: texture('loading-image', { image: { complete: false } }) } },
    { material: { visible: false, map: texture('hidden-material'), uniforms: { map: { value: texture('hidden-uniform') } } } },
    { visible: false, material: { map: texture('hidden-object') } },
    { material: [null, { visible: false, map: texture('hidden-array-material') }, { map: valid }] },
    { material: { map: null, normalMap: { image: { complete: true } } } },
  ]);
  await test.prepare(test.renderer, root);
  assert.deepEqual(test.calls, [valid], 'Only loaded textures on visible materials should upload');
  console.log('PASS render targets, depth maps, unloaded images, and hidden materials are skipped');
}

async function cubeAndVideoReadiness() {
  const test = harness();
  const completeCube = texture('cube-ready', { image: Array.from({ length: 6 }, () => ({ complete: true })) });
  const incompleteCube = texture('cube-loading', {
    image: [...Array.from({ length: 5 }, () => ({ complete: true })), { complete: false }],
  });
  const missingCubeFace = texture('cube-missing-face', {
    image: [...Array.from({ length: 5 }, () => ({ complete: true })), undefined],
  });
  const dataCube = texture('cube-data-faces', {
    image: Array.from({ length: 6 }, (_, index) => texture(`face-${index}`, {
      image: { data: new Uint8Array(4), width: 1, height: 1 },
    })),
  });
  const metadataVideo = texture('video-metadata', { image: { videoWidth: 640, readyState: 1 } });
  const readyVideo = texture('video-ready', { image: { videoWidth: 640, readyState: 2 } });
  const maps = [completeCube, incompleteCube, missingCubeFace, dataCube, metadataVideo, readyVideo];
  await test.prepare(test.renderer, scene(maps.map(map => ({ material: { map } }))));
  assert.deepEqual(test.calls, [completeCube, dataCube, readyVideo],
    'Cube faces and video frames must all be ready before warmup uploads them');
  console.log('PASS complete/incomplete cube faces and video frame readiness');
}

async function boundedUploadBatches() {
  const test = harness({ uploadCost: 2 });
  const maps = Array.from({ length: 8 }, (_, index) => texture(`map-${index}`));
  await test.prepare(test.renderer, scene(maps.map(map => ({ material: { map } }))));
  assert.equal(test.events[0].type, 'yield', 'Warmup must allow a paint before starting GPU uploads');
  assert.equal(test.events.at(-1).type, 'yield', 'The first native render must start in a fresh task');
  let uploadsSinceYield = 0;
  const batches = [];
  for (const event of test.events) {
    if (event.type === 'upload') uploadsSinceYield++;
    else if (uploadsSinceYield) { batches.push(uploadsSinceYield); uploadsSinceYield = 0; }
  }
  assert.deepEqual(batches, [3, 3, 2], '2ms uploads should yield after each 6ms batch');
  assert.deepEqual(test.calls, maps, 'Yielding must preserve upload order and completeness');

  const slow = harness({ uploadCost: 9 });
  await slow.prepare(slow.renderer, scene(maps.slice(0, 3).map(map => ({ material: { map } }))));
  const eventKinds = slow.events.map(event => event.type);
  for (let index = 0; index < eventKinds.length - 1; index++) {
    if (eventKinds[index] === 'upload') assert.equal(eventKinds[index + 1], 'yield',
      'A single expensive texture cannot be split, but must yield before another upload');
  }
  console.log('PASS initial/final yields, bounded batches, and yielding after expensive textures');
}

async function failurePropagation() {
  const test = harness({ failAt: 'broken' });
  const maps = [texture('before'), texture('broken'), texture('after')];
  await assert.rejects(test.prepare(test.renderer, scene(maps.map(map => ({ material: { map } })))),
    /GPU upload failed: broken/);
  assert.deepEqual(test.calls.map(item => item.id), ['before', 'broken'],
    'Upload failures must propagate to the readiness barrier and stop subsequent uploads');
  console.log('PASS upload failures propagate');
}

async function fallbackAndOptionalCapabilities() {
  const test = harness({ scheduler: false });
  const map = texture('fallback');
  await test.prepare(test.renderer, scene([{ material: { map } }]));
  assert.deepEqual(test.calls, [map]);
  assert.deepEqual(test.events, [
    { type: 'timeout', delay: 0 }, { type: 'upload', id: 'fallback' }, { type: 'timeout', delay: 0 },
  ], 'Browsers without scheduler.yield must retain task boundaries through timers');

  const noCapabilities = harness();
  await noCapabilities.prepare({}, scene([]));
  await noCapabilities.prepare(noCapabilities.renderer, {});
  await noCapabilities.prepare(null, null);
  assert.deepEqual(noCapabilities.events, [], 'Unsupported renderers/scenes should safely skip warmup');
  console.log('PASS timer fallback and missing optional capabilities');
}

for (const check of [sharedTexturesAndUniformArrays, skippedTexturesAndHiddenMaterials, cubeAndVideoReadiness,
  boundedUploadBatches, failurePropagation, fallbackAndOptionalCapabilities]) await check();
console.log('Texture warmup: 6 checks passed.');
