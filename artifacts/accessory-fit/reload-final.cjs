const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const page = browser.contexts()[0].pages()[0];
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => {
    window.__testApp = (await import('/assets/vendor.75f6e6ae65453426.js')).b;
    const game = window.__testApp.$webgl;
    return game?.playerCharacter?.status === 'ready' &&
      Array.isArray(game.playerCharacter.entry?.custom) && game.scenes?.current?.player;
  }, null, { timeout: 90000 });
  console.log(await page.evaluate(() => ({ route: window.__testApp.$route.name,
    scene: window.__testApp.$webgl.scenes.current.id,
    attachments: window.__testApp.$webgl.playerCharacter.entry.custom.length,
    text: document.body.innerText.slice(-1500) })));
  console.log({ errors });
  process.exit(0);
})();
