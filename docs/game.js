(() => {
  'use strict';
  const E = window.MidnightEngine;
  const KEY = 'midnight-diner-save-v9';
  const $ = id => document.getElementById(id);
  const yen = n => `¥${n.toLocaleString('ja-JP')}`;
  let state, storageAvailable = true, saveMessage = '';
  try { state = E.restore(localStorage.getItem(KEY) || localStorage.getItem('midnight-diner-save-v8') || localStorage.getItem('midnight-diner-save-v7') || localStorage.getItem('midnight-diner-save-v6') || localStorage.getItem('midnight-diner-save-v5') || localStorage.getItem('midnight-diner-save-v4') || localStorage.getItem('midnight-diner-save-v2'), localStorage.getItem('midnight-diner-save-v1')); }
  catch { state = E.fresh(); saveMessage = '저장 정보를 읽지 못해 새 식당을 준비했습니다.'; }
  let selectedGuest=null,tab='pantry',talkIndex=0,cashAnimation=null;
  const Kitchen=window.MidnightKitchen;
  let menuFilter='all',menuQuery='';
  const seenCustomers = new Set();
  let toastTimer, raf, lastFrame = 0, openingUntil=0;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? '진행 상황이 이 기기에 자동 저장됩니다.' : '저장을 사용할 수 없습니다. 창을 닫으면 진행이 사라져요.';
  }
  function toast(message) {
    $('toast').textContent = message; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4200);
  }
  const Scene = window.MidnightScene;
  const signed = n => `${n >= 0 ? '+' : ''}${n}`;
  function portrait(p, i) { return Scene.character(i); }
  const basicFood=['rice','nori','egg','dashi','pork','miso','salmon'];
  function food(id,eaten=false){const item=E.ingredients[id]||E.recipes[id];let file,index,rows;
    if(E.recipes[id]){file=`${eaten?'used-menu':'menu'}-${item.sheet}`;index=item.art;rows=3;}
    else{const n=Object.keys(E.ingredients).indexOf(id);file=`stock-anime-${Math.floor(n/12)+1}`;index=n%12;rows=3;}
    return `<span class="food-art" role="img" aria-label="${item.name}" data-food="${id}" style="--food-file:url('./assets/${file}.webp');--food-rows:${rows*100}%;--food-x:${index%4*100/3}%;--food-y:${Math.floor(index/4)*100/(rows-1)}%;--food-ratio:${E.recipes[id]?'3/4':'1'}"></span>`;
  }
  function levelNote(level) {
    const l = E.levels[level - 1];
    return `Lv.${level} · 누적 ${l.xp}점 / 평판 ${l.reputation} / 만족도 ${l.satisfaction}`;
  }
  function renderReport() {
    const r=E.report(state);
    $('report-content').innerHTML = `<div class="report-heading"><span>第 ${state.night} 夜</span><h3>오늘도 아홉 그릇의 이야기</h3><p>3사이클 · ${state.nightScores.length}명 대접 · 평균 만족도 ${r.average}점</p></div><div class="report-level">${r.level>r.previousLevel?'✦ LEVEL UP':'오늘의 성장'}<strong>Lv.${r.level} · ${E.levels[r.level-1].name}</strong>${r.level>r.previousLevel?`<small>Lv.${r.previousLevel} → Lv.${r.level}</small>`:''}</div><dl class="report-stats"><div><dt>골목의 평판</dt><dd>${r.reputation} / 100 <em>${signed(r.reputationDelta)}</em></dd></div><div><dt>누적 고객 만족도</dt><dd>${r.satisfaction} / 100 <em>${signed(r.satisfactionDelta)}</em></dd></div><div><dt>오늘 매출 <small>팁 ${yen(r.tips)} 포함</small></dt><dd>${yen(r.revenue)}</dd></div><div><dt>이야기의 답례</dt><dd>${yen(r.storyIncome)}</dd></div><div><dt>이야기에 보탠 비용</dt><dd>−${yen(r.storyCosts)}</dd></div><div><dt>영업비 <small>임대·가스·전기</small></dt><dd>−${yen(r.expenses)}</dd></div><div><dt>총 보유 자금</dt><dd>${yen(r.money)} <em>순증감 ${signed(r.net)}엔</em></dd></div><div><dt>총 성장 점수</dt><dd>${r.xp}점 <em>${signed(r.xpDelta)}</em></dd></div></dl><section class="report-unlocks"><h4>${r.level>r.previousLevel?'이번 밤에 열린 것들':'다음 목표'}</h4>${r.menus.length?`<p>지금 조리할 수 있게 된 메뉴: ${r.menus.join(' · ')}</p>`:''}${r.items.length?`<p>새로 살 수 있는 장식: ${r.items.join(' · ')}</p>`:''}${r.next?`<p>Lv.${r.next.level}까지 성장 점수 <b>${r.remaining}점</b><br>조건: 평판 ${r.next.reputation} / 만족도 ${r.next.satisfaction}도 달성해 주세요.</p>`:'<p>최고 레벨을 달성했어요. 나만의 가게를 계속 꾸며 보세요.</p>'}<small>새 메뉴는 바로 조리할 수 있어요. 새 장식은 가게 꾸미기에서 들여놓을 수 있어요.</small></section>${r.level>r.previousLevel&&r.previousLevel<34?`<section class="earned-gallery"><h4>이번 밤에 열린 메뉴</h4>${Array.from({length:Math.min(r.level,34)-r.previousLevel},(_,i)=>rewardGallery(r.previousLevel+i+1)).join('')}</section>`:''}${upcoming()}<button id="report-next" class="primary cook-button">다음 밤 준비 <span>→</span></button>`;
  }
  function renderScene() {
    const visible = state.guests.filter(g => g.status !== 'left');
    const liveIds = new Set(visible.map(g=>String(g.id)));
    for (const el of [...$('customers').children]) if(!liveIds.has(el.dataset.customer)) el.remove();
    for (const g of visible) {
      const p=E.person(g.person), r=E.recipes[g.recipe], key=`${state.night}-${g.id}`;
      let el=$('customers').querySelector(`[data-customer="${g.id}"]`);
      // Keep each decoded character and its animation alive across inventory/HUD updates.
      if(el && el.dataset.person!==String(g.person)){el.remove();el=null;}
      if(!el){
        el=document.createElement('div');el.dataset.customer=g.id;el.dataset.person=g.person;
        el.className=`customer seat-${g.seat}${seenCustomers.has(key)?'':' arriving'}`;seenCustomers.add(key);
        el.innerHTML=`<button class="customer-avatar" data-guest="${g.id}" aria-label="${p.name} 님과 대화하기">${portrait(p,g.person)}</button><button class="customer-name" data-guest="${g.id}"></button><span class="wait-meter" aria-hidden="true"><i></i></span><div class="served-dish" hidden></div><button class="customer-payment" hidden></button><span class="dining-chopsticks" hidden></span>`;
        el.addEventListener('animationend',e=>{if(e.animationName==='counter-arrival')el.classList.remove('arriving')});
        $('customers').append(el);
      }
      el.classList.toggle('selected',g.id===selectedGuest);
      el.classList.toggle('pleased',g.status==='eating' && g.score>=80);
      el.classList.toggle('disappointed',g.status==='eating' && g.score<60);
      el.querySelector('.customer-avatar').disabled=false;el.classList.toggle('dining',g.status==='eating');
      const status={seated:'대화하기',waiting:'주문 접수',eating:'식사 중',paying:'계산할게요',farewell:'배웅하기'};
      el.querySelector('.customer-name').textContent=`${p.name}${E.regular(state,g.person)?' · 단골':''} · ${status[g.status]}`;
      const served=el.querySelector('.served-dish'),hasDish=['eating','paying','farewell'].includes(g.status);served.hidden=!hasDish;
      if(hasDish&&served.dataset.recipe!==g.recipe){served.innerHTML=food(g.recipe)+'<span class="dish-steam"></span><span class="eaten-dish">'+food(g.recipe,true)+'</span>';served.dataset.recipe=g.recipe;served.classList.add('dish-arriving');}
      served.classList.toggle('finished-meal',g.status!=='eating');
      el.querySelector('.dining-chopsticks').hidden=g.status!=='eating';const payment=el.querySelector('.customer-payment');payment.hidden=g.status!=='paying';payment.dataset.pay=g.id;
      if(g.status==='paying')payment.innerHTML=`<b>${yen(g.bill.total)}</b><span class="five-stars" aria-label="만족도 ${g.score}점, 5점 만점에 ${(g.score/20).toFixed(1)}점"><i style="width:${g.score}%">★★★★★</i><em>★★★★★</em></span><small>${(g.score/20).toFixed(1)} / 5 · 눌러 수금</small>`;
      el.querySelector('.wait-meter').hidden=g.status!=='waiting';
      const patience=E.patience(g);el.querySelector('.wait-meter i').style.width=`${patience*100}%`;el.classList.toggle('waiting-long',patience<.3);
    }
    $('scene').classList.toggle('is-prep',state.phase==='prep');
    Scene.render(state,selectedGuest,!!state.kitchen);$('resume-kitchen').hidden=!state.kitchen;
  }
  const smallTalk=[
    '마감 원고를 드디어 보냈어요. 화면만 보다가 나오니 밤공기가 참 좋네요.',
    '오늘은 꽃이 다 팔렸어요. 빈 가게를 보니 뿌듯하기도 하고 조금 허전하기도 하네요.',
    '마지막 버스에 탄 손님이 꾸벅 인사하고 내리더라고요. 그 인사가 자꾸 생각나요.',
    '비 오는 골목 사진을 찍다가 불빛이 참 예뻐서 들어왔어요.',
    '내일 아침 빵 반죽은 다 해 뒀어요. 지금은 남이 차려 주는 밥이 먹고 싶네요.',
    '지도에는 없는 골목인데 좋은 가게를 찾은 것 같아요.',
    '예전에 가르치던 학생한테 편지가 왔어요. 덕분에 오래전 생각이 났네요.',
    '오늘 연습이 좀 힘들었어요. 그래도 끝까지 해냈으니 든든하게 먹으려고요.',
    '오래 입은 코트를 고쳐 드렸더니 새 옷처럼 좋아하시더라고요.',
    '공사가 생각보다 늦게 끝났네요. 불이 켜져 있어서 얼마나 반갑던지요.',
    '다른 분들 식사만 챙기다 보니 제 밥은 이제야 먹네요.',
    '마지막 곡을 연주하는데 관객 한 분이 끝까지 남아 계셨어요.',
    '공연 의상을 다 정리했어요. 오늘 배우들 표정이 참 좋았답니다.',
    '하루 종일 작은 글씨만 봤더니 눈이 피곤하네요. 여기서는 좀 쉬고 갈게요.',
    '그림이 마음대로 안 풀렸는데, 이 가게 색을 보니까 또 그리고 싶어져요.',
    '이 나무 카운터, 오래 잘 돌보셨네요. 손이 많이 갔겠어요.',
    '오늘은 사람을 너무 많이 만났어요. 밥 먹을 땐 조용히 쉬어도 괜찮죠?',
    '제 가게 불을 끄고 왔어요. 오늘은 다른 분이 만든 밥이 궁금하네요.',
    '차를 한 잔씩 나누다 보면 처음 만난 사람도 가까워지더라고요.',
    '고장 난 자전거가 다시 달리는 걸 보면 괜히 제가 신이 나요.',
    '마지막 정비를 끝내고 손을 몇 번이나 씻었는지 몰라요. 이제 밥 먹을 준비 됐어요.',
    '오늘 배달을 다 끝냈어요. 이제 제 밥 한 그릇만 잘 도착하면 되겠네요.',
    '반납된 책에 예쁜 책갈피가 남아 있었어요. 주인이 찾으러 오셨으면 좋겠네요.',
    '오늘 들어온 책들을 다 정리했어요. 책 냄새 대신 밥 냄새가 필요한 시간이에요.'
  ];
  const thanksHigh=['정말 맛있었어요. 이 한 끼 덕분에 오늘 하루가 좋아졌네요.','마지막 한 입까지 아껴 먹었어요. 정성이 느껴지는 밥이네요.','배도 마음도 든든해졌어요. 늦은 시간에 이런 밥을 만나서 참 다행이에요.','이 맛을 기억해 둘래요. 오늘은 좋은 밤으로 남겠네요.','오길 잘했어요. 누군가 차려 준 밥이 이렇게 힘이 되네요.','젓가락을 내려놓기가 아쉬웠어요. 맛있게 잘 먹었습니다.'];
  const thanksMid=['따뜻한 한 끼, 잘 먹었습니다. 한숨 돌리고 가요.','든든하게 먹었네요. 늦게까지 열어 주셔서 고마워요.','오늘 밥도 잘 먹었습니다. 잠깐 쉬었다 가니 좋네요.','배가 부르니 이제 좀 살 것 같네요. 고맙습니다.'];
  const thanksLow=['잘 먹었습니다. 다음에는 익힘을 조금 더 신경 써 주시면 좋겠어요.','오늘은 제 입맛과 조금 달랐네요. 다음 한 끼는 더 기대해 볼게요.','수고하셨어요. 조금 더 촉촉했으면 좋았을 것 같아요.'];
  const goodbyes=['이 골목을 지날 때 또 들를게요. 다음에도 잘 부탁드려요.','편안한 밤 보내세요. 가게 불빛을 기억해 둘게요.','잘 쉬었다 갑니다. 다음에 또 인사드릴게요.','밖에 비가 좀 잦아들었네요. 이제 천천히 걸어가 볼게요.','오늘은 푹 잘 수 있겠어요. 주인장도 잘 쉬세요.','다음에는 누군가와 함께 오고 싶네요. 고맙습니다.'];
  function talkLines(g){
    const p=E.person(g.person);
    if(g.status==='farewell'){const comments=g.score>=90?thanksHigh:g.score>=65?thanksMid:thanksLow;return[comments[g.lineKey%comments.length],goodbyes[(g.lineKey+state.night)%goodbyes.length]];}
    if(g.status==='paying')return['잘 먹었습니다. 계산 부탁드릴게요.',`음식값과 팁을 합쳐 ${yen(g.bill.total)}이네요. 감사합니다.`];
    if(g.status==='eating')return['따뜻할 때 천천히 먹고 갈게요. 잠깐만 기다려 주세요.'];
    if(g.status==='waiting')return[`${E.recipes[g.recipe].name}, 잘 부탁드릴게요. 따뜻하게 기다리고 있을게요.`];
    const line=E.dialogue(g),cut=line.indexOf('.');return[line.slice(0,cut+1),smallTalk[g.person%smallTalk.length],line.slice(cut+1).trim()];
  }
  function renderTalk(){
    if(!$('guest-dialog').open)return;const g=state.guests.find(g=>g.id===selectedGuest&&g.status!=='left');if(!g){$('guest-dialog').close();return;}
    const p=E.person(g.person),lines=talkLines(g),last=talkIndex>=lines.length-1,other=state.kitchen&&state.kitchen.guest!==g.id;
    let action='다음 이야기 →';if(last)action=g.status==='paying'?'계산 받기 →':g.status==='farewell'?'인사하고 배웅하기 →':g.status==='eating'?'천천히 드세요 →':other?'진행 중인 요리를 먼저 마무리해 주세요':'부엌에 가서 조리 시작 →';
    // Keep the portrait's mesh alive as the conversation advances.
    if($('guest-dialog').dataset.person!==String(g.person)){$('talk-portrait').innerHTML=portrait(p,g.person);$('guest-dialog').dataset.person=g.person;}
    $('talk-name').innerHTML=`${p.name} ${E.regular(state,g.person)?'<small>단골</small>':''}`;
    $('talk-profile').textContent=`${p.role} · ${p.age} · ${p.style}`;$('talk-regular').textContent='만족도 90 이상이면 단골로 재방문할 확률이 올라가요!';
    $('talk-line').textContent=lines[Math.min(talkIndex,lines.length-1)];$('talk-progress').textContent=`${Math.min(talkIndex+1,lines.length)} / ${lines.length}`;
    $('talk-next').textContent=action;$('talk-next').disabled=last&&other&&!['eating','farewell','paying'].includes(g.status);
    $('talk-order').hidden=!last||['eating','farewell','paying'].includes(g.status);$('talk-order').innerHTML=`${food(g.recipe)}<span>${E.recipes[g.recipe].name}<small>${E.recipes[g.recipe].ingredients.map(id=>E.ingredients[id].name).join(' · ')}</small></span>`;
    $('talk-gift').hidden=!E.regular(state,g.person)||!['seated','waiting'].includes(g.status);$('talk-gift').disabled=g.gifted||!state.inventory.egg;$('talk-gift').textContent=g.gifted?'✓ 달걀 곁들임을 서비스했어요':'단골 서비스 · 달걀 곁들임 1개';
  }
  function openTalk(id){selectedGuest=id;talkIndex=0;openSheet('guest-dialog');renderTalk();renderScene();}
  function animateCash(rect,bill,before){
    cashAnimation={from:before,to:state.money,start:performance.now()};
    const target=$('money').getBoundingClientRect(),dx=target.x+target.width/2-rect.x-rect.width/2,dy=target.y+target.height/2-rect.y;
    for(let i=0;i<3;i++){const note=document.createElement('div');note.className='cash-flight';note.textContent=i===0?`¥${bill.total.toLocaleString()}`:'¥';Object.assign(note.style,{left:`${rect.x+rect.width/2-38+i*5}px`,top:`${rect.y+i*6}px`});document.body.append(note);const a=note.animate([{transform:'translate(0,0) rotate(-8deg)',opacity:1},{transform:`translate(${dx*.4}px,${dy*.4-60}px) rotate(8deg) scale(.9)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.22)`,opacity:0}],{duration:950,delay:i*80,easing:'cubic-bezier(.25,.5,.35,1)',fill:'forwards'});a.onfinish=()=>note.remove();}
    $('money').classList.add('money-receiving');setTimeout(()=>$('money').classList.remove('money-receiving'),1400);
  }
  function rewardGallery(level){return `<div class="reward-foods">${Object.entries(E.recipes).filter(([,r])=>r.level===level).map(([id,r])=>`<div>${food(id)}<small>${r.name}</small></div>`).join('')}</div>`;}
  function upcoming(){const next=state.level+1;if(state.level>=34)return '<p class="management-note">가게의 마지막 목표까지 이루었어요. 백 가지 음식으로 나만의 밤을 이어 가세요.</p>';
    const items=Object.entries(E.upgrades).filter(([,u])=>u.level===next);
    return `<section class="upcoming"><span class="eyebrow">NEXT CHAPTER</span><h3>다음 레벨의 새로운 한 끼 · Lv.${next}</h3><p>${levelNote(next)}</p>${rewardGallery(next)}<div class="unlock-decor-grid">${items.map(([id,u])=>`<article><b>${u.name}</b>${Scene.preview(id)}<p>${u.description}</p><details class="item-preview"><summary>어디에 놓이는지 보기</summary>${Scene.preview(id)}</details><small>Lv.${u.level} · ${yen(u.price)}</small></article>`).join('')}</div></section>`;
  }
  function renderStory(){
    const view=E.story(state),news=E.news(state),history=state.storyMemory.slice(-5).reverse();
    $('story-tag').textContent=state.event==='pending'?'주인장의 선택 · 이어지는 이야기':'골목에 남은 기억';
    $('story-title').textContent=view?view.definition.title:'다음 밤에 도착한 소식';
    const memories=`<section class="story-journal"><h4>가게의 작은 수첩</h4>${history.length?history.map(t=>{const st=E.storyContent.stories.find(x=>x.id===t.id),c=st.choices.find(x=>x.id===t.choice);return `<details><summary>${t.night}번째 밤 · ${st.title}</summary><p>${c.result}</p></details>`}).join(''):'<p>손님 둘이 모이면 오늘 밤의 이야기가 시작돼요.</p>'}</section>`;
    const followups=news.length?`<div class="story-followups">${news.map(n=>`<p>✉ ${n.text}</p>`).join('')}</div>`:'';
    if(!view){$('story-content').innerHTML=followups+memories;return;}
    const {run,definition,choice,reflection}=view,cast=run.cast.map(id=>E.person(id));
    const text=t=>t.replaceAll('{a}',cast[0].name).replaceAll('{b}',cast[1].name);
    const faces=`<div class="story-cast-strip">${run.cast.map(id=>`<div class="story-cast-chip"><span class="story-mini-face">${portrait(E.person(id),id)}</span><span><b>${E.person(id).name}</b><small>${E.person(id).role}</small></span></div>`).join('')}</div>`;
    const dialogue=`<div class="story-chat" aria-label="손님들의 대화">${definition.lines.map((line,i)=>{
      const actor=line.startsWith('{b}')?1:line.startsWith('{a}')?0:i%2,id=run.cast[actor],p=cast[actor],words=text(line).replace(new RegExp('^'+p.name+'[：:]\\s*'),'');
      return `<article class="story-message ${actor?'from-right':''}"><div class="story-chat-face" aria-label="${p.name}">${portrait(p,id)}</div><div class="story-message-body"><b>${p.name}</b><p>${words}</p></div></article>`;
    }).join('')}</div>`;
    const prompt=(n,title)=>`<div class="story-choice-heading"><span>${n} / 2 · 당신의 선택</span><h3>${title}</h3><p>마음이 가는 행동 하나를 골라 주세요.</p></div>`;
    if(run.step===0){
      $('story-content').innerHTML=followups+faces+`<div class="story-scene"><span>오늘 밤, 카운터에서</span><p>${definition.intro}</p></div>`+dialogue+`<button class="story-answer-jump" data-story-jump>내가 할 일 고르기 · ${definition.choices.length}가지 선택 ↓</button><section id="story-decision">`+prompt(1,'주인장인 당신은 어떻게 할까요?')+`<div class="story-choices">${definition.choices.map((c,i)=>{
        const available=E.canChoose(state,c),cost=[c.money<0?`${yen(-c.money)} 사용`:'',...Object.entries(c.ingredients||{}).map(([id,n])=>`${E.ingredients[id].name} ${n}개`)].filter(Boolean).join(' · ');
        return `<button class="story-choice-card" data-choice="${c.id}" ${available?'':'disabled'}><span class="choice-number">${available?String(i+1).padStart(2,'0'):'잠김'}</span><span class="choice-copy"><b>${c.label}</b><small>${available?cost||'부담 없이 이야기를 나눠요':`${cost} 필요 · 냉장고에서 준비해 주세요`}</small></span><span class="choice-arrow" aria-hidden="true">${available?'→':'◇'}</span></button>`;
      }).join('')}</div></section>`;return;
    }
    if(run.step===1){$('story-content').innerHTML=faces+`<div class="story-result"><span>당신의 마음이 닿았어요</span><p>${choice.result}</p></div>`+prompt(2,'이 밤을 어떻게 남길까요?')+`<div class="story-choices">${E.storyContent.reflection.map((c,i)=>`<button class="story-choice-card" data-choice="${c.id}"><span class="choice-number">0${i+1}</span><span class="choice-copy"><b>${c.label}</b><small>${i?'다음 만남을 약속해요':'오늘의 기억을 간직해요'}</small></span><span class="choice-arrow" aria-hidden="true">→</span></button>`).join('')}</div>`;return;}
    $('story-content').innerHTML=followups+faces+`<div class="story-result"><span>오늘 밤의 이야기</span><p>${choice?.result||'오늘 손님들과 나눈 이야기가 가게의 기억으로 남았어요.'}</p></div><p class="story-memory">${reflection?.text||''}</p><p class="story-next">다음 영업일에 이 선택의 소식이 도착해요.</p><button class="story-finish primary" data-close="story-dialog">이 온기를 안고 가게로 돌아가기 →</button>`+memories;
  }

  function renderManagement() {
    const rescue = E.rescueNeeds(state) ? '<div class="rescue-box"><span>재료 살 돈이 부족한가요? 이웃 상인이 이번 주문에 필요한 재료를 나눠 줘요.</span><button data-rescue="true">도움받기 · 평판 −3</button></div>' : '';
    document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-pressed', String(b.dataset.tab === tab)); });
    $('management-title').textContent = { pantry: '냉장고', menu: '메뉴 수첩', shop: '가게 꾸미기' }[tab];
    if (tab === 'pantry') {
      $('management-content').innerHTML = `${rescue}<p class="management-note">한 봉지씩, 필요한 만큼. 영업 중에도 재료를 주문할 수 있어요. <span>현재 재료 ${Object.values(state.inventory).reduce((a, b) => a + b, 0)}개</span></p><div class="stock-grid">${Object.entries(E.ingredients).map(([id, item]) => `<article class="stock-card ${E.ingredientAvailable(state,id)?'':'ingredient-locked'}"><span class="stock-icon">${food(id)}</span><div><h3>${item.name}</h3><span>냉장고에 <b>${state.inventory[id]}개</b></span></div><button data-buy="${id}" ${!E.ingredientAvailable(state,id)||state.money < E.buyPrice(state,id)||state.inventory[id]>=999 ? 'disabled' : ''} aria-label="${E.ingredientAvailable(state,id)?`${item.name} 1개 ${E.buyPrice(state,id)}엔에 구매`:`${item.name} 레벨 ${item.level}에 해제`}">${E.ingredientAvailable(state,id)?`+1 <small>${yen(E.buyPrice(state,id))}</small>`:`Lv.${item.level} 해제`}</button></article>`).join('')}</div>`;
    } else if(tab==='menu'){
      const entries=Object.entries(E.recipes),matches=entries.filter(([,r])=>(menuFilter==='all'||menuFilter==='available'&&r.level<=state.level||Number(menuFilter)===r.level)&&(!menuQuery||r.name.includes(menuQuery)));
      $('management-content').innerHTML=`<p class="management-note">레벨마다 새 메뉴 3개 · 전체 100종 · 지금 ${entries.filter(([,r])=>r.level<=state.level).length}개를 만들 수 있어요.<span>오늘의 추천: ${E.recipes[state.special].name}</span></p><div class="menu-filters"><button data-menu-filter="all" class="${menuFilter==='all'?'active':''}">전체 100</button><button data-menu-filter="available" class="${menuFilter==='available'?'active':''}">지금 가능</button>${Array.from({length:34},(_,i)=>`<button data-menu-filter="${i+1}" class="${menuFilter===String(i+1)?'active':''}">Lv.${i+1}</button>`).join('')}</div><input id="menu-search" type="search" aria-label="음식 이름 찾기" placeholder="먹고 싶은 음식 찾기" value="${menuQuery.replaceAll('&','&amp;').replaceAll('"','&quot;')}"><div class="menu-grid">${matches.map(([id,r])=>{const open=r.level<=state.level;return `<article class="menu-card ${open?'available':'locked'}"><div class="menu-picture">${food(id)}${open?'':`<span class="menu-lock">Lv.${r.level}에 해제</span>`}</div><small>LEVEL ${r.level}</small><h3>${r.name}</h3><p>${r.ingredients.map(id=>E.ingredients[id].name).join(' · ')}</p><span class="menu-price">${yen(r.price)}부터</span>${open?`<button data-special="${id}" ${state.special===id||state.phase==='open'?'disabled':''}>${state.special===id?'✓ 오늘의 추천':state.phase==='open'?'다음 영업 전에 추천 변경':'오늘의 추천으로 정하기'}</button>`:`<button disabled aria-label="${r.name} 레벨 ${r.level}에 해제">Lv.${r.level} 도달 시 바로 조리 가능</button>`}</article>`}).join('')}</div>${upcoming()}`;
    } else {
      $('management-content').innerHTML = `<p class="management-note">익숙한 자리에, 나다운 온기를 더해요. 구매한 장식은 식당에 바로 나타나요.</p><div class="upgrade-grid">${Object.entries(E.upgrades).map(([id, u]) => `<article class="upgrade-card ${state.level<u.level?'locked':''}"><span class="decor-thumbnail">${Scene.decoration(id)}</span><div><h3>${u.name}</h3><p>${u.description}</p><details class="item-preview"><summary>어디에 놓이는지 보기</summary>${Scene.preview(id)}</details><small>${u.area==='inside'?'매장 안':'매장 밖'} · ${levelNote(u.level)}</small></div><button data-upgrade="${id}" ${state.upgrades.includes(id) || state.money < u.price || state.level < u.level ? 'disabled' : ''}>${state.upgrades.includes(id) ? '✓ 배치 완료' : state.level<u.level ? `🔒 Lv.${u.level}에 해제` : `${yen(u.price)} · 들여놓기`}</button></article>`).join('')}</div>`;
    }
  }
  function renderStockPrep(){
    const panel=$('stock-prep');panel.hidden=state.phase!=='prep';if(panel.hidden)return;
    const full=E.stockPlan(state,9),small=E.stockPlan(state,3);
    panel.innerHTML=`<div class="stock-prep-heading"><span>오늘의 영업 준비</span><h3>${full.units?'단골이 오기 전에, 냉장고부터':'냉장고 준비가 끝났어요'}</h3><p>현재 메뉴와 예상 주문을 바탕으로 ${full.meals}끼를 준비해요. 부족한 만큼만 한 번에 채울 수 있어요.</p></div><div class="stock-prep-list">${full.lines.map(x=>`<span class="${x.quantity?'stock-short':'stock-ready'}">${food(x.id)}<b>${E.ingredients[x.id].name}</b><small>${x.owned} / ${x.target}개 ${x.quantity?`· +${x.quantity} 필요`:'· 준비됨'}</small></span>`).join('')}</div><button class="primary stock-bulk-main" data-restock="9" ${!full.units||state.money<full.cost?'disabled':''}>${full.units?`${full.meals}끼 재료 한 번에 채우기 · ${yen(full.cost)}`:'✓ 오늘 밤의 기본 재료 준비 완료'}</button>${small.units?`<button class="stock-bulk-small" data-restock="3" ${state.money<small.cost?'disabled':''}>먼저 ${small.meals}끼만 준비 · ${yen(small.cost)}</button>`:''}${state.money<full.cost&&full.units?'<small class="stock-budget-note">자금이 부족하면 먼저 3끼를 준비하고 영업 수익으로 더 채워 주세요.</small>':''}`;
  }
  function render() {
    $('money').textContent=yen(cashAnimation?Math.round(cashAnimation.from):state.money);
    $('reputation').innerHTML = `${state.reputation} <small>/ 100</small>`;
    $('day').textContent = `${state.night}번째 밤`;
    $('open-status').textContent = state.phase === 'prep' ? '영업 준비' : state.phase === 'end' ? '오늘 영업 끝' : '영업 중';
    $('clock').textContent = state.phase === 'prep' ? '23:50' : state.phase === 'end' ? '07:00' : `${String(Math.min(6, Math.floor(state.nightScores.length / state.target * 7))).padStart(2, '0')}:30`;
    const canClose = E.canClose(state);
    $('night-action').disabled = state.phase === 'open' && !canClose;
    $('night-action').innerHTML = state.phase === 'prep' ? '식당 불 켜기 <span>↗</span>' : state.phase === 'end' ? '오늘의 영업보고 <span>→</span>' : canClose ? '밤 마무리하기 · 영업보고 <span>☾</span>' : `${Math.min(3,Math.floor(state.nightScores.length/3)+1)} / 3사이클 · ${state.nightScores.length} / ${state.target}끼`;
    $('service-hint').textContent = state.phase === 'prep' ? (E.stockPlan(state,3).units?'아래 재료 준비를 먼저 확인해 주세요.':'재료가 준비됐어요. 식당 불을 켜고 손님을 맞이해요.') : state.phase === 'end' ? '재료를 채워 두면 다음 밤이 더 든든해져요.' : canClose ? '9명의 손님을 대접했어요! 아래 밤 마무리하기를 눌러 영업보고를 확인하세요.' : state.event === 'pending' ? '손님들의 이야기가 이어지고 있어요. 반짝이는 이야기 버튼을 눌러 답해 주세요.' : state.guests.some(g=>g.status==='paying')?'식사를 마친 손님의 별점 위 금액을 눌러 결제해 주세요.':'손님을 눌러 대화하고 주문을 받아 주세요.';
    $('night-action').classList.toggle('close-ready',canClose);
    const nextLevel=E.levels.find(l=>l.level>state.level);
    $('progress-hud').innerHTML=`<b>Lv.${state.level}</b><span>만족도 ${E.satisfaction(state)} · 성장 ${state.xp}${nextLevel?` / ${nextLevel.xp}`:' · MAX'}</span><progress value="${nextLevel?Math.min(state.xp,nextLevel.xp):1}" max="${nextLevel?.xp||1}"></progress>`;
    renderStockPrep();renderScene();renderTalk();renderStory();renderManagement();save();
    $('story-badge').hidden=state.event!=='pending'&&!state.nightNews.length;
    if (state.phase==='end') renderReport();
    maybeStory();
  }
  function tryArrival() {
    if (performance.now()<openingUntil || $('app').hidden || $('intro').open || document.hidden || $('settings-dialog').open || $('reset-dialog').open) return;
    const g = E.arrive(state);
    if (g) { E.conversation(state); render(); }
  }
  function resetTransient(){selectedGuest=null;talkIndex=0;Kitchen.hide();}
  $('stock-prep').addEventListener('click',event=>{const button=event.target.closest('[data-restock]');if(!button||button.disabled)return;const result=E.restock(state,Number(button.dataset.restock));if(result){render();toast(`${result.units}개 재료를 냉장고에 채웠어요. 오늘 밤 준비가 든든해졌네요.`);}});
  $('night-action').addEventListener('click', () => {
    if (state.phase === 'prep') { E.open(state); openingUntil=performance.now()+1400;resetTransient(); Scene.showArea('inside'); render(); setTimeout(tryArrival,1450); }
    else if (E.canClose(state)) { E.close(state); resetTransient(); render(); openSheet('report-dialog'); }
    else if (state.phase === 'end') { renderReport(); openSheet('report-dialog'); }
  });
  $('customers').addEventListener('click',event=>{
    const pay=event.target.closest('[data-pay]');if(pay){const before=state.money,rect=pay.getBoundingClientRect(),bill=E.collect(state,Number(pay.dataset.pay));if(bill){animateCash(rect,bill,before);render();openTalk(Number(pay.dataset.pay));}return;}
    const button=event.target.closest('[data-guest]');if(!button)return;const g=state.guests.find(g=>g.id===Number(button.dataset.guest));if(!g)return;
    if(g.status==='paying'){const payment=document.querySelector(`[data-pay="${g.id}"]`);payment?.click();return;}openTalk(g.id);
  });
  $('talk-next').addEventListener('click',()=>{
    const g=state.guests.find(g=>g.id===selectedGuest);if(!g)return;const lines=talkLines(g);if(talkIndex<lines.length-1){talkIndex++;renderTalk();return;}
    if(g.status==='paying'){const before=state.money,rect=$('talk-next').getBoundingClientRect(),bill=E.collect(state,g.id);if(bill){animateCash(rect,bill,before);talkIndex=0;render();}return;}
    if(g.status==='farewell'){E.depart(state,g.id);$('guest-dialog').close();selectedGuest=null;render();if(state.arrived%3===0&&state.guests.every(g=>g.status==='left'))tryArrival();return;}
    if(g.status==='eating'){$('guest-dialog').close();return;}
    if(g.status==='seated')E.acceptOrder(state,g.id);
    if(E.beginCooking(state,g.id)){$('guest-dialog').close();Kitchen.show();render();}
  });
  $('talk-gift').addEventListener('click',()=>{if(E.gift(state,selectedGuest)){render();toast('작은 달걀 곁들임을 준비했어요.');}});
  $('resume-kitchen').addEventListener('click',()=>Kitchen.show());
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.tab; renderManagement(); openSheet('management-dialog'); }));
  $('management-content').addEventListener('click', event => {
    const button=event.target.closest('button');
    if(!button||button.disabled)return;
    if(button.dataset.menuFilter){menuFilter=button.dataset.menuFilter;renderManagement();return;}
    if (button.dataset.rescue) { if (E.rescue(state)) toast('이웃이 필요한 재료를 나눠 주었어요. 나중에 따뜻한 밥으로 보답해요.'); }
    else if (button.dataset.buy) { if (E.buy(state, button.dataset.buy)) toast(`${E.ingredients[button.dataset.buy].name} 1개를 냉장고에 채웠어요.`); }
    else if (button.dataset.unlock) { if (E.unlock(state, button.dataset.unlock)) toast(`${E.recipes[button.dataset.unlock].name}을 배웠어요. 맡김 차림으로 정해 보세요.`); }
    else if (button.dataset.special && state.phase !== 'open' && state.unlocked.includes(button.dataset.special)) { state.special = button.dataset.special; toast('오늘의 맡김 차림을 정했어요.'); }
    else if (button.dataset.upgrade) { if (E.upgrade(state, button.dataset.upgrade)) { clearTimeout(toastTimer);$('toast').classList.remove('visible');Scene.preparePlacement(button.dataset.upgrade);render();$('management-dialog').close();Scene.showItem(button.dataset.upgrade);return; } }
    const selector = button.dataset.rescue ? '[data-tab="pantry"]' : button.dataset.buy ? `[data-buy="${button.dataset.buy}"]` : button.dataset.special ? `[data-special="${button.dataset.special}"]` : button.dataset.unlock ? `[data-unlock="${button.dataset.unlock}"]` : `[data-upgrade="${button.dataset.upgrade}"]`;
    render(); document.querySelector(selector)?.focus({ preventScroll: true });
  });
  $('management-content').addEventListener('input',event=>{if(event.target.id!=='menu-search')return;const pos=event.target.selectionStart;menuQuery=event.target.value;renderManagement();const input=$('menu-search');input.focus({preventScroll:true});input.setSelectionRange(pos,pos);});
  $('story-content').addEventListener('click', event => {
    if(event.target.closest('[data-story-jump]')){$('story-decision')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return;}
    const button = event.target.closest('[data-choice]');
    if (button && E.resolveEvent(state, button.dataset.choice)) { render(); $('story-dialog').scrollTop=0; toast(state.event==='pending'?'그다음 이야기가 이어집니다.':'이 선택의 소식이 다음 밤에 도착해요.'); }
  });
  const sheetIds = ['report-dialog', 'guest-dialog', 'management-dialog', 'story-dialog', 'settings-dialog'];
  function anySheetOpen() { return sheetIds.some(id => $(id).open); }
  function openSheet(id) {
    for (const other of sheetIds) if (other !== id && $(other).open) $(other).close();
    if (!$(id).open) $(id).showModal();
  }
  function maybeStory() {
    if (!$('app').hidden && (state.event === 'pending'||state.nightNews.length)) $('story-open').classList.add('story-waiting'); else $('story-open').classList.remove('story-waiting');
  }
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]');
    if (!close) return;
    $(close.dataset.close).close();
    if (close.dataset.close !== 'story-dialog') maybeStory();
  });
  $('report-content').addEventListener('click',e=>{if(e.target.closest('#report-next') && E.next(state)){resetTransient();$('report-dialog').close();Scene.showArea('inside');render();}});
  $('story-open').addEventListener('click', () => { renderStory(); openSheet('story-dialog'); });
  $('settings-open').addEventListener('click', () => openSheet('settings-dialog'));
  $('fullscreen').addEventListener('click', async () => {
    if (document.fullscreenElement) return;
    try {
      if (!document.documentElement.requestFullscreen) return toast('현재 기기에서는 설치한 앱 화면으로 실행돼요.');
      await document.documentElement.requestFullscreen();
      try { await screen.orientation.lock('portrait'); } catch {}
    } catch { toast('전체 화면을 사용할 수 없는 기기입니다.'); }
  });
  // A new portrait cinematic with baked-in captions; media duration drives progress.
  const video = $('opening-video');
  let videoWasPlaying = false, startingVideo = false;
  function syncVideoButtons() {
    $('sound-intro').textContent = video.muted ? '소리 켜기 ♫' : '소리 끄기 ♫';
    $('sound-intro').setAttribute('aria-label', video.muted ? '인트로 소리 켜기' : '인트로 소리 끄기');
    $('pause-intro').textContent = video.paused ? '▶' : 'Ⅱ';
    $('pause-intro').setAttribute('aria-label', video.paused ? '인트로 계속 보기' : '인트로 일시정지');
  }
  async function playVideo(withSound = false) {
    if (startingVideo || !$('intro').open) return;
    startingVideo = true;
    if (withSound) video.muted = false;
    try {
      await video.play(); $('play-intro').hidden = true;
    } catch {
      if (!$('intro').open) return;
      if (withSound) {
        video.muted = true;
        try { await video.play(); $('play-intro').hidden = true; }
        catch { $('play-intro').hidden = false; }
      } else $('play-intro').hidden = false;
    } finally { startingVideo = false; syncVideoButtons(); }
  }
  function finishIntro() {
    if (!$('intro').open) return;
    video.pause(); $('intro').close(); state.introSeen = true;
    $('app').hidden=false;lastFrame=0;render();if(state.kitchen)Kitchen.show();
  }
  function startIntro() {
    if ($('intro').open) return;
    for (const id of sheetIds) if ($(id).open) $(id).close();
    $('app').hidden = true; $('install-screen').hidden = true;
    video.pause(); video.currentTime = 0;
    $('intro-progress').style.width = '0%'; $('video-status').textContent = '';
    $('play-intro').textContent = '터치해서 시작 ▶'; $('play-intro').hidden = true;
    $('intro').showModal();
    try { screen.orientation?.lock?.('portrait')?.catch(() => {}); } catch {}
    playVideo(true);
  }
  video.addEventListener('ended', finishIntro);
  video.addEventListener('timeupdate', () => { $('intro-progress').style.width = `${Math.min(100, video.currentTime / (Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 34) * 100)}%`; });
  video.addEventListener('waiting', () => { if ($('intro').open) $('video-status').textContent = '영상을 불러오는 중…'; });
  video.addEventListener('playing', () => { $('video-status').textContent = ''; syncVideoButtons(); });
  video.addEventListener('pause', syncVideoButtons);
  video.addEventListener('error', () => {
    $('video-status').textContent = '영상을 불러오지 못했어요. 연결을 확인한 뒤 다시 재생해 주세요.';
    $('play-intro').textContent = '다시 재생 ▶'; $('play-intro').hidden = false;
  });
  $('play-intro').addEventListener('click', () => { if (video.error) video.load(); playVideo(true); });
  $('sound-intro').addEventListener('click', () => {
    if (video.muted) { video.muted = false; if (video.paused) playVideo(true); }
    else video.muted = true;
    syncVideoButtons();
  });
  $('pause-intro').addEventListener('click', () => { if (video.paused) playVideo(!video.muted); else video.pause(); });
  $('skip-intro').addEventListener('click', finishIntro);
  $('intro').addEventListener('cancel', event => { event.preventDefault(); finishIntro(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { videoWasPlaying = $('intro').open && !video.paused; if (videoWasPlaying) video.pause(); }
    else if (videoWasPlaying && $('intro').open) { videoWasPlaying = false; playVideo(!video.muted); }
  });
  $('replay').addEventListener('click', () => { if (state.kitchen) return toast('조리 중인 한 끼를 먼저 내어 주세요.'); startIntro(); });
  $('reset').addEventListener('click', () => { if (state.kitchen) return toast('조리 중인 한 끼를 먼저 내어 주세요.'); $('reset-dialog').showModal(); });
  $('reset-dialog').addEventListener('close', () => {
    if ($('reset-dialog').returnValue !== 'reset') return;
    state = E.fresh(); resetTransient(); seenCustomers.clear(); render(); startIntro();
  });
  function frame(now){const dt=lastFrame?Math.min(now-lastFrame,100):0;lastFrame=now;
    if(cashAnimation){const progress=Math.max(0,Math.min(1,(now-cashAnimation.start-450)/650));$('money').textContent=yen(Math.round(cashAnimation.from+(cashAnimation.to-cashAnimation.from)*(1-(1-progress)**3)));if(progress===1)cashAnimation=null;}
    if(!document.hidden&&!$('app').hidden&&!$('reset-dialog').open&&!$('settings-dialog').open&&!$('intro').open){
      Kitchen.tick(dt);
      if(state.phase==='open'&&!Scene.isPlacing()){
        for(const g of state.guests){if(g.status==='waiting'&&!anySheetOpen()){g.waitMs=(g.waitMs||0)+dt;const meter=document.querySelector(`[data-customer="${g.id}"] .wait-meter i`);if(meter)meter.style.width=`${E.patience(g)*100}%`;}
          if(g.status==='eating'){g.eatMs=Math.round((g.eatMs||0)+dt);if(g.eatMs>=9000){E.finishEating(state,g.id);render();toast(`${E.person(g.person).name} 님이 식사를 마쳤어요. 별점 위 금액을 눌러 결제해 주세요.`);}}
        }
      }
    }
    raf=requestAnimationFrame(frame);
  }
  // Waiting counts only while the game is active; background/offline time never advances.
  let arrivalTimer = setInterval(() => { if (!$('reset-dialog').open) tryArrival(); }, 6500);
  window.addEventListener('pagehide', () => { save(); clearInterval(arrivalTimer); cancelAnimationFrame(raf); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { lastFrame = 0; arrivalTimer = setInterval(() => { if (!$('reset-dialog').open) tryArrival(); }, 6500); raf = requestAnimationFrame(frame); }
  });
  Kitchen.init({getState:()=>state,food,toast,clearToast:()=>{clearTimeout(toastTimer);$('toast').classList.remove('visible');},changed:render,save,onDeliver:g=>{Scene.showArea('inside');render();toast(`${E.person(g.person).name} 님 앞에 ${E.recipes[g.recipe].name}을 놓았어요.`);}});
  render();
  window.MidnightApp = { launch: startIntro, save, isCooking:()=>Boolean(state.kitchen) };
  if (saveMessage) toast(saveMessage);
  raf = requestAnimationFrame(frame);
})();
