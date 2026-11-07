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
  people[2].age='52세';people[3].age='25세';people[4].age='48세';people[4].style='둥근 얼굴과 새치 섞인 묶음머리';people[5].age='22세';
  people.push({"name": "후미", "role": "은퇴한 국어 선생님", "age": "72세", "style": "은빛 파마머리와 둥근 안경", "bio": "책을 덮은 뒤에는 골목을 천천히 걸어요. 오랫동안 학생들과 나누었던 이야기를 기억합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "다이치", "role": "체육학과 대학생", "age": "19세", "style": "짧은 머리와 청록 후드", "bio": "늦은 연습을 마치면 든든한 한 끼가 필요해요. 누구보다 맛있게 밥을 먹습니다.", "color": "#62786e", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "사치", "role": "골목의 재봉사", "age": "66세", "style": "회색 땋은 머리와 올리브 숄", "bio": "작은 수선집에서 오래된 옷을 고쳐요. 서두르지 않는 식당을 좋아합니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "고로", "role": "현장 반장", "age": "43세", "style": "넓은 어깨와 주황 작업복", "bio": "밤 공사를 마치고 찾아왔어요. 동료들과 나눌 다음 식당 이야기를 찾습니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "마키", "role": "야간 병동 간호사", "age": "39세", "style": "직사각 안경과 단정한 묶음머리", "bio": "다른 사람의 식사를 챙기다 이제야 쉬러 왔어요. 편안한 한 끼가 필요합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "신지", "role": "재즈 연주자", "age": "61세", "style": "은빛 수염과 검은 터틀넥", "bio": "마지막 연주가 끝나면 허기가 찾아와요. 오래된 노래와 담백한 음식을 좋아합니다.", "color": "#62786e", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "케이코", "role": "극장 의상 담당", "age": "58세", "style": "짧은 적갈색 곱슬머리와 자주 코트", "bio": "공연이 끝난 뒤 의상을 정리해요. 따뜻한 가게에서 하루의 긴장을 풀고 싶어 합니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "미나토", "role": "잡지 교정자", "age": "29세", "style": "단정한 정장과 둥근 안경", "bio": "활자 사이의 작은 오자를 찾는 일을 해요. 식사할 때만큼은 천천히 쉬고 싶습니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "메이", "role": "미대 학생", "age": "21세", "style": "적갈색 짧은 곱슬머리와 민트 니트", "bio": "밤새 그린 그림 이야기를 좋아해요. 새로운 맛에서 영감을 얻곤 합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "이사오", "role": "은퇴한 목수", "age": "76세", "style": "흰 옆머리와 갈색 조끼", "bio": "이 골목의 오래된 가게들을 기억해요. 나무 향이 나는 공간을 좋아합니다.", "color": "#62786e", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "레이코", "role": "출판사 영업 담당", "age": "45세", "style": "짙은 일자머리와 붉은 재킷", "bio": "온종일 사람을 만나고 온 날이에요. 말없이 편하게 먹을 수 있는 자리를 찾습니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "히로", "role": "이웃 가게 요리사", "age": "36세", "style": "긴 웨이브 머리와 옅은 수염", "bio": "자기 가게를 마감하고 다른 사람의 요리를 먹으러 와요. 주인장의 정성을 잘 알아봅니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "치요", "role": "동네 차 선생님", "age": "68세", "style": "은빛 단발과 황토색 겉옷", "bio": "차를 가르치며 오래 살아온 동네예요. 조용한 예절과 소박한 맛을 좋아합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "타쿠", "role": "자전거 수리공", "age": "24세", "style": "바가지머리와 청바지 재킷", "bio": "가게 문을 닫고 손을 깨끗이 씻은 뒤 찾아와요. 밝은 웃음이 인상적입니다.", "color": "#62786e", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "아야", "role": "자동차 정비사", "age": "27세", "style": "높이 묶은 곱슬머리와 주근깨", "bio": "늦은 정비를 끝내고 따뜻한 밥을 먹으러 왔어요. 새로운 식당을 발견하면 기뻐합니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "겐", "role": "야간 배송 기사", "age": "55세", "style": "짧은 새치머리와 초록 작업복", "bio": "물건을 모두 전하고 나면 허기가 져요. 든든한 식사와 짧은 인사를 좋아합니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "리나", "role": "도서관 사서", "age": "34세", "style": "긴 검은 땋은 머리와 크림 숄", "bio": "책 정리를 마치고 골목을 걸어요. 마음에 드는 식당은 책갈피처럼 오래 기억합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  people.push({"name": "오사무", "role": "중고서점 주인", "age": "40세", "style": "소금빛 짧은 머리와 푸른 셔츠", "bio": "서점 불을 끄고 저녁을 먹으러 왔어요. 누군가 골라 준 음식에 작은 기대를 품습니다.", "color": "#62786e", "hair": "#423b33", "dish": "special", "line": "오늘은 주인장 추천으로 주세요. 따뜻한 한 끼가 먹고 싶어요."});
  const familyNames=['사토','모리','다나카','아오키','하야시','기무라','이노우에','오노','야마모토','다카하시','이시카와','고바야시'];
  function person(id) {
    const base=people[id%people.length];
    if(id<people.length)return base;
    return {...base,name:`${familyNames[Math.floor(id/people.length)%familyNames.length]} ${base.name}`,bio:base.bio};
  }
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
  function patience(g) {return Math.max(0,1-(g.waitMs||0)/(105000+(g.person%4)*15000));}
  function cookSpec(s,id) {
    const i=Object.keys(recipes).indexOf(id),shift=((s.night+i)%3-1)*.025;
    return {ideal:[.65,.56,.74,.48,.68,.77,.61][i]+shift,prepIdeal:.48+((s.night+i)%4)*.055,
      prepTime:2900-s.level*70,heatTime:5400-s.level*170,tolerance:.18-s.level*.012,band:.11-s.level*.006};
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
    return { revenue: s.nightRevenue, tips: s.nightTips, expenses:s.nightCosts||0, money: s.money, net: s.money - start.money,
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
    version: 4, nextVisitor: 0, nightVisitors: [], xp: 0, level: 1, satisfactionTotal: 0, customerBook: {},
    nightStart: { money: 3200, reputation: 12, satisfaction: 0, xp: 0, level: 1 }, introSeen: false, night: 1, phase: 'prep', money: 3200, reputation: 12,
    totalServed: 0, inventory: { rice: 5, nori: 5, egg: 4, dashi: 6, pork: 2, miso: 2, salmon: 0 },
    unlocked: ['onigiri', 'tamago', 'tonjiru'], upgrades: [], special: 'onigiri',
    guests: [], arrived: 0, target: 9, nightRevenue: 0, nightTips: 0, nightCosts: 0, nightScores: [],
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
    if (!v || ![2, 3, 4].includes(v.version) || typeof v.introSeen !== 'boolean' || !integer(v.night, 1) ||
      !['prep', 'open', 'end'].includes(v.phase) || !integer(v.money) || !integer(v.reputation, 0, 100) ||
      !integer(v.totalServed) || !v.inventory || !Object.keys(ingredients).every(id => integer(v.inventory[id], 0, 999)) ||
      !Array.isArray(v.unlocked) || !['onigiri', 'tamago', 'tonjiru'].every(id => v.unlocked.includes(id)) ||
      !v.unlocked.every(id => Object.hasOwn(recipes, id)) || !v.unlocked.includes(v.special) ||
      !Array.isArray(v.upgrades) || !v.upgrades.every(id => Object.hasOwn(upgrades, id)) ||
      !integer(v.arrived, 0, 15) || !integer(v.target, 3, 15) || v.arrived > v.target ||
      (v.nightCosts!==undefined&&!integer(v.nightCosts)) || !integer(v.nightRevenue) || !integer(v.nightTips) || !integer(v.nightStartRep, 0, 100) ||
      !Array.isArray(v.nightScores) || v.nightScores.length > v.arrived || !v.nightScores.every(n => integer(n, 0, 100)) ||
      !['none', 'pending', 'resolved'].includes(v.event) || ![null, 'listen', 'dismiss'].includes(v.eventChoice) ||
      !Array.isArray(v.guests) || v.guests.length > 3 || !v.guests.every(g =>
        g && integer(g.id, 1, 15) && g.id <= v.arrived && integer(g.person, 0, 1000000) &&
        integer(g.seat, 0, 2) && v.unlocked.includes(g.recipe) && typeof g.omakase === 'boolean' &&
        ['waiting', 'eating', 'left'].includes(g.status) && integer(g.score, 0, 100) && (g.waitMs===undefined || (Number.isFinite(g.waitMs)&&g.waitMs>=0&&g.waitMs<=1e9))) ||
      new Set(v.guests.map(g => g.seat)).size !== v.guests.length ||
      new Set(v.guests.map(g => g.id)).size !== v.guests.length) throw new Error('Invalid save');
    const restored = { ...s, ...v, version: 4, lastResult: null };
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
      !v.customerBook || Array.isArray(v.customerBook) || !Object.entries(v.customerBook).every(([id,c]) => /^\d+$/.test(id) && Number(id) <= 1000000 && c && integer(c.visits) && integer(c.lastScore,0,100) && integer(c.lastVisitNight) && integer(c.dueNight))) throw new Error('Invalid progress');
    for (const g of restored.guests) if (!restored.customerBook[g.person]) restored.customerBook[g.person] = {visits:1,lastScore:g.score,lastVisitNight:restored.night,dueNight:restored.night+2};
    if(v.version<4){
      restored.nextVisitor=Math.max(6,...Object.keys(restored.customerBook).map(id=>Number(id)+1));
      restored.nightVisitors=Object.entries(restored.customerBook).filter(([,c])=>c.lastVisitNight===restored.night).map(([id])=>Number(id));
      for(const c of Object.values(restored.customerBook))c.dueLevel=c.lastScore>=90?restored.level+2:0;
    }else if(!integer(v.nextVisitor,0,1000001)||!Array.isArray(v.nightVisitors)||v.nightVisitors.length>9||new Set(v.nightVisitors).size!==v.nightVisitors.length||!v.nightVisitors.every(id=>integer(id,0,1000000))||!Object.values(v.customerBook).every(c=>integer(c.dueLevel,0,7)))throw new Error('Invalid visitor schedule');
    restored.nextVisitor=Math.max(restored.nextVisitor,...Object.keys(restored.customerBook).map(id=>Number(id)+1));
    progress(restored); return restored;
  }
  function open(s) {
    if (s.phase !== 'prep') return false;
    Object.assign(s, { phase: 'open', guests: [], arrived: 0, target: 9, nightVisitors: [],
      nightStart: {money:s.money, reputation:s.reputation, satisfaction:satisfaction(s), xp:s.xp, level:s.level},
      nightRevenue: 0, nightTips: 0, nightCosts: 0, nightScores: [], event: 'none', eventChoice: null, nightStartRep: s.reputation, lastResult: null });
    return true;
  }
  function arrive(s) {
    if (s.phase !== 'open' || s.arrived >= s.target) return null;
    const seat = [0, 1, 2].find(n => !s.guests.some(g => g.seat === n && g.status !== 'left'));
    if (seat === undefined) return null;
    s.guests = s.guests.filter(g => g.seat !== seat);
    const freshFace=id=>!s.nightVisitors.some(previous=>previous%people.length===id%people.length);
    const due=Object.entries(s.customerBook).find(([id,c])=>c.lastScore>=90&&c.dueLevel<=s.level&&c.lastVisitNight<s.night&&freshFace(Number(id)));
    let visitor;
    if(due)visitor=Number(due[0]);
    else {while(!freshFace(s.nextVisitor))s.nextVisitor++;visitor=s.nextVisitor++;}
    const p=person(visitor);
    const recipe = p.dish === 'special' ? s.special : p.dish;
    const g = { id: ++s.arrived, person: visitor, seat, recipe, omakase: p.dish === 'special', status: 'waiting', score: 0, waitMs: 0 };
    const memory = s.customerBook[visitor] || {visits:0,lastScore:0,lastVisitNight:0,dueNight:0,dueLevel:0};
    if (memory.lastVisitNight !== s.night) memory.visits++;
    memory.lastVisitNight = s.night; s.customerBook[visitor] = memory; s.nightVisitors.push(visitor);
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
  function serve(s, guestId, selected, timing, preparation=1) {
    const g = s.guests.find(g => g.id === guestId && g.status === 'waiting');
    if (s.phase !== 'open' || !g || !Array.isArray(selected) || !Number.isFinite(timing) || !Number.isFinite(preparation) ||
      selected.length === 0 || new Set(selected).size !== selected.length ||
      !selected.every(id => Object.hasOwn(ingredients, id) && s.inventory[id] > 0)) return null;
    const r = recipes[g.recipe];
    const matches = selected.filter(id => r.ingredients.includes(id)).length;
    const wrong = selected.filter(id => !r.ingredients.includes(id)).length;
    const recipeScore = Math.max(0, (matches - wrong * 0.5) / r.ingredients.length);
    const spec=cookSpec(s,g.recipe),heat=Math.max(0,1-Math.abs(clamp(timing,0,1)-spec.ideal)/spec.tolerance);
    const waited=Math.min(20,Math.floor(Math.max(0,(g.waitMs||0)-45000)/12000)*2);
    let score=Math.round(clamp(recipeScore*25+clamp(preparation,0,1)*25+heat*50+(s.upgrades.includes('lantern')?3:0)+(g.gifted?5:0)-waited,0,100));
    if(recipeScore<1)score=Math.min(Math.round(50*recipeScore),score);
    const base=Math.round(r.price*(.35+score*.006));
    const tip=Math.round(r.price*Math.max(0,score-80)/100*.8);
    selected.forEach(id => s.inventory[id]--);
    s.money += base + tip; s.nightRevenue += base + tip; s.nightTips += tip;
    s.totalServed++; s.satisfactionTotal += score; s.xp += score; s.nightScores.push(score);
    s.customerBook[g.person].lastScore = score;
    s.reputation = clamp(s.reputation + (score >= 85 ? 4 : score >= 65 ? 2 : score >= 40 ? -1 : -4), 0, 100);
    progress(s); s.customerBook[g.person].dueLevel=s.level+2; g.status = 'eating'; g.score = score;
    const result = { score, base, tip, total: base + tip, preparation:Math.round(clamp(preparation,0,1)*100),heat:Math.round(heat*100),waitPenalty:waited,dish: r.name, guest: person(g.person).name };
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
  function close(s) { if (!canClose(s)) return false; s.nightCosts=Math.min(s.money,650+s.nightStart.level*250);s.money-=s.nightCosts;s.phase = 'end'; return true; }
  function next(s) {
    if (s.phase !== 'end') return false;
    s.night++; s.phase = 'prep'; s.guests = []; s.lastResult = null; return true;
  }
  const api = { patience,cookSpec,person, levels, satisfaction, progress, regular, gift, report, ingredients, recipes, people, upgrades, fresh, restore, open, arrive, buy, unlock, upgrade, serve, conversation, rescueNeeds, rescue, resolveEvent, canClose, close, next };
  if (typeof module !== 'undefined') module.exports = api;
  else window.MidnightEngine = api;
})();
