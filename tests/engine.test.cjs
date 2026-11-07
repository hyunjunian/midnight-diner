const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../docs/engine.js');
const setup = () => { const s = E.fresh(); E.open(s); const guest = E.arrive(s); return { s, guest }; };

test('a full night: arrivals, food, conversation, closing, and next night', () => {
  const s = E.fresh(); assert.equal(E.close(s), false); E.open(s);
  for (let i = 0; i < 3; i++) {
    const g = E.arrive(s); assert.ok(g);
    if (i === 1) { assert.equal(E.conversation(s), true); assert.equal(E.resolveEvent(s, 'listen'), true); }
    const r = E.serve(s, g.id, E.recipes[g.recipe].ingredients, 0.65);
    assert.equal(r.score, 100); assert.ok(r.tip > 0);
  }
  assert.equal(E.arrive(s), null); assert.equal(s.totalServed, 3);
  assert.equal(s.reputation, 29); assert.equal(E.canClose(s), true);
  assert.equal(s.nightRevenue, s.money - 3200);
  E.close(s); assert.equal(s.phase, 'end'); E.next(s); E.open(s);
  assert.equal(s.night, 2); assert.equal(s.target, 4); assert.equal(s.nightRevenue, 0);
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
  assert.equal(s.inventory.rice, 3); assert.equal(s.inventory.nori, 3);
  const after = structuredClone(s);
  assert.equal(E.serve(s, 1, ['rice', 'nori'], 0.65), null); assert.deepEqual(s, after);
});
test('purchases, unlocks and decoration charge exactly once and reject unknown items', () => {
  const s = E.fresh(); assert.equal(E.buy(s, 'rice'), true); assert.equal(s.money, 3140);
  assert.equal(E.unlock(s, 'ochazuke'), true); assert.equal(s.money, 2240);
  assert.equal(E.unlock(s, 'ochazuke'), false);
  assert.equal(E.upgrade(s, 'lantern'), true); assert.equal(s.money, 640);
  assert.equal(E.upgrade(s, 'lantern'), false); assert.equal(E.upgrade(s, 'plants'), false);
  for (const id of ['nope', '__proto__', 'constructor']) {
    assert.equal(E.buy(s, id), false); assert.equal(E.unlock(s, id), false); assert.equal(E.upgrade(s, id), false);
  }
  assert.equal(s.money, 640);
});
test('unlocked omakase becomes an actual guest order on later nights', () => {
  const s = E.fresh(); E.unlock(s, 'ochazuke'); s.special = 'ochazuke'; s.night = 2; E.open(s);
  E.arrive(s); E.arrive(s); const g = E.arrive(s);
  assert.equal(g.omakase, true); assert.equal(g.recipe, 'ochazuke');
  E.buy(s, 'salmon'); assert.equal(E.serve(s, g.id, E.recipes.ochazuke.ingredients, 0.65).score, 100);
});
test('a pending story blocks closing and choices cannot be repeated', () => {
  const s = E.fresh(); E.open(s);
  for (let i = 0; i < 3; i++) { const g = E.arrive(s); E.serve(s, g.id, E.recipes[g.recipe].ingredients, .65); }
  E.conversation(s); assert.equal(E.canClose(s), false);
  E.resolveEvent(s, 'dismiss'); assert.equal(s.reputation, 21);
  assert.equal(E.resolveEvent(s, 'listen'), false); assert.equal(E.canClose(s), true);
});
test('seats fill, free up, and allow the reputation-driven extra visitors', () => {
  const s = E.fresh(); s.reputation = 100; E.open(s);
  E.arrive(s); E.arrive(s); E.arrive(s); assert.equal(s.target, 6); assert.equal(E.arrive(s), null);
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
