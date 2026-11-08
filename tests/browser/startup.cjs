// Run against the local docs server: DINER_URL=http://127.0.0.1:8765/midnight-diner/ node tests/browser/startup.cjs
const {chromium}=require('playwright'),assert=require('node:assert/strict'),E=require('../../docs/engine');
const base=process.env.DINER_URL||'http://127.0.0.1:8765/midnight-diner/';
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    for(const mode of ['browser','standalone','embedded']){
      const page=await browser.newPage({viewport:{width:393,height:852},serviceWorkers:'block'}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      const saved=E.fresh();saved.money=9876;saved.level=3;
      await page.addInitScript(({saved,mode})=>{
        localStorage.setItem('midnight-diner-save-v11',JSON.stringify(saved));
        if(mode==='standalone'){const match=window.matchMedia.bind(window);window.matchMedia=query=>query==='(display-mode: standalone)'?{matches:true,addEventListener(){}}:match(query)}
        window.startupFrames=[];
        const sample=()=>{const app=document.getElementById('app'),intro=document.getElementById('intro');if(app&&intro)window.startupFrames.push({appVisible:getComputedStyle(app).display!=='none',introOpen:intro.open,installVisible:!!document.getElementById('install-screen')});requestAnimationFrame(sample)};
        requestAnimationFrame(sample);
      },{saved,mode});
      let release;const gate=new Promise(r=>release=r);
      await page.route('**/game.js*',async route=>{await gate;await route.continue()});
      await page.goto(new URL(mode==='embedded'?'preview.html':'',base).href,{waitUntil:'commit'});
      const frame=mode==='embedded'?page.frameLocator('iframe'):page;
      await frame.locator('#app').waitFor({state:'attached'});
      assert.equal(await frame.locator('#app').isVisible(),false);
      assert.equal(await frame.locator('#intro').isVisible(),false);
      if(mode==='embedded')assert.equal(await page.locator('iframe').evaluate(e=>getComputedStyle(e).display),'none');
      await page.waitForTimeout(250); // Give multiple paint frames a chance to expose the old flash.
      release();
      await frame.locator('#intro').waitFor({state:'visible'});
      assert.equal(await frame.locator('#app').isVisible(),false);
      assert.equal(await frame.locator('#install-screen').count(),0);
      assert.equal(await frame.locator('#install-app').isVisible(),false);
      if(mode==='embedded')assert.equal(await page.locator('iframe').isVisible(),true);
      const samples=await frame.locator('body').evaluate(()=>window.startupFrames);
      assert.ok(samples.length>0);
      assert.ok(samples.every(f=>!f.appVisible&&!f.installVisible),mode+' flashed an inactive stage');
      await frame.locator('#skip-intro').click();
      assert.equal(await frame.locator('#app').isVisible(),true);
      assert.equal(await frame.locator('#intro').isVisible(),false);
      assert.equal(await frame.locator('#money').innerText(),'¥9,876');
      await frame.locator('#settings-open').click();
      assert.equal(await frame.locator('#install-app').isVisible(),true);
      await frame.locator('#install-app').click();
      assert.equal(await frame.locator('#install-guide').isVisible(),true);
      assert.deepEqual(errors,[]);
      console.log('PASS no startup flash, direct play, preserved save, optional installation:',mode);
      await page.close();
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
