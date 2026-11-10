// The Capacitor bundle (www/) must start without a service worker or web update checks.
// Build and serve first: node tools/build-native.cjs, then serve www/ at NATIVE_URL (default http://127.0.0.1:8766/).
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.NATIVE_URL||'http://127.0.0.1:8766/';
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[],missing=[],urls=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>urls.push(r.url()));
    page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url())});
    await page.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'ios'};});
    await page.goto(base,{waitUntil:'load'});
    await page.waitForFunction(()=>document.getElementById('intro')?.open||!document.getElementById('app').hidden);
    if(await page.locator('#skip-intro').isVisible())await page.locator('#skip-intro').click();
    await page.waitForFunction(()=>!document.getElementById('app').hidden);
    await page.waitForTimeout(1500);
    const state=await page.evaluate(async()=>({
      workers:(await navigator.serviceWorker.getRegistrations()).length,
      installHidden:document.getElementById('install-app').hidden,offlineHidden:document.getElementById('offline-status').hidden,
      native:window.MidnightPlatform.ads.isNative()&&window.MidnightPlatform.store.isNative()&&window.MidnightPlatform.updater.isNative(),
      update:(await window.MidnightPlatform.updater.check()).status,
      room:document.querySelector('.interior-art').naturalWidth>0
    }));
    assert.deepEqual(state,{workers:0,installHidden:true,offlineHidden:true,native:true,update:'skipped',room:true});
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
    assert.ok(!urls.some(u=>/sw\.js|version\.json/.test(u)),'no worker or version requests');
    assert.ok(urls.every(u=>u.startsWith(base)||u.startsWith('data:')||u.startsWith('blob:')),'every request stays inside the bundle');
    console.log('PASS native bundle starts from local files only, without a service worker:',urls.length,'requests');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
