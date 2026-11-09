const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const M=require('../docs/renovation-preview/model.js'),dir=path.join(__dirname,'../docs/renovation-preview');
test('50 levels expose a distinct internal and external upgrade, each with cash and both rewards',()=>{
 const ids=new Set();for(const area of ['inside','outside']){assert.equal(M.catalog[area].length,50);for(let i=0;i<50;i++){const u=M.catalog[area][i];assert.equal(u.level,i+1);assert.equal(u.previous,i);assert(u.cost>0&&u.atmosphere>0&&u.environment>0);ids.add(u.id);}}
 assert.equal(ids.size,100);
});
test('insufficient level or cash cannot spend; internal and external progress are independent',()=>{
 let s=M.initial();const fail=M.purchase({...s,cash:0},'inside');assert.equal(fail.ok,false);assert.equal(fail.state.cash,0);
 const a=M.purchase(s,'inside');assert(a.ok);assert.equal(a.state.cash,s.cash-a.upgrade.cost);assert.equal(a.state.inside,1);assert.equal(a.state.outside,0);
 const repeat=M.purchase(a.state,'inside');assert.equal(repeat.ok,false);assert.equal(repeat.state.cash,a.state.cash);
 const b=M.purchase(a.state,'outside');assert(b.ok);assert.equal(b.state.cash,a.state.cash-b.upgrade.cost);assert.equal(b.state.atmosphere,a.upgrade.atmosphere+b.upgrade.atmosphere);
});
test('all 100 upgrades can be purchased exactly once in order; Lv50 has a terminal state',()=>{
 let s=M.initial(50,1000000),cost=0,a=0,e=0;for(let level=1;level<=50;level++)for(const area of ['inside','outside']){const p=M.purchase(s,area);assert(p.ok);assert.equal(p.upgrade.level,level);s=p.state;cost+=p.upgrade.cost;a+=p.upgrade.atmosphere;e+=p.upgrade.environment;}
 assert.deepEqual([s.inside,s.outside,s.cash,s.atmosphere,s.environment],[50,50,1000000-cost,a,e]);for(const area of ['inside','outside']){assert.equal(M.purchase(s,area).ok,false);assert.equal(M.next(s,area),null);}
});
test('all 102 image states exist and every level changes its image',()=>{
 for(const area of ['inside','outside']){let previous;for(let i=0;i<=50;i++){const file=path.join(dir,`assets/${area}-${String(i).padStart(2,'0')}.webp`);assert(fs.existsSync(file),file);const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.notEqual(hash,previous,`${area} level ${i} must visibly update`);previous=hash;}}
});
test('the preview never accesses a live game save, real checkout or service worker',()=>{
 const js=fs.readFileSync(path.join(dir,'preview.js'),'utf8');assert(!/localStorage|sessionStorage|serviceWorker|checkout|paymentRequest|MidnightEngine/.test(js));
});
