const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs=require('fs');
const phase=process.argv[2]||'baseline';
(async()=>{const browser=await chromium.connectOverCDP('http://localhost:9333');const page=browser.contexts()[0].pages()[0];
const report=await page.evaluate(async()=>{const a=window.__testApp,g=a.$webgl,p=a.$savestate.game.player;const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const result=[];for(const part of ['head','body','bottom']){for(const k of ['head','body','bottom'])p[k]=k[0].toUpperCase()+k.slice(1)+'-Empty';for(const item of Object.keys(a.$items[part]).filter(x=>!x.endsWith('-Empty'))){p[part]=item;g.store.updatePlayerOutfit.emit(part);await frames();const e=g.playerCharacter.entry;result.push({part,item,fitted:e.custom.filter(x=>x.object.visible).map(x=>({node:x.node,parent:x.object.parent.name,vertices:x.object.geometry?.attributes?.position?.count})),fallback:e.accessories.filter(x=>x.mesh.visible).map(x=>x.part),sourceTransform:e.custom.find(x=>x.item===item)?.object.matrix.elements});}p[part]=part[0].toUpperCase()+part.slice(1)+'-Empty';}return {status:g.playerCharacter.status,scene:g.scenes.current.id,customCount:g.playerCharacter.entry.custom.length,result};});
fs.writeFileSync(`artifacts/accessory-fit/${phase}-coverage.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({phase,customCount:report.customCount,items:report.result.length,missing:report.result.filter(x=>!x.fitted.length),fallback:report.result.filter(x=>x.fallback.length)},null,2));
for(const [name,head,body,bottom] of [ ['crown-panda-boots','Head-VahineCrown','Body-PandaBackpack','Bottom-Boots'], ['glasses-backpack-sandals','Head-Glass1','Body-UrbanBackpack','Bottom-Sandals'], ['helmet-jetpack-fastshoes','Head-AstronautHelmet','Body-JetPack','Bottom-FastShoes'], ['dino','Head-Dino','Body-Dino','Bottom-Dino'] ]){
 await page.evaluate(({head,body,bottom})=>{const a=window.__testApp;Object.assign(a.$savestate.game.player,{head,body,bottom});a.$webgl.store.updatePlayerOutfit.emit();},{head,body,bottom});
 await page.waitForTimeout(2200);
 await page.screenshot({path:`artifacts/accessory-fit/${phase}-${name}.png`});console.log(`SCREENSHOT ${phase}-${name}`);
}
process.exit(0);})();
