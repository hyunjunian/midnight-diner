(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const standalone = () => navigator.standalone === true ||
    ['standalone', 'fullscreen', 'minimal-ui'].some(mode => matchMedia(`(display-mode: ${mode})`).matches);
  let installPrompt = null, registration = null;
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
  let launched=false,started=false,applying=false,pendingRelease='',flight=null,epoch=0,needsForeground=false,lastForegroundAt=0;
  const params=new URL(location.href).searchParams;
  let resume=params.get('resume-update')==='1';
  if(params.has('app-update')||params.has('resume-update')){
    const clean=new URL(location.href);clean.searchParams.delete('app-update');clean.searchParams.delete('resume-update');
    history.replaceState(null,'',clean);
  }
  function cover(){
    document.documentElement.classList.add('app-checking-update');
    app.setUpdatePaused(true);
    const gate=$('app-update-gate');
    if(!gate.open)gate.showModal();
    $('app-update-message').textContent='최신 화면을 확인하고 있어요…';
    $('app-update-retry').hidden=true;$('app-update-offline').hidden=true;
  }
  function uncover(){
    if(document.hidden||applying)return;
    if(!launched){launched=true;if(resume)app.resumeAfterUpdate();else app.launch();}
    $('app-update-gate').close();document.documentElement.classList.remove('app-checking-update');
    app.setUpdatePaused(false);
  }
  function failure(message){
    $('app-update-message').textContent=message;
    $('app-update-retry').hidden=false;$('app-update-offline').hidden=false;
  }
  $('app-update-gate').addEventListener('cancel',event=>event.preventDefault());
  $('app-update-retry').addEventListener('click',()=>foreground(true));
  $('app-update-offline').addEventListener('click',uncover);
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
  function navigate(release){
    if(document.hidden)return;
    if(app.saveForUpdate()===false){failure('진행을 저장하지 못했어요. 저장 공간을 확인한 뒤 다시 시도해 주세요.');return;}
    applying=true;
    const url=new URL('./',appURL);url.searchParams.set('app-update',release);
    if(launched&&!$('app').hidden||resume)url.searchParams.set('resume-update','1');
    location.replace(url.href);
  }
  async function checkForeground(checkEpoch){
    const marker=await latestRelease();
    const active=await readRelease(navigator.serviceWorker?.controller);
    let target=currentRelease;
    for(const candidate of [marker,active,pendingRelease])if(newer(candidate,target))target=candidate;
    if(checkEpoch!==epoch||document.hidden)return;
    if(newer(target,currentRelease)){
      $('app-update-message').textContent='새 화면을 준비하고 있어요…';
      try{const ready=await ensureRelease(target);if(checkEpoch===epoch&&!document.hidden)navigate(ready);}
      catch{if(checkEpoch===epoch&&!document.hidden)failure('새 버전을 준비하지 못했어요. 연결과 저장 공간을 확인한 뒤 다시 시도해 주세요.');}
    }else{
      // An unavailable network marker must never prevent installed offline play.
      uncover();
      register(currentRelease);
    }
  }
  function foreground(force=false){
    if(!started||document.hidden||applying)return;
    const now=Date.now();
    if(!force&&!needsForeground&&now-lastForegroundAt<500)return flight;
    needsForeground=false;lastForegroundAt=now;cover();
    if(flight)return flight;
    const checkEpoch=epoch;
    flight=checkForeground(checkEpoch).catch(()=>failure('화면을 준비하지 못했어요. 다시 시도해 주세요.')).finally(()=>{
      flight=null;if(!document.hidden&&!applying&&checkEpoch!==epoch)foreground(true);
    });
    return flight;
  }
  function background(){
    if(!started)return;
    epoch++;needsForeground=true;cover();app.saveForUpdate();
  }
  function start(){if(started)return flight;started=true;return foreground(true);}
  window.MidnightPWA={start};
  document.addEventListener('visibilitychange',()=>document.hidden?background():foreground());
  window.addEventListener('pagehide',background);
  window.addEventListener('pageshow',event=>{if(event.persisted){if(!flight)needsForeground=true;foreground();}});
  window.addEventListener('focus',()=>foreground());
  window.addEventListener('online',()=>foreground(true));
  // Updates found while actively playing wait for a safe pause. Returning to the
  // app is always a foreground check, including cooking and already-open dialogs.
  function applyIdle(){
    if(!newer(pendingRelease,currentRelease)||flight||applying||document.hidden||!launched||$('app').hidden||app.isCooking()||document.querySelector('dialog[open]'))return;
    foreground(true);
  }
  navigator.serviceWorker?.addEventListener('message',event=>{
    if(event.data?.type!=='APP_UPDATED'||!newer(event.data.release,currentRelease))return;
    pendingRelease=event.data.release;setTimeout(applyIdle,0);
  });
  navigator.serviceWorker?.addEventListener('controllerchange',async()=>{
    const release=await readRelease(navigator.serviceWorker.controller);
    if(newer(release,currentRelease)){pendingRelease=release;applyIdle();}
  });
  document.addEventListener('close',applyIdle,true);document.addEventListener('midnight:kitchen',applyIdle);
  $('update-app').addEventListener('click',()=>foreground(true));
  setInterval(async()=>{
    if(!document.hidden&&registration)try{await registration.update();}catch{}
  },60000);
  if(!embeddedPreview)start();
})();
