const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9334');
  const context = await browser.newContext({ viewport:{width:1100,height:760} });
  const page = await context.newPage(), requests=[], errors=[];
  page.on('request', r=>requests.push(r.url()));
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://localhost:3001/',{waitUntil:'domcontentloaded'});
  await page.locator('#preloader').waitFor({state:'detached',timeout:60000});
  await page.waitForTimeout(1200);
  const absentBeforeUse=['sultra-about.js','sultra-house-interior.js','sultra-interior.css','ruangan-kotak-besar.glb','audiosprites.'];
  for(const name of absentBeforeUse) assert.ok(!requests.some(url=>url.includes(name)), `Eager request: ${name}`);
  const baseline=await page.evaluate(async()=>{
    window.__testApp=(await import('/assets/vendor.75f6e6ae65453426.js')).b;
    const game=window.__testApp.$webgl;
    return {houseTemplates:game.sultraIsland.templates.size,player:game.playerCharacter.status,title:document.title,
      styles:[...document.querySelectorAll('link[data-game-style]')].map(l=>({media:l.media,loaded:!!l.sheet})),
      audioIds:Object.keys(game.audio.list).length};
  });
  assert.equal(baseline.houseTemplates,0);
  assert.equal(baseline.player,'ready');
  assert.ok(baseline.styles.every(s=>s.loaded&&s.media==='all'));
  // Use the actual delegated About entry; injecting a link avoids changing the
  // game scene merely to reach the footer in this focused feature check.
  await page.evaluate(()=>{const footer=document.createElement('div');footer.className='menu-footer';footer.innerHTML='<a href="#" id="test-about">Tentang Sultra Rupa</a>';document.body.append(footer);document.getElementById('test-about').click();});
  await page.locator('.sultra-about:not([hidden])').waitFor({timeout:10000});
  await page.keyboard.press('Escape');
  await page.locator('.sultra-about:not([hidden])').waitFor({state:'hidden'});
  await page.evaluate(()=>document.getElementById('test-about').click());
  await page.locator('.sultra-about:not([hidden])').waitFor();
  await page.keyboard.press('Escape');
  // First open can be cancelled while its import is outstanding.
  await page.evaluate(()=>{const room=window.__testApp.$webgl.sultraIsland.interior;room.open({id:'laika'});room.close();});
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.__testApp.$webgl.sultraIsland.interior.isOpen),false);
  const interior=[];
  for(let i=0;i<2;i++){
    await page.evaluate(()=>window.__testApp.$webgl.sultraIsland.interior.open({id:'laika'}));
    await page.waitForFunction(()=>window.__testApp.$webgl.sultraIsland.interior.status==='ready',null,{timeout:30000});
    interior.push(await page.evaluate(()=>({open:window.__testApp.$webgl.sultraIsland.interior.isOpen, outdoorRunning:window.__testApp.$webgl.time.isStarted})));
    assert.equal(interior[i].outdoorRunning,false);
    await page.evaluate(()=>window.__testApp.$webgl.sultraIsland.interior.close());
    assert.equal(await page.evaluate(()=>window.__testApp.$webgl.time.isStarted),true);
  }
  await page.mouse.click(1050,40);
  await page.waitForFunction(()=>window.__testApp.$webgl.audio.unlocked.value,{},{timeout:10000});
  await page.evaluate(()=>{window.__sound=window.__testApp.$webgl.audio.playSound('sfx_UI_dialog_next');});
  await page.waitForFunction(()=>window.__sound?.loaded || window.__sound?.buffer,null,{timeout:10000});
  const counts=Object.fromEntries(absentBeforeUse.map(name=>[name,requests.filter(url=>url.includes(name)).length]));
  for(const count of Object.values(counts))assert.equal(count,1);
  assert.deepEqual(errors,[]);
  const report={baseline,absentBeforeUse,afterUseRequests:counts,interior,cancelledOpen:true,errors};
  fs.writeFileSync('artifacts/performance/demand-features.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  await context.close();process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
