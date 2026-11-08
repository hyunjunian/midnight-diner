(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let installPrompt = null, registration = null;
  const watched=new WeakSet();
  function installGuide() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|CriOS/.test(navigator.userAgent);
    $('install-guide').hidden = false;
    $('install-guide').innerHTML = ios ? '<p>Safari에서 <b>공유   홈 화면에 추가</b>를 선택해 주세요.</p><p>설치한 심야식당 아이콘을 누르면 게임이 시작됩니다.</p>' : safari ? '<p>Safari의 <b>파일  Dock에 추가</b>를 선택해 주세요.</p><p>Dock의 심야식당 아이콘에서 게임을 실행해 주세요.</p>' : '<p>Chrome 또는 Edge의 주소창에 있는 <b>설치 아이콘</b>이나 브라우저 메뉴의 <b>앱 설치 / 홈 화면에 추가</b>를 선택해 주세요.</p><p>설치한 심야식당 아이콘을 누르면 게임이 시작됩니다.</p>';
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event;
    $('install-app').textContent = '앱 설치하기 ';
    $('install-hint').textContent = '한 번 설치하면 인터넷 없이도 식당을 열 수 있어요.';
  });
  $('install-app').addEventListener('click', async () => {
    if (!installPrompt) return installGuide();
    const prompt = installPrompt; installPrompt = null;
    try {
      await prompt.prompt(); const choice = await prompt.userChoice;
      $('install-status').textContent = choice.outcome === 'accepted' ? '설치한 심야식당 아이콘에서 실행해 주세요.' : '준비되면 언제든 다시 설치할 수 있어요.';
    } catch { installGuide(); }
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null; $('install-app').textContent = '설치한 아이콘에서 실행해 주세요';
    $('install-status').textContent = '앱 설치가 완료되었습니다.';
  });
  const currentRelease = document.querySelector('meta[name="app-release"]')?.content || '';
  const embeddedPreview = document.documentElement.dataset.preview === 'embedded';
  const app = window.MidnightApp;
  const appURL=document.baseURI||location.href;
  const newer = (a,b) => typeof a === 'string' && a.localeCompare(b,'en',{numeric:true}) > 0;
  let launched=false,started=false,applying=false,pendingRelease='',readyRelease='',flight=null,epoch=0,needsForeground=false,lastForegroundAt=0;
  let lastInteraction=Date.now(),leaving=false;
  const pressedPointers=new Set(),pressedKeys=new Set();
  const params=new URL(location.href).searchParams;
  let resume=params.get('resume-update')==='1';
  if(params.has('app-update')||params.has('resume-update')){
    const clean=new URL(location.href);clean.searchParams.delete('app-update');clean.searchParams.delete('resume-update');
    history.replaceState(null,'',clean);
  }
  function launch(){
    if(launched)return;
    launched=true;
    if(resume)app.resumeAfterUpdate();else app.launch();
  }
  function readRelease(worker){
    if(!worker||typeof MessageChannel==='undefined')return Promise.resolve('');
    return new Promise(resolve=>{
      const channel=new MessageChannel();
      const timer=setTimeout(()=>{channel.port1.close();resolve('');},1500);
      channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data?.release||'');};
      try{worker.postMessage({type:'GET_RELEASE',clientRelease:currentRelease},[channel.port2]);}
      catch{clearTimeout(timer);channel.port1.close();resolve('');}
    });
  }
  async function latestRelease(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
    try{
      const url=new URL('./version.json',appURL);url.searchParams.set('check',Date.now()+'-'+Math.random().toString(36).slice(2));
      const response=await fetch(url,{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('Version unavailable');
      const data=await response.json();
      if(!/^\d{8}-v\d+-[a-z0-9-]+$/.test(data.release||''))throw new Error('Invalid version');
      return data.release;
    }catch{return '';}
    finally{clearTimeout(timer);}
  }
  function watch(reg){
    registration=reg;
    if(watched.has(reg))return reg;watched.add(reg);
    const prepared=()=>{$('offline-status').textContent='인트로와 게임이 저장됐어요. 오프라인으로 실행할 수 있어요.';$('install-status').textContent='오프라인 실행 준비 완료';};
    if(reg.active?.state==='activated')prepared();
    const inspect=()=>{
      const worker=reg.installing;
      worker?.addEventListener('statechange',()=>{
        if(worker.state==='installed')reg.waiting?.postMessage({type:'SKIP_WAITING'});
        if(worker.state==='activated')prepared();
        if(worker.state==='redundant')$('offline-status').textContent='오프라인 저장을 완료하지 못했어요. 다시 연결해 주세요.';
      });
    };
    reg.addEventListener('updatefound',inspect);inspect();
    reg.waiting?.postMessage({type:'SKIP_WAITING'});
    return reg;
  }
  async function register(target=currentRelease){
    if(!('serviceWorker' in navigator)||!window.isSecureContext){$('offline-status').textContent='이 환경에서는 오프라인 저장을 지원하지 않아요.';return null;}
    try{return watch(await navigator.serviceWorker.register('./sw.js?build='+encodeURIComponent(target),{scope:'./',updateViaCache:'none'}));}
    catch{return null;}
  }
  async function ensureRelease(target){
    const active=await readRelease(navigator.serviceWorker?.controller);
    if(active===target||newer(active,target))return active;
    const reg=await register(target);if(!reg)throw new Error('install');
    let rejected=false;
    const track=()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='redundant')rejected=true;});};
    reg.addEventListener('updatefound',track);track();
    const began=Date.now(),deadline=began+120000;
    while(Date.now()<deadline){
      if(rejected)break;
      const worker=reg.active;
      if(worker?.state==='activated'){
        const release=await readRelease(worker);
        if(release===target||newer(release,target))return release;
      }
      if(!reg.installing&&!reg.waiting&&(reg.active?.state==='redundant'||Date.now()-began>5000))break;
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    throw new Error('install');
  }
  function applyPreparedUpdate(){
    if(leaving||!newer(readyRelease,currentRelease)||applying||!launched||$('app').hidden)return;
    // A prepared shell can replace a background page without touching its next
    // visible frame. Foreground play waits for cooking, dialogs and input to end.
    if(!document.hidden&&(app.isCooking()||document.querySelector('dialog[open]')||
      app.canApplyUpdate?.()===false||pressedPointers.size||pressedKeys.size||Date.now()-lastInteraction<1500))return;
    if(app.saveForUpdate()===false)return; // Keep playing; retry later without UI.
    applying=true;
    const url=new URL('./',appURL);url.searchParams.set('app-update',readyRelease);
    url.searchParams.set('resume-update','1');
    location.replace(url.href);
  }
  async function checkForeground(){
    const marker=await latestRelease();
    const active=await readRelease(navigator.serviceWorker?.controller);
    let target=currentRelease;
    for(const candidate of [marker,active,pendingRelease])if(newer(candidate,target))target=candidate;
    if(newer(target,currentRelease)){
      pendingRelease=target;
      try{const ready=await ensureRelease(target);if(newer(ready,readyRelease))readyRelease=ready;applyPreparedUpdate();}
      catch{} // Failed/slow/offline updates never interrupt the running game.
    }else register(currentRelease);
  }
  function foreground(force=false){
    if(!started||document.hidden||applying)return;
    const now=Date.now();
    if(!force&&!needsForeground&&now-lastForegroundAt<500)return flight;
    needsForeground=false;lastForegroundAt=now;
    if(flight)return flight;
    const checkEpoch=epoch;
    flight=checkForeground().catch(()=>{}).finally(()=>{
      flight=null;if(!document.hidden&&!applying&&checkEpoch!==epoch)foreground(true);
    });
    return flight;
  }
  function background(){
    if(!started)return;
    epoch++;needsForeground=true;pressedPointers.clear();pressedKeys.clear();app.saveForUpdate();applyPreparedUpdate();
  }
  function start(){if(started)return flight;started=true;launch();return foreground(true);}
  window.MidnightPWA={start};
  document.addEventListener('visibilitychange',()=>document.hidden?background():foreground());
  window.addEventListener('pagehide',()=>{leaving=true;app.saveForUpdate();});
  window.addEventListener('pageshow',event=>{leaving=false;if(event.persisted){if(!flight)needsForeground=true;foreground();}});
  window.addEventListener('focus',()=>foreground());
  window.addEventListener('online',()=>foreground(true));
  // Input tracking prevents a background download from replacing a page under a
  // finger or keyboard action. There is no checking overlay or checking pause.
  document.addEventListener('pointerdown',event=>{pressedPointers.add(event.pointerId);lastInteraction=Date.now();},true);
  for(const type of ['pointerup','pointercancel'])document.addEventListener(type,event=>{pressedPointers.delete(event.pointerId);lastInteraction=Date.now();},true);
  document.addEventListener('keydown',event=>{pressedKeys.add(event.code||event.key);lastInteraction=Date.now();},true);
  document.addEventListener('keyup',event=>{pressedKeys.delete(event.code||event.key);lastInteraction=Date.now();},true);
  navigator.serviceWorker?.addEventListener('message',event=>{
    if(event.data?.type!=='APP_UPDATED'||!newer(event.data.release,currentRelease))return;
    pendingRelease=event.data.release;foreground(true);
  });
  navigator.serviceWorker?.addEventListener('controllerchange',async()=>{
    const release=await readRelease(navigator.serviceWorker.controller);
    if(newer(release,currentRelease)){pendingRelease=release;foreground(true);}
  });
  document.addEventListener('close',applyPreparedUpdate,true);document.addEventListener('midnight:kitchen',applyPreparedUpdate);
  setInterval(applyPreparedUpdate,1000);
  $('update-app').addEventListener('click',()=>foreground(true));
  setInterval(async()=>{
    if(!document.hidden&&registration)try{await registration.update();}catch{}
  },60000);
  if(!embeddedPreview)start();
})();
