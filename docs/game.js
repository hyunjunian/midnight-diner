(() => {
  'use strict';
  const E = window.MidnightEngine;
  const KEY = 'midnight-diner-save-v5';
  const $ = id => document.getElementById(id);
  const yen = n => `¥${n.toLocaleString('ja-JP')}`;
  let state, storageAvailable = true, saveMessage = '';
  try { state = E.restore(localStorage.getItem(KEY) || localStorage.getItem('midnight-diner-save-v4') || localStorage.getItem('midnight-diner-save-v2'), localStorage.getItem('midnight-diner-save-v1')); }
  catch { state = E.fresh(); saveMessage = '저장 정보를 읽지 못해 새 식당을 준비했습니다.'; }
  let selectedGuest = null, selected = [], cooking = null, result = null, tab = 'pantry';
  let menuFilter='all',menuQuery='';
  const seenCustomers = new Set();
  let toastTimer, raf, lastFrame = 0;
  const leaves = new Map();
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
  function food(id){const item=E.ingredients[id]||E.recipes[id];let file,index,rows;
    if(E.recipes[id]){file=`menu-${item.sheet}`;index=item.art;rows=3;}
    else if(item.sheet){file=item.sheet;index=item.art%12;rows=3;}
    else{file='food-clean';index=basicFood.indexOf(id);rows=4;}
    return `<span class="food-art" role="img" aria-label="${item.name}" data-food="${id}" style="--food-file:url('./assets/${file}.webp');--food-rows:${rows*100}%;--food-x:${index%4*100/3}%;--food-y:${Math.floor(index/4)*100/(rows-1)}%;--food-ratio:${rows===3?'3/4':'1'}"></span>`;
  }
  function ingredientPicker(g,r) {
    const missing=r.ingredients.filter(id=>!selected.includes(id));
    const message=cooking?'손질·불 조절 중에는 재료를 바꿀 수 없어요. 아래 조리 버튼을 사용하세요.':missing.length?`${missing.map(id=>E.ingredients[id].name).join(' · ')}을(를) 선택해 주세요. 재고가 없으면 바로 채울 수 있어요.`:'필수 재료가 준비됐어요. 아래에서 손질을 시작하세요.';
    const ingredientCards=requiredOnly=>Object.entries(E.ingredients).filter(([id])=>r.ingredients.includes(id)===requiredOnly).map(([id,item])=>{
      const required=r.ingredients.includes(id),empty=state.inventory[id]===0,cost=E.buyPrice(state,id);
      const status=cooking?'조리 중 · 변경 불가':empty?(required?'재고 없음':'다른 요리용 · 재고 없음'):selected.includes(id)?'✓ 선택됨':required?'필수 재료 · 눌러 선택':'다른 요리용';
      return `<article class="ingredient-slot ${required?'required':''}"><button data-ingredient="${id}" aria-pressed="${selected.includes(id)}" aria-label="${item.name}: ${status}" class="ingredient ${selected.includes(id)?'picked':''}" ${cooking||empty?'disabled':''}>${food(id)}<strong>${item.name}</strong><small>재고 ${state.inventory[id]}개</small><span class="ingredient-state">${status}</span></button>${empty&&!cooking?`<button data-kitchen-buy="${id}" class="refill-button" ${state.money<cost?'disabled':''}>${state.money<cost?`${yen(cost)} 필요`:`1개 채우기 · ${yen(cost)}`}</button>`:''}</article>`;
    }).join('');
    return `<div class="prep-step"><div class="step-title"><b>01</b><h4>재료 준비</h4><small>재료당 1개</small></div><p class="prep-guidance" role="status">${message}</p><div class="ingredient-picker">${ingredientCards(true)}</div><details class="other-ingredients"><summary>다른 재료 보기 · 주문과 다르면 감점될 수 있어요</summary><div class="ingredient-picker">${ingredientCards(false)}</div></details>${!cooking&&E.rescueNeeds(state)?'<div class="rescue-box">구매 자금이 부족하면 이웃에게 이번 주문의 재료를 도움받을 수 있어요.<button data-kitchen-rescue>재료 도움받기 · 평판 −3</button></div>':''}${!cooking&&!missing.length?'<button data-jump-cook class="jump-cook">손질 시작 버튼으로 이동 ↓</button>':''}</div>`;
  }
  function levelNote(level) {
    const l = E.levels[level - 1];
    return `Lv.${level} · 누적 ${l.xp}점 / 평판 ${l.reputation} / 만족도 ${l.satisfaction}`;
  }
  function profile(g) {
    const p = E.person(g.person), c = state.customerBook[g.person];
    return `<section class="guest-profile"><div class="profile-portrait ${g.status==='waiting'?'talking':''}">${portrait(p,g.person)}</div><div><span class="eyebrow">GUEST PROFILE</span><h3>${p.name} ${E.regular(state,g.person)?'<small class="regular-badge">단골</small>':''}</h3><p>${p.role} / ${p.age}</p><p>${p.style}</p><p class="profile-bio">${p.bio}</p><small>${c?.visits>1?'다시 찾아온 손님':'처음 찾아온 손님'}<br>만족도 90 이상이면 단골로 재방문할 확률이 올라가요!</small></div></section>${E.regular(state,g.person)?`<button data-gift="${g.id}" class="gift-button" ${g.gifted||g.status!=='waiting'||!state.inventory.egg?'disabled':''}>${g.gifted?'✓ 달걀 곁들임을 서비스했어요':g.status!=='waiting'?'서비스는 조리 전에 준비해요':`단골 서비스 · 달걀 곁들임 (달걀 1개 · 만족도 +5)`}</button>`:''}`;
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
        el.innerHTML=`<button class="customer-avatar" data-guest="${g.id}" aria-label="${p.name} 프로필 보기">${portrait(p,g.person)}</button><button class="customer-name" data-guest="${g.id}"></button><span class="wait-meter" aria-hidden="true"><i></i></span>`;
        el.addEventListener('animationend',e=>{if(e.animationName==='counter-arrival')el.classList.remove('arriving')});
        $('customers').append(el);
      }
      el.classList.toggle('selected',g.id===selectedGuest);
      el.classList.toggle('pleased',g.status==='eating' && g.score>=80);
      el.classList.toggle('disappointed',g.status==='eating' && g.score<60);
      el.querySelector('.customer-avatar').disabled=Boolean(cooking);
      el.querySelector('.customer-name').textContent=`${p.name}${E.regular(state,g.person)?' · 단골':''}${g.status==='waiting'?' · 주문':' · 식사 중'}`;
      const patience=E.patience(g);el.querySelector('.wait-meter i').style.width=`${patience*100}%`;el.classList.toggle('waiting-long',patience<.3);
    }
    $('scene').classList.toggle('is-prep',state.phase==='prep');
    Scene.render(state,selectedGuest,cooking);
  }
  function renderOrder() {
    const g = state.guests.find(g => g.id === selectedGuest && g.status !== 'left');
    if (state.phase === 'end') {
      $('order-panel').innerHTML = '<div class="kitchen-idle"><h3>오늘 영업을 마쳤어요.</h3><button id="show-report" class="primary cook-button">오늘의 영업보고 보기 →</button></div>'; return;
    }
    if(g?.status==='eating') { $('order-panel').innerHTML = `${profile(g)}<p class="guest-line">“${g.score>=85?'참 맛있었어요. 다음에 또 올게요.':g.score>=60?'따뜻한 한 끼, 잘 먹었습니다.':'다음에는 조금 더 잘 부탁해요.'}”</p><div class="recipe-slip"><strong>식사 만족도 ${g.score}점</strong><p>${g.score>=90?state.customerBook[g.person].dueLevel<=E.levels.length?`Lv.${state.customerBook[g.person].dueLevel} 이후 재방문 예정이에요.`:'최고 레벨의 식당을 좋은 추억으로 기억해요.':'다음 방문에는 더 맛있는 한 끼를 준비해요.'}</p></div>`;return; }
    if (!g) {
      $('order-panel').innerHTML = `${result ? `<div class="receipt"><span>${result.score >= 85 ? '참 따뜻한 한 끼였어요.' : result.score >= 60 ? '잘 먹었습니다.' : '다음에는 조금 더 정성스럽게.'}</span><h3>${result.guest}의 ${result.dish}</h3><div class="receipt-score">${result.score}<small> / 100</small></div><p class="fine-print">손질 ${result.preparation} · 불 조절 ${result.heat} · 대기 감점 ${result.waitPenalty}</p><p>음식값 ${yen(result.base)} <b>+ 팁 ${yen(result.tip)}</b></p><button data-close="kitchen-dialog" class="primary cook-button">식당으로 돌아가기 <span>→</span></button></div>` : `<div class="kitchen-idle"><span class="big-icon">${food(state.special)}</span><h3>${state.phase === 'prep' ? '분주함도, 잠깐 쉬어 가는 곳.' : '손님의 주문을 들어볼까요?'}</h3><p>${state.phase === 'prep' ? '냉장고를 살피고 오늘의 한 접시를 골라요.<br>준비가 되면 식당의 불을 켜 주세요.' : '바 건너편의 손님을 눌러 보세요.<br>서두르지 않아도 괜찮아요.'}</p></div>`}<ol class="how-to"><li><b>01</b><span>손님을 눌러 주문을 확인해요.</span></li><li><b>02</b><span>냉장고에서 재료를 꺼내요.</span></li><li><b>03</b><span>알맞게 익혀 따뜻하게 내어 주세요.</span></li></ol>`;
      return;
    }
    const p=E.person(g.person),r=E.recipes[g.recipe],spec=E.cookSpec(state,g.recipe),remaining=r.ingredients.filter(id=>!selected.includes(id));
    $('order-panel').innerHTML = `<div class="guest-order">${profile(g)}<span class="eyebrow">COUNTER 0${g.seat + 1} · ${p.role}</span><h3>${p.name}의 주문 <span>${food(g.recipe)}</span></h3><div class="guest-speech"><span>${p.name}의 한마디</span><p>${E.dialogue(g)}</p></div><div class="recipe-slip"><span>${r.jp}</span><strong>${r.name}</strong><small>${yen(r.price)}부터 · ${g.omakase ? '오늘의 맡김 차림' : '주문 메뉴'}</small><p>재료: ${r.ingredients.map(id => E.ingredients[id].name).join(' · ')}</p></div></div>
${ingredientPicker(g,r)}
<div class="cook-step"><div class="step-title"><b>${cooking?.stage==='heat'?'03':'02'}</b><h4>${!cooking?'손질과 불 조절':cooking.stage==='prep'?'손질하기 · 초록 구간에서 완료':'불 조절 · 초록 구간에서 내어주기'}</h4></div><p class="cook-method">${r.method}</p><div class="heat-label"><span>${cooking?.stage==='prep'?'조금 더':'덜 익음'}</span><span class="heat-target" style="left:${(cooking?.stage==='prep'?spec.prepIdeal:spec.ideal)*100}%">알맞음</span><span>${cooking?.stage==='prep'?'늦음':'너무 익음'}</span></div><div class="heat-meter" role="meter" aria-label="조리 진행도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="perfect-zone" style="left:${((cooking?.stage==='prep'?spec.prepIdeal:spec.ideal)-spec.band/2)*100}%;width:${spec.band*100}%"></div><i id="heat-marker"></i></div><button id="cook-action" class="primary cook-button" ${!cooking && remaining.length ? 'disabled' : ''}>${cooking ? cooking.stage==='prep'?'손질 완료 · 불에 올리기':'불 끄고 내어주기' : remaining.length?`${remaining.map(id=>E.ingredients[id].name).join(' · ')} 선택 필요`:'손질 시작'} <span>${cooking ? '✓' : '↗'}</span></button><p class="fine-print">${cooking?(cooking.stage==='prep'?'초록 구간에서 손질 완료를 누르면 불 조절로 이어져요.':'초록 구간에서 불을 꺼 주세요. 요리마다 알맞은 익힘이 달라요.'):'재료 25점 · 손질 25점 · 불 조절 50점. 재료를 모두 선택하면 시작할 수 있어요.'}</p></div>`;
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
    const faces=`<div class="conversation-cast">${run.cast.map(id=>`<div>${portrait(E.person(id),id)}</div>`).join('')}</div>`;
    if(run.step===0){
      $('story-content').innerHTML=followups+faces+`<p class="story-scene">${definition.intro}</p><div class="story-dialogue">${definition.lines.map(t=>`<p>${text(t)}</p>`).join('')}</div><span class="story-step">1 / 2 · 어떻게 손을 내밀까요?</span><div class="story-choices">${definition.choices.map(c=>{const cost=[c.money<0?`${yen(-c.money)} 사용`:'',...Object.entries(c.ingredients||{}).map(([id,n])=>`${E.ingredients[id].name} ${n}개`)].filter(Boolean).join(' · ');return `<button data-choice="${c.id}" ${E.canChoose(state,c)?'':'disabled'}>${c.label}<small>${E.canChoose(state,c)?cost||'지금 할 수 있어요':`${cost} 필요 · 재료나 자금을 준비해 주세요`}</small></button>`}).join('')}</div>`;return;
    }
    if(run.step===1){$('story-content').innerHTML=faces+`<p class="story-result">${choice.result}</p><span class="story-step">2 / 2 · 오늘의 마음을 남기기</span><div class="story-choices">${E.storyContent.reflection.map(c=>`<button data-choice="${c.id}">${c.label}</button>`).join('')}</div>`;return;}
    $('story-content').innerHTML=followups+faces+`<p class="story-result">${choice?.result||'오늘 손님들과 나눈 이야기가 가게의 기억으로 남았어요.'}</p><p class="story-memory">${reflection?.text||''}</p><p class="story-next">이 선택의 소식이 다음 영업일에 도착해요.</p>`+memories;
  }
  function renderManagement() {
    const rescue = E.rescueNeeds(state) ? '<div class="rescue-box"><span>재료 살 돈이 부족한가요? 이웃 상인이 이번 주문에 필요한 재료를 나눠 줘요.</span><button data-rescue="true">도움받기 · 평판 −3</button></div>' : '';
    document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-pressed', String(b.dataset.tab === tab)); });
    $('management-title').textContent = { pantry: '냉장고', menu: '메뉴 수첩', shop: '가게 꾸미기' }[tab];
    if (tab === 'pantry') {
      $('management-content').innerHTML = `${rescue}<p class="management-note">한 봉지씩, 필요한 만큼. 영업 중에도 재료를 주문할 수 있어요. <span>현재 재료 ${Object.values(state.inventory).reduce((a, b) => a + b, 0)}개</span></p><div class="stock-grid">${Object.entries(E.ingredients).map(([id, item]) => `<article class="stock-card"><span class="stock-icon">${food(id)}</span><div><h3>${item.name}</h3><span>냉장고에 <b>${state.inventory[id]}개</b></span></div><button data-buy="${id}" ${state.money < E.buyPrice(state,id) || state.inventory[id] >= 999 ? 'disabled' : ''} aria-label="${item.name} 1개 ${E.buyPrice(state,id)}엔에 구매">+1 <small>${yen(E.buyPrice(state,id))}</small></button></article>`).join('')}</div>`;
    } else if(tab==='menu'){
      const entries=Object.entries(E.recipes),matches=entries.filter(([,r])=>(menuFilter==='all'||menuFilter==='available'&&r.level<=state.level||Number(menuFilter)===r.level)&&(!menuQuery||r.name.includes(menuQuery)));
      $('management-content').innerHTML=`<p class="management-note">레벨마다 새 메뉴 3개 · 전체 100종 · 지금 ${entries.filter(([,r])=>r.level<=state.level).length}개를 만들 수 있어요.<span>오늘의 추천: ${E.recipes[state.special].name}</span></p><div class="menu-filters"><button data-menu-filter="all" class="${menuFilter==='all'?'active':''}">전체 100</button><button data-menu-filter="available" class="${menuFilter==='available'?'active':''}">지금 가능</button>${Array.from({length:34},(_,i)=>`<button data-menu-filter="${i+1}" class="${menuFilter===String(i+1)?'active':''}">Lv.${i+1}</button>`).join('')}</div><input id="menu-search" type="search" aria-label="음식 이름 찾기" placeholder="먹고 싶은 음식 찾기" value="${menuQuery.replaceAll('&','&amp;').replaceAll('"','&quot;')}"><div class="menu-grid">${matches.map(([id,r])=>{const open=r.level<=state.level;return `<article class="menu-card ${open?'available':'locked'}"><div class="menu-picture">${food(id)}${open?'':`<span class="menu-lock">Lv.${r.level}에 해제</span>`}</div><small>LEVEL ${r.level}</small><h3>${r.name}</h3><p>${r.ingredients.map(id=>E.ingredients[id].name).join(' · ')}</p><span class="menu-price">${yen(r.price)}부터</span>${open?`<button data-special="${id}" ${state.special===id||state.phase==='open'?'disabled':''}>${state.special===id?'✓ 오늘의 추천':state.phase==='open'?'다음 영업 전에 추천 변경':'오늘의 추천으로 정하기'}</button>`:`<button disabled aria-label="${r.name} 레벨 ${r.level}에 해제">Lv.${r.level} 도달 시 바로 조리 가능</button>`}</article>`}).join('')}</div>${upcoming()}`;
    } else {
      $('management-content').innerHTML = `<p class="management-note">익숙한 자리에, 나다운 온기를 더해요. 구매한 장식은 식당에 바로 나타나요.</p><div class="upgrade-grid">${Object.entries(E.upgrades).map(([id, u]) => `<article class="upgrade-card ${state.level<u.level?'locked':''}"><span class="decor-thumbnail">${Scene.decoration(id)}</span><div><h3>${u.name}</h3><p>${u.description}</p><details class="item-preview"><summary>어디에 놓이는지 보기</summary>${Scene.preview(id)}</details><small>${u.area==='inside'?'매장 안':'매장 밖'} · ${levelNote(u.level)}</small></div><button data-upgrade="${id}" ${state.upgrades.includes(id) || state.money < u.price || state.level < u.level ? 'disabled' : ''}>${state.upgrades.includes(id) ? '✓ 배치 완료' : state.level<u.level ? `🔒 Lv.${u.level}에 해제` : `${yen(u.price)} · 들여놓기`}</button></article>`).join('')}</div>`;
    }
  }
  function render() {
    $('money').textContent = yen(state.money);
    $('reputation').innerHTML = `${state.reputation} <small>/ 100</small>`;
    $('day').textContent = `${state.night}번째 밤`;
    $('open-status').textContent = state.phase === 'prep' ? '영업 준비' : state.phase === 'end' ? '오늘 영업 끝' : '영업 중';
    $('clock').textContent = state.phase === 'prep' ? '23:50' : state.phase === 'end' ? '07:00' : `${String(Math.min(6, Math.floor(state.nightScores.length / state.target * 7))).padStart(2, '0')}:30`;
    const canClose = E.canClose(state);
    $('night-action').disabled = state.phase === 'open' && !canClose;
    $('night-action').innerHTML = state.phase === 'prep' ? '식당 불 켜기 <span>↗</span>' : state.phase === 'end' ? '오늘의 영업보고 <span>→</span>' : canClose ? '밤 마무리하기 · 영업보고 <span>☾</span>' : `${Math.min(3,Math.floor(state.nightScores.length/3)+1)} / 3사이클 · ${state.nightScores.length} / ${state.target}끼`;
    $('service-hint').textContent = state.phase === 'prep' ? '냉장고와 메뉴를 준비해요. 영업비와 대기 시간을 고려하세요.' : state.phase === 'end' ? '재료를 채워 두면 다음 밤이 더 든든해져요.' : canClose ? '9명의 손님을 대접했어요! 아래 밤 마무리하기를 눌러 영업보고를 확인하세요.' : state.event === 'pending' ? '손님들의 이야기가 이어지고 있어요. 반짝이는 이야기 버튼을 눌러 답해 주세요.' : '바 건너편의 손님을 누르면 프로필과 주문을 볼 수 있어요.';
    $('night-action').classList.toggle('close-ready',canClose);
    const nextLevel=E.levels.find(l=>l.level>state.level);
    $('progress-hud').innerHTML=`<b>Lv.${state.level}</b><span>만족도 ${E.satisfaction(state)} · 성장 ${state.xp}${nextLevel?` / ${nextLevel.xp}`:' · MAX'}</span><progress value="${nextLevel?Math.min(state.xp,nextLevel.xp):1}" max="${nextLevel?.xp||1}"></progress>`;
    renderScene(); renderOrder(); renderStory(); renderManagement(); save();
    $('story-badge').hidden=state.event!=='pending'&&!state.nightNews.length;
    if (state.phase==='end') renderReport();
    maybeStory();
  }
  function tryArrival() {
    if ($('app').hidden || $('intro').open || document.hidden || $('settings-dialog').open || $('reset-dialog').open) return;
    const g = E.arrive(state);
    if (g) { E.conversation(state); render(); }
  }
  function resetTransient() { selectedGuest = null; selected = []; cooking = null; result = null; }
  $('night-action').addEventListener('click', () => {
    if (state.phase === 'prep') { E.open(state); resetTransient(); Scene.showArea('inside'); render(); tryArrival(); }
    else if (E.canClose(state)) { E.close(state); resetTransient(); render(); openSheet('report-dialog'); }
    else if (state.phase === 'end') { renderReport(); openSheet('report-dialog'); }
  });
  $('customers').addEventListener('click', event => {
    const button = event.target.closest('[data-guest]');
    if (!button || cooking) return;
    selectedGuest = Number(button.dataset.guest); selected = []; result = null; renderScene(); renderOrder();
    openSheet('kitchen-dialog');
    $('order-panel').querySelector('[data-ingredient]:not(:disabled)')?.focus({ preventScroll: true });
  });
  function finishCooking(timing) {
    if (!cooking) return;
    const cookedGuest = cooking.guest;
    result = E.serve(state, cookedGuest, cooking.selected, timing,cooking.preparation);
    cooking = null; selectedGuest = null; selected = [];
    if (result) { leaves.set(cookedGuest, 0); toast(`${result.guest} 님의 만족도 ${result.score}점 · ${yen(result.total)} (팁 ${yen(result.tip)})`); }
    render();
  }
  $('order-panel').addEventListener('click', event => {
    const refill=event.target.closest('[data-kitchen-buy]');
    if(refill){const id=refill.dataset.kitchenBuy;if(!cooking&&E.buy(state,id)){const g=state.guests.find(g=>g.id===selectedGuest);if(g&&E.recipes[g.recipe].ingredients.includes(id)&&!selected.includes(id))selected.push(id);render();}return;}
    if(event.target.closest('[data-kitchen-rescue]')){if(!cooking&&E.rescue(state))render();return;}
    if(event.target.closest('[data-jump-cook]')){$('order-panel').querySelector('.cook-step').scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(event.target.closest('#show-report')) {renderReport();openSheet('report-dialog');return;}
    const gift=event.target.closest('[data-gift]'); if(gift){if(E.gift(state,Number(gift.dataset.gift))){render();}return;}
    if (event.target.closest('#next-night')) { E.next(state); resetTransient(); $('kitchen-dialog').close(); render(); return; }
    const ingredient = event.target.closest('[data-ingredient]');
    if (ingredient && !cooking) {
      const id = ingredient.dataset.ingredient;
      if (!state.inventory[id]) return;
      selected = selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id];
      renderOrder(); $('order-panel').querySelector(`[data-ingredient="${id}"]`)?.focus({ preventScroll: true });
    }
    if (event.target.closest('#cook-action')) {
      if (cooking) return advanceCooking();
      const order=state.guests.find(g=>g.id===selectedGuest);
      if(!order||!E.recipes[order.recipe].ingredients.every(id=>selected.includes(id)))return;
      cooking = { guest: selectedGuest, selected: [...selected], elapsed: 0, stage:'prep', preparation:0, spec:E.cookSpec(state,state.guests.find(g=>g.id===selectedGuest).recipe) };
      renderScene(); renderOrder(); updateHeat(0); $('cook-action').focus({ preventScroll: true });
    }
  });
  function advanceCooking(forced) {
    if(!cooking)return;
    const position=forced??cooking.elapsed/(cooking.stage==='prep'?cooking.spec.prepTime:cooking.spec.heatTime);
    if(cooking.stage==='prep'){
      cooking.preparation=Math.max(0,1-Math.abs(position-cooking.spec.prepIdeal)/.22);
      cooking.stage='heat';cooking.elapsed=0;renderOrder();updateHeat(0);return;
    }
    finishCooking(position);
  }
  function updateHeat(position) {
    if (!$('heat-marker')) return;
    $('heat-marker').style.left = `${Math.min(100, position * 100)}%`;
    $('heat-marker').parentElement.setAttribute('aria-valuenow', String(Math.round(position * 100)));
  }
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
    const button = event.target.closest('[data-choice]');
    if (button && E.resolveEvent(state, button.dataset.choice)) { render(); toast(state.event==='pending'?'그다음 이야기가 이어집니다.':'이 선택의 소식이 다음 밤에 도착해요.'); }
  });
  const sheetIds = ['report-dialog', 'kitchen-dialog', 'management-dialog', 'story-dialog', 'settings-dialog'];
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
    if (close.dataset.close === 'kitchen-dialog' && cooking) return toast('조리 중인 한 끼를 먼저 내어 주세요.');
    $(close.dataset.close).close();
    if (close.dataset.close !== 'story-dialog') maybeStory();
  });
  $('kitchen-dialog').addEventListener('cancel', event => { if (cooking) { event.preventDefault(); toast('조리 중인 한 끼를 먼저 내어 주세요.'); } });
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
    $('app').hidden = false; lastFrame = 0; render();
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
  $('replay').addEventListener('click', () => { if (cooking) return toast('조리 중인 한 끼를 먼저 내어 주세요.'); startIntro(); });
  $('reset').addEventListener('click', () => { if (cooking) return toast('조리 중인 한 끼를 먼저 내어 주세요.'); $('reset-dialog').showModal(); });
  $('reset-dialog').addEventListener('close', () => {
    if ($('reset-dialog').returnValue !== 'reset') return;
    state = E.fresh(); resetTransient(); leaves.clear(); seenCustomers.clear(); render(); startIntro();
  });
  function frame(now) {
    const dt = lastFrame ? Math.min(now - lastFrame, 100) : 0; lastFrame = now;
    if (!document.hidden && !$('app').hidden && !$('reset-dialog').open && !$('settings-dialog').open && !$('intro').open) {
      if(state.phase==='open'&&!Scene.isPlacing()){for(const g of state.guests)if(g.status==='waiting'){g.waitMs=(g.waitMs||0)+dt;const meter=document.querySelector(`[data-customer="${g.id}"] .wait-meter i`);if(meter)meter.style.width=`${E.patience(g)*100}%`;}}
      if (cooking && !Scene.isPlacing()) {
        cooking.elapsed+=dt;const duration=cooking.stage==='prep'?cooking.spec.prepTime:cooking.spec.heatTime;updateHeat(cooking.elapsed/duration);
        if(cooking.elapsed>=duration)advanceCooking(1);
      }
      // Customers stay long enough for their conversation; unsettled stories pause departure.
      for (const g of state.guests) {
        if (g.status !== 'eating' || (g.id === selectedGuest && $('kitchen-dialog').open)) continue;
        const time = (leaves.get(g.id) || 0) + dt; leaves.set(g.id, time);
        if (time > 8000) { g.status = 'left'; leaves.delete(g.id); render(); }
      }
    }
    raf = requestAnimationFrame(frame);
  }
  // Waiting counts only while the game is active; background/offline time never advances.
  let arrivalTimer = setInterval(() => { if (!$('reset-dialog').open) tryArrival(); }, 6500);
  window.addEventListener('pagehide', () => { save(); clearInterval(arrivalTimer); cancelAnimationFrame(raf); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { lastFrame = 0; arrivalTimer = setInterval(() => { if (!$('reset-dialog').open) tryArrival(); }, 6500); raf = requestAnimationFrame(frame); }
  });
  render();
  window.MidnightApp = { launch: startIntro, save, isCooking: () => Boolean(cooking) };
  if (saveMessage) toast(saveMessage);
  raf = requestAnimationFrame(frame);
})();
