const {chromium}=require('C:/Users/user/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const fs=require('fs');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--remote-debugging-port=9333','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];const failures=[];
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()}));
await page.goto('http://localhost:3000/',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(20000);
const probe=await page.evaluate(async()=>{const vendor=await import('/assets/vendor.75f6e6ae65453426.js'); window.__testApp=vendor.b;return {url:location.href,title:document.title,text:document.body.innerText.slice(0,8000),globalKeys:Object.keys(window).filter(k=>/app|game|sultra|three|player/i.test(k)),appKeys:Object.keys(vendor.b),buttons:Array.from(document.querySelectorAll('button,a')).map(e=>({tag:e.tagName,text:e.innerText,label:e.getAttribute('aria-label'),href:e.getAttribute('href')}))}});
await page.screenshot({path:'artifacts/accessory-fit/baseline.png'});
fs.writeFileSync('artifacts/accessory-fit/baseline-probe.json',JSON.stringify({probe,errors,failures},null,2));
console.log(JSON.stringify({probe,errors,failures},null,2));
console.log('BROWSER_READY_CDP_9333');
setInterval(()=>{},10000);
})();
