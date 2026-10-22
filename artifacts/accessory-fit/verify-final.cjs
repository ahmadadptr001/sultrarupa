const {chromium} = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  const page = browser.contexts()[0].pages()[0];
  const errors = [], assets = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().includes('/models/player-anoa')) assets.push({url:response.url(),status:response.status()});
  });
  await page.reload({waitUntil:'domcontentloaded'});
  let ready = false;
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(1000);
    ready = await page.evaluate(async () => {
      window.__testApp = (await import('/assets/vendor.75f6e6ae65453426.js')).b;
      const g = window.__testApp.$webgl;
      return !!(g?.scenes?.current?.player && g.playerCharacter?.status === 'ready' &&
        Array.isArray(g.playerCharacter.entry?.custom));
    });
    if (ready) break;
  }
  if (!ready) throw new Error('Character did not become ready');
  await page.evaluate(async () => {
    const a=window.__testApp;
    a.$savestate.setVariable('isTutoCompleted',true);
    a.$webgl.scenes.current.setState('Playing');
    await a.$router.push({name:'Home'});
  });
  await page.waitForTimeout(1500);
  await page.getByRole('button',{name:'Atur karakter',exact:true}).click();
  await page.waitForTimeout(1800);
  const report = await page.evaluate(async () => {
    const a=window.__testApp,g=a.$webgl,p=a.$savestate.game.player;
    const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const items=[];
    for (const part of ['head','body','bottom']) {
      for(const k of ['head','body','bottom']) p[k]=k[0].toUpperCase()+k.slice(1)+'-Empty';
      for(const id of Object.keys(a.$items[part]).filter(id=>!id.endsWith('-Empty'))) {
        p[part]=id;g.store.updatePlayerOutfit.emit(part);await frame();
        const e=g.playerCharacter.entry;
        items.push({id,visible:e.custom.filter(w=>w.object.visible).map(w=>w.node),
          fallback:e.accessories.filter(w=>w.mesh.visible).map(w=>w.part),shoesOffset:e.actor.shoesOffset});
      }
      p[part]=part[0].toUpperCase()+part.slice(1)+'-Empty';
    }
    Object.assign(p,{head:'Head-VahineCrown',body:'Body-PandaBackpack',bottom:'Bottom-Sandals'});
    g.store.updatePlayerOutfit.emit();await frame();
    const e=g.playerCharacter.entry;
    const footwear=e.custom.filter(w=>w.item==='Bottom-Sandals').map(w=>({
      node:w.node,vertices:w.object.geometry.attributes.position.count,
      vertexColors:w.object.material.vertexColors,hasAtlas:!!w.object.material.map,
      bone:w.object.parent.name,finite:w.object.matrixWorld.elements.every(Number.isFinite)}));
    return {items,customCount:e.custom.length,footwear,shoesOffset:e.actor.shoesOffset};
  });
  await page.waitForTimeout(1800);
  await page.screenshot({path:'artifacts/accessory-fit/final-sandals-website.png'});
  await page.evaluate(async()=>{await window.__testApp.$router.push({name:'Home'});});
  await page.waitForTimeout(1200);
  const snapshot=()=>page.evaluate(()=>{
    const e=window.__testApp.$webgl.playerCharacter.entry;
    return {bones:e.bones.map(b=>[b.name,...b.quaternion.toArray()]),
      foot:e.custom.filter(w=>w.item==='Bottom-Sandals').map(w=>({node:w.node,
        matrix:w.object.matrixWorld.elements.slice(),local:w.object.matrix.elements.slice(),
        bone:w.object.parent.name})),position:e.actor.base.position.toArray()};
  });
  const before=await snapshot();
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(650);
  const moving=await snapshot();await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(300);
  report.animation={before,moving,
    attachmentsStable:before.foot.every((f,i)=>f.local.every((v,k)=>Math.abs(v-moving.foot[i].local[k])<1e-7)),
    moved:before.position.some((v,i)=>Math.abs(v-moving.position[i])>1e-4)};
  report.errors=errors;report.assets=assets;
  fs.writeFileSync('artifacts/accessory-fit/final-validation.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({items:report.items.length,customCount:report.customCount,
    missing:report.items.filter(i=>!i.visible.length),fallback:report.items.filter(i=>i.fallback.length),
    footwear:report.footwear,shoeOffset:report.shoesOffset,animation:{moved:report.animation.moved,
      attachmentsStable:report.animation.attachmentsStable},errors,assets},null,2));
  process.exit(0);
})().catch(error=>{console.error(error);process.exit(1);});
