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
    onigiri: { name: '구운 주먹밥', jp: '焼きおにぎり', icon: '🍙', ingredients: ['rice', 'nori'], price: 480, method: '겉면을 노릇하게 구워 주세요.', unlock: 0, level: 1 },
    tamago: { name: '다시 달걀말이', jp: 'だし巻き卵', icon: '🍳', ingredients: ['egg', 'dashi'], price: 580, method: '부드러운 결이 생길 때 불에서 내려요.', unlock: 0, level: 1 },
    tonjiru: { name: '돼지고기 된장국', jp: '豚汁', icon: '🍲', ingredients: ['pork', 'miso', 'dashi'], price: 780, method: '국물이 깊게 우러날 때 불을 꺼요.', unlock: 0, level: 1 },
    ochazuke: { name: '연어 오차즈케', jp: '鮭茶漬け', icon: '🍵', ingredients: ['rice', 'salmon', 'dashi'], price: 980, method: '따뜻한 다시를 붓고 알맞게 뜸을 들여요.', unlock: 900, level: 2 },
    butadon: { name: '달큰한 돼지고기 덮밥', jp: '豚丼', icon: '🍛', ingredients: ['rice', 'pork', 'dashi'], price: 1180, method: '고기에 윤기가 돌 때 밥 위에 올려요.', unlock: 1500, level: 3 },
    salmonbowl: { name: '연어 솥밥', jp: '鮭の炊き込みご飯', icon: '🍱', ingredients: ['rice', 'salmon', 'miso'], price: 1480, method: '촉촉한 밥알과 연어 향을 살려요.', unlock: 2300, level: 4 },
    midnight: { name: '골목의 맡김 정식', jp: '路地のおまかせ', icon: '🥢', ingredients: ['rice', 'salmon', 'egg', 'dashi'], price: 1980, method: '한 상의 온도를 맞춰 정성껏 마무리해요.', unlock: 3200, level: 5 },
  };
  const people = [
    { name: '하루', role: '막차를 놓친 편집자', age: '32세', style: '깔끔하고 단정한 스타일', bio: '작은 출판사에서 일해요. 마감 뒤에는 바삭한 밥 한 입으로 하루를 정리합니다.', color: '#c88b69', hair: '#382c32', line: '긴 하루였어요. 바삭한 주먹밥 하나면 좋겠네요.', dish: 'onigiri' },
    { name: '렌', role: '동네 꽃집 주인', age: '34세', style: '안경과 포근한 카디건', bio: '골목 입구 꽃집을 지켜요. 남의 마음은 잘 읽지만 자기 이야기는 조금 서툴러요.', color: '#819c8c', hair: '#4c3930', line: '오늘은 조금 부드러운 게 당기네요. 달걀말이 될까요?', dish: 'tamago' },
    { name: '유키', role: '야간 버스 기사', age: '48세', style: '단정한 남색 작업복', bio: '마지막 운행을 끝내고 찾아옵니다. 뜨거운 국물을 천천히 먹는 시간을 좋아해요.', color: '#8193b2', hair: '#282b38', line: '뜨끈한 국물이 생각나서 왔어요. 된장국 한 그릇 주세요.', dish: 'tonjiru' },
    { name: '소라', role: '골목의 사진가', age: '28세', style: '짧은 머리와 머스터드 재킷', bio: '밤의 골목을 카메라에 담아요. 처음 만난 가게에서는 주인장의 추천을 믿어요.', color: '#bb9b67', hair: '#564138', line: '오늘 한 끼는 주인장에게 맡겨도 될까요?', dish: 'special' },
    { name: '나오', role: '새벽의 제빵사', age: '38세', style: '묶은 머리와 차분한 셔츠', bio: '반죽이 부푸는 동안 잠깐 쉬러 와요. 정성스러운 밥에서 일할 힘을 얻습니다.', color: '#ac84a0', hair: '#413332', line: '빵 말고 밥이 먹고 싶은 날이 있어요. 오늘 추천으로 주세요.', dish: 'special' },
    { name: '아키', role: '여행 온 손님', age: '27세', style: '편안한 여행 차림', bio: '지도에 없는 골목을 좋아해요. 맛있는 기억이 생기면 며칠 더 머무릅니다.', color: '#b57870', hair: '#343c3d', line: '골목에서 좋은 냄새가 나서요. 주인장 추천으로 부탁해요.', dish: 'special' },
  ];
  const upgrades = {
    lantern: { name: '호박빛 종이등', icon: '🏮', price: 1000, level: 1, area: 'inside', description: '카운터 위에 종이등을 달아요. 요리 만족도 +5.' },
    plants: { name: '문 앞 화분', icon: '🪴', price: 900, level: 1, area: 'outside', description: '입구에 초록 화분을 놓아요. 첫 손님 입소문 +2.' },
    ceramics: { name: '손으로 빚은 그릇', icon: '🏺', price: 1600, level: 2, area: 'inside', description: '선반에 도자기 컬렉션이 놓여요.' },
    noren: { name: '쪽빛 노렌', icon: '🎐', price: 1800, level: 2, area: 'outside', description: '가게 입구를 쪽빛 천으로 꾸며요.' },
    bonsai: { name: '작은 분재', icon: '🌳', price: 2400, level: 3, area: 'inside', description: '카운터 끝에 작은 정원을 놓아요.' },
    bench: { name: '골목의 나무 벤치', icon: '🪑', price: 2500, level: 3, area: 'outside', description: '가게 앞에 기다리는 이들을 위한 자리를 만들어요.' },
    shelves: { name: '오래된 찻장', icon: '🪵', price: 3200, level: 4, area: 'inside', description: '벽 한쪽에 나무 찻장을 들여놓아요.' },
    sign: { name: '골목의 간판', icon: '✨', price: 4000, level: 5, area: 'outside', description: '따뜻하게 빛나는 전용 간판을 달아요.' },
  };
  const levels = [
    { level: 1, xp: 0, reputation: 0, satisfaction: 0, name: '골목의 작은 불빛' },
    { level: 2, xp: 450, reputation: 25, satisfaction: 70, name: '다시 찾는 한 끼' },
    { level: 3, xp: 1500, reputation: 45, satisfaction: 80, name: '이웃의 단골집' },
    { level: 4, xp: 3200, reputation: 65, satisfaction: 85, name: '밤의 소문난 식당' },
    { level: 5, xp: 5500, reputation: 80, satisfaction: 90, name: '골목의 오래된 약속' },
  ];
  function satisfaction(s) { return s.totalServed ? Math.round(s.satisfactionTotal / s.totalServed) : 0; }
  function progress(s) {
    for (const l of levels) if (s.xp >= l.xp && s.reputation >= l.reputation && satisfaction(s) >= l.satisfaction) s.level = Math.max(s.level, l.level);
    return s.level;
  }
  function regular(s, person) { return (s.customerBook[person]?.visits || 0) >= 3; }
  function gift(s, id) {
    const g = s.guests.find(g => g.id === id && g.status === 'waiting');
    if (s.phase !== 'open' || !g || !regular(s, g.person) || g.gifted || !s.inventory.egg) return false;
    s.inventory.egg--; g.gifted = true; s.reputation = clamp(s.reputation + 1, 0, 100); progress(s); return true;
  }
  function report(s) {
    const start = s.nightStart;
    const next = levels.find(l => l.level > s.level);
    return { revenue: s.nightRevenue, tips: s.nightTips, money: s.money, net: s.money - start.money,
      reputation: s.reputation, reputationDelta: s.reputation - start.reputation,
      satisfaction: satisfaction(s), satisfactionDelta: satisfaction(s) - start.satisfaction,
      average: Math.round(s.nightScores.reduce((a,b)=>a+b,0) / Math.max(1,s.nightScores.length)),
      xp: s.xp, xpDelta: s.xp - start.xp, level: s.level, previousLevel: start.level,
      remaining: next ? Math.max(0, next.xp - s.xp) : 0, next,
      menus: Object.values(recipes).filter(r => r.level > start.level && r.level <= s.level).map(r=>r.name),
      items: Object.values(upgrades).filter(u => u.level > start.level && u.level <= s.level).map(u=>u.name) };
  }
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fresh = () => ({
    version: 3, xp: 0, level: 1, satisfactionTotal: 0, customerBook: {},
    nightStart: { money: 3200, reputation: 12, satisfaction: 0, xp: 0, level: 1 }, introSeen: false, night: 1, phase: 'prep', money: 3200, reputation: 12,
    totalServed: 0, inventory: { rice: 8, nori: 8, egg: 8, dashi: 12, pork: 6, miso: 6, salmon: 0 },
    unlocked: ['onigiri', 'tamago', 'tonjiru'], upgrades: [], special: 'onigiri',
    guests: [], arrived: 0, target: 9, nightRevenue: 0, nightTips: 0, nightScores: [],
    event: 'none', eventChoice: null, nightStartRep: 12, lastResult: null,
  });
  function restore(raw, legacy) {
    const s = fresh();
    if (!raw && legacy) {
      const old = JSON.parse(legacy);
      if (old.version === 1 && Number.isSafeInteger(old.money) && old.money >= 0 &&
          Number.isSafeInteger(old.night) && old.night > 0 && Number.isSafeInteger(old.served) && old.served >= 0) {
        s.money += Math.floor(old.money / 10); s.night = old.night; s.totalServed = old.served; s.satisfactionTotal = old.served * 70; s.xp = old.served * 70; s.introSeen = true;
        s.nightStart = {money:s.money,reputation:s.reputation,satisfaction:satisfaction(s),xp:s.xp,level:s.level};
      }
      return s;
    }
    if (!raw) return s;
    const v = JSON.parse(raw);
    const integer = (n, min = 0, max = 1e9) => Number.isSafeInteger(n) && n >= min && n <= max;
    if (!v || ![2, 3].includes(v.version) || typeof v.introSeen !== 'boolean' || !integer(v.night, 1) ||
      !['prep', 'open', 'end'].includes(v.phase) || !integer(v.money) || !integer(v.reputation, 0, 100) ||
      !integer(v.totalServed) || !v.inventory || !Object.keys(ingredients).every(id => integer(v.inventory[id], 0, 999)) ||
      !Array.isArray(v.unlocked) || !['onigiri', 'tamago', 'tonjiru'].every(id => v.unlocked.includes(id)) ||
      !v.unlocked.every(id => Object.hasOwn(recipes, id)) || !v.unlocked.includes(v.special) ||
      !Array.isArray(v.upgrades) || !v.upgrades.every(id => Object.hasOwn(upgrades, id)) ||
      !integer(v.arrived, 0, 15) || !integer(v.target, 3, 15) || v.arrived > v.target ||
      !integer(v.nightRevenue) || !integer(v.nightTips) || !integer(v.nightStartRep, 0, 100) ||
      !Array.isArray(v.nightScores) || v.nightScores.length > v.arrived || !v.nightScores.every(n => integer(n, 0, 100)) ||
      !['none', 'pending', 'resolved'].includes(v.event) || ![null, 'listen', 'dismiss'].includes(v.eventChoice) ||
      !Array.isArray(v.guests) || v.guests.length > 3 || !v.guests.every(g =>
        g && integer(g.id, 1, 15) && g.id <= v.arrived && integer(g.person, 0, people.length - 1) &&
        integer(g.seat, 0, 2) && v.unlocked.includes(g.recipe) && typeof g.omakase === 'boolean' &&
        ['waiting', 'eating', 'left'].includes(g.status) && integer(g.score, 0, 100)) ||
      new Set(v.guests.map(g => g.seat)).size !== v.guests.length ||
      new Set(v.guests.map(g => g.id)).size !== v.guests.length) throw new Error('Invalid save');
    const restored = { ...s, ...v, version: 3, lastResult: null };
    if (v.version === 2) {
      restored.xp = v.totalServed * 70;
      restored.satisfactionTotal = v.totalServed * 70;
      restored.customerBook = {};
      restored.target = 9;
      // Continue old three-guest saves instead of silently ending their night.
      if (v.phase === 'end') restored.phase = 'prep';
      restored.nightStart = { money: Math.max(0, v.money - v.nightRevenue), reputation: v.nightStartRep, satisfaction: 70, xp: restored.xp, level: 1 };
    } else if (!integer(v.xp) || !integer(v.level, 1, 5) || !integer(v.satisfactionTotal) || v.satisfactionTotal > v.totalServed * 100 ||
      !v.nightStart || !integer(v.nightStart.money) || !integer(v.nightStart.reputation,0,100) || !integer(v.nightStart.satisfaction,0,100) || !integer(v.nightStart.xp) || !integer(v.nightStart.level,1,5) ||
      !v.customerBook || Array.isArray(v.customerBook) || !Object.entries(v.customerBook).every(([id,c]) => /^\d+$/.test(id) && Number(id) < people.length && c && integer(c.visits) && integer(c.lastScore,0,100) && integer(c.lastVisitNight) && integer(c.dueNight))) throw new Error('Invalid progress');
    for (const g of restored.guests) if (!restored.customerBook[g.person]) restored.customerBook[g.person] = {visits:1,lastScore:g.score,lastVisitNight:restored.night,dueNight:restored.night+2};
    progress(restored); return restored;
  }
  function open(s) {
    if (s.phase !== 'prep') return false;
    Object.assign(s, { phase: 'open', guests: [], arrived: 0, target: 9,
      nightStart: {money:s.money, reputation:s.reputation, satisfaction:satisfaction(s), xp:s.xp, level:s.level},
      nightRevenue: 0, nightTips: 0, nightScores: [], event: 'none', eventChoice: null, nightStartRep: s.reputation, lastResult: null });
    return true;
  }
  function arrive(s) {
    if (s.phase !== 'open' || s.arrived >= s.target) return null;
    const seat = [0, 1, 2].find(n => !s.guests.some(g => g.seat === n && g.status !== 'left'));
    if (seat === undefined) return null;
    s.guests = s.guests.filter(g => g.seat !== seat);
    const due = Object.entries(s.customerBook).find(([id,c]) => c.lastScore >= 90 && c.dueNight <= s.night && c.lastVisitNight < s.night && !s.guests.some(g => g.person === Number(id) && g.status !== 'left'));
    const preferred = s.arrived < 2 ? s.arrived : (s.arrived + s.night - 1) % people.length;
    const person = due ? Number(due[0]) : people.map((_,i)=>(preferred+i)%people.length).find(id=>!s.guests.some(g=>g.person===id && g.status!=='left'));
    const p = people[person];
    const recipe = p.dish === 'special' ? s.special : p.dish;
    const g = { id: ++s.arrived, person, seat, recipe, omakase: p.dish === 'special', status: 'waiting', score: 0 };
    const memory = s.customerBook[person] || {visits:0,lastScore:0,lastVisitNight:0,dueNight:0};
    if (memory.lastVisitNight !== s.night) memory.visits++;
    memory.lastVisitNight = s.night; memory.dueNight = s.night + 2; s.customerBook[person] = memory;
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
    if (!r || s.unlocked.includes(id) || s.money < r.unlock || s.level < r.level) return false;
    s.money -= r.unlock; s.unlocked.push(id); return true;
  }
  function upgrade(s, id) {
    if (!Object.hasOwn(upgrades, id)) return false;
    const u = upgrades[id];
    if (!u || s.upgrades.includes(id) || s.money < u.price || s.level < u.level) return false;
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
    const score = Math.round(clamp(recipeScore * 60 + heat * 40 + (s.upgrades.includes('lantern') ? 5 : 0) + (g.gifted ? 5 : 0), 0, 100));
    const base = Math.round(r.price * (0.6 + score * 0.004));
    const tip = Math.round(r.price * Math.max(0, score - 60) / 100 * 0.65);
    selected.forEach(id => s.inventory[id]--);
    s.money += base + tip; s.nightRevenue += base + tip; s.nightTips += tip;
    s.totalServed++; s.satisfactionTotal += score; s.xp += score; s.nightScores.push(score);
    s.customerBook[g.person].lastScore = score; s.customerBook[g.person].dueNight = s.night + 2;
    s.reputation = clamp(s.reputation + (score >= 85 ? 4 : score >= 65 ? 2 : score >= 40 ? -1 : -4), 0, 100);
    progress(s); g.status = 'eating'; g.score = score;
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
    s.reputation = clamp(s.reputation + (choice === 'listen' ? 5 : -3), 0, 100); progress(s); return true;
  }
  function canClose(s) { return s.phase === 'open' && s.arrived === s.target && s.nightScores.length === s.target && s.event !== 'pending'; }
  function close(s) { if (!canClose(s)) return false; s.phase = 'end'; return true; }
  function next(s) {
    if (s.phase !== 'end') return false;
    s.night++; s.phase = 'prep'; s.guests = []; s.lastResult = null; return true;
  }
  const api = { levels, satisfaction, progress, regular, gift, report, ingredients, recipes, people, upgrades, fresh, restore, open, arrive, buy, unlock, upgrade, serve, conversation, rescueNeeds, rescue, resolveEvent, canClose, close, next };
  if (typeof module !== 'undefined') module.exports = api;
  else window.MidnightEngine = api;
})();
