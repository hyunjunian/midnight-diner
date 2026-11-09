const{chromium}=require('playwright'),{PNG}=require('pngjs'),assert=require('node:assert/strict'),E=require('../../docs/engine'),L=require('../../docs/cooking-layout');
const base=process.env.DINER_URL||'http://127.0.0.1:8765/midnight-diner/';
function fixture(id,index){const s=E.fresh();s.level=5;s.money=100000;for(const key in s.inventory)s.inventory[key]=100;E.progress(s);E.open(s);const g=E.arrive(s);g.recipe=id;s.nightOrders[0]=id;E.acceptOrder(s,g.id);E.beginCooking(s,g.id);for(const key of E.recipes[id].ingredients)E.selectIngredient(s,key);E.prepareIngredients(s);for(let n=0;n<index;n++)E.completeCookingStep(s,1);return s;}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await p.emulateMedia({reducedMotion:'reduce'});await p.addInitScript(()=>{if(sessionStorage.foregroundFixture)localStorage.setItem('midnight-diner-save-v11',sessionStorage.foregroundFixture);document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--safe-top','59px');document.documentElement.style.setProperty('--safe-bottom','34px')})});
 await p.goto(base,{waitUntil:'domcontentloaded'});
 async function seed(s){await p.evaluate(s=>{sessionStorage.foregroundFixture=JSON.stringify(s);localStorage.removeItem('midnight-diner-cooking-checkpoint-v1')},s);await p.reload({waitUntil:'domcontentloaded'});await p.locator('#skip-intro').click();}
 const sources=new Set();let scenes=0;
 for(const id of ['onigiri','tamago','tonjiru','ochazuke','negi_omelette']){
  const plan=E.Cooking.plan(id,E.recipes[id]);
  for(let i=0;i<plan.length;i++){
   if(plan[i].id==='heat')continue;await seed(fixture(id,i));
   const v=await p.evaluate(async()=>{const frame=document.querySelector('.recipe-frame'),c=getComputedStyle(frame),file=c.backgroundImage.match(/assets\/(.*?)\.webp/)[1],image=new Image();image.src=c.backgroundImage.slice(5,-2);await image.decode();const row=document.querySelector('.kitchen-header').getBoundingClientRect(),title=document.getElementById('kitchen-order').getBoundingClientRect(),count=document.getElementById('kitchen-step-count').getBoundingClientRect(),a=document.querySelector('.prep-scene').getBoundingClientRect(),f=document.getElementById('kitchen-footer').getBoundingClientRect();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return{file,ratio:image.width/image.height,alpha:ctx.getImageData(2,2,1,1).data[3],mask:c.maskImage,center:Number(document.querySelector('.process-view').dataset.foodCenter),height:innerHeight,bottom:a.bottom,footer:f.top,titleCenter:title.y+title.height/2,countCenter:count.y+count.height/2,headerCenter:row.y+row.height/2,guest:getComputedStyle(document.getElementById('kitchen-guest')).display};});
   assert.ok(/^foreground-v\d+-/.test(v.file),id+':'+i);assert.ok(v.alpha<=3,v.file+' transparent corner');assert.equal(v.mask,'none');assert.equal(v.guest,'none');assert.ok(Math.abs(v.titleCenter-v.countCenter)<1,'aligned order row');assert.ok(Math.abs(v.titleCenter-v.headerCenter)<2,'balanced header padding');assert.ok(Math.abs(v.center-v.height*(plan[i].id==='assemble'?.58:.60))<1,'approved food center');
   const src=L.source(v.file);assert.ok(Math.abs(v.ratio-src.ratio)<.003,v.file+' source aspect');
   if(src.ratio===.5&&v.file!=='foreground-v39-core-portion')assert.ok(v.bottom>v.height,v.file+' sleeves exit viewport');sources.add(v.file);scenes++;
  }
 }
 for(const [look,value]of [['raw',0],['burnt',1]])for(const stage of ['wrap','assemble']){
  const plan=E.Cooking.plan('onigiri',E.recipes.onigiri),s=fixture('onigiri',plan.findIndex(st=>st.id===stage));s.kitchen.heatValue=value;await seed(s);
  const v=await p.locator('.recipe-frame').evaluate(async el=>{const c=getComputedStyle(el),im=new Image();im.src=c.backgroundImage.slice(5,-2);await im.decode();return{file:c.backgroundImage,look:el.dataset.appearance,ratio:im.width/im.height}});
  assert.equal(v.look,look);assert.ok(v.file.includes(stage==='wrap'?`foreground-v39-core-wrap-${look}`:'foreground-v39-plate-onigiri'));
  assert.ok(Math.abs(v.ratio-(stage==='wrap'?.5:2/3))<.003);
 }
 // Exercise both actions through the visible SVG coordinates, not a duplicate layout formula.
 for(const part of ['miso','dashi']){
  const plan=E.Cooking.plan('tonjiru',E.recipes.tonjiru);await seed(fixture('tonjiru',plan.findIndex(st=>st.part===part)));
  await p.waitForTimeout(1000);const heading=await p.locator('.process-heading').boundingBox(),clip={x:355,y:Math.ceil(heading.y+heading.height+12),width:20,height:12};
  const before=PNG.sync.read(await p.screenshot({clip})),box=await p.locator('#cook-object').boundingBox(),background=await p.locator('#kitchen-screen').evaluate(el=>getComputedStyle(el).backgroundImage);
  const points=await p.locator('.motion-guide').evaluate(svg=>{const path=svg.querySelector('.guide-line'),m=path.getScreenCTM();return[0,path.getTotalLength()].map(n=>{const v=path.getPointAtLength(n),p=new DOMPoint(v.x,v.y).matrixTransform(m);return{x:p.x,y:p.y}})});
  await p.mouse.move(points[0].x,points[0].y);await p.mouse.down();await p.mouse.move(points[1].x,points[1].y,{steps:10});if(part==='dashi')await p.evaluate(()=>MidnightKitchen.tick(1800));await p.mouse.up();
  await p.waitForTimeout(350);assert.ok(await p.locator('[data-work="next-step"]').isEnabled(),part+' action completes');
  const after=PNG.sync.read(await p.screenshot({clip}));let delta=0;for(let i=0;i<before.data.length;i++)delta=Math.max(delta,Math.abs(before.data[i]-after.data[i]));assert.ok(delta<=2,part+' fixed wood pixels: '+delta);
  assert.equal(await p.locator('#kitchen-screen').evaluate(el=>getComputedStyle(el).backgroundImage),background);assert.deepEqual(await p.locator('#cook-object').boundingBox(),box,part+' stable geometry across phases');
 }
 assert.deepEqual(errors,[]);console.log('PASS',scenes,'five-dish prep/transfer scenes,',sources.size,'decoded transparent sources, aligned headers, fixed food anchors, extended sleeves, and real miso/dashi actions with unchanged board pixels');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
