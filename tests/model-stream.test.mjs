import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/assets/sultra-model-stream.js', import.meta.url), 'utf8');
const { createModelStream } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup(connection = { effectiveType: '4g' }) {
  const started = [], jobs = new Map();
  const stream = createModelStream(['a', 'b', 'c', 'd'].map((id, i) => ({ id, x: i * 10, z: 0 })), id => {
    started.push(id);
    return new Promise((resolve, reject) => jobs.set(id, { resolve, reject }));
  }, { radius: 12, connection });
  return { stream, started, jobs, connection };
}
test('parallelism is bounded and requests are deduplicated', async () => {
  const { stream, started, jobs } = setup();
  const a = stream.request('a'), b = stream.request('b'), c = stream.request('c');
  assert.equal(stream.request('a'), a);
  await flush(); assert.deepEqual(started, ['a', 'b']);
  jobs.get('a').resolve(); await flush(); assert.deepEqual(started, ['a', 'b', 'c']);
  jobs.get('b').resolve(); jobs.get('c').resolve(); await Promise.all([a, b, c]);
  await stream.request('a'); assert.equal(started.length, 3);
});
test('slow connection limits background work but selected destination does not wait behind it', async () => {
  const { stream, started, jobs } = setup({ effectiveType: '3g' });
  stream.update(0, 0, 0); await flush(); assert.deepEqual(started, ['a']);
  const selected = stream.request('d', true); await flush(); assert.deepEqual(started, ['a', 'd']);
  jobs.get('a').resolve(); jobs.get('d').resolve(); await selected;
});
test('queued selected destination takes precedence over background requests', async () => {
  const { stream, started, jobs } = setup();
  const promises = ['a', 'b', 'c', 'd'].map(id => stream.request(id));
  assert.equal(stream.request('d', true), promises[3]);
  await flush(); jobs.get('a').resolve(); await flush(); assert.deepEqual(started, ['a', 'b', 'd']);
  jobs.get('b').resolve(); await flush(); jobs.get('c').resolve(); jobs.get('d').resolve();
  await Promise.all(promises);
});
test('proximity is reconsidered after moving instead of queuing distant assets', async () => {
  const { stream, started, jobs } = setup();
  stream.update(0, 0, 0); await flush(); assert.deepEqual(started, ['a', 'b']);
  jobs.get('a').resolve(); jobs.get('b').resolve(); await flush();
  stream.update(30, 0, 600); await flush(); assert.deepEqual(started, ['a', 'b', 'd', 'c']);
  jobs.get('c').resolve(); jobs.get('d').resolve(); await flush();
});
test('failed selected destination can retry without blocking the queue', async () => {
  const { stream, jobs, started } = setup();
  const failed = stream.request('a'); const rejection = assert.rejects(failed, /offline/);
  await flush(); jobs.get('a').reject(new Error('offline')); await rejection; await flush();
  const retried = stream.request('a', true); await flush(); assert.deepEqual(started, ['a', 'a']);
  jobs.get('a').resolve(); await retried;
});
