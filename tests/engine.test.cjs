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
 const flow=id=>E.Cooking.plan(id,E.recipes[id]);assert.deepEqual(flow('onigiri').filter(s=>s.id!=='prep').map(s=>s.id),['portion','shape','heat','wrap','assemble']);assert.ok(flow('onigiri').find(s=>s.id==='heat').flip);assert.ok(flow('tamago').some(s=>s.id==='beat'));assert.ok(flow('tonjiru').some(s=>s.id==='broth'));assert.equal(flow('hiyayakko').some(s=>s.id==='heat'),false);assert.ok(flow('soba').some(s=>s.id==='drain'));
 for(const[id,r]of Object.entries(E.recipes)){const steps=flow(id);assert.ok(steps.length>=3);assert.equal(steps.at(-1).id,'assemble');assert.ok(steps.every(s=>['rice','board','stove'].includes(s.station)));}
});
test('ingredients unlock when their first recipe becomes available and cannot be bought early',()=>{
 const s=E.fresh();s.money=100000;const before=s.money;assert.equal(E.ingredients.salmon.level,2);assert.equal(E.buy(s,'salmon'),false);assert.equal(s.money,before);assert.equal(s.inventory.tofu,0);s.level=2;assert.equal(E.buy(s,'salmon'),true);assert.equal(E.buy(s,'crab'),false);s.level=26;assert.equal(E.buy(s,'crab'),true);for(const[id,item]of Object.entries(E.ingredients))assert.equal(item.level,Math.min(...Object.values(E.recipes).filter(r=>r.ingredients.includes(id)).map(r=>r.level)));
});
test('nine collected meals produce one report and operating expense charge',()=>{
 const s=E.fresh();fullNight(s);const before=s.money;assert.equal(E.close(s),true);const r=E.report(s);assert.equal(r.xp,900);assert.equal(r.reputationDelta,36);assert.equal(r.satisfaction,100);assert.equal(r.level,2);assert.ok(r.menus.includes('연어 오차즈케'));assert.equal(r.menus.length,3);assert.equal(r.expenses,900);assert.equal(s.money,before-900);assert.equal(E.close(s),false);E.next(s);E.open(s);assert.equal(s.night,2);assert.equal(s.nightRevenue,0);
});
test('experience alone advances every level freely and earned levels never fall',()=>{
 const s=E.fresh();s.xp=6000;E.progress(s);assert.equal(s.level,5);assert.equal(E.satisfaction(s),0);assert.equal(E.atmosphere(s),0);assert.equal(E.trialComplete(s),false);s.xp=0;E.progress(s);assert.equal(s.level,5);
});

test('100 dishes unlock three per level, with the last one at level 34',()=>{
 assert.equal(Object.keys(E.recipes).length,100);assert.equal(E.levels.length,50);for(let level=1;level<=34;level++)assert.equal(Object.values(E.recipes).filter(r=>r.level===level).length,level===34?1:3);const s=E.fresh();s.level=34;E.progress(s);assert.equal(s.unlocked.length,100);assert.equal(E.restore(JSON.stringify(s)).level,34);
});
test('individual item purchases are disabled while an owned legacy fridge keeps its discount',()=>{
 const s=E.fresh();s.money=100000;const before=structuredClone(s);for(const id of Object.keys(E.upgrades))assert.equal(E.upgrade(s,id),false);assert.deepEqual(s,before);s.level=20;s.upgrades=['fridge'];s.upgradeQty={fridge:1};s.equipped={fridge:'fridge'};assert.equal(E.buyPrice(s,'pork'),117);const cash=s.money;E.buy(s,'pork');assert.equal(s.money,cash-117);for(const id of ['nope','__proto__','constructor']){assert.equal(E.buy(s,id),false);assert.equal(E.upgrade(s,id),false);assert.equal(E.unlock(s,id),false);}
});

