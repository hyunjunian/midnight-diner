(() => {
  'use strict';
  const E = window.MidnightEngine;
  const KEY = 'midnight-diner-save-v11';
  const $ = id => document.getElementById(id);
  const yen = n => `¥${n.toLocaleString('ja-JP')}`;
  let state, storageAvailable = true, saveMessage = '';
  // Keep the current playthrough; import v10 once without resetting purchases or cooking.
  try { state=E.restore(localStorage.getItem(KEY)||localStorage.getItem('midnight-diner-save-v10')); }
  catch { state = E.fresh(); saveMessage = '저장 정보를 읽지 못해 새 식당을 준비했습니다.'; }
  let selectedGuest=null,tab='pantry',talkIndex=0,cashAnimation=null;
  const Kitchen=window.MidnightKitchen,FX=window.MidnightAudio;
  const purchaseQuantities={},upgradeQuantities={};let prepExpanded=false,shopTheme='all';
  let menuFilter='all',menuQuery='',storyRenderKey='';
  const seenCustomers = new Set();
  let toastTimer, raf, lastFrame = 0, openingUntil=0, lastClock=0;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? '진행 상황이 이 기기에 자동 저장됩니다.' : '저장을 사용할 수 없습니다. 창을 닫으면 진행이 사라져요.';
  }
  function toast(message) {
    if(Kitchen?.isVisible()){let feedback=$('kitchen-inline-feedback');if(!feedback){feedback=document.createElement('p');feedback.id='kitchen-inline-feedback';feedback.setAttribute('role','status');$('kitchen-footer').prepend(feedback);}feedback.textContent=message;return;}
    $('toast').textContent = message; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4200);
  }
  const Scene = window.MidnightScene;
  const signed = n => `${n >= 0 ? '+' : ''}${n}`;
  function portrait(p, i) { return Scene.character(i); }
  const basicFood=['rice','nori','egg','dashi','pork','miso','salmon'];
  function food(id,eaten=false,appearance='good'){if(!E.Cooking.imagePilot.includes(id))appearance='good';const item=E.ingredients[id]||E.recipes[id];let file,index,rows;
    if(E.recipes[id]){file=`${eaten?'used-menu':['burnt','dry'].includes(appearance)?'burnt-menu':appearance==='raw'?'raw-menu':'menu'}-${item.sheet}`;index=item.art;rows=3;}
    else{const n=Object.keys(E.ingredients).indexOf(id);file=`stock-anime-${Math.floor(n/12)+1}`;index=n%12;rows=3;}
    return `<span class="food-art" role="img" aria-label="${item.name}" data-food="${id}" style="--food-file:url('./assets/${file}.webp');--food-rows:${rows*100}%;--food-x:${index%4*100/3}%;--food-y:${Math.floor(index/4)*100/(rows-1)}%;--food-ratio:${E.recipes[id]?'3/4':'1'}"></span>`;
  }
  function levelNote(level) {
    const l = E.levels[level - 1];
    return `Lv.${level} · 누적 ${l.xp}점 / 평판 ${l.reputation} / 만족도 ${l.satisfaction}`;
  }
  function decorArt(id){return Scene.itemArt(id);}
  function delta(n,unit=''){return `<span class="score-delta ${n>0?'gain':n<0?'loss':'no-change'}" aria-label="이번 영업 ${n>0?'상승':n<0?'하락':'변화 없음'} ${Math.abs(n)}${unit}">${n===0?'±0':signed(n)}<small>${unit}</small></span>`;}
  function requirements(level){const l=E.levels[level-1];return `성장 ${l.xp} · 평판 ${l.reputation} · 만족도 ${l.satisfaction} · 분위기 ${l.atmosphere}`;}
  function renderReport() {
    const r=E.report(state),levelled=r.level>r.previousLevel,next=r.next;
    const reviews=r.reviews.length?`<div class="night-reviews" aria-label="이번 영업 손님 리뷰">${r.reviews.map(x=>`<article class="night-review">${x.person!==null?`<span class="review-face">${portrait(E.person(x.person),x.person)}</span>`:'<span class="review-note" aria-hidden="true">★</span>'}<div><header><b>${x.guest}</b><span>★ ${(x.score/20).toFixed(1)}</span></header><p>“${x.text}”</p><small>${x.dish}</small></div></article>`).join('')}</div>`:'<p class="review-empty">음식값을 받은 손님의 리뷰가 이곳에 남아요.</p>';
    const goal=next?`<section class="next-goal"><h4>다음 레벨까지 한 걸음</h4><div class="goal-chips">${[[r.xp,next.xp,'성장'],[r.reputation,next.reputation,'평판'],[r.satisfaction,next.satisfaction,'만족도'],[r.atmosphere,next.atmosphere,'분위기']].map(([v,t,label])=>`<span class="${v>=t?'met':''}"><small>${v>=t?'✓ ':''}${label}</small><b>${v} / ${t}</b></span>`).join('')}</div><p>성장 <b>${r.remaining}점</b>을 더 모으고 네 조건을 채우면 레벨이 올라요.</p>${r.atmosphere<next.atmosphere?`<button data-go-shop>가게 꾸미기 · 분위기 ${next.atmosphere-r.atmosphere}점 더하기 →</button>`:''}</section>`:'<p class="max-level-message">백 가지 밤의 주인장이 되었어요.</p>';
    $('report-content').innerHTML=`<div class="report-heading"><span class="night-stamp">第 ${state.night} 夜</span><h3>오늘 밤도 수고했어요</h3><p>${state.nightScores.length}명 대접 · 평균 만족도 ${r.average}점</p></div><section class="growth-banner ${levelled?'level-up':''}"><span class="level-tile">Lv.<b>${r.level}</b></span><div><small>${levelled?'LEVEL UP!':'오늘의 성장'}</small><h3>${E.levels[r.level-1].name}</h3>${levelled?`<p>Lv.${r.previousLevel} → Lv.${r.level}</p>`:''}${delta(r.xpDelta,'XP')}</div></section><section class="report-reputation report-metric"><div class="metric-heading"><div><h4>골목의 평판</h4><strong>${r.reputation}<small> / 100</small></strong></div>${delta(r.reputationDelta,'점')}</div>${reviews}</section><div class="report-metric-pair"><section class="report-metric"><h4>고객 만족도</h4><strong>${r.satisfaction}<small> / 100</small></strong>${delta(r.satisfactionDelta,'점')}</section><section class="report-metric"><h4>가게의 분위기</h4><strong>${r.atmosphere}<small>점</small></strong>${delta(r.atmosphereDelta,'점')}</section></div><section class="till-summary"><div class="till-heading"><span>오늘의 금고</span><strong>${yen(r.money)}</strong>${delta(r.net,'엔')}</div><div class="till-lines"><p><span>오늘 매출</span><b>${yen(r.revenue)}</b></p><p class="tip-income"><span>매출에 포함된 팁</span><b>+${yen(r.tips)}</b></p>${r.storyIncome?`<p><span>이야기의 답례</span><b class="income">+${yen(r.storyIncome)}</b></p>`:''}${r.purchases?`<p><span>재료·가게 구입</span><b class="expense">−${yen(r.purchases)}</b></p>`:''}${r.storyCosts?`<p><span>이야기에 보탠 비용</span><b class="expense">−${yen(r.storyCosts)}</b></p>`:''}<p><span>영업비 <small>임대·가스·전기</small></span><b class="expense">−${yen(r.expenses)}</b></p></div><small>총 성장 점수 ${r.xp.toLocaleString()} XP</small></section>${goal}${r.menus.length?`<section class="earned-gallery"><h4>이번 밤에 열린 새로운 한 끼</h4>${Array.from({length:Math.min(r.level,34)-r.previousLevel},(_,i)=>rewardGallery(r.previousLevel+i+1)).join('')}</section>`:''}${upcoming()}<button id="report-next" class="primary cook-button">다음 밤 준비 <span>→</span></button>`;
  }

  function renderScene() {
    const visible = state.guests.filter(g => g.status !== 'left');
    const liveIds = new Set(visible.map(g=>String(g.id)));
    for (const el of [...$('customers').children]) if(!liveIds.has(el.dataset.customer)) el.remove();
    for (const g of visible) {
      const p=E.person(g.person), profile=E.guestProfile(state,g.person), r=E.recipes[g.recipe], key=`${state.night}-${g.id}`;
      let el=$('customers').querySelector(`[data-customer="${g.id}"]`);
      // Keep each decoded character and its animation alive across inventory/HUD updates.
      if(el && el.dataset.person!==String(g.person)){el.remove();el=null;}
      if(!el){
        el=document.createElement('div');el.dataset.customer=g.id;el.dataset.person=g.person;
        el.className=`customer seat-${g.seat}${seenCustomers.has(key)?'':' arriving'}`;seenCustomers.add(key);
        el.innerHTML=`<button class="customer-avatar" data-guest="${g.id}" aria-label="${profile.name} 님과 대화하기">${portrait(p,g.person)}</button><button class="customer-name" data-guest="${g.id}"></button><span class="wait-meter" aria-hidden="true"><i></i></span><div class="served-dish" hidden></div><button class="customer-payment" hidden></button><span class="dining-chopsticks" hidden></span>`;
        el.addEventListener('animationend',e=>{if(e.animationName==='counter-arrival')el.classList.remove('arriving')});
        $('customers').append(el);
      }
      el.classList.toggle('selected',g.id===selectedGuest);el.classList.toggle('needs-payment',g.status==='paying');
      el.classList.toggle('pleased',g.status==='eating' && g.score>=80);
      el.classList.toggle('disappointed',g.status==='eating' && g.score<60);
      el.querySelector('.customer-avatar').disabled=false;el.querySelector('.customer-avatar').setAttribute('aria-label',`${profile.name} 님과 대화하기`);el.classList.toggle('dining',g.status==='eating');
      const status={seated:'대화하기',waiting:'주문 접수',eating:'식사 중',paying:'계산할게요',farewell:'배웅하기'};
      el.querySelector('.customer-name').textContent=`${profile.name}${E.regular(state,g.person)?' · 단골':''} · ${status[g.status]}`;
      const served=el.querySelector('.served-dish');served.classList.toggle('uncooked-dish',g.bill?.appearance==='raw'||E.Cooking.family(g.recipe,E.recipes[g.recipe])==='cold');served.classList.toggle('overdone-dish',['dry','burnt'].includes(g.bill?.appearance));const hasDish=['eating','paying','farewell'].includes(g.status);served.hidden=!hasDish;
      if(hasDish&&served.dataset.recipe!==g.recipe){served.innerHTML=food(g.recipe,false,g.bill?.appearance||'good')+'<span class="dish-steam"></span><span class="eaten-dish">'+food(g.recipe,true)+'</span>';served.dataset.recipe=g.recipe;served.classList.add('dish-arriving');}
      served.classList.toggle('finished-meal',g.status!=='eating');
      el.querySelector('.dining-chopsticks').hidden=g.status!=='eating';const payment=el.querySelector('.customer-payment');payment.hidden=g.status!=='paying';payment.dataset.pay=g.id;
      if(g.status==='paying')payment.innerHTML=`<b>${yen(g.bill.total)}</b><span class="five-stars" aria-label="만족도 ${g.score}점, 5점 만점에 ${(g.score/20).toFixed(1)}점"><i style="width:${g.score}%">★★★★★</i><em>★★★★★</em></span><small>${(g.score/20).toFixed(1)} / 5 · 눌러 수금</small>`;
      el.querySelector('.wait-meter').hidden=g.status!=='waiting';
      const patience=E.patience(g,state);el.querySelector('.wait-meter i').style.width=`${patience*100}%`;el.classList.toggle('waiting-long',patience<.3);
    }
    $('scene').classList.toggle('is-prep',state.phase==='prep');
    Scene.render(state,selectedGuest,!!state.kitchen);$('resume-kitchen').hidden=!state.kitchen;
  }
  const thanksHigh=['정말 맛있었어요. 이 한 끼 덕분에 오늘 하루가 좋아졌네요.','마지막 한 입까지 아껴 먹었어요. 정성이 느껴지는 밥이네요.','배도 마음도 든든해졌어요. 늦은 시간에 이런 밥을 만나서 참 다행이에요.','이 맛을 기억해 둘래요. 오늘은 좋은 밤으로 남겠네요.','오길 잘했어요. 누군가 차려 준 밥이 이렇게 힘이 되네요.','젓가락을 내려놓기가 아쉬웠어요. 맛있게 잘 먹었습니다.'];
  const thanksMid=['따뜻한 한 끼, 잘 먹었습니다. 한숨 돌리고 가요.','든든하게 먹었네요. 늦게까지 열어 주셔서 고마워요.','오늘 밥도 잘 먹었습니다. 잠깐 쉬었다 가니 좋네요.','배가 부르니 이제 좀 살 것 같네요. 고맙습니다.'];
  const thanksLow=['잘 먹었습니다. 다음에는 익힘을 조금 더 신경 써 주시면 좋겠어요.','오늘은 제 입맛과 조금 달랐네요. 다음 한 끼는 더 기대해 볼게요.','수고하셨어요. 조금 더 촉촉했으면 좋았을 것 같아요.'];
  const goodbyes=['이 골목을 지날 때 또 들를게요. 다음에도 잘 부탁드려요.','편안한 밤 보내세요. 가게 불빛을 기억해 둘게요.','잘 쉬었다 갑니다. 다음에 또 인사드릴게요.','밖에 비가 좀 잦아들었네요. 이제 천천히 걸어가 볼게요.','오늘은 푹 잘 수 있겠어요. 주인장도 잘 쉬세요.','다음에는 누군가와 함께 오고 싶네요. 고맙습니다.'];
  function talkLines(g){
    if(g.status==='farewell'){const comments=g.score>=90?thanksHigh:g.score>=65?thanksMid:thanksLow;return[comments[g.lineKey%comments.length],goodbyes[(g.lineKey+state.night)%goodbyes.length]];}
    if(g.status==='paying')return['잘 먹었습니다. 계산 부탁드릴게요.',`음식값과 팁을 합쳐 ${yen(g.bill.total)}이네요. 감사합니다.`];
    return ['따뜻할 때 천천히 먹고 갈게요. 잠깐만 기다려 주세요.'];
  }
  const factLabels={name:'이름',role:'하는 일',age:'나이',style:'차림새',bio:'기억해 둘 이야기'};
  function renderTalk(){
    if(!$('guest-dialog').open)return;const g=state.guests.find(g=>g.id===selectedGuest&&g.status!=='left');if(!g){$('guest-dialog').close();return;}
    const p=E.person(g.person),profile=E.guestProfile(state,g.person),view=E.guestConversation(state,g.id),lines=view?null:talkLines(g),last=view?view.orderReady:talkIndex>=lines.length-1,other=state.kitchen&&state.kitchen.guest!==g.id;
    let action=g.status==='paying'?(last?'계산 받기 →':'계산해 드릴게요 →'):g.status==='farewell'?(last?'조심히 돌아가세요 →':g.score<65?'말씀 새겨들을게요 →':g.score>=90?'맛있게 드셨다니 기뻐요 →':'들러 주셔서 고마워요 →'):'편히 드세요 · 자리로 돌아가기';
    if(view)action=other?'진행 중인 요리를 먼저 마무리해 주세요':g.status==='waiting'?'접수한 주문 조리하러 가기 →':'주문 받고 부엌으로 →';
    // Keep the live mesh and controls intact through HUD/inventory/timer updates.
    if($('guest-dialog').dataset.person!==String(g.person)){$('talk-portrait').innerHTML=portrait(p,g.person);$('guest-dialog').dataset.person=g.person;}
    $('talk-name').textContent=profile.name;
    $('talk-profile').textContent=profile.known.length?(profile.role||'인사를 나눈 손님'):'아직 이름과 이야기를 나누지 않았어요.';
    $('talk-regular').textContent=E.regular(state,g.person)?'익숙한 단골 · 지난 대화의 기억이 이어져요.':'인사를 나누고 궁금한 것을 물어보세요. 알게 된 이야기는 기억해 둬요.';
    const fields=['role','age','style'],factsKey=JSON.stringify(fields.map(id=>profile[id]));
    if($('talk-known-fields').dataset.key!==factsKey){$('talk-known-fields').dataset.key=factsKey;$('talk-known-fields').replaceChildren(...fields.map(id=>{const item=document.createElement('div'),label=document.createElement('dt'),value=document.createElement('dd');label.textContent=factLabels[id];value.textContent=profile[id]||'아직 몰라요';item.className=profile[id]?'known':'unknown';label.append(document.createTextNode(profile[id]?' ✓':''));item.append(label,value);return item;}));}
    $('talk-line').textContent=view?view.line:lines[Math.min(talkIndex,lines.length-1)];
    $('talk-progress').textContent=view?view.caption:g.status==='farewell'?'식사 끝, 잠깐의 인사':g.status==='paying'?'오늘의 식사 계산':'느긋하게 식사 중';
    $('talk-player-line').hidden=!view?.playerLine;$('talk-player-line').textContent=view?.playerLine||'';
    const discovered=view?.discovered||[];const discoveryKey=`${g.id}:${view?.node}:${discovered.join(',')}`;
    if($('talk-discovery').dataset.key!==discoveryKey){$('talk-discovery').dataset.key=discoveryKey;$('talk-discovery').textContent=discovered.length?`손님을 조금 더 알게 됐어요 · ${discovered.map(id=>factLabels[id]).join(' · ')}`:'';}
    $('talk-discovery').hidden=!discovered.length;
    const choicesKey=JSON.stringify([g.id,view?.node,view?.choices.map(x=>[x.id,x.label])]);
    if($('talk-choices').dataset.key!==choicesKey){$('talk-choices').dataset.key=choicesKey;$('talk-choices').replaceChildren(...(view?.choices||[]).map(choice=>{const button=document.createElement('button');button.type='button';button.dataset.guestReply=choice.id;button.textContent=choice.label;return button;}));}
    $('talk-choices').classList.toggle('optional',!!view?.orderReady);
    $('talk-next').hidden=!!view&&!view.orderReady;$('talk-next').textContent=action;$('talk-next').disabled=!!view&&last&&!!other;
    $('talk-order').hidden=!view?.orderReady;$('talk-order').innerHTML=`${food(g.recipe)}<span>${E.recipes[g.recipe].name}<small>${E.recipes[g.recipe].ingredients.map(id=>E.ingredients[id].name).join(' · ')}</small></span>`;
    $('talk-gift').hidden=!E.regular(state,g.person)||!view?.orderReady;$('talk-gift').disabled=g.gifted||!state.inventory.egg;$('talk-gift').textContent=g.gifted?'✓ 달걀 곁들임을 서비스했어요':'단골 서비스 · 달걀 곁들임 1개';
  }
  function openTalk(id){selectedGuest=id;talkIndex=0;openSheet('guest-dialog');renderTalk();renderScene();}
  function animateCash(rect,bill,before){FX?.play('cash');
    cashAnimation={from:before,to:state.money,start:performance.now()};
    const target=$('money').getBoundingClientRect(),dx=target.x+target.width/2-rect.x-rect.width/2,dy=target.y+target.height/2-rect.y;
    for(let i=0;i<3;i++){const note=document.createElement('div');note.className='cash-flight';note.textContent=i===0?`¥${bill.total.toLocaleString()}`:'¥';Object.assign(note.style,{left:`${rect.x+rect.width/2-38+i*5}px`,top:`${rect.y+i*6}px`});document.body.append(note);const a=note.animate([{transform:'translate(0,0) rotate(-8deg)',opacity:1},{transform:`translate(${dx*.4}px,${dy*.4-60}px) rotate(8deg) scale(.9)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.22)`,opacity:0}],{duration:950,delay:i*80,easing:'cubic-bezier(.25,.5,.35,1)',fill:'forwards'});a.onfinish=()=>note.remove();}
    $('money').classList.add('money-receiving');setTimeout(()=>$('money').classList.remove('money-receiving'),1400);
  }
  function rewardGallery(level){return `<div class="reward-foods">${Object.entries(E.recipes).filter(([,r])=>r.level===level).map(([id,r])=>`<div>${food(id)}<small>${r.name}</small></div>`).join('')}</div>`;}
  function upcoming(){
    if(state.level>=34)return '<p class="management-note">백 가지 음식이 모두 열렸어요. 나만의 식당을 계속 꾸며 보세요.</p>';
    const next=state.level+1,all=Object.entries(E.upgrades).filter(([,u])=>u.level>=next),itemLevel=all.length?Math.min(...all.map(([,u])=>u.level)):null,items=all.filter(([,u])=>u.level===itemLevel);
    return `<section class="upcoming"><div class="reward-heading"><span class="level-tile">Lv.<b>${next}</b></span><div><small>NEXT CHAPTER</small><h3>다음 레벨의 새로운 한 끼</h3></div></div><p class="reward-conditions">${requirements(next)}</p>${rewardGallery(next)}</section><section class="upcoming-items"><h3>다음 레벨의 아이템</h3>${itemLevel!==next?`<p class="next-item-note">다음 레벨에는 새 장식이 없어요.${itemLevel?` 아래 아이템은 Lv.${itemLevel}에서 만나요.`:' 열린 장식으로 나만의 가게를 꾸며 보세요.'}</p>`:''}<div class="unlock-item-grid">${items.map(([id,u])=>`<article><span class="item-level-tag">Lv.${u.level}</span>${decorArt(id)}<h4>${u.name}</h4><span class="ambience-reward">분위기 +${u.atmosphere}점</span><small>${yen(u.price)} · ${u.area==='inside'?'매장 안':'매장 밖'}</small></article>`).join('')}</div></section>`;
  }
  function renderStory(){
    const view=E.story(state),news=E.news(state),history=state.storyMemory.slice(-5).reverse(),key=JSON.stringify([view?.run,news,state.storyMemory.length,view?.run.cast.map(id=>E.guestProfile(state,id).known)]);
    if(key===storyRenderKey&&$('story-content').childElementCount){if(view?.run.step===0)for(const choice of view.definition.choices){const button=$('story-content').querySelector(`[data-choice="${choice.id}"]`);if(button)button.disabled=!E.canChoose(state,choice);}return;}storyRenderKey=key;window.MidnightVoice?.stop();
    $('story-tag').textContent=state.event==='pending'?'주인장의 선택 · 이어지는 이야기':'골목에 남은 기억';
    $('story-title').textContent=view?view.definition.title:'다음 밤에 도착한 소식';
    const memories=`<section class="story-journal"><h4>가게의 작은 수첩</h4>${history.length?history.map(t=>{const st=E.storyContent.stories.find(x=>x.id===t.id),c=st.choices.find(x=>x.id===t.choice);return `<details><summary>${t.night}번째 밤 · ${st.title}</summary><p>${c.result}</p></details>`}).join(''):'<p>손님 둘이 모이면 오늘 밤의 이야기가 시작돼요.</p>'}</section>`;
    const followups=news.length?`<div class="story-followups">${news.map(n=>`<p>✉ ${n.text}</p>`).join('')}</div>`:'';
    if(!view){$('story-content').innerHTML=followups+memories;return;}
    const {run,definition,choice,reflection}=view,cast=run.cast.map(id=>E.person(id));
    const text=t=>t.replaceAll('{a}',cast[0].name).replaceAll('{b}',cast[1].name);
    const faces=`<div class="story-cast-strip">${run.cast.map(id=>`<div class="story-cast-chip"><span class="story-mini-face">${portrait(E.person(id),id)}</span><span><b>${E.guestProfile(state,id).name}</b><small>${E.guestProfile(state,id).role||'아직 이야기를 나누지 않은 손님'}</small></span></div>`).join('')}</div>`;
    const dialogue=`<div class="story-voice-controls"><button data-story-voice>듣기 · 잠시 멈추기 ♫</button><button data-story-replay>처음부터 듣기 ↻</button><p id="story-voice-status" role="status">손님들의 목소리로 이야기를 들어요.</p></div><div class="story-chat" aria-label="손님들의 대화">${definition.lines.map((line,i)=>{
      const actor=line.startsWith('{b}')?1:line.startsWith('{a}')?0:i%2,id=run.cast[actor],p=cast[actor],words=text(line).replace(new RegExp('^'+p.name+'[：:]\\s*'),'');
      return `<article class="story-message ${actor?'from-right':''}" data-speaker="${id}"><div class="story-chat-face" aria-label="${E.guestProfile(state,id).name}">${portrait(p,id)}</div><div class="story-message-body"><b>${E.guestProfile(state,id).name}</b><p>${words}</p></div></article>`;
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

  function renderShop(){
    const F=E.F,benefits=F.benefits(state),themes=F.themes,active=F.activeItems(state),filter=shopTheme==='all'?null:Number(shopTheme),entries=Object.entries(E.upgrades).filter(([,u])=>filter===null||u.theme===filter);
    const collection=filter===null?'':(()=>{const n=active.filter(id=>E.upgrades[id].theme===filter).length;return `<section class="collection-goal"><div><b>${themes[filter].name}</b><span>${n} / 15 꾸미기</span></div><p>같은 모음 5종이면 팁 +3%, 10종이면 +6%. 서로 다른 자리를 함께 꾸며 보세요.</p><progress value="${n}" max="15"></progress><img src="./assets/room-collection-${filter}.webp" alt="${themes[filter].name} 모음을 모두 꾸민 매장" loading="lazy"></section>`})();
    $('management-content').innerHTML=`<section class="shop-benefits"><b>내 가게의 온기 <strong>${E.atmosphere(state)}점</strong></b><p>팁 +${benefits.tips}% · 기다림 +${benefits.patience}초${benefits.discount?` · 재료 −${benefits.discount}%`:''}</p><small>새 모양을 들이면 같은 자리에 교체돼요. 보유한 물건은 언제든 다시 놓을 수 있어요.</small></section><div class="collection-filters" aria-label="꾸미기 모음"><button data-shop-theme="all" class="${shopTheme==='all'?'active':''}">전체 60종</button>${themes.map(t=>`<button data-shop-theme="${t.id}" class="${shopTheme===String(t.id)?'active':''}">${t.name}</button>`).join('')}</div>${collection}<div class="upgrade-grid item-shop-grid">${entries.map(([id,u])=>{const owned=F.count(state,id),equipped=F.activeId(state,u.slot)===id,max=u.max-owned,q=Math.max(1,Math.min(upgradeQuantities[id]||1,max||1));upgradeQuantities[id]=q;return `<article class="upgrade-card furnish-card ${state.level<u.level?'locked':''}" data-furnishing="${id}"><span class="item-level-tag">Lv.${u.level}</span><div class="furnishing-picture">${decorArt(id)}</div><h3>${u.name}</h3><span class="ambience-reward">분위기 +${u.atmosphere}${u.max>1?' / 개':'점'}</span><p class="item-benefit">${F.benefitText(id)}</p><p class="item-location">${E.F.slots[u.slot].place}${owned?` · ${owned}개 보유`:''}</p>${(()=>{const current=F.activeId(state,u.slot);if(!current||current===id)return '';const d=u.atmosphere*(owned||q)-E.upgrades[current].atmosphere*F.count(state,current);return `<small class="replace-delta ${d<0?'negative':''}">교체하면 분위기 ${d>=0?'+':''}${d}점</small>`;})()}${u.max>1&&max&&state.level>=u.level?`<div class="quantity-stepper lamp-quantity"><button data-furnish-qty="-1" aria-label="조명 구매 수량 줄이기" ${q<=1?'disabled':''}>−</button><input data-lamp-qty="${id}" value="${q}" type="number" inputmode="numeric" min="1" max="${max}" aria-label="${u.name} 구매 수량"><button data-furnish-qty="1" aria-label="조명 구매 수량 늘리기" ${q>=max?'disabled':''}>+</button></div>`:''}${owned&&!equipped?`<button data-equip="${id}">보유한 물건 놓기</button>`:owned?`<small class="item-installed">✓ ${owned}개 배치 중</small>`:''}<button data-upgrade="${id}" ${!max||state.money<u.price*q||state.level<u.level?'disabled':''}>${state.level<u.level?`Lv.${u.level}에 해제`:!max?'모두 보유 중':`${yen(u.price*q)} · ${u.max>1?q+'개 ':''}들여놓기`}</button></article>`}).join('')}</div>`;
  }
  function renderManagement() {
    const rescue = E.rescueNeeds(state) ? '<div class="rescue-box"><span>재료 살 돈이 부족한가요? 이웃 상인이 이번 주문에 필요한 재료를 나눠 줘요.</span><button data-rescue="true">도움받기 · 평판 −3</button></div>' : '';
    document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-pressed', String(b.dataset.tab === tab)); });
    $('management-title').textContent = { pantry: '냉장고', menu: '메뉴 수첩', shop: '가게 꾸미기' }[tab];
    if (tab === 'pantry') {
      $('management-content').innerHTML=`${rescue}<p class="management-note">수량을 정해 한 번에 채워 두세요.<span>재료 그림을 누르면 1개씩 바로 추가돼요.</span></p><div class="stock-grid">${Object.entries(E.ingredients).map(([id,item])=>{
        const open=E.ingredientAvailable(state,id),max=Math.max(0,Math.min(99,999-state.inventory[id],Math.floor(state.money/E.buyPrice(state,id)))),q=Math.max(1,Math.min(purchaseQuantities[id]||1,max||1));purchaseQuantities[id]=q;
        return `<article class="stock-card stock-quantity-card ${open?'':'ingredient-locked'}" data-stock-id="${id}"><button class="stock-icon quick-stock" data-quick-buy="${id}" ${!open||!max?'disabled':''} aria-label="${item.name} 1개 바로 채우기">${food(id)}</button><div class="stock-copy"><h3>${item.name}</h3><span>재고 <b>${state.inventory[id]}</b>개</span></div>${open?`<div class="quantity-stepper"><button data-qty-step="-1" ${q<=1?'disabled':''} aria-label="${item.name} 구매 수량 줄이기">−</button><input data-purchase-qty="${id}" type="number" inputmode="numeric" min="1" max="${max||1}" value="${q}" aria-label="${item.name} 구매 수량"><button data-qty-step="1" ${q>=max?'disabled':''} aria-label="${item.name} 구매 수량 늘리기">+</button></div>`:'<span class="stock-lock-note">레벨을 올리면 사용할 수 있어요.</span>'}<button class="stock-buy" data-buy="${id}" ${!open||!max?'disabled':''}>${open?`${q}개 채우기 · ${yen(q*E.buyPrice(state,id))}`:`Lv.${item.level}에 해제`}</button></article>`;
      }).join('')}</div>`;
    } else if(tab==='menu'){
      const entries=Object.entries(E.recipes),matches=entries.filter(([,r])=>(menuFilter==='all'||menuFilter==='available'&&r.level<=state.level||Number(menuFilter)===r.level)&&(!menuQuery||r.name.includes(menuQuery)));
      $('management-content').innerHTML=`<p class="management-note">레벨마다 새 메뉴 3개 · 전체 100종 · 지금 ${entries.filter(([,r])=>r.level<=state.level).length}개를 만들 수 있어요.<span>오늘의 추천: ${E.recipes[state.special].name}</span></p><div class="menu-filters"><button data-menu-filter="all" class="${menuFilter==='all'?'active':''}">전체 100</button><button data-menu-filter="available" class="${menuFilter==='available'?'active':''}">지금 가능</button>${Array.from({length:34},(_,i)=>`<button data-menu-filter="${i+1}" class="${menuFilter===String(i+1)?'active':''}">Lv.${i+1}</button>`).join('')}</div><input id="menu-search" type="search" aria-label="음식 이름 찾기" placeholder="먹고 싶은 음식 찾기" value="${menuQuery.replaceAll('&','&amp;').replaceAll('"','&quot;')}"><div class="menu-grid">${matches.map(([id,r])=>{const open=r.level<=state.level;return `<article class="menu-card ${open?'available':'locked'}"><div class="menu-picture">${food(id)}${open?'':`<span class="menu-lock">Lv.${r.level}에 해제</span>`}</div><small>LEVEL ${r.level}</small><h3>${r.name}</h3><p>${r.ingredients.map(id=>E.ingredients[id].name).join(' · ')}</p><span class="menu-price">${yen(r.price)}부터</span>${open?`<button data-special="${id}" ${state.special===id||state.phase==='open'?'disabled':''}>${state.special===id?'✓ 오늘의 추천':state.phase==='open'?'다음 영업 전에 추천 변경':'오늘의 추천으로 정하기'}</button>`:`<button disabled aria-label="${r.name} 레벨 ${r.level}에 해제">Lv.${r.level} 도달 시 바로 조리 가능</button>`}</article>`}).join('')}</div>${upcoming()}`;
    } else { renderShop();
    }
  }
  function renderStockPrep(){
    const panel=$('stock-prep');panel.hidden=state.phase!=='prep';if(panel.hidden)return;
    const full=E.stockPlan(state,9),small=E.stockPlan(state,3),chosen=!prepExpanded?(state.prepChoice||(small.units===0&&full.units>0?3:null)):null,plan=chosen===3?small:full;
    panel.innerHTML=`<div class="stock-prep-heading"><span>오늘의 영업 준비</span><h3>${!plan.units?`${plan.meals}끼분 준비가 끝났어요`:'단골이 오기 전에, 냉장고부터'}</h3><p>${chosen===3?'먼저 3끼로 가볍게 시작해요. 영업 중에도 재료를 채울 수 있어요.':`이번 밤 메뉴를 바탕으로 ${plan.meals}끼를 준비해요. 부족한 만큼만 한 번에 채워요.`}</p></div><div class="stock-prep-list">${plan.lines.map(x=>`<span class="${x.quantity?'stock-short':'stock-ready'}">${food(x.id)}<b>${E.ingredients[x.id].name}</b><small>${x.owned} / ${x.target}개 ${x.quantity?`· +${x.quantity} 필요`:'· 준비됨'}</small></span>`).join('')}</div>${plan.units?`<button class="primary stock-bulk-main" data-restock="${chosen===3?3:9}" ${state.money<plan.cost?'disabled':''}>${plan.meals}끼 재료 한 번에 채우기 · ${yen(plan.cost)}</button>`:'<p class="stock-prepared-check">✓ 이제 식당 불을 켜고 손님을 맞이해요.</p>'}${!chosen&&small.units?`<button class="stock-bulk-small" data-restock="3" ${state.money<small.cost?'disabled':''}>먼저 3끼만 준비 · ${yen(small.cost)}</button>`:''}${chosen?'<button class="change-prep-plan" data-prep-reset>준비량 다시 고르기</button>':''}${state.money<plan.cost&&plan.units?'<small class="stock-budget-note">자금에 맞춰 3끼씩 준비하고 영업 수익으로 더 채워 주세요.</small>':''}`;
  }
  function renderClock(){
    const minutes=Math.floor(window.MidnightDaylight?.minutes(state)??(state.phase==='prep'?1430:state.phase==='end'?420:30));
    $('clock').textContent=`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
    window.MidnightDaylight?.update(state);
  }
  function render() {
    $('money').textContent=yen(cashAnimation?Math.round(cashAnimation.from):state.money);
    $('reputation').innerHTML = `${state.reputation} <small>/ 100</small>`;
    $('day').textContent = `${state.night}번째 밤`;
    $('open-status').textContent = state.phase === 'prep' ? '영업 준비' : state.phase === 'end' ? '오늘 영업 끝' : '영업 중';
    renderClock();
    const canClose = E.canClose(state);
    $('night-action').disabled = state.phase === 'open' && !canClose;
    $('night-action').innerHTML = state.phase === 'prep' ? '식당 불 켜기 <span>↗</span>' : state.phase === 'end' ? '오늘의 영업보고 <span>→</span>' : canClose ? '밤 마무리하기 · 영업보고 <span>☾</span>' : `${Math.min(3,Math.floor(state.nightScores.length/3)+1)} / 3사이클 · ${state.nightScores.length} / ${state.target}끼`;
    $('service-hint').textContent = state.phase === 'prep' ? (E.stockPlan(state,3).units?'아래 재료 준비를 먼저 확인해 주세요.':'재료가 준비됐어요. 식당 불을 켜고 손님을 맞이해요.') : state.phase === 'end' ? '재료를 채워 두면 다음 밤이 더 든든해져요.' : canClose ? '9명의 손님을 대접했어요! 아래 밤 마무리하기를 눌러 영업보고를 확인하세요.' : state.event === 'pending' ? '손님들의 이야기가 이어지고 있어요. 반짝이는 이야기 버튼을 눌러 답해 주세요.' : state.guests.some(g=>g.status==='paying')?'식사를 마친 손님의 별점 위 금액을 눌러 결제해 주세요.':'손님을 눌러 대화하고 주문을 받아 주세요.';
    $('night-action').classList.toggle('close-ready',canClose);
    const nextLevel=E.levels.find(l=>l.level>state.level);
    $('progress-hud').innerHTML=`<b>Lv.${state.level}</b><span class="hud-atmosphere">분위기 ${E.atmosphere(state)}${nextLevel?` / ${nextLevel.atmosphere}`:''}</span><span>만족도 ${E.satisfaction(state)} · 성장 ${state.xp}${nextLevel?` / ${nextLevel.xp}`:' · MAX'}</span><progress value="${nextLevel?Math.min(state.xp,nextLevel.xp):1}" max="${nextLevel?.xp||1}"></progress>`;
    renderStockPrep();renderScene();renderTalk();renderStory();renderManagement();save();
    $('story-badge').hidden=state.event!=='pending'&&!state.nightNews.length;
    if (state.phase==='end') renderReport();
    maybeStory();
  }
  function tryArrival() {
    if (performance.now()<openingUntil || Scene.isPlacing() || $('app').hidden || $('intro').open || document.hidden || $('settings-dialog').open || $('reset-dialog').open) return;
    const g = E.arrive(state);
    if (g) { E.conversation(state); render(); }
  }
  function resetTransient(){prepExpanded=false;selectedGuest=null;talkIndex=0;Kitchen.hide();}
  $('stock-prep').addEventListener('click',event=>{if(event.target.closest('[data-prep-reset]')){state.prepChoice=null;prepExpanded=true;renderStockPrep();save();return;}const button=event.target.closest('[data-restock]');if(!button||button.disabled)return;const result=E.restock(state,Number(button.dataset.restock));if(result){prepExpanded=false;FX?.play('buy');render();toast(`${result.units}개 재료를 냉장고에 채웠어요. 오늘 밤 준비가 든든해졌네요.`);}});
  $('night-action').addEventListener('click', () => {
    if (state.phase === 'prep') { E.open(state);FX?.play('open'); openingUntil=performance.now()+1400;resetTransient(); Scene.showArea('inside'); render(); setTimeout(tryArrival,1450); }
    else if (E.canClose(state)) { E.close(state);FX?.play('report'); resetTransient(); render(); openSheet('report-dialog'); }
    else if (state.phase === 'end') { FX?.play('report');renderReport(); openSheet('report-dialog'); }
  });
  $('customers').addEventListener('click',event=>{
    const pay=event.target.closest('[data-pay]');if(pay){const before=state.money,rect=pay.getBoundingClientRect(),bill=E.collect(state,Number(pay.dataset.pay));if(bill){animateCash(rect,bill,before);render();openTalk(Number(pay.dataset.pay));}return;}
    const button=event.target.closest('[data-guest]');if(!button)return;const g=state.guests.find(g=>g.id===Number(button.dataset.guest));if(!g)return;
    if(g.status==='paying'){const payment=document.querySelector(`[data-pay="${g.id}"]`);payment?.click();return;}openTalk(g.id);
  });
  $('talk-choices').addEventListener('click',event=>{
    const button=event.target.closest('[data-guest-reply]');if(!button)return;
    if(E.answerGuest(state,selectedGuest,button.dataset.guestReply)){render();const focus=$('talk-choices').querySelector('button')||$('talk-next');focus.focus({preventScroll:true});}
  });
  $('talk-next').addEventListener('click',()=>{
    const g=state.guests.find(g=>g.id===selectedGuest);if(!g)return;
    const view=E.guestConversation(state,g.id);
    if(view){
      if(!view.orderReady)return;
      if(g.status==='seated')E.acceptOrder(state,g.id);
      if(E.beginCooking(state,g.id)){$('guest-dialog').close();Kitchen.show();render();}return;
    }
    const lines=talkLines(g);if(talkIndex<lines.length-1){talkIndex++;renderTalk();return;}
    if(g.status==='paying'){const before=state.money,rect=$('talk-next').getBoundingClientRect(),bill=E.collect(state,g.id);if(bill){animateCash(rect,bill,before);talkIndex=0;render();}return;}
    if(g.status==='farewell'){E.depart(state,g.id);$('guest-dialog').close();selectedGuest=null;render();if(state.arrived%3===0&&state.guests.every(g=>g.status==='left'))tryArrival();return;}
    if(g.status==='eating')$('guest-dialog').close();
  });
  $('talk-gift').addEventListener('click',()=>{if(E.gift(state,selectedGuest)){render();toast('작은 달걀 곁들임을 준비했어요.');}});
  $('resume-kitchen').addEventListener('click',()=>Kitchen.show());
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.tab; renderManagement(); openSheet('management-dialog'); }));
  $('management-content').addEventListener('click', event => {
    const button=event.target.closest('button');
    if(!button||button.disabled)return;
    if(button.dataset.shopTheme!==undefined){shopTheme=button.dataset.shopTheme;renderShop();return;}
    if(button.dataset.furnishQty){const id=button.closest('[data-furnishing]').dataset.furnishing;upgradeQuantities[id]=Math.max(1,Math.min(E.upgrades[id].max-E.F.count(state,id),(upgradeQuantities[id]||1)+Number(button.dataset.furnishQty)));renderShop();return;}
    if(button.dataset.equip){const id=button.dataset.equip,origin=button.getBoundingClientRect(),before=E.atmosphere(state);if(E.equip(state,id)){Scene.preparePlacement(id,0,E.atmosphere(state)-before);render();$('management-dialog').close();Scene.showItem(id,origin);}return;}
    if(button.dataset.qtyStep){const id=button.closest('[data-stock-id]').dataset.stockId,max=Math.max(1,Math.min(99,999-state.inventory[id],Math.floor(state.money/E.buyPrice(state,id))));purchaseQuantities[id]=Math.max(1,Math.min(max,(purchaseQuantities[id]||1)+Number(button.dataset.qtyStep)));renderManagement();$('management-content').querySelector(`[data-stock-id="${id}"] [data-qty-step="${button.dataset.qtyStep}"]`)?.focus({preventScroll:true});return;}
    if(button.dataset.quickBuy){const id=button.dataset.quickBuy;if(E.buy(state,id,1)){FX?.play('buy');render();toast(`${E.ingredients[id].name} +1 · 재고 ${state.inventory[id]}개`);}return;}
    if(button.dataset.menuFilter){menuFilter=button.dataset.menuFilter;renderManagement();return;}
    if (button.dataset.rescue) { if (E.rescue(state)) toast('이웃이 필요한 재료를 나눠 주었어요. 나중에 따뜻한 밥으로 보답해요.'); }
    else if (button.dataset.buy) { const id=button.dataset.buy,q=purchaseQuantities[id]||1;if(E.buy(state,id,q)){FX?.play('buy');toast(`${E.ingredients[id].name} ${q}개를 냉장고에 채웠어요.`);} }
    else if (button.dataset.unlock) { if (E.unlock(state, button.dataset.unlock)) toast(`${E.recipes[button.dataset.unlock].name}을 배웠어요. 맡김 차림으로 정해 보세요.`); }
    else if (button.dataset.special && state.phase !== 'open' && state.unlocked.includes(button.dataset.special)) { state.special = button.dataset.special; toast('오늘의 맡김 차림을 정했어요.'); }
    else if(button.dataset.upgrade){const id=button.dataset.upgrade,origin=button.getBoundingClientRect(),before=E.atmosphere(state),from=E.F.activeId(state,E.upgrades[id].slot)===id?E.F.count(state,id):0;if(E.upgrade(state,id,upgradeQuantities[id]||1)){FX?.play('buy');clearTimeout(toastTimer);$('toast').classList.remove('visible');Scene.preparePlacement(id,from,E.atmosphere(state)-before);render();$('management-dialog').close();Scene.showItem(id,origin);return;}}

    const selector = button.dataset.rescue ? '[data-tab="pantry"]' : button.dataset.buy ? `[data-buy="${button.dataset.buy}"]` : button.dataset.special ? `[data-special="${button.dataset.special}"]` : button.dataset.unlock ? `[data-unlock="${button.dataset.unlock}"]` : `[data-upgrade="${button.dataset.upgrade}"]`;
    render(); document.querySelector(selector)?.focus({ preventScroll: true });
  });
  $('management-content').addEventListener('input',event=>{const id=event.target.dataset.lampQty;if(!id)return;const q=Math.max(1,Math.min(E.upgrades[id].max-E.F.count(state,id),Math.floor(Number(event.target.value)||1)));upgradeQuantities[id]=q;const b=$('management-content').querySelector(`[data-upgrade="${id}"]`);b.textContent=`${yen(E.upgrades[id].price*q)} · ${q}개 들여놓기`;b.disabled=state.money<E.upgrades[id].price*q;});
  $('management-content').addEventListener('change',event=>{const id=event.target.dataset.lampQty;if(id)event.target.value=String(upgradeQuantities[id]||1);});
  $('management-content').addEventListener('change',event=>{const id=event.target.dataset.purchaseQty;if(id)event.target.value=String(purchaseQuantities[id]||1);});
  $('management-content').addEventListener('input',event=>{if(event.target.matches('[data-purchase-qty]')){const id=event.target.dataset.purchaseQty,max=Math.max(1,Math.min(99,999-state.inventory[id],Math.floor(state.money/E.buyPrice(state,id))));purchaseQuantities[id]=Math.max(1,Math.min(max,Math.floor(Number(event.target.value)||1)));event.target.closest('article').querySelector('[data-buy]').textContent=`${purchaseQuantities[id]}개 채우기 · ${yen(purchaseQuantities[id]*E.buyPrice(state,id))}`;return;}if(event.target.id!=='menu-search')return;const pos=event.target.selectionStart;menuQuery=event.target.value;renderManagement();const input=$('menu-search');input.focus({preventScroll:true});input.setSelectionRange(pos,pos);});
  $('story-content').addEventListener('click', event => {
    if(event.target.closest('[data-story-jump]')){$('story-decision')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return;}
    const button = event.target.closest('[data-choice]');
    if (button && E.resolveEvent(state, button.dataset.choice)) { render(); $('story-dialog').scrollTop=0; toast(state.event==='pending'?'그다음 이야기가 이어집니다.':'이 선택의 소식이 다음 밤에 도착해요.'); }
  });
  const sheetIds = ['report-dialog', 'guest-dialog', 'management-dialog', 'story-dialog', 'settings-dialog'];
  function anySheetOpen() { return sheetIds.some(id => $(id).open); }
  function openSheet(id) {
    if(['settings-dialog','reset-dialog'].includes(id))FX?.stopCooking();
    for (const other of sheetIds) if (other !== id && $(other).open) $(other).close();
    if (!$(id).open) $(id).showModal();
  }
  function maybeStory() {
    if (!$('app').hidden && (state.event === 'pending'||state.nightNews.length)) $('story-open').classList.add('story-waiting'); else $('story-open').classList.remove('story-waiting');
  }
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]');
    if (!close) return;
    if(close.dataset.close==='story-dialog')window.MidnightVoice?.stop();
    $(close.dataset.close).close();
    if (close.dataset.close !== 'story-dialog') maybeStory();
  });
  $('report-content').addEventListener('click',e=>{if(e.target.closest('[data-go-shop]')){tab='shop';$('report-dialog').close();renderManagement();openSheet('management-dialog');return;}if(e.target.closest('#report-next') && E.next(state)){resetTransient();$('report-dialog').close();Scene.showArea('inside');render();}});
  $('story-open').addEventListener('click',()=>{storyRenderKey='';renderStory();openSheet('story-dialog');window.MidnightVoice?.play();});
  $('story-dialog').addEventListener('close',()=>window.MidnightVoice?.stop());
  $('story-dialog').addEventListener('click',event=>{if(event.target.closest('[data-story-voice]'))window.MidnightVoice?.toggle();if(event.target.closest('[data-story-replay]'))window.MidnightVoice?.play();});
  function soundLabel(){if(FX){$('sound-effects').textContent=FX.enabled?'게임 소리 · 켜짐':'게임 소리 · 꺼짐';$('sound-effects').setAttribute('aria-pressed',String(FX.enabled));$('ambient-sound').textContent=FX.ambientEnabled?'식당 환경음 · 켜짐':'식당 환경음 · 꺼짐';$('ambient-sound').setAttribute('aria-pressed',String(!!FX.ambientEnabled));$('ambient-sound').disabled=!FX.enabled;}}
  $('sound-effects').addEventListener('click',()=>{FX?.setEnabled(!FX.enabled);soundLabel();});
  $('ambient-sound').addEventListener('click',()=>{FX?.setAmbientEnabled(!FX.ambientEnabled);soundLabel();});soundLabel();
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
        state.nightElapsedMs=Math.min(1e9,Math.round((state.nightElapsedMs||0)+dt));
        if(now-lastClock>250){renderClock();lastClock=now;}
        for(const g of state.guests){if(g.status==='waiting'&&!anySheetOpen()){g.waitMs=(g.waitMs||0)+dt;const meter=document.querySelector(`[data-customer="${g.id}"] .wait-meter i`);if(meter)meter.style.width=`${E.patience(g,state)*100}%`;}
          if(g.status==='eating'){g.eatMs=Math.round((g.eatMs||0)+dt);if(g.eatMs>=9000){E.finishEating(state,g.id);render();}}
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
  Kitchen.init({getState:()=>state,food,toast,clearToast:()=>{$('kitchen-inline-feedback')?.remove();clearTimeout(toastTimer);$('toast').classList.remove('visible');},changed:render,save,onDeliver:g=>{Scene.showArea('inside');render();toast(`${E.person(g.person).name} 님 앞에 ${E.recipes[g.recipe].name}을 놓았어요.`);}});
  render();
  window.MidnightApp = { launch: startIntro, save, isCooking:()=>Boolean(state.kitchen) };
  if (saveMessage) toast(saveMessage);
  raf = requestAnimationFrame(frame);
})();
