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
    assert.equal(p.store.hasNoAds(),false);
    assert.equal((await p.store.purchase('midnight_remove_ads')).ok,true);
    assert.equal(p.store.hasNoAds(),true);
    assert.deepEqual([...(await p.store.restore()).restored],['midnight_remove_ads']);
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
test('native build whose plugins do not answer grants nothing and skips updates',async()=>{
  const p=load(true);
  assert.equal(p.ads.isNative(),true);
  assert.equal((await p.ads.showInterstitial()).shown,false);
  assert.equal((await p.ads.showRewarded()).rewarded,false);
  assert.equal((await p.store.purchase('midnight_remove_ads')).ok,false);
  assert.equal(p.store.isOwned('midnight_remove_ads'),false);
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
  const config=fs.readFileSync('workers/update/wrangler.jsonc','utf8');
  assert.match(config,/"name": "midnight-update"/);assert.match(fs.readFileSync('wrangler.jsonc','utf8'),/"name": "midnight",/);
  assert.match(config,/"command": "node \.\.\/\.\.\/tools\/publish-update\.cjs"/);
  assert.ok(config.includes(`"pattern": "${base}"`));assert.match(config,/"html_handling": "none"/);
  assert.doesNotMatch(fs.readFileSync('wrangler.jsonc','utf8'),/live-update\/site/);
});

// ---- Automatic release tags ----
test('builds tag their own output from the commit, leaving docs/ untouched',()=>{
  const os=require('node:os'),path=require('node:path'),{autoTag,stamp,FORMAT}=require('../tools/set-release.cjs');
  const tag=autoTag();
  assert.match(tag,FORMAT);assert.match(tag,/^\d{8}-v\d{6}-[0-9a-f]{7,}$/);assert.equal(autoTag(),tag,'one tag per commit');
  const newer=(a,b)=>a.localeCompare(b,'en',{numeric:true})>0;
  assert.ok(newer('20261110-v142355-a1b2c3d','20261110-v85-capacitor-merge'));
  assert.ok(newer('20261111-v000005-a1b2c3d','20261110-v235959-ffffffe'));
  assert.ok(newer('20261111-v000100-a1b2c3d','20261111-v000059-ffffffe'));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stamp-'));
  try{
    for(const name of ['index.html','approved.html','preview.html','version.json'])fs.copyFileSync('docs/'+name,path.join(dir,name));
    const before=fs.readFileSync('docs/index.html','utf8'),result=stamp(dir,'20991231-v235959-abcdef0');
    const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
    assert.ok(html.includes('name="app-release" content="20991231-v235959-abcdef0"'));assert.ok(!html.includes(result.previous));
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'version.json'),'utf8')).release,'20991231-v235959-abcdef0');
    assert.match(fs.readFileSync(path.join(dir,'preview.html'),'utf8'),/const release = '20991231-v235959-abcdef0'/);
    assert.equal(fs.readFileSync('docs/index.html','utf8'),before);
    assert.throws(()=>stamp(dir,'v1'));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
  assert.match(fs.readFileSync('wrangler.jsonc','utf8'),/"directory": "\.\/dist\/web"/);
  assert.match(fs.readFileSync('wrangler.jsonc','utf8'),/"command": "node tools\/build-web\.cjs"/,'plain wrangler deploy must build the site first');
});