test('save resumes in-progress recipe, served meal, pending payment and paid goodbye without double rewards',()=>{
 const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);E.selectIngredient(s,'rice');E.selectIngredient(s,'nori');E.prepareIngredients(s);E.completeCookingStep(s,1);let v=E.restore(JSON.stringify(s));assert.equal(v.kitchen.step,1);assert.deepEqual(v.kitchen.selected,['rice','nori']);while(v.kitchen.stage!=='complete')E.completeCookingStep(v,1);E.deliver(v);v.guests[0].eatMs=2500;v=E.restore(JSON.stringify(v));assert.equal(v.guests[0].status,'eating');assert.equal(v.guests[0].eatMs,2500);assert.equal(v.money,3200);E.finishEating(v,g.id);v=E.restore(JSON.stringify(v));const bill=E.collect(v,g.id);v=E.restore(JSON.stringify(v));assert.equal(v.money,3200+bill.total);assert.equal(E.collect(v,g.id),null);assert.equal(v.guests[0].status,'farewell');
});
test('v5 duplicate unaccepted orders become unique without losing money or furniture',()=>{
 const s=E.fresh();E.open(s);E.arrive(s);E.arrive(s);E.arrive(s);s.version=5;s.upgrades=['plants'];s.guests.forEach(g=>{g.status='waiting';g.recipe='onigiri'});s.nightOrders=['onigiri','onigiri','onigiri'];const v=E.restore(JSON.stringify(s));assert.equal(v.version,11);assert.equal(new Set(v.guests.map(g=>g.recipe)).size,3);assert.ok(v.guests.every(g=>g.status==='seated'));assert.equal(v.money,s.money);assert.deepEqual(v.upgrades,['plants']);assert.ok(E.restore(JSON.stringify(v)));
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
 for(const version of [2,3,4]){const{s,g}=setup();g.status='waiting';s.version=version;s.upgrades=['plants'];if(version===2){delete s.customerBook;delete s.level;delete s.xp;delete s.satisfactionTotal;delete s.nightStart;s.target=3;}if(version===3){g.id=7;s.arrived=7;delete s.nextVisitor;delete s.nightVisitors;}const v=E.restore(JSON.stringify(s));assert.equal(v.version,11);assert.equal(v.money,s.money);assert.deepEqual(v.upgrades,['plants']);assert.ok(E.restore(JSON.stringify(v)));}
});
test('all 100 recipes can be cooked, restored, served and collected at their advertised level',()=>{
 for(const[id,r]of Object.entries(E.recipes)){const s=E.fresh();s.level=r.level;s.money=100000;E.progress(s);E.open(s);const g=E.arrive(s);g.recipe=id;s.nightOrders[0]=id;E.acceptOrder(s,g.id);E.beginCooking(s,g.id);stock(s,r);for(const id of r.ingredients)E.selectIngredient(s,id);assert.ok(E.prepareIngredients(s));for(const st of E.Cooking.plan(id,r))E.completeCookingStep(s,1);const restored=E.restore(JSON.stringify(s)),before=restored.money,result=E.deliver(restored);assert.equal(result.score,100,r.name);assert.equal(restored.money,before);E.finishEating(restored,g.id);assert.equal(E.collect(restored,g.id).total,result.total);assert.equal(restored.money,before+result.total);assert.ok(E.restore(JSON.stringify(restored)));}
});
test('v6 active cooking restarts the new sequence while retaining money, inventory and selected ingredients',()=>{
 const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);E.selectIngredient(s,'rice');E.selectIngredient(s,'nori');E.prepareIngredients(s);s.kitchen.step=5;s.kitchen.marks=[1,1,1,1,1];s.version=6;s.kitchen.selected.push('pork');const v=E.restore(JSON.stringify(s));assert.equal(v.version,11);assert.equal(v.kitchen.step,0);assert.equal(v.kitchen.stage,'room');assert.deepEqual(v.kitchen.selected,['rice','nori']);assert.deepEqual(v.inventory,s.inventory);assert.equal(v.money,s.money);assert.equal(v.guests[0].status,'waiting');
});
test('prep is one selected ingredient per step; sauces are measured and vegetables unpack separately',()=>{
 const steps=E.Cooking.plan('tonjiru',E.recipes.tonjiru).filter(st=>st.id==='prep');assert.deepEqual(steps.map(st=>[st.ingredient,st.mode]),[['pork','cut'],['miso','measure'],['dashi','measure']]);assert.ok(!steps.some(st=>st.part==='radish'));
 for(const[id,r]of Object.entries(E.recipes)){const preps=E.Cooking.plan(id,r).filter(st=>st.id==='prep');assert.ok(preps.every(st=>r.ingredients.includes(st.ingredient)),id);assert.equal(new Set(preps.map(st=>st.part)).size,preps.length,id);for(const ing of r.ingredients)assert.ok(preps.some(st=>st.ingredient===ing));}
 const veg=E.Cooking.preparations(E.recipes.negi_omelette);assert.deepEqual(veg.filter(st=>st.ingredient==='vegetables').map(st=>st.part),['vegetables','scallion']);
});
test('kitchen only accepts ingredients from that order and remembers the stove lesson',()=>{
 const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);assert.equal(E.selectIngredient(s,'pork'),false);E.selectIngredient(s,'rice');E.selectIngredient(s,'nori');assert.ok(E.readyIngredients(s));s.kitchen.selected.push('pork');assert.equal(E.readyIngredients(s),false);s.kitchen.selected.pop();s.stoveTutorialDone=true;assert.equal(E.restore(JSON.stringify(s)).stoveTutorialDone,true);
});

