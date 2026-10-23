const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.connectOverCDP(process.env.SULTRA_TEST_CDP || 'http://localhost:9333');
  const artifact = process.argv[2] || 'startup-final';
  const context = await browser.newContext(process.env.SULTRA_TEST_MOBILE === '1'
    ? { viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75 }
    : { viewport: { width: 1365, height: 900 } });
  const page = await context.newPage(), errors = [], failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') failures.push(request.url()); });
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(3000);
    let seen = false;
    const observer = new MutationObserver(() => {
      if (document.querySelector('#preloader')) seen = true;
      else if (seen) { window.__readyAt = performance.now(); observer.disconnect(); }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80,
    downloadThroughput: 500000, uploadThroughput: 125000, connectionType: 'cellular4g' });
  async function measure(name) {
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => Boolean(window.__readyAt), null, { timeout: 150000, polling: 100 });
    const result = await page.evaluate(async () => {
      const app = (await import('/assets/vendor.75f6e6ae65453426.js')).b, game = app.$webgl;
      const resources = performance.getEntriesByType('resource').map(r => ({ url: r.name,
        start: r.startTime, end: r.responseEnd, transfer: r.transferSize, encoded: r.encodedBodySize, initiator: r.initiatorType }));
      const beforeReveal = resources.filter(r => r.end <= window.__readyAt);
      return { readyMs: window.__readyAt, scene: game.scenes.current.id,
        savedIntroCompleted: app.$savestate.getVariable('isIntroCompleted'),
        boat: game.openingBoat.status, logo: game.munasLandmark.status,
        wordmark: game.sultraIntroWordmark.status, character: game.playerCharacter.status,
        houseTemplates: game.sultraIsland.templates.size,
        initialBytes: beforeReveal.reduce((n, r) => n + r.encoded, 0),
        initialTransfer: beforeReveal.reduce((n, r) => n + r.transfer, 0),
        initialAudio: beforeReveal.filter(r => /\.(m4a|mp3|ogg)(?:$|\?)/.test(r.url)),
        resources };
    });
    result.name = name;
    assert.equal(result.character, 'ready');
    assert.equal(result.houseTemplates, result.savedIntroCompleted ? 1 : 0, 'Only the current nearby destination belongs in startup');
    if (!result.savedIntroCompleted) {
      assert.equal(result.boat, 'ready');
      assert.equal(result.logo, 'ready');
      assert.equal(result.wordmark, 'ready');
    }
    assert.equal(result.initialAudio.length, 0, 'Audio competed before initial reveal');
    const counts = new Map();
    for (const resource of result.resources.filter(r => r.transfer > 0 && /\.glb$/.test(r.url))) {
      counts.set(resource.url, (counts.get(resource.url) || 0) + 1);
    }
    assert.ok([...counts.values()].every(count => count === 1), 'Model downloaded twice');
    console.log(JSON.stringify({ ...result, resources: undefined }));
    return result;
  }
  const reports = [await measure('cold-4Mbps'), await measure('cached-4Mbps')];
  await page.evaluate(async () => {
    const app = (await import('/assets/vendor.75f6e6ae65453426.js')).b;
    app.$savestate.setVariable('isIntroCompleted', true);
    app.$savestate.setVariable('isTutoCompleted', true);
    const save = await app.$savestate.getSaveObject();
    localStorage.setItem(app.$savestate.LS_KEY, JSON.stringify(save));
  });
  reports.push(await measure('returning-4Mbps'));
  const returning = reports[2];
  assert.equal(returning.savedIntroCompleted, true);
  assert.equal(returning.scene, 'IslandWest');
  assert.equal(returning.boat, 'skipped');
  assert.equal(returning.logo, 'skipped');
  assert.equal(returning.wordmark, 'skipped');
  assert.ok(!returning.resources.some(r => /opening-boat\.glb|munas-ix-logo-hd\.glb|sultra-rupa-wordmark\.json/.test(r.url)));
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  fs.writeFileSync(`artifacts/performance/${artifact}.json`, JSON.stringify({ reports, errors, failures }, null, 2));
  await page.screenshot({ path: `artifacts/performance/${artifact}.png` });
  await context.close();
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
