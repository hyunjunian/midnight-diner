(() => {
  'use strict';
  const KEY = 'midnight-diner-save-v1';
  const guests = [
    { name: '퇴근길의 손님', line: '“오늘은 조금 늦었네요. 따뜻한 국 한 그릇 부탁해요.”', dish: '돼지고기 된장국 정식', price: 7000 },
    { name: '산책 나온 이웃', line: '“골목에 불이 켜져 있길래요. 간단하게 먹고 갈게요.”', dish: '달걀말이와 밥', price: 6000 },
    { name: '새벽을 걷는 손님', line: '“아직 열려 있어서 다행이에요. 출출했거든요.”', dish: '따뜻한 주먹밥', price: 4000 },
  ];
  const fresh = () => ({ version: 1, night: 1, phase: 'closed', index: 0, money: 0, served: 0 });
  let state = fresh();
  let storageAvailable = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.version === 1 && Number.isSafeInteger(saved.night) && saved.night > 0 &&
          ['closed', 'order', 'served', 'end'].includes(saved.phase) &&
          Number.isInteger(saved.index) && saved.index >= 0 && saved.index < guests.length &&
          Number.isSafeInteger(saved.money) && saved.money >= 0 &&
          Number.isSafeInteger(saved.served) && saved.served >= 0) state = saved;
    }
  } catch { storageAvailable = false; }
  const el = id => document.getElementById(id);
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { storageAvailable = false; }
  }
  function render() {
    const guest = guests[state.index];
    el('day').textContent = `${state.night}번째 밤`;
    el('money').textContent = `${state.money.toLocaleString('ko-KR')}원`;
    el('served').textContent = `${state.served}그릇`;
    el('clock').textContent = state.phase === 'closed' ? '00:00' : state.phase === 'end' ? '07:00' : `${String(state.index * 2).padStart(2, '0')}:30`;
    el('open-status').textContent = state.phase === 'closed' ? '영업 준비 중' : state.phase === 'end' ? '오늘 영업 끝' : '영업 중';
    el('dish').hidden = !['order', 'served'].includes(state.phase);
    el('dish').textContent = `${guest.dish} · ${guest.price.toLocaleString('ko-KR')}원`;
    const screens = {
      closed: ['아직은 고요한 골목', '육수를 올리고, 그릇을 꺼내고. 준비가 되면 식당의 불을 켜 주세요.', '식당 불 켜기'],
      order: [guest.name, guest.line, '따뜻한 한 끼 내어주기'],
      served: [guest.name, '“잘 먹었습니다. 덕분에 속이 든든하네요.”', state.index === guests.length - 1 ? '오늘 영업 마치기' : '다음 손님 맞이하기'],
      end: ['어느새 아침이 밝았어요', '마지막 그릇을 씻고, 잠시 쉬어 갑니다. 다음 밤에도 이곳에서 만나요.', '다음 밤 준비하기'],
    };
    const [name, line, action] = screens[state.phase];
    el('guest').textContent = name;
    el('dialogue').textContent = line;
    el('action').textContent = `${action} ↗`;
    el('save-status').textContent = storageAvailable ? '진행 상황은 이 브라우저에 자동 저장됩니다.' : '브라우저 저장을 사용할 수 없어 이번 플레이만 유지됩니다.';
  }
  el('action').addEventListener('click', () => {
    if (state.phase === 'closed') state.phase = 'order';
    else if (state.phase === 'order') {
      state.money += guests[state.index].price;
      state.served += 1;
      state.phase = 'served';
    } else if (state.phase === 'served') {
      if (state.index === guests.length - 1) state.phase = 'end';
      else { state.index += 1; state.phase = 'order'; }
    } else { state.night += 1; state.index = 0; state.phase = 'closed'; }
    save(); render();
  });
  el('reset').addEventListener('click', () => el('reset-dialog').showModal());
  el('reset-dialog').addEventListener('close', () => {
    if (el('reset-dialog').returnValue === 'reset') { state = fresh(); save(); render(); }
  });
  render();
})();
