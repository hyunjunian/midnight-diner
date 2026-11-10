const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../docs/engine.js');
test('free play unlocks six dishes, banks XP and funds and never crosses level 2',()=>{
 const s=E.fresh();s.xp=449;E.progress(s);assert.equal(s.level,1);
 s.xp=450;E.progress(s);assert.equal(s.level,2);assert.equal(s.unlocked.length,6);assert.equal(E.trialComplete(s),false);
 s.xp=1000000;s.money=7654;E.progress(s);const r=E.restore(JSON.stringify(s));
 assert.equal(r.level,2);assert.equal(r.unlocked.length,6);assert.equal(r.xp,1000000);assert.equal(r.money,7654);assert.ok(E.trialComplete(r));
 for(const area of ['inside','outside']){assert.ok(E.renovate(r,area,1));assert.ok(E.renovate(r,area,2));assert.equal(E.renovate(r,area,3),false);}
 assert.equal(r.level,2);
});
test('old level 3+ saves retain full progression, funds, inventory and ongoing cooking',()=>{
 const s=E.fresh();delete s.access;s.level=20;s.money=54321;E.progress(s);E.open(s);
 const g=E.arrive(s);E.acceptOrder(s,g.id);E.beginCooking(s,g.id);const kitchen=structuredClone(s.kitchen),inventory=structuredClone(s.inventory),guests=structuredClone(s.guests);
 const r=E.restore(JSON.stringify(s));assert.equal(r.access.kind,'existing-player');assert.equal(r.level,20);assert.equal(r.money,54321);assert.deepEqual(r.kitchen,kitchen);assert.deepEqual(r.inventory,inventory);assert.deepEqual(r.guests,guests);
 r.xp=E.levels[20].xp;E.progress(r);assert.equal(r.level,21);assert.equal(E.trialComplete(r),false);assert.equal(E.restore(JSON.stringify(r)).access.kind,'existing-player');
});
test('old level 1/2 saves and unverified paid flags do not grant paid access or erase savings',()=>{
 for(const level of [1,2])for(const access of [undefined,{version:1,kind:'paid'},{paid:true},'invalid']){
  const s=E.fresh();s.level=level;s.xp=6000;s.money=9876;delete s.access;if(access!==undefined)s.access=access;
  const r=E.restore(JSON.stringify(s));assert.equal(r.level,2);assert.equal(r.access.kind,'trial');assert.equal(r.money,9876);assert.equal(r.xp,6000);
 }
});
test('atmosphere changes actual tips once while preserving food score and collection lifecycle',()=>{
 const meal=improved=>{const s=E.fresh();if(improved){s.renovation.inside=50;s.renovation.outside=50;}E.open(s);const g=E.arrive(s);E.acceptOrder(s,g.id);const funds=s.money,r=E.serve(s,g.id,E.recipes[g.recipe].ingredients,E.cookSpec(s,g.recipe).ideal);assert.equal(s.money,funds);return {s,g,r,funds};};
 const plain=meal(false),rich=meal(true);assert.equal(rich.r.score,plain.r.score);assert.equal(rich.r.base,plain.r.base);assert.ok(rich.r.tip>plain.r.tip);
 const raw=E.recipes[rich.g.recipe].price*.16;assert.equal(rich.r.tip,Math.round(raw*1.36));
 const loaded=E.restore(JSON.stringify(rich.s));assert.deepEqual(loaded.guests[0].bill,rich.r);E.finishEating(loaded,rich.g.id);assert.equal(E.collect(loaded,rich.g.id).total,rich.r.total);assert.equal(loaded.money,rich.funds+rich.r.total);assert.equal(E.collect(loaded,rich.g.id),null);
});
test('environment reduces actual night expenses, respects available funds and cannot settle twice',()=>{
 for(const funds of [10000,100]){const s=E.fresh();s.money=funds;s.renovation.inside=50;s.renovation.outside=50;E.open(s);s.arrived=s.target;s.nightScores=Array(9).fill(100);
  assert.equal(E.operatingCost(s),738);assert.ok(E.close(s));assert.equal(s.nightCosts,Math.min(funds,738));const after=s.money;assert.equal(E.report(s).expenses,Math.min(funds,738));assert.equal(E.close(s),false);assert.equal(s.money,after);assert.equal(E.restore(JSON.stringify(s)).nightCosts,s.nightCosts);
 }
});
test('renovation benefits grow from the first improvement and remain bounded at full renovation',()=>{
 const s=E.fresh();assert.deepEqual(E.growthBenefits(s),{tips:0,operatingDiscount:0});E.renovate(s,'inside',1);assert.deepEqual(E.growthBenefits(s),{tips:.4,operatingDiscount:.1});
 assert.deepEqual(E.Growth.benefits({atmosphere:1e9,environment:1e9}),{tips:36,operatingDiscount:18});assert.deepEqual(E.Growth.benefits({atmosphere:NaN,environment:-5}),{tips:0,operatingDiscount:0});
});
