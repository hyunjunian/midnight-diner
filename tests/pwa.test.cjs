const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function app(options={}){
  const timers=[],elements=new Map(),document=new EventTarget(),window=new EventTarget(),sw=new EventTarget(),reg=new EventTarget();
  let cooking=!!options.cooking,modal=!!options.modal,reloads=0,saves=0,checks=0;
  const $=id=>{if(!elements.has(id))elements.set(id,Object.assign(new EventTarget(),{hidden:false,textContent:''}));return elements.get(id)};
  document.getElementById=$;document.documentElement={dataset:{}};document.hidden=!!options.hidden;
  document.querySelector=selector=>selector.startsWith('meta')?{content:'20261108-v32-auto-update'}:modal?{}:null;
  reg.update=async()=>{checks++};reg.waiting=options.waiting;
  sw.register=async()=>reg;sw.ready=Promise.resolve(reg);
  window.isSecureContext=true;window.MidnightApp={launch(){},isCooking:()=>cooking,save(){saves++;return options.saveFails?false:true}};
  vm.runInNewContext(fs.readFileSync('docs/pwa.js','utf8'),{window,document,navigator:{serviceWorker:sw,userAgent:'Chrome'},matchMedia:()=>({matches:false,addEventListener(){}}),location:{reload(){reloads++}},setTimeout:fn=>timers.push(fn),setInterval(){},Date});
  function flush(){while(timers.length)timers.shift()()}
  function message(release='20261108-v33-next'){const event=new Event('message');event.data={type:'APP_UPDATED',release};sw.dispatchEvent(event);flush()}
  return{document,window,$,flush,message,setCooking:v=>cooking=v,setModal:v=>modal=v,state:()=>({reloads,saves,checks})};
}
test('a new prepared release saves and automatically reloads once without an update button',()=>{
  const a=app();a.message();a.message();assert.deepEqual(a.state(),{reloads:1,saves:1,checks:0});
});
test('automatic updates wait for cooking, dialogs and foreground visibility',()=>{
  for(const reason of ['cooking','modal','hidden']){
    const a=app({[reason]:true});a.message();assert.equal(a.state().reloads,0);
    a.setCooking(false);a.setModal(false);a.document.hidden=false;
    a.document.dispatchEvent(new Event(reason==='cooking'?'midnight:kitchen':reason==='modal'?'close':'visibilitychange'));a.flush();
    assert.equal(a.state().reloads,1);assert.equal(a.state().saves,1);
  }
});
test('save failure keeps progress in memory instead of refreshing it away',()=>{
  const a=app({saveFails:true});a.message();assert.equal(a.state().reloads,0);assert.match(a.$('offline-status').textContent,/저장하지 못해/);
});
test('initial installation, same release and an older worker never cause a reload loop',()=>{
  const a=app();a.message('20261108-v32-auto-update');a.message('20261108-v31-clean-start');assert.equal(a.state().reloads,0);assert.equal(a.state().saves,0);
});
test('a prepared update does not refresh a hidden stage before its intro starts',()=>{
  const a=app();a.$('app').hidden=true;a.message();assert.equal(a.state().reloads,0);a.$('app').hidden=false;a.document.dispatchEvent(new Event('close'));a.flush();assert.equal(a.state().reloads,1);
});
test('returning online checks for an update without interrupting the running game',async()=>{
  const a=app();await Promise.resolve();a.window.dispatchEvent(new Event('online'));await Promise.resolve();assert.equal(a.state().checks,1);assert.equal(a.state().reloads,0);
});
