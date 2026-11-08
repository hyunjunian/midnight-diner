/* Original portrait atlas and a small articulated scene; game rules live in engine.js. */
(() => {
  const $ = id => document.getElementById(id);
  // Authored room surfaces, in native scene coordinates: props share the room's perspective.
  const inside=(rect,place,file='room-furnished-v19')=>({rect:rect.map((v,i)=>v/(i%2?1024:1536)*100),place,file});
  const outside=(rect,place)=>({rect,place,file:'exterior-furnished-v19'});
  const slots={
    lantern:inside([721,0,145,236],'가게 중앙의 천장'),
    plants:outside([39,48,22,16],'창 아래 화분 자리'),
    ceramics:inside([150,309,160,123],'왼쪽 기존 선반'),
    noren:outside([64,25,34,15],'출입문 위'),
    bonsai:inside([544,430,250,125],'창가 작업대 왼쪽'),
    bench:outside([21.5,55.2,21,7.4],'창 아래 왼쪽 길가'),
    shelves:inside([1114,297,215,300],'오른쪽 기존 찻장'),
    sign:outside([33,26,18.5,7],'왼쪽 창 위'),
    clock:inside([350,170,105,105],'후드 위의 빈 벽'),
    ikebana:inside([962,438,142,115],'창가 작업대 오른쪽'),
    andon:outside([83,54.5,14,13],'출입문 오른쪽 디딤돌'),
    sudare:inside([935,306,140,90],'오른쪽 창 윗부분'),
    plaque:outside([60.5,39,5.2,4],'문 왼쪽의 좁은 벽'),
    fridge:inside([0,285,149,315],'주방 왼쪽의 기존 냉장고 자리','restaurant-fridge')
  };
  let area='inside',pan=0,dragging=false,startX=0,startPan=0,current,selected,cookingNow,pending=null,placingUntil=0,placementSerial=0;
  function decoration(id){
    const slot=slots[id],[x,y,w,h]=slot.rect;
    return `<span class="surface-upgrade" role="img" aria-label="${MidnightEngine.upgrades[id].name}" style="${id==='plants'?'clip-path:polygon(0 0,100% 0,100% 100%,24% 100%,24% 57%,0 57%);':id==='bench'?'clip-path:polygon(0 0,65% 0,100% 18%,100% 100%,0 100%);':''}background-image:url('./assets/${slot.file}.webp');background-size:${10000/w}% ${10000/h}%;background-position:${x/(100-w)*100}% ${y/(100-h)*100}%">${id==='fridge'?'':`<span class="surface-closed" style="background-image:url('./assets/${MidnightEngine.upgrades[id].area==='inside'?'room':'exterior'}-furnished-closed-v19.webp')"></span>`}</span>`;
  }
  function preview(id){return `<span class="furnishing-art" aria-label="${MidnightEngine.upgrades[id].name}"></span>`;}
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
  function preparePlacement(id){
    ++placementSerial;document.querySelectorAll('.installation-flight,.installation-aura').forEach(el=>el.remove());
    for(const el of document.querySelectorAll('.placement-installing,.placement-shining,.placement-pending'))el.classList.remove('placement-installing','placement-shining','placement-pending');
    pending=id;
  }
  function showItem(id,origin){
    const serial=++placementSerial,u=MidnightEngine.upgrades[id],slot=slots[id];$('scene').classList.add('installation-focus');
    showArea(u.area);const [x,,w]=slot.rect;pan=$('scene-world').offsetWidth*(.5-(x+w/2)/100);placePan();
    const el=document.querySelector(`.decor-${id}`);if(!el)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?650:1900;
    const banner=$('placement-banner');banner.innerHTML=`<b>${u.name}</b><span>${slot.place}에 들여놓아요</span>`;banner.hidden=false;
    placingUntil=performance.now()+4900;
    const flight=document.createElement('div'),aura=document.createElement('div'),n=Object.keys(MidnightEngine.upgrades).indexOf(id),tile=n%8;
    flight.className='installation-flight';flight.setAttribute('aria-hidden','true');flight.innerHTML=`<span class="furnishing-art" style="background-image:url('./assets/furnishings-${Math.floor(n/8)+1}.webp');background-position:${tile%4*100/3}% ${Math.floor(tile/4)*100}%"></span>`;
    aura.className='installation-aura';document.body.append(aura,flight);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(serial!==placementSerial)return;
      const size=Math.min(220,innerWidth*.52),cx=innerWidth/2-size/2,cy=innerHeight*.43-size/2;
      const from=origin||{x:innerWidth/2,y:innerHeight*.65,width:50,height:50};
      Object.assign(flight.style,{width:`${size}px`,height:`${size}px`,left:'0',top:'0',transform:`translate(${cx}px,${cy}px)`});
      flight.dataset.flightPhase='growing';
      const grow=flight.animate(reduced?[{opacity:0},{opacity:1}]:[
        {transform:`translate(${from.x+from.width/2-size/2}px,${from.y+from.height/2-size/2}px) scale(.25)`,opacity:0},
        {transform:`translate(${cx}px,${cy}px) scale(1.06)`,opacity:1,offset:.8},
        {transform:`translate(${cx}px,${cy}px) scale(1)`,opacity:1}
      ],{duration:reduced?180:450,easing:'ease-out',fill:'forwards'});
      grow.onfinish=()=>{flight.dataset.flightPhase='showing';};
      // Measure AFTER camera pan settles; measuring during the pan made items fly offscreen.
      setTimeout(()=>{
        if(serial!==placementSerial)return;
        const target=el.getBoundingClientRect(),targetSize=Math.max(36,Math.min(target.width,target.height)),tx=target.x+target.width/2-size/2,ty=target.y+target.height/2-size/2;
        grow.cancel();flight.dataset.flightPhase='travelling';
        const move=flight.animate(reduced?[{opacity:1},{opacity:0}]:[
          {transform:`translate(${cx}px,${cy}px) scale(1)`,opacity:1},
          {transform:`translate(${tx}px,${ty}px) scale(${targetSize/size})`,opacity:1,offset:.88},
          {transform:`translate(${tx}px,${ty}px) scale(${targetSize/size})`,opacity:0}
        ],{duration:reduced?250:800,easing:'cubic-bezier(.5,0,.5,1)',fill:'forwards'});
        move.onfinish=()=>{flight.remove();aura.remove();};
      },reduced?400:1100);
      setTimeout(()=>{if(serial!==placementSerial)return;pending=null;el.classList.remove('placement-pending');el.classList.add('placement-installing');},Math.max(300,duration-500));
      setTimeout(()=>{if(serial!==placementSerial)return;
        MidnightAudio?.play('place');el.classList.remove('placement-installing');el.classList.add('placement-shining');
        $('scene').classList.toggle('has-lantern',current.upgrades.includes('lantern'));
        const gain=el.querySelector('.placement-gain');gain.textContent=`분위기 +${u.atmosphere}`;
        banner.innerHTML=`<b>${u.name} · 분위기 +${u.atmosphere}점</b><span>${slot.place}에 새 온기가 더해졌어요</span>`;
      },duration);
      setTimeout(()=>{if(serial!==placementSerial)return;el.classList.remove('placement-shining');$('scene').classList.remove('installation-focus');banner.hidden=true;},4900);
    }));
  }
  function render(s,guest,cook){
    current=s;selected=guest;cookingNow=cook;
    const ids=s.upgrades.filter(id=>MidnightEngine.upgrades[id].area===area),root=$('decorations');
    for(const el of [...root.children])if(!ids.includes(el.dataset.decoration))el.remove();
    for(const id of ids){const slot=slots[id],[x,y,w,h]=slot.rect;let el=root.querySelector(`[data-decoration="${id}"]`);
      if(!el){el=document.createElement('div');el.dataset.decoration=id;el.className=`placed-decoration decor-${id}${pending===id?' placement-pending':''}`;el.innerHTML=decoration(id)+'<span class="placement-halo" aria-hidden="true">✦<i>✧</i><em>✦</em></span><span class="placement-gain" role="status"></span>';root.append(el);}
      Object.assign(el.style,{left:`${x}%`,top:`${y}%`,width:`${w}%`,height:`${h}%`,zIndex:area==='outside'?String(Math.round(y+h)):'2'});
    }
    $('customers').hidden=area==='outside';$('scene-world').classList.toggle('exterior-world',area==='outside');$('scene').classList.toggle('has-lantern',s.upgrades.includes('lantern')&&pending!=='lantern');
  }
  $('area-toggle').addEventListener('click',()=>showArea(area==='inside'?'outside':'inside'));
  $('pan-left').addEventListener('click',()=>{pan+=180;placePan()});$('pan-right').addEventListener('click',()=>{pan-=180;placePan()});
  $('scene').addEventListener('pointerdown',e=>{if(performance.now()<placingUntil||e.target.closest('button'))return;dragging=true;startX=e.clientX;startPan=pan;});
  window.addEventListener('pointermove',e=>{if(!dragging)return;pan=startPan+e.clientX-startX;placePan()});
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);window.addEventListener('resize',placePan);
  window.MidnightScene={character,decoration,preview,slots,render,showArea,showItem,preparePlacement,isPlacing:()=>performance.now()<placingUntil};
})();
