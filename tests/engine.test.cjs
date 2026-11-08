const{test}=require('node:test'),assert=require('node:assert/strict'),E=require('../docs/engine.js');
const setup=()=>{const s=E.fresh();E.open(s);const g=E.arrive(s);return{s,g};};
function stock(s,r){for(const id of r.ingredients)if(!s.inventory[id]){assert.ok(E.buy(s,id)||E.rescue(s));}}
function cook(s,g,quality=1){E.acceptOrder(s,g.id);assert.ok(E.beginCooking(s,g.id));const r=E.recipes[g.recipe];stock(s,r);for(const id of r.ingredients)E.selectIngredient(s,id);assert.ok(E.prepareIngredients(s));for(const st of E.Cooking.plan(g.recipe,r))assert.ok(E.completeCookingStep(s,quality));return E.deliver(s);}
function pay(s,g){E.finishEating(s,g.id);const bill=E.collect(s,g.id);E.depart(s,g.id);return bill;}
function fullNight(s){E.open(s);const waves=[];for(let cycle=0;cycle<3;cycle++){const guests=Array.from({length:3},()=>E.arrive(s));assert.ok(guests.every(Boolean));waves.push(guests.map(g=>g.recipe));assert.equal(new Set(waves[cycle]).size,3);for(const g of guests){assert.ok(cook(s,g));pay(s,g);}}return waves;}
test('seating, acceptance, cooking, delivery, dining, collection and goodbye are distinct',()=>{
 const{s,g}=setup();const before=structuredClone(s);assert.equal(E.beginCooking(s,g.id),false);assert.equal(E.serve(s,g.id,['rice','nori'],.65),null);assert.equal(E.collect(s,g.id),null);assert.equal(E.depart(s,g.id),false);assert.deepEqual(s,before);
 assert.equal(E.acceptOrder(s,g.id),true);assert.equal(E.acceptOrder(s,g.id),false);assert.equal(E.beginCooking(s,g.id),true);assert.equal(E.deliver(s),null);
 E.selectIngredient(s,'rice');assert.equal(E.prepareIngredients(s),false);E.selectIngredient(s,'nori');assert.equal(E.prepareIngredients(s),true);
 const steps=E.Cooking.plan(g.recipe,E.recipes[g.recipe]);for(let i=0;i<steps.length;i++){assert.equal(E.deliver(s),null);E.completeCookingStep(s,1);}
 const result=E.deliver(s);assert.equal(result.score,100);assert.equal(s.money,3200);assert.equal(s.totalServed,0);assert.equal(g.status,'eating');assert.equal(s.inventory.rice,4);assert.equal(s.kitchen,null);assert.equal(E.deliver(s),null);
 assert.equal(E.collect(s,g.id),null);assert.equal(E.finishEating(s,g.id),true);assert.equal(g.status,'paying');assert.equal(E.collect(s,g.id).total,result.total);assert.equal(s.money,3200+result.total);assert.equal(s.xp,100);assert.equal(g.status,'farewell');assert.equal(E.collect(s,g.id),null);assert.equal(E.depart(s,g.id),true);assert.equal(E.depart(s,g.id),false);
});
test('each of three cycles has three different orders, even if recommendation is always onigiri',()=>{
 for(const level of [1,2,5,20,34]){const s=E.fresh();s.level=level;E.progress(s);s.money=100000;const waves=fullNight(s);assert.equal(waves.length,3);assert.equal(s.totalServed,9);assert.equal(E.arrive(s),null);assert.ok(E.canClose(s));}
});
test('next wave waits for all three customers to be paid and personally sent off',()=>{
 const s=E.fresh();E.open(s);const gs=[E.arrive(s),E.arrive(s),E.arrive(s)];cook(s,gs[0]);pay(s,gs[0]);assert.equal(E.arrive(s),null);cook(s,gs[1]);pay(s,gs[1]);cook(s,gs[2]);E.finishEating(s,gs[2].id);E.collect(s,gs[2].id);assert.equal(E.arrive(s),null);E.depart(s,gs[2].id);assert.ok(E.arrive(s));
});
test('perfect, cold, poorly prepared and incorrect meals receive different tips and scores',()=>{
 const make=(selected,timing,prep=1)=>{const{s,g}=setup();E.acceptOrder(s,g.id);const r=E.serve(s,g.id,selected,timing,prep);pay(s,g);return{s,r};};const best=make(['rice','nori'],.65),cold=make(['rice','nori'],0),badPrep=make(['rice','nori'],.65,0),wrong=make(['egg'],.65);assert.equal(best.r.score,100);assert.equal(badPrep.r.score,75);assert.ok(best.r.score>cold.r.score&&cold.r.score>wrong.r.score);assert.ok(best.r.tip>cold.r.tip);assert.equal(cold.r.tip,0);assert.ok(best.s.reputation>wrong.s.reputation);
});
test('invalid stock, duplicate ingredients or invalid timing never consume ingredients',()=>{
 const{s,g}=setup();E.acceptOrder(s,g.id);const before=structuredClone(s);for(const [ids,heat]of [[['salmon'],.65],[['rice','rice'],.65],[['rice'],NaN]])assert.equal(E.serve(s,g.id,ids,heat),null);assert.deepEqual(s,before);const r=E.serve(s,g.id,['rice','nori'],.65);assert.ok(r);const after=structuredClone(s);assert.equal(E.serve(s,g.id,['rice','nori'],.65),null);assert.deepEqual(s,after);
});
test('recipe families use actual different station sequences and onigiri covers all requested actions',()=>{
 const flow=id=>E.Cooking.plan(id,E.recipes[id]);assert.deepEqual(flow('onigiri').map(s=>s.id),['lid','portion','shape','oil','heat','wrap','assemble']);assert.ok(flow('onigiri').find(s=>s.id==='heat').flip);assert.ok(flow('tamago').some(s=>s.id==='beat'));assert.ok(flow('tonjiru').some(s=>s.id==='broth'));assert.equal(flow('hiyayakko').some(s=>s.id==='heat'),false);assert.ok(flow('soba').some(s=>s.id==='drain'));
 for(const[id,r]of Object.entries(E.recipes)){const steps=flow(id);assert.ok(steps.length>=3);assert.equal(steps.at(-1).id,'assemble');assert.ok(steps.every(s=>['rice','board','stove'].includes(s.station)));}
});
test('ingredients unlock when their first recipe becomes available and cannot be bought early',()=>{
 const s=E.fresh();s.money=100000;const before=s.money;assert.equal(E.ingredients.salmon.level,2);assert.equal(E.buy(s,'salmon'),false);assert.equal(s.money,before);assert.equal(s.inventory.tofu,0);s.level=2;assert.equal(E.buy(s,'salmon'),true);assert.equal(E.buy(s,'crab'),false);s.level=26;assert.equal(E.buy(s,'crab'),true);for(const[id,item]of Object.entries(E.ingredients))assert.equal(item.level,Math.min(...Object.values(E.recipes).filter(r=>r.ingredients.includes(id)).map(r=>r.level)));
});
test('nine collected meals produce one report and operating expense charge',()=>{
 const s=E.fresh();fullNight(s);const before=s.money;assert.equal(E.close(s),true);const r=E.report(s);assert.equal(r.xp,900);assert.equal(r.reputationDelta,36);assert.equal(r.satisfaction,100);assert.equal(r.level,2);assert.ok(r.menus.includes('연어 오차즈케'));assert.equal(r.menus.length,3);assert.equal(r.expenses,900);assert.equal(s.money,before-900);assert.equal(E.close(s),false);E.next(s);E.open(s);assert.equal(s.night,2);assert.equal(s.nightRevenue,0);
});
test('level gates require reputation, satisfaction and XP, with earned levels retained',()=>{
 const s=E.fresh();s.xp=6000;s.totalServed=10;s.satisfactionTotal=1000;E.progress(s);assert.equal(s.level,1);s.reputation=100;s.satisfactionTotal=600;E.progress(s);assert.equal(s.level,1);s.satisfactionTotal=700;E.progress(s);assert.equal(s.level,3);s.satisfactionTotal=900;E.progress(s);assert.equal(s.level,5);s.reputation=0;E.progress(s);assert.equal(s.level,5);
});
test('100 dishes unlock three per level, with the last one at level 34',()=>{
 assert.equal(Object.keys(E.recipes).length,100);assert.equal(E.levels.length,34);for(let level=1;level<=34;level++)assert.equal(Object.values(E.recipes).filter(r=>r.level===level).length,level===34?1:3);const s=E.fresh();s.level=34;E.progress(s);assert.equal(s.unlocked.length,100);assert.equal(E.restore(JSON.stringify(s)).level,34);
});
test('furniture is gated and cannot be double-purchased; level 20 fridge discounts only future buys',()=>{
 const s=E.fresh();s.money=100000;assert.equal(E.upgrade(s,'noren'),false);assert.equal(E.upgrade(s,'lantern'),true);assert.equal(E.upgrade(s,'lantern'),false);s.level=19;assert.equal(E.upgrade(s,'fridge'),false);s.level=20;const before=s.money;assert.equal(E.upgrade(s,'fridge'),true);assert.equal(s.money,before-18000);assert.equal(E.buyPrice(s,'pork'),117);const cash=s.money;E.buy(s,'pork');assert.equal(s.money,cash-117);for(const id of ['nope','__proto__','constructor']){assert.equal(E.buy(s,id),false);assert.equal(E.upgrade(s,id),false);assert.equal(E.unlock(s,id),false);}
});
test('save resumes in-progress recipe, served meal, pending payment and paid goodbye without double rewards',()=>{
 const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);E.selectIngredient(s,'rice');E.selectIngredient(s,'nori');E.prepareIngredients(s);E.completeCookingStep(s,1);let v=E.restore(JSON.stringify(s));assert.equal(v.kitchen.step,1);assert.deepEqual(v.kitchen.selected,['rice','nori']);while(v.kitchen.stage!=='complete')E.completeCookingStep(v,1);E.deliver(v);v.guests[0].eatMs=2500;v=E.restore(JSON.stringify(v));assert.equal(v.guests[0].status,'eating');assert.equal(v.guests[0].eatMs,2500);assert.equal(v.money,3200);E.finishEating(v,g.id);v=E.restore(JSON.stringify(v));const bill=E.collect(v,g.id);v=E.restore(JSON.stringify(v));assert.equal(v.money,3200+bill.total);assert.equal(E.collect(v,g.id),null);assert.equal(v.guests[0].status,'farewell');
});
test('v5 duplicate unaccepted orders become unique without losing money or furniture',()=>{
 const s=E.fresh();E.open(s);E.arrive(s);E.arrive(s);E.arrive(s);s.version=5;s.upgrades=['plants'];s.guests.forEach(g=>{g.status='waiting';g.recipe='onigiri'});s.nightOrders=['onigiri','onigiri','onigiri'];const v=E.restore(JSON.stringify(s));assert.equal(v.version,7);assert.equal(new Set(v.guests.map(g=>g.recipe)).size,3);assert.ok(v.guests.every(g=>g.status==='seated'));assert.equal(v.money,s.money);assert.deepEqual(v.upgrades,['plants']);assert.ok(E.restore(JSON.stringify(v)));
});
test('legacy already-paid meals migrate to goodbye and never pay twice',()=>{
 const{s,g}=setup();cook(s,g);E.finishEating(s,g.id);E.collect(s,g.id);s.version=5;g.status='eating';delete g.bill;const v=E.restore(JSON.stringify(s));assert.equal(v.guests[0].status,'farewell');assert.equal(E.collect(v,g.id),null);assert.equal(v.money,s.money);assert.equal(E.depart(v,g.id),true);
});
test('corrupted versions, forged bills, invalid cooking steps and unknown recipes are rejected',()=>{
 const{s,g}=setup();for(const patch of [{version:99},{money:-1},{inventory:{}},{special:'evil'},{kitchen:{guest:1,stage:'complete',selected:[],step:90,marks:[]}}])assert.throws(()=>E.restore(JSON.stringify({...s,...patch})));E.acceptOrder(s,g.id);E.serve(s,g.id,['rice','nori'],.65);g.bill.total++;assert.throws(()=>E.restore(JSON.stringify(s)));assert.throws(()=>E.restore('not json'));
});
test('happy guests wait two level gains before probabilistic revisits and become regulars on third visit',()=>{
 const{s,g}=setup();cook(s,g);pay(s,g);assert.equal(s.customerBook[0].dueLevel,3);s.phase='prep';s.night=2;E.open(s);assert.notEqual(E.arrive(s).person,0);
 function revisit(level,night){s.phase='prep';s.level=level;s.night=night;E.open(s);for(let i=0;i<9;i++){s.guests.forEach(g=>g.status='left');const visitor=E.arrive(s);if(visitor.person===0)return visitor;}assert.fail('seeded revisit');}
 let visitor=revisit(3,3);cook(s,visitor);pay(s,visitor);assert.equal(s.customerBook[0].visits,2);visitor=revisit(5,4);assert.equal(E.regular(s,0),true);const eggs=s.inventory.egg;assert.equal(E.gift(s,visitor.id),true);assert.equal(s.inventory.egg,eggs-1);assert.equal(E.gift(s,visitor.id),false);
});
test('a two-step story saves between choices and applies next-night consequences exactly once',()=>{
 const s=E.fresh();fullNight(s);s.guests.forEach(g=>g.status='farewell');E.conversation(s);assert.equal(E.canClose(s),false);const choice=E.story(s).definition.choices.find(c=>E.canChoose(s,c));const before=s.money;assert.equal(E.resolveEvent(s,choice.id),true);assert.equal(s.money,before+(choice.money||0));const v=E.restore(JSON.stringify(s));assert.equal(v.storyRun.step,1);assert.equal(E.resolveEvent(s,choice.id),false);assert.equal(E.resolveEvent(s,'remember'),true);assert.equal(E.resolveEvent(s,'remember'),false);s.guests.forEach(g=>E.depart(s,g.id));assert.equal(E.close(s),true);E.next(s);const cash=s.money;E.open(s);assert.equal(s.money,cash+(choice.future.money||0));assert.equal(s.nightNews.length,1);assert.equal(s.pendingConsequences.length,0);assert.equal(E.open(s),false);
});
test('every visit has a new stable dialogue and every night has nine distinct faces',()=>{
 const s=E.fresh();E.open(s);const lines=[],faces=[];for(let i=0;i<9;i++){s.guests.forEach(g=>g.status='left');const g=E.arrive(s);lines.push(E.dialogue(g));faces.push(g.person%24);assert.equal(E.dialogue(g),E.dialogue(E.restore(JSON.stringify(s)).guests.find(x=>x.id===g.id)));}assert.equal(new Set(lines).size,9);assert.equal(new Set(faces).size,9);
});
test('no cash and missing stock has a recovery path for the current wave',()=>{
 const{s,g}=setup();s.money=0;s.inventory.rice=0;s.inventory.nori=0;assert.deepEqual(E.rescueNeeds(s),{rice:1,nori:1});assert.equal(E.rescue(s),true);assert.equal(E.rescue(s),false);assert.equal(s.reputation,9);assert.ok(cook(s,g));
});
test('v2 and v3 saves keep progress and can be saved again after migrating later-cycle guests',()=>{
 for(const version of [2,3,4]){const{s,g}=setup();g.status='waiting';s.version=version;s.upgrades=['plants'];if(version===2){delete s.customerBook;delete s.level;delete s.xp;delete s.satisfactionTotal;delete s.nightStart;s.target=3;}if(version===3){g.id=7;s.arrived=7;delete s.nextVisitor;delete s.nightVisitors;}const v=E.restore(JSON.stringify(s));assert.equal(v.version,7);assert.equal(v.money,s.money);assert.deepEqual(v.upgrades,['plants']);assert.ok(E.restore(JSON.stringify(v)));}
});
test('all 100 recipes can be cooked, restored, served and collected at their advertised level',()=>{
 for(const[id,r]of Object.entries(E.recipes)){const s=E.fresh();s.level=r.level;s.money=100000;E.progress(s);E.open(s);const g=E.arrive(s);g.recipe=id;s.nightOrders[0]=id;E.acceptOrder(s,g.id);E.beginCooking(s,g.id);stock(s,r);for(const id of r.ingredients)E.selectIngredient(s,id);assert.ok(E.prepareIngredients(s));for(const st of E.Cooking.plan(id,r))E.completeCookingStep(s,1);const restored=E.restore(JSON.stringify(s)),before=restored.money,result=E.deliver(restored);assert.equal(result.score,100,r.name);assert.equal(restored.money,before);E.finishEating(restored,g.id);assert.equal(E.collect(restored,g.id).total,result.total);assert.equal(restored.money,before+result.total);assert.ok(E.restore(JSON.stringify(restored)));}
});
test('v6 active cooking restarts the new sequence while retaining money, inventory and selected ingredients',()=>{
 const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);E.selectIngredient(s,'rice');E.selectIngredient(s,'nori');E.prepareIngredients(s);s.kitchen.step=5;s.kitchen.marks=[1,1,1,1,1];s.version=6;const v=E.restore(JSON.stringify(s));assert.equal(v.version,7);assert.equal(v.kitchen.step,0);assert.equal(v.kitchen.stage,'room');assert.deepEqual(v.kitchen.selected,['rice','nori']);assert.deepEqual(v.inventory,s.inventory);assert.equal(v.money,s.money);assert.equal(v.guests[0].status,'waiting');
});
