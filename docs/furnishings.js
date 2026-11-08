/* Sixty coordinated furnishings, each photographed from its actual installed surface. */
(()=>{'use strict';
  const inside=(rect,place,art=rect)=>({rect:rect.map((v,i)=>v/(i%2?1024:1536)*100),art:art.map((v,i)=>v/(i%2?1024:1536)*100),place,area:'inside'});
  const outside=(rect,place,art=rect)=>({rect,art,place,area:'outside'});
  const slots={
    lantern:inside([721,0,145,236],'천장의 조명 자리',[732,88,128,145]),
    plants:outside([39,48,22,16],'창 아래 화분 자리'),
    ceramics:inside([150,309,160,123],'왼쪽 기존 선반',[159,360,132,62]),
    noren:outside([64,25,34,15],'출입문 위',[67,27,29,11]),
    bonsai:inside([544,430,250,125],'창가 작업대 왼쪽',[577,441,111,107]),
    bench:outside([21.5,55.2,21,7.4],'창 아래 왼쪽 길가'),
    shelves:inside([1114,297,215,300],'오른쪽 찻장',[1127,307,193,282]),
    sign:outside([33,26,18.5,7],'왼쪽 창 위',[34,27,16,5.5]),
    clock:inside([350,170,105,105],'후드 위의 빈 벽',[360,194,82,83]),
    ikebana:inside([962,438,142,115],'창가 작업대 오른쪽',[969,445,122,106]),
    andon:outside([83,54.5,14,13],'출입문 오른쪽 디딤돌',[84,55,12,11.5]),
    sudare:inside([935,306,140,90],'오른쪽 창 윗부분',[943,315,122,80]),
    plaque:outside([60.5,39,5.2,4],'문 왼쪽의 좁은 벽'),
    fridge:inside([0,285,149,315],'기존 냉장고 자리',[4,298,137,298]),
    barfront:inside([0,669,1536,253],'카운터의 앞면',[550,700,430,180])
  };
  const base=[
    ['lantern','호박빛 종이등',1000,1,6],['plants','문 앞 화분',900,1,4],['ceramics','손으로 빚은 그릇',1600,2,6],['noren','쪽빛 노렌',1800,2,5],['bonsai','작은 분재',2400,3,8],['bench','골목의 나무 벤치',2500,3,6],['shelves','오래된 찻장',3200,4,10],['sign','골목의 간판',4000,5,8],['clock','오래된 벽시계',4200,6,6],['ikebana','계절의 꽃가지',4800,7,8],['andon','문 앞 안돈',5500,8,8],['sudare','대나무 발',6200,9,8],['plaque','달빛 문패',7200,10,10],['fridge','새 단풍빛 냉장고',18000,20,15],['barfront','윤기 나는 나무 카운터',2800,4,9]
  ];
  const themes=[{id:0,name:'소박한 온기',color:'#b48350'},{id:1,name:'벚꽃이 머무는 밤',color:'#c08f97'},{id:2,name:'쪽빛의 고요',color:'#6386a3'},{id:3,name:'달빛 공방',color:'#bcaa6c'}];
  const variantNames={lantern:['벚꽃 종이등','쪽빛 종이등','금빛 달 종이등'],plants:['벚꽃 화분','청자빛 소나무 화분','붉은 단풍 화분'],ceramics:['벚꽃 도자기 세트','쪽빛 도자기 세트','금채 도자기 세트'],noren:['벚꽃 노렌','파도무늬 노렌','금빛 달 노렌'],bonsai:['벚꽃 분재','청자 화분의 소나무','장인의 단풍 분재'],bench:['벚나무 벤치','짙은 호두나무 벤치','황동 장식 벤치'],shelves:['벚나무 찻장','쪽빛 찻잔의 찻장','황동 장식 칠기 찻장'],sign:['벚나무 간판','쪽빛 법랑 간판','금빛 달 간판'],clock:['벚나무 벽시계','황동 호두나무 시계','달빛 공방 시계'],ikebana:['벚꽃 한 가지','청자 화병의 흰 꽃','금빛 가지 꽃꽂이'],andon:['벚꽃 안돈','쪽빛 안돈','황동 달빛 안돈'],sudare:['봄빛 대나무 발','쪽빛 대나무 발','공방의 짙은 대나무 발'],plaque:['벚꽃 문패','쪽빛 달 문패','황동 초승달 문패'],fridge:['벚꽃빛 냉장고','청회색 법랑 냉장고','황동 손잡이 냉장고'],barfront:['벚나무 격자 카운터','쪽빛 나무 카운터','금빛 달 상감 카운터']};
  const upgrades={};
  for(let theme=0;theme<4;theme++)for(const [slot,name,price,level,atmosphere]of base){
    const id=theme?`${slot}_${theme}`:slot;
    upgrades[id]={id,slot,theme,name:theme?variantNames[slot][theme-1]:name,price:Math.round(price*(1+theme*1.15)/100)*100,level:Math.min(34,level+[0,7,15,24][theme]),area:slots[slot].area,atmosphere:atmosphere+theme*3+theme*theme*2,max:slot==='lantern'?3:1,description:`${slots[slot].place}을 ${themes[theme].name} 분위기로 꾸며요.`};
  }
  const count=(s,id)=>s.upgrades.includes(id)?(s.upgradeQty?.[id]||1):0;
  function activeId(s,slot){const selected=s.equipped?.[slot];return selected&&s.upgrades.includes(selected)?selected:[...s.upgrades].reverse().find(id=>upgrades[id]?.slot===slot);}
  function activeItems(s){return Object.keys(slots).map(slot=>activeId(s,slot)).filter(Boolean);}
  function benefits(s){const b={tips:0,patience:0,reputation:0,quality:0,tolerance:0,discount:0,sets:[]},sets=[0,0,0,0];
    for(const id of activeItems(s)){const u=upgrades[id],t=u.theme,n=count(s,id);sets[t]++;
      if(u.slot==='lantern')b.quality+=3*n;
      if(['ceramics','shelves','ikebana','plaque','barfront'].includes(u.slot))b.tips+=2+t;
      if(['noren','bonsai','bench','andon'].includes(u.slot))b.patience+=3+t*2;
      if(['plants','sign'].includes(u.slot))b.reputation+=2+t;
      if(['clock','sudare'].includes(u.slot))b.tolerance+=.004+t*.002;
      if(u.slot==='fridge')b.discount=10+t*2;
    }
    sets.forEach((n,i)=>{if(n>=5){const bonus=n>=10?6:3;b.tips+=bonus;b.sets.push({theme:i,count:n,bonus});}});
    b.tips=Math.min(30,b.tips);b.patience=Math.min(40,b.patience);b.reputation=Math.min(10,b.reputation);return b;
  }
  function benefitText(id){const u=upgrades[id],t=u.theme;if(u.slot==='lantern')return '1개당 요리 만족도 +3 · 최대 3개';if(['ceramics','shelves','ikebana','plaque','barfront'].includes(u.slot))return `좋은 식사의 팁 +${2+t}%`;if(['noren','bonsai','bench','andon'].includes(u.slot))return `손님의 기다림 여유 +${3+t*2}초`;if(['plants','sign'].includes(u.slot))return `첫 손님 입소문 +${2+t}`;if(['clock','sudare'].includes(u.slot))return '알맞은 익힘 구간이 조금 넓어져요';return `재료 구매 ${10+t*2}% 할인`;}
  function rectangle(id,art=false){const u=upgrades[id],slot=slots[u.slot];if(u.slot==='clock'){const r=[[359,194,82,83],[358,214,88,88],[352,232,82,78],[358,224,86,80]][u.theme];return r.map((v,i)=>v/(i%2?1024:1536)*100);}return [...(art?slot.art:slot.rect)];}
  function file(id,closed=false){const u=upgrades[id];if(!u)return'';if(u.area==='outside'&&!u.theme)return closed?'exterior-furnished-closed-v19':'exterior-furnished-v19';return `${u.area==='inside'?'room':'exterior'}-collection-${u.theme}${closed?'-closed':''}`;}
  const api={upgrades,slots,themes,count,activeId,activeItems,benefits,benefitText,file,rectangle};if(typeof module!=='undefined')module.exports=api;else window.MidnightFurnishings=api;
})();
