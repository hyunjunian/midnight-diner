/* Original portrait atlas and a small articulated scene; game rules live in engine.js. */
(() => {
  const $ = id => document.getElementById(id);
  const props=['lantern','plants','ceramics','noren','bonsai','bench','shelves','sign'];
  // Coordinates match the furniture surfaces in the approved room / doorway images.
  const locations={lantern:[47,0,10],plants:[44,47,23],ceramics:[14,26,14],noren:[62,20,36],bonsai:[65,39,11],bench:[58,52,36],shelves:[72,22,16],sign:[76,17,20]};
  let area = 'inside', pan = 0, dragging = false, startX = 0, startPan = 0, lastBeat = -1;
  let current, selected, cookingNow;
  function decoration(id) {const n=props.indexOf(id);return `<span class="prop-art" role="img" aria-label="${MidnightEngine.upgrades[id].name}" style="--prop-x:${n%4*100/3}%;--prop-y:${Math.floor(n/4)*100}%"></span>`;}
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
  function showItem(id) {
    showArea(MidnightEngine.upgrades[id].area);
    const [x,,w]=locations[id];pan=$('scene-world').offsetWidth*(.5-(x+w/2)/100);placePan();
    document.querySelector(`.decor-${id}`)?.classList.add('new-decoration');
  }
  function render(s, guest, cook) {
    current=s;selected=guest;cookingNow=cook;
    $('decorations').innerHTML = s.upgrades.filter(id=>id!=='lantern'&&MidnightEngine.upgrades[id].area===area).map(id=>{const [x,y,w]=locations[id];return `<div class="placed-decoration decor-${id}" style="left:${x}%;top:${y}%;width:${w}%">${decoration(id)}</div>`}).join('');
    $('customers').hidden=area==='outside';
    $('scene-world').classList.toggle('exterior-world',area==='outside');
    $('scene').classList.toggle('has-lantern',s.upgrades.includes('lantern'));
  }
  $('area-toggle').addEventListener('click',()=>showArea(area==='inside'?'outside':'inside'));
  $('pan-left').addEventListener('click',()=>{pan+=180;placePan()});$('pan-right').addEventListener('click',()=>{pan-=180;placePan()});
  $('scene').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;dragging=true;startX=e.clientX;startPan=pan;});
  window.addEventListener('pointermove',e=>{if(!dragging)return;pan=startPan+e.clientX-startX;placePan()});
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);window.addEventListener('resize',placePan);
  window.MidnightScene={character,decoration,render,showArea,showItem};
})();
