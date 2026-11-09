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
  let toastTimer, feedbackTimer, raf, lastFrame = 0, openingUntil=0, lastClock=0;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? '진행 상황이 이 기기에 자동 저장됩니다.' : '저장을 사용할 수 없습니다. 창을 닫으면 진행이 사라져요.';
    return storageAvailable;
  }
  function toast(message) {
    if(!message)return;
    if(Kitchen?.isVisible()){
      let feedback=$('kitchen-inline-feedback');
      if(!feedback){feedback=document.createElement('p');feedback.id='kitchen-inline-feedback';feedback.setAttribute('role','status');$('kitchen-content').append(feedback);}
      feedback.textContent=message;clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>feedback.remove(),2200);return;
    }
    const text=document.createElement('span'),close=document.createElement('button');text.textContent=message;close.type='button';close.className='toast-close';close.textContent='×';close.setAttribute('aria-label','알림 닫기');
    close.addEventListener('click',()=>{clearTimeout(toastTimer);$('toast').classList.remove('visible');});
    $('toast').replaceChildren(text,close);$('toast').classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);
  }
  const Scene = window.MidnightScene;
  const signed = n => `${n >= 0 ? '+' : ''}${n}`;
  function portrait(p, i) { return Scene.character(i); }
  const basicFood=['rice','nori','egg','dashi','pork','miso','salmon'];
  function food(id,eaten=false,appearance='good'){if(!E.Cooking.imagePilot.includes(id))appearance='good';const item=E.ingredients[id]||E.recipes[id];const variant=E.Cooking.finalArt(id,appearance,eaten);if(variant){const{file,n,ratio}=variant;return `<span class="food-art" role="img" aria-label="${item.name}" data-food="${id}" style="--food-file:url('./assets/${file}.webp');--food-rows:200%;--food-x:${n%2*100}%;--food-y:${Math.floor(n/2)*100}%;--food-ratio:${ratio};background-size:200% 200%"></span>`;}let file,index,rows;
    if(E.recipes[id]){file=`${eaten?'used-menu':['burnt','dry'].includes(appearance)?'burnt-menu':appearance==='raw'?'raw-menu':'menu'}-${item.sheet}`;index=item.art;rows=3;}
    else{const n=Object.keys(E.ingredients).indexOf(id);file=`stock-anime-${Math.floor(n/12)+1}`;index=n%12;rows=3;}
    return `<span class="food-art" role="img" aria-label="${item.name}" data-food="${id}" style="--food-file:url('./assets/${file}.webp');--food-rows:${rows*100}%;--food-x:${index%4*100/3}%;--food-y:${Math.floor(index/4)*100/(rows-1)}%;--food-ratio:${E.recipes[id]?'3/4':'1'}"></span>`;
  }
  function levelNote(level) {
    const l = E.levels[level - 1];
    return `레벨 ${level} · 누적 ${l.xp}점 / 평판 ${l.reputation} / 만족도 ${l.satisfaction}`;
  }
  function decorArt(id){return Scene.itemArt(id);}
  function delta(n,unit=''){return `<span class="score-delta ${n>0?'gain':n<0?'loss':'no-change'}" aria-label="이번 영업 ${n>0?'상승':n<0?'하락':'변화 없음'} ${Math.abs(n)}${unit}">${n===0?'±0':signed(n)}<small>${unit}</small></span>`;}
  function requirements(level){const l=E.levels[level-1];return `성장 ${l.xp} · 평판 ${l.reputation} · 만족도 ${l.satisfaction} · 분위기 ${l.atmosphere}`;}
  function renderReport() {
    const r=E.report(state),levelled=r.level>r.previousLevel,next=r.next;
    const reviews=r.reviews.length?`<div class="night-reviews" aria-label="이번 영업 손님 리뷰">${r.reviews.map(x=>`<article class="night-review">${x.person!==null?`<span class="review-face">${portrait(E.person(x.person),x.person)}</span>`:'<span class="review-note" aria-hidden="true">★</span>'}<div><header><b>${x.guest}</b><span>★ ${(x.score/20).toFixed(1)}</span></header><p>“${x.text}”</p><small>${x.dish}</small></div></article>`).join('')}</div>`:'<p class="review-empty">음식값을 받은 손님의 리뷰가 이곳에 남아요.</p>';
    const goal=next?`<section class="next-goal"><h4>레벨 ${r.level+1}까지 ${r.remaining?`성장 ${r.remaining.toLocaleString()}점`:'조건 채우기'}</h4><div class="level-growth"><span>성장</span><b>${r.xp.toLocaleString()} / ${next.xp.toLocaleString()}</b><progress value="${Math.min(r.xp,next.xp)}" max="${next.xp}" aria-label="다음 레벨 성장 점수"></progress></div><div class="goal-chips">${[[r.reputation,next.reputation,'평판'],[r.satisfaction,next.satisfaction,'만족도'],[r.atmosphere,next.atmosphere,'분위기']].map(([v,t,label])=>`<div class="goal-condition ${v>=t?'met':''}"><header><span>${label}</span><b>${v>=t?'✓ 달성':`${t-v}점 더`}</b></header><progress value="${Math.min(v,t)}" max="${t||1}" aria-label="${label} ${v} / ${t}"></progress><small>${v} / ${t}</small></div>`).join('')}</div>${r.atmosphere<next.atmosphere?`<button data-go-shop>가게 꾸미기 · 분위기 ${next.atmosphere-r.atmosphere}점 더하기</button>`:''}</section>`:'<p class="max-level-message">백 가지 밤의 주인장이 되었어요.</p>';
    $('report-content').innerHTML=`<div class="report-heading"><span class="night-stamp">第 ${state.night} 夜</span><h3>오늘 밤도 수고했어요</h3><p>${state.nightScores.length}명 대접 · 평균 만족도 ${r.average}점</p></div><section class="growth-banner ${levelled?'level-up':''}"><span class="level-tile"><small>레벨</small><b>${r.level}</b></span><div><small>${levelled?'레벨 상승':'오늘의 성장'}</small><h3>${E.levels[r.level-1].name}</h3>${delta(r.xpDelta,'XP')}</div></section><section class="report-reputation report-metric"><div class="metric-heading"><div><h4>골목의 평판</h4><strong>${r.reputation}<small> / 100</small></strong></div>${delta(r.reputationDelta,'점')}</div>${reviews}</section><div class="report-metric-pair"><section class="report-metric"><h4>고객 만족도</h4><strong>${r.satisfaction}<small> / 100</small></strong>${delta(r.satisfactionDelta,'점')}</section><section class="report-metric"><h4>가게의 분위기</h4><strong>${r.atmosphere}<small>점</small></strong>${delta(r.atmosphereDelta,'점')}</section></div><section class="till-summary"><div class="till-heading"><span>오늘의 금고</span><strong>${yen(r.money)}</strong>${delta(r.net,'엔')}</div><div class="till-lines"><p><span>오늘 매출</span><b>${yen(r.revenue)}</b></p><p class="tip-income"><span>매출에 포함된 팁</span><b>+${yen(r.tips)}</b></p>${r.storyIncome?`<p><span>이야기의 답례</span><b class="income">+${yen(r.storyIncome)}</b></p>`:''}${r.purchases?`<p><span>재료·가게 구입</span><b class="expense">−${yen(r.purchases)}</b></p>`:''}${r.storyCosts?`<p><span>이야기에 보탠 비용</span><b class="expense">−${yen(r.storyCosts)}</b></p>`:''}<p><span>영업비 <small>임대·가스·전기</small></span><b class="expense">−${yen(r.expenses)}</b></p></div><small>총 성장 점수 ${r.xp.toLocaleString()} XP</small></section>${goal}${r.menus.length?`<section class="earned-gallery"><h4>이번 밤에 열린 새로운 한 끼</h4>${Array.from({length:Math.min(r.level,34)-r.previousLevel},(_,i)=>rewardGallery(r.previousLevel+i+1)).join('')}</section>`:''}${upcoming()}<button id="report-next" class="primary cook-button">다음 밤 준비 <span></span></button>`;
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
        setTimeout(()=>el.classList.remove('arriving'),1400);
        el.addEventListener('animationend',e=>{if(e.animationName==='counter-arrival')el.classList.remove('arriving')});
        $('customers').append(el);
      }
      el.style.setProperty('--guest-center',`${[56.23,53.3,47.67,47,57,54.63,48.94,49.63,56.31,53.85,46.6,46.66,53.35,52.9,50.94,49.84,51.82,52.86,50.63,50.33,53.76,50.89,49.9,50.85][g.person%24]}%`);
      el.classList.toggle('selected',g.id===selectedGuest);el.classList.toggle('needs-payment',g.status==='paying');
      el.classList.toggle('pleased',g.status==='eating' && g.score>=80);
      el.classList.toggle('disappointed',g.status==='eating' && g.score<60);
      el.querySelector('.customer-avatar').disabled=false;el.querySelector('.customer-avatar').setAttribute('aria-label',`${profile.name} 님과 대화하기`);el.classList.toggle('dining',g.status==='eating');
      const status={seated:'주문 준비 완료',waiting:'요리 기다려요',eating:'식사 중',paying:'계산할게요',farewell:'잘 먹었어요'},name=el.querySelector('.customer-name');
      const ready=E.menuReady(state,g);
      const serviceLabel=g.status==='seated'&&!ready?'메뉴 고르는 중':g.status==='waiting'&&state.kitchen?.guest===g.id&&state.kitchen.stage==='complete'?'음식 나왔어요':status[g.status];
      name.innerHTML=`<span class="customer-name-text">${serviceLabel}</span>`;name.hidden=false;
      name.dataset.menuReady=String(ready);name.classList.toggle('order-ready',g.status==='seated'&&ready);name.setAttribute('aria-label',`${profile.name} · ${serviceLabel}`);
      el.querySelector('.customer-avatar').setAttribute('aria-label',`${profile.name}과 이야기 나누기`);
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
  function renderTalk(){
    if(!$('guest-dialog').open)return;const g=state.guests.find(g=>g.id===selectedGuest&&g.status!=='left');if(!g){$('guest-dialog').close();return;}
    const p=E.person(g.person),profile=E.guestProfile(state,g.person),view=E.guestConversation(state,g.id),lines=view?null:talkLines(g),last=view?view.orderReady:talkIndex>=lines.length-1,other=state.kitchen&&state.kitchen.guest!==g.id;
    let action=g.status==='paying'?(last?'계산 받기 ':'계산해 드릴게요 '):g.status==='farewell'?(last?'조심히 돌아가세요 ':g.score<65?'말씀 새겨들을게요 ':g.score>=90?'맛있게 드셨다니 기뻐요 ':'들러 주셔서 고마워요 '):'편히 드세요 · 자리로 돌아가기';
    if(view)action=other?'진행 중인 요리를 먼저 마무리해 주세요':g.status==='waiting'?'접수한 주문 조리하러 가기 ':'주문 받고 부엌으로 ';
    // Keep the live mesh and controls intact through HUD/inventory/timer updates.
    if($('guest-dialog').dataset.person!==String(g.person)){$('talk-portrait').innerHTML=portrait(p,g.person);$('guest-dialog').dataset.person=g.person;}
    $('talk-name').textContent=profile.name;
    const affinity=Math.max(0,Math.min(20,state.customerBook[g.person]?.affinity||0));
    $('talk-affinity').setAttribute('aria-label',`${profile.name} 님과의 친밀도 ${affinity} / 20`);
    $('talk-affinity').title=`친밀도 ${affinity} / 20`;
    const hearts=Array.from({length:5},(_,i)=>`<span class="affinity-heart" aria-hidden="true"><svg viewBox="0 0 24 24"><path class="heart-empty" d="M12 21C9 18 2 13 2 7.5C2 1.5 9 1 12 6C15 1 22 1.5 22 7.5C22 13 15 18 12 21Z"/><path class="heart-full" style="clip-path:inset(0 ${100-Math.max(0,Math.min(1,(affinity-i*4)/4))*100}% 0 0)" d="M12 21C9 18 2 13 2 7.5C2 1.5 9 1 12 6C15 1 22 1.5 22 7.5C22 13 15 18 12 21Z"/></svg></span>`).join('');
    if($('talk-affinity').dataset.value!==String(affinity)){$('talk-affinity').innerHTML=hearts;$('talk-affinity').dataset.value=affinity;}

    $('talk-profile').textContent=profile.role||'';$('talk-profile').hidden=!profile.role;
    window.MidnightDialogue.write($('talk-line'),`${g.id}-${view?.node||talkIndex}`,view?view.line:lines[Math.min(talkIndex,lines.length-1)]);
    $('talk-player-line').hidden=!view?.playerLine;$('talk-player-words').textContent=view?.playerLine||'';
    const choicesKey=JSON.stringify([g.id,view?.node,view?.choices.map(x=>[x.id,x.label])]);
    if($('talk-choices').dataset.key!==choicesKey){$('talk-choices').dataset.key=choicesKey;$('talk-choices').replaceChildren(...(view?.choices||[]).map((choice,i)=>{const button=document.createElement('button'),number=document.createElement('span'),words=document.createElement('span');button.type='button';button.dataset.guestReply=choice.id;button.setAttribute('aria-label',choice.label);number.className='talk-choice-number';number.setAttribute('aria-hidden','true');number.textContent=String(i+1);words.textContent=choice.label;if(view.choices.length>1)button.append(number);button.append(words);return button;}));}
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
    return `<section class="upcoming"><div class="reward-heading"><span class="level-tile"><small>레벨</small><b>${next}</b></span><div><small>다음 레벨</small><h3>다음 레벨의 새로운 한 끼</h3></div></div><p class="reward-conditions">${requirements(next)}</p>${rewardGallery(next)}</section><section class="upcoming-items"><h3>다음 레벨의 아이템</h3>${itemLevel!==next?`<p class="next-item-note">다음 레벨에는 새 장식이 없어요.${itemLevel?` 아래 아이템은 레벨 ${itemLevel}에서 만나요.`:' 열린 장식으로 나만의 가게를 꾸며 보세요.'}</p>`:''}<div class="unlock-item-grid">${items.map(([id,u])=>`<article><span class="item-level-tag">레벨 ${u.level}</span>${decorArt(id)}<h4>${u.name}</h4><span class="ambience-reward">분위기 +${u.atmosphere}점</span><small>${yen(u.price)} · ${u.area==='inside'?'매장 안':'매장 밖'}</small></article>`).join('')}</div></section>`;
  }
  function renderStory(){
    const view=E.story(state),news=E.news(state),history=state.storyMemory.slice(-5).reverse(),key=JSON.stringify([view?.run,news,state.storyMemory.length,view?.run.cast.map(id=>E.guestProfile(state,id).known)]);
    if(key===storyRenderKey&&$('story-content').childElementCount){if(view?.run.step===0)for(const choice of view.definition.choices){const button=$('story-content').querySelector(`[data-choice="${choice.id}"]`);if(button)button.disabled=!E.canChoose(state,choice);}return;}storyRenderKey=key;
    $('story-tag').textContent=state.event==='pending'?'주인장의 선택 · 이어지는 이야기':'골목에 남은 기억';
    $('story-title').textContent=view?view.definition.title:'다음 밤에 도착한 소식';
    const memories=`<section class="story-journal"><h4>가게의 작은 수첩</h4>${history.length?history.map(t=>{const st=E.storyContent.stories.find(x=>x.id===t.id),c=st.choices.find(x=>x.id===t.choice);return `<details><summary>${t.night}번째 밤 · ${st.title}</summary><p>${c.result}</p></details>`}).join(''):'<p>손님 둘이 모이면 오늘 밤의 이야기가 시작돼요.</p>'}</section>`;
    const followups=news.length?`<div class="story-followups">${news.map(n=>`<p>✉ ${n.text}</p>`).join('')}</div>`:'';
    if(!view){$('story-content').innerHTML=followups+memories;return;}
    const {run,definition,choice,reflection}=view,cast=run.cast.map(id=>E.person(id));
    const text=t=>t.replaceAll('{a}',cast[0].name).replaceAll('{b}',cast[1].name);
    const faces=`<div class="story-cast-strip">${run.cast.map(id=>`<div class="story-cast-chip"><span class="story-mini-face">${portrait(E.person(id),id)}</span><span><b>${E.guestProfile(state,id).name}</b><small>${E.guestProfile(state,id).role||'아직 이야기를 나누지 않은 손님'}</small></span></div>`).join('')}</div>`;
    const dialogue=`<div class="story-chat" aria-label="손님들의 대화">${definition.lines.map((line,i)=>{
      const actor=line.startsWith('{b}')?1:line.startsWith('{a}')?0:i%2,id=run.cast[actor],p=cast[actor],words=text(line).replace(new RegExp('^'+p.name+'[：:]\\s*'),'');
      return `<article class="story-message ${actor?'from-right':''}" data-speaker="${id}"><div class="story-chat-face" aria-label="${E.guestProfile(state,id).name}">${portrait(p,id)}</div><div class="story-message-body"><b>${E.guestProfile(state,id).name}</b><p>${words}</p></div></article>`;
    }).join('')}</div>`;
    const prompt=(n,title)=>`<div class="story-choice-heading"><span>${n} / 2 · 당신의 선택</span><h3>${title}</h3><p>마음이 가는 행동 하나를 골라 주세요.</p></div>`;
    if(run.step===0){
      $('story-content').innerHTML=followups+faces+`<div class="story-scene"><span>오늘 밤, 카운터에서</span><p>${definition.intro}</p></div>`+dialogue+`<section id="story-decision">`+prompt(1,'주인장인 당신은 어떻게 할까요?')+`<div class="story-choices">${definition.choices.map((c,i)=>{
        const available=E.canChoose(state,c),cost=[c.money<0?`${yen(-c.money)} 사용`:'',...Object.entries(c.ingredients||{}).map(([id,n])=>`${E.ingredients[id].name} ${n}개`)].filter(Boolean).join(' · ');
        return `<button class="story-choice-card" data-choice="${c.id}" ${available?'':'disabled'}><span class="choice-number">${available?String(i+1):'잠김'}</span><span class="choice-copy"><b>${c.label}</b><small>${available?cost||'부담 없이 이야기를 나눠요':`${cost} 필요 · 냉장고에서 준비해 주세요`}</small></span><span class="choice-arrow" aria-hidden="true">${available?'':'◇'}</span></button>`;
      }).join('')}</div></section>`;return;
    }
    if(run.step===1){$('story-content').innerHTML=faces+`<div class="story-result"><span>당신의 마음이 닿았어요</span><p>${choice.result}</p></div>`+prompt(2,'이 밤을 어떻게 남길까요?')+`<div class="story-choices">${E.storyContent.reflection.map((c,i)=>`<button class="story-choice-card" data-choice="${c.id}"><span class="choice-number">${i+1}</span><span class="choice-copy"><b>${c.label}</b><small>${i?'다음 만남을 약속해요':'오늘의 기억을 간직해요'}</small></span><span class="choice-arrow" aria-hidden="true"></span></button>`).join('')}</div>`;return;}
    $('story-content').innerHTML=followups+faces+`<div class="story-result"><span>오늘 밤의 이야기</span><p>${choice?.result||'오늘 손님들과 나눈 이야기가 가게의 기억으로 남았어요.'}</p></div><p class="story-memory">${reflection?.text||''}</p><p class="story-next">다음 영업일에 이 선택의 소식이 도착해요.</p><button class="story-finish primary" data-close="story-dialog">이 온기를 안고 가게로 돌아가기 </button>`+memories;
  }

  function renderShop(){
    const F=E.F,benefits=F.benefits(state),themes=F.themes,active=F.activeItems(state),filter=shopTheme==='all'?null:Number(shopTheme),entries=Object.entries(E.upgrades).filter(([,u])=>filter===null||u.theme===filter);
    const collection=filter===null?'':(()=>{const n=active.filter(id=>E.upgrades[id].theme===filter).length;return `<section class="collection-goal"><div><b>${themes[filter].name}</b><span>${n} / 15 꾸미기</span></div><p>같은 모음 5종이면 팁 +3%, 10종이면 +6%. 서로 다른 자리를 함께 꾸며 보세요.</p><progress value="${n}" max="15"></progress><img src="./assets/room-collection-${filter}.webp" alt="${themes[filter].name} 모음을 모두 꾸민 매장" loading="lazy"></section>`})();
    $('management-content').innerHTML=`<section class="shop-benefits"><b>내 가게의 온기 <strong>${E.atmosphere(state)}점</strong></b><p>팁 +${benefits.tips}% · 기다림 +${benefits.patience}초${benefits.discount?` · 재료 −${benefits.discount}%`:''}</p><small>새 모양을 들이면 같은 자리에 교체돼요. 보유한 물건은 언제든 다시 놓을 수 있어요.</small></section><div class="collection-filters" aria-label="꾸미기 모음"><button data-shop-theme="all" class="${shopTheme==='all'?'active':''}">전체 60종</button>${themes.map(t=>`<button data-shop-theme="${t.id}" class="${shopTheme===String(t.id)?'active':''}">${t.name}</button>`).join('')}</div>${collection}<div class="upgrade-grid item-shop-grid">${entries.map(([id,u])=>{const owned=F.count(state,id),equipped=F.activeId(state,u.slot)===id,max=u.max-owned,q=Math.max(1,Math.min(upgradeQuantities[id]||1,max||1));upgradeQuantities[id]=q;return `<article class="upgrade-card furnish-card ${state.level<u.level?'locked':''}" data-furnishing="${id}"><span class="item-level-tag">레벨 ${u.level}</span><div class="furnishing-picture">${decorArt(id)}</div><h3>${u.name}</h3><span class="ambience-reward">분위기 +${u.atmosphere}${u.max>1?' / 개':'점'}</span><p class="item-benefit">${F.benefitText(id)}</p><p class="item-location">${E.F.slots[u.slot].place}${owned?` · ${owned}개 보유`:''}</p>${(()=>{const current=F.activeId(state,u.slot);if(!current||current===id)return '';const d=u.atmosphere*(owned||q)-E.upgrades[current].atmosphere*F.count(state,current);return `<small class="replace-delta ${d<0?'negative':''}">교체하면 분위기 ${d>=0?'+':''}${d}점</small>`;})()}${u.max>1&&max&&state.level>=u.level?`<div class="quantity-stepper lamp-quantity"><button data-furnish-qty="-1" aria-label="조명 구매 수량 줄이기" ${q<=1?'disabled':''}>−</button><input data-lamp-qty="${id}" value="${q}" type="number" inputmode="numeric" min="1" max="${max}" aria-label="${u.name} 구매 수량"><button data-furnish-qty="1" aria-label="조명 구매 수량 늘리기" ${q>=max?'disabled':''}>+</button></div>`:''}${owned&&!equipped?`<button data-equip="${id}">보유한 물건 놓기</button>`:owned?`<small class="item-installed">✓ ${owned}개 배치 중</small>`:''}<button data-upgrade="${id}" ${!max||state.money<u.price*q||state.level<u.level?'disabled':''}>${state.level<u.level?`레벨 ${u.level}에 해제`:!max?'모두 보유 중':`${yen(u.price*q)} · ${u.max>1?q+'개 ':''}들여놓기`}</button></article>`}).join('')}</div>`;
  }
  function renderManagement() {
    $('management-dialog').dataset.section=tab;
    const rescue = E.rescueNeeds(state) ? '<div class="rescue-box"><span>재료 살 돈이 부족한가요? 이웃 상인이 이번 주문에 필요한 재료를 나눠 줘요.</span><button data-rescue="true">도움받기 · 평판 −3</button></div>' : '';
    syncDockState();
    $('management-title').textContent = { pantry: '냉장고', menu: '메뉴 관리', shop: '가게 꾸미기' }[tab];
    if (tab === 'pantry') {
      $('management-content').innerHTML=`${rescue}<p class="management-note">수량을 정해 한 번에 채워 두세요.<span>재료 그림을 누르면 1개씩 바로 추가돼요.</span></p><div class="stock-grid">${Object.entries(E.ingredients).map(([id,item])=>{
        const open=E.ingredientAvailable(state,id),max=Math.max(0,Math.min(99,999-state.inventory[id],Math.floor(state.money/E.buyPrice(state,id)))),q=Math.max(1,Math.min(purchaseQuantities[id]||1,max||1));purchaseQuantities[id]=q;
        return `<article class="stock-card stock-quantity-card ${open?'':'ingredient-locked'}" data-stock-id="${id}"><button class="stock-icon quick-stock" data-quick-buy="${id}" ${!open||!max?'disabled':''} aria-label="${item.name} 1개 바로 채우기">${food(id)}</button><div class="stock-copy"><h3>${item.name}</h3><span>재고 <b>${state.inventory[id]}</b>개</span></div>${open?`<div class="quantity-stepper"><button data-qty-step="-1" ${q<=1?'disabled':''} aria-label="${item.name} 구매 수량 줄이기">−</button><input data-purchase-qty="${id}" type="number" inputmode="numeric" min="1" max="${max||1}" value="${q}" aria-label="${item.name} 구매 수량"><button data-qty-step="1" ${q>=max?'disabled':''} aria-label="${item.name} 구매 수량 늘리기">+</button></div>`:'<span class="stock-lock-note">레벨을 올리면 사용할 수 있어요.</span>'}<button class="stock-buy" data-buy="${id}" ${!open||!max?'disabled':''}>${open?`${q}개 채우기 · ${yen(q*E.buyPrice(state,id))}`:`레벨 ${item.level}에 해제`}</button></article>`;
      }).join('')}</div>`;
    } else if(tab==='menu'){
      const entries=Object.entries(E.recipes),matches=entries.filter(([,r])=>(menuFilter==='all'||menuFilter==='available'&&r.level<=state.level||Number(menuFilter)===r.level)&&(!menuQuery||r.name.includes(menuQuery)));
      $('management-content').innerHTML=`<p class="management-note">레벨마다 새 메뉴 3개 · 전체 100종 · 지금 ${entries.filter(([,r])=>r.level<=state.level).length}개를 만들 수 있어요.<span>오늘의 추천: ${E.recipes[state.special].name}</span></p><div class="menu-filters"><button data-menu-filter="all" class="${menuFilter==='all'?'active':''}">전체 100</button><button data-menu-filter="available" class="${menuFilter==='available'?'active':''}">지금 가능</button>${Array.from({length:34},(_,i)=>`<button data-menu-filter="${i+1}" class="${menuFilter===String(i+1)?'active':''}">레벨 ${i+1}</button>`).join('')}</div><input id="menu-search" type="search" aria-label="음식 이름 찾기" placeholder="먹고 싶은 음식 찾기" value="${menuQuery.replaceAll('&','&amp;').replaceAll('"','&quot;')}"><div class="menu-grid">${matches.map(([id,r])=>{const open=r.level<=state.level;return `<article class="menu-card ${open?'available':'locked'}"><div class="menu-picture">${food(id)}${open?'':`<span class="menu-lock">레벨 ${r.level}에 해제</span>`}</div><small>레벨 ${r.level}</small><h3>${r.name}</h3><p>${r.ingredients.map(id=>E.ingredients[id].name).join(' · ')}</p><span class="menu-price">${yen(r.price)}부터</span>${open?`<button data-special="${id}" ${state.special===id||state.phase==='open'?'disabled':''}>${state.special===id?'✓ 오늘의 추천':state.phase==='open'?'다음 영업 전에 추천 변경':'오늘의 추천으로 정하기'}</button>`:`<button disabled aria-label="${r.name} 레벨 ${r.level}에 해제">레벨 ${r.level} 도달 시 바로 조리 가능</button>`}</article>`}).join('')}</div>${upcoming()}`;
    } else { renderShop();
    }
  }
  function renderStockPrep(){
    const panel=$('stock-prep');panel.hidden=state.phase!=='prep';if(panel.hidden)return;
    const full=E.stockPlan(state,9),small=E.stockPlan(state,3),chosen=!prepExpanded?(state.prepChoice||(small.units===0&&full.units>0?3:null)):null,plan=chosen===3?small:full;
    panel.innerHTML=`<div class="stock-prep-heading"><span>오늘의 영업 준비</span><h3>${!plan.units?'재료 준비가 끝났어요':'단골이 오기 전에, 냉장고부터'}</h3><p>${chosen===3?'가볍게 준비하고, 영업 중에도 재료를 채울 수 있어요.':'오늘 메뉴에 필요한 재료를 확인하고, 부족한 만큼 채워요.'}</p></div><div class="stock-prep-list">${plan.lines.map(x=>`<span class="${x.quantity?'stock-short':'stock-ready'}">${food(x.id)}<b>${E.ingredients[x.id].name}</b><small>${x.owned} / ${x.target}개 ${x.quantity?`· +${x.quantity} 필요`:'· 준비됨'}</small></span>`).join('')}</div>${plan.units?`<button class="primary stock-bulk-main" data-restock="${chosen===3?3:9}" ${state.money<plan.cost?'disabled':''}>부족한 재료 채우기 · ${yen(plan.cost)}</button>`:'<p class="stock-prepared-check">✓ 이제 식당 불을 켜고 손님을 맞이해요.</p>'}${!chosen&&small.units?`<button class="stock-bulk-small" data-restock="3" ${state.money<small.cost?'disabled':''}>가볍게 준비하기 · ${yen(small.cost)}</button>`:''}${chosen?'<button class="change-prep-plan" data-prep-reset>준비량 다시 고르기</button>':''}${state.money<plan.cost&&plan.units?'<small class="stock-budget-note">필요한 재료부터 준비하고 영업 수익으로 더 채워 주세요.</small>':''}`;
  }
  function renderClock(){
    const minutes=Math.floor(window.MidnightDaylight?.minutes(state)??(state.phase==='prep'?1430:state.phase==='end'?420:30));
    const label=`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
    $('clock').setAttribute('aria-label',`게임 시간 ${Math.floor(minutes/60)}시 ${minutes%60}분`);
    $('clock').title=label;
    $('clock-hour').setAttribute('transform',`rotate(${(minutes%720)*.5} 50 50)`);
    $('clock-minute').setAttribute('transform',`rotate(${(minutes%60)*6} 50 50)`);
    window.MidnightDaylight?.update(state);
  }
  function render() {
    $('money').textContent=yen(cashAnimation?Math.round(cashAnimation.from):state.money);
    $('reputation').innerHTML = `${state.reputation} <small>/ 100</small>`;
    const nightLabel=`${state.night}번째 밤`;
    $('day').setAttribute('aria-label',nightLabel);
    $('calendar-open').setAttribute('aria-label',`${nightLabel} · 영업 달력 열기`);
    if($('day').dataset.night!==String(state.night)){
      const number=document.createElement('span'),caption=document.createElement('span');
      number.className='night-date-number';number.textContent=state.night;
      caption.className='night-date-caption';caption.textContent='번째 밤';
      const turned=Boolean($('day').dataset.night);
      $('day').replaceChildren(number,caption);$('day').dataset.night=state.night;
      if(turned&&!matchMedia('(prefers-reduced-motion: reduce)').matches)$('day').animate([{transform:'perspective(180px) rotateX(-55deg)',opacity:.5},{transform:'perspective(180px) rotateX(0deg)',opacity:1}],{duration:280,easing:'ease-out'});
    }
    $('open-status').textContent = state.phase === 'prep' ? '영업 준비' : state.phase === 'end' ? '오늘 영업 끝' : '영업 중';
    renderClock();
    if($('hud-detail-dialog').open)renderHudDetail();
    const canClose = E.canClose(state);
    const serving=state.phase==='open'&&!canClose;
    $('night-action').hidden=serving;
    $('night-action').disabled=serving;
    $('service-progress').hidden=!serving;
    $('service-progress').innerHTML=`<span>손님맞이 <b>${Math.min(3,Math.floor(state.nightScores.length/3)+1)} / 3</b></span><i aria-hidden="true"></i><span>대접 <b>${state.nightScores.length} / ${state.target}</b></span>`;
    document.querySelector('.service-bar').classList.toggle('is-serving',serving);
    $('night-action').innerHTML = state.phase === 'prep' ? '식당 불 켜기 <span></span>' : state.phase === 'end' ? '오늘의 영업보고 <span></span>' : canClose ? '밤 마무리하기 · 영업보고 <span>☾</span>' : '';
    $('service-hint').textContent = state.phase === 'prep' ? (E.stockPlan(state,3).units?'아래 재료 준비를 먼저 확인해 주세요.':'재료가 준비됐어요. 식당 불을 켜고 손님을 맞이해요.') : state.phase === 'end' ? '재료를 채워 두면 다음 밤이 더 든든해져요.' : canClose ? '9명의 손님을 대접했어요! 아래 밤 마무리하기를 눌러 영업보고를 확인하세요.' : state.event === 'pending' ? '손님들의 이야기가 이어지고 있어요.\n빨간 알림이 있는 이야기 메뉴를 눌러 답해 주세요.' : state.guests.some(g=>g.status==='paying')?'식사를 마친 손님의 별점 위 금액을 눌러 결제해 주세요.':'손님을 눌러 대화하고 주문을 받아 주세요.';
    $('night-action').classList.toggle('close-ready',canClose);
    const nextLevel=E.levels.find(l=>l.level>state.level);
    const remaining=nextLevel?Math.max(0,nextLevel.xp-state.xp):0,conditions=nextLevel?[[state.reputation,nextLevel.reputation,'평판'],[E.satisfaction(state),nextLevel.satisfaction,'만족도'],[E.atmosphere(state),nextLevel.atmosphere,'분위기']]:[];
    $('progress-hud').innerHTML=`<b class="hud-level" aria-label="레벨 ${state.level}"><strong>${state.level}</strong></b><div class="hud-growth"><span>${nextLevel?`레벨 ${nextLevel.level}까지 <strong>${remaining?remaining.toLocaleString()+'점 더':'성장 달성'}</strong>`:'최고 레벨 달성'}</span><progress value="${nextLevel?Math.min(state.xp,nextLevel.xp):1}" max="${nextLevel?.xp||1}" aria-label="${nextLevel?'다음 레벨까지 '+remaining+'점':'최고 레벨'}"></progress></div><div class="hud-conditions">${conditions.map(([v,t,label])=>`<span class="${v>=t?'met':''}" title="${label} ${v} / ${t}" aria-label="${label} ${v}점, 목표 ${t}점${v>=t?', 달성':''}">${label} <b>${v>=t?'✓':(t-v)+'점 더'}</b></span>`).join('')}</div>`;
    renderStockPrep();renderScene();renderTalk();renderStory();renderManagement();save();
    const storyAttention=E.storyNeedsAttention(state);
    $('story-badge').hidden=!storyAttention;
    $('story-open').setAttribute('aria-label',storyAttention?'손님 이야기 열기 · 새 알림 있음':'손님 이야기 열기');
    if (state.phase==='end') renderReport();
    maybeStory();
  }
  function tryArrival() {
    if (performance.now()<openingUntil || Scene.isPlacing() || $('app').hidden || $('intro').open || document.hidden || $('settings-dialog').open || $('reset-dialog').open) return;
    const g = E.arrive(state);
    if (g) { E.conversation(state); render(); }
  }
  function resetTransient(){Kitchen.clearCheckpoint?.();prepExpanded=false;selectedGuest=null;talkIndex=0;Kitchen.hide();}
  $('stock-prep').addEventListener('click',event=>{if(event.target.closest('[data-prep-reset]')){state.prepChoice=null;prepExpanded=true;renderStockPrep();save();return;}const button=event.target.closest('[data-restock]');if(!button||button.disabled)return;const result=E.restock(state,Number(button.dataset.restock));if(result){prepExpanded=false;FX?.play('buy');render();}});
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
  // Dismiss only a complete outside tap, never a drag that started in the panel.
  const guestDialog=$('guest-dialog');
  let guestOutsidePress=false;
  function outsideGuestPanel(event){
    const rect=guestDialog.getBoundingClientRect();
    return event.target===guestDialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);
  }
  guestDialog.addEventListener('pointerdown',event=>{guestOutsidePress=outsideGuestPanel(event);});
  guestDialog.addEventListener('pointercancel',()=>{guestOutsidePress=false;});
  guestDialog.addEventListener('click',event=>{
    if(guestOutsidePress&&outsideGuestPanel(event)){guestDialog.close();maybeStory();}
    guestOutsidePress=false;
  });
  guestDialog.addEventListener('close',()=>{guestOutsidePress=false;});
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
    const button = event.target.closest('[data-choice]');
    if (button && E.resolveEvent(state, button.dataset.choice)) { render(); $('story-dialog').scrollTop=0; toast(state.event==='pending'?'그다음 이야기가 이어집니다.':'이 선택의 소식이 다음 밤에 도착해요.'); }
  });
  const sheetIds = ['report-dialog', 'guest-dialog', 'management-dialog', 'story-dialog', 'settings-dialog', 'hud-detail-dialog', 'calendar-dialog'];
  let hudDetail='funds';
  function syncDockState() {
    $('calendar-open').setAttribute('aria-expanded',String($('calendar-dialog').open));
    for(const kind of ['funds','reputation'])$(kind+'-open').setAttribute('aria-expanded',String($('hud-detail-dialog').open&&hudDetail===kind));
    for (const button of document.querySelectorAll('.game-dock>button')) {
      const panel=button.id==='story-open'?'story-dialog':'management-dialog';
      const expanded=$(panel).open&&(panel==='story-dialog'||button.dataset.tab===tab);
      button.classList.toggle('active',expanded);
      button.setAttribute('aria-expanded',String(expanded));
      button.setAttribute('aria-controls',panel);
      button.removeAttribute('aria-pressed');
    }
  }
  for (const id of sheetIds) $(id).addEventListener('close',syncDockState);
  const dockPanels=new MutationObserver(syncDockState);
  for (const id of ['management-dialog','story-dialog']) dockPanels.observe($(id),{attributes:true,attributeFilter:['open']});
  function anySheetOpen() { return sheetIds.some(id => $(id).open); }
  function openSheet(id) {
    if(['settings-dialog','reset-dialog'].includes(id))FX?.stopCooking();
    for (const other of sheetIds) if (other !== id && $(other).open) $(other).close();
    if (!$(id).open) $(id).showModal();
    syncDockState();
  }
  function maybeStory() {
    $('story-open').classList.remove('story-waiting');
    syncDockState();
  }
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]');
    if (!close) return;
    $(close.dataset.close).close();
    maybeStory();
  });
  $('report-content').addEventListener('click',e=>{if(e.target.closest('[data-go-shop]')){tab='shop';$('report-dialog').close();renderManagement();openSheet('management-dialog');return;}if(e.target.closest('#report-next') && E.next(state)){resetTransient();$('report-dialog').close();Scene.showArea('inside');render();}});
  $('story-open').addEventListener('click',()=>{E.markStoryRead(state);storyRenderKey='';render();openSheet('story-dialog');});
  function soundLabel(){if(FX){$('sound-effects').textContent=FX.enabled?'조리·게임 효과음 · 켜짐':'조리·게임 효과음 · 꺼짐';$('sound-effects').setAttribute('aria-pressed',String(FX.enabled));}}
  $('sound-effects').addEventListener('click',()=>{FX?.setEnabled(!FX.enabled);soundLabel();});soundLabel();
  function renderHudDetail(){
    const r=E.report(state),next=E.levels[state.level],line=(name,value)=>`<p><span>${name}</span><b>${value}</b></p>`;
    $('hud-detail-title').textContent=hudDetail==='funds'?'자금 상세':'평판 상세';
    if(hudDetail==='funds'){
      const expected=650+(state.phase==='prep'?state.level:state.nightStart.level)*250;
      if(state.phase==='prep'){
        $('hud-detail-content').innerHTML=`<section class="till-summary"><div class="till-heading"><span>현재 보유 자금</span><strong>${yen(state.money)}</strong></div></section><p class="hud-detail-note">개점 전 재료·가게 구입 비용은 보유 자금에 바로 반영돼요. 음식 매출과 팁 등 이번 밤의 내역은 식당 불을 켠 뒤부터 새로 집계돼요.</p><p class="hud-detail-note">영업을 마치면 임대·가스·전기 비용 ${yen(expected)}이 보유 자금 한도에서 정산돼요.</p>`;return;
      }
      $('hud-detail-content').innerHTML=`<section class="till-summary"><div class="till-heading"><span>현재 보유 자금</span><strong>${yen(state.money)}</strong></div><div class="till-lines">${line('이번 밤 시작 자금',yen(state.nightStart.money))}${line('음식 매출 · 팁 포함','+'+yen(r.revenue))}${line('매출에 포함된 팁',yen(r.tips))}${line('이야기의 답례','+'+yen(r.storyIncome))}${line('재료·가게 구입','−'+yen(r.purchases))}${line('이야기에 보탠 비용','−'+yen(r.storyCosts))}${line('정산된 영업비','−'+yen(r.expenses))}${line('시작 대비 증감',(r.net<0?'−':'+')+yen(Math.abs(r.net)))}</div></section><p class="hud-detail-note">${state.phase==='end'?'이번 밤 영업비 정산이 끝났어요.':`영업을 마치면 임대·가스·전기 비용 ${yen(expected)}이 보유 자금 한도에서 정산돼요.`} 음식 매출은 손님에게 음식값을 받았을 때 반영돼요.</p>`;
    }else{
      $('hud-detail-content').innerHTML=`<section class="report-metric"><h3>골목의 평판</h3><strong>${r.reputation}<small> / 100</small></strong>${delta(r.reputationDelta,'점')}<p>음식값을 받은 손님의 만족도에 따라 평판이 바뀌어요.</p><div class="hud-reputation-rules">${line('85점 이상','+4')}${line('65–84점','+2')}${line('40–64점','−1')}${line('40점 미만','−4')}</div><p>이야기의 선택, 가게 꾸미기, 손님 응대도 평판에 영향을 줘요.</p></section><section class="next-goal"><h4>${next?`레벨 ${next.level} 성장 조건`:'최고 레벨 달성'}</h4>${next?`<div class="hud-reputation-rules">${[[state.xp,next.xp,'성장 점수'],[state.reputation,next.reputation,'평판'],[E.satisfaction(state),next.satisfaction,'만족도'],[E.atmosphere(state),next.atmosphere,'분위기']].map(([v,t,n])=>line(n,`${v} / ${t}${v>=t?' · 달성':''}`)).join('')}</div><p>네 가지 조건을 모두 채우면 레벨이 올라요.</p>`:''}</section>`;
    }
  }
  for(const kind of ['funds','reputation'])$(kind+'-open').addEventListener('click',()=>{hudDetail=kind;renderHudDetail();openSheet('hud-detail-dialog');});
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
    enterGame();
  }
  function enterGame() { $('app').hidden=false;lastFrame=0;render();if(state.kitchen)Kitchen.show(); }
  function saveForUpdate(){return save() && Kitchen.checkpoint?.()!==false;}
  function resumeAfterUpdate(){if(state.introSeen)enterGame();else startIntro();}
  function startIntro() {
    if ($('intro').open) return;
    for (const id of sheetIds) if ($(id).open) $(id).close();
    $('app').hidden = true;
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
        for(const g of state.guests){if(g.status==='seated'&&document.querySelector(`[data-customer="${g.id}"] .customer-name`)?.dataset.menuReady!==String(E.menuReady(state,g))){renderScene();renderTalk();save();}if(g.status==='waiting'&&!anySheetOpen()){g.waitMs=(g.waitMs||0)+dt;const meter=document.querySelector(`[data-customer="${g.id}"] .wait-meter i`);if(meter)meter.style.width=`${E.patience(g,state)*100}%`;}
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
  Kitchen.init({getState:()=>state,food,toast,openPantry:()=>{tab='pantry';renderManagement();openSheet('management-dialog');},clearToast:()=>{$('kitchen-inline-feedback')?.remove();clearTimeout(toastTimer);$('toast').classList.remove('visible');},changed:render,save,onDeliver:g=>{Scene.showArea('inside');render();toast(`${E.person(g.person).name} 님 앞에 ${E.recipes[g.recipe].name}을 놓았어요.`);}});
  render();
  window.MidnightCalendar.init({getState:()=>state,open:()=>openSheet('calendar-dialog')});
  window.MidnightApp = { launch:startIntro,resumeAfterUpdate,save,saveForUpdate,canApplyUpdate:()=>!state.kitchen&&!anySheetOpen()&&!Scene.isPlacing()&&!cashAnimation&&performance.now()>=openingUntil,isCooking:()=>Boolean(state.kitchen) };
  if (saveMessage) toast(saveMessage);
  raf = requestAnimationFrame(frame);
})();
