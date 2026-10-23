const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const before = execFileSync('git', ['show', 'HEAD:public/coastal_world.html'], { encoding: 'utf8', maxBuffer: 2e6 });
  const after = fs.readFileSync('public/coastal_world.html','utf8');
  const browser = await chromium.connectOverCDP('http://localhost:9334');
  const reports = [];
  for (const viewport of [{ width: 412, height: 823 }, { width: 1365, height: 900 }]) {
    const records = [];
    for (const [name, html] of [['before', before], ['critical-only', after], ['full', after]]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.route('**/*', route => {
        const url = route.request().url();
        if (route.request().isNavigationRequest()) return route.fulfill({ contentType:'text/html', body:html });
        if (/\.js(?:\?|$)/.test(url) || (name === 'critical-only' && /\.css$/.test(url))) return route.abort();
        return route.continue();
      });
      await page.goto('http://localhost:3001/');
      await page.evaluate(() => document.fonts.ready);
      records.push(await page.evaluate(() => Object.fromEntries([
        '#preloader', '#preloader .logo', '#preloader .preloader-counter',
        '#preloader .preloader-baseline', '#preloader h1', '#preloader .colored', '#preloader .preloader-foreground',
      ].map(selector => {
        const element = document.querySelector(selector), s = getComputedStyle(element), rect = element.getBoundingClientRect();
        return [selector, { x:rect.x, y:rect.y, width:rect.width, height:rect.height,
          color:s.color, background:s.backgroundColor, font:s.font, display:s.display }];
      }))));
      await context.close();
    }
    assert.deepEqual(records[1], records[0], 'Critical loading styles changed');
    assert.deepEqual(records[2], records[0], 'Final styles changed');
    reports.push({ viewport, identical:true, styles:records[0] });
  }
  fs.writeFileSync('artifacts/performance/loading-style-parity.json',JSON.stringify(reports,null,2));
  console.log('Loading appearance identical at mobile and desktop sizes, including with full CSS unavailable.');
  process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
