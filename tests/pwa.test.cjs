const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const CURRENT='20261108-v35-wood-ui',NEXT='20261109-v36-next';
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}}
function app(options={}){
  const elements=new Map(),timers=new Map(),document=new EventTarget(),window=new EventTarget(),sw=new EventTarget(),reg=new EventTarget();
  const classes=new Set(),navigations=[],requests=[],pauses=[];
  const intervals=[];
  let clock=100000,timerId=0,safe=true,cooking=!!options.cooking,modal=!!options.modal,latest=options.latest||CURRENT,activeRelease=options.active||CURRENT,saveFails=!!options.saveFails,saves=0,launches=0,resumes=0,registers=0,updates=0;
  const $=id=>{if(!elements.has(id)){const el=Object.assign(new EventTarget(),{hidden:false,textContent:'',open:false,showModal(){this.open=true},close(){this.open=false}});elements.set(id,el)}return elements.get(id)};
  $('app').hidden=!!options.appHidden;
  document.getElementById=$;document.hidden=!!options.hidden;
  document.documentElement={dataset:options.preview?{preview:'embedded'}:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};
  document.querySelector=selector=>selector.startsWith('meta')?{content:CURRENT}:selector==='dialog[open]'&&modal?{}:null;
  class Channel{constructor(){this.port1={onmessage:null,close(){}};this.port2={deliver:data=>this.port1.onmessage?.({data})}}}
  const worker=release=>({state:'activated',postMessage(message,ports){if(message.type==='GET_RELEASE')ports[0].deliver({release:typeof release==='function'?release():release})}});
  sw.controller=worker(()=>activeRelease);
  reg.active=sw.controller;reg.update=async()=>{updates++};
  sw.register=async url=>{registers++;reg.active=worker(new URL(url,'https://diner.test/midnight-diner/').searchParams.get('build'));return reg};
  sw.ready=Promise.resolve(reg);
  window.isSecureContext=true;
  window.MidnightApp={launch(){launches++},resumeAfterUpdate(){resumes++},setUpdatePaused:value=>pauses.push(value),isCooking:()=>cooking,canApplyUpdate:()=>safe,saveForUpdate(){saves++;return !saveFails}};
  const location={href:options.url||'https://diner.test/midnight-diner/',replace:url=>navigations.push(url)};
  class Clock extends Date{static now(){return clock}}
  const fetch=async(url,init)=>{requests.push({url:String(url),init});if(options.markerHold)await options.markerHold.promise;if(options.offline)throw new Error('offline');return{ok:true,json:async()=>({release:latest})}};
  vm.runInNewContext(fs.readFileSync('docs/pwa.js','utf8'),{window,document,navigator:{serviceWorker:sw,userAgent:'Chrome'},matchMedia:()=>({matches:false,addEventListener(){}}),location,history:{replaceState(){}},URL,AbortController,MessageChannel:Channel,fetch,setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>intervals.push({fn,ms}),Date:Clock,Math});
  async function settle(){await window.MidnightPWA.start();await Promise.resolve();await Promise.resolve()}
  function event(target,type,extra={}){const e=new Event(type);Object.assign(e,extra);target.dispatchEvent(e)}
  return{document,window,$,requests,navigations,pauses,classes,settle,start:()=>window.MidnightPWA.start(),setLatest:v=>latest=v,setActive:v=>activeRelease=v,setSaveFails:v=>saveFails=v,setCooking:v=>cooking=v,setModal:v=>modal=v,advance:ms=>clock+=ms,setSafe:v=>safe=v,tick:()=>intervals.filter(x=>x.ms===1000).forEach(x=>x.fn()),event:(type,extra)=>event(document,type,extra),
    hide(){document.hidden=true;event(document,'visibilitychange')},show(){document.hidden=false;event(document,'visibilitychange')},focus(){event(window,'focus')},pageshow(){event(window,'pageshow',{persisted:true})},online(){event(window,'online')},
    state:()=>({saves,launches,resumes,registers,updates}),covered:()=>classes.has('app-checking-update')&&$('app-update-gate').open};
}
test('cold launch starts immediately while a slow uncached marker stays in the background',async()=>{
  const markerHold=deferred(),a=app({markerHold});
  assert.equal(a.covered(),false);assert.equal(a.state().launches,1);assert.deepEqual(a.pauses,[]);
  assert.equal(a.requests.length,1);assert.equal(a.requests[0].init.cache,'no-store');assert.match(a.requests[0].url,/version\.json\?check=/);
  markerHold.resolve();await a.settle();assert.equal(a.navigations.length,0);assert.deepEqual(a.pauses,[]);
});
test('same-release returns preserve the running page without overlay, pause, navigation or intro replay',async()=>{
  const a=app();await a.settle();a.hide();a.show();await a.settle();
  assert.equal(a.requests.length,2);assert.equal(a.state().launches,1);assert.equal(a.state().saves,1);
  assert.deepEqual(a.navigations,[]);assert.equal(a.covered(),false);assert.deepEqual(a.pauses,[]);
});
test('new files prepare silently while cooking and dialogs stay open; apply at a safe idle moment',async()=>{
  const a=app({cooking:true,modal:true});await a.settle();a.setLatest(NEXT);a.hide();a.show();await a.settle();
  assert.equal(a.navigations.length,0);assert.equal(a.covered(),false);assert.deepEqual(a.pauses,[]);
  a.advance(2000);a.tick();assert.equal(a.navigations.length,0);
  a.setCooking(false);a.tick();assert.equal(a.navigations.length,0);
  a.setModal(false);a.setSafe(false);a.tick();assert.equal(a.navigations.length,0);
  a.setSafe(true);a.tick();assert.equal(a.navigations.length,1);
  const next=new URL(a.navigations[0]);assert.equal(next.searchParams.get('app-update'),NEXT);assert.equal(next.searchParams.get('resume-update'),'1');
});
test('prepared update can replace a background cooking page after saving without covering the screen',async()=>{
  const a=app({cooking:true});await a.settle();a.setLatest(NEXT);a.hide();a.show();await a.settle();
  assert.equal(a.navigations.length,0);a.hide();assert.equal(a.navigations.length,1);assert.ok(a.state().saves>=2);
  assert.equal(a.covered(),false);assert.deepEqual(a.pauses,[]);
});
test('held pointers/keys and recent input defer replacement until interaction has finished',async()=>{
  for(const [down,up] of [['pointerdown','pointerup'],['keydown','keyup']]){
    const a=app();await a.settle();a.setLatest(NEXT);a.event(down);a.advance(2000);a.focus();await a.settle();
    a.tick();assert.equal(a.navigations.length,0);a.event(up);a.tick();assert.equal(a.navigations.length,0);
    a.advance(1500);a.tick();assert.equal(a.navigations.length,1);
  }
});
test('failed save leaves the game running and retries silently later',async()=>{
  const a=app();await a.settle();a.setLatest(NEXT);a.setSaveFails(true);a.advance(2000);a.focus();await a.settle();
  assert.equal(a.navigations.length,0);assert.equal(a.covered(),false);assert.deepEqual(a.pauses,[]);
  a.setSaveFails(false);a.tick();assert.equal(a.navigations.length,1);
});
test('offline startup and returns never wait behind a checking interface',async()=>{
  const a=app({offline:true});assert.equal(a.state().launches,1);await a.settle();a.hide();a.show();await a.settle();
  assert.equal(a.state().launches,1);assert.equal(a.covered(),false);assert.equal(a.navigations.length,0);assert.deepEqual(a.pauses,[]);
});
test('rapid genuine returns check each time and coalesce duplicate pageshow/focus signals',async()=>{
  const a=app();await a.settle();
  for(let i=0;i<3;i++){a.advance(100);a.hide();a.show();a.pageshow();a.focus();await a.settle();assert.equal(a.requests.length,i+2)}
  assert.equal(a.state().launches,1);assert.equal(a.navigations.length,0);assert.deepEqual(a.pauses,[]);
});
test('already-prepared newer worker applies only after the current interaction is safe',async()=>{
  const a=app({modal:true});await a.settle();a.setActive(NEXT);a.hide();a.show();await a.settle();assert.equal(a.navigations.length,0);
  a.setModal(false);a.advance(2000);a.tick();assert.equal(new URL(a.navigations[0]).searchParams.get('app-update'),NEXT);
});
test('embedded preview launches immediately when its parent calls start, independent of marker',async()=>{
  const markerHold=deferred(),a=app({preview:true,markerHold});assert.equal(a.requests.length,0);assert.equal(a.state().launches,0);
  const flight=a.start();assert.equal(a.state().launches,1);assert.equal(a.covered(),false);markerHold.resolve();await flight;
});

test('multiple held pointers remain protected until the last one ends',async()=>{
  const a=app();await a.settle();a.event('pointerdown',{pointerId:1});a.event('pointerdown',{pointerId:2});
  a.setLatest(NEXT);a.advance(2000);a.focus();await a.settle();a.event('pointerup',{pointerId:1});a.advance(2000);a.tick();
  assert.equal(a.navigations.length,0);a.event('pointerup',{pointerId:2});a.advance(1500);a.tick();assert.equal(a.navigations.length,1);
});
test('leaving the page saves without hijacking browser navigation',async()=>{
  const a=app({modal:true});await a.settle();a.setLatest(NEXT);a.advance(2000);a.focus();await a.settle();
  a.window.dispatchEvent(new Event('pagehide'));a.setModal(false);a.tick();assert.equal(a.navigations.length,0);
  assert.ok(a.state().saves>0);a.pageshow();await a.settle();a.tick();assert.equal(a.navigations.length,1);
});
