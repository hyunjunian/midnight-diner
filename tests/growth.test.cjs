const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../docs/engine.js');
test('all 50 levels and 100 dishes are free without decorating or purchase flags',()=>{
 const s=E.fresh();s.xp=449;E.progress(s);assert.equal(s.level,1);s.xp=450;E.progress(s);assert.equal(s.level,2);s.xp=1500;E.progress(s);assert.equal(s.level,3);assert.equal(s.unlocked.length,9);assert.equal(E.trialComplete(s),false);
 s.xp=E.levels[49].xp;E.progress(s);assert.equal(s.level,50);assert.equal(s.unlocked.length,100);assert.equal(E.atmosphere(s),0);assert.equal(E.environment(s),0);assert.equal(s.money,3200);
});
test('former trial and existing-player saves become free without losing progress or savings',()=>{
 for(const kind of ['trial','existing-player','paid','free']){const s=E.fresh();s.access={version:1,kind};s.level=2;s.xp=1500;s.money=7654;const inventory=structuredClone(s.inventory),r=E.restore(JSON.stringify(s));assert.equal(r.level,3);assert.equal(r.access.kind,'free');assert.equal(r.xp,1500);assert.equal(r.money,7654);assert.deepEqual(r.inventory,inventory);assert.equal(E.trialComplete(r),false);}
});
test('free migration preserves existing paid-in-game scenery, meals and active cooking',()=>{
 const s=E.fresh();s.level=20;s.xp=E.levels[19].xp;s.money=54321;s.renovation.inside=12;s.renovation.outside=8;E.progress(s);E.open(s);const g=E.arrive(s);E.acceptOrder(s,g.id);E.beginCooking(s,g.id);
 const frozen=structuredClone(s);const r=E.restore(JSON.stringify(s));for(const key of ['money','level','inventory','renovation','kitchen','guests'])assert.deepEqual(r[key],frozen[key]);assert.equal(r.access.kind,'free');
});
test('cosmetic stages never alter food scores, tip amounts or payment collection',()=>{
 const meal=decorated=>{const s=E.fresh();if(decorated){s.renovation.inside=50;s.renovation.outside=50;}E.open(s);const g=E.arrive(s);E.acceptOrder(s,g.id);const money=s.money,bill=E.serve(s,g.id,E.recipes[g.recipe].ingredients,E.cookSpec(s,g.recipe).ideal);assert.equal(s.money,money);return {s,g,bill,money};};
 const a=meal(false),b=meal(true);assert.deepEqual(b.bill,a.bill);assert.deepEqual(E.growthBenefits(b.s),{tips:0,operatingDiscount:0});E.finishEating(b.s,b.g.id);assert.equal(E.collect(b.s,b.g.id).total,b.bill.total);assert.equal(b.s.money,b.money+b.bill.total);assert.equal(E.collect(b.s,b.g.id),null);
});
test('cosmetic stages never discount operating expenses or change the once-only settlement',()=>{
 for(const decorated of [false,true]){const s=E.fresh();if(decorated){s.renovation.inside=50;s.renovation.outside=50;}E.open(s);s.arrived=s.target;s.nightScores=Array(9).fill(100);assert.equal(E.operatingCost(s),900);assert.ok(E.close(s));assert.equal(s.nightCosts,900);const money=s.money;assert.equal(E.close(s),false);assert.equal(s.money,money);assert.equal(E.restore(JSON.stringify(s)).nightCosts,900);}
});
