/* Serializable game rules, shared by the browser and the Node test runner. */
(() => {
  'use strict';
  const C=typeof module!=='undefined'?require('./catalog.js'):window.MidnightCatalog;
  const S=typeof module!=='undefined'?require('./stories.js'):window.MidnightStories;
  const ingredients = {
    rice: { name: '쌀', icon: '🍚', price: 60 },
    nori: { name: '김', icon: '🌿', price: 40 },
    egg: { name: '달걀', icon: '🥚', price: 80 },
    dashi: { name: '다시', icon: '🍶', price: 50 },
    pork: { name: '돼지고기', icon: '🥩', price: 130 },
    miso: { name: '된장', icon: '🫘', price: 50 },
    salmon: { name: '연어', icon: '🐟', price: 160 },
  };
  Object.assign(ingredients,C.ingredients);
  const recipes=C.recipes;
  for(const [id,r]of Object.entries(recipes)){
    r.family=/onigiri/.test(id)?'riceball':/udon|soba|ramen|tantan/.test(id)?'noodle':/soup|misoshiru|tonjiru|nabe|shabu|sukiyaki/.test(id)?'soup':/katsu|fry|tempura|karaage|croquette/.test(id)?'fry':/egg|tamago|omelette|chawan/.test(id)?'egg':'plate';
    r.method={riceball:'겉면은 바삭하게, 밥알은 촉촉하게 익혀요.',noodle:'면의 탄력을 살펴 너무 퍼지기 전에 마무리해요.',soup:'국물이 부드럽게 끓고 향이 올라올 때 불을 줄여요.',fry:'표면이 고르게 노릇해지는 순간에 건져요.',egg:'달걀의 결이 촉촉하게 잡히는 순간을 살펴요.',plate:'재료의 색과 온도를 살피며 정성껏 마무리해요.'}[r.family];
  }
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
    lantern: { name: '호박빛 종이등', icon: '🏮', price: 1000, level: 1, area: 'inside', description: '기존 중앙등을 손질해 빛을 더 포근하게 해요. 요리 만족도 +3.' },
    plants: { name: '문 앞 화분', icon: '🪴', price: 900, level: 1, area: 'outside', description: '입구에 초록 화분을 놓아요. 첫 손님 입소문 +2.' },
    ceramics: { name: '손으로 빚은 그릇', icon: '🏺', price: 1600, level: 2, area: 'inside', description: '선반에 도자기 컬렉션이 놓여요.' },
    noren: { name: '쪽빛 노렌', icon: '🎐', price: 1800, level: 2, area: 'outside', description: '가게 입구를 쪽빛 천으로 꾸며요.' },
    bonsai: { name: '작은 분재', icon: '🌳', price: 2400, level: 3, area: 'inside', description: '카운터 끝에 작은 정원을 놓아요.' },
    bench: { name: '골목의 나무 벤치', icon: '🪑', price: 2500, level: 3, area: 'outside', description: '가게 앞에 기다리는 이들을 위한 자리를 만들어요.' },
    shelves: { name: '오래된 찻장', icon: '🪵', price: 3200, level: 4, area: 'inside', description: '벽 한쪽에 나무 찻장을 들여놓아요.' },
    sign: { name: '골목의 간판', icon: '✨', price: 4000, level: 5, area: 'outside', description: '따뜻하게 빛나는 전용 간판을 달아요.' },
  };
  Object.assign(upgrades,{
    clock:{name:'오래된 벽시계',price:4200,level:6,area:'inside',description:'왼쪽 벽에 나무와 황동으로 만든 시계를 걸어요.'},
    ikebana:{name:'계절의 꽃가지',price:4800,level:7,area:'inside',description:'카운터 끝 도자기 화병에 계절의 가지를 꽂아요.'},
    andon:{name:'문 앞 안돈',price:5500,level:8,area:'outside',description:'입구 바닥에 따뜻한 나무 등불을 놓아요.'},
    sudare:{name:'대나무 발',price:6200,level:9,area:'inside',description:'창 한쪽에 대나무 발을 내려 여름밤의 온기를 더해요.'},
    plaque:{name:'달빛 문패',price:7200,level:10,area:'outside',description:'입구 옆에 황동 달 장식이 박힌 나무 문패를 달아요.'}
  });
  const levels=[
    {level:1,xp:0,reputation:0,satisfaction:0,name:'골목의 작은 불빛'},
    {level:2,xp:450,reputation:25,satisfaction:65,name:'다시 찾는 한 끼'},
    {level:3,xp:1500,reputation:40,satisfaction:70,name:'이웃의 단골집'},
    {level:4,xp:3200,reputation:55,satisfaction:75,name:'밤의 소문난 식당'},
    {level:5,xp:5500,reputation:65,satisfaction:78,name:'골목의 오래된 약속'},
    {level:6,xp:8500,reputation:72,satisfaction:80,name:'계절을 담는 부엌'},
    {level:7,xp:12000,reputation:78,satisfaction:82,name:'먼 길 끝의 한 상'},
    {level:8,xp:16000,reputation:84,satisfaction:84,name:'도시가 기억하는 맛'},
    {level:9,xp:20500,reputation:90,satisfaction:86,name:'밤을 잇는 식탁'},
    {level:10,xp:26000,reputation:95,satisfaction:88,name:'손맛이 깊어지는 식당'}
  ];
  upgrades.fridge={name:'새 단풍빛 냉장고',price:18000,level:20,area:'inside',description:'주방 왼쪽의 낡은 냉장고를 같은 자리에 깨끗한 아이보리 냉장고로 교체해요. 재료 구매가 10% 할인돼요.'};
  for(let level=11;level<=34;level++)levels.push({level,xp:26000+(level-10)*4200+(level-10)**2*180,reputation:Math.min(100,95+Math.floor((level-10)/2)),satisfaction:Math.min(94,88+Math.floor((level-10)/4)),name:level===34?'백 가지 밤의 주인장':level===20?'골목을 지키는 오래된 부엌':`깊어지는 밤의 부엌 ${level-10}`});
  function satisfaction(s) { return s.totalServed ? Math.round(s.satisfactionTotal / s.totalServed) : 0; }
  function progress(s) {
    for (const l of levels) if (s.xp >= l.xp && s.reputation >= l.reputation && satisfaction(s) >= l.satisfaction) s.level = Math.max(s.level, l.level);
    s.unlocked=[...new Set([...s.unlocked,...Object.keys(recipes).filter(id=>recipes[id].level<=s.level)])];
    return s.level;
  }
  function patience(g) {return Math.max(0,1-(g.waitMs||0)/(105000+(g.person%4)*15000));}
  function cookSpec(s,id) {
    const i=Object.keys(recipes).indexOf(id),shift=((s.night+i)%3-1)*.025;
    return {ideal:[.65,.56,.74,.48,.68,.77,.61][i%7]+shift,prepIdeal:.48+((s.night+i)%4)*.055,
      prepTime:Math.max(2100,2900-s.level*55),heatTime:Math.max(3600,5400-s.level*130),tolerance:Math.max(.095,.18-s.level*.009),band:Math.max(.065,.11-s.level*.004)};
  }
  const openings=['긴 하루 끝에 이 불빛이 보여서 들어왔어요.','오늘은 든든하게 한 끼 먹고 싶네요.','문을 여니 좋은 냄새가 먼저 반겨 주네요.','이 시간에 따뜻한 밥을 먹을 수 있어 다행이에요.','조금 멀리 돌아왔는데, 여기까지 오길 잘했어요.','바깥은 바쁜데 여기는 시간이 천천히 흐르네요.','오늘은 평소와 다른 맛을 먹어 보고 싶어요.','잠깐 쉬었다 가려고요. 편한 자리가 있네요.','친구가 이 골목의 작은 가게를 알려 줬어요.','이런 나무 카운터 앞에 앉으면 마음이 놓여요.','배가 고픈 줄도 모르고 하루를 보냈네요.','들어오자마자 한결 편안해졌어요.'];
  const requests=['{dish}, 부탁드릴게요.','오늘은 {dish}, 이게 가장 당기네요.','{dish}, 천천히 즐기고 싶어요.','저는 오늘 {dish}, 먹어 보고 싶어요.','하루 끝에 {dish}, 괜찮겠죠?','{dish}, 이 가게만의 맛이 궁금해요.','{dish}, 준비해 주실래요?','{dish}, 정성껏 부탁해요.','{dish}, 오늘은 이걸로 정했어요.','{dish}, 기다리는 동안 잠깐 쉬어 갈게요.'];
  function dialogue(g) {
    const k=g.lineKey||0,begin=openings[k%openings.length],end=requests[Math.floor(k/openings.length)%requests.length].replace('{dish}',recipes[g.recipe].name);
    return `${begin} ${g.omakase?'주인장의 추천을 믿어 볼게요. ':''}${end}`;
  }
  function chooseRecipe(s,omakase) {
    const ids=s.unlocked.filter(id=>recipes[id].level<=s.level),recent=s.recentOrders.slice(-4);
    const counts=id=>s.nightOrders.filter(x=>x===id).length;
    const floor=Math.min(...ids.map(counts));let pool=ids.filter(id=>counts(id)===floor&&!recent.includes(id));
    if(!pool.length)pool=ids.filter(id=>counts(id)===floor);
    if(s.nightOrders.some(id=>recipes[id].family==='riceball')&&pool.some(id=>recipes[id].family!=='riceball'))pool=pool.filter(id=>recipes[id].family!=='riceball');
    if(omakase&&pool.includes(s.special))return s.special;
    return pool[(s.dialogueSerial+s.night-1)%pool.length];
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
    return { revenue: s.nightRevenue, tips: s.nightTips, expenses:s.nightCosts||0,storyIncome:s.storyIncome||0,storyCosts:s.storyCosts||0, money: s.money, net: s.money - start.money,
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
    version:5,dialogueSerial:0,recentOrders:[],nightOrders:[],storyRun:null,storyMemory:[],pendingConsequences:[],nightNews:[],storyIncome:0,storyCosts:0,nextVisitor: 0, nightVisitors: [], xp: 0, level: 1, satisfactionTotal: 0, customerBook: {},
    nightStart: { money: 3200, reputation: 12, satisfaction: 0, xp: 0, level: 1 }, introSeen: false, night: 1, phase: 'prep', money: 3200, reputation: 12,
    totalServed: 0, inventory: Object.assign({rice:5,nori:5,egg:4,dashi:6,pork:2,miso:2,salmon:0},Object.fromEntries(Object.keys(C.ingredients).map(id=>[id,2]))),
    unlocked:Object.keys(recipes).filter(id=>recipes[id].level===1), upgrades: [], special: 'onigiri',
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
    const v=JSON.parse(raw);
    if(v&&[2,3,4].includes(v.version)&&v.inventory&&typeof v.inventory==='object'&&!Array.isArray(v.inventory))for(const id of Object.keys(C.ingredients))if(v.inventory[id]===undefined)v.inventory[id]=0;
    const integer = (n, min = 0, max = 1e9) => Number.isSafeInteger(n) && n >= min && n <= max;
    if (!v || ![2,3,4,5].includes(v.version) || typeof v.introSeen !== 'boolean' || !integer(v.night, 1) ||
      !['prep', 'open', 'end'].includes(v.phase) || !integer(v.money) || !integer(v.reputation, 0, 100) ||
      !integer(v.totalServed) || !v.inventory || !Object.keys(ingredients).every(id => integer(v.inventory[id], 0, 999)) ||
      !Array.isArray(v.unlocked) || !['onigiri', 'tamago', 'tonjiru'].every(id => v.unlocked.includes(id)) ||
      !v.unlocked.every(id => Object.hasOwn(recipes, id)) || !v.unlocked.includes(v.special) ||
      !Array.isArray(v.upgrades) || !v.upgrades.every(id => Object.hasOwn(upgrades, id)) ||
      !integer(v.arrived, 0, 15) || !integer(v.target, 3, 15) || v.arrived > v.target ||
      (v.nightCosts!==undefined&&!integer(v.nightCosts)) || !integer(v.nightRevenue) || !integer(v.nightTips) || !integer(v.nightStartRep, 0, 100) ||
      !Array.isArray(v.nightScores) || v.nightScores.length > v.arrived || !v.nightScores.every(n => integer(n, 0, 100)) ||
      !['none', 'pending', 'resolved'].includes(v.event) || !(v.eventChoice===null||['listen','dismiss',...S.stories.flatMap(t=>t.choices.map(c=>c.id))].includes(v.eventChoice)) ||
      !Array.isArray(v.guests) || v.guests.length > 3 || !v.guests.every(g =>
        g && integer(g.id, 1, 15) && g.id <= v.arrived && integer(g.person, 0, 1000000) &&
        integer(g.seat, 0, 2) && v.unlocked.includes(g.recipe) && typeof g.omakase === 'boolean' &&
        ['waiting', 'eating', 'left'].includes(g.status) && integer(g.score, 0, 100) && (g.waitMs===undefined || (Number.isFinite(g.waitMs)&&g.waitMs>=0&&g.waitMs<=1e9))) ||
      new Set(v.guests.map(g => g.seat)).size !== v.guests.length ||
      new Set(v.guests.map(g => g.id)).size !== v.guests.length) throw new Error('Invalid save');
    const restored = { ...s, ...v,version:5,lastResult:null };
    if (v.version === 2) {
      restored.xp = v.totalServed * 70;
      restored.satisfactionTotal = v.totalServed * 70;
      restored.customerBook = {};
      restored.target = 9;
      // Continue old three-guest saves instead of silently ending their night.
      if (v.phase === 'end') restored.phase = 'prep';
      restored.nightStart = { money: Math.max(0, v.money - v.nightRevenue), reputation: v.nightStartRep, satisfaction: 70, xp: restored.xp, level: 1 };
    } else if (!integer(v.xp) || !integer(v.level,1,34) || !integer(v.satisfactionTotal) || v.satisfactionTotal > v.totalServed * 100 ||
      !v.nightStart || !integer(v.nightStart.money) || !integer(v.nightStart.reputation,0,100) || !integer(v.nightStart.satisfaction,0,100) || !integer(v.nightStart.xp) || !integer(v.nightStart.level,1,34) ||
      !v.customerBook || Array.isArray(v.customerBook) || !Object.entries(v.customerBook).every(([id,c]) => /^\d+$/.test(id) && Number(id) <= 1000000 && c && integer(c.visits) && integer(c.lastScore,0,100) && integer(c.lastVisitNight) && integer(c.dueNight)&&(c.affinity===undefined||integer(c.affinity,0,20)))) throw new Error('Invalid progress');
    for (const g of restored.guests) if (!restored.customerBook[g.person]) restored.customerBook[g.person] = {visits:1,lastScore:g.score,lastVisitNight:restored.night,dueNight:restored.night+2};
    if(v.version<4){
      restored.nextVisitor=Math.max(6,...Object.keys(restored.customerBook).map(id=>Number(id)+1));
      restored.nightVisitors=Object.entries(restored.customerBook).filter(([,c])=>c.lastVisitNight===restored.night).map(([id])=>Number(id));
      for(const c of Object.values(restored.customerBook))c.dueLevel=c.lastScore>=90?restored.level+2:0;
    }else if(!integer(v.nextVisitor,0,1000001)||!Array.isArray(v.nightVisitors)||v.nightVisitors.length>9||new Set(v.nightVisitors).size!==v.nightVisitors.length||!v.nightVisitors.every(id=>integer(id,0,1000000))||!Object.values(v.customerBook).every(c=>integer(c.dueLevel,0,36)))throw new Error('Invalid visitor schedule');
    restored.nextVisitor=Math.max(restored.nextVisitor,...Object.keys(restored.customerBook).map(id=>Number(id)+1));
    if(v.version<5){
      restored.dialogueSerial=restored.totalServed+restored.arrived;restored.recentOrders=restored.guests.map(g=>g.recipe);restored.nightOrders=[...restored.recentOrders];
      restored.guests.forEach(g=>g.lineKey=(restored.night-1)*9+g.id);
    }else {
      const run=v.storyRun,validRun=run===null||(run&&S.stories.some(t=>t.id===run.id)&&integer(run.step,0,2)&&integer(run.night,1)&&Array.isArray(run.cast)&&run.cast.length===2&&run.cast.every(id=>integer(id,0,1000000))&&S.stories.find(t=>t.id===run.id).choices.some(c=>c.id===run.choice||run.choice===null)&&(run.reflection===null||S.reflection.some(c=>c.id===run.reflection)));
      const validToken=t=>t&&integer(t.night,1)&&S.stories.some(st=>st.id===t.id&&st.choices.some(c=>c.id===t.choice));
      if(!integer(v.dialogueSerial)||!Array.isArray(v.recentOrders)||v.recentOrders.length>36||!v.recentOrders.every(id=>Object.hasOwn(recipes,id))||!Array.isArray(v.nightOrders)||v.nightOrders.length>9||!v.nightOrders.every(id=>Object.hasOwn(recipes,id))||!v.guests.every(g=>integer(g.lineKey))||!validRun||!Array.isArray(v.storyMemory)||v.storyMemory.length>200||!v.storyMemory.every(validToken)||!Array.isArray(v.pendingConsequences)||!v.pendingConsequences.every(validToken)||!Array.isArray(v.nightNews)||!v.nightNews.every(validToken)||!integer(v.storyIncome)||!integer(v.storyCosts))throw new Error('Invalid content progress');
    }
    progress(restored);return restored;

  }
  function open(s) {
    if (s.phase !== 'prep') return false;
    progress(s);
    Object.assign(s, {storyRun:null,nightOrders:[],nightNews:[],storyIncome:0,storyCosts:0,phase: 'open', guests: [], arrived: 0, target: 9, nightVisitors: [],
      nightStart: {money:s.money, reputation:s.reputation, satisfaction:satisfaction(s), xp:s.xp, level:s.level},
      nightRevenue: 0, nightTips: 0, nightCosts: 0, nightScores: [], event: 'none', eventChoice: null, nightStartRep: s.reputation, lastResult: null });
    applyFollowups(s);return true;
  }
  function arrive(s) {
    if (s.phase !== 'open' || s.arrived >= s.target) return null;
    const seat = [0, 1, 2].find(n => !s.guests.some(g => g.seat === n && g.status !== 'left'));
    if (seat === undefined) return null;
    s.guests = s.guests.filter(g => g.seat !== seat);
    const freshFace=id=>!s.nightVisitors.some(previous=>previous%people.length===id%people.length);
    const roll=((s.night*37+s.arrived*19+s.nextVisitor*11)%100)/100;
    const due=Object.entries(s.customerBook).find(([id,c])=>c.lastScore>=90&&c.dueLevel<=s.level&&c.lastVisitNight<s.night&&freshFace(Number(id))&&roll<Math.min(.9,.5+(c.lastScore-90)*.025+(c.affinity||0)*.01));
    let visitor;
    if(due)visitor=Number(due[0]);
    else {while(!freshFace(s.nextVisitor))s.nextVisitor++;visitor=s.nextVisitor++;}
    const p=person(visitor);
    const omakase=(visitor+s.night+s.arrived)%3===0,recipe=chooseRecipe(s,omakase);
    const lineKey=s.dialogueSerial++;s.nightOrders.push(recipe);s.recentOrders=[...s.recentOrders,recipe].slice(-36);
    const g = { id: ++s.arrived, person: visitor, seat, recipe, omakase,lineKey,status: 'waiting', score: 0, waitMs: 0 };
    const memory = s.customerBook[visitor] || {visits:0,lastScore:0,lastVisitNight:0,dueNight:0,dueLevel:0};
    if (memory.lastVisitNight !== s.night) memory.visits++;
    memory.lastVisitNight = s.night; s.customerBook[visitor] = memory; s.nightVisitors.push(visitor);
    s.guests.push(g);
    if (s.arrived === 1 && s.upgrades.includes('plants')) s.reputation = clamp(s.reputation + 2, 0, 100);
    return g;
  }
  function buyPrice(s,id){return Math.round(ingredients[id].price*(s.upgrades.includes('fridge')?.9:1));}
  function buy(s, id) {
    if (!Object.hasOwn(ingredients, id)) return false;
    const item = ingredients[id];
    if (!item || s.money < buyPrice(s,id) || s.inventory[id] >= 999) return false;
    s.money -= buyPrice(s,id); s.inventory[id]++; return true;
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
  function ensureStory(s) {
    if(!s.storyRun){const st=S.stories[(s.night-1)%S.stories.length],cast=s.guests.slice(0,2).map(g=>g.person);while(cast.length<2)cast.push(cast.length);s.storyRun={id:st.id,night:s.night,step:s.event==='resolved'?2:0,cast,choice:null,reflection:null};}
    return s.storyRun;
  }
  function story(s) {
    if(s.event==='none')return null;const run=ensureStory(s),definition=S.stories.find(t=>t.id===run.id);
    const choice=definition.choices.find(c=>c.id===run.choice);
    return {run,definition,choice,reflection:S.reflection.find(c=>c.id===run.reflection)};
  }
  function canChoose(s,c) {return s.money>=Math.max(0,-(c.money||0))&&Object.entries(c.ingredients||{}).every(([id,n])=>s.inventory[id]>=n);}
  function applyChoice(s,c,cast) {
    s.money+=c.money||0;if((c.money||0)<0)s.storyCosts-=c.money;
    Object.entries(c.ingredients||{}).forEach(([id,n])=>s.inventory[id]-=n);
    s.reputation=clamp(s.reputation+(c.rep||0),0,100);
    for(const id of cast){const book=s.customerBook[id];if(book)book.affinity=Math.min(20,(book.affinity||0)+(c.affinity||0));}
    progress(s);
  }
  function applyFollowups(s) {
    for(const token of s.pendingConsequences.filter(t=>t.night<=s.night)){
      const future=S.stories.find(t=>t.id===token.id)?.choices.find(c=>c.id===token.choice)?.future;if(!future)continue;
      s.money+=future.money||0;s.storyIncome+=future.money||0;s.reputation=clamp(s.reputation+(future.rep||0),0,100);
      Object.entries(future.ingredients||{}).forEach(([id,n])=>s.inventory[id]=Math.min(999,s.inventory[id]+n));s.nightNews.push(token);
    }
    s.pendingConsequences=s.pendingConsequences.filter(t=>t.night>s.night);progress(s);
  }
  function news(s) {return s.nightNews.map(t=>S.stories.find(st=>st.id===t.id).choices.find(c=>c.id===t.choice).future);}
  function conversation(s) {
    if(s.phase!=='open'||s.event!=='none'||s.guests.filter(g=>g.status!=='left').length<2)return false;
    s.event='pending';ensureStory(s);return true;
  }
  // A small safety net for spending all cash before noticing missing ingredients.
  function rescueNeeds(s) {
    if (s.phase !== 'open') return null;
    const needed = {};
    s.guests.filter(g => g.status === 'waiting').forEach(g => recipes[g.recipe].ingredients.forEach(id => {
      needed[id] = (needed[id] || 0) + 1;
    }));
    const missing = Object.fromEntries(Object.entries(needed).map(([id, n]) => [id, Math.max(0, n - s.inventory[id])]).filter(([, n]) => n));
    const cost = Object.entries(missing).reduce((sum, [id, n]) => sum + n * buyPrice(s,id), 0);
    return cost > s.money ? missing : null;
  }
  function rescue(s) {
    const missing = rescueNeeds(s);
    if (!missing) return false;
    Object.entries(missing).forEach(([id, n]) => { s.inventory[id] += n; });
    s.reputation = clamp(s.reputation - 3, 0, 100); return true;
  }
  function resolveEvent(s,id) {
    if(s.event!=='pending')return false;
    const view=story(s),run=view.run;
    if(run.step===0){
      const choice=view.definition.choices.find(c=>c.id===id);if(!choice||!canChoose(s,choice))return false;
      applyChoice(s,choice,run.cast);run.choice=id;run.step=1;return true;
    }
    if(run.step===1){const choice=S.reflection.find(c=>c.id===id);if(!choice)return false;applyChoice(s,choice,run.cast);run.reflection=id;run.step=2;s.event='resolved';s.eventChoice=run.choice;
      const token={id:run.id,choice:run.choice,night:s.night+1};s.pendingConsequences.push(token);s.storyMemory=[...s.storyMemory,{...token,night:s.night}].slice(-200);return true;
    }
    return false;
  }
  function canClose(s) { return s.phase === 'open' && s.arrived === s.target && s.nightScores.length === s.target && s.event !== 'pending'; }
  function close(s) { if (!canClose(s)) return false; s.nightCosts=Math.min(s.money,650+s.nightStart.level*250);s.money-=s.nightCosts;s.phase = 'end'; return true; }
  function next(s) {
    if (s.phase !== 'end') return false;
    s.night++; s.phase = 'prep'; s.guests = []; s.lastResult = null; return true;
  }
  const api = { buyPrice,dialogue,chooseRecipe,story,news,canChoose,storyContent:S,patience,cookSpec,person, levels, satisfaction, progress, regular, gift, report, ingredients, recipes, people, upgrades, fresh, restore, open, arrive, buy, unlock, upgrade, serve, conversation, rescueNeeds, rescue, resolveEvent, canClose, close, next };
  if (typeof module !== 'undefined') module.exports = api;
  else window.MidnightEngine = api;
})();
