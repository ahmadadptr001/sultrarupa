const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async()=>{const browser=await chromium.connectOverCDP('http://localhost:9333');const page=browser.contexts()[0].pages()[0];
console.log(await page.evaluate(()=>{const a=window.__testApp,g=a.$webgl;return {head:Object.keys(a.$items.head),body:Object.keys(a.$items.body),bottom:Object.keys(a.$items.bottom),headGeometry:Object.keys(g.character.heads),bodyGeometry:Object.keys(g.character.bodies),bottomGeometry:Object.keys(g.character.bottoms)};}));process.exit(0);})();
