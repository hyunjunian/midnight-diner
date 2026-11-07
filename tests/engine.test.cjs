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
  assert.equal(E.unlock(s,'ochazuke'),true);assert.equal(s.money,99100);assert.equal(E.unlock(s,'ochazuke'),false);
  assert.equal(E.upgrade(s,'lantern'),true);assert.equal(s.money,98100);assert.equal(E.upgrade(s,'lantern'),false);
  assert.equal(E.upgrade(s,'noren'),true);assert.equal(E.upgrade(s,'bonsai'),false);
  for(const id of ['nope','__proto__','constructor']){assert.equal(E.buy(s,id),false);assert.equal(E.unlock(s,id),false);assert.equal(E.upgrade(s,id),false)}
});
test('level gates require reputation AND satisfaction as well as growth points',()=>{
  const s=E.fresh();s.xp=6000;s.totalServed=10;s.satisfactionTotal=1000;E.progress(s);assert.equal(s.level,1);
  s.reputation=100;s.satisfactionTotal=600;E.progress(s);assert.equal(s.level,1);
  s.satisfactionTotal=700;E.progress(s);assert.equal(s.level,2);
  s.satisfactionTotal=900;E.progress(s);assert.equal(s.level,5);
  s.reputation=0;E.progress(s);assert.equal(s.level,5,'earned levels stay unlocked');
});
test('learned omakase is ordered by a fresh fourth visitor',()=>{
 const s=E.fresh();s.level=2;E.unlock(s,'ochazuke');s.special='ochazuke';E.open(s);
 E.arrive(s);E.arrive(s);E.arrive(s);s.guests[0].status='left';const g=E.arrive(s);
 assert.equal(g.omakase,true);assert.equal(g.recipe,'ochazuke');E.buy(s,'salmon');assert.equal(E.serve(s,g.id,E.recipes.ochazuke.ingredients,E.cookSpec(s,'ochazuke').ideal).score,100);
});
test('a pending story blocks closing and choices cannot be repeated',()=>{
  const s=E.fresh();fullNight(s);s.guests.forEach(g=>g.status='eating');
  E.conversation(s);assert.equal(E.canClose(s),false);const before=s.reputation;
  E.resolveEvent(s,'dismiss');assert.equal(s.reputation,before-3);
  assert.equal(E.resolveEvent(s,'listen'),false);assert.equal(E.canClose(s),true);
});
test('three seats refill across a nine-guest night', () => {
  const s = E.fresh(); s.reputation = 100; E.open(s);
  E.arrive(s); E.arrive(s); E.arrive(s); assert.equal(s.target, 9); assert.equal(E.arrive(s), null);
  s.guests[0].status = 'left'; const g = E.arrive(s); assert.equal(g.id, 4); assert.equal(g.seat, 0);
  assert.equal(s.guests.length, 3);
});
test('save resumes waiting/eating guests, upgrades, inventory, and narrative choices', () => {
  const {s} = setup(); E.serve(s, 1, ['rice', 'nori'], .65); E.arrive(s); E.conversation(s); E.resolveEvent(s, 'listen');
  const restored = E.restore(JSON.stringify(s));
  assert.equal(restored.guests[0].status, 'eating'); assert.equal(restored.guests[1].status, 'waiting');
  assert.equal(restored.eventChoice, 'listen'); assert.deepEqual(restored.inventory, s.inventory);
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

test('happy customers wait for two level gains, then become regulars on third visit',()=>{
 const {s,guest}=setup();E.serve(s,guest.id,['rice','nori'],E.cookSpec(s,'onigiri').ideal);
 assert.equal(s.customerBook[0].dueLevel,3);s.phase='prep';s.night=2;E.open(s);assert.notEqual(E.arrive(s).person,0);
 s.phase='prep';s.night=3;s.level=3;E.open(s);let g=E.arrive(s);assert.equal(g.person,0);assert.equal(s.customerBook[0].visits,2);
 E.serve(s,g.id,['rice','nori'],E.cookSpec(s,'onigiri').ideal);assert.equal(s.customerBook[0].dueLevel,5);
 s.phase='prep';s.night=4;s.level=5;E.open(s);g=E.arrive(s);assert.equal(g.person,0);assert.equal(E.regular(s,0),true);
 const eggs=s.inventory.egg;assert.equal(E.gift(s,g.id),true);assert.equal(s.inventory.egg,eggs-1);assert.equal(E.gift(s,g.id),false);
 assert.equal(E.serve(s,g.id,['rice','nori'],E.cookSpec(s,'onigiri').ideal).score,100);assert.equal(E.gift(s,g.id),false);
 const restored=E.restore(JSON.stringify(s));assert.equal(restored.customerBook[0].visits,3);
});
test('version 2 saves keep money, purchases, waiting guests and expand to nine meals',()=>{
  const {s}=setup();s.version=2;delete s.customerBook;delete s.xp;delete s.level;delete s.satisfactionTotal;delete s.nightStart;s.target=3;
  const v=E.restore(JSON.stringify(s));assert.equal(v.version,4);assert.equal(v.target,9);assert.equal(v.money,3200);
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
 const v=E.restore(JSON.stringify(s));assert.equal(v.version,4);assert.equal(v.money,s.money);assert.equal(v.customerBook[0].dueLevel,v.level+2);assert.deepEqual(v.upgrades,['plants']);assert.ok(v.nextVisitor>=6);assert.ok(v.nightVisitors.includes(0));
});
