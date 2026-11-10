const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function load(native){
  const window={},document={querySelector:()=>({content:'20261110-v81-capacitor-shell'})};
  if(native!==undefined)window.Capacitor={isNativePlatform:()=>native};
  for(const name of ['config','ads','store','updater'])vm.runInNewContext(fs.readFileSync(`docs/src/platform/${name}.js`,'utf8'),{window,document});
  return window.MidnightPlatform;
}
test('browser fallback: ads count as watched, purchases succeed, updates are skipped',async()=>{
  for(const native of [undefined,false]){
    const p=load(native);
    assert.equal(p.ads.isNative(),false);
    assert.equal((await p.ads.showInterstitial('night-end')).shown,true);
    assert.equal((await p.ads.showRewarded('bonus')).rewarded,true);
    assert.equal((await p.store.purchase('coins_small')).ok,true);
    assert.equal(p.store.hasNoAds(),false);
    assert.equal((await p.store.purchase('remove_ads')).ok,true);
    assert.equal(p.store.hasNoAds(),true);
    assert.deepEqual([...(await p.store.restore()).restored],['remove_ads']);
    assert.equal((await p.store.purchase('nope')).ok,false);
    assert.equal((await p.updater.check()).status,'skipped');
    assert.equal((await p.updater.apply()).applied,false);
  }
});
test('ad-free players never get an interstitial but may still choose a rewarded ad',async()=>{
  const p=load(false);p.ads.setAdFree(true);
  assert.equal((await p.ads.showInterstitial()).shown,false);
  assert.equal((await p.ads.showRewarded()).rewarded,true);
});
test('native build without SDKs grants nothing and skips updates',async()=>{
  const p=load(true);
  assert.equal(p.ads.isNative(),true);
  assert.equal((await p.ads.showInterstitial()).shown,false);
  assert.equal((await p.ads.showRewarded()).rewarded,false);
  assert.equal((await p.store.purchase('remove_ads')).ok,false);
  assert.equal(p.store.hasNoAds(),false);
  assert.equal((await p.updater.check()).status,'skipped');
});
test('native app launches without registering a service worker or checking the web version',()=>{
  const elements=new Map(),$=id=>{if(!elements.has(id))elements.set(id,Object.assign(new EventTarget(),{hidden:false}));return elements.get(id)};
  let launches=0,registers=0,fetches=0;
  const window=Object.assign(new EventTarget(),{Capacitor:{isNativePlatform:()=>true},MidnightApp:{launch(){launches++},saveForUpdate(){return true}}});
  const document=Object.assign(new EventTarget(),{getElementById:$,documentElement:{dataset:{}},querySelector:()=>null});
  vm.runInNewContext(fs.readFileSync('docs/pwa.js','utf8'),{window,document,navigator:{serviceWorker:{register(){registers++}}},fetch(){fetches++},setInterval(){throw new Error('no polling')},location:{href:'capacitor://localhost/'},URL,Date});
  assert.equal(launches,1);assert.equal(registers,0);assert.equal(fetches,0);
  window.MidnightPWA.start();assert.equal(launches,1);
  for(const id of ['install-app','offline-status','update-app'])assert.equal($(id).hidden,true);
});
test('native web bundle omits the worker and review-only pages',()=>{
  const script=fs.readFileSync('tools/build-native.cjs','utf8');
  for(const name of ['sw','preview','approved','mockups'])assert.match(script,new RegExp(name));
  const index=fs.readFileSync('docs/index.html','utf8'),sw=fs.readFileSync('docs/sw.js','utf8');
  for(const name of ['config','ads','store','updater']){assert.match(index,new RegExp(`\\./src/platform/${name}\\.js\\?release=`));assert.ok(sw.includes(`'src/platform/${name}.js'`));}
});

