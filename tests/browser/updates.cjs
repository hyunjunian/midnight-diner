// Real worker migration with deliberately year-long HTTP caching; no hard reload or cleared storage.
const{chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),assert=require('node:assert/strict'),E=require('../../docs/engine');
const root=path.resolve(__dirname,'../../docs'),repo=path.resolve(root,'..'),current=fs.readFileSync(path.join(root,'sw.js'),'utf8').match(/const RELEASE = '([^']+)'/)[1],future='20990101-v999-test';
(async()=>{
  const old=new Map(['index.html','pwa.js','game.js','sw.js','polish.css'].map(f=>[f,execFileSync('git',['show',`fc45ef5:docs/${f}`],{cwd:repo})]));
  let phase=0;
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4','.mp3':'audio/mpeg','.woff2':'font/woff2','.wav':'audio/wav'};
  const server=http.createServer((req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname.replace(/^\/midnight-diner\//,'')||'index.html';
    if(file.includes('..')){res.writeHead(403);return res.end()}
    try{
      let body=phase===0&&old.has(file)?old.get(file):fs.readFileSync(path.join(root,file));
      if(phase===2&&['index.html','sw.js'].includes(file))body=Buffer.from(body.toString().replaceAll(current,future));
      if(file==='game.js')body=Buffer.concat([body,Buffer.from(`\nwindow.loadedTestRelease=${phase};`)]);
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain','Cache-Control':'public,max-age=31536000'});res.end(body);
    }catch{res.writeHead(404);res.end()}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/midnight-diner/`,browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const saved=E.fresh();saved.money=54321;E.open(saved);const guest=E.arrive(saved);E.acceptOrder(saved,guest.id);E.beginCooking(saved,guest.id);for(const id of E.recipes[guest.recipe].ingredients)E.selectIngredient(saved,id);E.prepareIngredients(saved);while(saved.kitchen.stage==='process')E.completeCookingStep(saved,1);
    await page.addInitScript(s=>{if(!sessionStorage.updateSeed){localStorage.setItem('midnight-diner-save-v11',JSON.stringify(s));sessionStorage.updateSeed='1'}},saved);
    await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('#skip-intro').click();
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    assert.equal(await page.evaluate(()=>window.loadedTestRelease),0);assert.ok(await page.locator('[data-work="deliver"]').isVisible());
    async function controllerIs(release){
      const deadline=Date.now()+180000;
      while(Date.now()<deadline){
        const value=await page.evaluate(()=>new Promise(resolve=>{
          if(!navigator.serviceWorker.controller)return resolve(null);
          const c=new MessageChannel(),timer=setTimeout(()=>{c.port1.close();resolve(null)},300);
          c.port1.onmessage=e=>{clearTimeout(timer);c.port1.close();resolve(e.data.release)};
          navigator.serviceWorker.controller.postMessage({type:'GET_RELEASE'},[c.port2]);
        }));
        if(value===release)return;
        await new Promise(r=>setTimeout(r,100));
      }
      throw new Error('Controller did not activate '+release);
    }
    phase=1;await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update()});await controllerIs(current);
    assert.equal(await page.evaluate(()=>window.loadedTestRelease),0,'migration must not force an old active cooking page to reload');
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('#intro').waitFor({state:'visible'});await page.locator('#skip-intro').click();
    assert.equal(await page.evaluate(()=>window.loadedTestRelease),1);assert.equal(await page.locator('#money').innerText(),'¥54,321');assert.ok(await page.locator('[data-work="deliver"]').isVisible());
    console.log('PASS legacy worker adopts update with page open; ordinary reload fetches latest code despite long HTTP cache');
    phase=2;await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update()});await controllerIs(future);
    assert.equal(await page.evaluate(()=>window.loadedTestRelease),1);assert.equal(await page.evaluate(()=>MidnightApp.isCooking()),true);
    assert.ok(await page.locator('[data-work="deliver"]').isVisible());
    assert.equal(await page.evaluate(async release=>(await(await fetch('game.js?release='+release)).text()).includes('loadedTestRelease=1'),current),true,'the running release retains its own code after worker activation');
    await page.locator('[data-work="deliver"]').click();
    await page.waitForFunction(()=>window.loadedTestRelease===2,{},{timeout:30000});
    await page.locator('#intro').waitFor({state:'visible'});await page.locator('#skip-intro').click();
    assert.equal(await page.locator('#money').innerText(),'¥54,321');
    const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('midnight-diner-save-v11')));
    assert.equal(after.kitchen,null);assert.equal(after.guests.find(g=>g.id===after.guests[0].id).status,'eating');
    console.log('PASS automatic update waits for real cooking delivery, then saves and reloads without an update button');
    await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#intro').waitFor({state:'visible'});await page.locator('#skip-intro').click();
    assert.equal(await page.evaluate(()=>window.loadedTestRelease),2);assert.equal(await page.locator('#money').innerText(),'¥54,321');
    assert.equal(await page.evaluate(async()=>(await fetch('assets/opening-visible-rain.mp4',{headers:{Range:'bytes=4-31'}})).status),206);
    assert.equal(await page.evaluate(async()=>(await fetch('assets/music-minamo-v29.mp3',{headers:{Range:'bytes=4-31'}})).status),206);
    assert.deepEqual(errors,[]);
    console.log('PASS release-consistent offline reload, saved funds/service, MP4 and MP3 ranges; no reload loop or page errors');
  }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
