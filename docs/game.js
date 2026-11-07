(() => {
  'use strict';
  const E = window.MidnightEngine;
  const KEY = 'midnight-diner-save-v2';
  const $ = id => document.getElementById(id);
  const yen = n => `¥${n.toLocaleString('ja-JP')}`;
  let state, storageAvailable = true, saveMessage = '';
  try { state = E.restore(localStorage.getItem(KEY), localStorage.getItem('midnight-diner-save-v1')); }
  catch { state = E.fresh(); saveMessage = '저장 정보를 읽지 못해 새 식당을 준비했습니다.'; }
  let selectedGuest = null, selected = [], cooking = null, result = null, tab = 'pantry';
  let slowCooking = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seenCustomers = new Set();
  let toastTimer, raf, elapsed = 0, lastFrame = 0, introPaused = false;
    const leaves = new Map();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? '이 브라우저에 자동 저장됩니다.' : '저장을 사용할 수 없습니다. 창을 닫으면 진행이 사라져요.';
  }
  function toast(message) {
    $('toast').textContent = message; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4200);
  }
  function portrait(p, i) {
    return `<svg viewBox="0 0 130 170" aria-hidden="true"><ellipse cx="65" cy="160" rx="42" ry="8" fill="#17272c" opacity=".25"/><path d="M31 153l4-34h61l4 34" fill="#3d4140"/><path d="M22 128Q20 88 46 83h37q28 5 25 45l-18 9H39Z" fill="${p.color}"/><path d="M56 83v23l9 8 10-8V83" fill="#ddb493"/><path d="M51 88l14 24-21-7-5-17m40 0-14 24 22-7 5-17" fill="#eee0c5"/><ellipse cx="65" cy="59" rx="29" ry="34" fill="#e6bc97"/><path d="M36 61Q25 18 64 19q42-1 30 44l-8-20q-27 5-38-5Z" fill="${p.hair}"/><path d="M51 61h3m23 0h3" stroke="#514239" stroke-width="3" stroke-linecap="round"/><path d="M57 76q8 6 16-1" fill="none" stroke="#9b6652" stroke-width="2"/>${i % 2 ? '<path d="M45 55h17v13H45Zm24 0h17v13H69Zm-7 6h7" fill="none" stroke="#5e5548" stroke-width="2"/>' : ''}<path d="M34 115l12 20h38l13-20" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="4"/></svg>`;
  }
  function renderScene() {
    const visible = state.guests.filter(g => g.status !== 'left');
    $('customers').innerHTML = visible.map(g => {
      const p = E.people[g.person], r = E.recipes[g.recipe];
      const key = `${state.night}-${g.id}`;
      const arriving = !seenCustomers.has(key); seenCustomers.add(key);
      return `<div class="customer ${arriving ? 'arriving' : ''} seat-${g.seat}${g.id === selectedGuest ? ' selected' : ''}" data-customer="${g.id}"><button class="thought ${g.status === 'eating' ? 'happy' : ''}" data-guest="${g.id}" ${cooking || g.status === 'eating' ? 'disabled' : ''} aria-label="${p.name}의 ${g.status === 'eating' ? '식사 중' : '주문 확인'}"><span>${g.status === 'eating' ? (g.score >= 80 ? '♥' : '✓') : r.icon}</span><small>${g.status === 'eating' ? `${g.score}점` : '주문 보기'}</small></button>${portrait(p, g.person)}<span class="customer-name">${p.name}${g.omakase ? ' · 맡김 차림' : ''}</span></div>`;
    }).join('');
    $('empty-note').hidden = state.phase === 'open';
    $('scene').classList.toggle('is-prep', state.phase === 'prep');
    $('extra-lantern').hidden = !state.upgrades.includes('lantern');
    $('extra-plants').hidden = !state.upgrades.includes('plants');
  }
  function renderOrder() {
    const g = state.guests.find(g => g.id === selectedGuest && g.status === 'waiting');
    if (state.phase === 'end') {
      const average = Math.round(state.nightScores.reduce((a, b) => a + b, 0) / Math.max(1, state.nightScores.length));
      $('order-panel').innerHTML = `<div class="summary"><span class="big-icon">☀</span><h3>오늘 밤도 수고했어요.</h3><p>따뜻한 ${state.nightScores.length}끼, 그리고 작은 이야기 하나.</p><dl><div><dt>오늘의 수입 <small>팁 포함</small></dt><dd>${yen(state.nightRevenue)}</dd></div><div><dt>받은 팁</dt><dd>${yen(state.nightTips)}</dd></div><div><dt>평균 만족도</dt><dd>${average} / 100</dd></div><div><dt>골목의 평판</dt><dd>${state.reputation - state.nightStartRep >= 0 ? '+' : ''}${state.reputation - state.nightStartRep}</dd></div></dl><p class="fine-print">평판 25마다 다음 밤 손님이 한 명 늘어요.<br>마감 후에도 재료를 미리 채울 수 있어요.</p></div>`;
      return;
    }
    if (!g) {
      $('order-panel').innerHTML = `${result ? `<div class="receipt"><span>${result.score >= 85 ? '참 따뜻한 한 끼였어요.' : result.score >= 60 ? '잘 먹었습니다.' : '다음에는 조금 더 정성스럽게.'}</span><h3>${result.guest}의 ${result.dish}</h3><div class="receipt-score">${result.score}<small> / 100</small></div><p>음식값 ${yen(result.base)} <b>+ 팁 ${yen(result.tip)}</b></p></div>` : `<div class="kitchen-idle"><span class="big-icon">${state.phase === 'prep' ? '🍵' : '🍽️'}</span><h3>${state.phase === 'prep' ? '분주함도, 잠깐 쉬어 가는 곳.' : '손님의 주문을 들어볼까요?'}</h3><p>${state.phase === 'prep' ? '냉장고를 살피고 오늘의 한 접시를 골라요.<br>준비가 되면 식당의 불을 켜 주세요.' : '손님 머리 위의 음식 말풍선을 눌러 보세요.<br>서두르지 않아도 괜찮아요.'}</p></div>`}<ol class="how-to"><li><b>01</b><span>말풍선을 눌러 주문을 확인해요.</span></li><li><b>02</b><span>냉장고에서 재료를 꺼내요.</span></li><li><b>03</b><span>알맞게 익혀 따뜻하게 내어 주세요.</span></li></ol>`;
      return;
    }
    const p = E.people[g.person], r = E.recipes[g.recipe];
    $('order-panel').innerHTML = `<div class="guest-order"><span class="eyebrow">COUNTER 0${g.seat + 1} · ${p.role}</span><h3>${p.name}의 주문 <span>${r.icon}</span></h3><p class="guest-line">“${g.omakase ? '오늘은 주인장에게 맡길게요. 추천하는 한 접시로 주세요.' : p.line}”</p><div class="recipe-slip"><span>${r.jp}</span><strong>${r.name}</strong><small>${yen(r.price)}부터 · ${g.omakase ? '오늘의 맡김 차림' : '주문 메뉴'}</small><p>재료: ${r.ingredients.map(id => E.ingredients[id].name).join(' · ')}</p></div></div>
<div class="prep-step"><div class="step-title"><b>01</b><h4>냉장고에서 꺼내기</h4><small>재료당 1개</small></div><div class="ingredient-picker">${Object.entries(E.ingredients).map(([id, item]) => `<button data-ingredient="${id}" aria-pressed="${selected.includes(id)}" class="ingredient ${selected.includes(id) ? 'picked' : ''}" ${cooking || state.inventory[id] === 0 ? 'disabled' : ''}><span>${item.icon}</span>${item.name}<small>×${state.inventory[id]}</small></button>`).join('')}</div><p class="fine-print">필요한 재료만 선택하세요. 부족하면 아래 냉장고에서 구매해요.</p></div>
<div class="cook-step"><div class="step-title"><b>02</b><h4>불 앞에서, 한 번 더 정성</h4></div><p class="cook-method">${r.method}</p><div class="heat-label"><span>덜 익음</span><span>알맞음</span><span>너무 익음</span></div><div class="heat-meter" role="meter" aria-label="조리 진행도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="perfect-zone"></div><i id="heat-marker"></i></div><label class="slow-option"><input id="slow-cook" type="checkbox" ${slowCooking ? 'checked' : ''} ${cooking ? 'disabled' : ''}>느긋한 조리 · 타이머 없이</label>${slowCooking && cooking ? `<label class="heat-slider">익힘 정도 <input id="manual-heat" type="range" min="0" max="100" value="${Math.round((cooking?.manual ?? 0.3) * 100)}" aria-label="익힘 정도 직접 조절"></label>` : ''}<button id="cook-action" class="primary cook-button" ${!cooking && !selected.length ? 'disabled' : ''}>${cooking ? '불 끄고 내어주기' : '조리 시작'} <span>${cooking ? '✓' : '↗'}</span></button><p class="fine-print">${cooking ? (slowCooking ? '슬라이더를 움직여 익힘 정도를 정한 뒤 내어 주세요.' : '표시가 초록 구간에 올 때 불을 꺼 주세요. 약 5초 동안 진행돼요.') : '재료와 익힘 정도가 만족도와 팁을 결정해요.'}</p></div>`;
  }
  function renderStory() {
    $('story-tag').textContent = state.event === 'pending' ? '주인장의 선택' : state.event === 'resolved' ? '오늘의 기억' : '골목의 작은 일들';
    const nameA = E.people[0].name, nameB = E.people[1].name;
    if (state.event === 'pending') {
      $('story-content').innerHTML = `<div class="story-dialogue"><p><b>${nameA}</b> “꽃을 샀는데… 건넬 용기가 안 나네요.”</p><p><b>${nameB}</b> “꽃도, 마음도 너무 오래 두면 시들어 버려요.”</p><p class="story-narration">둘 사이에 조용한 웃음이 흐릅니다. 주인장은 어떻게 할까요?</p></div><div class="story-choices"><button data-choice="listen">잠시 손을 멈추고, 이야기를 들어준다 <small>평판 +5</small></button><button data-choice="dismiss">늦었으니 식사에 집중해 달라고 한다 <small>평판 −3</small></button></div>`;
    } else if (state.eventChoice === 'listen') {
      $('story-content').innerHTML = '<p class="story-memory">“내일 한 번 가 볼게요.” 빈 그릇 옆에 작은 용기가 남았습니다. 두 손님은 이 식당을 친구에게 소개하기로 합니다. <b>평판 +5</b></p>';
    } else if (state.eventChoice === 'dismiss') {
      $('story-content').innerHTML = '<p class="story-memory">두 사람은 말을 줄이고 조용히 식사를 마칩니다. 오늘의 식당은 조금 쓸쓸하게 기억될 것 같아요. <b>평판 −3</b></p>';
    } else {
      $('story-content').innerHTML = '<p class="story-memory">밥을 기다리는 동안, 낯선 사람도 이웃이 됩니다. 손님 두 사람이 모이면 작은 이야기가 시작돼요.</p>';
    }
  }
  function renderManagement() {
    const rescue = E.rescueNeeds(state) ? '<div class="rescue-box"><span>재료 살 돈이 부족한가요? 이웃 상인이 이번 주문에 필요한 재료를 나눠 줘요.</span><button data-rescue="true">도움받기 · 평판 −3</button></div>' : '';
    document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-pressed', String(b.dataset.tab === tab)); });
    if (tab === 'pantry') {
      $('management-content').innerHTML = `${rescue}<p class="management-note">한 봉지씩, 필요한 만큼. 영업 중에도 재료를 주문할 수 있어요. <span>현재 재료 ${Object.values(state.inventory).reduce((a, b) => a + b, 0)}개</span></p><div class="stock-grid">${Object.entries(E.ingredients).map(([id, item]) => `<article class="stock-card"><span class="stock-icon">${item.icon}</span><div><h3>${item.name}</h3><span>냉장고에 <b>${state.inventory[id]}개</b></span></div><button data-buy="${id}" ${state.money < item.price || state.inventory[id] >= 999 ? 'disabled' : ''} aria-label="${item.name} 1개 ${item.price}엔에 구매">+1 <small>${yen(item.price)}</small></button></article>`).join('')}</div>`;
    } else if (tab === 'menu') {
      $('management-content').innerHTML = `<p class="management-note">새로운 한 접시가, 새로운 만남을 데려옵니다. <span>오늘의 맡김 차림: ${E.recipes[state.special].name}</span></p><div class="menu-grid">${Object.entries(E.recipes).map(([id, r]) => `<article class="menu-card ${state.unlocked.includes(id) ? '' : 'locked'}"><span class="menu-icon">${r.icon}</span><small>${r.jp}</small><h3>${r.name}</h3><p>${r.ingredients.map(id => E.ingredients[id].name).join(' · ')}</p><span class="menu-price">${yen(r.price)}부터</span>${state.unlocked.includes(id) ? `<button data-special="${id}" ${state.special === id || state.phase === 'open' ? 'disabled' : ''}>${state.special === id ? '✓ 오늘의 맡김 차림' : state.phase === 'open' ? '다음 영업 전에 선택' : '맡김 차림으로 정하기'}</button>` : `<button data-unlock="${id}" ${state.money < r.unlock ? 'disabled' : ''}>요리 배우기 · ${yen(r.unlock)}</button>`}</article>`).join('')}</div><p class="fine-print">맡김 차림은 주인장에게 메뉴를 맡기는 손님에게 제공해요. 두 번째 밤부터 추천을 부탁하는 손님이 찾아와요.</p>`;
    } else {
      $('management-content').innerHTML = `<p class="management-note">익숙한 자리에, 나다운 온기를 더해요. 구매한 장식은 식당에 바로 나타나요.</p><div class="upgrade-grid">${Object.entries(E.upgrades).map(([id, u]) => `<article class="upgrade-card"><span>${u.icon}</span><div><h3>${u.name}</h3><p>${u.description}</p></div><button data-upgrade="${id}" ${state.upgrades.includes(id) || state.money < u.price ? 'disabled' : ''}>${state.upgrades.includes(id) ? '✓ 식당에 놓였어요' : `${yen(u.price)} · 들여놓기`}</button></article>`).join('')}</div>`;
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
    $('night-action').innerHTML = state.phase === 'prep' ? '식당 불 켜기 <span>↗</span>' : state.phase === 'end' ? '다음 밤 준비 <span>→</span>' : canClose ? '오늘 영업 마치기 <span>☾</span>' : `${state.nightScores.length} / ${state.target}끼 대접`;
    $('service-hint').textContent = state.phase === 'prep' ? '냉장고를 채우고, 오늘의 메뉴를 골라 보세요.' : state.phase === 'end' ? '재료를 채워 두면 다음 밤이 더 든든해져요.' : canClose ? '마지막 그릇까지 비워졌어요. 이제 쉬어 가요.' : state.event === 'pending' ? '카운터에서 이야기가 시작됐어요. 아래에서 답해 주세요.' : '머리 위 음식 말풍선을 누르면 주문을 확인할 수 있어요.';
    renderScene(); renderOrder(); if (cooking && slowCooking) updateHeat(cooking.manual ?? 0.3); renderStory(); renderManagement(); save();
  }
  function tryArrival() {
    if ($('intro').open || document.hidden) return;
    const g = E.arrive(state);
    if (g) { toast(`${E.people[g.person].name} 님이 들어와 자리에 앉았어요.`); E.conversation(state); render(); }
  }
  function resetTransient() { selectedGuest = null; selected = []; cooking = null; result = null; }
  $('night-action').addEventListener('click', () => {
    if (state.phase === 'prep') { E.open(state); resetTransient(); render(); tryArrival(); }
    else if (E.canClose(state)) { E.close(state); resetTransient(); render(); }
    else if (state.phase === 'end') { E.next(state); resetTransient(); render(); }
  });
  $('customers').addEventListener('click', event => {
    const button = event.target.closest('[data-guest]');
    if (!button || cooking) return;
    selectedGuest = Number(button.dataset.guest); selected = []; result = null; renderScene(); renderOrder();
    if (matchMedia('(max-width: 800px)').matches) $('order-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('order-panel').querySelector('[data-ingredient]:not(:disabled)')?.focus({ preventScroll: true });
  });
  function finishCooking(timing) {
    if (!cooking) return;
    const cookedGuest = cooking.guest;
    result = E.serve(state, cookedGuest, cooking.selected, timing);
    cooking = null; selectedGuest = null; selected = [];
    if (result) { leaves.set(cookedGuest, 0); toast(`${result.guest} 님의 만족도 ${result.score}점 · ${yen(result.total)} (팁 ${yen(result.tip)})`); }
    render();
  }
  $('order-panel').addEventListener('click', event => {
    const ingredient = event.target.closest('[data-ingredient]');
    if (ingredient && !cooking) {
      const id = ingredient.dataset.ingredient;
      if (!state.inventory[id]) return;
      selected = selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id];
      renderOrder(); $('order-panel').querySelector(`[data-ingredient="${id}"]`)?.focus({ preventScroll: true });
    }
    if (event.target.closest('#cook-action')) {
      if (cooking) return finishCooking(slowCooking ? (cooking.manual ?? 0.3) : cooking.elapsed / 5000);
      if (!selected.length) return;
      cooking = { guest: selectedGuest, selected: [...selected], elapsed: 0 };
      renderScene(); renderOrder(); if (slowCooking) updateHeat(0.3); $('cook-action').focus({ preventScroll: true });
    }
  });
  $('order-panel').addEventListener('change', event => {
    if (event.target.id === 'slow-cook') { slowCooking = event.target.checked; renderOrder(); $('slow-cook').focus({ preventScroll: true }); }
  });
  $('order-panel').addEventListener('input', event => {
    if (event.target.id === 'manual-heat') { cooking.manual = Number(event.target.value) / 100; updateHeat(cooking.manual); }
  });
  function updateHeat(position) {
    if (!$('heat-marker')) return;
    $('heat-marker').style.left = `${Math.min(100, position * 100)}%`;
    $('heat-marker').parentElement.setAttribute('aria-valuenow', String(Math.round(position * 100)));
  }
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.tab; renderManagement(); }));
  $('management-content').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.rescue) { if (E.rescue(state)) toast('이웃이 필요한 재료를 나눠 주었어요. 나중에 따뜻한 밥으로 보답해요.'); }
    else if (button.dataset.buy) { if (E.buy(state, button.dataset.buy)) toast(`${E.ingredients[button.dataset.buy].name} 1개를 냉장고에 채웠어요.`); }
    else if (button.dataset.unlock) { if (E.unlock(state, button.dataset.unlock)) toast('연어 오차즈케를 배웠어요. 맡김 차림으로 정해 보세요.'); }
    else if (button.dataset.special && state.phase !== 'open' && state.unlocked.includes(button.dataset.special)) { state.special = button.dataset.special; toast('오늘의 맡김 차림을 정했어요.'); }
    else if (button.dataset.upgrade) { if (E.upgrade(state, button.dataset.upgrade)) toast('식당이 한층 더 따뜻해졌어요.'); }
    const selector = button.dataset.rescue ? '[data-tab="pantry"]' : button.dataset.buy ? `[data-buy="${button.dataset.buy}"]` : button.dataset.special ? `[data-special="${button.dataset.special}"]` : button.dataset.unlock ? `[data-unlock="${button.dataset.unlock}"]` : `[data-upgrade="${button.dataset.upgrade}"]`;
    render(); document.querySelector(selector)?.focus({ preventScroll: true });
  });
  $('story-content').addEventListener('click', event => {
    const button = event.target.closest('[data-choice]');
    if (button && E.resolveEvent(state, button.dataset.choice)) { render(); toast('오늘의 이야기가 식당의 평판에 남았어요.'); }
  });
  // Adapted from the user-supplied opening; newly drawn animation, no source footage or audio.
  const shots = [
    { start: 0, scene: '0', line: '하루가 저물고,', sub: '개점 전, 카운터를 천천히 닦습니다.' },
    { start: 2700, scene: '0', line: '사람들이 집으로 발걸음을 옮길 무렵,', sub: '' },
    { start: 5700, scene: '0', line: '내 식당의 하루는 그제야 시작된다.', sub: '' },
    { start: 8800, scene: '1', line: '메뉴판은 단출하다.', sub: '' },
    { start: 11500, scene: '2', line: '다른 음식은 편하게 말하면 된다.', sub: '' },
    { start: 14300, scene: '2', line: '냉장고에 재료가 있고,', sub: '' },
    { start: 17000, scene: '2', line: '내 손으로 만들 수 있으면 내어준다.', sub: '' },
    { start: 19800, scene: '2', line: '문은 자정에 열어, 아침 일곱 시쯤 닫는다.', sub: '00:00 — 07:00' },
    { start: 25300, scene: '2', line: '그래서 다들, 심야식당이라 부른다.', sub: '' },
    { start: 28800, scene: '2', line: '이 늦은 시간에 손님이 오냐고?', sub: '' },
    { start: 31500, scene: '3', line: '생각보다, 꽤 찾아온다.', sub: '이제 당신의 첫 번째 밤이 시작됩니다.' },
  ];
  let shotIndex = -1;
  function updateIntro() {
    const index = shots.findLastIndex(shot => elapsed >= shot.start);
    if (index !== shotIndex) {
      shotIndex = index; $('intro-frame').dataset.shot = shots[index].scene;
      $('intro-line').textContent = shots[index].line; $('intro-sub').textContent = shots[index].sub;
    }
    $('intro-progress').style.width = `${elapsed / 34000 * 100}%`;
    $('intro-time').textContent = `${String(Math.min(34, Math.floor(elapsed / 1000))).padStart(2, '0')} / 34`;
  }
  function finishIntro() {
    if (!$('intro').open) return;
    state.introSeen = true; $('intro').close(); render();
  }
  function startIntro() {
    if ($('intro').open) return;
    elapsed = 0; shotIndex = -1; introPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('pause-intro').textContent = introPaused ? '▶ 계속 보기' : 'Ⅱ 일시정지';
    $('pause-intro').setAttribute('aria-label', introPaused ? '프롤로그 계속 보기' : '프롤로그 일시정지');
    updateIntro(); $('intro-frame').dataset.paused = String(introPaused); $('intro').showModal();
  }
  $('skip-intro').addEventListener('click', finishIntro);
  $('intro').addEventListener('cancel', event => { event.preventDefault(); finishIntro(); });
  $('pause-intro').addEventListener('click', () => {
    introPaused = !introPaused; $('intro-frame').dataset.paused = String(introPaused); $('pause-intro').textContent = introPaused ? '▶ 계속 보기' : 'Ⅱ 일시정지';
    $('pause-intro').setAttribute('aria-label', introPaused ? '프롤로그 계속 보기' : '프롤로그 일시정지');
  });
  $('next-intro').addEventListener('click', () => { const next = shots.find(shot => shot.start > elapsed); if (!next) finishIntro(); else { elapsed = next.start; updateIntro(); } });
  $('replay').addEventListener('click', () => { if (cooking) return toast('조리 중인 한 끼를 먼저 내어 주세요.'); startIntro(); });
  $('reset').addEventListener('click', () => { if (cooking) return toast('조리 중인 한 끼를 먼저 내어 주세요.'); $('reset-dialog').showModal(); });
  $('reset-dialog').addEventListener('close', () => {
    if ($('reset-dialog').returnValue !== 'reset') return;
    state = E.fresh(); resetTransient(); leaves.clear(); seenCustomers.clear(); render(); startIntro();
  });
  function frame(now) {
    const dt = lastFrame ? Math.min(now - lastFrame, 100) : 0; lastFrame = now;
    if (!document.hidden && !$('reset-dialog').open) {
      if ($('intro').open) {
        if (!introPaused) { elapsed += dt; updateIntro(); if (elapsed >= 34000) finishIntro(); }
      } else {
        if (cooking && !slowCooking) {
          cooking.elapsed += dt; updateHeat(cooking.elapsed / 5000);
          if (cooking.elapsed >= 5000) finishCooking(1);
        }
        // Customers stay long enough for their conversation; unsettled stories pause departure.
        for (const g of state.guests) {
          if (g.status !== 'eating') continue;
          const time = (leaves.get(g.id) || 0) + dt; leaves.set(g.id, time);
          if (time > 12000 && state.event !== 'pending') { g.status = 'left'; leaves.delete(g.id); renderScene(); save(); }
        }
      }
    }
    raf = requestAnimationFrame(frame);
  }
  // Arrival cadence is gentle; no patience penalties or background/offline simulation in this slice.
  let arrivalTimer = setInterval(() => { if (!$('reset-dialog').open) tryArrival(); }, 6500);
  window.addEventListener('pagehide', () => { save(); clearInterval(arrivalTimer); cancelAnimationFrame(raf); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { lastFrame = 0; arrivalTimer = setInterval(() => { if (!$('reset-dialog').open) tryArrival(); }, 6500); raf = requestAnimationFrame(frame); }
  });
  render();
  if (!state.introSeen) startIntro();
  if (saveMessage) toast(saveMessage);
  raf = requestAnimationFrame(frame);
})();
