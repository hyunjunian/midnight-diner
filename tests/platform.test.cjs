const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function load(native){
  const window={},document={querySelector:()=>({content:'20261110-v81-capacitor-shell'})};
  if(native!==undefined)window.Capacitor={isNativePlatform:()=>native};
  for(const name of ['ads','store','updater'])vm.runInNewContext(fs.readFileSync(`docs/src/platform/${name}.js`,'utf8'),{window,document});
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
  const window=Object.assign(new EventTarget(),{Capacitor:{isNativePlatform:()=>true},MidnightApp:{launch(){launches++}}});
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
  for(const name of ['ads','store','updater']){assert.match(index,new RegExp(`\\./src/platform/${name}\\.js\\?release=`));assert.ok(sw.includes(`'src/platform/${name}.js'`));}
});
