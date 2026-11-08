// Existing v34 installed clients adopt the mobile fix on return, without reload.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),assert=require('node:assert/strict'),E=require('../../docs/engine');
const root=path.resolve(__dirname,'../../docs'),repo=path.resolve(root,'..');
const source=new Map(),read=f=>{if(!source.has(f))source.set(f,fs.readFileSync(path.join(root,f)));return source.get(f)};
const current=read('sw.js').toString().match(/const RELEASE = '([^']+)'/)[1];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
  const old=new Map(['index.html','pwa.js','game.js','sw.js'].map(f=>[f,execFileSync('git',['show',`e053970:docs/${f}`],{cwd:repo})]));
  let phase=0;
  function bodyFor(file){
    let body=phase===0&&old.has(file)?old.get(file):read(file);
    if(file==='game.js')body=Buffer.concat([body,Buffer.from(`\nwindow.loadedTestRelease=${phase};`)]);
    if(file==='sw.js'&&phase===1)body=Buffer.from(body.toString().replaceAll(hash(read('game.js')),hash(bodyFor('game.js'))));
    return body;
  }
  const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4','.mp3':'audio/mpeg','.woff2':'font/woff2','.wav':'audio/wav'};
  const server=http.createServer((req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname.replace(/^\/midnight-diner\//,'')||'index.html';
    if(file.includes('..')){res.writeHead(403);return res.end()}
    try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain','Cache-Control':'public,max-age=31536000'});res.end(bodyFor(file))}
    catch{res.writeHead(404);res.end()}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/midnight-diner/`,browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const saved=E.fresh();saved.money=54321;E.open(saved);const guest=E.arrive(saved);E.acceptOrder(saved,guest.id);E.beginCooking(saved,guest.id);for(const id of E.recipes[guest.recipe].ingredients)E.selectIngredient(saved,id);E.prepareIngredients(saved);while(saved.kitchen.stage==='process')E.completeCookingStep(saved,1);
    await page.addInitScript(s=>{
      Object.defineProperty(document,'hidden',{configurable:true,get:()=>!!window.testHidden});
      if(!sessionStorage.updateSeed){localStorage.setItem('midnight-diner-save-v11',JSON.stringify(s));sessionStorage.updateSeed='1'}
    },saved);
    await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('#skip-intro').click();
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    assert.equal(await page.evaluate(()=>window.loadedTestRelease),0);assert.ok(await page.locator('[data-work="deliver"]').isVisible());
    // The shipped v34 client itself calls registration.update() on visibility.
    phase=1;
    await page.evaluate(()=>{window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForFunction(()=>window.loadedTestRelease===1,null,{timeout:180000});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('app-checking-update'));
    assert.equal(await page.locator('#intro').evaluate(el=>el.open),false,'legacy return resumes directly');
    assert.equal(await page.locator('#money').innerText(),'¥54,321');assert.ok(await page.locator('[data-work="deliver"]').isVisible());
    assert.equal(await page.evaluate(()=>document.querySelector('meta[name="app-release"]').content),current);
    assert.equal(await page.evaluate(()=>location.search),'','public URL remains stable');
    const previous='20261108-v34-dock-state';
    assert.ok(await page.evaluate(async release=>(await(await fetch('game.js?release='+release)).text()).includes('loadedTestRelease=0'),previous),'old open clients retain their matching script cache');
    console.log('PASS existing v34 mobile client automatically adopts newest code on return, including completed cooking and saved funds');
    await context.setOffline(true);await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('#intro').waitFor({state:'visible'});await page.locator('#skip-intro').click();
    assert.equal(await page.evaluate(()=>window.loadedTestRelease),1);assert.equal(await page.locator('#money').innerText(),'¥54,321');assert.ok(await page.locator('[data-work="deliver"]').isVisible());
    for(const file of ['assets/opening-visible-rain.mp4','assets/music-minamo-v29.mp3'])assert.equal(await page.evaluate(async file=>(await fetch(file,{headers:{Range:'bytes=4-31'}})).status,file),206);
    assert.deepEqual(errors,[]);
    console.log('PASS latest cached shell reopens offline with saved cooking, MP4/MP3 byte ranges and no browser errors');
  }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
