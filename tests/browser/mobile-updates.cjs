// Chromium mobile/standalone lifecycle simulation, not a physical iPhone test.
// Uses an isolated origin with deliberately year-long HTTP caching. No test calls
// registration.update(), clears caches, or reloads a page to apply an upgrade.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const E=require('../../docs/engine');
const root=path.resolve(__dirname,'../../docs');
const output=process.env.DINER_TEST_OUTPUT||'/workspace/work/midnight-diner/v36';
const source=new Map();
const read=file=>{if(!source.has(file))source.set(file,fs.readFileSync(path.join(root,file)));return source.get(file)};
const current=read('sw.js').toString().match(/const RELEASE = '([^']+)'/)[1];
const releases=[current,'20990101-v999-mobile-test','20990102-v1000-mobile-test'];
const hash=body=>crypto.createHash('sha256').update(body).digest('hex');
let phase=0,markerHold=null;
const requests=[],failures=[],passes=[];
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.mp3':'audio/mpeg','.woff2':'font/woff2','.wav':'audio/wav'};
function bodyFor(file,build){
  let body=read(file);
  if(['index.html','sw.js','version.json'].includes(file))body=Buffer.from(body.toString().replaceAll(current,releases[build]));
  // Runtime proof that the real server response executed, beyond an HTML meta tag.
  if(file==='game.js')body=Buffer.concat([body,Buffer.from(`\nwindow.loadedMobileTestRelease=${JSON.stringify(releases[build])};\n`)]);
  if(file==='sw.js'){
    let text=body.toString();
    // Production's generated hash manifest must describe our test-only stamps.
    // Keep every unchanged media hash intact to exercise content reuse honestly.
    for(const changed of ['index.html','game.js','version.json']){
      const original=read(changed);text=text.replaceAll(hash(original),hash(bodyFor(changed,build)));
    }
    body=Buffer.from(text);
  }
  return body;
}
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  const file=u.pathname.replace(/^\/midnight-diner\//,'')||'index.html';
  if(file.includes('..')){res.writeHead(403);return res.end()}
  let build=phase;
  const entry={file,url:u.pathname+u.search,build,at:Date.now(),requestCache:req.headers['cache-control']||'',bytes:0};
  requests.push(entry);
  if(file==='version.json'&&markerHold)await markerHold.promise;
  if(res.destroyed)return;
  try{
    const body=bodyFor(file,build);entry.bytes=body.length;
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain','Cache-Control':'public,max-age=31536000','Content-Length':body.length});
    res.end(body);
  }catch(error){entry.error=error.message;res.writeHead(404);res.end()}
});
function holdMarker(){
  assert.equal(markerHold,null);
  let resolve;const promise=new Promise(r=>resolve=r);
  markerHold={promise,resolve};
}
function releaseMarker(){const held=markerHold;markerHold=null;held?.resolve()}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=30000){
  const end=Date.now()+timeout;let last;
  while(Date.now()<end){try{last=await fn();if(last)return last}catch(error){last=error.message}await delay(60)}
  throw new Error(`Timed out: ${label}; last=${JSON.stringify(last)}`);
}
function pass(message){passes.push(message);console.log('PASS '+message)}
function fixture(){
  const saved=E.fresh();saved.level=5;saved.money=54321;
  for(const id in saved.inventory)saved.inventory[id]=100;
  E.progress(saved);E.open(saved);const guest=E.arrive(saved);
  guest.recipe='onigiri';saved.nightOrders[0]='onigiri';
  E.acceptOrder(saved,guest.id);E.beginCooking(saved,guest.id);
  for(const id of E.recipes.onigiri.ingredients)E.selectIngredient(saved,id);
  E.prepareIngredients(saved);
  const index=E.Cooking.plan('onigiri',E.recipes.onigiri).findIndex(step=>step.id==='portion');
  assert.ok(index>=0);
  for(let i=0;i<index;i++)E.completeCookingStep(saved,1);
  return saved;
}
async function lifecycle(page,{hidden=true,persisted=true,duplicates=true}={}){
  await page.evaluate(({hidden,persisted,duplicates})=>{
    if(hidden){window.__testHidden=true;document.dispatchEvent(new Event('visibilitychange'))}
    window.__testHidden=false;
    if(hidden)document.dispatchEvent(new Event('visibilitychange'));
    if(persisted)window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    if(duplicates)window.dispatchEvent(new Event('focus'));
  },{hidden,persisted,duplicates});
}
async function quiet(page){
  assert.equal(await page.locator('#app-update-gate').count(),0,'no checking dialog exists');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('app-checking-update')),false);
}
async function controllerIs(page,release){
  await until(()=>page.evaluate(release=>new Promise(resolve=>{
    const worker=navigator.serviceWorker?.controller;if(!worker)return resolve(false);
    const c=new MessageChannel(),timer=setTimeout(()=>{c.port1.close();resolve(false)},500);
    c.port1.onmessage=event=>{clearTimeout(timer);c.port1.close();resolve(event.data?.release===release)};
    worker.postMessage({type:'GET_RELEASE',clientRelease:document.querySelector('meta[name="app-release"]')?.content},[c.port2]);
  }),release),'controller '+release,180000);
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  assert.ok(fs.existsSync(path.join(root,'version.json')),'mobile updater must provide version.json');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/midnight-diner/`;
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  let page;
  try{
    const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,
      userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
    page=await context.newPage();
    page.on('pageerror',error=>failures.push(error.message));
    await page.addInitScript(saved=>{
      const match=window.matchMedia.bind(window);
      window.matchMedia=query=>query==='(display-mode: standalone)'?{matches:true,addEventListener(){},removeEventListener(){}}:match(query);
      window.__testHidden=false;
      Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__testHidden});
      Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__testHidden?'hidden':'visible'});
      sessionStorage.mobileTestNavigations=String(Number(sessionStorage.mobileTestNavigations||0)+1);
      window.mobileTestIntroOpens=0;
      const show=HTMLDialogElement.prototype.showModal;
      HTMLDialogElement.prototype.showModal=function(...args){if(this.id==='intro')window.mobileTestIntroOpens++;return show.apply(this,args)};
      if(!sessionStorage.mobileTestSeeded){localStorage.setItem('midnight-diner-save-v11',JSON.stringify(saved));sessionStorage.mobileTestSeeded='1'}
    },fixture());
    holdMarker();
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#intro').waitFor({state:'visible'});
    await quiet(page);
    await page.locator('#skip-intro').click();
    await page.locator('#cook-object').waitFor({state:'visible'});
    await quiet(page);
    pass('standalone cold launch and gameplay start immediately while the version request is held');

    async function scoop(){
      const rect=await page.locator('#cook-object').boundingBox();
      const start={x:rect.x+rect.width*.3,y:rect.y+rect.height*(.35+.4)/1.5};
      const end={x:rect.x+rect.width*.72,y:rect.y+rect.height*(.7+.4)/1.5};
      await page.mouse.move(start.x,start.y);await page.mouse.down();
      await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();
    }
    await scoop();
    await until(async()=>/1주걱/.test(await page.locator('.action-counter').innerText()),'one rice scoop during held request');
    releaseMarker();await controllerIs(page,current);
    const before=await page.evaluate(()=>({n:sessionStorage.mobileTestNavigations,intros:window.mobileTestIntroOpens,save:JSON.parse(localStorage.getItem('midnight-diner-save-v11'))}));

    await page.locator('#settings-open').evaluate(el=>el.click());
    const rapidStart=Date.now();
    for(let n=0;n<2;n++){
      const count=requests.filter(r=>r.file==='version.json').length;
      holdMarker();await lifecycle(page);
      await until(()=>requests.filter(r=>r.file==='version.json').length>count,'fresh foreground marker');
      await quiet(page);
      assert.equal(await page.locator('#settings-dialog').evaluate(el=>el.open),true);
      const enabled=await page.locator('#music-toggle').getAttribute('aria-pressed');
      await page.locator('#music-toggle').click();
      assert.notEqual(await page.locator('#music-toggle').getAttribute('aria-pressed'),enabled,'settings stay interactive during check');
      if(n===0)await page.screenshot({path:path.join(output,'quiet-return-settings.png')});
      releaseMarker();await delay(200);
      assert.equal(requests.filter(r=>r.file==='version.json').length,count+1,'duplicate return events coalesce');
      assert.equal(await page.evaluate(()=>sessionStorage.mobileTestNavigations),before.n);
      assert.equal(await page.evaluate(()=>window.mobileTestIntroOpens),before.intros);
    }
    assert.ok(Date.now()-rapidStart<15000);
    await page.locator('#settings-dialog [data-close]').click();
    pass('rapid returns check silently once each; held requests leave settings interactive without navigation or intro replay');

    const upgradeStart=requests.length;phase=1;holdMarker();await lifecycle(page);
    await quiet(page);
    const elapsedBefore=await page.evaluate(()=>{MidnightApp.saveForUpdate();return JSON.parse(localStorage.getItem('midnight-diner-save-v11')).nightElapsedMs});
    await scoop();
    await until(async()=>/2주걱/.test(await page.locator('.action-counter').innerText()),'second rice scoop while update is pending');
    await delay(900);
    const elapsedAfter=await page.evaluate(()=>{MidnightApp.saveForUpdate();return JSON.parse(localStorage.getItem('midnight-diner-save-v11')).nightElapsedMs});
    assert.ok(elapsedAfter-elapsedBefore>500,'game clock keeps advancing during held check');
    releaseMarker();await controllerIs(page,releases[1]);await delay(250);
    assert.equal(await page.evaluate(()=>window.loadedMobileTestRelease),current,'prepared update must not replace active cooking');
    assert.match(await page.locator('.action-counter').innerText(),/2주걱/);
    await quiet(page);
    for(const file of ['assets/opening-visible-rain.mp4','assets/music-minamo-v29.mp3'])assert.equal(requests.slice(upgradeStart).filter(r=>r.file===file).length,0,'reuse unchanged media '+file);
    pass('cooking gestures and clock continue during download; prepared worker never interrupts cooking or redownloads large media');

    // A real app switch permits the prepared page replacement out of sight.
    await page.evaluate(()=>{window.__testHidden=true;document.dispatchEvent(new Event('visibilitychange'))});
    await until(()=>page.evaluate(release=>window.loadedMobileTestRelease===release,releases[1]),'prepared update applied in background',30000);
    await page.locator('#cook-object').waitFor({state:'visible'});
    await quiet(page);
    assert.equal(await page.locator('#intro').evaluate(el=>el.open),false);
    assert.equal(await page.evaluate(()=>window.mobileTestIntroOpens),0);
    assert.equal(await page.locator('#money').innerText(),'¥54,321');
    assert.match(await page.locator('.action-counter').innerText(),/2주걱 \/ 3주걱/);
    const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('midnight-diner-save-v11')));
    assert.deepEqual(after.inventory,before.save.inventory);
    await page.screenshot({path:path.join(output,'quiet-update-resumed-cooking.png')});
    pass('prepared background replacement preserves two partial scoops, funds and inventory without intro replay');

    await context.setOffline(true);
    const offlineNavigation=await page.evaluate(()=>sessionStorage.mobileTestNavigations);
    await lifecycle(page);await delay(250);await quiet(page);
    assert.equal(await page.evaluate(()=>sessionStorage.mobileTestNavigations),offlineNavigation);
    assert.match(await page.locator('.action-counter').innerText(),/2주걱/);
    // This navigation represents app close/reopen, never applying an upgrade.
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#intro').waitFor({state:'visible'});await page.locator('#skip-intro').click();
    await page.locator('#cook-object').waitFor({state:'visible'});await quiet(page);
    assert.equal(await page.locator('#money').innerText(),'¥54,321');
    assert.match(await page.locator('.action-counter').innerText(),/2주걱 \/ 3주걱/);
    for(const file of ['assets/opening-visible-rain.mp4','assets/music-minamo-v29.mp3'])assert.equal(await page.evaluate(async file=>(await fetch(file,{headers:{Range:'bytes=4-31'}})).status,file),206);
    pass('offline returns and cold reopen remain immediately playable, retaining partial cooking and cached media ranges');
    await context.setOffline(false);
    // An unoccupied prep screen may apply when its open dialog and input finish.
    const idleContext=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
    const idle=await idleContext.newPage();idle.on('pageerror',error=>failures.push(error.message));
    const workerDebug=await idleContext.newCDPSession(idle);await workerDebug.send('ServiceWorker.enable');
    workerDebug.on('ServiceWorker.workerErrorReported',event=>console.error('Worker error',JSON.stringify(event)));
    const prep=E.fresh();prep.money=54321;
    await idle.addInitScript(saved=>{if(!sessionStorage.seeded){localStorage.setItem('midnight-diner-save-v11',JSON.stringify(saved));sessionStorage.seeded='1'}},prep);
    await idle.goto(url,{waitUntil:'domcontentloaded'});await idle.locator('#skip-intro').click();
    await controllerIs(idle,releases[1]);
    await idle.locator('#settings-open').click();
    phase=2;await idle.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
    await controllerIs(idle,releases[2]);await quiet(idle);
    assert.equal(await idle.evaluate(()=>window.loadedMobileTestRelease),releases[1]);
    await idle.locator('#settings-dialog [data-close]').click();
    await until(()=>idle.evaluate(release=>window.loadedMobileTestRelease===release,releases[2]),'automatic safe foreground update');
    await idle.locator('#app').waitFor({state:'visible'});await quiet(idle);
    assert.equal(await idle.locator('#intro').evaluate(el=>el.open),false);
    assert.equal(await idle.locator('#money').innerText(),'¥54,321');
    pass('pageshow prepares silently behind an open dialog, then applies automatically after closing and idle input');
    await idleContext.close();
    assert.deepEqual(failures,[],'no uncaught browser errors');
    const markers=requests.filter(r=>r.file==='version.json');
    assert.ok(markers.length>=5);
    assert.ok(markers.every(r=>r.url.includes('?')),'version marker must bypass stale HTTP caches');
    fs.writeFileSync(path.join(output,'mobile-updates.json'),JSON.stringify({current,releases,passes,requests,failures,environment:'Chromium 393×852 touch/standalone emulation with synthetic visibility and persisted pageshow; no physical iPhone'},null,2));
  }catch(error){
    if(page)await page.screenshot({path:path.join(output,'mobile-update-failure.png')}).catch(()=>{});
    fs.writeFileSync(path.join(output,'mobile-updates-failure.json'),JSON.stringify({error:error.stack,passes,requests,failures},null,2));
    throw error;
  }finally{releaseMarker();await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
