const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../docs/engine.js');
const setup = () => { const s = E.fresh(); E.open(s); const guest = E.arrive(s); return { s, guest }; };

function fullNight(s) {
  E.open(s);
  for(let i=0;i<9;i++) {
    if(i>=3) s.guests[0].status='left';
    const g=E.arrive(s); assert.ok(g);
    E.recipes[g.recipe].ingredients.forEach(id=>{if(!s.inventory[id]) E.buy(s,id)});
    const r=E.serve(s,g.id,E.recipes[g.recipe].ingredients,E.cookSpec(s,g.recipe).ideal);assert.equal(r.score,100);
    if(i<8)assert.equal(E.canClose(s),false);
    if(i>=2)s.guests.forEach(g=>g.status='left');
  }
}
test('nine meals form three cycles, then a report records gains and unlocks',()=>{
  const s=E.fresh();assert.equal(E.close(s),false);fullNight(s);
  assert.equal(s.target,9);assert.equal(s.totalServed,9);assert.equal(E.canClose(s),true);
  assert.equal(E.arrive(s),null);assert.equal(E.close(s),true);
  const r=E.report(s);assert.equal(r.xp,900);assert.equal(r.xpDelta,900);assert.equal(r.satisfaction,100);
  assert.equal(r.reputationDelta,36);assert.equal(r.level,2);assert.ok(r.menus.includes('연어 오차즈케'));
  assert.ok(r.items.includes('쪽빛 노렌'));assert.equal(r.net,s.money-3200);assert.equal(r.remaining,600);
  assert.equal(E.close(s),false);E.next(s);E.open(s);assert.equal(s.night,2);assert.equal(s.target,9);assert.equal(s.nightRevenue,0);
});
test('ingredient correctness and heat both change satisfaction, tips and reputation', () => {
  const best = setup(), cold = setup(), wrong = setup();
  const high = E.serve(best.s, 1, ['rice', 'nori'], 0.65);
  const low = E.serve(cold.s, 1, ['rice', 'nori'], 0);
  const bad = E.serve(wrong.s, 1, ['egg'], 0.65);
  assert.ok(high.score > low.score && low.score > bad.score);
  assert.ok(high.tip > low.tip); assert.equal(low.tip, 0);
  assert.ok(best.s.reputation > cold.s.reputation);
});
test('serving is atomic: one portion once, no negative stock or duplicated reward', () => {
  const {s} = setup(), original = structuredClone(s);
  assert.equal(E.serve(s, 1, ['salmon'], 0.65), null);
  assert.equal(E.serve(s, 1, ['rice', 'rice'], 0.65), null);
  assert.equal(E.serve(s, 1, ['rice'], NaN), null);
  assert.deepEqual(s, original);
  E.serve(s, 1, ['rice','nori'], 0.65);
  assert.equal(s.inventory.rice, 4); assert.equal(s.inventory.nori, 4);
  const after = structuredClone(s);
  assert.equal(E.serve(s, 1, ['rice', 'nori'], 0.65), null); assert.deepEqual(s, after);
});
test('money alone cannot bypass levels and purchases charge exactly once',()=>{
  const s=E.fresh();s.money=100000;
  assert.equal(E.unlock(s,'ochazuke'),false);assert.equal(E.upgrade(s,'noren'),false);assert.equal(s.money,100000);
  s.xp=900;s.reputation=40;s.totalServed=9;s.satisfactionTotal=630;E.progress(s);assert.equal(s.level,2);
  assert.ok(s.unlocked.includes('ochazuke'));assert.equal(s.unlocked.length,6);assert.equal(s.money,100000);assert.equal(E.unlock(s,'ochazuke'),false);
  assert.equal(E.upgrade(s,'lantern'),true);assert.equal(s.money,99000);assert.equal(E.upgrade(s,'lantern'),false);
  assert.equal(E.upgrade(s,'noren'),true);assert.equal(E.upgrade(s,'bonsai'),false);
  for(const id of ['nope','__proto__','constructor']){assert.equal(E.buy(s,id),false);assert.equal(E.unlock(s,id),false);assert.equal(E.upgrade(s,id),false)}
});
test('level gates require reputation AND satisfaction as well as growth points',()=>{
  const s=E.fresh();s.xp=6000;s.totalServed=10;s.satisfactionTotal=1000;E.progress(s);assert.equal(s.level,1);
  s.reputation=100;s.satisfactionTotal=600;E.progress(s);assert.equal(s.level,1);
  s.satisfactionTotal=700;E.progress(s);assert.equal(s.level,3);
  s.satisfactionTotal=900;E.progress(s);assert.equal(s.level,5);
  s.reputation=0;E.progress(s);assert.equal(s.level,5,'earned levels stay unlocked');
});
test('orders rotate through all available meals without a recommendation dominating',()=>{
 const s=E.fresh();s.level=3;E.progress(s);s.special='ochazuke';E.open(s);const orders=[];
 for(let i=0;i<9;i++){s.guests.forEach(g=>g.status='left');const g=E.arrive(s);orders.push(g.recipe);assert.ok(s.unlocked.includes(g.recipe));}
 assert.equal(new Set(orders).size,9);assert.equal(orders.filter(id=>id==='onigiri').length,1);
 const first=E.fresh();E.open(first);const counts={};for(let i=0;i<9;i++){first.guests.forEach(g=>g.status='left');const g=E.arrive(first);counts[g.recipe]=(counts[g.recipe]||0)+1;}assert.deepEqual(Object.values(counts),[3,3,3]);
});
test('a two-step story blocks closing, charges once, then follows up next night',()=>{
 const s=E.fresh();fullNight(s);s.guests.forEach(g=>g.status='eating');E.conversation(s);
 assert.equal(E.canClose(s),false);const choice=E.story(s).definition.choices.find(c=>E.canChoose(s,c));const before=s.money;
 assert.equal(E.resolveEvent(s,choice.id),true);assert.equal(s.money,before+(choice.money||0));assert.equal(E.canClose(s),false);
 const intermediate=E.restore(JSON.stringify(s));assert.equal(E.story(intermediate).run.step,1);
 assert.equal(E.resolveEvent(s,choice.id),false);assert.equal(E.resolveEvent(s,'remember'),true);assert.equal(E.canClose(s),true);
 assert.equal(s.pendingConsequences.length,1);assert.equal(E.resolveEvent(s,'remember'),false);E.close(s);E.next(s);
 const cash=s.money;E.open(s);assert.equal(s.money,cash+(choice.future.money||0));assert.equal(s.nightNews.length,1);assert.equal(s.pendingConsequences.length,0);assert.equal(s.storyMemory.length,1);
 const after=s.money;assert.equal(E.open(s),false);assert.equal(s.money,after);
});
test('three seats refill across a nine-guest night', () => {
  const s = E.fresh(); s.reputation = 100; E.open(s);
  E.arrive(s); E.arrive(s); E.arrive(s); assert.equal(s.target, 9); assert.equal(E.arrive(s), null);
  s.guests[0].status = 'left'; const g = E.arrive(s); assert.equal(g.id, 4); assert.equal(g.seat, 0);
  assert.equal(s.guests.length, 3);
});
test('save resumes waiting/eating guests, upgrades, inventory, and narrative choices', () => {
  const {s} = setup(); E.serve(s, 1, ['rice', 'nori'], .65); E.arrive(s); E.conversation(s); E.resolveEvent(s, E.story(s).definition.choices.find(c=>E.canChoose(s,c)).id);
  const restored = E.restore(JSON.stringify(s));
  assert.equal(restored.guests[0].status, 'eating'); assert.equal(restored.guests[1].status, 'waiting');
  assert.equal(restored.storyRun.choice,s.storyRun.choice);assert.equal(restored.storyRun.step,1); assert.deepEqual(restored.inventory, s.inventory);
  assert.equal(restored.money, s.money); assert.equal(restored.lastResult, null);
});
test('corrupt or unknown-version saves are rejected; legacy progress is migrated', () => {
  for (const patch of [{version: 9}, {inventory: {}}, {money: -2}, {special: 'evil'}, {guests: [{name:'<script>'}]}]) {
    assert.throws(() => E.restore(JSON.stringify({...E.fresh(), ...patch})));
  }
  assert.throws(() => E.restore('not json'));
  const s = E.restore(null, JSON.stringify({version:1,night:4,money:17000,served:3}));
  assert.equal(s.night, 4); assert.equal(s.money, 4900); assert.equal(s.totalServed, 3);
});
test('running out of ingredients and cash has a recovery path without a reset', () => {
  const {s} = setup(); s.money = 0; s.inventory.rice = 0; s.inventory.nori = 0;
  assert.deepEqual(E.rescueNeeds(s), {rice:1,nori:1}); assert.equal(E.rescue(s), true);
  assert.equal(s.reputation, 9); assert.equal(E.rescue(s), false);
  assert.ok(E.serve(s, 1, ['rice', 'nori'], .65));
});

