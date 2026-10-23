import assert from 'node:assert/strict';
import { createModelStream } from '../public/assets/sultra-model-stream.js';

function controlledLoader() {
  const calls = [];
  const pending = new Map();
  let active = 0, maximumActive = 0;
  return {
    calls,
    get maximumActive() { return maximumActive; },
    load(id) {
      calls.push(id);
      active++;
      maximumActive = Math.max(maximumActive, active);
      assert.equal(pending.has(id), false, `Duplicate in-flight load: ${id}`);
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    finish(id, error) {
      const task = pending.get(id);
      assert.ok(task, `No active load for ${id}`);
      pending.delete(id);
      active--;
      if (error) task.reject(error); else task.resolve();
    },
  };
}

const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
const site = (id, x, z = 0) => ({ id, x, z });

async function initialAndProximity() {
  const loader = controlledLoader();
  // Deliberately place the closest site last to verify distance selection.
  const stream = createModelStream([site('far', 1000), site('nearby', 80), site('closest', 10)], loader.load);
  const ready = stream.initial(0, 0);
  assert.deepEqual(loader.calls, ['closest'], 'Startup should require only the nearest model');
  assert.equal(stream.request('closest'), ready, 'Concurrent requests must share a promise');
  stream.update(0, 0, 1000);
  assert.deepEqual(loader.calls, ['closest'], 'Proximity updates cannot overlap the initial load');
  loader.finish('closest');
  await ready;
  assert.equal(stream.request('closest'), ready, 'A ready template must be retained');
  await stream.request('closest', true);
  assert.deepEqual(loader.calls, ['closest']);

  stream.update(0, 0, 1500);
  assert.deepEqual(loader.calls, ['closest', 'nearby']);
  stream.update(1000, 0, 2000);
  assert.deepEqual(loader.calls, ['closest', 'nearby'], 'Only one proximity load may be active');
  loader.finish('nearby');
  await settle();
  assert.deepEqual(loader.calls, ['closest', 'nearby'], 'Moving while loading must not queue an old destination');

  stream.update(0, 0, 2500);
  assert.deepEqual(loader.calls, ['closest', 'nearby'], 'Distant models must remain unloaded');
  stream.update(1000, 0, 3000);
  assert.deepEqual(loader.calls, ['closest', 'nearby', 'far'], 'Approaching a distant site must load it');
  loader.finish('far');
  await settle();
  stream.update(0, 0, 3500);
  assert.deepEqual(loader.calls, ['closest', 'nearby', 'far'], 'Returning to loaded sites must not reload them');
  assert.equal(loader.maximumActive, 1);
}

async function radiusAndThrottle() {
  const loader = controlledLoader();
  const stream = createModelStream([site('edge', 95), site('outside', 95.01)], loader.load);
  stream.update(0, 0, 1000);
  assert.deepEqual(loader.calls, ['edge']);
  loader.finish('edge');
  await settle();
  stream.update(0, 0, 1500);
  assert.deepEqual(loader.calls, ['edge'], 'The radius must exclude models outside its boundary');
  stream.update(1, 0, 1600);
  assert.deepEqual(loader.calls, ['edge'], 'Distance checks should be throttled');
  stream.update(1, 0, 2000);
  assert.deepEqual(loader.calls, ['edge', 'outside']);
  loader.finish('outside');
  await settle();
}

async function urgentQueueAndDeduplication() {
  const loader = controlledLoader();
  const stream = createModelStream(['a', 'b', 'c'].map((id, x) => site(id, x)), loader.load);
  const a = stream.request('a');
  const b = stream.request('b');
  const c = stream.request('c');
  assert.equal(stream.request('a', true), a);
  assert.equal(stream.request('b'), b);
  assert.equal(stream.request('c', true), c);
  assert.deepEqual(loader.calls, ['a']);
  loader.finish('a');
  await a;
  assert.deepEqual(loader.calls, ['a', 'c'], 'An urgent queued destination must move ahead of other queued sites');
  loader.finish('c');
  await c;
  assert.deepEqual(loader.calls, ['a', 'c', 'b']);
  loader.finish('b');
  await b;
  await Promise.all([stream.request('a'), stream.request('b'), stream.request('c')]);
  assert.deepEqual(loader.calls, ['a', 'c', 'b']);
  assert.equal(loader.maximumActive, 1);
}

async function automaticFailureBackoff() {
  const loader = controlledLoader();
  const stream = createModelStream([site('retry', 0)], loader.load);
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    const beforeFailure = performance.now();
    stream.update(0, 0, beforeFailure);
    loader.finish('retry', new Error('Simulated temporary network failure'));
    await settle();
    const failed = stream.entries.get('retry');
    assert.equal(failed.status, 'error');
    assert.ok(failed.retryAt >= beforeFailure + 30000, 'Automatic retries need a 30-second backoff');
    assert.equal(warnings.length, 1, 'Automatic failure must be handled and reported');
    stream.update(0, 0, failed.retryAt - 1000);
    assert.deepEqual(loader.calls, ['retry'], 'A failed model must not be fetched again during backoff');
    stream.update(0, 0, failed.retryAt + 1);
    assert.deepEqual(loader.calls, ['retry', 'retry'], 'A nearby model must retry after backoff');
    loader.finish('retry');
    await settle();
    assert.equal(failed.status, 'ready');
  } finally {
    console.warn = originalWarn;
  }
}

async function explicitRetryAndQueueRecovery() {
  const loader = controlledLoader();
  const stream = createModelStream([site('failed', 0), site('next', 1)], loader.load);
  const first = stream.request('failed');
  const rejection = assert.rejects(first, /Temporary failure/);
  const next = stream.request('next');
  loader.finish('failed', new Error('Temporary failure'));
  await rejection;
  assert.deepEqual(loader.calls, ['failed', 'next'], 'One failure must not stall the remaining queue');
  const retry = stream.request('failed', true);
  assert.notEqual(retry, first, 'An explicit retry must get a new promise');
  loader.finish('next');
  await next;
  assert.deepEqual(loader.calls, ['failed', 'next', 'failed'], 'Explicit navigation must bypass automatic backoff');
  loader.finish('failed');
  await retry;
  assert.equal(stream.entries.get('failed').status, 'ready');
  assert.equal(loader.maximumActive, 1);
}

async function emptyAndUnknownDestinations() {
  const loader = controlledLoader();
  const stream = createModelStream([], loader.load);
  await stream.initial(0, 0);
  await stream.request('non-model-guide');
  stream.update(0, 0, 1000);
  assert.deepEqual(loader.calls, [], 'Guide destinations and empty layouts must not request models');
}

for (const check of [initialAndProximity, radiusAndThrottle, urgentQueueAndDeduplication,
  automaticFailureBackoff, explicitRetryAndQueueRecovery, emptyAndUnknownDestinations]) {
  await check();
  console.log(`PASS ${check.name}`);
}
console.log('Model streaming: 6 checks passed.');
