const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../docs/engine.js');
test('existing full playthroughs can complete all 100 renovations through level 50',()=>{
 const s=E.fresh();assert.equal(s.renovation.inside,0);assert.equal(s.renovation.outside,0);assert.equal(E.atmosphere(s),0);assert.equal(E.environment(s),0);assert.equal(E.levels.length,50);
 s.access={version:1,kind:'existing-player'};s.money=1000000;s.xp=10000000;s.reputation=100;s.totalServed=100;s.satisfactionTotal=10000;E.progress(s);
 for(let level=1;level<=50;level++){assert(s.level>=level,`level ${level} must not depend on its own locked upgrade`);for(const area of ['inside','outside'])assert(E.renovate(s,area,level));E.progress(s);}
 assert.equal(s.level,50);assert.equal(s.renovation.inside,50);assert.equal(s.renovation.outside,50);assert.equal(E.atmosphere(s),180);assert.equal(E.environment(s),180);assert.equal(E.restore(JSON.stringify(s)).level,50);
});
test('cash and both gains apply once; stale, skipped, malformed or locked requests cannot spend',()=>{
 const s=E.fresh(),before=structuredClone(s);for(const [area,l]of [['inside',2],['outside',50],['__proto__',1],['constructor',1],['inside',NaN],['inside','1']]){assert.equal(E.renovate(s,area,l),false);assert.deepEqual(s,before);}
 const result=E.renovate(s,'inside',1);assert(result);assert.equal(s.money,before.money-450);assert.equal(E.atmosphere(s),2);assert.equal(E.environment(s),1);
 const after=structuredClone(s);assert.equal(E.renovate(s,'inside',1),false);assert.equal(E.renovate(s,'inside',2),false);assert.deepEqual(s,after);
 s.money=0;const poor=structuredClone(s);assert.equal(E.renovate(s,'outside',1),false);assert.deepEqual(s,poor);
});
test('legacy purchases convert once to area improvements and remaining credit without resetting funds',()=>{
 const s=E.fresh();s.money=12345;s.upgrades=['lantern','plants'];s.upgradeQty={lantern:1,plants:1};s.equipped={lantern:'lantern',plants:'plants'};delete s.renovation;
 const migrated=E.restore(JSON.stringify(s));assert.equal(migrated.money,12345);assert.deepEqual(migrated.upgrades,s.upgrades);assert.equal(migrated.renovation.inside,1);assert.equal(migrated.renovation.outside,1);assert.equal(migrated.renovation.insideCredit,550);assert.equal(migrated.renovation.outsideCredit,500);assert.equal(E.atmosphere(migrated),10);
 const again=E.restore(JSON.stringify(migrated));assert.deepEqual(again.renovation,migrated.renovation);again.level=2;const gain=E.atmosphere(again),result=E.renovate(again,'inside',2);assert(result);assert.equal(result.cash,0);assert.equal(result.credit,500);assert.equal(again.money,12345);assert.equal(again.renovation.insideCredit,50);assert.equal(E.atmosphere(again),gain+2);
 assert.deepEqual(E.restore(JSON.stringify(again)).renovation,again.renovation);
});
test('renovation reload keeps ongoing cooking, meals, inventory and historical benefits',()=>{
 const s=E.fresh();s.level=20;s.money=50000;s.upgrades=['fridge'];s.upgradeQty={fridge:1};s.equipped={fridge:'fridge'};E.progress(s);E.open(s);const g=E.arrive(s);E.acceptOrder(s,g.id);E.beginCooking(s,g.id);for(const id of E.recipes[g.recipe].ingredients)E.selectIngredient(s,id);E.prepareIngredients(s);E.completeCookingStep(s,1);delete s.renovation;
 const r=E.restore(JSON.stringify(s));assert.equal(r.money,s.money);assert.deepEqual(r.inventory,s.inventory);assert.deepEqual(r.kitchen,s.kitchen);assert.deepEqual(r.guests,s.guests);assert.equal(E.buyPrice(r,'pork'),117);const scene=structuredClone(r.kitchen);assert(E.renovate(r,'outside',1));const reloaded=E.restore(JSON.stringify(r));assert.deepEqual(reloaded.kitchen,scene);assert.equal(reloaded.money,r.money);assert.equal(reloaded.renovation.outside,1);
});
test('invalid optional renovation metadata cannot reset an otherwise valid save or re-grant old credit',()=>{
 const s=E.fresh();s.money=54321;s.renovation={version:1,inside:500,outside:-4,insideCredit:Infinity,outsideCredit:'20',legacyAtmosphere:NaN};s.upgrades=['fridge'];const r=E.restore(JSON.stringify(s));assert.equal(r.money,54321);assert.deepEqual(r.renovation,E.R.initial());assert.deepEqual(r.upgrades,['fridge']);
});