test('stock forecast is pure and bulk replenishment is atomic, bounded and level gated',()=>{const s=E.fresh();for(const id in s.inventory)s.inventory[id]=0;const before=structuredClone(s),plan=E.stockPlan(s,9);assert.deepEqual(s,before);assert.equal(plan.meals,9);assert.equal(plan.lines.find(x=>x.id==='rice').target,3);assert.equal(plan.lines.find(x=>x.id==='dashi').target,6);assert.ok(plan.lines.every(x=>E.ingredientAvailable(s,x.id)));s.money=plan.cost-1;const poor=structuredClone(s);assert.equal(E.restock(s,9),false);assert.deepEqual(s,poor);s.money=plan.cost;assert.equal(E.restock(s,9).cost,plan.cost);assert.equal(s.money,0);assert.equal(E.stockPlan(s,9).units,0);assert.equal(E.restock(s,9),false);assert.equal(s.inventory.salmon,0);assert.equal(E.stockPlan(s,4),null);assert.equal(E.restock(s,4),false);});

test('one stocked night covers all nine actual orders, including level gains during service',()=>{const s=E.fresh();for(const id in s.inventory)s.inventory[id]=0;s.money=100000;const plan=E.restock(s,9);assert.ok(plan);E.open(s);const dishes=[];for(let wave=0;wave<3;wave++){const guests=Array.from({length:3},()=>E.arrive(s));for(const g of guests){dishes.push(g.recipe);for(const id of E.recipes[g.recipe].ingredients)assert.ok(s.inventory[id]>0,id);cook(s,g);pay(s,g);}}assert.deepEqual(dishes,plan.orders);assert.ok(s.level>1);assert.ok(Object.values(s.inventory).every(n=>n===0));});

test('fridge upgrade discounts a bulk purchase exactly like individual purchases',()=>{const s=E.fresh();for(const id in s.inventory)s.inventory[id]=0;const standard=E.stockPlan(s);s.upgrades=['fridge'];const discounted=E.stockPlan(s);assert.ok(discounted.cost<standard.cost);for(const line of discounted.lines)assert.equal(line.price,E.buyPrice(s,line.id));});

test('all rice dishes start with portioning after ingredient preparation; raw dishes and stir-fried noodles use sensible sequences',()=>{for(const[id,r]of Object.entries(E.recipes)){const work=E.Cooking.plan(id,r).filter(x=>x.id!=='prep');if(r.ingredients.includes('rice'))assert.deepEqual(work.slice(0,1).map(x=>x.id),['portion'],id);}for(const id of ['shio_onigiri','tamagokake','chirashi','premium_sushi'])assert.ok(!E.Cooking.plan(id,E.recipes[id]).some(x=>x.id==='heat'),id);assert.ok(!E.Cooking.plan('yakisoba',E.recipes.yakisoba).some(x=>x.id==='drain'));assert.ok(!E.Cooking.plan('sukiyaki',E.recipes.sukiyaki).find(x=>x.id==='broth').action.includes('다시'));});

test('v8 cooking migrates safely and retrains the interactive stove lesson',()=>{const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);E.selectIngredient(s,'rice');E.selectIngredient(s,'nori');E.prepareIngredients(s);E.completeCookingStep(s,1);s.version=8;s.stoveTutorialDone=true;const v=E.restore(JSON.stringify(s));assert.equal(v.version,11);assert.equal(v.stoveTutorialDone,false);assert.equal(v.kitchen.step,0);assert.equal(v.kitchen.stage,'room');assert.equal(v.money,s.money);assert.deepEqual(v.inventory,s.inventory);assert.deepEqual(v.kitchen.selected,s.kitchen.selected);});

test('practice grading shares the real heat quality curve',()=>{const s=E.fresh(),spec=E.cookSpec(s,'onigiri');assert.equal(E.heatQuality(s,'onigiri',spec.ideal),1);assert.equal(E.heatQuality(s,'onigiri',0),0);assert.equal(E.heatQuality(s,'onigiri',1),0);});

test('batch ingredient buying is atomic, level gated, capped and discounted',()=>{const s=E.fresh(),before=structuredClone(s);for(const q of [0,-1,1.5,NaN,1000,'3']){assert.equal(E.buy(s,'rice',q),false);assert.deepEqual(s,before);}assert.equal(E.buy(s,'salmon',3),false);const stock=s.inventory.rice,cash=s.money;assert.ok(E.buy(s,'rice',3));assert.equal(s.inventory.rice,stock+3);assert.equal(s.money,cash-E.buyPrice(s,'rice')*3);s.inventory.rice=998;const cap=structuredClone(s);assert.equal(E.buy(s,'rice',2),false);assert.deepEqual(s,cap);s.inventory.rice=0;s.upgrades=['fridge'];s.money=1;const poor=structuredClone(s);assert.equal(E.buy(s,'rice',3),false);assert.deepEqual(s,poor);s.money=10000;const price=E.buyPrice(s,'rice');assert.ok(E.buy(s,'rice',5));assert.equal(s.money,10000-price*5);});
test('cosmetic payments cannot be replaced with game funds and never gate growth',()=>{const s=E.fresh();s.money=100000;s.xp=2000;E.progress(s);assert.equal(s.level,3);assert.equal(E.renovate(s,'inside',1),false);assert.equal(E.renovate(s,'outside',1),false);assert.equal(s.money,100000);assert.equal(E.atmosphere(s),0);assert.deepEqual(E.growthBenefits(s),{tips:0,operatingDiscount:0});});

