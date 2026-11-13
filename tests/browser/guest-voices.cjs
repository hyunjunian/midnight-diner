const {chromium}=require('playwright'),assert=require('node:assert/strict'),E=require('../../docs/engine');
const base=process.env.DINER_URL||'http://127.0.0.1:8765/midnight-diner/';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:320,height:659},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 await page.addInitScript(()=>{if(sessionStorage.fixture)localStorage.setItem('midnight-diner-save-v11',sessionStorage.fixture)});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 const speech=()=>page.locator('#talk-line .dialogue-reader').textContent();
 for(const person of [2,7,16]){
  const s=E.fresh();E.open(s);s.nextVisitor=person;const g=E.arrive(s);
  await page.evaluate(s=>sessionStorage.fixture=JSON.stringify(s),s);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#skip-intro').click();
  await page.locator(`[data-guest="${g.id}"]`).first().click();assert.equal(await speech(),E.guestConversation(s,g.id).line);
  for(const reply of ['welcome','day','quiet','order']){
   await page.locator(`[data-guest-reply="${reply}"]`).click();assert.ok(E.answerGuest(s,g.id,reply));assert.equal(await speech(),E.guestConversation(s,g.id).line);
  }
  assert.ok((await speech()).includes(E.recipes[g.recipe].name));
  const bounds=await page.locator('#talk-next').boundingBox();assert.ok(bounds&&bounds.y+bounds.height<=659,'order control stays reachable at 320px');
 }
 assert.deepEqual(errors,[]);console.log('PASS distinct guest voices, contextual replies, quiet branch and reachable ordering at 320px');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
