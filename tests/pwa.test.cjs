const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const CURRENT='20261108-v35-wood-ui',NEXT='20261109-v36-next';
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}}
function app(options={}){
  const elements=new Map(),timers=new Map(),document=new EventTarget(),window=new EventTarget(),sw=new EventTarget(),reg=new EventTarget();
  const classes=new Set(),navigations=[],requests=[],pauses=[];
  let clock=100000,timerId=0,cooking=!!options.cooking,modal=!!options.modal,latest=options.latest||CURRENT,activeRelease=options.active||CURRENT,saveFails=!!options.saveFails,saves=0,launches=0,resumes=0,registers=0,updates=0;
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
  window.MidnightApp={launch(){launches++},resumeAfterUpdate(){resumes++},setUpdatePaused:value=>pauses.push(value),isCooking:()=>cooking,saveForUpdate(){saves++;return !saveFails}};
  const location={href:options.url||'https://diner.test/midnight-diner/',replace:url=>navigations.push(url)};
  class Clock extends Date{static now(){return clock}}
  const fetch=async(url,init)=>{requests.push({url:String(url),init});if(options.markerHold)await options.markerHold.promise;if(options.offline)throw new Error('offline');return{ok:true,json:async()=>({release:latest})}};
  vm.runInNewContext(fs.readFileSync('docs/pwa.js','utf8'),{window,document,navigator:{serviceWorker:sw,userAgent:'Chrome'},matchMedia:()=>({matches:false,addEventListener(){}}),location,history:{replaceState(){}},URL,AbortController,MessageChannel:Channel,fetch,setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),setInterval(){},Date:Clock,Math});
  async function settle(){await window.MidnightPWA.start();await Promise.resolve();await Promise.resolve()}
  function event(target,type,extra={}){const e=new Event(type);Object.assign(e,extra);target.dispatchEvent(e)}
  return{document,window,$,requests,navigations,pauses,classes,settle,start:()=>window.MidnightPWA.start(),setLatest:v=>latest=v,setActive:v=>activeRelease=v,setSaveFails:v=>saveFails=v,setCooking:v=>cooking=v,setModal:v=>modal=v,advance:ms=>clock+=ms,
    hide(){document.hidden=true;event(document,'visibilitychange')},show(){document.hidden=false;event(document,'visibilitychange')},focus(){event(window,'focus')},pageshow(){event(window,'pageshow',{persisted:true})},online(){event(window,'online')},
    state:()=>({saves,launches,resumes,registers,updates}),covered:()=>classes.has('app-checking-update')&&$('app-update-gate').open};
}
test('cold launch covers the game and waits for the uncached marker before launching',async()=>{
  const markerHold=deferred(),a=app({markerHold});
  assert.equal(a.covered(),true);assert.equal(a.state().launches,0);assert.equal(a.pauses.at(-1),true);
  assert.equal(a.requests.length,1);assert.equal(a.requests[0].init.cache,'no-store');assert.match(a.requests[0].url,/version\.json\?check=/);
  markerHold.resolve();await a.settle();assert.equal(a.covered(),false);assert.equal(a.state().launches,1);assert.equal(a.navigations.length,0);assert.equal(a.pauses.at(-1),false);
});
test('same-release checks preserve the running page without saving, navigating or replaying intro',async()=>{
  const a=app();await a.settle();a.advance(600);a.focus();await a.settle();
  assert.equal(a.requests.length,2);assert.equal(a.state().launches,1);assert.equal(a.state().saves,0);assert.deepEqual(a.navigations,[]);assert.equal(a.covered(),false);
});
test('foreground upgrade saves and navigates during cooking and an already-open modal',async()=>{
  const a=app({cooking:true,modal:true});await a.settle();a.setLatest(NEXT);a.hide();a.show();
  assert.equal(a.covered(),true);await a.settle();assert.equal(a.navigations.length,1);assert.equal(a.state().saves,2);
  const next=new URL(a.navigations[0]);assert.equal(next.searchParams.get('app-update'),NEXT);assert.equal(next.searchParams.get('resume-update'),'1');assert.equal(a.covered(),true);
});
test('failed save keeps the page covered with retry/offline controls, then retry can finish',async()=>{
  const a=app({cooking:true,modal:true});await a.settle();a.setLatest(NEXT);a.setSaveFails(true);a.hide();a.show();await a.settle();
  assert.equal(a.navigations.length,0);assert.equal(a.covered(),true);assert.equal(a.$('app-update-retry').hidden,false);assert.equal(a.$('app-update-offline').hidden,false);assert.match(a.$('app-update-message').textContent,/저장하지 못했어요/);
  a.setSaveFails(false);a.$('app-update-retry').dispatchEvent(new Event('click'));await a.settle();assert.equal(a.navigations.length,1);assert.equal(a.$('app-update-retry').hidden,true);
});
test('offline launch still opens the installed game without navigation',async()=>{
  const a=app({offline:true});await a.settle();assert.equal(a.state().launches,1);assert.equal(a.covered(),false);assert.equal(a.navigations.length,0);assert.equal(a.$('app-update-retry').hidden,true);
});
test('rapid genuine returns check each time and coalesce duplicate pageshow/focus signals',async()=>{
  const a=app();await a.settle();
  for(let i=0;i<3;i++){a.advance(100);a.hide();a.show();a.pageshow();a.focus();await a.settle();assert.equal(a.requests.length,i+2)}
  assert.equal(a.state().launches,1);assert.equal(a.navigations.length,0);
});
test('a worker already newer than the marker is applied on foreground',async()=>{
  const a=app();await a.settle();a.setActive(NEXT);a.hide();a.show();await a.settle();assert.equal(new URL(a.navigations[0]).searchParams.get('app-update'),NEXT);
});
test('embedded preview waits for its parent to call start',async()=>{
  const a=app({preview:true});await Promise.resolve();assert.equal(a.requests.length,0);assert.equal(a.state().launches,0);
  await a.start();await a.settle();assert.equal(a.requests.length,1);assert.equal(a.state().launches,1);assert.equal(a.covered(),false);
});
