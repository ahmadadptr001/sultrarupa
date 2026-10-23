const http = require('node:http');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { gunzipSync, brotliDecompressSync } = require('node:zlib');

function get(headers, path = '/') {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, { headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, bytes: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}
(async () => {
  const plain = await get({ 'Accept-Encoding': 'identity' });
  assert.equal(plain.status, 200);
  assert.equal(plain.headers['content-encoding'], undefined);
  const reports = [];
  for (const [accept, expected] of [
    ['gzip, deflate, br', 'br'], ['gzip', 'gzip'],
    ['br;q=0, gzip', 'gzip'], ['br;q=0.4, gzip;q=0.8', 'gzip'],
    ['br;q=0, gzip;q=0', undefined], ['gzip;q=0.5, identity;q=1', undefined],
    ['*;q=0.5, br;q=0', 'gzip'],
  ]) {
    const response = await get({ 'Accept-Encoding': accept });
    assert.equal(response.headers['content-encoding'], expected);
    const decoded = expected === 'br' ? brotliDecompressSync(response.bytes)
      : expected === 'gzip' ? gunzipSync(response.bytes) : response.bytes;
    assert.deepEqual(decoded, plain.bytes, 'Compression changed the HTML');
    assert.equal(response.headers.etag, plain.headers.etag);
    assert.match(response.headers.vary, /Accept-Encoding/i);
    reports.push({ accept, encoding: expected ?? 'identity', bytes: response.bytes.length });
  }
  const cached = await get({ 'Accept-Encoding': 'br', 'If-None-Match': plain.headers.etag });
  assert.equal(cached.status, 304);
  assert.equal(cached.bytes.length, 0);
  const head = await fetch('http://localhost:3001/', { method: 'HEAD', headers: { 'Accept-Encoding': 'br' } });
  assert.equal(head.status, 200);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    const response = await get({ 'Accept-Encoding': 'br' }, path);
    assert.equal(response.status, 200);
    assert.ok(response.bytes.length > 0);
  }
  const report = { originalBytes: plain.bytes.length, reports, htmlIdentical: true, etag304: true, head: true, seoRoutes: true };
  fs.writeFileSync('artifacts/performance/html-delivery.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