// ---- In-app purchases (StoreKit 2 / Play Billing through the platform layer) ----
const ADS='midnight_remove_ads';
function shop(options={}){
  const calls=[],saved=new Map(options.cache?[['midnight-diner-store-v1',JSON.stringify(options.cache)]]:[]);
  let purchases=options.purchases||[];
  const window={Capacitor:{isNativePlatform:()=>true,getPlatform:()=>options.platform||'android',nativePromise:async(plugin,method,data)=>{
    calls.push({plugin,method,data});
    if(plugin!=='NativePurchases')throw new Error('other plugin');
    if(method==='isBillingSupported')return{isBillingSupported:options.billing!==false};
    if(method==='getPurchases'){if(options.queryFails)throw new Error('offline');return{purchases};}
    if(method==='getProducts')return{products:options.products||[{identifier:ADS,title:'광고 제거',priceString:'₩3,300'}]};
    if(method==='getAppTransaction'){if(options.appFails)throw new Error('App Transaction requires iOS 16.0 or later');return{appTransaction:options.app};}
    if(method==='purchaseProduct'){if(options.buy instanceof Error)throw options.buy;const bought={productIdentifier:data.productIdentifier,transactionId:'t1',purchaseState:'1',...options.buy};if(options.afterBuy)purchases=options.afterBuy;return bought;}
    if(method==='restorePurchases'){if(options.restoreFails)throw new Error('restore');if(options.afterRestore)purchases=options.afterRestore;return{};}
    return{};
  }}};
  const localStorage={getItem:k=>saved.has(k)?saved.get(k):null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)};
  for(const name of ['config','ads','store'])vm.runInNewContext(fs.readFileSync(`docs/src/platform/${name}.js`,'utf8'),{window,localStorage,JSON,Date,Promise,Number,String,Boolean,Array,Set,Error});
  const p=window.MidnightPlatform;if('since' in options)p.config.store.iosFreeSince=options.since;
  if(options.extra)p.config.store.products.push(...options.extra);
  const cache=()=>JSON.parse(saved.get('midnight-diner-store-v1')||'{}');
  return{store:p.store,ads:p.ads,calls,cache,of:m=>calls.filter(c=>c.method===m)};
}
const own=(more={})=>({productIdentifier:ADS,transactionId:'t0',purchaseState:'1',...more});
test('shipped settings: one remove-ads product on sale in the apps, iOS still in its paid period, test ads only',()=>{
  const {store}=shop(),text=fs.readFileSync('docs/src/platform/config.js','utf8');
  assert.match(text,/removeAdsOnSale: true/);assert.match(text,/iosFreeSince: ''/);assert.match(text,/testMode: true/);
  assert.match(text,/\{ id: 'midnight_remove_ads', type: 'non-consumable' \}/);
  assert.equal(store.hasNoAds(),false);
});
test('android: a completed purchase removes ads, is cached for offline starts and reaches the ad layer',async()=>{
  const s=shop();
  assert.equal((await s.store.init()).noAds,false);assert.equal(s.ads.isAdFree(),false);
  assert.deepEqual([...(await s.store.getProducts())].map(x=>[x.id,x.type,x.price]),[[ADS,'non-consumable','₩3,300']]);
  const seen=[];s.store.onChange(state=>seen.push(state.noAds));
  const result=await s.store.purchase(ADS);
  assert.equal(result.ok,true);assert.equal(s.of('purchaseProduct')[0].data.isConsumable,false);
  assert.equal(s.store.hasNoAds(),true);assert.equal(s.ads.isAdFree(),true);assert.deepEqual(seen,[true]);
  assert.deepEqual(s.cache().owned,[ADS]);
  const offline=shop({cache:{owned:[ADS]},queryFails:true});
  assert.equal((await offline.store.init()).noAds,true,'a failed store query keeps cached ownership');
  const refunded=shop({cache:{owned:[ADS]},purchases:[]});
  assert.equal((await refunded.store.init()).noAds,false,'the store answering without the purchase removes it');
});
test('nothing is granted from cancelled, pending, unverified, revoked, mismatched or unknown purchases',async()=>{
  const cancel=shop({buy:new Error('User cancelled the purchase')});await cancel.store.init();
  assert.equal((await cancel.store.purchase(ADS)).reason,'cancelled');
  const failed=shop({buy:new Error('network')});await failed.store.init();
  assert.equal((await failed.store.purchase(ADS)).reason,'failed');
  const pending=shop({buy:{purchaseState:'0'}});await pending.store.init();
  assert.equal((await pending.store.purchase(ADS)).reason,'pending');
  const other=shop({buy:{productIdentifier:'something_else'}});await other.store.init();
  assert.equal((await other.store.purchase(ADS)).ok,false);
  const unverified=shop({platform:'ios',since:'2027-01-01T00:00:00Z',app:{environment:'Production',originalPurchaseDate:'2027-06-01T00:00:00Z'},buy:{verificationError:'bad signature'}});await unverified.store.init();
  assert.equal((await unverified.store.purchase(ADS)).ok,false);
  for(const s of [cancel,failed,pending,other,unverified]){assert.equal(s.store.hasNoAds(),false);assert.equal(s.store.isOwned(ADS),false);}
  assert.equal((await cancel.store.purchase('nope')).reason,'unknown-product');
  const closed=shop({billing:false});await closed.store.init();
  assert.equal((await closed.store.purchase(ADS)).reason,'unavailable');assert.equal(closed.of('purchaseProduct').length,0);
  const listed=shop({platform:'ios',since:'2027-01-01T00:00:00Z',app:{environment:'Production',originalPurchaseDate:'2027-06-01T00:00:00Z'},purchases:[own({revocationDate:'2027-07-01'}),own({verificationError:'x'})]});
  assert.equal((await listed.store.init()).noAds,false);
  const waiting=shop({purchases:[own({purchaseState:'0'})]});assert.equal((await waiting.store.init()).noAds,false);
});
test('restore brings back an earlier purchase and reports failures',async()=>{
  const s=shop({afterRestore:[own()]});await s.store.init();assert.equal(s.store.hasNoAds(),false);
  const result=await s.store.restore();
  assert.equal(result.ok,true);assert.deepEqual([...result.restored],[ADS]);assert.equal(s.store.hasNoAds(),true);
  const broken=shop({restoreFails:true});await broken.store.init();
  assert.equal((await broken.store.restore()).ok,false);assert.equal(broken.store.hasNoAds(),false);
});
test('consumables are bought as consumable and never stored as owned',async()=>{
  const s=shop({extra:[{id:'coins_small',type:'consumable'}],purchases:[{productIdentifier:'coins_small',purchaseState:'1'}]});await s.store.init();
  const result=await s.store.purchase('coins_small');
  assert.equal(result.ok,true);assert.equal(result.transactionId,'t1');assert.equal(s.of('purchaseProduct')[0].data.isConsumable,true);
  assert.equal(s.store.isOwned('coins_small'),false);assert.deepEqual(s.cache().owned,[]);
});
test('iOS paid-to-free: earlier buyers stay ad-free, later installs do not, unknown never shows ads',async()=>{
  const SINCE='2027-03-01T00:00:00Z',app=(date,environment='Production')=>({environment,originalPurchaseDate:date});
  const paidEra=shop({platform:'ios'});
  assert.equal((await paidEra.store.init()).noAds,true,'no conversion date yet: the app is still paid');
  assert.equal(paidEra.of('getAppTransaction').length,0);assert.equal(paidEra.ads.isAdFree(),true);
  const early=shop({platform:'ios',since:SINCE,app:app('2027-02-28T23:59:59Z')});
  assert.equal((await early.store.init()).noAds,true);assert.equal(early.cache().legacy,true);
  assert.equal(early.of('getPurchases')[0].data.onlyCurrentEntitlements,true);
  const late=shop({platform:'ios',since:SINCE,app:app('2027-03-01T00:00:00Z')});
  assert.equal((await late.store.init()).noAds,false);assert.notEqual(late.cache().legacy,true);
  assert.equal((await late.store.purchase(ADS)).ok,true);assert.equal(late.store.hasNoAds(),true);
  const tester=shop({platform:'ios',since:SINCE,app:app('2013-08-01T07:00:00Z','Sandbox')});
  assert.equal((await tester.store.init()).noAds,false,'sandbox and TestFlight dates do not count');
  const remembered=shop({platform:'ios',since:SINCE,cache:{legacy:true},appFails:true});
  assert.equal((await remembered.store.init()).noAds,true);assert.equal(remembered.of('getAppTransaction').length,0);
  const unknown=shop({platform:'ios',since:SINCE,appFails:true});
  assert.equal((await unknown.store.init()).noAds,true,'cannot tell (offline or iOS 15): no ads this session');
  assert.notEqual(unknown.cache().legacy,true,'an unknown answer is never stored');
  const android=shop({platform:'android',since:SINCE,app:app('2020-01-01T00:00:00Z')});
  assert.equal((await android.store.init()).noAds,false);assert.equal(android.of('getAppTransaction').length,0);
});
test('settings purchase rows exist in both entry pages and stay out of the native plugin',()=>{
  for(const page of ['docs/index.html','docs/approved.html']){const html=fs.readFileSync(page,'utf8');for(const id of ['store-section','store-remove-ads','store-restore','store-status'])assert.ok(html.includes(`id="${id}"`),page+' '+id);assert.match(html,/id="store-section"[^>]* hidden>/);assert.match(html,/\.\/store-settings\.js\?release=/);}
  const ui=fs.readFileSync('docs/store-settings.js','utf8');
  assert.doesNotMatch(ui,/nativePromise|NativePurchases/);assert.match(ui,/store\.isNative\(\)\?settings\.removeAdsOnSale===true:testing/);
  assert.ok(fs.readFileSync('docs/sw.js','utf8').includes("'store-settings.js'"));
  for(const file of fs.readdirSync('docs').filter(f=>f.endsWith('.js')&&f!=='sw.js'))assert.doesNotMatch(fs.readFileSync('docs/'+file,'utf8'),/nativePromise|NativePurchases|CapacitorUpdater|'AdMob'/,file);
});