test('preparation plan choice survives reload and resets for the next night',()=>{const s=E.fresh();for(const id in s.inventory)s.inventory[id]=0;assert.ok(E.restock(s,3));assert.equal(s.prepChoice,3);const v=E.restore(JSON.stringify(s));assert.equal(v.prepChoice,3);assert.equal(E.stockPlan(v,3).units,0);assert.ok(E.stockPlan(v,9).units>0);v.phase='end';assert.ok(E.next(v));assert.equal(v.prepChoice,null);});
test('current-night reviews come from collected bills once and report the last four',()=>{const s=E.fresh();fullNight(s);assert.equal(s.nightReviews.length,9);const r=E.report(s);assert.equal(r.reviews.length,4);assert.deepEqual(r.reviews,s.nightReviews.slice(-4));assert.ok(r.reviews.every(x=>x.score===100&&x.person!==null&&x.dish));assert.ok(new Set(r.reviews.map(x=>x.text)).size>=3);assert.equal(E.collect(s,9),null);assert.equal(s.nightReviews.length,9);assert.deepEqual(E.restore(JSON.stringify(s)).nightReviews,s.nightReviews);assert.ok(E.reviewText({score:50,heat:40,waitPenalty:0}).includes('익'));});
test('v9 active cooking keeps steps and completed tutorial when imported into v11',()=>{const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);E.selectIngredient(s,'rice');E.selectIngredient(s,'nori');E.prepareIngredients(s);E.completeCookingStep(s,1);s.version=9;s.stoveTutorialDone=true;delete s.nightReviews;delete s.nightPurchases;delete s.prepChoice;const v=E.restore(JSON.stringify(s));assert.equal(v.version,11);assert.deepEqual(v.kitchen,s.kitchen);assert.equal(v.stoveTutorialDone,true);assert.equal(v.money,s.money);});
test('night ledger charges ingredients while blocked cosmetic checkout cannot debit game funds',()=>{const s=E.fresh();E.open(s);const start=s.money;assert.ok(E.buy(s,'rice',3));assert.equal(E.renovate(s,'outside',1),false);const spent=3*E.buyPrice(s,'rice'),r=E.report(s);assert.equal(r.purchases,spent);assert.equal(r.net,-spent);assert.equal(s.money,start-spent);assert.equal(r.atmosphereDelta,0);assert.equal(E.restore(JSON.stringify(s)).nightPurchases,spent);});

test('legacy sixty-item catalogue remains readable but cannot accept new purchases',()=>{assert.equal(Object.keys(E.upgrades).length,60);assert.equal(Object.keys(E.F.slots).length,15);const s=E.fresh();s.money=100000;const before=structuredClone(s);for(const q of [0,-1,1,2,1.5,4,NaN])assert.equal(E.upgrade(s,'lantern',q),false);assert.deepEqual(s,before);});

test('previously owned variants retain their ownership and equipped benefit without placement',()=>{const s=E.fresh();s.level=34;s.upgrades=['ceramics','ceramics_1'];s.upgradeQty={ceramics:1,ceramics_1:1};s.equipped={ceramics:'ceramics_1'};delete s.renovation;const migrated=E.restore(JSON.stringify(s));assert.deepEqual(migrated.upgrades,s.upgrades);assert.equal(E.F.activeId(migrated,'ceramics'),'ceramics_1');assert.equal(E.equip(migrated,'ceramics'),false);assert.equal(E.F.benefits(migrated).tips,3);assert.ok(E.atmosphere(migrated)>=E.upgrades.ceramics_1.atmosphere);});

test('existing five- and ten-piece sets retain real capped tip bonuses',()=>{const s=E.fresh();s.level=34;const ids=Object.keys(E.upgrades).filter(id=>E.upgrades[id].theme===2);s.upgrades=ids.slice(0,5);assert.equal(E.F.benefits(s).sets[0].bonus,3);s.upgrades=ids.slice(0,10);assert.equal(E.F.benefits(s).sets[0].bonus,6);assert.ok(E.F.benefits(s).tips<=30);const before=s.money;assert.equal(E.upgrade(s,ids[1]),false);assert.equal(s.money,before);});

