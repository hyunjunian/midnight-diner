/* Approved 50-level store renovation rules. Cooking art and legacy entitlements stay intact. */
(function(root,factory){const api=factory(typeof module==='object'?require('./renovation-preview/model.js'):root.RenovationDesign,typeof module==='object'?require('./furnishings.js'):root.MidnightFurnishings);if(typeof module==='object')module.exports=api;else root.MidnightRenovation=api;})(globalThis,function(M,F){
 'use strict';
 const areas=['inside','outside'],validArea=a=>areas.includes(a),integer=(v,max=1e9)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 const initial=()=>({version:1,inside:0,outside:0,insideCredit:0,outsideCredit:0,legacyAtmosphere:0});
 const totals=s=>{const r=s.renovation||initial(),a=M.totals('inside',r.inside),b=M.totals('outside',r.outside);return {atmosphere:a.atmosphere+b.atmosphere+r.legacyAtmosphere,environment:a.environment+b.environment};};
 function restore(source,s){
  const r=initial();
  if(source&&typeof source==='object'&&!Array.isArray(source)){
   for(const key of ['inside','outside','insideCredit','outsideCredit','legacyAtmosphere'])if(integer(source[key],areas.includes(key)?50:1e9))r[key]=source[key];
   return r;
  }
  // Convert historical game-currency purchases once, without touching current money or ownership.
  for(const id of s.upgrades||[]){const u=F.upgrades[id];if(u)r[u.area+'Credit']+=u.price*F.count(s,id);}
  const oldAtmosphere=F.activeItems(s).reduce((sum,id)=>sum+F.upgrades[id].atmosphere*F.count(s,id),0);
  for(const area of areas){for(const u of M.catalog[area]){if(u.level>s.level||r[area+'Credit']<u.cost)break;r[area+'Credit']-=u.cost;r[area]=u.level;}}
  r.legacyAtmosphere=Math.max(0,oldAtmosphere-totals({renovation:r}).atmosphere);
  return r;
 }
 function image(area,level){return level>0?`./renovation-preview/assets/${area}-${String(level).padStart(2,'0')}.webp`:`./assets/${area==='inside'?'room-bare-v19':'exterior-bare-v19'}.webp`;}
 function next(s,area){return validArea(area)?M.catalog[area][s.renovation?.[area]||0]||null:null;}
 function quote(s,area,expected){
  if(!validArea(area))return {ok:false,reason:'잘못된 개선 구역'};
  const u=next(s,area);if(!u)return {ok:false,reason:'50단계 개선 완료'};
  if(expected!==undefined&&u.level!==expected)return {ok:false,reason:'디자인을 다시 확인해 주세요'};
  return {ok:false,upgrade:u,requiresPayment:true,reason:'결제 준비 중'};
 }
 function install(s,area,expected){
  // Paid cosmetic checkout is not connected yet. Never spend earned game funds
  // or accept client-side claims of payment. Existing installed designs remain.
  return false;
 }
 function atmosphereTarget(level){if(level<=2)return 0;const a=M.totals('inside',level-1),b=M.totals('outside',level-1);return Math.floor((a.atmosphere+b.atmosphere)*.65);}
 return {catalog:M.catalog,initial,restore,totals,image,next,quote,install,atmosphereTarget,areaTotals:M.totals};
});
