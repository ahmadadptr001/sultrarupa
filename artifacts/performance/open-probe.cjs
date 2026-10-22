const { chromium } = require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async()=>{
 const browser=await chromium.connectOverCDP('http://localhost:9333');
 const context=await browser.newContext({viewport:{width:1365,height:900}});
 const page=await context.newPage();
 page.on('pageerror',e=>console.log('ERROR '+e.message));
 await page.goto('http://localhost:3000/',{waitUntil:'domcontentloaded'});
 for(let i=0;i<90;i++){if(await page.evaluate(()=>!document.querySelector('#preloader')))break;await page.waitForTimeout(500);}
 console.log(await page.evaluate(async()=>{const app=(await import('/assets/vendor.75f6e6ae65453426.js')).b;window.__testApp=app; const g=app.$webgl; return {game:Object.keys(g),renderer:Object.keys(g.renderer||{}),scenes:Object.keys(g.scenes),scene:g.scenes.current.id,vars:g.savestate.game.vars,text:document.body.innerText.slice(0,3500),teleport:g.scenes.teleportTo.toString().slice(0,2500)};}));
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
