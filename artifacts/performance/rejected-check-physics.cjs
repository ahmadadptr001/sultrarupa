/* Exercise the shipped collision classes against the bundled Three.js math. */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const source = fs.readFileSync(path.join(__dirname, '../public/assets/webgl.3250e36a65453426.js'), 'utf8');
  const physics = source.slice(source.indexOf('const Ur=new n'), source.indexOf('const ol=new Gt'));
  if (!physics.includes('class Xr') || !physics.includes('class il')) throw new Error('Physics extraction changed');
  const browser = await chromium.connectOverCDP(process.env.CDP_URL || 'http://localhost:9333');
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${process.env.TEST_URL || 'http://localhost:3000'}/robots.txt`);
    const report = await page.evaluate(async (source) => {
      window.__DATA = { site: { locale: 'en' }, page: { locale: 'en' },
        project: { locales: { en: { default: true } }, basepath: '/' } };
      const m = await import('/assets/vendor.75f6e6ae65453426.js');
      const helpers = await import('/assets/sultra-physics.js');
      const bindings = { n: m.aS, h: m.aW, yt: m.cx, l: m.aU, H: m.bm,
        qt: m.cW, Ht: m.cT, Wt: m.cU, Vt: m.cS, Gt: m.cV, ...helpers };
      const { Xr, il } = new Function(...Object.keys(bindings), `${source};return {Xr,il}`)(...Object.values(bindings));
      const v = (x, y, z) => new m.aS(x, y, z);
      const results = [];
      const check = (name, action) => {
        try { action(); results.push({ name, passed: true }); }
        catch (error) { results.push({ name, passed: false, error: error.message }); }
      };
      const near = (actual, expected, tolerance = 1e-6) => {
        if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
          throw new Error(`Expected ${expected}, received ${actual}`);
        }
      };
      const triangle = { triangle: new m.cS(v(0, 0, 0), v(0, 0, 2), v(2, 0, 0)) };
      const tree = new Xr({});
      check('triangle face contact has a unit normal and exact depth', () => {
        const hit = tree.triangleSphereIntersect(new m.aW(v(.5, .2, .5), .35), triangle);
        near(hit.depth, .15); near(hit.normal.length(), 1); near(hit.normal.y, 1);
      });
      check('triangle edge contact is detected', () => {
        const hit = tree.triangleSphereIntersect(new m.aW(v(.8, .2, -.1), .35), triangle);
        near(hit.depth, .35 - Math.hypot(.2, .1)); near(hit.normal.length(), 1);
      });
      check('triangle vertex contact is detected', () => {
        const hit = tree.triangleSphereIntersect(new m.aW(v(-.1, .2, -.1), .35), triangle);
        near(hit.depth, .35 - Math.sqrt(.06)); near(hit.normal.length(), 1);
      });
      check('separated and tangent sphere contacts stay finite', () => {
        const outside = tree.triangleSphereIntersect(new m.aW(v(.8, .4, -.1), .35), triangle);
        if (outside) throw new Error('Separated sphere collided');
        const tangent = tree.triangleSphereIntersect(new m.aW(v(.5, .35, .5), .35), triangle);
        if (tangent) { near(tangent.depth, 0); near(tangent.normal.length(), 1); }
      });
      check('oblique collision retains tangential velocity', () => {
        const player = new il(.35);
        player.velocity.set(-3, -1, 2);
        const normal = v(1, 1, 0).normalize();
        helpers.resolvePlayerContact(player, { normal, depth: .1 }, v(0, 0, 0));
        near(player.velocity.dot(normal), 0);
        near(player.velocity.x, -1); near(player.velocity.y, 1); near(player.velocity.z, 2);
      });
      check('moving away from a surface keeps outward velocity', () => {
        const player = new il(.35);
        player.velocity.set(2, 1, 3);
        helpers.resolvePlayerContact(player, { normal: v(1, 0, 0), depth: 0 }, v(0, 0, 0));
        near(player.velocity.x, 2); near(player.velocity.y, 1); near(player.velocity.z, 3);
      });
      function world(wall = true) {
        const value = new Xr({ maxLevel: 5, maxSize: 16 });
        value.add(new m.b6(new Float32Array([
          -10,0,-10, -10,0,10, 10,0,-10,
          10,0,-10, -10,0,10, 10,0,10,
        ]), 3), new m.aU(), 'ground');
        if (wall) value.add(new m.b6(new Float32Array([
          0,-10,-10, 0,10,-10, 0,-10,10,
          0,-10,10, 0,10,-10, 0,10,10,
        ]), 3), new m.aU(), 'props');
        return value.build();
      }
      check('floor and wall corner resolves once without cumulative overcorrection', () => {
        const player = new il(.35);
        player.position.set(.2, .2, 0);
        player.velocity.set(-2, -1, 3);
        player.updateCollisions(world(), 1 / 60);
        near(player.position.x, .35); near(player.position.y, .35); near(player.position.z, 0);
        near(player.velocity.x, 0); near(player.velocity.y, 0); near(player.velocity.z, 3);
        if (!player.isOnFloor || !player.isCollidingProps) throw new Error('Missing floor/wall state');
      });
      check('diagonal movement slides along a wall instead of sticking', () => {
        const player = new il(.35);
        const terrain = world();
        player.position.set(.35, .35, 0);
        for (let frame = 0; frame < 120; frame++) {
          player.velocity.set(-2, -1, 1);
          player.position.addScaledVector(player.velocity, 1 / 60);
          player.updateCollisions(terrain, 1 / 60);
          near(player.position.x, .35); near(player.position.y, .35);
        }
        near(player.position.z, 2);
      });
      check('tangent motion over a terrain seam stays on the ground', () => {
        const player = new il(.35);
        const terrain = world(false);
        player.position.set(-2, .35, 0);
        for (let frame = 0; frame < 240; frame++) {
          player.velocity.set(1, -.1, 0);
          player.position.addScaledVector(player.velocity, 1 / 60);
          player.updateCollisions(terrain, 1 / 60);
          near(player.position.y, .35);
        }
        near(player.position.x, 2);
      });
      return results;
    }, physics);
    console.log(JSON.stringify(report, null, 2));
    if (report.some((test) => !test.passed)) process.exitCode = 1;
  } finally { await context.close(); await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
