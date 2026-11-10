const{chromium}=require('playwright'),assert=require('node:assert/strict'),E=require('../../docs/engine');
const base=process.env.DINER_URL||'http://127.0.0.1:8765/';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:393,height:852},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const state=E.fresh();state.night=30;state.calendarRecords=[{night:29,revenue:5000,tips:200,expenses:900,purchases:0,money:7300,net:4100,reputation:30,average:80,served:9,level:2}];
 await p.addInitScript(s=>localStorage.setItem('midnight-diner-save-v11',JSON.stringify(s)),state);await p.goto(base);await p.locator('#skip-intro').click();await p.locator('#calendar-open').click();await p.evaluate(()=>document.fonts.ready);
 await p.locator('[data-calendar-night="29"]').click();assert.match(await p.locator('.calendar-entry').textContent(),/2026년 9월 29일/);assert.match(await p.locator('.calendar-entry').textContent(),/¥5,000/);
 for(const[width,height]of[[320,568],[393,852],[700,900]]){
  await p.setViewportSize({width,height});let current=0,expectedHeight;
  await p.locator('[data-close="calendar-dialog"]').click();await p.locator('#calendar-open').click();
  for(const[target,weeks]of[[0,5],[4,6],[5,5],[125,4],[4,6],[0,5]]){
   await p.evaluate(delta=>{const direction=delta<0?'-1':'1';for(let i=0;i<Math.abs(delta);i++)document.querySelector(`[data-calendar-page="${direction}"]`).click();},target-current);current=target;
   const q=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height}};const sheet=document.querySelector('.paper-calendar'),grid=document.querySelector('.calendar-grid'),days=[...document.querySelectorAll('.calendar-day')];return{sheet:rect(sheet),grid:rect(grid),legend:rect(document.querySelector('.calendar-legend')),weeks:Number(grid.style.getPropertyValue('--calendar-weeks')),cells:days.map(rect),overflow:document.getElementById('calendar-content').scrollWidth>document.getElementById('calendar-content').clientWidth};});
   const info=JSON.stringify({width,target,q});assert.equal(q.weeks,weeks,info);expectedHeight??=q.sheet.height;assert.ok(Math.abs(q.sheet.height-expectedHeight)<.1,info);assert.equal(q.grid.height,287,info);assert.ok(q.cells.every(r=>r.height>=44&&r.top>=q.grid.top&&r.bottom<=q.grid.bottom+.1),info);assert.ok(q.legend.bottom<q.sheet.bottom,info);assert.equal(q.overflow,false,info);
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS constant physical calendar height across four/five/six-week months, 44px dates, report selection, year navigation and 320/393/700px widths');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
