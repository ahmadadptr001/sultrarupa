const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9334');
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, deviceScaleFactor: 1.75, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.addInitScript(() => {
    window.__loadMetrics = { tasks: [] };
    new PerformanceObserver(list => window.__loadMetrics.tasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
  });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await cdp.send('Profiler.start');
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.locator('#preloader').waitFor({ state: 'detached', timeout: 90000 });
  const { profile } = await cdp.send('Profiler.stop');
  const name = process.argv[2] || 'startup-gpu-before';
  fs.writeFileSync(`artifacts/performance/${name}.cpuprofile`, JSON.stringify(profile));
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const totals = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const id = profile.samples[i]; totals.set(id, (totals.get(id) || 0) + profile.timeDeltas[i]);
  }
  const top = [...totals].sort((a,b) => b[1] - a[1]).slice(0,35).map(([id,time]) => ({ ms: time/1000, ...nodes.get(id).callFrame }));
  const metrics = await page.evaluate(() => ({ ...window.__loadMetrics, readyMs: performance.now(), paint: performance.getEntriesByType('paint').map(e => ({ name:e.name, start:e.startTime })) }));
  fs.writeFileSync(`artifacts/performance/${name}.json`, JSON.stringify({ metrics, top }, null, 2));
  console.log(JSON.stringify({ metrics, top:top.slice(0,15) },null,2));
  await context.close(); process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
