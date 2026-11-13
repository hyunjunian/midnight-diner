/* Serializable game rules, shared by the browser and the Node test runner. */
(() => {
  'use strict';
  const C=typeof module!=='undefined'?require('./catalog.js'):window.MidnightCatalog;
  const D=typeof module!=='undefined'?require('./guest-dialogue.js'):window.MidnightGuestDialogue;
  const S=typeof module!=='undefined'?require('./stories.js'):window.MidnightStories;
  const Cooking=typeof module!=='undefined'?require('./cooking-rules.js'):window.MidnightCookingRules;
  const Growth=typeof module!=='undefined'?require('./growth-v77.js'):window.MidnightGrowth;
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
  ingredients.vegetables.name='양배추·대파';
  const recipes=C.recipes;
  for(const [id,r]of Object.entries(recipes)){
    r.family=/onigiri/.test(id)?'riceball':/udon|soba|ramen|tantan/.test(id)?'noodle':/soup|misoshiru|tonjiru|nabe|shabu|sukiyaki/.test(id)?'soup':/katsu|fry|tempura|karaage|croquette/.test(id)?'fry':/egg|tamago|omelette|chawan/.test(id)?'egg':'plate';
    r.method={riceball:'겉면은 바삭하게, 밥알은 촉촉하게 익혀요.',noodle:'면의 탄력을 살펴 너무 퍼지기 전에 마무리해요.',soup:'국물이 부드럽게 끓고 향이 올라올 때 불을 줄여요.',fry:'표면이 고르게 노릇해지는 순간에 건져요.',egg:'달걀의 결이 촉촉하게 잡히는 순간을 살펴요.',plate:'재료의 색과 온도를 살피며 정성껏 마무리해요.'}[r.family];
  }
  for(const [id,item]of Object.entries(ingredients)){
    item.level=Math.min(...Object.values(recipes).filter(r=>r.ingredients.includes(id)).map(r=>r.level));
    item.storage=['pork','salmon','shrimp','chicken','beef','tuna','clam','scallops','oyster','crab','fish'].includes(id)?'freezer':'fridge';
  }
  const ingredientAvailable=(s,id)=>Object.hasOwn(ingredients,id)&&ingredients[id].level<=s.level;
  const people = [
    { name: '하루', role: '막차를 놓친 편집자', age: '32세', style: '깔끔하고 단정한 스타일', bio: '작은 출판사에서 일해요. 마감 뒤에는 바삭한 밥 한 입으로 하루를 정리합니다.', color: '#c88b69', hair: '#382c32', dish: 'onigiri' },
    { name: '렌', role: '동네 꽃집 주인', age: '34세', style: '안경과 포근한 카디건', bio: '골목 입구 꽃집을 지켜요. 남의 마음은 잘 읽지만 자기 이야기는 조금 서툴러요.', color: '#819c8c', hair: '#4c3930', dish: 'tamago' },
    { name: '유키', role: '야간 버스 기사', age: '48세', style: '단정한 남색 작업복', bio: '마지막 운행을 끝내고 찾아옵니다. 뜨거운 국물을 천천히 먹는 시간을 좋아해요.', color: '#8193b2', hair: '#282b38', dish: 'tonjiru' },
    { name: '소라', role: '골목의 사진가', age: '28세', style: '짧은 머리와 머스터드 재킷', bio: '밤의 골목을 카메라에 담아요. 처음 만난 가게에서는 주인장의 추천을 믿어요.', color: '#bb9b67', hair: '#564138', dish: 'special' },
    { name: '나오', role: '새벽의 제빵사', age: '38세', style: '묶은 머리와 차분한 셔츠', bio: '반죽이 부푸는 동안 잠깐 쉬러 와요. 정성스러운 밥에서 일할 힘을 얻습니다.', color: '#ac84a0', hair: '#413332', dish: 'special' },
    { name: '아키', role: '여행 온 손님', age: '27세', style: '편안한 여행 차림', bio: '지도에 없는 골목을 좋아해요. 맛있는 기억이 생기면 며칠 더 머무릅니다.', color: '#b57870', hair: '#343c3d', dish: 'special' },
  ];
  people[2].age='52세';people[3].age='25세';people[4].age='48세';people[4].style='둥근 얼굴과 새치 섞인 묶음머리';people[5].age='22세';
  people.push({"name": "후미", "role": "은퇴한 국어 선생님", "age": "72세", "style": "은빛 파마머리와 둥근 안경", "bio": "책을 덮은 뒤에는 골목을 천천히 걸어요. 오랫동안 학생들과 나누었던 이야기를 기억합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special"});
  people.push({"name": "다이치", "role": "체육학과 대학생", "age": "19세", "style": "짧은 머리와 청록 후드", "bio": "늦은 연습을 마치면 든든한 한 끼가 필요해요. 누구보다 맛있게 밥을 먹습니다.", "color": "#62786e", "hair": "#423b33", "dish": "special"});
  people.push({"name": "사치", "role": "골목의 재봉사", "age": "66세", "style": "회색 땋은 머리와 올리브 숄", "bio": "작은 수선집에서 오래된 옷을 고쳐요. 서두르지 않는 식당을 좋아합니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special"});
  people.push({"name": "고로", "role": "현장 반장", "age": "43세", "style": "넓은 어깨와 주황 작업복", "bio": "밤 공사를 마치고 찾아왔어요. 동료들과 나눌 다음 식당 이야기를 찾습니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special"});
  people.push({"name": "마키", "role": "야간 병동 간호사", "age": "39세", "style": "직사각 안경과 단정한 묶음머리", "bio": "다른 사람의 식사를 챙기다 이제야 쉬러 왔어요. 편안한 한 끼가 필요합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special"});
  people.push({"name": "신지", "role": "재즈 연주자", "age": "61세", "style": "은빛 수염과 검은 터틀넥", "bio": "마지막 연주가 끝나면 허기가 찾아와요. 오래된 노래와 담백한 음식을 좋아합니다.", "color": "#62786e", "hair": "#423b33", "dish": "special"});
  people.push({"name": "케이코", "role": "극장 의상 담당", "age": "58세", "style": "짧은 적갈색 곱슬머리와 자주 코트", "bio": "공연이 끝난 뒤 의상을 정리해요. 따뜻한 가게에서 하루의 긴장을 풀고 싶어 합니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special"});
  people.push({"name": "미나토", "role": "잡지 교정자", "age": "29세", "style": "단정한 정장과 둥근 안경", "bio": "활자 사이의 작은 오자를 찾는 일을 해요. 식사할 때만큼은 천천히 쉬고 싶습니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special"});
  people.push({"name": "메이", "role": "미대 학생", "age": "21세", "style": "적갈색 짧은 곱슬머리와 민트 니트", "bio": "밤새 그린 그림 이야기를 좋아해요. 새로운 맛에서 영감을 얻곤 합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special"});
  people.push({"name": "이사오", "role": "은퇴한 목수", "age": "76세", "style": "흰 옆머리와 갈색 조끼", "bio": "이 골목의 오래된 가게들을 기억해요. 나무 향이 나는 공간을 좋아합니다.", "color": "#62786e", "hair": "#423b33", "dish": "special"});
  people.push({"name": "레이코", "role": "출판사 영업 담당", "age": "45세", "style": "짙은 일자머리와 붉은 재킷", "bio": "온종일 사람을 만나고 온 날이에요. 말없이 편하게 먹을 수 있는 자리를 찾습니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special"});
  people.push({"name": "히로", "role": "이웃 가게 요리사", "age": "36세", "style": "긴 웨이브 머리와 옅은 수염", "bio": "자기 가게를 마감하고 다른 사람의 요리를 먹으러 와요. 주인장의 정성을 잘 알아봅니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special"});
  people.push({"name": "치요", "role": "동네 차 선생님", "age": "68세", "style": "은빛 단발과 황토색 겉옷", "bio": "차를 가르치며 오래 살아온 동네예요. 조용한 예절과 소박한 맛을 좋아합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special"});
  people.push({"name": "타쿠", "role": "자전거 수리공", "age": "24세", "style": "바가지머리와 청바지 재킷", "bio": "가게 문을 닫고 손을 깨끗이 씻은 뒤 찾아와요. 밝은 웃음이 인상적입니다.", "color": "#62786e", "hair": "#423b33", "dish": "special"});
  people.push({"name": "아야", "role": "자동차 정비사", "age": "27세", "style": "높이 묶은 곱슬머리와 주근깨", "bio": "늦은 정비를 끝내고 따뜻한 밥을 먹으러 왔어요. 새로운 식당을 발견하면 기뻐합니다.", "color": "#8e6860", "hair": "#423b33", "dish": "special"});
  people.push({"name": "겐", "role": "야간 배송 기사", "age": "55세", "style": "짧은 새치머리와 초록 작업복", "bio": "물건을 모두 전하고 나면 허기가 져요. 든든한 식사와 짧은 인사를 좋아합니다.", "color": "#6d6b7d", "hair": "#423b33", "dish": "special"});
  people.push({"name": "리나", "role": "도서관 사서", "age": "34세", "style": "긴 검은 땋은 머리와 크림 숄", "bio": "책 정리를 마치고 골목을 걸어요. 마음에 드는 식당은 책갈피처럼 오래 기억합니다.", "color": "#78755c", "hair": "#423b33", "dish": "special"});
  people.push({"name": "오사무", "role": "중고서점 주인", "age": "40세", "style": "소금빛 짧은 머리와 푸른 셔츠", "bio": "서점 불을 끄고 저녁을 먹으러 왔어요. 누군가 골라 준 음식에 작은 기대를 품습니다.", "color": "#62786e", "hair": "#423b33", "dish": "special"});
  people.forEach((p,i)=>{p.line=D.say({person:i},'hello');});
  const familyNames=['사토','모리','다나카','아오키','하야시','기무라','이노우에','오노','야마모토','다카하시','이시카와','고바야시'];
  function person(id) {
    const base=people[id%people.length];
    if(id<people.length)return base;
    return {...base,name:`${familyNames[Math.floor(id/people.length)%familyNames.length]} ${base.name}`,bio:base.bio};
  }
  const F=typeof module!=='undefined'?require('./furnishings.js'):window.MidnightFurnishings,upgrades=F.upgrades;
  const R=typeof module!=='undefined'?require('./renovation.js'):window.MidnightRenovation;
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
  for(let level=11;level<=50;level++)levels.push({level,xp:26000+(level-10)*4200+(level-10)**2*180,reputation:Math.min(100,95+Math.floor((level-10)/2)),satisfaction:Math.min(94,88+Math.floor((level-10)/4)),name:level===50?'골목에 오래 남을 심야식당':level===34?'백 가지 밤의 주인장':level===20?'골목을 지키는 오래된 부엌':`깊어지는 밤의 부엌 ${level-10}`});
  for(const l of levels)l.atmosphere=R.atmosphereTarget(l.level);
  function atmosphere(s){return R.totals(s).atmosphere;}
  function environment(s){return R.totals(s).environment;}
  const hasUpgrade=(s,slot)=>!!F.activeId(s,slot);
  function heatLook(s,id,value){if(!Cooking.heated.includes(id))return 'good';const spec=cookSpec(s,id);return value<spec.ideal-spec.band/2?'raw':value>Math.min(.94,spec.ideal+spec.band*2)?'burnt':value>spec.ideal+spec.band/2?'dry':'good';}
  function kitchenLook(s){const k=s.kitchen,g=s.guests.find(g=>g.id===k?.guest);if(!g||!k)return 'good';const hi=Cooking.plan(g.recipe,recipes[g.recipe]).findIndex(st=>st.id==='heat');return hi>=0&&k.step>hi?heatLook(s,g.recipe,k.heatValue??cookSpec(s,g.recipe).ideal+(1-k.marks[hi])*cookSpec(s,g.recipe).tolerance):'good';}
  function reviewText(bill,seed=0){
    const g={person:seed},key=bill.waitPenalty>0?'waitReview':bill.heat<70?'heatReview':bill.score>=90?'high':bill.score>=70?'mid':'low';
    return D.say(g,key);
  }

  function satisfaction(s) { return s.totalServed ? Math.round(s.satisfactionTotal / s.totalServed) : 0; }
  function progress(s) {
    for (const l of levels) if (s.xp >= l.xp && l.level<=Growth.levelLimit(s)) s.level = Math.max(s.level, l.level);
    s.unlocked=[...new Set([...s.unlocked,...Object.keys(recipes).filter(id=>recipes[id].level<=s.level)])];
    return s.level;
  }
  const growthBenefits=s=>Growth.benefits(R.totals(s));
  const trialComplete=s=>Growth.needsPass(s,levels[2].xp);
  function operatingCost(s){const level=s.phase==='prep'?s.level:s.nightStart.level;return Math.round((650+level*250)*(1-growthBenefits(s).operatingDiscount/100));}
  function patience(g,s) {return Math.max(0,1-(g.waitMs||0)/(105000+(g.person%4)*15000+(s?F.benefits(s).patience*1000:0)));}
  function cookSpec(s,id) {
    const i=Object.keys(recipes).indexOf(id),shift=((s.night+i)%3-1)*.025;
    return {ideal:[.65,.56,.74,.48,.68,.77,.61][i%7]+shift,prepIdeal:.48+((s.night+i)%4)*.055,
      prepTime:Math.max(2100,2900-s.level*55),heatTime:Math.max(3600,5400-s.level*130),tolerance:Math.max(.095,.18-s.level*.009)+F.benefits(s).tolerance,band:Math.max(.065,.11-s.level*.004)+F.benefits(s).tolerance};
  }
  function dialogue(g){return `${D.say(g,'hello')} ${D.say(g,'order',{dish:recipes[g.recipe].name})}`;}
  function guestServiceLines(s,g){
    const values={dish:recipes[g.recipe].name,total:`¥${g.bill?.total?.toLocaleString('ja-JP')||0}`};
    if(g.status==='farewell')return [D.say(g,g.score>=90?'high':g.score>=65?'mid':'low'),D.say(g,D.returning(s,g)?'otherBye':'bye')];
    if(g.status==='paying')return [D.say(g,'paying'),D.say(g,'receipt',values)];
    return [D.say(g,'eating',values)];
  }
  // Knowledge belongs to a person, while the conversation position belongs to this visit.
  // Both are optional v11 additions: older saves retain their entire service/financial state.
  const guestFacts=['name','role','age','style','bio'];
  const guestNodes=['hello','tale','taleResult','intro','day','warm','quiet','about','order','odd','odder','hush','hum','hum2','song','lost','sung','sung2'];
  const guestReplies={
    welcome:'어서 오세요. 편히 앉으세요.',
    day:'오늘은 좀 어떠셨어요?',
    menu:'뭘로 드릴까요?',
    warm:'조금 더 들려주세요.',
    quiet:'편히 쉬었다 가세요.',
    about:'실례지만 나이가 어떻게 되세요?',
    order:'드실 음식은 정하셨어요?',
    probe:'',probe2:'',broth:'',echo:'',settle:'',hum:'',hum2:'',pass:'',heard:'',
  };
  function guestProfile(s,id){
    const p=person(id),known=(s.customerBook[id]?.known||[]).filter(x=>guestFacts.includes(x));
    return {known,name:p.name,
      role:known.includes('role')?p.role:null,age:known.includes('age')?p.age:null,
      style:known.includes('style')?p.style:null,bio:known.includes('bio')?p.bio:null};
  }
  // 0: tonight's story waits for the owner's choice, 1: it waits for the closing reflection, -1: neither.
  function chapterStep(s){
    if(s.event!=='pending')return -1;
    const run=ensureStory(s),definition=S.stories.find(t=>t.id===run.id);
    return definition?.tale&&run.step<2?run.step:-1;
  }
  // ---- The hidden episode ----
  // Fragments of one buried story surface only deep inside ordinary talk (a guest lets something
  // slip, the owner may ask about it) and in a few rare events. Which guest carries what is fixed
  // by the night and the seat, so a reload changes nothing; what the owner has heard is the only
  // state ("whispers"), and no screen shows it.
  const W=S.whispers;
  const whisperHash=(...parts)=>{let h=2166136261;for(const ch of parts.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>9)%1000;};
  const heard=(s,id)=>(s.whispers||[]).includes(id);
  const heardCount=s=>(s.whispers||[]).filter(id=>W.fragments.some(f=>f.id===id)||W.notes.some(f=>f.id===id)).length;
  const whisperOpen=(s,f)=>!heard(s,f.id)&&f.needs.every(id=>heard(s,id))&&heardCount(s)>=(f.count||0)&&(!f.after||hasMemory(s,f.after));
  function whisperFor(s,g){
    // At most one guest a night carries a fragment, and not every night.
    if(s.night<W.startNight||whisperHash('night',s.night)%100>=W.chance||g.id!==1+whisperHash('seat',s.night)%9)return null;
    const open=W.fragments.filter(f=>whisperOpen(s,f)).slice(0,3);
    return open.length?open[whisperHash('which',s.night)%open.length]:null;
  }
  // Something the owner notices alone: at most one a night, at one early guest's greeting.
  function whisperNote(s,g){
    if(s.night<W.startNight||whisperHash('note',s.night)%100>=W.noteChance||g.id!==1+whisperHash('noteSeat',s.night)%3)return null;
    return [...W.notes,...Y.notes].find(f=>whisperOpen(s,f))||null;
  }
  const quietNight=(s,g)=>g.id===W.quiet.guest&&W.quiet.needs.every(id=>heard(s,id))&&whisperHash('quiet',s.night)%100<W.quiet.chance;
  function hear(s,id){if(!heard(s,id))s.whispers=[...(s.whispers||[]),id];}
  // ---- The second hidden episode: a song in six lines ----
  // Each line is known to a different guest, who hums it after ordering on some nights; the owner
  // may ask. The lines are met out of order. When all six have been heard, on a rare night a
  // guest who knows only the first asks for the rest, and only an owner who has worked out the
  // order can give them. It shares the "whispers" save field and, like the first, has no screen.
  const Y=S.lullaby;
  const songKnown=s=>Y.lines.every(l=>heard(s,l.id));
  function humFor(s,g){
    if(s.night<Y.startNight||g.status!=='seated'||g.chat?.told||g.chat?.hummed)return null;
    if(whisperHash('hum',s.night)%100>=Y.chance||g.id!==1+whisperHash('humSeat',s.night)%9)return null;
    // The next line not yet heard, in the order they are found; afterwards any line may come round again.
    const id=Y.found.find(x=>!heard(s,x))||Y.found[whisperHash('again',s.night)%Y.found.length];
    return Y.lines.find(l=>l.id===id);
  }
  const songNight=(s,g)=>g.id===Y.finale.guest&&songKnown(s)&&!heard(s,'sung')&&whisperHash('song',s.night)%100<Y.finale.chance;
  // Three lines to choose from for the one that follows line number "sung": the right one and two
  // others, lines not yet sung where there are enough of them, in a place that changes by night.
  function songChoices(s,g,sung){
    const want='song'+(sung+1),ids=Y.lines.map(l=>l.id),later=ids.slice(sung+1),earlier=ids.slice(0,sung-1).reverse();
    const pool=later.length>=2?later:[...later,...earlier],start=whisperHash('decoy'+sung,s.night)%pool.length;
    const decoys=later.length>=2?[pool[start],pool[(start+1+whisperHash('other'+sung,s.night)%(pool.length-1))%pool.length]]:pool.slice(0,2);
    const three=[want,...decoys],turn=whisperHash('turn'+sung*7,s.night*31+sung)%3;
    return [...three.slice(turn),...three.slice(0,turn)].map(id=>({id,label:'“'+Y.lines.find(l=>l.id===id).text+'”',to:'song'}));
  }
  // ---- The owner's growth ----
  // Every story choice and closing reflection carries a trait: listening, stepping in, or keeping
  // quiet. The tally is derived from the story memory, so it needs no save field of its own.
  const traitIds=['listen','act','keep'];
  function traitTally(tokens,pending){
    const n={listen:0,act:0,keep:0},add=t=>{if(Object.hasOwn(n,t))n[t]++;};
    for(const t of tokens){add(S.stories.find(x=>x.id===t.id)?.choices.find(c=>c.id===t.choice)?.trait);add(S.reflection.find(c=>c.id===t.reflection)?.trait);}
    add(pending);return n;
  }
  const growthStage=n=>S.growth.stages.filter(x=>n>=x).length;
  // The choice made tonight counts as soon as it is made, before the reflection files it in memory.
  function pendingTrait(s){const run=s.storyRun;return s.event==='pending'&&run&&run.step===1?S.stories.find(x=>x.id===run.id)?.choices.find(c=>c.id===run.choice)?.trait:null;}
  function ownerGrowth(s){
    const counts=traitTally(s.storyMemory||[],pendingTrait(s)),top=Math.max(...traitIds.map(t=>counts[t]));
    const lead=top?traitIds.find(t=>counts[t]===top):null,stage=lead?growthStage(top):0;
    const told=new Set((s.storyMemory||[]).map(t=>t.id)),chapters=S.stories.filter(t=>t.arc),next=chapters.find(t=>!told.has(t.id));
    const act=S.acts.find(a=>a.id===(next?next.act:S.acts[S.acts.length-1].id));
    return {counts,lead,stage,title:lead&&stage?S.growth.traits[lead].titles[stage-1]:S.growth.start,
      traits:traitIds.map(id=>({id,name:S.growth.traits[id].name,count:counts[id],stage:growthStage(counts[id])})),
      act,chaptersTold:chapters.filter(t=>told.has(t.id)).length,chapters:chapters.length,finished:!next};
  }
  // What a guest notices aloud when the owner has just grown a stage (by tonight's choice, or by
  // last night's reflection, which no guest was there to remark on).
  function growthRemark(s){
    const memory=s.storyMemory||[],last=memory[memory.length-1];
    const before=traitTally(last?[...memory.slice(0,-1),{id:last.id,choice:last.choice}]:memory,null),after=traitTally(memory,pendingTrait(s));
    for(const t of traitIds){const stage=growthStage(after[t]);if(stage>growthStage(before[t]))return S.growth.traits[t].remarks[stage-1]||'';}
    return '';
  }
  // The three ways of closing a night are worded differently from night to night.
  function reflectionLabel(s,c){const labels=c.labels?.length?c.labels:[c.label];return labels[(s.night||0)%labels.length];}
  function grownEnough(s,c){const counts=ownerGrowth(s).counts;return Object.entries(c.needs||{}).every(([t,n])=>counts[t]>=n);}
  function hasMemory(s,key){const [id,choice]=key.split(':');return (s.storyMemory||[]).some(t=>t.id===id&&(!choice||t.choice===choice));}
  // Tonight's wording: the authored text plus the sentences ("echo") that earlier choices or the
  // owner's leading trait have earned.
  function telling(s,definition){
    // A telling comes in beats: the guest says a little, the owner asks, the guest goes on.
    const tale=Array.isArray(definition.tale)?[...definition.tale]:[definition.tale||''];
    const out={intro:definition.intro,tale,afterword:definition.afterword||''},lead=ownerGrowth(s).lead,used={};
    for(const e of definition.echo||[]){
      if(!(e.if?hasMemory(s,e.if):e.lead?e.lead===lead:false))continue;
      for(const k of ['intro','tale','afterword'])if(e[k]&&(used[k]||0)<2){
        if(k==='tale'){const i=Number.isInteger(e.beat)?Math.max(0,Math.min(tale.length-1,e.beat)):tale.length-1;tale[i]+=' '+e[k];}
        else out[k]+=' '+e[k];
        used[k]=(used[k]||0)+1;
      }
    }
    return out;
  }
  // A guest who can still bring the waiting chapter up in conversation.
  function storyCarrier(s){
    return chapterStep(s)>=0&&s.guests.some(g=>['seated','waiting'].includes(g.status)&&(!g.chat||['hello','tale','taleResult'].includes(g.chat.node)));
  }
  function guestConversation(s,id){
    const g=s.guests.find(x=>x.id===id&&['seated','waiting'].includes(x.status));if(!g)return null;
    const p=person(g.person),profile=guestProfile(s,g.person);
    // Tonight's story waits to be told: the guest brings it up after the greeting, the owner
    // answers with one of its choices, and the guest closes it before the usual talk.
    const tale=chapterStep(s);
    let node=guestNodes.includes(g.chat?.node)?g.chat.node:'hello';
    if((node==='tale'&&tale!==0)||(node==='taleResult'&&tale!==1))node='hello';
    const talk=D.replies(s,g),choices=[],offer=(id,to,label=guestReplies[id])=>choices.push({id,label,to});
    let line='',caption='서로 알아가는 중',note='',beat=0,whisper=null,step=0;
    if(node==='hello'){
      caption=profile.known.includes('name')?'다시 만난 반가운 얼굴':'첫 인사';
      line=D.say(g,D.returning(s,g)?'revisit':'hello');
      // News from last night's choice reaches the owner at the first greeting of the night.
      if(s.nightNews.length>(s.nightNewsRead||0))note=news(s).slice(s.nightNewsRead||0).map(n=>'지난밤 소식 · '+n.text).join('\n');
      const found=whisperNote(s,g);if(found){note=[note,found.text].filter(Boolean).join('\n');whisper=found.id;}
      if(tale<0&&quietNight(s,g)){
        line=W.quiet.line;offer('welcome','hush');for(const c of W.quiet.choices)choices.push({id:c.id,label:c.label,to:'hush'});
      }else if(tale<0&&songNight(s,g)){
        step=1;line='“'+Y.lines[0].text+'”\n'+Y.finale.open;choices.push(...songChoices(s,g,1));offer('welcome','intro');
      }else offer('welcome',tale===0?'tale':tale===1?'taleResult':'intro');
    }else if(node==='tale'){
      const view=story(s),growth=ownerGrowth(s),beats=view.telling.tale;caption=view.definition.series||'오늘 밤, 카운터에서';
      beat=Math.max(0,Math.min(beats.length-1,g.chat?.beat||0));line=beats[beat];
      // Until the last beat the owner only draws the story out; the decision comes with the whole of it.
      if(beat<beats.length-1)choices.push({id:'go_on',label:(view.definition.asks||[])[beat]||'그래서요?',to:'tale'});
      else for(const c of view.definition.choices)if(!grownEnough(s,c)){
        // Words the owner has not grown into yet stay visible but out of reach.
        choices.push({id:c.id,locked:true,label:'아직은 꺼낼 수 없는 말 ('+Object.entries(c.needs).map(([t,n])=>`${S.growth.traits[t].name} ${growth.counts[t]}/${n}`).join(', ')+')'});
      }else if(canChoose(s,c)){
        const cost=[c.money<0?`¥${-c.money}`:'',...Object.entries(c.ingredients||{}).map(([id,n])=>`${ingredients[id].name} ${n}`)].filter(Boolean).join(', ');
        choices.push({id:c.id,label:cost?`${c.label} (${cost})`:c.label,to:'taleResult'});
      }
    }else if(node==='taleResult'){
      const view=story(s),remark=growthRemark(s);caption=view.definition.series||'오늘 밤, 카운터에서';// The guest answers what the owner actually did, then closes the night's story.
      line=(view.choice.reply?view.choice.reply+' ':'')+view.telling.afterword+(remark?'\n'+remark:'');note=view.choice.result;
      // The story runs straight into the order: no fresh introduction after all that talk.
      for(const c of S.reflection)choices.push({id:c.id,label:reflectionLabel(s,c),to:'order'});
    }else if(node==='intro'){
      line=profile.known.includes('name')&&!g.chat?.discovered?.includes('name')?D.say(g,'returnIntro'):D.say(g,'intro',{name:p.name});
      offer('day','day');offer('menu','order');
    }else if(node==='day'){
      line=`${g.chat?.discovered?.includes('role')?D.job(g)+' ':''}${D.day(s,g)}`;
      offer('warm','warm',talk[0]);offer('quiet','quiet',talk[2]);offer('order','order');
    }else if(node==='warm'||node==='quiet'){
      line=talk[node==='warm'?1:3];
      offer('order','order');if(node==='warm'&&g.person%D.voices.length!==16&&!profile.known.includes('age'))offer('about','about');
      // Now and then a guest lets something slip here; the owner may ask, or let it pass.
      const slip=whisperFor(s,g);if(slip){line+='\n'+slip.hook;whisper=slip.id;choices.push({id:'probe',label:slip.ask,to:'odd'});}
    }else if(node==='odd'||node==='odder'){
      const slip=W.fragments.find(f=>f.id===g.chat?.whisper);
      line=slip?(node==='odder'&&slip.tell2?slip.tell2:slip.tell):'…아니에요, 아무것도.';
      if(slip&&node==='odd'&&slip.ask2){whisper=slip.id;choices.push({id:'probe2',label:slip.ask2,to:'odder'});}
      offer('order','order');
    }else if(node==='hum'||node==='hum2'){
      const hum=Y.lines.find(l=>l.id===g.chat?.hum)||Y.lines[0];
      line=node==='hum2'?hum.tell2:hum.tell;
      if(node==='hum'){whisper=hum.id;choices.push({id:'hum2',label:hum.ask2,to:'hum2'});}
      offer('order','order');
    }else if(node==='song'){
      step=Math.max(2,Math.min(5,g.chat?.step||2));
      line='“'+Y.lines[step-1].text+'”\n'+Y.finale.after['song'+step];
      choices.push(...songChoices(s,g,step),{id:'pass',label:Y.finale.pass,to:'lost'});
    }else if(node==='lost'){
      line=g.chat?.reply==='pass'?Y.finale.passed:Y.finale.wrong;choices.push({id:'settle',label:Y.finale.settle,to:'intro'});
    }else if(node==='sung'||node==='sung2'){
      line=node==='sung'?'“'+Y.lines[5].text+'”\n'+Y.finale.sung:Y.finale.sung2;
      choices.push(node==='sung'?{id:'heard',label:Y.finale.heard,to:'sung2'}:{id:'settle',label:Y.finale.settle,to:'intro'});
    }else if(node==='hush'){
      line=W.quiet.after[g.chat?.reply]||W.quiet.after.welcome;choices.push({id:'settle',label:W.quiet.settle,to:'intro'});
    }else if(node==='about'){
      line=D.say(g,'about',{age:p.age.replace('세','살'),name:p.name});
      offer('order','order');
    }else{
      caption=g.status==='waiting'?'접수한 주문':'오늘의 주문';
      // The guest who told tonight's story orders out of that story, in words that belong to it.
      const told=S.stories.find(t=>t.id===g.chat?.told);
      line=g.status==='waiting'?D.say(g,'waiting'):told?.order?told.order.replace('{dish}',recipes[g.recipe].name):D.order(s,g,{dish:recipes[g.recipe].name});
      // Some nights a guest hums a line of an old song after ordering; the owner may ask about it.
      const hum=humFor(s,g);if(hum){note=Y.hook[whisperHash('hook',s.night)%Y.hook.length];whisper=hum.id;choices.push({id:'hum',label:Y.ask,to:'hum'});}
    }
    return {node,beat,whisper,step,line,caption,note,choices,orderReady:node==='order',
      playerLine:g.chat?.reply==='warm'?talk[0]:g.chat?.reply==='quiet'?talk[2]:guestReplies[g.chat?.reply]||'',discovered:g.chat?.discovered||[]};
  }
  function answerGuest(s,id,reply){
    const view=guestConversation(s,id),choice=view?.choices.find(x=>x.id===reply);if(!choice||choice.locked)return false;
    const g=s.guests.find(x=>x.id===id),memory=s.customerBook[g.person];if(!memory)return false;
    // Answers inside a story chapter are the owner's decision and the closing reflection.
    const goOn=view.node==='tale'&&reply==='go_on';
    if(!goOn&&(view.node==='tale'||view.node==='taleResult')&&!resolveEvent(s,reply))return false;
    if(view.node==='hello'&&view.note)markStoryRead(s);
    // What the owner has now heard or noticed of the hidden episode.
    if(view.node==='hello'&&view.whisper)hear(s,view.whisper);
    if(view.node==='hello'&&choice.to==='hush')hear(s,'quiet');
    if(reply==='probe'&&view.whisper)hear(s,view.whisper);
    if(reply==='probe2'&&view.whisper)hear(s,view.whisper+'+');
    if(reply==='hum'&&view.whisper)hear(s,view.whisper);
    if(reply==='hum2'&&view.whisper)hear(s,view.whisper+'+');
    // Putting the song in order: a wrong line ends it gently, the sixth completes it.
    let to=choice.to,sung=0;
    if(to==='song'){if(reply!=='song'+(view.step+1))to='lost';else if(view.step+1===6){to='sung';hear(s,'sung');}else sung=view.step+1;}
    const known=(memory.known||[]).filter(x=>guestFacts.includes(x));
    const reveal=choice.to==='intro'||view.node==='taleResult'?['name','style']:choice.to==='day'?['role','bio']:choice.to==='about'?['role','bio','age']:[];
    const discovered=reveal.filter(x=>!known.includes(x));memory.known=[...new Set([...known,...reveal])];
    g.chat={node:to,reply,discovered};if(sung)g.chat.step=sung;if(reply==='hum'){g.chat.hum=view.whisper;g.chat.hummed=true;}else if(view.node==='hum'||view.node==='hum2'){g.chat.hum=g.chat.hum||view.whisper||null;g.chat.hummed=true;}if(goOn)g.chat.beat=view.beat+1;if(view.node==='taleResult')g.chat.told=s.storyRun.id;if(reply==='probe')g.chat.whisper=view.whisper;else if(reply==='probe2')g.chat.whisper=g.chat.whisper||view.whisper;if(['warm','quiet','order'].includes(choice.to))g.menuReadyAt=s.nightElapsedMs||0;return true;
  }
  function chooseRecipe(s,omakase) {
    const menuLevel=s.phase==='open'?Math.min(s.level,s.nightStart.level):s.level;
    const ids=s.unlocked.filter(id=>recipes[id].level<=menuLevel),cycle=s.nightOrders.slice(Math.floor(s.arrived/3)*3);
    // A wave is booked as a group of three: no shared dish within that wave.
    const unique=ids.filter(id=>!cycle.includes(id));
    // Keep a persistent least-recently-ordered rotation across nights and reloads.
    // Newly unlocked dishes join the unseen pool before any repeat is considered.
    const rotation=s.menuRotation||s.recentOrders;
    let pool=unique.filter(id=>!rotation.includes(id));
    if(!pool.length){
      const oldest=Math.min(...unique.map(id=>rotation.lastIndexOf(id)));
      pool=unique.filter(id=>rotation.lastIndexOf(id)===oldest);
    }
    if(omakase&&pool.includes(s.special))return s.special;
    return pool[(s.dialogueSerial+s.night-1)%pool.length];
  }
  function regular(s, person) { return (s.customerBook[person]?.visits || 0) >= 3; }
  function gift(s, id) {
    const g = s.guests.find(g => g.id === id && ['seated','waiting'].includes(g.status));
    if (s.phase !== 'open' || !g || !regular(s, g.person) || g.gifted || !s.inventory.egg) return false;
    s.inventory.egg--; g.gifted = true; s.reputation = clamp(s.reputation + 1, 0, 100); progress(s); return true;
  }
  function report(s) {
    const start = s.nightStart;
    const next = levels.find(l => l.level > s.level);
    return { atmosphere:atmosphere(s),atmosphereDelta:atmosphere(s)-(start.atmosphere||0),reviews:(s.nightReviews||[]).slice(-4),purchases:s.nightPurchases||0,revenue: s.nightRevenue, tips: s.nightTips, expenses:s.nightCosts||0,storyIncome:s.storyIncome||0,storyCosts:s.storyCosts||0, money: s.money, net: s.money - start.money,
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
    version:11,access:Growth.initialAccess(),calendarRecords:[],nightNewsRead:0,nightElapsedMs:0,prepChoice:null,nightReviews:[],nightPurchases:0,stoveTutorialDone:false,fridgeDoorHintSeen:false,whispers:[],kitchen:null,dialogueSerial:0,menuRotation:[],recentOrders:[],nightOrders:[],storyRun:null,storyMemory:[],pendingConsequences:[],nightNews:[],storyIncome:0,storyCosts:0,nextVisitor: 0, nightVisitors: [], xp: 0, level: 1, satisfactionTotal: 0, customerBook: {},
    nightStart: { money: 3200, reputation: 12, satisfaction: 0, xp: 0, level: 1,atmosphere:0 }, introSeen: false, night: 1, phase: 'prep', money: 3200, reputation: 12,
    totalServed: 0, inventory: Object.assign({rice:5,nori:5,egg:4,dashi:6,pork:3,miso:3,salmon:0},Object.fromEntries(Object.keys(C.ingredients).map(id=>[id,0]))),
    unlocked:Object.keys(recipes).filter(id=>recipes[id].level===1), upgrades: [],upgradeQty:{},equipped:{},renovation:R.initial(), special: 'onigiri',
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
    if(v&&[2,3,4,5,6,7,8,9].includes(v.version)&&v.inventory&&typeof v.inventory==='object'&&!Array.isArray(v.inventory))for(const id of Object.keys(C.ingredients))if(v.inventory[id]===undefined)v.inventory[id]=0;
    const integer = (n, min = 0, max = 1e9) => Number.isSafeInteger(n) && n >= min && n <= max;
    if (!v || ![2,3,4,5,6,7,8,9,10,11].includes(v.version) || typeof v.introSeen !== 'boolean' || !integer(v.night, 1) ||
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
        ['seated','waiting','eating','paying','farewell','left'].includes(g.status) && integer(g.score, 0, 100) && (g.waitMs===undefined || (Number.isFinite(g.waitMs)&&g.waitMs>=0&&g.waitMs<=1e9))) ||
      new Set(v.guests.map(g => g.seat)).size !== v.guests.length ||
      new Set(v.guests.map(g => g.id)).size !== v.guests.length) throw new Error('Invalid save');
    const restored = { ...s, ...v,version:11,prepChoice:null,nightReviews:[],nightPurchases:0,stoveTutorialDone:v.version>=9&&typeof v.stoveTutorialDone==='boolean'?v.stoveTutorialDone:false,lastResult:null };
    restored.fridgeDoorHintSeen=v.fridgeDoorHintSeen===true;
    // What has been heard of the hidden episode is optional and never fatal to a save.
    {const known=new Set([...W.fragments.flatMap(f=>[f.id,f.id+'+']),...W.notes.map(f=>f.id),'quiet',...Y.lines.flatMap(l=>[l.id,l.id+'+']),...Y.notes.map(f=>f.id),'sung']);restored.whispers=[...new Set(Array.isArray(v.whispers)?v.whispers.filter(id=>known.has(id)):[])];}
    restored.nightElapsedMs=Number.isFinite(v.nightElapsedMs)&&v.nightElapsedMs>=0?Math.min(1e9,Math.round(v.nightElapsedMs)):0;
    // The closing reflection is an optional part of a memory; an unknown one is dropped, never fatal.
    restored.storyMemory=(restored.storyMemory||[]).map(t=>{const {reflection,...rest}=t;return S.reflection.some(c=>c.id===reflection)?t:rest;});
    restored.nightNewsRead=Number.isSafeInteger(v.nightNewsRead)?Math.max(0,Math.min(restored.nightNews.length,v.nightNewsRead)):(restored.event==='resolved'?restored.nightNews.length:0);
    restored.upgrades=[...new Set(restored.upgrades)];
    if(v.upgradeQty!==undefined&&(!v.upgradeQty||Array.isArray(v.upgradeQty)||Object.entries(v.upgradeQty).some(([id,n])=>!restored.upgrades.includes(id)||!integer(n,1,upgrades[id].max))))throw new Error('Invalid furnishing quantities');
    restored.upgradeQty=Object.fromEntries(restored.upgrades.map(id=>[id,v.upgradeQty?.[id]||1]));
    if(v.equipped!==undefined&&(!v.equipped||Array.isArray(v.equipped)||Object.entries(v.equipped).some(([slot,id])=>!Object.hasOwn(F.slots,slot)||!restored.upgrades.includes(id)||upgrades[id].slot!==slot)))throw new Error('Invalid equipped furnishings');
    restored.equipped={...(v.equipped||{})};for(const id of restored.upgrades)if(!restored.equipped[upgrades[id].slot])restored.equipped[upgrades[id].slot]=id;
    if (v.version === 2) {
      restored.xp = v.totalServed * 70;
      restored.satisfactionTotal = v.totalServed * 70;
      restored.customerBook = {};
      restored.target = 9;
      // Continue old three-guest saves instead of silently ending their night.
      if (v.phase === 'end') restored.phase = 'prep';
      restored.nightStart = { money: Math.max(0, v.money - v.nightRevenue), reputation: v.nightStartRep, satisfaction: 70, xp: restored.xp, level: 1 };
    } else if (!integer(v.xp) || !integer(v.level,1,50) || !integer(v.satisfactionTotal) || v.satisfactionTotal > v.totalServed * 100 ||
      !v.nightStart || !integer(v.nightStart.money) || !integer(v.nightStart.reputation,0,100) || !integer(v.nightStart.satisfaction,0,100) || !integer(v.nightStart.xp) || !integer(v.nightStart.level,1,50) ||
      !v.customerBook || Array.isArray(v.customerBook) || !Object.entries(v.customerBook).every(([id,c]) => /^\d+$/.test(id) && Number(id) <= 1000000 && c && integer(c.visits) && integer(c.lastScore,0,100) && integer(c.lastVisitNight) && integer(c.dueNight)&&(c.affinity===undefined||integer(c.affinity,0,20)))) throw new Error('Invalid progress');
    for (const g of restored.guests) if (!restored.customerBook[g.person]) restored.customerBook[g.person] = {visits:1,lastScore:g.score,lastVisitNight:restored.night,dueNight:restored.night+2};
    if(v.version<4){
      restored.nextVisitor=Math.max(6,...Object.keys(restored.customerBook).map(id=>Number(id)+1));
      restored.nightVisitors=Object.entries(restored.customerBook).filter(([,c])=>c.lastVisitNight===restored.night).map(([id])=>Number(id));
      for(const c of Object.values(restored.customerBook))c.dueLevel=c.lastScore>=90?restored.level+2:0;
    }else if(!integer(v.nextVisitor,0,1000001)||!Array.isArray(v.nightVisitors)||v.nightVisitors.length>9||new Set(v.nightVisitors).size!==v.nightVisitors.length||!v.nightVisitors.every(id=>integer(id,0,1000000))||!Object.values(v.customerBook).every(c=>integer(c.dueLevel,0,52)))throw new Error('Invalid visitor schedule');
    restored.nextVisitor=Math.max(restored.nextVisitor,...Object.keys(restored.customerBook).map(id=>Number(id)+1));
    if(v.version<5){
      restored.dialogueSerial=restored.totalServed+restored.arrived;restored.recentOrders=restored.guests.map(g=>g.recipe);restored.nightOrders=Array.from({length:restored.arrived},(_,i)=>restored.guests.find(g=>g.id===i+1)?.recipe||['onigiri','tamago','tonjiru'][i%3]);
      restored.guests.forEach(g=>g.lineKey=(restored.night-1)*9+g.id);
    }else {
      const run=v.storyRun,validRun=run===null||(run&&S.stories.some(t=>t.id===run.id)&&integer(run.step,0,2)&&integer(run.night,1)&&Array.isArray(run.cast)&&run.cast.length===2&&run.cast.every(id=>integer(id,0,1000000))&&S.stories.find(t=>t.id===run.id).choices.some(c=>c.id===run.choice||run.choice===null)&&(run.reflection===null||S.reflection.some(c=>c.id===run.reflection)));
      const validToken=t=>t&&integer(t.night,1)&&S.stories.some(st=>st.id===t.id&&st.choices.some(c=>c.id===t.choice));
      if(!integer(v.dialogueSerial)||!Array.isArray(v.recentOrders)||v.recentOrders.length>36||!v.recentOrders.every(id=>Object.hasOwn(recipes,id))||!Array.isArray(v.nightOrders)||v.nightOrders.length>9||!v.nightOrders.every(id=>Object.hasOwn(recipes,id))||!v.guests.every(g=>integer(g.lineKey))||!validRun||!Array.isArray(v.storyMemory)||v.storyMemory.length>200||!v.storyMemory.every(validToken)||!Array.isArray(v.pendingConsequences)||!v.pendingConsequences.every(validToken)||!Array.isArray(v.nightNews)||!v.nightNews.every(validToken)||!integer(v.storyIncome)||!integer(v.storyCosts))throw new Error('Invalid content progress');
    }
    if(v.version<6){
      restored.kitchen=null;
      const used=new Set();
      for(const g of restored.guests){
        if(g.status==='eating'){g.status='farewell';g.paid=true;g.bill=null;}
        if(g.status==='waiting'){
          g.status='seated';if(used.has(g.recipe))g.recipe=restored.unlocked.find(id=>recipes[id].level<=restored.level&&!used.has(id));used.add(g.recipe);
          restored.nightOrders[g.id-1]=g.recipe;
        }
        g.eatMs=0;
      }
    }else{
      const validBill=b=>b&&['score','base','tip','total','preparation','heat','waitPenalty'].every(k=>integer(b[k]))&&b.score<=100&&b.base+b.tip===b.total;
      if(!restored.guests.every(g=>(g.eatMs===undefined||integer(g.eatMs,0,1e9))&&(!['eating','paying'].includes(g.status)||validBill(g.bill))&&(!g.bill||validBill(g.bill))))throw new Error('Invalid meal bill');
      if(v.version<9&&v.kitchen){v.kitchen={...v.kitchen,step:0,marks:[],stage:'room'};}
      let k=v.kitchen;
      if(k!==null){
        const g=restored.guests.find(g=>g.id===k?.guest&&g.status==='waiting');
        if(g&&k.sequenceVersion!==2&&Number.isSafeInteger(k.step)&&Array.isArray(k.marks)&&k.marks.length===k.step){
          const old=Cooking.plan(g.recipe,recipes[g.recipe],true),lidIndex=old.findIndex(st=>st.id==='lid');
          if(lidIndex>=0&&k.step>lidIndex){const marks=[...k.marks];marks.splice(lidIndex,1);k={...k,step:k.step-1,marks};}
          k={...k,sequenceVersion:2};
        }
        if(!g||!['room','fridge','process','complete'].includes(k.stage)||!Array.isArray(k.selected)||new Set(k.selected).size!==k.selected.length||!k.selected.every(id=>Object.hasOwn(ingredients,id))||!Array.isArray(k.marks)||!k.marks.every(q=>Number.isFinite(q)&&q>=0&&q<=1)||!integer(k.step,0,Cooking.plan(g.recipe,recipes[g.recipe]).length)||k.marks.length!==k.step)throw new Error('Invalid kitchen progress');
        // An interrupted action restarts this step, not the whole recipe or order.
        const selected=k.selected.filter(id=>recipes[g.recipe].ingredients.includes(id));
        if(v.version>=9&&selected.length!==k.selected.length)throw new Error('Unrelated kitchen ingredients');
        if(k.heatValue!==undefined&&(!Number.isFinite(k.heatValue)||k.heatValue<0||k.heatValue>1))throw new Error('Invalid heat appearance');restored.kitchen={sequenceVersion:2,guest:k.guest,stage:k.stage,selected,step:k.step,marks:[...k.marks],...(k.heatValue!==undefined?{heatValue:k.heatValue}:{})};
      }
    }
    if(v.prepChoice!==undefined&&![null,3,9].includes(v.prepChoice))throw new Error('Invalid preparation choice');
    restored.prepChoice=v.prepChoice??null;
    restored.renovation=R.restore(v.renovation,restored);
    restored.nightStart={...restored.nightStart,atmosphere:integer(v.nightStart?.atmosphere)?v.nightStart.atmosphere:atmosphere(restored)};
    if(v.nightReviews!==undefined&&(!Array.isArray(v.nightReviews)||v.nightReviews.length>v.nightScores.length||v.nightReviews.length>9||!v.nightReviews.every(x=>x&&typeof x.guest==='string'&&x.guest.length<=50&&typeof x.dish==='string'&&x.dish.length<=100&&typeof x.text==='string'&&x.text.length<=180&&integer(x.score,0,100)&&(x.person===null||integer(x.person,0,1000000)))))throw new Error('Invalid nightly reviews');
    restored.nightReviews=v.nightReviews??v.nightScores.slice(-4).map((score,i)=>({guest:'오늘의 손님',person:null,dish:'오늘의 한 끼',score,text:reviewText({score,heat:100,waitPenalty:0},i)}));
    if(v.nightPurchases!==undefined&&!integer(v.nightPurchases))throw new Error('Invalid purchase ledger');
    restored.nightPurchases=v.nightPurchases??Math.max(0,restored.nightStart.money+restored.nightRevenue+restored.storyIncome-restored.storyCosts-(restored.nightCosts||0)-restored.money);
    for(const g of restored.guests)g.menuReadyAt=Number.isFinite(g.menuReadyAt)&&g.menuReadyAt>=0&&g.menuReadyAt<=1e9+15000?g.menuReadyAt:0;
    // A corrupt optional conversation must not erase a valid older game or its money.
    for(const memory of Object.values(restored.customerBook))memory.known=Array.isArray(memory.known)?[...new Set(memory.known.filter(x=>guestFacts.includes(x)))]:[];
    for(const g of restored.guests){
      if(g.chat&&guestNodes.includes(g.chat.node))g.chat={...(g.chat.node==='tale'&&integer(g.chat.beat,0,9)?{beat:g.chat.beat}:{}),...(S.stories.some(t=>t.id===g.chat.told)?{told:g.chat.told}:{}),...(W.fragments.some(f=>f.id===g.chat.whisper)?{whisper:g.chat.whisper}:{}),...(Y.lines.some(l=>l.id===g.chat.hum)?{hum:g.chat.hum}:{}),...(g.chat.hummed===true?{hummed:true}:{}),...(integer(g.chat.step,2,5)?{step:g.chat.step}:{}),node:g.chat.node,reply:Object.hasOwn(guestReplies,g.chat.reply)?g.chat.reply:null,discovered:Array.isArray(g.chat.discovered)?g.chat.discovered.filter(x=>guestFacts.includes(x)&&restored.customerBook[g.person].known.includes(x)):[]};
      else delete g.chat;
    }
    const history=Array.isArray(v.menuRotation)?v.menuRotation:restored.recentOrders;
    restored.menuRotation=[];
    for(const id of history)if(Object.hasOwn(recipes,id))restored.menuRotation=[...restored.menuRotation.filter(x=>x!==id),id];
    restored.calendarRecords=Array.isArray(v.calendarRecords)?v.calendarRecords.filter(r=>r&&Number.isSafeInteger(r.night)&&r.night>0&&['revenue','tips','expenses','purchases','money','net','reputation','average','served','level'].every(k=>Number.isFinite(r[k]))).slice(-1000).map(r=>Object.fromEntries(['night','revenue','tips','expenses','purchases','money','net','reputation','average','served','level'].map(k=>[k,r[k]]))):[];
    restored.access=Growth.restoreAccess(v.access,restored.level);
    progress(restored);return restored;


  }
  function open(s) {
    if (s.phase !== 'prep') return false;
    progress(s);
    Object.assign(s, {nightNewsRead:0,nightElapsedMs:0,prepChoice:null,nightReviews:[],nightPurchases:0,kitchen:null,storyRun:null,nightOrders:[],nightNews:[],storyIncome:0,storyCosts:0,phase: 'open', guests: [], arrived: 0, target: 9, nightVisitors: [],
      nightStart: {money:s.money, reputation:s.reputation, satisfaction:satisfaction(s), xp:s.xp, level:s.level,atmosphere:atmosphere(s)},
      nightRevenue: 0, nightTips: 0, nightCosts: 0, nightScores: [], event: 'none', eventChoice: null, nightStartRep: s.reputation, lastResult: null });
    applyFollowups(s);return true;
  }
  function arrive(s) {
    if (s.phase !== 'open' || s.arrived >= s.target) return null;
    if(s.arrived>0&&s.arrived%3===0&&s.guests.some(g=>g.status!=='left'))return null;
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
    const lineKey=s.dialogueSerial++;s.menuRotation=[...(s.menuRotation||s.recentOrders).filter(id=>id!==recipe),recipe];s.nightOrders.push(recipe);s.recentOrders=[...s.recentOrders,recipe].slice(-36);
    const g = { id: ++s.arrived, person: visitor, seat, recipe, omakase,lineKey,status:'seated',menuReadyAt:(s.nightElapsedMs||0)+[0,8000,15000][seat],score:0,waitMs:0,eatMs:0,bill:null,paid:false };
    const memory = s.customerBook[visitor] || {visits:0,lastScore:0,lastVisitNight:0,dueNight:0,dueLevel:0,known:[]};
    if (memory.lastVisitNight !== s.night) memory.visits++;
    memory.lastVisitNight = s.night; s.customerBook[visitor] = memory; s.nightVisitors.push(visitor);
    s.guests.push(g);
    if(s.arrived===1)s.reputation=clamp(s.reputation+F.benefits(s).reputation,0,100);
    return g;
  }
  function buyPrice(s,id){return Math.round(ingredients[id].price*(1-F.benefits(s).discount/100));}
  // Forecast from a copy: looking at the shopping list never books real guests or spends cash.
  function stockPlan(s,meals=9){
    if(![3,9].includes(meals))return null;
    const sim=JSON.parse(JSON.stringify(s));
    if(sim.phase==='end')next(sim);
    if(sim.phase==='prep')open(sim);
    const orders=sim.guests.filter(g=>['seated','waiting'].includes(g.status)).map(g=>g.recipe).slice(0,meals);
    while(orders.length<meals&&sim.arrived<sim.target){sim.guests=[];const g=arrive(sim);if(!g)break;orders.push(g.recipe);}
    const needed={};for(const id of orders)for(const part of recipes[id].ingredients)needed[part]=(needed[part]||0)+1;
    const lines=Object.entries(needed).filter(([id])=>ingredientAvailable(s,id)).map(([id,target])=>({id,target,owned:s.inventory[id],quantity:Math.min(999-s.inventory[id],Math.max(0,target-s.inventory[id])),price:buyPrice(s,id)})).sort((a,b)=>b.target-a.target);
    return {meals:orders.length,orders,lines,units:lines.reduce((n,x)=>n+x.quantity,0),cost:lines.reduce((n,x)=>n+x.quantity*x.price,0)};
  }
  function restock(s,meals=9){
    const plan=stockPlan(s,meals);if(!plan||!plan.units||s.money<plan.cost)return false;
    s.money-=plan.cost;if(s.phase!=='prep')s.nightPurchases=(s.nightPurchases||0)+plan.cost;s.prepChoice=meals;for(const line of plan.lines)s.inventory[line.id]+=line.quantity;
    return plan;
  }
  function heatQuality(s,id,value){const spec=cookSpec(s,id);return Math.max(0,1-Math.abs(clamp(value,0,1)-spec.ideal)/spec.tolerance);}
  function buy(s,id,quantity=1){
    if(!Object.hasOwn(ingredients,id)||!Number.isSafeInteger(quantity)||quantity<1||quantity>999||!ingredientAvailable(s,id)||s.inventory[id]+quantity>999)return false;
    const total=buyPrice(s,id)*quantity;if(s.money<total)return false;
    s.money-=total;s.inventory[id]+=quantity;if(s.phase!=='prep')s.nightPurchases=(s.nightPurchases||0)+total;return true;
  }
  function unlock(s, id) {
    if (!Object.hasOwn(recipes, id)) return false;
    const r = recipes[id];
    if (!r || s.unlocked.includes(id) || s.money < r.unlock || s.level < r.level) return false;
    s.money -= r.unlock; s.unlocked.push(id); return true;
  }
  // Historical items remain owned with their benefits, but cannot be bought or placed anymore.
  function equip(){return false;}
  function upgrade(){return false;}
  function renovate(s,area,expected){const result=R.install(s,area,expected);if(result)progress(s);return result;}
  function serve(s, guestId, selected, timing, preparation=1,heatOverride) {
    const g = s.guests.find(g => g.id === guestId && g.status === 'waiting');
    if (s.phase !== 'open' || !g || !Array.isArray(selected) || !Number.isFinite(timing) || !Number.isFinite(preparation) ||
      (heatOverride!==undefined&&(!Number.isFinite(heatOverride)||heatOverride<0||heatOverride>1)) || selected.length === 0 || new Set(selected).size !== selected.length ||
      !selected.every(id => ingredientAvailable(s,id) && s.inventory[id] > 0)) return null;
    const r = recipes[g.recipe];
    const matches = selected.filter(id => r.ingredients.includes(id)).length;
    const wrong = selected.filter(id => !r.ingredients.includes(id)).length;
    const recipeScore = Math.max(0, (matches - wrong * 0.5) / r.ingredients.length);
    const spec=cookSpec(s,g.recipe),heat=heatOverride===undefined?Math.max(0,1-Math.abs(clamp(timing,0,1)-spec.ideal)/spec.tolerance):clamp(heatOverride,0,1);
    const benefits=F.benefits(s),waited=Math.min(20,Math.floor(Math.max(0,(g.waitMs||0)-45000-benefits.patience*1000)/12000)*2);
    let score=Math.round(clamp(recipeScore*25+clamp(preparation,0,1)*25+heat*50+benefits.quality+(g.gifted?5:0)-waited,0,100));
    if(recipeScore<1)score=Math.min(Math.round(50*recipeScore),score);
    const base=Math.round(r.price*(.35+score*.006));
    const tip=Math.round(r.price*Math.max(0,score-80)/100*.8*(1+(benefits.tips+growthBenefits(s).tips)/100));
    selected.forEach(id => s.inventory[id]--);
    const result={appearance:heatLook(s,g.recipe,timing),heatValue:clamp(timing,0,1),score,base,tip,total:base+tip,preparation:Math.round(clamp(preparation,0,1)*100),heat:Math.round(heat*100),waitPenalty:waited,dish:r.name,guest:person(g.person).name};
    g.status='eating';g.score=score;g.eatMs=0;g.bill=result;g.paid=false;
    if(s.kitchen?.guest===g.id)s.kitchen=null;
    s.lastResult=result;return result;
  }
  function menuReady(s,g){return !!g&&(g.status!=='seated'||!Number.isFinite(g.menuReadyAt)||(s.nightElapsedMs||0)>=g.menuReadyAt);}
  function acceptOrder(s,id){const g=s.guests.find(g=>g.id===id&&g.status==='seated');if(s.phase!=='open'||!g)return false;g.status='waiting';return true;}
  function beginCooking(s,id){const g=s.guests.find(g=>g.id===id&&g.status==='waiting');if(s.phase!=='open'||!g)return false;if(s.kitchen)return s.kitchen.guest===id;s.kitchen={sequenceVersion:2,guest:id,stage:'room',selected:[],step:0,marks:[]};return true;}
  function selectIngredient(s,id){const k=s.kitchen,g=s.guests.find(g=>g.id===k?.guest);if(!k||!g||!recipes[g.recipe].ingredients.includes(id)||k.step||!ingredientAvailable(s,id)||s.inventory[id]<1)return false;k.selected=k.selected.includes(id)?k.selected.filter(x=>x!==id):[...k.selected,id];return true;}
  function readyIngredients(s){const k=s.kitchen,g=s.guests.find(g=>g.id===k?.guest&&g.status==='waiting');return !!g&&k.selected.length===recipes[g.recipe].ingredients.length&&recipes[g.recipe].ingredients.every(id=>k.selected.includes(id)&&s.inventory[id]>0)&&k.selected.every(id=>ingredientAvailable(s,id)&&s.inventory[id]>0);}
  function prepareIngredients(s){if(!s.kitchen||s.kitchen.step||!readyIngredients(s))return false;s.kitchen.stage='process';return true;}
  function completeCookingStep(s,quality,detail){const k=s.kitchen,g=s.guests.find(g=>g.id===k?.guest&&g.status==='waiting');if(!g||k.stage!=='process'||!readyIngredients(s)||!Number.isFinite(quality)||quality<0||quality>1)return false;const steps=Cooking.plan(g.recipe,recipes[g.recipe]);if(k.step>=steps.length)return false;if(detail?.heat!==undefined&&(!Number.isFinite(detail.heat)||detail.heat<0||detail.heat>1))return false;if(steps[k.step].id==='heat'&&detail?.heat!==undefined)k.heatValue=detail.heat;k.marks.push(quality);k.step++;if(k.step===steps.length)k.stage='complete';return true;}
  function deliver(s){const k=s.kitchen,g=s.guests.find(g=>g.id===k?.guest&&g.status==='waiting');if(!g||k.stage!=='complete'||!readyIngredients(s))return null;const steps=Cooking.plan(g.recipe,recipes[g.recipe]);if(k.step!==steps.length)return null;
    const hi=steps.findIndex(st=>st.id==='heat'),quality=hi<0?1:k.marks[hi],others=k.marks.filter((_,i)=>i!==hi),prep=others.reduce((a,b)=>a+b,0)/others.length,spec=cookSpec(s,g.recipe);
    return serve(s,g.id,[...k.selected],k.heatValue??spec.ideal+(1-quality)*spec.tolerance,prep,quality);
  }
  function finishEating(s,id){const g=s.guests.find(g=>g.id===id&&g.status==='eating');if(!g)return false;g.status='paying';return true;}
  function collect(s,id){const g=s.guests.find(g=>g.id===id&&g.status==='paying'&&!g.paid);if(s.phase!=='open'||!g||!g.bill)return null;const r=g.bill;
    s.money+=r.total;s.nightRevenue+=r.total;s.nightTips+=r.tip;s.totalServed++;s.satisfactionTotal+=r.score;s.xp+=r.score;s.nightScores.push(r.score);s.nightReviews.push({guest:person(g.person).name,person:g.person,dish:recipes[g.recipe].name,score:r.score,text:reviewText(r,g.person)});
    s.customerBook[g.person].lastScore=r.score;s.reputation=clamp(s.reputation+(r.score>=85?4:r.score>=65?2:r.score>=40?-1:-4),0,100);progress(s);s.customerBook[g.person].dueLevel=s.level+2;g.paid=true;g.status='farewell';return r;
  }
  // A departing guest and the owner shared a moment (watching a clip together): the guest
  // grows a little closer, which raises the chance of a return visit. Nothing else changes.
  function befriend(s,id,amount=2){
    const g=s.guests.find(g=>g.id===id&&g.status==='farewell'),book=g&&s.customerBook[g.person];if(!book)return false;
    book.affinity=Math.min(20,(book.affinity||0)+Math.max(0,Math.min(5,Math.floor(Number(amount)||0))));return true;
  }
  function depart(s,id){const g=s.guests.find(g=>g.id===id&&g.status==='farewell');if(!g)return false;g.status='left';return true;}
  function ensureStory(s) {
    if(!s.storyRun){
      // Chapters of the story threads ("arc") are told once each, in the authored order of the
      // acts, one a night from the second night on; a thread rests for several nights between its
      // chapters. On the first night and once every chapter is told, single stories rotate.
      const told=new Set((s.storyMemory||[]).map(t=>t.id)),singles=S.stories.filter(t=>!t.arc);
      const chapter=s.night>1?S.stories.find(t=>t.arc&&!told.has(t.id)&&(!t.after||told.has(t.after))):null;
      const st=chapter||singles[(s.storyMemory||[]).filter(t=>singles.some(x=>x.id===t.id)).length%singles.length],cast=s.guests.slice(0,2).map(g=>g.person);while(cast.length<2)cast.push(cast.length);s.storyRun={id:st.id,night:s.night,step:s.event==='resolved'?2:0,cast,choice:null,reflection:null};}
    return s.storyRun;
  }
  function story(s) {
    if(s.event==='none')return null;const run=ensureStory(s),definition=S.stories.find(t=>t.id===run.id);
    const choice=definition.choices.find(c=>c.id===run.choice);
    return {run,definition,choice,reflection:S.reflection.find(c=>c.id===run.reflection),telling:telling(s,definition)};
  }
  function canChoose(s,c) {return s.money>=Math.max(0,-(c.money||0))&&Object.entries(c.ingredients||{}).every(([id,n])=>s.inventory[id]>=n)&&grownEnough(s,c);}
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
  // A chapter that a guest is about to tell does not light the story sheet; the conversation is its place.
  function storyNeedsAttention(s){return s.event==='pending'&&(!s.storyRun||s.storyRun.step<2)&&!storyCarrier(s)||s.nightNews.length>(s.nightNewsRead||0);}
  function markStoryRead(s){s.nightNewsRead=s.nightNews.length;}
  function conversation(s) {
    if(s.phase!=='open'||s.event!=='none'||s.guests.filter(g=>g.status!=='left').length<2)return false;
    s.event='pending';ensureStory(s);return true;
  }
  // A small safety net for spending all cash before noticing missing ingredients.
  function rescueNeeds(s) {
    if (s.phase !== 'open') return null;
    const needed = {};
    s.guests.filter(g => ['seated','waiting'].includes(g.status)).forEach(g => recipes[g.recipe].ingredients.forEach(id => {
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
      const token={id:run.id,choice:run.choice,night:s.night+1};s.pendingConsequences.push(token);
      // The memory keeps every chapter of the threads; when it is full the oldest single story goes first.
      const memory=[...s.storyMemory,{...token,night:s.night,reflection:id}];
      while(memory.length>200){const i=memory.findIndex(t=>!S.stories.find(x=>x.id===t.id)?.arc);memory.splice(i<0?0:i,1);}
      s.storyMemory=memory;return true;
    }
    return false;
  }
  function canClose(s) { return s.phase === 'open' && s.arrived === s.target && s.nightScores.length === s.target && s.event !== 'pending'&&s.guests.every(g=>g.status==='left'); }
  function close(s) { if (!canClose(s)) return false; s.nightCosts=Math.min(s.money,operatingCost(s));s.money-=s.nightCosts;s.phase = 'end';archiveNight(s); return true; }
  function archiveNight(s){
    const r=report(s),record={night:s.night,served:s.nightScores.length};
    for(const key of ['revenue','tips','expenses','purchases','money','net','reputation','average','level'])record[key]=r[key];
    s.calendarRecords=[...(s.calendarRecords||[]).filter(x=>x.night!==s.night),record].slice(-1000);
  }
  function next(s) {
    if (s.phase !== 'end') return false;
    archiveNight(s);s.night++;s.prepChoice=null; s.phase = 'prep'; s.guests = []; s.lastResult = null; return true;
  }
  const api = { D,guestServiceLines,befriend,storyCarrier,ownerGrowth,grownEnough,reflectionLabel,Growth,growthBenefits,trialComplete,operatingCost,menuReady,storyNeedsAttention,markStoryRead,guestProfile,guestConversation,answerGuest,F,R,renovate,environment,equip,hasUpgrade,heatLook,kitchenLook,atmosphere,reviewText,stockPlan,restock,heatQuality,Cooking,ingredientAvailable,acceptOrder,beginCooking,selectIngredient,readyIngredients,prepareIngredients,completeCookingStep,deliver,finishEating,collect,depart,buyPrice,dialogue,chooseRecipe,story,news,canChoose,storyContent:S,patience,cookSpec,person, levels, satisfaction, progress, regular, gift, report, ingredients, recipes, people, upgrades, fresh, restore, open, arrive, buy, unlock, upgrade, serve, conversation, rescueNeeds, rescue, resolveEvent, canClose, close, next };
  if (typeof module !== 'undefined') module.exports = api;
  else window.MidnightEngine = api;
})();
