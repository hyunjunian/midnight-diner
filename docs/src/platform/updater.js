/* Platform layer: live updates of the bundled app. Game code calls only
   window.MidnightPlatform.updater.

   Browser: always skipped. The site updates through the service worker (pwa.js).
   Native: @capgo/capacitor-updater in manual mode. Nothing is sent to a managed
   service; the app reads <updateBaseUrl>/latest.json from our own R2 bucket:

     { "version": "20261110-v82-example",        release tag of the web bundle
       "minNative": "1.0",                       oldest app-store version that may run it
       "files": { "index.html": "<sha256>" },    every bundle file; only changed ones download
       "zip": { "url": "...", "checksum": "<sha256>" } }   optional whole-bundle fallback

   A newer bundle is downloaded while the game runs, then applied with apply()
   once the caller has saved (pwa.js does this when the app goes to the background). */
(()=>{'use strict';
  const PLUGIN='CapacitorUpdater',RESUME_KEY='midnight-diner-native-update';
  const RELEASE=/^\d{8}-v\d+-[a-z0-9-]+$/,HASH=/^[0-9a-f]{64}$/;
  const cap=()=>window.Capacitor;
  const isNative=()=>cap()?.isNativePlatform?.()===true;
  const call=(method,options={})=>cap().nativePromise(PLUGIN,method,options);
  const release=()=>document.querySelector('meta[name="app-release"]')?.content||'';
  const baseUrl=()=>String(window.MidnightPlatform?.config?.updateBaseUrl||'').replace(/\/+$/,'');
  const newer=(a,b)=>typeof a==='string'&&a.localeCompare(b,'en',{numeric:true})>0;
  const enabled=()=>isNative()&&typeof cap().nativePromise==='function'&&/^https:\/\//.test(baseUrl());
  let ready=null,flight=null,confirmed=false;

  // Native HTTP avoids browser CORS rules for the capacitor:// origin.
  async function readLatest(){
    const url=baseUrl()+'/latest.json?check='+Date.now();
    let data;
    try{
      const response=await cap().nativePromise('CapacitorHttp','request',{url,method:'GET',headers:{'Cache-Control':'no-cache'},responseType:'json',connectTimeout:8000,readTimeout:8000});
      if(response.status!==200)throw new Error('status');
      data=response.data;
    }catch{
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok)throw new Error('status');
      data=await response.text();
    }
    if(typeof data==='string')data=JSON.parse(data);
    if(!data||!RELEASE.test(data.version||''))throw new Error('invalid latest.json');
    return data;
  }
  function manifestOf(latest){
    const files=latest.files;
    if(!files||typeof files!=='object'||!HASH.test(files['index.html']||''))return null;
    const entries=[];
    for(const [name,hash] of Object.entries(files)){
      if(!HASH.test(hash)||name.startsWith('/')||name.split('/').includes('..'))return null;
      entries.push({file_name:name,file_hash:hash,download_url:baseUrl()+'/files/'+hash});
    }
    return entries;
  }
  async function download(latest){
    // A bundle fetched in an earlier session is reused instead of downloaded again.
    try{
      const {bundles=[]}=await call('list');
      const kept=bundles.find(bundle=>bundle.version===latest.version&&(bundle.status==='success'||bundle.status==='pending'));
      if(kept)return kept;
    }catch{}
    const manifest=manifestOf(latest);
    if(manifest)return call('download',{url:baseUrl()+'/latest.json',version:latest.version,manifest});
    const zip=latest.zip;
    if(zip&&/^https:\/\//.test(zip.url||'')&&HASH.test(zip.checksum||''))return call('download',{url:zip.url,version:latest.version,checksum:zip.checksum});
    throw new Error('latest.json has nothing to download');
  }
  async function runCheck(){
    const current=release();
    if(ready&&newer(ready.version,current))return{status:'ready',release:ready.version};
    const latest=await readLatest();
    if(!newer(latest.version,current))return{status:'none',release:current};
    if(latest.minNative){
      const {native=''}=await call('current');
      if(newer(String(latest.minNative),native))return{status:'needs-store-update',release:latest.version};
    }
    const bundle=await download(latest);
    if(!bundle?.id)throw new Error('download');
    ready={id:bundle.id,version:latest.version};
    return{status:'ready',release:latest.version};
  }
  const updater={
    isNative,
    currentRelease:release,
    // Call once the game has started: confirms this bundle works. A downloaded
    // bundle that never confirms is rolled back by the plugin on the next launch.
    async init(){
      if(!isNative()||typeof cap().nativePromise!=='function')return{ready:true,native:isNative()};
      if(!confirmed){confirmed=true;try{await call('notifyAppReady');}catch{confirmed=false;}}
      return{ready:confirmed,native:true};
    },
    // True once when this page was loaded by apply(), so the caller can resume
    // the saved game instead of replaying the intro.
    consumeResume(){
      try{
        const from=localStorage.getItem(RESUME_KEY);
        if(from===null)return false;
        localStorage.removeItem(RESUME_KEY);
        return from!==release();
      }catch{return false;}
    },
    // Resolves {status,release}: 'skipped' | 'none' | 'ready' | 'needs-store-update' | 'failed'.
    // Never throws and never interrupts play; a failed check is retried on the next call.
    check(){
      if(!enabled())return Promise.resolve({status:'skipped',release:release()});
      if(!flight)flight=runCheck().catch(()=>({status:'failed',release:release()})).finally(()=>{flight=null;});
      return flight;
    },
    hasReady:()=>Boolean(ready&&newer(ready.version,release())),
    // Switches to the downloaded bundle and reloads the web view. Save first:
    // on success the page is replaced and this promise never settles.
    async apply(){
      if(!enabled()||!updater.hasReady())return{applied:false,reason:'skipped'};
      try{localStorage.setItem(RESUME_KEY,release());}catch{}
      try{await call('set',{id:ready.id});return{applied:true};}
      catch{
        try{localStorage.removeItem(RESUME_KEY);}catch{}
        ready=null;
        return{applied:false,reason:'failed'};
      }
    }
  };
  (window.MidnightPlatform=window.MidnightPlatform||{}).updater=updater;
})();
