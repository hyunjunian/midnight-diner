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
    const r=E.serve(s,g.id,E.recipes[g.recipe].ingredients,.65);assert.equal(r.score,100);
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
  assert.equal(s.inventory.rice, 7); assert.equal(s.inventory.nori, 7);
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
test('unlocked omakase becomes an actual guest order on later nights', () => {
  const s = E.fresh(); s.level=2; assert.equal(E.unlock(s, 'ochazuke'),true); s.special = 'ochazuke'; s.night = 2; E.open(s);
  E.arrive(s); E.arrive(s); const g = E.arrive(s);
  assert.equal(g.omakase, true); assert.equal(g.recipe, 'ochazuke');
  E.buy(s, 'salmon'); assert.equal(E.serve(s, g.id, E.recipes.ochazuke.ingredients, 0.65).score, 100);
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

test('happy customers are prioritized two nights later; three visiting nights make a regular',()=>{
  const {s,guest}=setup();E.serve(s,guest.id,['rice','nori'],.65);
  assert.equal(s.customerBook[0].dueNight,3);assert.equal(E.regular(s,0),false);
  s.phase='prep';s.night=3;E.open(s);const returning=E.arrive(s);assert.equal(returning.person,0);assert.equal(s.customerBook[0].visits,2);
  E.serve(s,returning.id,['rice','nori'],.65);s.phase='prep';s.night=5;E.open(s);const third=E.arrive(s);
  assert.equal(third.person,0);assert.equal(E.regular(s,0),true);
  const eggs=s.inventory.egg;assert.equal(E.gift(s,third.id),true);assert.equal(s.inventory.egg,eggs-1);assert.equal(E.gift(s,third.id),false);
  const result=E.serve(s,third.id,['rice','nori'],.5);assert.ok(result.score>80);assert.equal(E.gift(s,third.id),false);
  const restored=E.restore(JSON.stringify(s));assert.equal(restored.customerBook[0].visits,3);assert.equal(restored.guests[0].gifted,true);
});
test('version 2 saves keep money, purchases, waiting guests and expand to nine meals',()=>{
  const {s}=setup();s.version=2;delete s.customerBook;delete s.xp;delete s.level;delete s.satisfactionTotal;delete s.nightStart;s.target=3;
  const v=E.restore(JSON.stringify(s));assert.equal(v.version,3);assert.equal(v.target,9);assert.equal(v.money,3200);
  assert.equal(E.serve(v,1,['rice','nori'],.65).score,100);assert.ok(E.restore(JSON.stringify(v)));
  s.phase='end';assert.equal(E.restore(JSON.stringify(s)).phase,'prep');
});

test('a person cannot occupy two seats while other orders remain waiting',()=>{
 const s=E.fresh();E.open(s);E.arrive(s);E.arrive(s);E.arrive(s);
 for(let i=0;i<6;i++){s.guests.find(g=>g.seat===1).status='left';assert.ok(E.arrive(s));const live=s.guests.filter(g=>g.status!=='left');assert.equal(new Set(live.map(g=>g.person)).size,live.length);}
});