test('happy visitors need two level gains and have a chance to return as regulars',()=>{
 const {s,guest}=setup();E.serve(s,guest.id,['rice','nori'],E.cookSpec(s,'onigiri').ideal);
 assert.equal(s.customerBook[0].dueLevel,3);s.phase='prep';s.night=2;E.open(s);assert.notEqual(E.arrive(s).person,0);
 function find(level,night){s.phase='prep';s.level=level;s.night=night;E.open(s);for(let i=0;i<9;i++){s.guests.forEach(g=>g.status='left');const g=E.arrive(s);if(g.person===0)return g;}assert.fail('eligible visitor should return in this seeded night');}
 let g=find(3,3);assert.equal(s.customerBook[0].visits,2);let r=E.recipes[g.recipe];for(const id of r.ingredients)if(!s.inventory[id])E.buy(s,id);E.serve(s,g.id,r.ingredients,E.cookSpec(s,g.recipe).ideal);assert.equal(s.customerBook[0].dueLevel,s.level+2);
 g=find(5,4);assert.equal(E.regular(s,0),true);const eggs=s.inventory.egg;assert.equal(E.gift(s,g.id),true);assert.equal(s.inventory.egg,eggs-1);assert.equal(E.gift(s,g.id),false);
 assert.equal(E.restore(JSON.stringify(s)).customerBook[0].visits,3);
});
test('version 2 saves keep money, purchases, waiting guests and expand to nine meals',()=>{
  const {s}=setup();s.version=2;delete s.customerBook;delete s.xp;delete s.level;delete s.satisfactionTotal;delete s.nightStart;s.target=3;
  const v=E.restore(JSON.stringify(s));assert.equal(v.version,5);assert.equal(v.target,9);assert.equal(v.money,3200);
  assert.equal(E.serve(v,1,['rice','nori'],.65).score,100);assert.ok(E.restore(JSON.stringify(v)));
  s.phase='end';assert.equal(E.restore(JSON.stringify(s)).phase,'prep');
});

