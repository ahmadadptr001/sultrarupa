import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the shipped loader, including its call to Object3D.toJSON(). This
// catches expensive serialization occurring before a cache wrapper can skip it.
const bundle = readFileSync(new URL('../public/assets/webgl.3250e36a65453426.js', import.meta.url), 'utf8');
const start = bundle.indexOf('async function In(e,t={}){');
const end = bundle.indexOf('async function Cn(', start);
assert.ok(start > 0 && end > start, 'Native GLTF loader signature changed; review this check');
const loaderSource = bundle.slice(start, end);

function makeLoader({ hit = false, forbidSerialization = false } = {}) {
  const calls = { get: 0, add: 0, load: 0, serialize: 0, onLoad: 0 };
  const scene = {
    updateMatrixWorld() {},
    traverse() {},
    toJSON() {
      calls.serialize++;
      assert.equal(forbidSerialization, false, 'Uncached GLB serialized geometry/textures');
      return { scene: 'serialized' };
    },
  };
  const gltf = { scene, animations: ['retained'] };
  const cache = {
    async get() { calls.get++; return hit ? { scene: 'cached' } : false; },
    async add() { calls.add++; },
  };
  const load = vm.runInNewContext(`(${loaderSource})`, {
    s: () => ({ resources: { supercache: cache } }),
    An: { load(url, done) { calls.load++; done(gltf); } },
    On: { parse: (data) => data },
  });
  return { load, calls, gltf, onLoad() { calls.onLoad++; } };
}

for (const options of [{ noCache: true }, { character: true }]) {
  const check = makeLoader({ hit: true, forbidSerialization: true });
  const result = await check.load('/model.glb', { ...options, onLoad: check.onLoad });
  assert.equal(result, check.gltf);
  assert.deepEqual(check.calls, { get: 0, add: 0, load: 1, serialize: 0, onLoad: 1 });
}

const miss = makeLoader();
assert.equal(await miss.load('/model.glb', { onLoad: miss.onLoad }), miss.gltf);
assert.deepEqual(miss.calls, { get: 1, add: 1, load: 1, serialize: 1, onLoad: 1 });

const hit = makeLoader({ hit: true });
assert.equal((await hit.load('/model.glb', { onLoad: hit.onLoad })).scene.scene, 'cached');
assert.deepEqual(hit.calls, { get: 1, add: 0, load: 0, serialize: 0, onLoad: 1 });
console.log('GLTF cache: noCache/character avoid serialization; ordinary cache hit/miss behavior passes.');
