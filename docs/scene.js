/* Original portrait atlas and a small articulated scene; game rules live in engine.js. */
(() => {
  const $ = id => document.getElementById(id);
  // Slots are measured against the original 1536×1024 kitchen and portrait facade.
  const slots={
    lantern:{rect:[48.5,3.2,6.6,16],place:'중앙의 기존 천장등',light:true},
    plants:{rect:[44,48,22,15.5],place:'입구 왼쪽의 바닥',tile:1,box:[.013,.057,.969,.951]},
    ceramics:{rect:[10.5,29.8,10,8.1],place:'왼쪽 수납장 안의 빈 선반',tile:2,box:[.016,.348,.982,.738]},
    noren:{rect:[63,25.5,34,15.8],place:'출입문 위의 나무 봉',tile:3,box:[.034,.207,.979,.789]},
    bonsai:{rect:[35.5,43,9.7,15.5],place:'창 아래 작업대 왼쪽',tile:4,box:[.026,.127,.964,.871]},
    bench:{rect:[58,63.1,36,10],place:'입구 오른쪽의 평평한 길가',tile:5,box:[0,.410,1,.781]},
    shelves:{rect:[73.2,24,11.8,31],place:'주방 오른쪽 찻장 자리',tile:6,box:[.141,.021,.859,.967]},
    sign:{rect:[80.2,17.5,11.1,13.6],place:'입구 위 오른쪽 벽',tile:7,box:[.211,.031,.766,.938]},
    clock:{rect:[4,12.5,6.5,17.3],place:'냉장고 위의 나무 벽',tile:0,growth:true,box:[.157,.092,.865,.923]},
    ikebana:{rect:[68.5,31.5,9,26],place:'창 아래 작업대 오른쪽',tile:1,growth:true,box:[.124,.064,.876,.952]},
    andon:{rect:[83,51,10,14],place:'출입문 오른쪽 바닥',tile:2,growth:true,box:[.174,.112,.826,.924]},
    sudare:{rect:[61.8,25,9.8,20.5],place:'오른쪽 창문 한 칸',tile:3,growth:true,box:[.086,.112,.92,.884]},
    plaque:{rect:[65,18.5,13,6.4],place:'입구 위의 가로 나무 보',tile:4,growth:true,box:[.047,.208,.953,.733]},
    fridge:{rect:[0,28,12,31],place:'주방 왼쪽의 기존 냉장고 자리',fridge:true}
  };
  let area='inside',pan=0,dragging=false,startX=0,startPan=0,current,selected,cookingNow,pending=null,placingUntil=0,placementSerial=0;
  function decoration(id){
    const slot=slots[id];
    if(slot.light)return '<span class="fixture-light" aria-hidden="true"></span>';
    if(slot.fridge)return '<span class="fridge-patch" role="img" aria-label="깨끗한 아이보리 냉장고"></span>';
    const [x,y,right,bottom]=slot.box,w=right-x,h=bottom-y,n=slot.tile;
    return `<span class="prop-crop"><span class="prop-art" role="img" aria-label="${MidnightEngine.upgrades[id].name}" style="left:${-x/w*100}%;top:${-y/h*100}%;width:${100/w}%;height:${100/h}%;background-image:url('./assets/${slot.growth?'decor-growth':'decor-real'}.webp');--prop-x:${n%4*100/3}%;--prop-y:${Math.floor(n/4)*100}%"></span></span>`;
  }
  function preview(id){const slot=slots[id],u=MidnightEngine.upgrades[id],[x,y,w,h]=slot.rect;return `<figure class="scene-preview ${u.area==='outside'?'outdoor':'indoor'}"><div class="preview-base"></div><div class="preview-prop" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%">${decoration(id)}</div><figcaption>${slot.place}</figcaption></figure>`;}
  function character(person,cls='') {
    const art=MidnightMorph.portrait(person);
    const file={a:'visitors-a.webp',b:'visitors-b.webp'}[art.sheet];
    return `<span class="actor ${cls}" data-person="${person}" style="--sprite-image:url('./assets/${file}');--sprite-size:400% ${art.rows*100}%;--sprite-x:${art.tile%4*100/3}%;--sprite-y:${Math.floor(art.tile/4)*100/(art.rows-1)}%"><span class="actor-art"></span><canvas class="actor-morph" aria-hidden="true"></canvas></span>`;
  }
  function placePan() {
    const limit = Math.max(0, ($('scene-world').offsetWidth - $('scene').offsetWidth) / 2);
    pan = Math.max(-limit, Math.min(limit, pan));
    $('scene-world').style.setProperty('--pan', `${pan}px`);
    $('pan-position').textContent = area==='inside' ? (pan > 60 ? '부엌 쪽' : pan < -60 ? '찻장 쪽' : '카운터') : '골목 입구';
  }
  function showArea(next) {
    area = next; pan = 0;
    $('scene').classList.toggle('outside',area==='outside');
    $('area-toggle').textContent = area==='inside' ? '가게 밖 보기 ↗' : '가게 안 보기 ↙';
    $('pan-hint').textContent = area==='inside' ? '← 좌우로 밀어 가게를 둘러보세요 →' : '가게 앞도 나만의 모습으로 꾸며요';
    if(current) render(current,selected,cookingNow);
    placePan();
  }
  function preparePlacement(id){for(const el of document.querySelectorAll('.placement-installing,.placement-shining,.placement-pending'))el.classList.remove('placement-installing','placement-shining','placement-pending');pending=id;}
  function showItem(id){
    const serial=++placementSerial;showArea(MidnightEngine.upgrades[id].area);
    const [x,,w]=slots[id].rect;pan=$('scene-world').offsetWidth*(.5-(x+w/2)/100);placePan();
    const el=document.querySelector(`.decor-${id}`);if(!el)return;
    const banner=$('placement-banner');banner.innerHTML=`<b>${MidnightEngine.upgrades[id].name}</b><span>${slots[id].place}에 배치하고 있어요.</span>`;banner.hidden=false;
    placingUntil=performance.now()+4200;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(serial!==placementSerial)return;pending=null;el.classList.remove('placement-pending');el.classList.add('placement-installing');$('scene').classList.toggle('has-lantern',current.upgrades.includes('lantern'));
      setTimeout(()=>{if(serial!==placementSerial)return;el.classList.remove('placement-installing');el.classList.add('placement-shining');banner.innerHTML=`<b>새로운 온기가 더해졌어요</b><span>${MidnightEngine.upgrades[id].name} · ${slots[id].place}</span>`;},1350);
      setTimeout(()=>{if(serial!==placementSerial)return;el.classList.remove('placement-shining');banner.hidden=true;},4200);
    }));
  }
  function render(s,guest,cook){
    current=s;selected=guest;cookingNow=cook;
    const ids=s.upgrades.filter(id=>MidnightEngine.upgrades[id].area===area),root=$('decorations');
    for(const el of [...root.children])if(!ids.includes(el.dataset.decoration))el.remove();
    for(const id of ids){const slot=slots[id],[x,y,w,h]=slot.rect;let el=root.querySelector(`[data-decoration="${id}"]`);
      if(!el){el=document.createElement('div');el.dataset.decoration=id;el.className=`placed-decoration decor-${id}${pending===id?' placement-pending':''}`;el.innerHTML=decoration(id)+'<span class="placement-halo" aria-hidden="true"></span>';root.append(el);}
      Object.assign(el.style,{left:`${x}%`,top:`${y}%`,width:`${w}%`,height:`${h}%`,zIndex:area==='outside'?String(Math.round(y+h)):'2'});
    }
    $('customers').hidden=area==='outside';$('scene-world').classList.toggle('exterior-world',area==='outside');$('scene').classList.toggle('has-lantern',s.upgrades.includes('lantern')&&pending!=='lantern');
  }
  $('area-toggle').addEventListener('click',()=>showArea(area==='inside'?'outside':'inside'));
  $('pan-left').addEventListener('click',()=>{pan+=180;placePan()});$('pan-right').addEventListener('click',()=>{pan-=180;placePan()});
  $('scene').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;dragging=true;startX=e.clientX;startPan=pan;});
  window.addEventListener('pointermove',e=>{if(!dragging)return;pan=startPan+e.clientX-startX;placePan()});
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);window.addEventListener('resize',placePan);
  window.MidnightScene={character,decoration,preview,slots,render,showArea,showItem,preparePlacement,isPlacing:()=>performance.now()<placingUntil};
})();
