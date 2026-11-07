/* Original portrait atlas and a small articulated scene; game rules live in engine.js. */
(() => {
  const $ = id => document.getElementById(id);
  const mouths = [29,27,28,29,29,29,29];
  const art = {
    lantern: '<path d="M40 0v18" stroke="#433021" stroke-width="3"/><rect x="15" y="18" width="50" height="68" rx="19" fill="#e4a752"/><path d="M18 36h44M16 48h48M18 62h44M26 20v64m27-64v64" stroke="#f9d398" opacity=".6"/><rect x="26" y="84" width="28" height="5" fill="#5a3923"/>',
    plants: '<path d="M22 65h48l-7 31H29Z" fill="#8d6043"/><path d="M45 70V15" stroke="#576943" stroke-width="4"/><g fill="#698557"><ellipse cx="29" cy="38" rx="18" ry="8" transform="rotate(25 29 38)"/><ellipse cx="60" cy="26" rx="18" ry="8" transform="rotate(-25 60 26)"/><ellipse cx="59" cy="53" rx="18" ry="8" transform="rotate(-25 59 53)"/></g>',
    ceramics: '<path d="M5 75h85v8H5Z" fill="#5e3b27"/><path d="M13 37h23l-3 37H17ZM48 48h38L77 74H56Z" fill="#a8b6a0"/><ellipse cx="24" cy="37" rx="12" ry="5" fill="#d7d6b5"/><path d="M20 12h9v25h-9" fill="#8c7857"/>',
    noren: '<path d="M1 8h98" stroke="#513829" stroke-width="6"/><path d="M6 11h40v69Q24 87 6 80Zm47 0h40v69q-20 7-40 0" fill="#304e5b"/><text x="51" y="49" text-anchor="middle" fill="#e0d2ad" font-family="serif" font-size="16">夜</text>',
    bonsai: '<path d="M41 72q19-29 7-48" fill="none" stroke="#59452d" stroke-width="7"/><g fill="#4e6843"><ellipse cx="34" cy="29" rx="25" ry="13"/><ellipse cx="64" cy="44" rx="27" ry="13"/></g><path d="M17 74h68l-9 17H26Z" fill="#657b79"/>',
    bench: '<path d="M7 55h86v12H7Z" fill="#8b5c34"/><path d="M17 66v29m65-29v29" stroke="#513c29" stroke-width="7"/><path d="M10 28h81v20H10Z" fill="#966a42"/>',
    shelves: '<rect x="6" y="5" width="88" height="93" rx="2" fill="#573d2b"/><path d="M13 12h74v78H13Z" fill="#3c3125"/><path d="M10 43h80m-80 30h80" stroke="#956a40" stroke-width="6"/><g fill="#d0bea0"><path d="M20 22h20l-3 16H23Zm31 1h22l-4 15H55ZM21 51h18v17H21Zm29 0h30l-5 18H56Z"/></g>',
    sign: '<path d="M50 0v12" stroke="#3b2c1e" stroke-width="4"/><rect x="13" y="12" width="74" height="78" rx="5" fill="#d7b474" stroke="#5d3e24" stroke-width="5"/><text x="50" y="46" text-anchor="middle" fill="#463a2b" font-family="serif" font-size="18">夜の</text><text x="50" y="71" text-anchor="middle" fill="#463a2b" font-family="serif" font-size="18">台所</text>',
  };
  const locations = {lantern:[53,5,8],plants:[22,67,10],ceramics:[25,32,11],noren:[54,22,19],bonsai:[80,53,9],bench:[62,74,20],shelves:[86,23,12],sign:[76,23,12]};
  let area = 'inside', pan = 0, dragging = false, startX = 0, startPan = 0, lastBeat = -1;
  let current, selected, cookingNow, ownerUntil = 0, ownerMessage = '';
  function decoration(id) {return `<svg viewBox="0 0 100 100" role="img" aria-label="${MidnightEngine.upgrades[id].name}">${art[id]}</svg>`;}
  function character(person, cls='') {
    const x = person % 4, y = Math.floor(person / 4);
    return `<span class="actor ${cls}" style="--sprite-x:${x * 100/3}%;--sprite-y:${y*100}%;--mouth-y:${mouths[person]}%;--skin:${person===2?'#bd8f6f':'#d7a583'}"><span class="actor-body atlas"></span><span class="actor-head atlas"></span><span class="actor-arm atlas"></span><span class="actor-mouth"></span><span class="actor-eyes"></span></span>`;
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
    $('decorations').innerHTML = s.upgrades.filter(id=>MidnightEngine.upgrades[id].area===area).map(id=>{const [x,y,w]=locations[id];return `<div class="placed-decoration decor-${id}" style="left:${x}%;top:${y}%;width:${w}%">${decoration(id)}</div>`}).join('');
    $('owner').hidden = area==='outside';
    $('customers').hidden = area==='outside';
    $('scene-world').classList.toggle('exterior-world',area==='outside');
    const owner=$('owner');
    owner.classList.toggle('cooking',Boolean(cook));
    const g=s.guests.find(g=>g.id===guest);
    owner.style.left = cook ? '31%' : g ? `${[32,50,68][g.seat]}%` : '50%';
    owner.dataset.mood = cook ? 'focused' : s.phase==='end' ? 'happy' : s.guests.some(g=>g.status==='eating' && g.score<60) ? 'concerned' : 'warm';
    owner.querySelector('.owner-caption').textContent = cook ? '정성껏 조리 중' : '주인장';
  }
  function speak(text) {ownerMessage=text;ownerUntil=performance.now()+4200;$('owner-speech').textContent=text;$('owner-speech').hidden=false;$('owner').classList.add('talking');}
  function tick(now) {
    if(!current)return;
    if(now>ownerUntil){$('owner-speech').hidden=true;$('owner').classList.remove('talking');}
    const beat=Math.floor(now/5500);if(beat===lastBeat)return;lastBeat=beat;
    const live=current.guests.filter(g=>g.status!=='left');
    document.querySelectorAll('.customer').forEach(el=>{el.classList.remove('talking');const bubble=el.querySelector('.ambient-line');if(bubble)bubble.hidden=true;});
    if(!live.length){if(!cookingNow && current.phase!=='end'){$('owner').style.left=beat%2?'38%':'59%';if(beat%3===0)speak(current.phase==='prep'?'오늘도 천천히 준비해요.':'어서 와요. 편한 자리에 앉으세요.');}return;}
    const g=live[beat%live.length], el=document.querySelector(`[data-customer="${g.id}"]`);
    if(!el)return;
    el.classList.add('talking');const bubble=el.querySelector('.ambient-line');
    const lines=g.status==='eating'?(g.score>=85?['음… 정말 맛있네요.','다음에도 이 맛이 생각나겠어요.']:g.score>=60?['따뜻하네요. 잘 먹을게요.']:['오늘은 간이 조금 아쉽네요.']):[MidnightEngine.people[g.person].line,'이 시간에 불이 켜져 있어서 다행이에요.'];
    bubble.textContent=lines[beat%lines.length];bubble.hidden=false;
  }
  $('owner').innerHTML = `${character(6)}<span id="owner-speech" class="ambient-line" hidden></span><span class="owner-caption">주인장</span>`;
  $('area-toggle').addEventListener('click',()=>showArea(area==='inside'?'outside':'inside'));
  $('pan-left').addEventListener('click',()=>{pan+=180;placePan()});$('pan-right').addEventListener('click',()=>{pan-=180;placePan()});
  $('scene').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;dragging=true;startX=e.clientX;startPan=pan;});
  window.addEventListener('pointermove',e=>{if(!dragging)return;pan=startPan+e.clientX-startX;placePan()});
  window.addEventListener('pointerup',()=>dragging=false);window.addEventListener('pointercancel',()=>dragging=false);window.addEventListener('resize',placePan);
  window.MidnightScene={character,decoration,render,tick,speak,showArea,showItem};
})();
