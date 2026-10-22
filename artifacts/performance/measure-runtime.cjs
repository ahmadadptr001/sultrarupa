const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs=require('node:fs');
const label=process.argv[2]||'runtime-before';
(async()=>{
 const browser=await chromium.connectOverCDP('http://localhost:9333');
 const context=await browser.newContext({viewport:{width:1365,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(label.endsWith('before'))for(const file of ['sultra-lulo.js','player-character.js','anoa-animation.js','sultra-island.js','webgl.3250e36a65453426.js']){
   const body=require('node:child_process').execFileSync('git',['show',`HEAD:public/assets/${file}`]);
   await page.route(`**/assets/${file}`,route=>route.fulfill({status:200,contentType:'application/javascript',body}));
 }
 await page.goto('http://localhost:3000/',{waitUntil:'domcontentloaded'});
 for(let i=0;i<120;i++){if(await page.evaluate(()=>!document.querySelector('#preloader')))break;await page.waitForTimeout(500);}
 await page.evaluate(async()=>{const app=(await import('/assets/vendor.75f6e6ae65453426.js')).b;window.__testApp=app;const g=app.$webgl;g.savestate.game.vars.isIntroCompleted=true;g.savestate.game.vars.isTutoCompleted=true;app.$router.push('/');g.scenes.teleportTo('IslandWest',{point:'Spawn',noAnimations:true});});
 await page.waitForTimeout(5000);
 const cdp=await context.newCDPSession(page);
 await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 await page.evaluate(()=>{window.__runtime={frames:[],samples:[],running:true};const r=window.__runtime,g=window.__testApp.$webgl;let last=0,start=performance.now(),next=start;function tick(now){if(!r.running)return;if(last)r.frames.push(now-last);last=now;if(now>=next){const info=g.renderer.instance.info;r.samples.push({t:now-start,heap:performance.memory?.usedJSHeapSize,geometries:info.memory.geometries,textures:info.memory.textures,programs:info.programs.length,calls:info.render.calls,triangles:info.render.triangles,scene:g.scenes.current.id,position:g.scenes.current.player?.base.position.toArray(),canMove:g.scenes.current.player?.canMove});next=now+1000;}requestAnimationFrame(tick)}requestAnimationFrame(tick)});
 for(const key of ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','ArrowUp','ArrowRight']){await page.keyboard.down(key);await page.waitForTimeout(4000);await page.keyboard.up(key)}
 const {profile}=await cdp.send('Profiler.stop');
 const result=await page.evaluate(()=>{const r=window.__runtime;r.running=false;return r});
 result.errors=errors;
 const frames=result.frames.slice().sort((a,b)=>a-b);result.summary={frames:frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],p99:frames[Math.floor(frames.length*.99)],over50:frames.filter(f=>f>50).length};
 fs.writeFileSync(`artifacts/performance/${label}.json`,JSON.stringify(result,null,2));fs.writeFileSync(`artifacts/performance/${label}.cpuprofile`,JSON.stringify(profile));
 await page.screenshot({path:`artifacts/performance/${label}.png`});console.log(JSON.stringify({summary:result.summary,samples:result.samples,errors},null,2));
 await context.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