test('a person cannot occupy two seats while other orders remain waiting',()=>{
 const s=E.fresh();E.open(s);E.arrive(s);E.arrive(s);E.arrive(s);
 for(let i=0;i<6;i++){s.guests.find(g=>g.seat===1).status='left';assert.ok(E.arrive(s));const live=s.guests.filter(g=>g.status!=='left');assert.equal(new Set(live.map(g=>g.person)).size,live.length);}
});

test('nine different faces each night, new visitors next cycle, and fresh arrivals at maximum level',()=>{
 const s=E.fresh();E.open(s);const first=[];for(let i=0;i<9;i++){s.guests.forEach(g=>g.status='left');first.push(E.arrive(s).person)}
 assert.equal(new Set(first.map(id=>id%24)).size,9);s.phase='prep';s.night++;E.open(s);
 const second=[];for(let i=0;i<9;i++){s.guests.forEach(g=>g.status='left');second.push(E.arrive(s).person)}
 assert.ok(second.every(id=>!first.includes(id)));assert.equal(new Set(second.map(id=>id%24)).size,9);
 s.phase='prep';s.level=5;s.nextVisitor=100;E.open(s);const g=E.arrive(s);assert.ok(g.person>=100);assert.ok(E.person(g.person).name);assert.ok(E.restore(JSON.stringify(s)));
});
test('preparation, recipe-specific heat and active waiting each affect the score',()=>{
 const a=setup(),badPrep=setup(),late=setup();
 const ideal=E.cookSpec(a.s,'onigiri').ideal;
 const best=E.serve(a.s,1,['rice','nori'],ideal,1);const poorly=E.serve(badPrep.s,1,['rice','nori'],ideal,0);
 late.s.guests[0].waitMs=180000;const waited=E.serve(late.s,1,['rice','nori'],ideal,1);
 assert.equal(best.score,100);assert.equal(poorly.score,75);assert.equal(waited.score,80);assert.equal(waited.waitPenalty,20);
 assert.ok(best.tip>poorly.tip);assert.notEqual(E.cookSpec(a.s,'tamago').ideal,ideal);
 assert.equal(E.serve(setup().s,1,['rice','nori'],ideal,NaN),null);
});
test('operating expenses are shown and charged only once on closing',()=>{
 const s=E.fresh();fullNight(s);const money=s.money;E.close(s);assert.equal(s.nightCosts,900);assert.equal(s.money,money-900);
 assert.equal(E.report(s).expenses,900);assert.equal(E.close(s),false);assert.equal(s.money,money-900);
});

