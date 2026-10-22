const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const page = browser.contexts()[0].pages()[0];
  const source = fs.readFileSync('public/assets/player-character.js', 'utf8');
  const skinCode = source.slice(source.indexOf('function smooth('), source.indexOf('function getTemplate('));
  const result = await page.evaluate(async (skinCode) => {
    const vendor = await import('/assets/vendor.75f6e6ae65453426.js');
    window.__testApp = vendor.b;
    const g = window.__testApp.$webgl, live = g.playerCharacter.entry, template = g.playerCharacter.template;
    const { createAnoaAnimator } = await import('/assets/anoa-animation.js?check=' + Date.now());
    const skin = new Function('BufferAttribute', `const SHORT_NAME='Chara_Low_RigGameSkeleton'; ${skinCode}; return skinGeometry`)(vendor.b6);
    const root = new vendor.cd(), bones = live.bones.map(b => new b.constructor());
    const world = live.mesh.skeleton.boneInverses.map(m => m.clone().invert());
    for (let i = 0; i < bones.length; i++) {
      const parent = live.bones.indexOf(live.bones[i].parent), local = world[i].clone();
      if (parent >= 0) local.premultiply(world[parent].clone().invert());
      bones[i].name = live.bones[i].name;
      local.decompose(bones[i].position, bones[i].quaternion, bones[i].scale);
      (parent >= 0 ? bones[parent] : root).add(bones[i]);
    }
    const material = new vendor.a$({ map: g.playerCharacter.source.material.map });
    const geometry = skin(g.playerCharacter.source.geometry, template.bones);
    const mesh = new live.mesh.constructor(geometry, material);
    root.add(mesh); root.updateMatrixWorld(true);
    mesh.bind(new live.mesh.skeleton.constructor(bones));
    const actor = {
      allAnims: Object.fromEntries(Object.entries(live.actor.allAnims).map(([name, action]) =>
        [name, { enabled: true, weight: 0, time: 0, _clip: action._clip }])),
      charMesh: { quaternion: template.neutral.quaternion.clone() }, animationMixer: { time: 0 },
    };
    const sources = template.copies.map(b => { const c = new b.constructor(); c.name=b.name; c.position.copy(b.position); c.quaternion.copy(b.quaternion); return c; });
    const sourceRest = sources.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
    const sampler = Object.fromEntries(Object.entries(actor.allAnims).map(([n,a])=>[n,a._clip.tracks.map(t=>({name:t.name,sample:t.createInterpolant()}))]));
    const animator = createAnoaAnimator({ actor, bones, sources, mesh, reference: live.reference, rootIndex: live.rootIndex }, template);
    const rest = bones.map(b => ({ p: b.position.clone(), q: b.quaternion.clone() }));
    const tmp = root.position.clone(), positions = geometry.attributes.position;
    function at(native, phase) {
      for (const action of Object.values(actor.allAnims)) action.weight = 0;
      bones.forEach((bone, i) => { bone.position.copy(rest[i].p); bone.quaternion.copy(rest[i].q); });
      actor.allAnims[native].weight = 1;
      actor.allAnims[native].time = actor.allAnims[native]._clip.duration * phase;
      sources.forEach((b,i)=>{b.position.copy(sourceRest[i].p);b.quaternion.copy(sourceRest[i].q)});
      for(const track of sampler[native]) {
        const dot=track.name.lastIndexOf('.'), bone=sources.find(b=>b.name===track.name.slice(0,dot));
        const prop=track.name.slice(dot+1);
        if(bone && (prop==='position'||prop==='quaternion')) bone[prop].fromArray(track.sample.evaluate(actor.allAnims[native].time));
      }
      const delta=sources[live.rootIndex].position.clone().sub(sourceRest[live.rootIndex].p).applyQuaternion(actor.charMesh.quaternion).multiplyScalar(.01/(2.7455/1.8957));
      bones[live.rootIndex].position.copy(rest[live.rootIndex].p).add(delta);
      animator.update(); root.updateMatrixWorld(true); mesh.skeleton.update();
    }
    const motions = {};
    for (const native of ['Run', 'Walk', 'Hello']) {
      let wristMax = 0, normError = 0, minY = Infinity, maxY = -Infinity;
      for (let frame = 0; frame <= 120; frame++) {
        at(native, frame / 120);
        bones.forEach((bone, i) => {
          normError = Math.max(normError, Math.abs(1 - bone.quaternion.length()));
          if (bone.name.includes('Wrist')) wristMax = Math.max(wristMax, bone.quaternion.angleTo(rest[i].q));
        });
        for (let i = 0; i < positions.count; i += 7) {
          mesh.getVertexPosition(i, tmp);
          if (!tmp.toArray().every(Number.isFinite)) throw Error('Nonfinite vertex');
          minY = Math.min(minY, tmp.y); maxY = Math.max(maxY, tmp.y);
        }
      }
      motions[native] = { wristMaxRad: wristMax, quaternionNormError: normError, minY, maxY };
    }
    at('Hello', .5);
    const deformed = [], original = [], stretched = [];
    for (let i = 0; i < positions.count; i++) {
      deformed.push(mesh.getVertexPosition(i, tmp).clone());
      original.push(tmp.clone().fromBufferAttribute(positions, i));
    }
    const index = geometry.index;
    for (let i = 0; i < index.count; i += 3) {
      for (let k = 0; k < 3; k++) {
        const a = index.getX(i + k), b = index.getX(i + (k + 1) % 3);
        if (original[a].x < .3 || original[a].y > 1.3 || original[a].y < .35) continue;
        const length = original[a].distanceTo(original[b]);
        if (length < .0001) continue;
        const ratio = deformed[a].distanceTo(deformed[b]) / length;
        if (ratio > 2) stretched.push({ ratio, a: original[a].toArray(), b: original[b].toArray() });
      }
    }
    stretched.sort((a, b) => b.ratio - a.ratio);
    const renderer = new g.renderer.instance.constructor({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(720, 900); renderer.setPixelRatio(1); renderer.setClearColor(0x303534);
    const scene = new g.scenes.current.base.constructor(); scene.add(root);
    const Camera = g.scenes.current.getCurrentCamera().cam.constructor;
    const camera = new Camera(36, 720 / 900, .01, 100);
    camera.position.set(0, 1, 3.8); camera.lookAt(0, .95, 0);
    const images = {};
    for (const [name, native, phase] of [['idle', 'Idle', 0], ['run', 'Run', .25], ['hello', 'Hello', .5]]) {
      at(native, phase); renderer.render(scene, camera);
      images[name] = renderer.domElement.toDataURL('image/png');
    }
    camera.position.set(3.8, 1.05, .45); camera.lookAt(0, .95, 0);
    renderer.setSize(240, 300); camera.aspect = .8; camera.updateProjectionMatrix();
    for (const native of ['Walk', 'Run']) {
      const sheet = document.createElement('canvas'); sheet.width = 240 * 8; sheet.height = 300;
      const context = sheet.getContext('2d');
      for (let frame = 0; frame < 8; frame++) {
        at(native, frame / 8); renderer.render(scene, camera);
        context.drawImage(renderer.domElement, frame * 240, 0);
      }
      images[native.toLowerCase() + '-sequence'] = sheet.toDataURL('image/png');
    }
    renderer.dispose(); material.dispose(); geometry.dispose(); mesh.skeleton.dispose();
    return { report: { motions, stretchedEdges: stretched.slice(0, 16) }, images };
  }, skinCode);
  fs.writeFileSync('artifacts/anoa-animation/native-motion-check.json', JSON.stringify(result.report, null, 2));
  for (const [name, data] of Object.entries(result.images)) {
    fs.writeFileSync(`artifacts/anoa-animation/native-${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log(JSON.stringify(result.report, null, 2));
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
