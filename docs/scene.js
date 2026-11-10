/* Native-surface decorating: one visual source for catalogue, flight and installation. */
(()=>{'use strict';const $=id=>document.getElementById(id),E=window.MidnightEngine,F=window.MidnightFurnishings;
 const slots=F.slots;let area='inside',pan=0,dragging=false,startX=0,startPan=0,current,selected,cookingNow,pending=null,pendingFrom=0,pendingGain=0,placingUntil=0,placementSerial=0;
 const rectOf=(id,n=0)=>{const u=E.upgrades[id],r=F.rectangle(id);if(u.slot==='lantern'){r[3]=[218,215,224,222][u.theme]/1024*100;r[0]=[721,706,706,706][u.theme]/1536*100;}if(u.slot==='lantern'&&n){r[0]=((n===1?[233,325,310,325][u.theme]:[1195,1130,1135,1169][u.theme])/1536)*100;}return r;};
 const bg=(rect)=>{const[x,y,w,h]=rect;return `background-size:${10000/w}% ${10000/h}%;background-position:${w>=100?0:x/(100-w)*100}% ${h>=100?0:y/(100-h)*100}%;`;};
 function itemArt(id){const u=E.upgrades[id],r=F.rectangle(id,true),native=u.area==='inside'?1536/1024:940/1674,ratio=r[2]/r[3]*native;return `<span class="furnishing-art" role="img" aria-label="${u.name}" data-item-art="${id}"><span class="installed-item-picture" style="width:${Math.min(100,ratio*100)}%;height:${Math.min(100,100/ratio)}%;background-image:url('./assets/${F.file(id)}.webp');${bg(r)}"></span></span>`;}
 function decoration(id,n=0){const u=E.upgrades[id],r=rectOf(id,n);return `<span class="surface-upgrade" role="img" aria-label="${u.name}" style="${u.slot==='plants'?'clip-path:polygon(0 0,100% 0,100% 100%,24% 100%,24% 57%,0 57%);':u.slot==='bench'?'clip-path:polygon(0 0,65% 0,100% 18%,100% 100%,0 100%);':''}background-image:url('./assets/${F.file(id)}.webp');${bg(r)}"><span class="surface-closed" style="background-image:url('./assets/${F.file(id,true)}.webp')"></span></span>`;}
  function character(person,cls='') {
    const art=MidnightMorph.portrait(person);
    const file={a:'visitors-a.webp',b:'visitors-b.webp'}[art.sheet];
    return `<span class="actor ${cls}" data-person="${person}" style="--sprite-image:url('./assets/${file}');--sprite-size:400% ${art.rows*100}%;--sprite-x:${art.tile%4*100/3}%;--sprite-y:${Math.floor(art.tile/4)*100/(art.rows-1)}%"><span class="actor-art"></span><canvas class="actor-morph" aria-hidden="true"></canvas></span>`;
  }
  function placePan() {
    const limit = Math.max(0, ($('scene-world').offsetWidth - $('scene').offsetWidth) / 2);
    pan = Math.max(-limit, Math.min(limit, pan));
    $('scene-world').style.setProperty('--pan', `${pan}px`);
    const box=$('scene-world').getBoundingClientRect(),sceneBox=$('scene').getBoundingClientRect();
    $('scene').style.setProperty('--scene-art-top',`${Math.max(0,box.top-sceneBox.top)}px`);
    $('scene').style.setProperty('--scene-art-bottom',`${Math.min(sceneBox.height,box.bottom-sceneBox.top)}px`);
    $('scene').style.setProperty('--scene-art-width',`${box.width}px`);
    $('scene').style.setProperty('--scene-art-pan',`${pan}px`);placeServiceNote();
    $('pan-position').textContent = area==='inside' ? (pan > 60 ? '부엌 쪽' : pan < -60 ? '찻장 쪽' : '카운터') : '골목 입구';
  }
  // The renovation overview changes width over 650ms. Keep ceiling/floor joins on its live edges.
  const roomBoundsObserver=new ResizeObserver(placePan);roomBoundsObserver.observe($('scene-world'));
  function showArea(next) {
    area = next; pan = 0;
    $('scene').classList.toggle('outside',area==='outside');
    $('pan-hint').textContent = area==='inside' ? ' 좌우로 밀어 가게를 둘러보세요 ' : '가게 앞도 나만의 모습으로 꾸며요';
    if(current) render(current,selected,cookingNow);
    placePan();syncNavigation();
  }

 function preparePlacement(id,from=0,gain=0){++placementSerial;$('scene').classList.remove('installation-overview');document.querySelectorAll('.installation-flight,.installation-aura').forEach(el=>el.remove());document.querySelectorAll('.placement-installing,.placement-shining,.placement-pending').forEach(el=>el.classList.remove('placement-installing','placement-shining','placement-pending'));pending=id;pendingFrom=from;pendingGain=gain;}
 function showItem(id,origin){const serial=++placementSerial,u=E.upgrades[id],slot=slots[u.slot];$('scene').classList.add('installation-focus');showArea(u.area);
  const r=rectOf(id,pendingFrom),[x,,w]=r;pan=$('scene-world').offsetWidth*(.5-(x+w/2)/100);placePan();
  const targets=[...document.querySelectorAll(`.decor-${id}.placement-pending`)];if(!targets.length)return;if(targets.length>1&&u.area==='inside'){$('scene').classList.add('installation-overview');pan=0;placePan();}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,travel=reduced?650:1900,total=travel+(targets.length-1)*160,until=total+3000,banner=$('placement-banner');placingUntil=performance.now()+until;
  banner.innerHTML=`<b>${u.name}${targets.length>1?' ×'+targets.length:''}</b><span>${slot.place}에 들여놓아요</span>`;banner.hidden=false;
  const aura=document.createElement('div');aura.className='installation-aura';document.body.append(aura);
  targets.forEach((target,i)=>{const flight=document.createElement('div'),size=Math.min(230,innerWidth*.54),cx=innerWidth/2-size/2,cy=innerHeight*.43-size/2,from=origin||{x:innerWidth/2,y:innerHeight*.65,width:50,height:50};flight.className='installation-flight';flight.dataset.flightPhase='growing';flight.innerHTML=itemArt(id);Object.assign(flight.style,{width:size+'px',height:size+'px',left:'0',top:'0',transform:`translate(${cx}px,${cy}px)`});document.body.append(flight);
   const grow=flight.animate(reduced?[{opacity:0},{opacity:1}]:[{transform:`translate(${from.x+from.width/2-size/2}px,${from.y+from.height/2-size/2}px) scale(.25)`,opacity:0},{transform:`translate(${cx}px,${cy}px) scale(1.06)`,opacity:1,offset:.8},{transform:`translate(${cx}px,${cy}px) scale(1)`,opacity:1}],{duration:reduced?180:450,easing:'ease-out',fill:'forwards'});grow.onfinish=()=>flight.dataset.flightPhase='showing';
   setTimeout(()=>{if(serial!==placementSerial)return;const box=target.getBoundingClientRect(),scale=Math.max(34,Math.min(box.width,box.height))/size,tx=box.x+box.width/2-size/2,ty=box.y+box.height/2-size/2;grow.cancel();flight.dataset.flightPhase='travelling';const move=flight.animate(reduced?[{opacity:1},{opacity:0}]:[{transform:`translate(${cx}px,${cy}px) scale(1)`,opacity:1},{transform:`translate(${tx}px,${ty}px) scale(${scale})`,opacity:1,offset:.88},{transform:`translate(${tx}px,${ty}px) scale(${scale})`,opacity:0}],{duration:reduced?250:800,easing:'cubic-bezier(.5,0,.5,1)',fill:'forwards'});move.onfinish=()=>{flight.remove();if(i===targets.length-1)aura.remove()};},(reduced?400:1100)+i*160);
   setTimeout(()=>{if(serial!==placementSerial)return;target.classList.remove('placement-pending');target.classList.add('placement-installing')},Math.max(300,travel-500)+i*160);
   setTimeout(()=>{if(serial!==placementSerial)return;target.classList.remove('placement-installing');target.classList.add('placement-shining');const share=Math.trunc(pendingGain/targets.length)+(i<Math.abs(pendingGain%targets.length)?Math.sign(pendingGain):0);target.querySelector('.placement-gain').classList.toggle('loss',share<0);target.querySelector('.placement-gain').textContent=`분위기 ${share>=0?'+':''}${share}`;window.MidnightAudio?.play('place')},travel+i*160);
  });
  setTimeout(()=>{if(serial!==placementSerial)return;pending=null;render(current,selected,cookingNow);banner.innerHTML=`<b>${u.name} · 분위기 ${pendingGain>=0?'+':''}${pendingGain}점</b><span>${F.benefitText(id)}</span>`},total);
  setTimeout(()=>{if(serial!==placementSerial)return;document.querySelectorAll('.placement-shining').forEach(el=>el.classList.remove('placement-shining'));$('scene').classList.remove('installation-focus','installation-overview');placePan();banner.hidden=true},until);
 }
 function render(s,guest,cook){current=s;selected=guest;cookingNow=cook;const R=E.R,r=s.renovation||R.initial(),source=R.image('inside',r.inside),out=R.image('outside',r.outside),closed=r.inside?source:'./assets/room-closed-v19.webp',outClosed=r.outside?out:'./assets/exterior-closed-v19.webp';
  // One approved complete background, never a completed photo plus individual furniture patches.
  $('decorations').replaceChildren();
  for(const el of document.querySelectorAll('.interior-art,.counter-front'))if(el.getAttribute('src')!==source)el.src=source;
  const unlit=$('scene-world').querySelector('.interior-closed');if(unlit.getAttribute('src')!==closed)unlit.src=closed;
  $('scene').style.setProperty('--scene-room-image',`url('${s.phase==='prep'?closed:source}')`);
  const ext=$('scene-world').querySelector('.exterior-art');ext.style.backgroundImage=`url('${out}')`;ext.style.setProperty('--exterior-closed-image',`url('${outClosed}')`);
  $('scene').classList.toggle('renovated-inside',r.inside>0);$('scene').classList.toggle('renovated-outside',r.outside>0);$('scene').dataset.insideLevel=r.inside;$('scene').dataset.outsideLevel=r.outside;
  $('customers').hidden=area==='outside';$('scene-world').classList.toggle('exterior-world',area==='outside');$('scene').classList.remove('has-lantern');$('scene').style.setProperty('--lamp-ambient','1');syncNavigation();placePan();
 }
 const renovationImages=new Map();
 function preloadRenovation(nextArea,level){const url=E.R.image(nextArea,level);if(!renovationImages.has(url))renovationImages.set(url,new Promise((resolve,reject)=>{const image=new Image(),timer=setTimeout(()=>{renovationImages.delete(url);reject(Error('이미지를 불러오지 못했습니다. 자금는 차감되지 않았어요.'));},15000);image.onload=()=>{clearTimeout(timer);resolve(image)};image.onerror=()=>{clearTimeout(timer);renovationImages.delete(url);reject(Error('이미지를 불러오지 못했습니다. 자금는 차감되지 않았어요.'))};image.src=url;}));return renovationImages.get(url);}
 function setRenovationLoading(on){placingUntil=on?performance.now()+17000:0;}
 async function showRenovation(nextArea,previous,result){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,world=$('scene-world'),scene=$('scene'),banner=$('placement-banner'),u=result.upgrade,serial=++placementSerial;
  pending=null;scene.classList.add('installation-focus','installation-overview','renovation-running');showArea(nextArea);pan=0;placePan();placingUntil=performance.now()+5000;
  banner.innerHTML=`<b>${nextArea==='inside'?'내부':'외부'} 개선 · ${u.zone}</b><span>${u.name} · 사용 자금 ¥${result.cash.toLocaleString()}${result.credit?' + 이전 구매 반영':''}</span>`;banner.hidden=false;
  const before=document.createElement('img');before.className='renovation-before';before.alt='';before.src=previous;world.append(before);
  const sweep=document.createElement('div');sweep.className='renovation-sweep';world.append(sweep);window.MidnightAudio?.play('renovation-sweep');
  try{
   await before.decode().catch(()=>{});
   await before.animate(reduced?[{opacity:1},{opacity:0}]:[{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],{duration:reduced?120:1250,easing:'cubic-bezier(.2,.65,.2,1)',fill:'forwards'}).finished.catch(()=>{});
   before.remove();sweep.remove();if(serial!==placementSerial)return;
   const sparkles=document.createElement('div');sparkles.className='renovation-sparkles';world.append(sparkles);
   if(!reduced)for(let i=0;i<26;i++){const dot=document.createElement('i');dot.style.cssText=`left:${8+Math.random()*84}%;top:${12+Math.random()*72}%;--delay:${Math.random()*.45}s`;sparkles.append(dot);}
   window.MidnightAudio?.play('renovation-complete');
   banner.innerHTML=`<b>${nextArea==='inside'?'내부':'외부'} Lv${u.level} 개선 완료</b><span>분위기 +${u.atmosphere} · 환경 +${u.environment}</span>`;banner.classList.add('renovation-complete');
   await new Promise(resolve=>setTimeout(resolve,reduced?1600:2400));sparkles.remove();
  }finally{before.remove();sweep.remove();if(serial===placementSerial){banner.hidden=true;banner.classList.remove('renovation-complete');scene.classList.remove('installation-focus','installation-overview','renovation-running');placingUntil=0;placePan();}}
 }
 function placeServiceNote(){const bar=document.querySelector('.service-bar'),dock=document.querySelector('.game-dock');if(!bar||!dock)return;if(!bar.classList.contains('is-serving')||innerWidth>innerHeight){bar.style.removeProperty('top');bar.style.removeProperty('bottom');return;}const world=$('scene-world').getBoundingClientRect(),br=bar.getBoundingClientRect(),dr=dock.getBoundingClientRect();const plaques=[...document.querySelectorAll('.customer .customer-name')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect().bottom),clearance=plaques.length?Math.max(...plaques)+14:0,desired=Math.min(world.bottom+14,innerHeight*.715,dr.top-br.height-50);bar.style.top=`${Math.round(Math.max(clearance,desired,0))}px`;bar.style.bottom='auto';}
 const serviceObserver=new ResizeObserver(()=>requestAnimationFrame(placeServiceNote));for(const el of document.querySelectorAll('.service-bar,.game-dock'))serviceObserver.observe(el);
 function syncNavigation(){
  const nav=$('location-nav');if(!nav)return;const focused=nav.contains(document.activeElement)?document.activeElement:null,kitchen=window.MidnightKitchen?.isVisible(),location=kitchen?'kitchen':area==='outside'?'outside':'counter';
  if(kitchen){const header=document.querySelector('.kitchen-header');if(nav.previousElementSibling!==header)header.after(nav);}else{const host=document.querySelector('.scene-controls');if(nav.parentElement!==host)host.prepend(nav);}
  for(const button of nav.querySelectorAll('[data-location]'))button.setAttribute('aria-pressed',String(button.dataset.location===location));
  const note=nav.querySelector('.nav-cooking-note');if(note)note.hidden=!current?.kitchen;$('app').dataset.location=location;if(focused&&document.activeElement!==focused)focused.focus({preventScroll:true});queueNavigationPlacement();
 }
 let navigationFrame=0;
 function queueNavigationPlacement(){if(!navigationFrame)navigationFrame=requestAnimationFrame(()=>{navigationFrame=0;placeNavigation();});}
 function placeNavigation(){
  const host=document.querySelector('.scene-controls');if(!host)return;
  const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top'))||0;
  const night=document.querySelector('.night-hud'),wallet=document.querySelector('.wallet-hud'),settings=$('settings-open'),growth=$('progress-hud');
  const rail=document.querySelector('.game-hud');rail.classList.remove('wallet-reflow');
  const natural=wallet.getBoundingClientRect(),nightWidth=night.getBoundingClientRect().width,gap=parseFloat(getComputedStyle(rail).columnGap)||0;
  const settingsSize=Math.max(44,natural.height);rail.style.setProperty('--settings-hud-size',`${settingsSize}px`);
  const wrapped=nightWidth+natural.width+settingsSize+gap*2>rail.clientWidth+.5;
  rail.classList.toggle('wallet-reflow',wrapped);$('app').classList.toggle('wallet-hud-wrapped',wrapped);
  const n=night.getBoundingClientRect(),w=wallet.getBoundingClientRect();
  const key=settings.getBoundingClientRect(),g=growth.getBoundingClientRect(),hud=rail.getBoundingClientRect();
  const left=n.right+8,right=w.left-8,inline=g.width>0&&right-left>=g.width;
  const hudBottom=Math.max(n.bottom,w.bottom,key.bottom);
  if(inline){
   // Prefer the screen's center, then keep the whole panel inside the actual gap.
   growth.style.left=`${Math.round(Math.max(left,Math.min((innerWidth-g.width)/2,right-g.width)))}px`;
   growth.style.top=`${Math.round(hud.top+(hud.height-g.height)/2)}px`;
  }else{
   growth.style.left=`${Math.round((innerWidth-g.width)/2)}px`;
   growth.style.top=`${Math.ceil(Math.max(safe+83,hudBottom+8))}px`;
  }
  growth.dataset.hudLayout=inline?'inline':'below';
  const compactLandscape=innerWidth>innerHeight&&innerHeight<=550;
  const bottom=Math.max(hudBottom,growth.getBoundingClientRect().bottom);
  host.style.setProperty('--location-nav-top',`${Math.ceil(Math.max((compactLandscape?68:130)+safe,bottom+8))}px`);
  $('app').style.setProperty('--hud-nav-bottom',`${Math.ceil(host.getBoundingClientRect().bottom)}px`);
 }
 function navigate(location){
  if(!['counter','kitchen','outside'].includes(location))return false;
  if(location==='kitchen'&&window.MidnightKitchen?.isVisible()){syncNavigation();return true;}
  if(location==='kitchen')window.MidnightKitchen?.open();else{window.MidnightKitchen?.hide();showArea(location==='outside'?'outside':'inside');}
  syncNavigation();return true;
 }
 $('location-nav')?.addEventListener('click',event=>{const button=event.target.closest('[data-location]');if(button)navigate(button.dataset.location);});
 document.addEventListener('midnight:kitchen',syncNavigation);
 const navigationObserver=new ResizeObserver(queueNavigationPlacement);for(const el of document.querySelectorAll('#progress-hud,.game-hud,.night-hud,.wallet-hud,#settings-open'))navigationObserver.observe(el);window.addEventListener('resize',queueNavigationPlacement);
 $('pan-left').addEventListener('click',()=>{pan+=180;placePan()});$('pan-right').addEventListener('click',()=>{pan-=180;placePan()});$('scene').addEventListener('pointerdown',e=>{if(performance.now()<placingUntil||e.target.closest('button'))return;dragging=true;startX=e.clientX;startPan=pan});window.addEventListener('pointermove',e=>{if(!dragging)return;pan=startPan+e.clientX-startX;placePan()});window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);window.addEventListener('resize',placePan);
 window.MidnightScene={navigate,syncNavigation,character,itemArt,decoration,preview:itemArt,slots,render,showArea,showItem,preparePlacement,preloadRenovation,setRenovationLoading,showRenovation,isPlacing:()=>performance.now()<placingUntil};
})();
