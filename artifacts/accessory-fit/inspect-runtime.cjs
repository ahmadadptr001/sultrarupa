const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async()=>{const browser=await chromium.connectOverCDP('http://localhost:9333');const page=browser.contexts()[0].pages()[0];
console.log(await page.evaluate(()=>{const a=window.__testApp;return {text:document.body.innerText.slice(0,5000),props:Reflect.ownKeys(document.querySelector('#app').__vue_app__.config.globalProperties),app:!!a.$webgl,gameKeys:a.$webgl&&Object.keys(a.$webgl),player:a.$savestate?.game.player,entry:a.$webgl?.playerCharacter&&Object.keys(a.$webgl.playerCharacter),scene:a.$webgl?.scenes?.current?.id,vars:a.$savestate?.game.vars};}));
await page.screenshot({path:'artifacts/accessory-fit/baseline-ready.png'});process.exit(0);})();