test('furnishing benefits alter tips, waiting grace and fridge prices at actual checkout',()=>{const make=upgrades=>{const{s,g}=setup();s.upgrades=upgrades;s.level=34;g.waitMs=65000;E.acceptOrder(s,g.id);const result=E.serve(s,g.id,E.recipes[g.recipe].ingredients,E.cookSpec(s,g.recipe).ideal);return{s,result}};const plain=make([]),decorated=make(['noren_3','bonsai_3','bench_3','andon_3','ceramics_3','ikebana_3']);assert.ok(decorated.result.waitPenalty<plain.result.waitPenalty);assert.ok(decorated.result.tip>plain.result.tip);const s=E.fresh();s.level=34;s.money=100000;s.upgrades=['fridge_3'];assert.equal(E.buyPrice(s,'pork'),Math.round(E.ingredients.pork.price*.84));});
test('v10 imported progress retains money, purchases, and in-progress steps without another reset',()=>{const{s,g}=setup();s.upgrades=['lantern'];s.upgradeQty={lantern:1};s.equipped={lantern:'lantern'};delete s.renovation;E.acceptOrder(s,g.id);E.beginCooking(s,g.id);for(const id of E.recipes[g.recipe].ingredients)E.selectIngredient(s,id);E.prepareIngredients(s);E.completeCookingStep(s,1);s.version=10;delete s.upgradeQty;delete s.equipped;const v=E.restore(JSON.stringify(s));assert.equal(v.version,11);assert.equal(v.money,s.money);assert.deepEqual(v.kitchen,s.kitchen);assert.equal(E.F.count(v,'lantern'),1);assert.equal(E.F.activeId(v,'lantern'),'lantern');});
test('under, correct and excessive heat stay visually distinct through delivery, payment and reload',()=>{for(const [value,look]of [[0,'raw'],[1,'burnt']]){const{s,g}=setup();E.acceptOrder(s,g.id);E.beginCooking(s,g.id);for(const id of E.recipes[g.recipe].ingredients)E.selectIngredient(s,id);E.prepareIngredients(s);for(const step of E.Cooking.plan(g.recipe,E.recipes[g.recipe]))E.completeCookingStep(s,step.id==='heat'?E.heatQuality(s,g.recipe,value):1,step.id==='heat'?{heat:value}:undefined);assert.equal(E.kitchenLook(s),look);const restored=E.restore(JSON.stringify(s));assert.equal(restored.kitchen.heatValue,value);const bill=E.deliver(restored);assert.equal(bill.appearance,look);assert.equal(bill.heatValue,value);E.finishEating(restored,g.id);const paid=E.collect(restored,g.id);assert.equal(paid.appearance,look);assert.equal(E.restore(JSON.stringify(restored)).guests[0].bill.appearance,look);}});

test('every heat method selects food-appropriate boiling or frying foley, with no heat for cold food',()=>{for(const[id,r]of Object.entries(E.recipes)){const heat=E.Cooking.plan(id,r).some(st=>st.id==='heat'),mode=E.Cooking.heatMode(id,r);assert.equal(mode==='none',!heat,id);if(/chazuke|curry|kamameshi/.test(id)||['soup','noodle'].includes(E.Cooking.family(id,r)))assert.equal(mode,'boil',id);}for(const id of ['onigiri','tamago','friedrice','shrimp_chahan'])assert.equal(E.Cooking.heatMode(id,E.recipes[id]),'sizzle');});

test('new cooking images stay inside the approved Lv.1–5 fifteen-dish boundary',()=>{assert.deepEqual(E.Cooking.imagePilot,['onigiri','tamago','tonjiru','ochazuke','negi_omelette','hiyayakko','butadon','misoshiru','cabbage_stir','salmonbowl','potato_soup','salmon_teriyaki','midnight','soba','udon']);assert.equal(E.Cooking.imagePilot.includes('butadon'),true);assert.equal(E.Cooking.imagePilot.includes('oden'),false);assert.ok(Object.isFrozen(E.Cooking.imagePilot));});

