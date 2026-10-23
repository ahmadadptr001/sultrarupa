const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9334');
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 60; i++) {
    const ready = await page.evaluate(async () => {
      window.__testApp = (await import('/assets/vendor.75f6e6ae65453426.js')).b;
      const g = window.__testApp.$webgl;
      return !!(g?.scenes?.current?.npcIntro && g.playerCharacter?.entry
        && g.store.isPreloaderHidden.value && !g.store.isTransitionActive.value);
    });
    if (ready) break;
    await page.waitForTimeout(1000);
  }
  await page.evaluate(async () => {
    const a = window.__testApp;
    a.$savestate.setVariable('isIntroCompleted', true);
    await a.$webgl.scenes.teleportTo('IslandWest', { point: 'PortSpawnB', noAnimations: true });
  });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    const a = window.__testApp;
    a.$savestate.setVariable('isTutoCompleted', true);
    a.$webgl.scenes.current.setState('Playing');
    await a.$router.push({ name: 'Home' });
  });
  await page.waitForTimeout(1000);
  const sample = () => page.evaluate(() => {
    const g = window.__testApp.$webgl, e = g.playerCharacter.entry;
    return { scene: g.scenes.current.id, position: e.actor.base.position.toArray(),
      speed: e.actor.speed, moving: e.actor.currentAnimation,
      active: e.animator.active, phase: e.animator.phase, locomotion: e.animator.locomotion,
      running: e.animator.running, scale: e.root.scale.x, rootY: e.bones[e.rootIndex].position.y, physics: g.scenes.current.physics.playerPosition.toArray() };
  });
  await page.evaluate(() => {
    const canvas = window.__testApp.$webgl.renderer.instance.domElement;
    window.__motionChunks = [];
    window.__motionRecorder = new MediaRecorder(canvas.captureStream(30), { mimeType: 'video/webm' });
    window.__motionRecorder.ondataavailable = event => window.__motionChunks.push(event.data);
    window.__motionRecorder.start();
  });
  const report = { idle: await sample(), frames: [] };
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(160); report.frames.push(await sample()); }
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(650);
  report.turn = await sample();
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(1200);
  report.stopped = await sample();
  await page.screenshot({ path: 'artifacts/anoa-animation/legs-runtime.png' });
  const video = await page.evaluate(() => new Promise(resolve => {
    window.__motionRecorder.onstop = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(new Blob(window.__motionChunks, { type: 'video/webm' }));
    };
    window.__motionRecorder.stop();
  }));
  fs.writeFileSync('artifacts/anoa-animation/legs-runtime.webm', Buffer.from(video, 'base64'));
  report.errors = errors;
  if(errors.length)throw new Error(errors.join('; '));
  if(report.frames.some(f=>f.physics[1]<3||!f.physics.every(Number.isFinite)))throw new Error('Physics support lost');
  if(report.stopped.rootY>1.1)throw new Error('Visual grounding accumulated');
  fs.writeFileSync('artifacts/anoa-animation/legs-runtime.json', JSON.stringify(report, null, 2));
  if (!report.frames.some(frame => frame.moving === 'Run')) throw new Error('Keyboard did not trigger Run');
  if (report.stopped.moving !== null) throw new Error('Player did not return to idle');
  console.log(JSON.stringify({ idle: report.idle, during: report.frames.at(-1), turn: report.turn,
    stopped: report.stopped, errors }, null, 2));
  await context.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
