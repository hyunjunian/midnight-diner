// Chromium mobile/standalone lifecycle simulation, not a physical iPhone test.
// Uses an isolated origin with deliberately year-long HTTP caching. No test calls
// registration.update(), clears caches, or reloads a page to apply an upgrade.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const E=require('../../docs/engine');
const root=path.resolve(__dirname,'../../docs');
const output=process.env.DINER_TEST_OUTPUT||'/workspace/work/midnight-diner/v35';
const source=new Map();
const read=file=>{if(!source.has(file))source.set(file,fs.readFileSync(path.join(root,file)));return source.get(file)};
const current=read('sw.js').toString().match(/const RELEASE = '([^']+)'/)[1];
const releases=[current,'20990101-v999-mobile-test','20990102-v1000-mobile-test'];
const hash=body=>crypto.createHash('sha256').update(body).digest('hex');
let phase=0,markerHold=null,coldIndexOnce=null;
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
  // Model a stale HTML shell restored at cold launch while marker/worker are new.
  if(file==='index.html'&&coldIndexOnce!==null&&!u.searchParams.has('asset-rev')){
    build=coldIndexOnce;coldIndexOnce=null;
  }
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
async function gateVisible(page){return page.evaluate(()=>document.documentElement.classList.contains('app-checking-update')&&document.querySelector('#app-update-gate')?.open)}
async function gateGone(page){return page.evaluate(()=>!document.documentElement.classList.contains('app-checking-update')&&!document.querySelector('#app-update-gate')?.open)}
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
    await until(()=>gateVisible(page),'cold launch freshness gate');
    assert.equal(await page.locator('#intro').evaluate(el=>el.open),false,'intro must wait for freshness');
    assert.equal(await page.locator('#app').isVisible(),false,'old game must not flash');
    await page.screenshot({path:path.join(output,'mobile-update-cold-gate.png')});
    releaseMarker();
    await page.locator('#intro').waitFor({state:'visible',timeout:30000});
    await page.locator('#skip-intro').click();
    await until(()=>gateGone(page),'cold gate dismissed');
    await controllerIs(page,current);
    assert.equal(await page.evaluate(()=>window.loadedMobileTestRelease),current);
    await page.locator('#cook-object').waitFor({state:'visible'});
    pass('standalone cold launch blocks old UI and intro until an uncached version response');

    // Commit one real diagonal rice gesture, leaving this step partially complete.
    const rect=await page.locator('#cook-object').boundingBox();
    const start={x:rect.x+rect.width*.3,y:rect.y+rect.height*(.35+.4)/1.5};
    const end={x:rect.x+rect.width*.72,y:rect.y+rect.height*(.7+.4)/1.5};
    await page.mouse.move(start.x,start.y);await page.mouse.down();
    await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();
    await until(async()=>/1주걱/.test(await page.locator('.action-counter').innerText()),'one rice scoop');
    const before=await page.evaluate(()=>({n:sessionStorage.mobileTestNavigations,intros:window.mobileTestIntroOpens,save:JSON.parse(localStorage.getItem('midnight-diner-save-v11'))}));

    // An already-open modal must also be covered by the blocking update gate.
    await page.evaluate(()=>document.querySelector('#settings-dialog').showModal());
    const rapidStart=Date.now();
    for(let n=0;n<2;n++){
      const count=requests.filter(r=>r.file==='version.json').length;
      holdMarker();await lifecycle(page);
      await until(()=>gateVisible(page),'foreground blocking gate');
      await until(()=>requests.filter(r=>r.file==='version.json').length>count,'fresh foreground marker');
      const top=await page.evaluate(()=>{const el=document.elementFromPoint(innerWidth/2,innerHeight/2);return el?.id==='app-update-gate'||!!el?.closest('#app-update-gate')});
      assert.equal(top,true,'update gate must block the pre-existing settings dialog');
      if(n===0)await page.screenshot({path:path.join(output,'mobile-update-modal-gate.png')});
      releaseMarker();await until(()=>gateGone(page),'same-release foreground completes');
      await delay(150);
      assert.equal(requests.filter(r=>r.file==='version.json').length,count+1,'one return must coalesce visibility/pageshow/focus events');
      assert.equal(await page.evaluate(()=>sessionStorage.mobileTestNavigations),before.n);
      assert.equal(await page.evaluate(()=>window.mobileTestIntroOpens),before.intros);
      assert.equal(await page.locator('#settings-dialog').evaluate(el=>el.open),true);
    }
    assert.ok(Date.now()-rapidStart<15000,'rapid returns should exercise the removed 15 second throttle');
    await page.evaluate(()=>document.querySelector('#settings-dialog').close());
    pass('two rapid mobile returns each check once; duplicate events coalesce; same release preserves modal and never reloads/replays intro');

    const upgradeStart=requests.length;phase=1;holdMarker();
    await lifecycle(page);await until(()=>gateVisible(page),'upgrade foreground gate');
    assert.equal(await page.evaluate(()=>window.loadedMobileTestRelease),current,'running JS stays old behind the gate until atomic update is ready');
    releaseMarker();
    await until(()=>page.evaluate(release=>window.loadedMobileTestRelease===release,releases[1]),'automatic foreground upgraded JS',180000);
    await until(()=>gateGone(page),'upgraded gate dismissed');
    await page.locator('#cook-object').waitFor({state:'visible'});
    assert.equal(await page.locator('#intro').evaluate(el=>el.open),false,'foreground upgrade must resume without intro');
    assert.equal(await page.evaluate(()=>window.mobileTestIntroOpens),0);
    assert.equal(await page.locator('#money').innerText(),'¥54,321');
    assert.match(await page.locator('.action-counter').innerText(),/1주걱 \/ 3주걱/,'partial cooking gesture must survive updated reload');
    const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('midnight-diner-save-v11')));
    assert.equal(after.kitchen.step,before.save.kitchen.step);
    assert.deepEqual(after.inventory,before.save.inventory);
    const upgradeRequests=requests.slice(upgradeStart);
    for(const file of ['assets/opening-visible-rain.mp4','assets/music-minamo-v29.mp3'])assert.equal(upgradeRequests.filter(r=>r.file===file).length,0,'unchanged cached media must be reused: '+file);
    await page.screenshot({path:path.join(output,'mobile-update-resumed-cooking.png')});
    pass('foreground alone atomically loads changed JavaScript, preserves funds/inventory/one partial scoop, skips intro, and reuses unchanged large media');

    // iOS can restore a frozen page using pageshow without a visibility transition.
    phase=2;
    await lifecycle(page,{hidden:false,persisted:true,duplicates:false});
    await until(()=>page.evaluate(release=>window.loadedMobileTestRelease===release,releases[2]),'pageshow-only automatic update',180000);
    await until(()=>gateGone(page),'pageshow restored gate dismissed');
    assert.equal(await page.locator('#intro').evaluate(el=>el.open),false);
    assert.match(await page.locator('.action-counter').innerText(),/1주걱 \/ 3주걱/);
    pass('persisted pageshow alone detects and applies a newer build with no manual refresh');

    // A stale shell can be returned before the first intro has launched. Its
    // initial update must retain the last session's separate cooking checkpoint.
    const coldNavigation=Number(await page.evaluate(()=>sessionStorage.mobileTestNavigations));
    coldIndexOnce=1;
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await until(()=>page.evaluate(({release,count})=>window.loadedMobileTestRelease===release&&Number(sessionStorage.mobileTestNavigations)>=count+2,{release:releases[2],count:coldNavigation}),'cold stale shell automatically replaced before intro',30000);
    await until(()=>gateGone(page),'cold initial update completes');
    if(await page.locator('#intro').evaluate(el=>el.open))await page.locator('#skip-intro').click();
    await page.locator('#cook-object').waitFor({state:'visible'});
    assert.match(await page.locator('.action-counter').innerText(),/1주걱 \/ 3주걱/,'initial upgrade before launch must not overwrite saved cooking checkpoint');
    assert.equal(await page.locator('#money').innerText(),'¥54,321');
    pass('cold stale shell updates before intro without overwriting the previous partial cooking checkpoint');

    await context.setOffline(true);
    const offlineNavigation=await page.evaluate(()=>sessionStorage.mobileTestNavigations);
    await lifecycle(page);await until(()=>gateGone(page),'offline foreground fallback',30000);
    assert.equal(await page.evaluate(()=>sessionStorage.mobileTestNavigations),offlineNavigation);
    assert.equal(await page.evaluate(()=>window.loadedMobileTestRelease),releases[2]);
    assert.match(await page.locator('.action-counter').innerText(),/1주걱 \/ 3주걱/);
    pass('offline return releases freshness gate and resumes the cached build without losing cooking progress');

    // This navigation represents closing/reopening the installed app offline;
    // upgrades above were applied exclusively by production lifecycle handlers.
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await until(()=>gateGone(page),'offline cold reopen freshness fallback',30000);
    if(await page.locator('#intro').evaluate(el=>el.open))await page.locator('#skip-intro').click();
    await page.locator('#cook-object').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>window.loadedMobileTestRelease),releases[2]);
    assert.equal(await page.locator('#money').innerText(),'¥54,321');
    assert.match(await page.locator('.action-counter').innerText(),/1주걱 \/ 3주걱/,'offline cold reopen retains partial cooking');
    assert.equal(await page.evaluate(async()=>(await fetch('assets/opening-visible-rain.mp4',{headers:{Range:'bytes=4-31'}})).status),206);
    assert.equal(await page.evaluate(async()=>(await fetch('assets/music-minamo-v29.mp3',{headers:{Range:'bytes=4-31'}})).status),206);
    const reopenedNavigation=await page.evaluate(()=>sessionStorage.mobileTestNavigations);
    await delay(750);
    assert.equal(await page.evaluate(()=>sessionStorage.mobileTestNavigations),reopenedNavigation,'offline cold reopen must not loop');
    assert.equal(await gateGone(page),true);
    pass('offline cold app reopen preserves funds/partial scoop, completes freshness gate without a loop, and serves cached MP4/MP3 byte ranges');
    await context.setOffline(false);
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
