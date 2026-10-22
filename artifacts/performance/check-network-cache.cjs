const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', { offline: false, latency: 80,
    downloadThroughput: 500000, uploadThroughput: 125000, connectionType: 'cellular4g' });
  async function measure(name, init) {
    if (init) await page.addInitScript(init);
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => !document.querySelector('#preloader'), null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const game = (await import('/assets/vendor.75f6e6ae65453426.js')).b.$webgl;
      return { readyMs: performance.now(), scene: game.scenes.current?.id,
        boat: game.openingBoat?.status, logo: game.munasLandmark?.status, wordmark: game.sultraIntroWordmark?.status,
        houses: game.sultraIsland.templates.size, resources: performance.getEntriesByType('resource')
          .map(r => ({ url: r.name, transfer: r.transferSize, encoded: r.encodedBodySize })) };
    });
    result.name = name;
    result.networkBytes = result.resources.reduce((n, r) => n + r.transfer, 0);
    result.cachedModelRequests = result.resources.filter(r => r.url.includes('/asset-cache/') && r.transfer === 0).length;
    console.log(JSON.stringify({ ...result, resources: undefined }));
    return result;
  }
  const reports = [await measure('first-visit-4Mbps'), await measure('cached-intro-4Mbps')];
  await page.evaluate(async () => {
    const app = (await import('/assets/vendor.75f6e6ae65453426.js')).b;
    app.$savestate.setVariable('isIntroCompleted', true);
  });
  await page.waitForTimeout(1200);
  reports.push(await measure('returning-player-4Mbps'));
  fs.writeFileSync('artifacts/performance/network-cache-check.json', JSON.stringify({ reports, errors }, null, 2));
  await page.screenshot({ path: 'artifacts/performance/network-cache-returning.png' });
  await context.close();
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
