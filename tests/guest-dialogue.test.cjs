const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),E=require('../docs/engine');
function visit(person,returning=false){const s=E.fresh();E.open(s);s.nextVisitor=person;if(returning)s.customerBook[person]={visits:1,lastScore:0,lastVisitNight:0,dueNight:0,dueLevel:0,known:['name','role','bio','style']};return {s,g:E.arrive(s)};}

test('every identity keeps its voice through both visits and the complete service lifecycle',()=>{
 const arrivals=new Set(),returns=new Set(),orders=new Set();
 for(let person=0;person<E.people.length*2;person++)for(const returning of [false,true]){
  const {s,g}=visit(person,returning),before=structuredClone(s);
  const hello=E.guestConversation(s,g.id);assert.deepEqual(s,before);assert.ok(hello.line.length);
  (returning?returns:arrivals).add(hello.line);
  assert.ok(E.answerGuest(s,g.id,'welcome'));const intro=E.guestConversation(s,g.id);
  if(!returning)assert.ok(intro.line.includes(E.person(person).name),'use the actual name, including generated family names');
  assert.doesNotMatch(intro.line,/이렇게 인사하니|한결 편안|저를 기억해 주시니/);
  assert.ok(E.answerGuest(s,g.id,'day'));const day=E.guestConversation(s,g.id);
  const restored=E.restore(JSON.stringify(s));assert.deepEqual(E.guestConversation(restored,g.id),day);
  assert.ok(E.answerGuest(s,g.id,'warm'));const response=E.guestConversation(s,g.id);
  assert.equal(response.line,E.D.replies(s,g)[1],'answer the current visit\'s subject');
  assert.ok(E.answerGuest(s,g.id,'order'));const order=E.guestConversation(s,g.id);assert.ok(order.line.includes(E.recipes[g.recipe].name));orders.add(order.line);
  assert.ok(E.acceptOrder(s,g.id));const waiting=E.guestConversation(s,g.id);assert.ok(waiting.line);assert.deepEqual(waiting.choices,[]);
  const originalRecipe=g.recipe;g.recipe='hiyayakko';g.status='eating';const eating=E.guestServiceLines(s,g).join(' ');assert.doesNotMatch(eating,/温|따뜻|뜨거|식기 전에/,'cold meals never receive a hot-food line');g.recipe=originalRecipe;
  g.status='paying';g.bill={total:1234,base:1234,tip:0,score:100,preparation:100,heat:100,waitPenalty:0};const paying=E.guestServiceLines(s,g);assert.equal(paying.length,2);assert.ok(paying[1].includes('¥1,234'));
  g.status='farewell';for(const score of [50,75,100]){g.score=score;const lines=E.guestServiceLines(s,g);assert.equal(lines.length,2);assert.ok(lines.every(Boolean));assert.deepEqual(E.guestServiceLines(E.restore(JSON.stringify(s)),E.restore(JSON.stringify(s)).guests[0]),lines);}
  assert.equal(s.money,before.money);assert.equal(s.xp,before.xp);assert.deepEqual(s.inventory,before.inventory);
 }
 assert.equal(arrivals.size,24);assert.equal(returns.size,24);assert.ok(orders.size>=24);
});

test('reviews retain the person who ate and report waiting or heat problems before generic praise',()=>{
 for(let person=0;person<24;person++){
  assert.equal(E.reviewText({score:100,heat:100,waitPenalty:5},person),E.D.voice(person).waitReview);
  assert.equal(E.reviewText({score:100,heat:30,waitPenalty:0},person),E.D.voice(person).heatReview);
 }
 const game=fs.readFileSync('docs/game.js','utf8');assert.match(game,/E\.guestServiceLines\(state,g\)/);assert.doesNotMatch(game,/const thanksHigh|const goodbyes/);
});
