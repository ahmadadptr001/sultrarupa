const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async()=>{const browser=await chromium.connectOverCDP('http://localhost:9333');const page=browser.contexts()[0].pages()[0];
await page.evaluate(async()=>{const a=window.__testApp;a.$savestate.setVariable('isTutoCompleted',true);a.$webgl.scenes.current.setState('Playing');await a.$router.push({name:'Home'});});await page.waitForTimeout(5000);
await page.getByRole('button',{name:'Atur karakter',exact:true}).click();await page.waitForTimeout(3000);
console.log(await page.evaluate(()=>{const g=window.__testApp.$webgl;return {scene:g.scenes.current.id,route:window.__testApp.$route.name,state:g.scenes.current.state,cam:g.scenes.current.getCurrentCamera().cam.position.toArray(),player:g.scenes.current.player.base.position.toArray()};}));
await page.screenshot({path:'artifacts/accessory-fit/baseline-wardrobe-reopen.png'});process.exit(0);})();