// ---- Ads (AdMob through the platform layer) ----
function adNet(options={}){
  const calls=[],listeners=new Map(),attrs=new Set(),events=[];
  let tracking=options.tracking||'authorized';
  const fire=name=>(listeners.get(name)||[]).forEach(fn=>fn({}));
  const window={Capacitor:{isNativePlatform:()=>true,getPlatform:()=>options.platform||'android',
    addListener:(plugin,name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);return{remove(){}};},
    nativePromise:async(plugin,method,data)=>{
      calls.push({plugin,method,data});
      if(plugin!=='AdMob')throw new Error('other plugin');
      if(method==='initialize'&&options.initFails)throw new Error('init');
      if(method==='requestConsentInfo')return options.consent||{status:'NOT_REQUIRED',canRequestAds:true};
      if(method==='showConsentForm')return{status:'OBTAINED',canRequestAds:true};
      if(method==='trackingAuthorizationStatus')return{status:tracking};
      if(method==='requestTrackingAuthorization'){tracking='denied';return{};}
      if(method.startsWith('prepare')&&options.noFill)throw new Error('no fill');
      if(method==='showInterstitial'){setTimeout(()=>fire(options.showFails?'interstitialAdFailedToShow':'interstitialAdDismissed'),5);return{};}
      if(method==='showRewardVideoAd'){
        if(options.earn!==false)setTimeout(()=>fire('onRewardedVideoAdReward'),2);
        setTimeout(()=>fire('onRewardedVideoAdDismissed'),6);
        return new Promise(()=>{});   // like the plugin on an early close: never settles
      }
      return{};
    }}};
  const document={documentElement:{setAttribute:n=>attrs.add(n),removeAttribute:n=>attrs.delete(n)},dispatchEvent:e=>events.push(e.type)};
  for(const name of ['config','ads'])vm.runInNewContext(fs.readFileSync(`docs/src/platform/${name}.js`,'utf8'),{window,document,Event,setTimeout,clearTimeout,Promise,String,Boolean,Number,URLSearchParams,location:{search:''}});
  const p=window.MidnightPlatform;if(options.config)Object.assign(p.config.ads,options.config);
  const settle=()=>new Promise(r=>setTimeout(r,15));
  return{ads:p.ads,calls,of:m=>calls.filter(c=>c.method===m),attrs,events,settle};
}
test('ads: test units load only after the SDK starts and privacy needs nothing more',async()=>{
  const a=adNet();
  assert.equal(a.ads.interstitialReady(),false);assert.equal(a.ads.rewardedAvailable(),false);
  await a.ads.init();await a.settle();
  assert.equal(a.of('initialize')[0].data.initializeForTesting,true);
  assert.equal(a.of('prepareInterstitial')[0].data.adId,'ca-app-pub-3940256099942544/1033173712');
  assert.equal(a.of('prepareRewardVideoAd')[0].data.adId,'ca-app-pub-3940256099942544/5224354917');
  assert.equal(a.ads.interstitialReady(),true);assert.equal(a.ads.rewardedAvailable(),true);assert.equal(a.ads.needsPrivacyPrompt(),false);
  const ios=adNet({platform:'ios'});await ios.ads.init();await ios.settle();
  assert.equal(ios.of('prepareInterstitial')[0].data.adId,'ca-app-pub-3940256099942544/4411468910');
  const live=adNet({config:{testMode:false}});await live.ads.init();await live.settle();
  assert.equal(live.of('prepareInterstitial').length,0,'no real unit id configured: nothing is requested');
  const real=adNet({config:{testMode:false,units:{android:{interstitial:'ca-app-pub-1/2',rewarded:'ca-app-pub-1/3'}}}});await real.ads.init();await real.settle();
  assert.equal(real.of('prepareInterstitial')[0].data.adId,'ca-app-pub-1/2');assert.equal(real.of('prepareInterstitial')[0].data.isTesting,false);
});
test('ads: nothing is requested before the consent form and the iOS tracking question are answered',async()=>{
  const a=adNet({platform:'ios',tracking:'notDetermined',consent:{status:'REQUIRED',isConsentFormAvailable:true,canRequestAds:false}});
  await a.ads.init();await a.settle();
  assert.equal(a.ads.needsPrivacyPrompt(),true);assert.equal(a.of('prepareInterstitial').length+a.of('prepareRewardVideoAd').length,0);
  assert.equal(a.ads.interstitialReady(),false);assert.equal(a.ads.rewardedAvailable(),true,'can be offered; the note comes first');
  assert.equal(a.of('showConsentForm').length+a.of('requestTrackingAuthorization').length,0,'never prompted on its own');
  await a.ads.requestPrivacy();await a.settle();
  assert.deepEqual(a.calls.filter(c=>['showConsentForm','requestTrackingAuthorization'].includes(c.method)).map(c=>c.method),['showConsentForm','requestTrackingAuthorization']);
  assert.equal(a.ads.needsPrivacyPrompt(),false);assert.equal(a.of('prepareInterstitial').length,1);assert.equal(a.ads.interstitialReady(),true);
  const android=adNet({tracking:'notDetermined'});await android.ads.init();await android.settle();
  assert.equal(android.ads.needsPrivacyPrompt(),false);assert.equal(android.of('trackingAuthorizationStatus').length,0);
});
test('ads: interstitial resolves after it closes, pauses the game audio flag, and reloads',async()=>{
  const a=adNet();await a.ads.init();await a.settle();
  const shown=a.ads.showInterstitial('dawn-bulletin');await Promise.resolve();
  assert.equal(a.attrs.has('data-ad'),true);assert.equal(a.ads.interstitialReady(),false);
  assert.equal((await shown).shown,true);assert.equal(a.attrs.has('data-ad'),false);
  assert.deepEqual(a.events,['midnight:ad','midnight:ad']);
  await a.settle();assert.equal(a.of('prepareInterstitial').length,2);
  const failing=adNet({showFails:true});await failing.ads.init();await failing.settle();
  assert.equal((await failing.ads.showInterstitial()).shown,false);assert.equal(failing.attrs.has('data-ad'),false);
  const empty=adNet({noFill:true});await empty.ads.init();await empty.settle();
  assert.equal(empty.ads.interstitialReady(),false);assert.equal((await empty.ads.showInterstitial()).reason,'not-ready');assert.equal(empty.of('showInterstitial').length,0);
});
test('ads: no-ads owners never load or see an interstitial but can still choose a rewarded ad',async()=>{
  const a=adNet();a.ads.setAdFree(true);await a.ads.init();await a.settle();
  assert.equal(a.of('prepareInterstitial').length,0);assert.equal(a.ads.interstitialReady(),false);
  assert.equal((await a.ads.showInterstitial()).reason,'ad-free');assert.equal(a.of('showInterstitial').length,0);
  assert.equal(a.ads.rewardedAvailable(),true);assert.equal((await a.ads.showRewarded('guest-share')).rewarded,true);
});
test('ads: a reward counts only when earned; closing early, failures and a missing SDK give nothing',async()=>{
  const a=adNet();await a.ads.init();await a.settle();
  assert.deepEqual([(await a.ads.showRewarded()).rewarded,a.attrs.has('data-ad')],[true,false]);
  const early=adNet({earn:false});await early.ads.init();await early.settle();
  const result=await early.ads.showRewarded();assert.equal(result.rewarded,false);assert.equal(result.reason,'closed-early');
  const empty=adNet({noFill:true});await empty.ads.init();await empty.settle();
  assert.equal(empty.ads.rewardedAvailable(),false);assert.equal((await empty.ads.showRewarded()).rewarded,false);
  const dead=adNet({initFails:true});await dead.ads.init();
  assert.equal(dead.ads.rewardedAvailable(),false);assert.equal((await dead.ads.showRewarded()).rewarded,false);assert.equal((await dead.ads.showInterstitial()).shown,false);
});
test('a shared clip brings only a departing guest closer, within the customer book limit, and saves',()=>{
  const E=require('../docs/engine');const s=E.fresh();E.open(s);const g=E.arrive(s);
  assert.equal(E.befriend(s,g.id),false,'not while seated');
  g.status='farewell';const book=s.customerBook[g.person];
  assert.equal(E.befriend(s,g.id,2),true);assert.equal(book.affinity,2);
  for(let i=0;i<20;i++)E.befriend(s,g.id,99);assert.equal(book.affinity,20);
  assert.equal(E.befriend(s,'missing'),false);
  const money=s.money,xp=s.xp;E.befriend(s,g.id);assert.deepEqual([s.money,s.xp],[money,xp],'no money or growth is granted');
  assert.equal(E.restore(JSON.stringify(s)).customerBook[g.person].affinity,20);
});
test('ad moments are labelled as ads, hook into the game only through its interface, and are precached',()=>{
  const events=fs.readFileSync('docs/ad-events.js','utf8'),game=fs.readFileSync('docs/game.js','utf8');
  assert.match(events,/다음 장은 광고 지면입니다/);assert.match(events,/다음 장 넘기기 · 광고/);assert.match(events,/영상 함께 보기 · 광고/);
  assert.match(events,/허용하지 않아도 소식지와 식당 영업은 똑같이 이어집니다/);
  assert.match(events,/context\.night<2/);assert.doesNotMatch(events,/nativePromise|'AdMob'/);
  assert.match(game,/MidnightAdEvents/);assert.doesNotMatch(game,/MidnightPlatform/);
  for(const page of ['docs/index.html','docs/approved.html']){const html=fs.readFileSync(page,'utf8');for(const id of ['bulletin-dialog','bulletin-next','talk-share','talk-share-status'])assert.ok(html.includes(`id="${id}"`),page+' '+id);assert.match(html,/\.\/ad-events\.js\?release=/);}
  assert.ok(fs.readFileSync('docs/sw.js','utf8').includes("'ad-events.js'"));
  const plist=fs.readFileSync('ios/App/App/Info.plist','utf8'),manifest=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
  assert.match(plist,/GADApplicationIdentifier/);assert.match(plist,/NSUserTrackingUsageDescription/);assert.match(plist,/cstr6suwn9\.skadnetwork/);
  assert.match(manifest,/com\.google\.android\.gms\.ads\.APPLICATION_ID/);
});
