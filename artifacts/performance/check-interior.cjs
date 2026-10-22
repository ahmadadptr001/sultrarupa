const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs=require('node:fs');
(async()=>{const b=await chromium.connectOverCDP('http://localhost:9333'),c=await b.newContext({viewport:{width:800,height:600}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(process.argv[2]||'http://localhost:3000/',{waitUntil:'domcontentloaded'});for(let i=0;i<120;i++){if(await p.evaluate(()=>!document.querySelector('#preloader')))break;await p.waitForTimeout(500)}
await p.evaluate(async()=>{window.__testApp=(await import('/assets/vendor.75f6e6ae65453426.js')).b;window.__frames=0;window.__testApp.$webgl.hooks.beforeFrame.watch(()=>window.__frames++);});
const steps=[];
for(let i=0;i<3;i++){
steps.push(await p.evaluate(()=>{const g=window.__testApp.$webgl;g.sultraIsland.interior.open({id:'laika'});return{action:'open',isOpen:g.sultraIsland.interior.isOpen,outdoorRunning:g.time.isStarted,frame:window.__frames}}));
await p.waitForTimeout(i?800:5000);
steps.push(await p.evaluate(()=>{const g=window.__testApp.$webgl;return{action:'inside',status:g.sultraIsland.interior.status,outdoorRunning:g.time.isStarted,frame:window.__frames}}));
steps.push(await p.evaluate(()=>{const g=window.__testApp.$webgl;g.sultraIsland.interior.close();return{action:'close',isOpen:g.sultraIsland.interior.isOpen,outdoorRunning:g.time.isStarted,frame:window.__frames}}));
await p.waitForTimeout(600);
}
const resources=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('ruangan')).map(e=>({name:e.name,transfer:e.transferSize})));
const report={steps,resources,errors};fs.writeFileSync('artifacts/performance/interior-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await c.close();process.exit(errors.length?1:0)})().catch(e=>{console.error(e);process.exit(1)});
