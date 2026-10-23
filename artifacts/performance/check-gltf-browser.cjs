const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9334');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__gltfAudit = [];
    window.__cachePuts = [];
    window.__pngEncodes = [];
    const put = Cache.prototype.put;
    Cache.prototype.put = function(key, value) {
      window.__cachePuts.push(typeof key === 'string' ? key : key.url);
      return put.call(this, key, value);
    };
    const encode = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      window.__pngEncodes.push({ width: this.width, height: this.height, stack: new Error().stack });
      return encode.apply(this, args);
    };
    let seen = false;
    const observer = new MutationObserver(() => {
      if (document.querySelector('#preloader')) seen = true;
      else if (seen) { window.__readyAt = performance.now(); observer.disconnect(); }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  // Instrument only the loader entry; execute the actual production cache guards.
  await page.route('**/webgl.3250e36a65453426.js', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const signature = 'async function In(e,t={}){';
    assert.equal(source.split(signature).length, 2);
    await route.fulfill({ response, body: source.replace(signature,
      signature + 'window.__gltfAudit.push({url:e,noCache:!!t.noCache,character:!!t.character});') });
  });
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__readyAt), null, { timeout: 60000 });
  const report = await page.evaluate(async () => {
    const game = (await import('/assets/vendor.75f6e6ae65453426.js')).b.$webgl;
    return { readyMs: window.__readyAt, scene: game.scenes.current.id,
      character: game.playerCharacter.status, houseTemplates: game.sultraIsland.templates.size,
      boat: game.openingBoat.status, logo: game.munasLandmark.status,
      calls: window.__gltfAudit, puts: window.__cachePuts, pngEncodes: window.__pngEncodes };
  });
  report.errors = errors;
  assert.equal(report.character, 'ready');
  assert.equal(report.houseTemplates, 6);
  assert.equal(report.boat, 'ready');
  assert.equal(report.logo, 'ready');
  assert.deepEqual(errors, []);
  const uncached = report.calls.filter(call => call.noCache);
  assert.ok(uncached.length >= 9, 'Missing expected houses/player/accessories');
  // Native tree assets can also be requested by the ordinary cache-enabled
  // island loader; only exclusive noCache URLs must have no cache writes.
  for (const call of uncached.filter(item => !report.calls.some(other =>
    other.url === item.url && !other.noCache && !other.character))) {
    assert.ok(!report.puts.some(key => key.includes(call.url + '.scene.json')), 'Serialized uncached GLB: ' + call.url);
  }
  fs.writeFileSync('artifacts/performance/gltf-cache-browser.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ readyMs: report.readyMs, character: report.character,
    houseTemplates: report.houseTemplates, uncachedModels: uncached.length,
    cachePuts: report.puts.length, pngEncodes: report.pngEncodes.length, errors }));
  await context.close();
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
