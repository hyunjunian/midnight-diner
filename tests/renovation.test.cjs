const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../docs/engine.js');
test('cosmetics require payment rather than game funds at every stage',()=>{
 for(const area of ['inside','outside'])for(let level=1;level<=50;level++){const s=E.fresh();s.money=1000000;s.level=50;s.renovation[area]=level-1;const before=structuredClone(s),q=E.R.quote(s,area,level);assert.equal(q.ok,false);assert.equal(q.requiresPayment,true);assert.equal(q.reason,'결제 준비 중');assert.equal(E.renovate(s,area,level),false);assert.deepEqual(s,before);}
});
test('stale, invalid and client-forged purchase requests never spend funds or install art',()=>{
 const s=E.fresh();s.money=999999;s.paid=true;s.receipt='fake';const before=structuredClone(s);for(const [area,l]of [['inside',1],['outside',50],['__proto__',1],['constructor',1],['inside',NaN],['inside','1']]){assert.equal(E.renovate(s,area,l),false);assert.deepEqual(s,before);}
});
test('historical purchases migrate once while retaining ownership, art and unused old credit',()=>{
 const s=E.fresh();s.money=12345;s.upgrades=['lantern','plants'];s.upgradeQty={lantern:1,plants:1};s.equipped={lantern:'lantern',plants:'plants'};delete s.renovation;
 const r=E.restore(JSON.stringify(s));assert.equal(r.money,12345);assert.deepEqual(r.upgrades,s.upgrades);assert.equal(r.renovation.inside,1);assert.equal(r.renovation.outside,1);assert.equal(r.renovation.insideCredit,550);assert.equal(r.renovation.outsideCredit,500);assert.equal(E.atmosphere(r),10);
 const again=E.restore(JSON.stringify(r));assert.deepEqual(again.renovation,r.renovation);const before=structuredClone(again);assert.equal(E.renovate(again,'inside',2),false);assert.deepEqual(again,before);
});
test('renovation reload keeps ongoing cooking, historical benefits and installed designs',()=>{
 const s=E.fresh();s.level=20;s.money=50000;s.upgrades=['fridge'];s.upgradeQty={fridge:1};s.equipped={fridge:'fridge'};E.progress(s);E.open(s);const g=E.arrive(s);E.acceptOrder(s,g.id);E.beginCooking(s,g.id);for(const id of E.recipes[g.recipe].ingredients)E.selectIngredient(s,id);E.prepareIngredients(s);E.completeCookingStep(s,1);delete s.renovation;
 const r=E.restore(JSON.stringify(s));assert.equal(r.money,s.money);assert.deepEqual(r.inventory,s.inventory);assert.deepEqual(r.kitchen,s.kitchen);assert.deepEqual(r.guests,s.guests);assert.equal(E.buyPrice(r,'pork'),117);const before=structuredClone(r);assert.equal(E.renovate(r,'outside',1),false);assert.deepEqual(r,before);assert.deepEqual(E.restore(JSON.stringify(r)).renovation,r.renovation);
});
test('invalid optional renovation metadata cannot reset a valid save or grant credit',()=>{
 const s=E.fresh();s.money=54321;s.renovation={version:1,inside:500,outside:-4,insideCredit:Infinity,outsideCredit:'20',legacyAtmosphere:NaN};s.upgrades=['fridge'];const r=E.restore(JSON.stringify(s));assert.equal(r.money,54321);assert.deepEqual(r.renovation,E.R.initial());assert.deepEqual(r.upgrades,['fridge']);
});
