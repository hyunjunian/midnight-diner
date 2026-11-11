// The dawn bulletin and the shared clip, driven in a real browser with ?ads-test.
// Run by name: node tools/test-browser.cjs ad-events  (serves docs/ at DINER_URL)
const {chromium}=require('playwright'),assert=require('node:assert/strict'),E=require('../../docs/engine');
const base=process.env.DINER_URL||'http://127.0.0.1:8765/midnight-diner/';
function nights(count,keepFarewell){
  const s=E.fresh();s.introSeen=true;let kept=null;
  for(let n=1;n<=count;n++){
    E.open(s);
    for(let guard=0;guard<200&&(s.arrived<s.target||s.guests.some(g=>g.status!=='left'));guard++){
      const g=E.arrive(s)||s.guests.find(g=>g.status!=='left');if(!g)break;
      if(g.status==='seated'){E.acceptOrder(s,g.id);E.beginCooking(s,g.id);for(const id of E.recipes[g.recipe].ingredients){if(!s.inventory[id])s.inventory[id]=5;E.selectIngredient(s,id);}E.prepareIngredients(s);while(s.kitchen&&s.kitchen.stage==='process')E.completeCookingStep(s,1);E.deliver(s);}
      if(g.status==='eating')E.finishEating(s,g.id);
      if(g.status==='paying')E.collect(s,g.id);
      if(g.status==='farewell'){if(keepFarewell&&n===count&&!kept)kept=JSON.parse(JSON.stringify(s));E.depart(s,g.id);}
    }
    E.close(s);if(n<count)E.next(s);
  }
  return kept||s;
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const open=async(save,playMinutes,query='')=>{
    const page=await browser.newPage({viewport:{width:393,height:852},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({save,playMs})=>{localStorage.setItem('midnight-diner-save-v11',JSON.stringify(save));localStorage.setItem('midnight-diner-ad-events-v1',JSON.stringify({playMs,offerNight:0,offerGuest:'',doneNight:0}));},{save,playMs:playMinutes*60000});
    await page.goto(base+query);await page.locator('#skip-intro').click();await page.waitForTimeout(700);
    return{page,errors};
  };
  const leaveReport=async page=>{if(!await page.evaluate(()=>document.getElementById('report-dialog').open))await page.locator('#night-action').click();await page.locator('#report-next').scrollIntoViewIfNeeded();await page.locator('#report-next').click();await page.waitForTimeout(500);};
  const view=page=>page.evaluate(()=>({bulletin:document.getElementById('bulletin-dialog').open,note:document.getElementById('bulletin-note').hidden?'':document.getElementById('bulletin-note').textContent,button:document.getElementById('bulletin-next').textContent,phase:JSON.parse(localStorage.getItem('midnight-diner-save-v11')).phase,playMs:window.MidnightAdEvents.playMs()}));
  try{
    // Never after the first night, however long it took; never after too little play.
    for(const [count,minutes] of [[1,60],[2,3]]){
      const {page,errors}=await open(nights(count),minutes,'?ads-test');await leaveReport(page);
      const state=await view(page);assert.equal(state.bulletin,false);assert.equal(state.phase,'prep');assert.deepEqual(errors,[]);await page.close();
    }
    // Enough play: the bulletin arrives. Without ads it is content only; with ads the ad page is announced.
    for(const [query,ad] of [['',false],['?ads-test',true]]){
      const {page,errors}=await open(nights(2),13,query);await leaveReport(page);
      let state=await view(page);assert.equal(state.bulletin,true);assert.equal(state.phase,'end','the night waits behind the bulletin');
      assert.equal(state.button,ad?'다음 장 넘기기 · 광고':'소식지를 접고 다음 밤 준비하기');assert.equal(Boolean(state.note),ad);
      await page.keyboard.press('Escape');assert.equal((await view(page)).bulletin,true,'only its button closes it');
      await page.locator('#bulletin-next').click();await page.waitForTimeout(500);
      state=await view(page);assert.equal(state.bulletin,false);assert.equal(state.phase,'prep');assert.ok(state.playMs<5000,'play time starts over');
      assert.deepEqual(errors,[]);await page.close();
    }
    // A happy departing guest brings the clip up in conversation; the owner answers in words.
    const talk=page=>page.evaluate(()=>({line:document.getElementById('talk-line').textContent,choices:[...document.querySelectorAll('#talk-choices button')].map(b=>b.getAttribute('aria-label')),next:!document.getElementById('talk-next').hidden,status:document.getElementById('talk-share-status').hidden?'':document.getElementById('talk-share-status').textContent,affinity:Object.values(JSON.parse(localStorage.getItem('midnight-diner-save-v11')).customerBook).reduce((sum,c)=>sum+(c.affinity||0),0),left:JSON.parse(localStorage.getItem('midnight-diner-save-v11')).guests.filter(g=>g.status==='left').length}));
    const meet=async query=>{const opened=await open(nights(2,true),0,query);await opened.page.locator('#customers .customer').first().click({force:true});await opened.page.waitForTimeout(400);await opened.page.locator('#talk-next').click();await opened.page.waitForTimeout(1200);return opened;};
    {
      const {page,errors}=await meet('?ads-test');
      let now=await talk(page);
      assert.deepEqual(now.choices,['같이 봐요 · 광고 시청 (친밀도 ↑)','오늘은 마음만 받을게요']);assert.equal(now.next,false);assert.equal(now.affinity,0);
      await page.locator('#talk-choices button').first().click();await page.waitForTimeout(1500);
      now=await talk(page);assert.equal(now.choices.length,0);assert.equal(now.next,true);assert.match(now.status,/한층 가까워졌어요/);assert.equal(now.affinity,2);
      const before=now.left;await page.locator('#talk-next').click();await page.waitForTimeout(400);
      assert.equal((await talk(page)).left,before+1,'the goodbye still ends the visit');assert.deepEqual(errors,[]);await page.close();
    }
    {
      // First time: the guest explains the coming question before anything is asked.
      const {page,errors}=await meet('?ads-test=privacy');
      await page.locator('#talk-choices button').first().click();await page.waitForTimeout(2500);
      let now=await talk(page);
      assert.deepEqual(now.choices,['알겠어요, 틀어 주세요']);assert.equal(now.affinity,0);
      await page.locator('#talk-line').click();await page.waitForTimeout(200);
      assert.match((await talk(page)).line,/허용하지 않아도 영상은 똑같이 볼 수 있어요/);
      await page.locator('#talk-choices button').first().click();await page.waitForTimeout(1500);
      now=await talk(page);assert.equal(now.affinity,2);assert.deepEqual(errors,[]);await page.close();
    }
    {
      const {page,errors}=await meet('?ads-test');
      await page.locator('#talk-choices button').nth(1).click();await page.waitForTimeout(600);
      const now=await talk(page);assert.equal(now.choices.length,0);assert.equal(now.next,true);assert.equal(now.affinity,0);assert.equal(now.status,'');
      assert.deepEqual(errors,[]);await page.close();
    }
    console.log('PASS dawn bulletin gating, announced ad page, and the clip offered, explained and declined in conversation');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
