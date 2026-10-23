const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9334');
  const context = await browser.newContext({ viewport: { width: 1100, height: 760 } });
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  try {
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
    await page.locator('#preloader').waitFor({ state: 'detached', timeout: 60000 });
    const opening = await page.evaluate(async () => {
      window.testApp = (await import('/assets/vendor.75f6e6ae65453426.js')).b;
      window.testGame = window.testApp.$webgl;
      return { scene: testGame.scenes.current.id, models: [...testGame.sultraIsland.templates.keys()] };
    });
    assert.equal(opening.scene, 'IslandIntro');
    assert.deepEqual(opening.models, []);
    assert.ok(!requests.some(url => /(?:mekongga|tugu-mtq|banua-tada)\.glb/.test(url)));

    // One real HTTP failure, followed by a fresh native loader request.
    let failures = 0;
    await page.route('**/banua-tada.glb', route => {
      if (!failures++) return route.fulfill({ status: 503, body: 'Temporary test outage' });
      return route.continue();
    });
    const failure = await page.evaluate(async () => {
      try { await testGame.sultraIsland.models.request('banua-tada'); return false; }
      catch { return testGame.sultraIsland.models.entries.get('banua-tada').status === 'error'; }
    });
    assert.equal(failure, true);
    await page.evaluate(() => testGame.sultraIsland.models.request('banua-tada'));
    assert.equal(failures, 2);
    await page.unroute('**/banua-tada.glb');

    await page.evaluate(() => {
      testGame.savestate.game.vars.isIntroCompleted = true;
      testGame.savestate.game.vars.isTutoCompleted = true;
      testApp.$router.push('/');
      testGame.scenes.teleportTo('IslandWest', { point: 'Spawn', noAnimations: true });
    });
    await page.waitForFunction(() => testGame.scenes.current.id === 'IslandWest'
      && testGame.scenes.current.physics.isReady && testGame.scenes.current.player.isBodyReady);
    await page.waitForFunction(() => testGame.sultraIsland.templates.has('mekongga'));
    const proximity = await page.evaluate(() => [...testGame.sultraIsland.templates.keys()]);
    assert.ok(!proximity.includes('tugu-mtq'));
    assert.ok(!proximity.includes('laika'));
    const boundaries = await page.evaluate(() => ({
      marked: [...testGame.sultraIsland.houses.userData.sultraRopeBarriers],
      ropes: testGame.sultraIsland.houses.children.filter(o => o.name === 'Sultra rope barriers').length,
    }));
    assert.equal(boundaries.marked.length, 2);
    assert.equal(boundaries.ropes, 1);

    // Exercise actual phone callbacks. Hold the first destination's response,
    // then select another: only the latest completed destination may teleport.
    let heldRoute;
    const intercepted = new Promise(resolve => { heldRoute = resolve; });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/tugu-mtq.glb', async route => {
      heldRoute(); await gate; await route.continue();
    });
    await page.evaluate(() => {
      const tab = document.createElement('div'); tab.className = 'phone-tab map';
      document.body.append(tab);
      window.travels = [];
      const original = testGame.scenes.teleportTo.bind(testGame.scenes);
      testGame.scenes.teleportTo = (scene, options) => { travels.push(options.point); return original(scene, options); };
    });
    await page.waitForSelector('[data-culture-id="tugu-mtq"]', { state: 'attached' });
    async function navigate(id) {
      await page.evaluate(id => {
        document.querySelector(`[data-culture-id="${id}"]`).click();
        document.querySelector('.spm-confirm-go').click();
      }, id);
    }
    await navigate('tugu-mtq');
    await intercepted;
    assert.equal(await page.evaluate(() => travels.length), 0);
    assert.equal(await page.getByText('Menyiapkan tujuan…', { exact: true }).count(), 1);
    await navigate('bharugano-wuna');
    release();
    await page.waitForFunction(() => travels.length > 0);
    await page.waitForTimeout(1800);
    const travel = await page.evaluate(() => ({ points: travels, ground: testGame.scenes.current.physics.playerPosition.toArray() }));
    assert.equal(travel.points.length, 1);
    assert.ok(travel.points[0].includes('bharugano-wuna'));
    assert.ok(travel.ground.every(Number.isFinite) && travel.ground[1] >= 3);
    await page.unroute('**/tugu-mtq.glb');

    // Every HD model remains available and is attached exactly once.
    await page.evaluate(() => Promise.all([...testGame.sultraIsland.models.entries.keys()]
      .map(id => testGame.sultraIsland.models.request(id))));
    await page.waitForFunction(() => testGame.sultraIsland.attachedModels.size === 6);
    const loaded = await page.evaluate(() => ({ templates: testGame.sultraIsland.templates.size,
      ids: testGame.sultraIsland.houses.children.map(o => o.userData.exhibit || o.userData.landmark).filter(Boolean),
      ropes: testGame.sultraIsland.houses.children.filter(o => o.name === 'Sultra rope barriers').length,
    }));
    assert.equal(new Set(loaded.ids).size, 6);
    assert.equal(loaded.ids.length, 6);
    assert.equal(loaded.ropes, 1);
    await page.evaluate(() => {
      document.querySelector('.phone-tab.map').remove();
      testGame.sultraIsland.arrival = null;
      testGame.scenes.teleportTo('IslandWest', { point: 'Spawn', noAnimations: true });
    });
    await page.waitForTimeout(1800);
    await page.evaluate(() => testGame.scenes.current.setState('Playing'));
    const moves = [];
    for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
      const before = await page.evaluate(() => testGame.scenes.current.physics.playerPosition.toArray());
      await page.keyboard.down(key); await page.waitForTimeout(900); await page.keyboard.up(key);
      const after = await page.evaluate(() => testGame.scenes.current.physics.playerPosition.toArray());
      const distance = Math.hypot(after[0] - before[0], after[2] - before[2]);
      assert.ok(distance > .02 && after.every(Number.isFinite) && after[1] >= 3);
      moves.push({ key, distance, y: after[1] });
    }
    assert.deepEqual(errors, []);
    const report = { opening, failedRequestRetried: failures === 2, proximity, boundaries, travel, loaded, moves, errors };
    fs.writeFileSync('artifacts/performance/distance-streaming.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await context.close(); }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