// ---- Live updates (manual mode, self-hosted latest.json) ----
const CURRENT='20261110-v81-capacitor-shell',NEXT='20261111-v82-next',H=c=>c.repeat(64);
function native(options={}){
  const calls=[],store=new Map(options.resume?[['midnight-diner-native-update',options.resume]]:[]);
  const latest=options.latest||{version:NEXT,minNative:'1.0',files:{'index.html':H('a'),'assets/x y.webp':H('b')}};
  const window={Capacitor:{isNativePlatform:()=>true,nativePromise:async(plugin,method,data)=>{
    calls.push({plugin,method,data});
    if(plugin==='CapacitorHttp'){if(options.offline)throw new Error('offline');return{status:200,data:options.text?JSON.stringify(latest):latest};}
    if(method==='current')return{bundle:{id:'builtin'},native:options.native||'1.0'};
    if(method==='list')return{bundles:options.bundles||[]};
    if(method==='download'){if(options.downloadFails)throw new Error('download');return{id:'new1',version:data.version,status:'success'};}
    if(method==='set'&&options.setFails)throw new Error('set');
    return{};
  }}};
  const document={querySelector:()=>({content:CURRENT})};
  const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
  const fetch=async()=>{throw new Error('offline')};
  for(const name of ['config','updater'])vm.runInNewContext(fs.readFileSync(`docs/src/platform/${name}.js`,'utf8'),{window,document,localStorage,fetch,Date,JSON,Object,Promise,String,Boolean,Error});
  window.MidnightPlatform.config.updateBaseUrl='base' in options?options.base:'https://updates.example.com/';
  const of=method=>calls.filter(c=>c.plugin==='CapacitorUpdater'&&c.method===method);
  return{u:window.MidnightPlatform.updater,calls,of,store};
}
test('native updater stays off until the bucket address is configured',async()=>{
  const {u,calls}=native({base:''});
  assert.equal((await u.check()).status,'skipped');assert.equal(calls.length,0);
  assert.match(fs.readFileSync('docs/src/platform/config.js','utf8'),/updateBaseUrl:\s*'(https:\/\/[^']+)?'/);
});
test('newer release downloads only by per-file hashes and waits for apply()',async()=>{
  const {u,of,store}=native();
  await u.init();assert.equal(of('notifyAppReady').length,1);
  const both=await Promise.all([u.check(),u.check()]);
  assert.equal(both[0].status,'ready');assert.equal(both[0].release,NEXT);
  assert.equal(of('download').length,1,'concurrent checks share one download');
  const sent=of('download')[0].data;
  assert.equal(sent.version,NEXT);
  assert.deepEqual(JSON.parse(JSON.stringify(sent.manifest)),[
    {file_name:'index.html',file_hash:H('a'),download_url:'https://updates.example.com/index.html'},
    {file_name:'assets/x y.webp',file_hash:H('b'),download_url:'https://updates.example.com/assets/x%20y.webp'}]);
  assert.equal(of('set').length,0);assert.equal(u.hasReady(),true);
  assert.equal((await u.check()).status,'ready');assert.equal(of('download').length,1);
  assert.equal((await u.apply()).applied,true);
  assert.equal(of('set')[0].data.id,'new1');assert.equal(store.get('midnight-diner-native-update'),CURRENT);
});
test('same or older release, offline, bad data and failed downloads never apply anything',async()=>{
  for(const options of [{latest:{version:CURRENT,files:{'index.html':H('a')}}},{latest:{version:'20261101-v70-old',files:{'index.html':H('a')}}}]){
    const {u,of}=native(options);assert.equal((await u.check()).status,'none');assert.equal(of('download').length,0);assert.equal((await u.apply()).applied,false);
  }
  for(const options of [{offline:true},{latest:{version:'not-a-release'}},{latest:{version:NEXT,files:{'index.html':H('a'),'../evil':H('b')}}},{latest:{version:NEXT,files:{'app.js':H('a')}}},{downloadFails:true}]){
    const {u,of}=native(options);assert.equal((await u.check()).status,'failed');assert.equal(u.hasReady(),false);assert.equal(of('set').length,0);
  }
});
test('bundle that needs a newer store build is not downloaded',async()=>{
  const {u,of}=native({latest:{version:NEXT,minNative:'1.2',files:{'index.html':H('a')}},native:'1.1'});
  assert.equal((await u.check()).status,'needs-store-update');assert.equal(of('download').length,0);
  const ok=native({latest:{version:NEXT,minNative:'1.2',files:{'index.html':H('a')}},native:'1.10'});
  assert.equal((await ok.u.check()).status,'ready');
});
test('zip fallback needs a checksum; an already downloaded bundle is reused; string JSON is accepted',async()=>{
  const zip=native({latest:{version:NEXT,zip:{url:'https://updates.example.com/bundles/x.zip',checksum:H('c')}},text:true});
  assert.equal((await zip.u.check()).status,'ready');
  assert.equal(zip.of('download')[0].data.checksum,H('c'));assert.equal(zip.of('download')[0].data.manifest,undefined);
  const bare=native({latest:{version:NEXT,zip:{url:'https://updates.example.com/bundles/x.zip'}}});
  assert.equal((await bare.u.check()).status,'failed');
  const kept=native({bundles:[{id:'old9',version:NEXT,status:'success'}]});
  assert.equal((await kept.u.check()).status,'ready');assert.equal(kept.of('download').length,0);
  await kept.u.apply();assert.equal(kept.of('set')[0].data.id,'old9');
});
test('resume marker is used once and only when the bundle really changed; failed switch clears it',async()=>{
  assert.equal(native({resume:'20261101-v70-old'}).u.consumeResume(),true);
  const same=native({resume:CURRENT});assert.equal(same.u.consumeResume(),false);assert.equal(same.u.consumeResume(),false);assert.equal(same.store.size,0);
  assert.equal(native().u.consumeResume(),false);
  const failing=native({setFails:true});await failing.u.check();
  assert.equal((await failing.u.apply()).applied,false);assert.equal(failing.store.size,0);assert.equal(failing.u.hasReady(),false);
});
test('native shell saves, then applies a ready update only in the background and resumes without the intro',async()=>{
  const run=({resumed=false,ready=true,saveOk=true,appHidden=false}={})=>{
    const elements=new Map(),$=id=>{if(!elements.has(id))elements.set(id,Object.assign(new EventTarget(),{hidden:false}));return elements.get(id)};
    $('app').hidden=appHidden;
    const log=[],window=Object.assign(new EventTarget(),{Capacitor:{isNativePlatform:()=>true},
      MidnightApp:{launch(){log.push('launch')},resumeAfterUpdate(){log.push('resume')},saveForUpdate(){log.push('save');return saveOk}},
      MidnightPlatform:{updater:{consumeResume:()=>resumed,init:async()=>{log.push('init')},check:async()=>{log.push('check')},hasReady:()=>ready,apply(){log.push('apply')}}}});
    const document=Object.assign(new EventTarget(),{getElementById:$,documentElement:{dataset:{}},hidden:false});
    vm.runInNewContext(fs.readFileSync('docs/pwa.js','utf8'),{window,document,Promise});
    return{log,document};
  };
  const first=run();assert.deepEqual(first.log,['launch','init']);
  await new Promise(r=>setImmediate(r));assert.deepEqual(first.log,['launch','init','check']);
  first.document.hidden=true;first.document.dispatchEvent(new Event('visibilitychange'));
  assert.deepEqual(first.log.slice(3),['save','apply']);
  first.document.hidden=false;first.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(first.log.at(-1),'check');
  assert.equal(run({resumed:true}).log[0],'resume');
  for(const options of [{ready:false},{saveOk:false},{appHidden:true}]){
    const r=run(options);r.document.hidden=true;r.document.dispatchEvent(new Event('visibilitychange'));assert.ok(!r.log.includes('apply'));
  }
});
test('update site route matches the address the app reads, and serves files at exact paths',()=>{
  const base=fs.readFileSync('docs/src/platform/config.js','utf8').match(/updateBaseUrl:\s*'https:\/\/([^'/]+)'/)[1];
  const config=fs.readFileSync('wrangler.updates.jsonc','utf8');
  assert.ok(config.includes(`"pattern": "${base}"`));assert.match(config,/"html_handling": "none"/);
  assert.doesNotMatch(fs.readFileSync('wrangler.jsonc','utf8'),/live-update/);
});
