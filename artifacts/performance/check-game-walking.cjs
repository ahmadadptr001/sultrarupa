const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const context = await browser.newContext({ viewport: { width: 1100, height: 750 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(process.env.TEST_URL || 'http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 180; i++) {
    if (await page.evaluate(() => !document.querySelector('#preloader'))) break;
    await page.waitForTimeout(500);
  }
  console.log('loaded', await page.evaluate(() => document.querySelector('#preloader')?.textContent));
  await page.evaluate(async () => {
    window.__testApp = (await import('/assets/vendor.75f6e6ae65453426.js')).b;
    const game = window.__testApp.$webgl;
    game.savestate.game.vars.isIntroCompleted = true;
    game.savestate.game.vars.isTutoCompleted = true;
    window.__testApp.$router.push('/');
    game.scenes.teleportTo('IslandWest', { point: 'Spawn', noAnimations: true });
  });
  for (let i = 0; i < 120; i++) {
    if (await page.evaluate(() => {
      const scene = window.__testApp.$webgl.scenes.current;
      return scene?.id === 'IslandWest' && scene.physics?.isReady && scene.player?.isBodyReady;
    })) break;
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.__testApp.$webgl.scenes.current.setState('Playing'));
  await page.waitForTimeout(1000);
  const state = await page.evaluate(() => {
    const app = window.__testApp, game = app.$webgl, scene = game.scenes.current;
    return { scene: scene.id, state: scene.state, canMove: scene.player?.canMove,
      physics: scene.physics.isReady, takeOver: scene.physics.takeOver.active,
      hidden: scene.player.hidden, isBodyReady: scene.player.isBodyReady,
      currentCamera: scene.getCurrentCamera().constructor.name,
      cameraCanMove: scene.getCurrentCamera().playerCanMove,
      transition: game.store.isTransitionActive.value, overlay: app.$store.isOverlayVisible,
      api: app.$store.isApiErrorVisible, notification: app.$store.itemNotification,
      route: app.$router.currentRoute.value.path, frozen: game.store.frozenPlayerDelay,
      position: scene.physics.playerPosition.toArray() };
  });
  console.log('state', JSON.stringify(state));
  const moves = [];
  for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
    const before = await page.evaluate(() => window.__testApp.$webgl.scenes.current.physics.playerPosition.toArray());
    await page.keyboard.down(key);
    await page.waitForTimeout(1200);
    await page.keyboard.up(key);
    const after = await page.evaluate(() => window.__testApp.$webgl.scenes.current.physics.playerPosition.toArray());
    moves.push({ key, before, after, distance: Math.hypot(after[0] - before[0], after[2] - before[2]) });
  }
  const result = { state, moves, errors };
  fs.writeFileSync('artifacts/performance/walking-smoke.json', JSON.stringify(result, null, 2));
  await page.screenshot({ path: 'artifacts/performance/walking-smoke.png' });
  console.log(JSON.stringify(result));
  await context.close(); await browser.close();
  // This machine uses software rendering. Test actual movement and ground
  // support, not a distance-per-second/FPS target tied to GPU throughput.
  if (errors.length || !state.canMove || moves.some((move) => move.distance < .02
    || !move.after.every(Number.isFinite) || move.after[1] < 3)) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
