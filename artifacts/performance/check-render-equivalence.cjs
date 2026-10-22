const fs = require('node:fs');
const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('requestfailed', request => console.error(request.url(), request.failure()));
  page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
  await page.route('**/render-audit-test', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }));
  await page.goto('http://localhost:3000/render-audit-test');
  await page.evaluate(() => { window.__DATA = { site: { locale: 'en' }, page: {}, project: {} }; });
  const sources = {};
  for (const file of ['sultra-lulo.js', 'player-character.js', 'anoa-animation.js']) {
    sources[file] = {
      before: fs.readFileSync(`artifacts/performance/render-audit-before/${file}`, 'utf8'),
      after: fs.readFileSync(`public/assets/${file}`, 'utf8'),
    };
  }
  const result = await page.evaluate(async sources => {
    const native = await import('/assets/vendor.75f6e6ae65453426.js');
    const { aS: Vector3, bm: Quaternion, cd: Group } = native;
    const compile = (source, params, result) => new Function(...Object.keys(params), source.replace(/^\uFEFF/, '')
      .replace(/^import .*?;\s*$/gm, '').replace(/export /g, '') + `\nreturn ${result};`)(...Object.values(params));
    const basePrototype = Object.getPrototypeOf(Group.prototype);
    let allocations = 0, matrixUpdates = 0;
    class CountedVector extends Vector3 { constructor(...args) { super(...args); allocations++; } }
    class CountedQuaternion extends Quaternion { constructor(...args) { super(...args); allocations++; } }
    const methods = ['updateMatrixWorld', 'updateWorldMatrix'];
    const originals = {};
    for (const method of methods) {
      originals[method] = basePrototype[method];
      basePrototype[method] = function (...args) { matrixUpdates++; return originals[method].apply(this, args); };
    }
    const modules = Object.fromEntries(Object.entries(sources['sultra-lulo.js']).map(([version, source]) => [version,
      compile(source, { Vector3: CountedVector, Quaternion: CountedQuaternion },
        '{ updateDancers, createScratch: typeof createDanceScratch === "function" ? createDanceScratch : () => null }'),
    ]));
    function makeScene() {
      const root = new Group();
      root.position.set(1, 2, 3);
      const actors = {};
      for (let i = 0; i < 12; i++) {
        const base = new Group(), charMesh = new Group();
        charMesh.position.y = .1;
        base.add(charMesh); root.add(base);
        const chest = new Group(); chest.position.set(0, 1.2, 0); charMesh.add(chest);
        const bones = [];
        for (const [side, sign] of [['L', 1], ['R', -1]]) {
          let parent = chest;
          for (const [name, length] of [['Shoulder', .22], ['Elbow', .3], ['Wrist', .27]]) {
            const bone = new Group(); bone.name = `Chara_Low_RigGameSkeleton${name}_${side}`;
            bone.position.set(sign * length, name === 'Shoulder' ? 0 : -.025, .012);
            parent.add(bone); bones.push(bone); parent = bone;
          }
        }
        const action = { time: 0, getClip: () => ({ duration: 1.7 }) };
        const actor = { base, charMesh, baseQuaternion: new Quaternion(), skeleton: { bones }, isBodyReady: true,
          allAnims: { Dancing: action }, animationMixer: { update() {
            for (let j = 0; j < bones.length; j++) bones[j].rotation.set(.1 * Math.sin(action.time + j), 0, .04 * Math.cos(action.time + j));
          } } };
        actors[`NPC_SultraLulo_${i}`] = actor;
      }
      root.updateMatrixWorld(true);
      return { actors, root };
    }
    const scenarios = {};
    for (const version of ['before', 'after']) {
      const scene = makeScene();
      const state = { stage: { x: -30, z: -7, radius: 2.5, count: 12 }, dancers: new Map(), actorSlots: new Array(12),
        actorIds: Array.from({ length: 12 }, (_, index) => `NPC_SultraLulo_${index}`), scratch: modules[version].createScratch() };
      scenarios[version] = { scene, state, poses: [] };
      const game = { time: { elapsed: 0 } };
      modules[version].updateDancers(game, state, scene);
      allocations = 0; matrixUpdates = 0;
      const started = performance.now();
      for (let frame = 0; frame < 180; frame++) {
        game.time.elapsed = frame * 16.6667;
        // Exercise both full-visible and changing visibility without changing
        // the native animation clock, then compare all visible joint matrices.
        for (let i = 0; i < 12; i++) scene.actors[`NPC_SultraLulo_${i}`].charMesh.visible = frame < 60 || (i + Math.floor(frame / 30)) % 3 !== 0;
        modules[version].updateDancers(game, state, scene);
        for (const actor of Object.values(scene.actors)) {
          if (!actor.charMesh.visible) continue;
          for (const bone of actor.skeleton.bones) scenarios[version].poses.push(...bone.quaternion.toArray(), ...bone.matrixWorld.elements);
        }
      }
      scenarios[version].metrics = { frames: 180, mathAllocations: allocations, matrixUpdates, elapsedMs: performance.now() - started };
    }
    let maxPoseDifference = 0;
    const { before, after } = scenarios;
    if (before.poses.length !== after.poses.length) throw new Error('Pose sample count changed');
    for (let i = 0; i < before.poses.length; i++) maxPoseDifference = Math.max(maxPoseDifference, Math.abs(before.poses[i] - after.poses[i]));
    if (maxPoseDifference > 1e-10) throw new Error(`Visible dance pose changed: ${maxPoseDifference}`);
    for (const method of methods) basePrototype[method] = originals[method];

    const playerModules = Object.fromEntries(Object.entries(sources['player-character.js']).map(([version, source]) => [version,
      compile(source, { assets: {}, Group, BufferAttribute: function () {}, convertMaterials() {}, createAnoaAnimator() {} },
        '{ syncAccessories, fittedWear, CUSTOM_WEAR }'),
    ]));
    function makeEntry() {
      const custom = playerModules.before.CUSTOM_WEAR.map(wear => ({ ...wear, object: { visible: false } }));
      const fitted = { head: new Map(), body: new Map(), bottom: new Map() };
      for (const wear of custom) {
        if (!fitted[wear.part].has(wear.item)) fitted[wear.part].set(wear.item, []);
        fitted[wear.part].get(wear.item).push(wear);
      }
      return { custom, fitted, selection: {}, selectedGeometry: {}, actor: { charMesh: { colorId: 4, faceColor: 'red', faceData: 'face' }, shoesOffset: .05 },
        accessories: ['head', 'body', 'bottom'].map(part => ({ part, mesh: {} })) };
    }
    const entries = { before: makeEntry(), after: makeEntry() };
    const character = { heads: {}, bodies: {}, bottoms: {} };
    for (const wear of playerModules.before.CUSTOM_WEAR) character[{ head: 'heads', body: 'bodies', bottom: 'bottoms' }[wear.part]][wear.item] = { id: wear.item };
    character.heads['Head-Native'] = { id: 'native' };
    const player = {}, game = { character, savestate: { game: { player } }, app: { $items: { bottom: {} } } };
    let accessoryCases = 0;
    for (const head of [...Object.keys(character.heads), 'Head-Empty']) {
      for (const body of Object.keys(character.bodies)) {
        for (const bottom of Object.keys(character.bottoms)) {
          Object.assign(player, { head, body, bottom });
          for (const version of ['before', 'after']) playerModules[version].syncAccessories(entries[version], game);
          const snapshot = entry => JSON.stringify({ custom: entry.custom.map(wear => wear.object.visible), native: entry.accessories.map(wear => wear.mesh), shoes: entry.actor.shoesOffset });
          if (snapshot(entries.before) !== snapshot(entries.after)) throw new Error(`Accessory mismatch: ${head}/${body}/${bottom}`);
          accessoryCases++;
        }
      }
    }
    return { dance: { maxPoseDifference, scalarPoseSamples: before.poses.length, before: before.metrics, after: after.metrics }, accessoryCases };
  }, sources);
  fs.writeFileSync('artifacts/performance/render-equivalence.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await context.close();
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