test('v3 saves migrate to level-based revisits without losing progress or bought furniture',()=>{
 const {s}=setup();E.serve(s,1,['rice','nori'],E.cookSpec(s,'onigiri').ideal);s.upgrades=['plants'];s.version=3;delete s.nextVisitor;delete s.nightVisitors;for(const c of Object.values(s.customerBook))delete c.dueLevel;
 const v=E.restore(JSON.stringify(s));assert.equal(v.version,5);assert.equal(v.money,s.money);assert.equal(v.customerBook[0].dueLevel,v.level+2);assert.deepEqual(v.upgrades,['plants']);assert.ok(v.nextVisitor>=6);assert.ok(v.nightVisitors.includes(0));
});

test('100 illustrated dishes unlock three per level, with level 20 fridge and final level 34',()=>{
 const entries=Object.entries(E.recipes);assert.equal(entries.length,100);assert.equal(E.levels.length,34);
 for(let level=1;level<=34;level++)assert.equal(entries.filter(([,r])=>r.level===level).length,level===34?1:3);
 for(const [,r] of entries){assert.ok(r.ingredients.every(id=>E.ingredients[id]));assert.ok(r.sheet>=1&&r.sheet<=10&&r.art>=0&&r.art<10);}
 const s=E.fresh();s.money=100000;s.level=19;assert.equal(E.upgrade(s,'fridge'),false);s.level=20;assert.equal(E.upgrade(s,'fridge'),true);assert.equal(s.money,82000);assert.equal(E.buyPrice(s,'pork'),117);const cash=s.money;E.buy(s,'pork');assert.equal(s.money,cash-117);assert.equal(E.upgrade(s,'fridge'),false);
 s.level=34;E.progress(s);assert.equal(s.unlocked.length,100);assert.equal(E.restore(JSON.stringify(s)).level,34);
});
test('guest lines change each arrival but stay stable across save and render',()=>{
 const s=E.fresh();E.open(s);const lines=[];for(let i=0;i<9;i++){s.guests.forEach(g=>g.status='left');const g=E.arrive(s);lines.push(E.dialogue(g));assert.equal(E.dialogue(g),E.dialogue(g));assert.equal(E.dialogue(E.restore(JSON.stringify(s)).guests.find(x=>x.id===g.id)),E.dialogue(g));}assert.equal(new Set(lines).size,9);
});
test('v4 saves preserve money, purchases and active orders while adding new ingredients',()=>{
 const {s}=setup();s.version=4;s.upgrades=['plants'];delete s.inventory.tofu;const v=E.restore(JSON.stringify(s));assert.equal(v.money,s.money);assert.deepEqual(v.upgrades,['plants']);assert.equal(v.guests[0].recipe,s.guests[0].recipe);assert.equal(v.inventory.tofu,0);assert.equal(v.version,5);
});
