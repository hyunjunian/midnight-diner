// Live resizing: the room's cover crop and every interactive target share a scale.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),E=require('../../docs/engine');
const base=process.env.DINER_URL||'http://127.0.0.1:8765/midnight-diner/';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:393,height:852},serviceWorkers:'block'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{if(sessionStorage.roomSeed)localStorage.setItem('midnight-diner-save-v11',sessionStorage.roomSeed)});
 await p.goto(base);await p.locator('#skip-intro').click();await p.locator('[data-location="kitchen"]').click();
 for(const[w,h]of[[320,568],[393,852],[852,393],[1280,720],[1920,1080]]){
  await p.setViewportSize({width:w,height:h});await p.waitForTimeout(150);
  const v=await p.locator('.kitchen-room-art').evaluate(e=>{const r=e.getBoundingClientRect();return{size:getComputedStyle(e).backgroundSize,overflow:e.scrollHeight-e.clientHeight,hot:[...e.querySelectorAll('[data-station]')].map(x=>{const q=x.getBoundingClientRect(),label=x.querySelector('span').getBoundingClientRect();return{id:x.dataset.station,visible:!x.hidden,inBounds:q.left>=r.left-1&&q.right<=r.right+1&&q.top>=r.top-1&&q.bottom<=r.bottom+1,labelInBounds:label.top>=r.top-1&&label.bottom<=r.bottom+1}})}});
  assert.equal(v.size,'cover');assert.ok(v.overflow<=1,JSON.stringify(v));assert.ok(v.hot.every(x=>x.visible&&x.inBounds&&x.labelInBounds),JSON.stringify(v));if(process.env.DINER_TEST_OUTPUT)await p.screenshot({path:process.env.DINER_TEST_OUTPUT+'/kitchen-'+w+'.png'});console.log('PASS room uniform aspect and reachable projected targets',w,h);
 }
 await p.setViewportSize({width:393,height:852});await p.locator('[data-location="counter"]').click();
 const s=E.fresh();E.open(s);const g=E.arrive(s);E.acceptOrder(s,g.id);E.beginCooking(s,g.id);
 await p.evaluate(s=>sessionStorage.roomSeed=JSON.stringify(s),s);await p.reload();await p.locator('#skip-intro').click();await p.locator('.hotspot-fridge').click();await p.locator('.fridge-cabinet').waitFor();
 for(const[w,h]of[[320,568],[393,852],[852,393],[1280,720]]){
  await p.setViewportSize({width:w,height:h});await p.waitForTimeout(150);
  const ratio=await p.locator('.fridge-cabinet').evaluate(e=>e.clientWidth/e.clientHeight);assert.ok(Math.abs(ratio-941/1672)<.005,'fridge aspect '+w+' '+ratio);
  assert.ok(await p.locator('[data-door="fridge"]').isVisible());console.log('PASS fridge native aspect and door target',w,h);
 }
 await p.locator('[data-door="fridge"]').click();assert.equal(await p.locator('[data-door="fridge"]').getAttribute('aria-expanded'),'true');
 assert.deepEqual(errors,[]);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
