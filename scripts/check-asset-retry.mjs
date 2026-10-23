import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the shipped loader, without importing its browser/DOM dependencies.
const assets = new URL('../public/assets/', import.meta.url);
const vendors = readdirSync(assets).filter(name => /^vendor\.[^.]+\.js$/.test(name));
assert.equal(vendors.length, 1, 'Expected exactly one shipped vendor bundle');
const source = readFileSync(new URL(vendors[0], assets), 'utf8');
const start = source.indexOf('const Zb=');
const end = source.indexOf(',$b=', start);
assert.ok(start >= 0 && end > start, 'Could not locate the exact shipped Zb loader');
const loaderCode = source.slice(start + 'const Zb='.length, end);

function createHarness() {
  const cache = new Map();
  const inFlight = {};
  const calls = [];
  const pending = [];
  const Wb = {
    get: key => cache.get(key),
    add: (key, value) => cache.set(key, value),
    list: () => Object.fromEntries(cache),
  };
  const jb = {
    controlled: {
      function(url, options) {
        calls.push({ url, options });
        return new Promise((resolve, reject) => pending.push({ resolve, reject }));
      },
    },
  };
  const loader = runInNewContext(`(${loaderCode})`, { Wb, qb: inFlight, jb, Promise });
  return { loader, cache, inFlight, calls, pending };
}

const options = { loader: 'controlled', noCache: true };
const nextTurn = () => new Promise(resolve => setImmediate(resolve));
const unhandled = [];
const onUnhandled = reason => unhandled.push(reason);
process.on('unhandledRejection', onUnhandled);

try {
  {
    const { loader, inFlight, calls, pending } = createHarness();
    const url = '/models/destination.glb';
    const first = loader.load(url, options);
    const concurrent = loader.load(url, options);
    assert.equal(concurrent, first, 'Concurrent requests for one URL must share the same promise');
    assert.equal(calls.length, 1, 'A shared request must invoke the underlying loader only once');
    assert.equal(inFlight[url], first);

    const rejected = assert.rejects(first, /Temporary network failure/);
    pending[0].reject(new Error('Temporary network failure'));
    await rejected;
    assert.equal(inFlight[url], null, 'A rejected promise must leave the in-flight cache');
    await nextTurn();
    assert.deepEqual(unhandled, [], 'Failure cleanup must not create an unhandled rejected promise');

    const retry = loader.load(url, options);
    assert.notEqual(retry, first, 'Retry must create a fresh request after rejection');
    assert.equal(loader.load(url, options), retry, 'Concurrent retries must also deduplicate');
    assert.equal(calls.length, 2);
    const model = { name: 'Recovered destination model' };
    pending[1].resolve(model);
    assert.equal(await retry, model);
    assert.equal(inFlight[url], null, 'Successful completion must clear the in-flight promise');

    const afterSuccess = loader.load(url, options);
    assert.notEqual(afterSuccess, retry, 'An uncached completed request must not remain in-flight');
    assert.equal(calls.length, 3);
    pending[2].resolve(model);
    await afterSuccess;
    assert.equal(inFlight[url], null);
    console.log('PASS concurrent deduplication, failed request retry, and success/failure cleanup');
  }

  {
    const { loader, cache, calls, inFlight } = createHarness();
    const url = '/models/already-cached.glb';
    const model = { name: 'Cached destination model' };
    cache.set(url, model);
    assert.equal(await loader.load(url, options), model);
    assert.equal(calls.length, 0, 'Completed asset caching must still bypass network loading');
    assert.equal(inFlight[url], undefined);
    console.log('PASS completed asset cache remains independent of in-flight promises');
  }

  // Allow rejection tracking to run after all promise handlers have settled.
  await nextTurn();
  await nextTurn();
  assert.deepEqual(unhandled, [], 'Loader cleanup must never create an unhandled rejection');
  console.log('Asset retry checks passed against the exact shipped vendor loader.');
} finally {
  process.removeListener('unhandledRejection', onUnhandled);
}
