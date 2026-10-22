const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('node:fs');
const label = process.argv[2] || 'baseline';
const url = process.argv[3] || 'http://localhost:3000/';
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage(), errors = [], failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failed.push({ url: request.url(), reason: request.failure()?.errorText }));
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(3000);
    window.__loadStats = { longTasks: [], paints: [] };
    new PerformanceObserver(list => window.__loadStats.longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver(list => window.__loadStats.paints.push(...list.getEntries().map(e => ({ name: e.name, start: e.startTime })))).observe({ type: 'paint', buffered: true });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  let readiness;
  for (let i = 0; i < 150; i++) {
    readiness = await page.evaluate(() => {
      const preloader = document.querySelector('#preloader');
      return { time: performance.now(), progress: preloader?.querySelector('.preloader-counter')?.textContent,
        ready: !preloader || getComputedStyle(preloader).visibility === 'hidden' || getComputedStyle(preloader).display === 'none' };
    });
    if (readiness.ready) break;
    await page.waitForTimeout(500);
  }
  const report = await page.evaluate(() => ({
    title: document.title, navigation: performance.getEntriesByType('navigation')[0].toJSON(),
    resources: performance.getEntriesByType('resource').map(e => ({ url: e.name, start: e.startTime,
      duration: e.duration, transfer: e.transferSize, encoded: e.encodedBodySize, decoded: e.decodedBodySize, initiator: e.initiatorType })),
    ...window.__loadStats,
  }));
  Object.assign(report, { label, readiness, errors, failed });
  fs.mkdirSync('artifacts/performance', { recursive: true });
  fs.writeFileSync(`artifacts/performance/${label}.json`, JSON.stringify(report, null, 2));
  await page.screenshot({ path: `artifacts/performance/${label}.png` });
  console.log(JSON.stringify({ label, readiness, requests: report.resources.length,
    bytes: report.resources.reduce((n, r) => n + r.encoded, 0),
    longTaskMs: Math.round(report.longTasks.reduce((n, t) => n + t.duration, 0)),
    paints: report.paints, errors, failed,
    largest: [...report.resources].sort((a, b) => b.encoded - a.encoded).slice(0, 15).map(r => ({ ...r, url: r.url.replace(/^https?:\/\/[^/]+/, '') })),
  }, null, 2));
  await context.close();
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
