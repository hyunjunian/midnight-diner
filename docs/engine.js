/* Serializable game rules, shared by the browser and the Node test runner. */
(() => {
  'use strict';
  const ingredients = {
    rice: { name: '쌀', icon: '🍚', price: 60 },
    nori: { name: '김', icon: '🌿', price: 40 },
    egg: { name: '달걀', icon: '🥚', price: 80 },
    dashi: { name: '다시', icon: '🍶', price: 50 },
    pork: { name: '돼지고기', icon: '🥩', price: 130 },
    miso: { name: '된장', icon: '🫘', price: 50 },
    salmon: { name: '연어', icon: '🐟', price: 160 },
  };
  const recipes = {
    onigiri: { name: '구운 주먹밥', jp: '焼きおにぎり', icon: '🍙', ingredients: ['rice', 'nori'], price: 480, method: '겉면을 노릇하게 구워 주세요.', unlock: 0 },
    tamago: { name: '다시 달걀말이', jp: 'だし巻き卵', icon: '🍳', ingredients: ['egg', 'dashi'], price: 580, method: '부드러운 결이 생길 때 불에서 내려요.', unlock: 0 },
    tonjiru: { name: '돼지고기 된장국', jp: '豚汁', icon: '🍲', ingredients: ['pork', 'miso', 'dashi'], price: 780, method: '국물이 깊게 우러날 때 불을 꺼요.', unlock: 0 },
    ochazuke: { name: '연어 오차즈케', jp: '鮭茶漬け', icon: '🍵', ingredients: ['rice', 'salmon', 'dashi'], price: 980, method: '따뜻한 다시를 붓고 알맞게 뜸을 들여요.', unlock: 900 },
  };
  const people = [
    { name: '하루', role: '막차를 놓친 편집자', color: '#c88b69', hair: '#382c32', line: '긴 하루였어요. 바삭한 주먹밥 하나면 좋겠네요.', dish: 'onigiri' },
    { name: '렌', role: '동네 꽃집 주인', color: '#819c8c', hair: '#4c3930', line: '오늘은 조금 부드러운 게 당기네요. 달걀말이 될까요?', dish: 'tamago' },
    { name: '유키', role: '야간 버스 기사', color: '#8193b2', hair: '#282b38', line: '뜨끈한 국물이 생각나서 왔어요. 된장국 한 그릇 주세요.', dish: 'tonjiru' },
    { name: '소라', role: '골목의 사진가', color: '#bb9b67', hair: '#564138', line: '오늘 한 끼는 주인장에게 맡겨도 될까요?', dish: 'special' },
    { name: '나오', role: '새벽의 제빵사', color: '#ac84a0', hair: '#413332', line: '빵 말고 밥이 먹고 싶은 날이 있어요. 오늘 추천으로 주세요.', dish: 'special' },
    { name: '아키', role: '여행 온 손님', color: '#b57870', hair: '#343c3d', line: '골목에서 좋은 냄새가 나서요. 주인장 추천으로 부탁해요.', dish: 'special' },
  ];
  const upgrades = {
    lantern: { name: '따뜻한 등불', icon: '🏮', price: 1600, description: '식당에 주황빛 등불을 달아요. 만족도 +5.' },
    plants: { name: '골목의 초록', icon: '🪴', price: 2200, description: '작은 화분을 들여요. 매일 첫 손님의 입소문 +2.' },
  };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fresh = () => ({
    version: 2, introSeen: false, night: 1, phase: 'prep', money: 3200, reputation: 12,
    totalServed: 0, inventory: { rice: 4, nori: 4, egg: 4, dashi: 6, pork: 3, miso: 3, salmon: 0 },
    unlocked: ['onigiri', 'tamago', 'tonjiru'], upgrades: [], special: 'onigiri',
    guests: [], arrived: 0, target: 3, nightRevenue: 0, nightTips: 0, nightScores: [],
    event: 'none', eventChoice: null, nightStartRep: 12, lastResult: null,
  });
  function restore(raw, legacy) {
    const s = fresh();
    if (!raw && legacy) {
      const old = JSON.parse(legacy);
      if (old.version === 1 && Number.isSafeInteger(old.money) && old.money >= 0 &&
          Number.isSafeInteger(old.night) && old.night > 0 && Number.isSafeInteger(old.served) && old.served >= 0) {
        s.money += Math.floor(old.money / 10); s.night = old.night; s.totalServed = old.served; s.introSeen = true;
      }
      return s;
    }
    if (!raw) return s;
    const v = JSON.parse(raw);
    const integer = (n, min = 0, max = 1e9) => Number.isSafeInteger(n) && n >= min && n <= max;
    if (!v || v.version !== 2 || typeof v.introSeen !== 'boolean' || !integer(v.night, 1) ||
      !['prep', 'open', 'end'].includes(v.phase) || !integer(v.money) || !integer(v.reputation, 0, 100) ||
      !integer(v.totalServed) || !v.inventory || !Object.keys(ingredients).every(id => integer(v.inventory[id], 0, 999)) ||
      !Array.isArray(v.unlocked) || !['onigiri', 'tamago', 'tonjiru'].every(id => v.unlocked.includes(id)) ||
      !v.unlocked.every(id => Object.hasOwn(recipes, id)) || !v.unlocked.includes(v.special) ||
      !Array.isArray(v.upgrades) || !v.upgrades.every(id => Object.hasOwn(upgrades, id)) ||
      !integer(v.arrived, 0, 6) || !integer(v.target, 3, 6) || v.arrived > v.target ||
      !integer(v.nightRevenue) || !integer(v.nightTips) || !integer(v.nightStartRep, 0, 100) ||
      !Array.isArray(v.nightScores) || v.nightScores.length > v.arrived || !v.nightScores.every(n => integer(n, 0, 100)) ||
      !['none', 'pending', 'resolved'].includes(v.event) || ![null, 'listen', 'dismiss'].includes(v.eventChoice) ||
      !Array.isArray(v.guests) || v.guests.length > 3 || !v.guests.every(g =>
        g && integer(g.id, 1, 6) && g.id <= v.arrived && integer(g.person, 0, people.length - 1) &&
        integer(g.seat, 0, 2) && v.unlocked.includes(g.recipe) && typeof g.omakase === 'boolean' &&
        ['waiting', 'eating', 'left'].includes(g.status) && integer(g.score, 0, 100)) ||
      new Set(v.guests.map(g => g.seat)).size !== v.guests.length ||
      new Set(v.guests.map(g => g.id)).size !== v.guests.length) throw new Error('Invalid save');
    // Last-result text is derived, never trusted from local storage.
    return { ...s, ...v, lastResult: null };
  }
  function open(s) {
    if (s.phase !== 'prep') return false;
    Object.assign(s, { phase: 'open', guests: [], arrived: 0, target: Math.min(6, 3 + Math.floor(s.reputation / 25)),
      nightRevenue: 0, nightTips: 0, nightScores: [], event: 'none', eventChoice: null, nightStartRep: s.reputation, lastResult: null });
    return true;
  }
  function arrive(s) {
    if (s.phase !== 'open' || s.arrived >= s.target) return null;
    const seat = [0, 1, 2].find(n => !s.guests.some(g => g.seat === n && g.status !== 'left'));
    if (seat === undefined) return null;
    s.guests = s.guests.filter(g => g.seat !== seat);
    const person = s.arrived < 2 ? s.arrived : (s.arrived + s.night - 1) % people.length;
    const p = people[person];
    const recipe = p.dish === 'special' ? s.special : p.dish;
    const g = { id: ++s.arrived, person, seat, recipe, omakase: p.dish === 'special', status: 'waiting', score: 0 };
    s.guests.push(g);
    if (s.arrived === 1 && s.upgrades.includes('plants')) s.reputation = clamp(s.reputation + 2, 0, 100);
    return g;
  }
  function buy(s, id) {
    if (!Object.hasOwn(ingredients, id)) return false;
    const item = ingredients[id];
    if (!item || s.money < item.price || s.inventory[id] >= 999) return false;
    s.money -= item.price; s.inventory[id]++; return true;
  }
  function unlock(s, id) {
    if (!Object.hasOwn(recipes, id)) return false;
    const r = recipes[id];
    if (!r || s.unlocked.includes(id) || s.money < r.unlock) return false;
    s.money -= r.unlock; s.unlocked.push(id); return true;
  }
  function upgrade(s, id) {
    if (!Object.hasOwn(upgrades, id)) return false;
    const u = upgrades[id];
    if (!u || s.upgrades.includes(id) || s.money < u.price) return false;
    s.money -= u.price; s.upgrades.push(id); return true;
  }
  function serve(s, guestId, selected, timing) {
    const g = s.guests.find(g => g.id === guestId && g.status === 'waiting');
    if (s.phase !== 'open' || !g || !Array.isArray(selected) || !Number.isFinite(timing) ||
      selected.length === 0 || new Set(selected).size !== selected.length ||
      !selected.every(id => Object.hasOwn(ingredients, id) && s.inventory[id] > 0)) return null;
    const r = recipes[g.recipe];
    const matches = selected.filter(id => r.ingredients.includes(id)).length;
    const wrong = selected.filter(id => !r.ingredients.includes(id)).length;
    const recipeScore = Math.max(0, (matches - wrong * 0.5) / r.ingredients.length);
    const heat = Math.max(0, 1 - Math.abs(clamp(timing, 0, 1) - 0.65) / 0.35);
    const score = Math.round(clamp(recipeScore * 60 + heat * 40 + (s.upgrades.includes('lantern') ? 5 : 0), 0, 100));
    const base = Math.round(r.price * (0.6 + score * 0.004));
    const tip = Math.round(r.price * Math.max(0, score - 60) / 100 * 0.65);
    selected.forEach(id => s.inventory[id]--);
    s.money += base + tip; s.nightRevenue += base + tip; s.nightTips += tip;
    s.totalServed++; s.nightScores.push(score);
    s.reputation = clamp(s.reputation + (score >= 85 ? 4 : score >= 65 ? 2 : score >= 40 ? -1 : -4), 0, 100);
    g.status = 'eating'; g.score = score;
    const result = { score, base, tip, total: base + tip, dish: r.name, guest: people[g.person].name };
    s.lastResult = result; return result;
  }
  function conversation(s) {
    if (s.phase !== 'open' || s.event !== 'none' || s.guests.filter(g => g.status !== 'left').length < 2) return false;
    s.event = 'pending'; return true;
  }
  // A small safety net for spending all cash before noticing missing ingredients.
  function rescueNeeds(s) {
    if (s.phase !== 'open') return null;
    const needed = {};
    s.guests.filter(g => g.status === 'waiting').forEach(g => recipes[g.recipe].ingredients.forEach(id => {
      needed[id] = (needed[id] || 0) + 1;
    }));
    const missing = Object.fromEntries(Object.entries(needed).map(([id, n]) => [id, Math.max(0, n - s.inventory[id])]).filter(([, n]) => n));
    const cost = Object.entries(missing).reduce((sum, [id, n]) => sum + n * ingredients[id].price, 0);
    return cost > s.money ? missing : null;
  }
  function rescue(s) {
    const missing = rescueNeeds(s);
    if (!missing) return false;
    Object.entries(missing).forEach(([id, n]) => { s.inventory[id] += n; });
    s.reputation = clamp(s.reputation - 3, 0, 100); return true;
  }
  function resolveEvent(s, choice) {
    if (s.event !== 'pending' || !['listen', 'dismiss'].includes(choice)) return false;
    s.event = 'resolved'; s.eventChoice = choice;
    s.reputation = clamp(s.reputation + (choice === 'listen' ? 5 : -3), 0, 100); return true;
  }
  function canClose(s) { return s.phase === 'open' && s.arrived === s.target && s.nightScores.length === s.target && s.event !== 'pending'; }
  function close(s) { if (!canClose(s)) return false; s.phase = 'end'; return true; }
  function next(s) {
    if (s.phase !== 'end') return false;
    s.night++; s.phase = 'prep'; s.guests = []; s.lastResult = null; return true;
  }
  const api = { ingredients, recipes, people, upgrades, fresh, restore, open, arrive, buy, unlock, upgrade, serve, conversation, rescueNeeds, rescue, resolveEvent, canClose, close, next };
  if (typeof module !== 'undefined') module.exports = api;
  else window.MidnightEngine = api;
})();
