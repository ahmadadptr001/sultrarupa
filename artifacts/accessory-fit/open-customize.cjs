const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async()=>{const browser=await chromium.connectOverCDP('http://localhost:9333');const page=browser.contexts()[0].pages()[0];
console.log(await page.evaluate(async()=>{const a=window.__testApp; await a.$router.push('/customize');return {route:a.$route.name,scene:a.$webgl.scenes.current.id}}));
await page.waitForTimeout(5000);
console.log(await page.evaluate(()=>{const a=window.__testApp,g=a.$webgl,e=g.playerCharacter.entry;return {url:location.href,text:document.body.innerText.slice(0,3000),scene:g.scenes.current.id,custom:e.custom.map(x=>({item:x.item,node:x.node,bone:x.object.parent.name,visible:x.object.visible})),characterKeys:Object.keys(g.character),playerKeys:Object.keys(e.actor),cameraKeys:Object.keys(g.camera||{}),sceneKeys:Object.keys(g.scenes.current),rendererKeys:Object.keys(g.renderer||{})};}));
await page.screenshot({path:'artifacts/accessory-fit/baseline-customize.png'});process.exit(0);})();
