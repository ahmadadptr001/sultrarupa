const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async()=>{const browser=await chromium.connectOverCDP('http://localhost:9333');const page=browser.contexts()[0].pages()[0];
await page.evaluate(async()=>{const a=window.__testApp;a.$savestate.setVariable('isIntroCompleted',true);await a.$webgl.scenes.teleportTo('IslandWest',{point:'PortSpawnB',transition:'boat'});});
await page.waitForTimeout(5000);await page.evaluate(async()=>{await window.__testApp.$router.push({name:'Customize'});});await page.waitForTimeout(3000);
console.log(await page.evaluate(()=>{const a=window.__testApp,g=a.$webgl;return {route:a.$route.name,scene:g.scenes.current.id,text:document.body.innerText.slice(0,1000),isCustomizing:g.store.isCustomizing.value,camKeys:Object.keys(g.scenes.current.camera||{}),cameraBase:g.scenes.current.camera?.base?.position?.toArray(),entry:g.playerCharacter.status,custom:g.playerCharacter.entry.custom.length};}));
await page.screenshot({path:'artifacts/accessory-fit/baseline-wardrobe.png'});process.exit(0);})();