test('guest background is learned through dialogue while the name is visible from arrival',()=>{
 const {s,g}=setup(),before=structuredClone(s);
 assert.deepEqual(E.guestProfile(s,g.person),{known:[],name:E.person(g.person).name,role:null,age:null,style:null,bio:null});
 const hello=E.guestConversation(s,g.id);assert.equal(hello.node,'hello');assert.equal(hello.orderReady,false);assert.deepEqual(s,before);
 assert.equal(E.answerGuest(s,g.id,'about'),false);assert.deepEqual(s,before);
 assert.equal(E.answerGuest(s,g.id,'welcome'),true);assert.equal(E.guestProfile(s,g.person).name,E.person(g.person).name);assert.equal(E.guestProfile(s,g.person).role,null);assert.equal(E.guestProfile(s,g.person).age,null);assert.ok(E.guestProfile(s,g.person).style);
 assert.equal(E.answerGuest(s,g.id,'day'),true);assert.equal(E.guestProfile(s,g.person).role,E.person(g.person).role);assert.equal(E.guestProfile(s,g.person).age,null);assert.ok(E.guestConversation(s,g.id).line.includes('원고'));
 assert.deepEqual(E.guestConversation(s,g.id).choices.map(x=>x.id),['warm','quiet','order']);
 assert.equal(E.answerGuest(s,g.id,'warm'),true);const warm=E.guestConversation(s,g.id).line;assert.match(E.guestConversation(s,g.id).playerLine,/원고/);assert.ok(warm.includes(E.recipes[g.recipe].name));
 assert.equal(E.answerGuest(s,g.id,'about'),true);assert.equal(E.guestProfile(s,g.person).age,E.person(g.person).age);assert.match(E.guestConversation(s,g.id).line,/세예요/);
 assert.equal(E.answerGuest(s,g.id,'order'),true);assert.equal(E.guestConversation(s,g.id).orderReady,true);assert.match(E.guestConversation(s,g.id).line,new RegExp(E.recipes[g.recipe].name));
 assert.equal(s.money,before.money);assert.equal(s.xp,before.xp);assert.equal(s.totalServed,0);assert.equal(g.status,'seated');
 const alt=setup();for(const reply of ['welcome','day','quiet'])assert.ok(E.answerGuest(alt.s,alt.g.id,reply));assert.notEqual(E.guestConversation(alt.s,alt.g.id).line,warm);
});
test('short guest dialogue accepts the same unique order without forcing personal questions',()=>{
 const {s,g}=setup();const recipe=g.recipe;for(const reply of ['welcome','menu'])assert.ok(E.answerGuest(s,g.id,reply));
 assert.equal(E.guestConversation(s,g.id).orderReady,true);assert.equal(E.guestProfile(s,g.person).role,null);assert.equal(g.recipe,recipe);assert.ok(E.acceptOrder(s,g.id));assert.ok(E.beginCooking(s,g.id));
 assert.equal(E.answerGuest(s,g.id,'more'),false);assert.equal(g.recipe,recipe); // accepted orders cannot be re-opened into optional chat
 assert.equal(s.kitchen.guest,g.id);assert.equal(s.kitchen.stage,'room');
 const gs=[g,E.arrive(s),E.arrive(s)];assert.equal(new Set(gs.map(x=>x.recipe)).size,3);
});
test('conversation choices and learned facts survive reload and another visit without leaking other guests',()=>{
 const {s,g}=setup();for(const reply of ['welcome','day','quiet'])assert.ok(E.answerGuest(s,g.id,reply));const funds=s.money,inventory=structuredClone(s.inventory);
 const loaded=E.restore(JSON.stringify(s));assert.equal(E.guestConversation(loaded,g.id).node,'quiet');assert.deepEqual(E.guestProfile(loaded,g.person),E.guestProfile(s,g.person));assert.equal(loaded.money,funds);assert.deepEqual(loaded.inventory,inventory);
 assert.ok(E.answerGuest(loaded,g.id,'order'));cook(loaded,loaded.guests[0]);pay(loaded,loaded.guests[0]);
 const known=E.guestProfile(loaded,g.person);loaded.night++;loaded.guests=[];loaded.arrived=0;loaded.nextVisitor=g.person;loaded.nightVisitors=[];loaded.nightOrders=[];loaded.customerBook[g.person].lastScore=0;
 const revisit=E.arrive(loaded);assert.equal(revisit.person,g.person);assert.equal(E.guestConversation(loaded,revisit.id).node,'hello');assert.deepEqual(E.guestProfile(loaded,g.person),known);assert.match(E.guestConversation(loaded,revisit.id).line,/또 들렀어요/);
 const stranger=E.arrive(loaded);assert.deepEqual(E.guestProfile(loaded,stranger.person).known,[]);
});
test('optional dialogue migration preserves old v11 finances, inventory and active cooking without inventing facts',()=>{
 const {s,g}=setup();s.money=12345;E.acceptOrder(s,g.id);E.beginCooking(s,g.id);delete s.customerBook[g.person].known;
 const loaded=E.restore(JSON.stringify(s));assert.equal(loaded.version,11);assert.equal(loaded.money,12345);assert.deepEqual(loaded.kitchen,s.kitchen);assert.deepEqual(loaded.inventory,s.inventory);assert.equal(loaded.guests[0].status,'waiting');assert.deepEqual(E.guestProfile(loaded,g.person).known,[]);
 loaded.customerBook[g.person].known=['name','name','bankAccount'];loaded.guests[0].chat={node:'invalid',reply:'<script>'};const sanitized=E.restore(JSON.stringify(loaded));assert.equal(sanitized.money,12345);assert.deepEqual(sanitized.customerBook[g.person].known,['name']);assert.equal(sanitized.guests[0].chat,undefined);
});
test('night clock progress survives v11 reload, safely defaults for older saves, and resets at opening',()=>{
 const s=E.fresh();assert.equal(s.nightElapsedMs,0);s.nightElapsedMs=123456;let loaded=E.restore(JSON.stringify(s));assert.equal(loaded.nightElapsedMs,123456);assert.ok(E.open(loaded));assert.equal(loaded.nightElapsedMs,0);
 const raw=JSON.parse(JSON.stringify(loaded));delete raw.nightElapsedMs;assert.equal(E.restore(JSON.stringify(raw)).nightElapsedMs,0);raw.nightElapsedMs=-100;assert.equal(E.restore(JSON.stringify(raw)).nightElapsedMs,0);
});
test('ordering finishes personal chat without offering another pre-meal conversation',()=>{
 const {s,g}=setup();for(const id of ['welcome','menu'])assert.ok(E.answerGuest(s,g.id,id));assert.deepEqual(E.guestConversation(s,g.id).choices,[]);assert.equal(E.answerGuest(s,g.id,'more'),false);
});
test('early prep keeps canonical source keys for scoped portrait routing',()=>{
 assert.deepEqual(E.Cooking.imagePilot,['onigiri','tamago','tonjiru','ochazuke','negi_omelette','hiyayakko','butadon','misoshiru','cabbage_stir','salmonbowl','potato_soup','salmon_teriyaki','midnight','soba','udon']);
 assert.equal(E.Cooking.prepImage('negi_omelette','scallion'),'prep-hi-scallion');assert.equal(E.Cooking.prepImage('hiyayakko','vegetables'),'prep-hi-vegetables');assert.equal(E.Cooking.prepImage('butadon','scallion'),'prep-hi-scallion');assert.equal(E.Cooking.prepImage('onigiri','rice'),'prep-hi-rice');
});
test('completed stories stop attention and read news stays read after reload',()=>{
 const {s}=setup();E.arrive(s);assert.ok(E.conversation(s));assert.equal(E.storyNeedsAttention(s),false,'a guest will tell tonight\'s story: the sheet stays quiet');
 // Once no seated guest can still tell it, the story sheet takes the decision over.
 s.guests.forEach(g=>g.chat={node:'order'});assert.ok(E.storyNeedsAttention(s));E.markStoryRead(s);assert.ok(E.storyNeedsAttention(s),'an outstanding decision still needs attention');
 const view=E.story(s),choice=view.definition.choices.find(c=>E.canChoose(s,c));assert.ok(E.resolveEvent(s,choice.id));assert.ok(E.resolveEvent(s,E.storyContent.reflection[0].id));assert.equal(E.storyNeedsAttention(s),false);
 const st=E.storyContent.stories.find(x=>x.choices.some(c=>c.future)),c=st.choices.find(x=>x.future);s.nightNews=[{id:st.id,choice:c.id,night:s.night}];assert.ok(E.storyNeedsAttention(s));E.markStoryRead(s);assert.equal(E.storyNeedsAttention(s),false);assert.equal(E.storyNeedsAttention(E.restore(JSON.stringify(s))),false);
 const old=JSON.parse(JSON.stringify(s));delete old.nightNewsRead;assert.equal(E.storyNeedsAttention(E.restore(JSON.stringify(old))),false,'old completed stories do not light again');
});
test('conversation preferences name the actual dish and preserve balanced unlocked menu variety',()=>{
 for(const level of [1,2,3,20,34]){const s=E.fresh();s.level=level;s.money=100000;E.progress(s);E.open(s);const menu=[...s.unlocked],orders=[];
  for(let wave=0;wave<3;wave++){const guests=Array.from({length:3},()=>E.arrive(s));for(const [i,g]of guests.entries()){const assigned=g.recipe;for(const reply of ['welcome','day',i%2?'quiet':'warm'])assert.ok(E.answerGuest(s,g.id,reply));assert.equal(g.recipe,assigned);assert.ok(E.guestConversation(s,g.id).line.includes(E.recipes[assigned].name));assert.ok(E.answerGuest(s,g.id,'order'));assert.ok(E.guestConversation(s,g.id).line.includes(E.recipes[assigned].name));orders.push(assigned);cook(s,g);pay(s,g)}}
  assert.equal(new Set(orders).size,Math.min(9,menu.length));const counts=menu.map(id=>orders.filter(x=>x===id).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
 }
});
test('wave orders become ready at arrival, eight seconds and fifteen seconds of active play',()=>{
 const {s,g}=setup(),second=E.arrive(s),third=E.arrive(s);assert.equal(E.menuReady(s,g),true);assert.equal(E.menuReady(s,second),false);assert.equal(E.menuReady(s,third),false);
 s.nightElapsedMs=7999;assert.equal(E.menuReady(s,second),false);s.nightElapsedMs=8000;assert.equal(E.menuReady(s,second),true);assert.equal(E.menuReady(s,third),false);
 const restored=E.restore(JSON.stringify(s));assert.equal(E.menuReady(restored,restored.guests[2]),false);assert.equal(restored.guests[2].menuReadyAt,15000);restored.nightElapsedMs=15000;assert.equal(E.menuReady(restored,restored.guests[2]),true);
 const legacy=structuredClone(s);delete legacy.guests[2].menuReadyAt;assert.equal(E.menuReady(E.restore(JSON.stringify(legacy)),legacy.guests[2]),true);
 assert.ok(E.answerGuest(s,third.id,'welcome'));assert.ok(E.answerGuest(s,third.id,'menu'));assert.equal(E.menuReady(s,third),true,'asking for the order lets the guest decide without blocking conversation');
});
test('rice recipes skip the lid and migrate active old steps, quality and completed plates without reset',()=>{
 for(const [id,r]of Object.entries(E.recipes))assert.equal(E.Cooking.plan(id,r).some(st=>st.id==='lid'),false,id);
 for(const id of ['onigiri','ochazuke','butadon']){for(const offset of [0,1,2,99]){const s=E.fresh();s.level=34;s.money=100000;E.progress(s);E.open(s);const g=E.arrive(s);g.recipe=id;s.nightOrders[0]=id;E.acceptOrder(s,g.id);E.beginCooking(s,g.id);const old=E.Cooking.plan(id,E.recipes[id],true),lid=old.findIndex(st=>st.id==='lid'),step=Math.min(old.length,lid+offset);assert.ok(lid>=0);s.kitchen={guest:g.id,stage:step===old.length?'complete':'process',selected:[...E.recipes[id].ingredients],step,marks:Array.from({length:step},(_,i)=>.8+i*.001),heatValue:.68};const before=structuredClone(s),v=E.restore(JSON.stringify(s)),shift=step>lid?1:0;assert.equal(v.kitchen.step,step-shift);assert.deepEqual(v.kitchen.marks,before.kitchen.marks.filter((_,i)=>i!==lid));assert.equal(v.kitchen.heatValue,.68);assert.equal(v.money,before.money);assert.deepEqual(v.inventory,before.inventory);assert.equal(v.kitchen.stage,before.kitchen.stage);assert.equal(v.kitchen.sequenceVersion,2);assert.deepEqual(E.restore(JSON.stringify(v)).kitchen,v.kitchen,'migration happens once');}}
});


test('orders rotate through every unlocked dish across nights and reloads before repeating',()=>{
 for(const level of [1,5,20,34]){
  let s=E.fresh();s.level=level;E.progress(s);const size=s.unlocked.length,orders=[];
  while(orders.length<size*2){
   if(s.phase!=='open'||s.arrived===9){s.phase='prep';s.night++;E.open(s);}
   const before=structuredClone(s),forecast=E.stockPlan(s,3);assert.deepEqual(s,before);
   for(let i=0;i<3&&orders.length<size*2;i++){
    const g=E.arrive(s);assert.ok(g);assert.equal(g.recipe,forecast.orders[i]);orders.push(g.recipe);g.status='left';
    s=E.restore(JSON.stringify(s));
   }
  }
  assert.equal(new Set(orders.slice(0,size)).size,size);
  assert.equal(new Set(orders.slice(size,size*2)).size,size);
  assert.equal(s.menuRotation.length,size);
 }
});
test('newly unlocked dishes precede repeat orders and old saves inherit their recent rotation',()=>{
 const original=E.fresh();original.recentOrders=['tamago','onigiri','tamago','tonjiru'];delete original.menuRotation;
 let s=E.restore(JSON.stringify(original));assert.deepEqual(s.menuRotation,['onigiri','tamago','tonjiru']);
 s.level=2;E.progress(s);const newly=s.unlocked.filter(id=>E.recipes[id].level===2);E.open(s);
 const orders=Array.from({length:3},()=>E.arrive(s).recipe);assert.deepEqual(new Set(orders),new Set(newly));
});

test('every guest receives replies to their own day, can order directly, and can rest without more questions',()=>{
 const days=new Set(),responses=new Set();
 for(let person=0;person<E.people.length*2;person++){
  for(const reply of ['warm','quiet','order']){
   const s=E.fresh();E.open(s);s.nextVisitor=person;const g=E.arrive(s);assert.equal(g.person,person);
   for(const id of ['welcome','day'])assert.ok(E.answerGuest(s,g.id,id));
   const before=structuredClone(s),day=E.guestConversation(s,g.id);
   assert.deepEqual(s,before,'reading does not mutate a save');
   assert.doesNotMatch(day.line,/주인장님은 지친 날|어떤 한 끼가 생각/);
   assert.deepEqual(day.choices.map(c=>c.id),['warm','quiet','order']);
   if(reply==='warm')days.add(day.choices[0].label);
   const chosen=day.choices.find(c=>c.id===reply).label;
   assert.ok(E.answerGuest(s,g.id,reply));const view=E.guestConversation(s,g.id);
   assert.equal(view.playerLine,chosen);assert.ok(view.line.includes(E.recipes[g.recipe].name));
   if(reply==='warm')responses.add(view.line.split('\n')[0]);
   if(reply==='quiet'||person%E.people.length===16)assert.deepEqual(view.choices.map(c=>c.id),reply==='order'?[]:['order']);
   assert.equal(s.money,before.money);assert.equal(s.xp,before.xp);assert.deepEqual(s.inventory,before.inventory);assert.equal(g.recipe,before.guests[0].recipe);
   const loaded=E.restore(JSON.stringify(s));assert.deepEqual(E.guestConversation(loaded,g.id),view);
   if(reply!=='order')assert.ok(E.answerGuest(loaded,g.id,'order'));
   assert.ok(E.acceptOrder(loaded,g.id));
  }
 }
 assert.equal(days.size,E.people.length);assert.equal(responses.size,E.people.length);
});
