(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RenovationDesign=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const inside=[
    ['카운터','표면 정비','상판 보수','원목 교체','맞춤 패널','황동 마감'],
    ['벽과 창','벽면 보수','회벽 정비','창살 교체','목재 몰딩','단열 마감'],
    ['냉장고','외장 정비','패킹·손잡이 보수','새 냉장고','절전형 설비','맞춤 외장'],
    ['천장과 조명','첫 한지등','조명 확장','조명 통일','간접 조명','맞춤 등기구'],
    ['왼쪽 수납','선반 정비','수납 확장','원목 선반','그릇 진열','도자기 장식'],
    ['뒤쪽 작업대','표면 복원','상판 보수','새 상판','벽면 마감','맞춤 수납'],
    ['후드 주변','오염 정비','환기 설비 보수','후드 교체','구리 마감','설비 통일'],
    ['오른쪽 수납장','외장 보수','유리 정비','수납장 교체','진열 조명','맞춤 유리장'],
    ['실내 출입문','문틀 보수','목재 복원','창호 교체','격자 정비','맞춤 미닫이문'],
    ['바닥','기초 보수','마루 정비','원목 마루','보호 마감','최종 광택']
  ];
  const outside=[
    ['노렌','천 교체','색상 정돈','직조 개선','맞춤 길이','직조 마감'],
    ['간판','목판 정비','재도장','원목 교체','모서리 마감','맞춤 간판'],
    ['입구 문','문틀 정비','목재 보수','격자문 교체','창호 마감','맞춤 미닫이문'],
    ['외부 창','유리 정비','창틀 보수','격자 교체','진열 정돈','창호 마감'],
    ['외벽 목재','기초 보수','목재 복원','외장 교체','방수 마감','원목 통일'],
    ['외벽 회벽','균열 보수','회벽 정돈','외벽 재시공','단열 정비','질감 마감'],
    ['지붕과 처마','기와 보수','빗물받이 정비','지붕 복원','처마 마감','목재 통일'],
    ['입구 식재','화분 정비','식재 추가','화분 교체','계절 식재','도자기 화분'],
    ['입구 조명','안돈 설치','조명 보강','등기구 교체','빛 정돈','맞춤 안돈'],
    ['문턱과 앞길','배수 정비','문턱 보수','돌바닥 정비','진입로 마감','최종 정돈']
  ];
  const catalog={inside:[],outside:[]};
  for(const area of ['inside','outside'])for(let level=1;level<=50;level++){
    const slot=(level-1)%10,tier=Math.floor((level-1)/10),row=(area==='inside'?inside:outside)[slot];
    const cost=Math.round((400+45*level+3*level*level)*(area==='inside'?1:.85)/50)*50;
    const bonus=level%10===0?2:level%5===0?1:0;
    catalog[area].push(Object.freeze({id:`${area}-${level}`,area,level,previous:level-1,zone:row[0],name:row[tier+1],cost,atmosphere:(area==='inside'?2:1)+bonus,environment:(area==='inside'?1:2)+bonus,image:`assets/${area}-${String(level).padStart(2,'0')}.webp`}));
  }
  function totals(area,level){return catalog[area].slice(0,level).reduce((a,u)=>({atmosphere:a.atmosphere+u.atmosphere,environment:a.environment+u.environment,cost:a.cost+u.cost}),{atmosphere:0,environment:0,cost:0});}
  function initial(level=1,cash=30000){return {level:Math.max(1,Math.min(50,level)),cash,inside:0,outside:0,atmosphere:0,environment:0};}
  function showcase(level){const s=initial(level),a=totals('inside',level-1),b=totals('outside',level-1);return {...s,inside:level-1,outside:level-1,atmosphere:a.atmosphere+b.atmosphere,environment:a.environment+b.environment};}
  function next(state,area){return catalog[area]?.[state[area]]||null;}
  function eligibility(state,area){const u=next(state,area);if(!u)return {ok:false,reason:'모든 개선 완료'};if(state.level<u.level)return {ok:false,reason:`Lv${u.level} 필요`};if(state.cash<u.cost)return {ok:false,reason:'캐쉬 부족'};return {ok:true,upgrade:u};}
  function purchase(state,area){const check=eligibility(state,area);if(!check.ok)return {...check,state};const u=check.upgrade;return {ok:true,upgrade:u,state:{...state,cash:state.cash-u.cost,[area]:u.level,atmosphere:state.atmosphere+u.atmosphere,environment:state.environment+u.environment}};}
  return {catalog,totals,initial,showcase,next,eligibility,purchase};
});
