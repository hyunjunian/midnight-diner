const {test}=require('node:test');const assert=require('node:assert/strict');const M=require('../docs/morph.js');
test('one connected mesh remains continuous and never folds across idle, speech, walking and cooking',()=>{
 for(const person of [0,3,6,15,23]){const m=M.mesh(person);for(const state of [{},{cook:1},{walk:1},{cook:1,walk:1},{eat:1}])for(const t of [0,.37,1.1,3.3,8.2]){
  const v=M.deform(m,t,state);assert.ok(v.every(Number.isFinite));
  for(let i=0;i<m.indices.length;i+=3){const a=m.indices[i]*4,b=m.indices[i+1]*4,c=m.indices[i+2]*4;const area=(v[b]-v[a])*(v[c+1]-v[a+1])-(v[b+1]-v[a+1])*(v[c]-v[a]);assert.ok(area>0,'no inverted / detached triangles');}
  const next=M.deform(m,t+.001,state);assert.ok(Math.max(...next.map((n,i)=>Math.abs(n-v[i])))<.001,'no temporal jump');
 }}
});
test('breathing, hair follow-through and body movement deform local regions',()=>{
 const m=M.mesh(0);const a=M.deform(m,0),b=M.deform(m,1.2);assert.notEqual(a[12*4],b[12*4]);
 const walking=M.deform(m,1.2,{walk:1});assert.ok(walking.some((v,i)=>Math.abs(v-b[i])>.001));
});
test('speech and mouth-opening input never change the portrait geometry',()=>{
 const m=M.mesh(0);assert.deepEqual(M.deform(m,1.2,{talk:1,open:1}),M.deform(m,1.2));
 assert.equal(M.mouthShape,undefined);assert.equal(M.syllables,undefined);
});
test('seeded idle gestures vary naturally instead of replaying one synchronized loop',()=>{
 const a=Array.from({length:180},(_,i)=>M.motion(i*.25,12));
 assert.deepEqual(a,Array.from({length:180},(_,i)=>M.motion(i*.25,12)),'reproducible for a given guest seed');
 assert.ok(a.some(p=>Math.abs(p.glance)>.75),'visible occasional glances');
 assert.ok(a.some(p=>Math.abs(p.settle)>.75),'occasional shoulder settling');
 assert.ok(a.some((p,i)=>Math.abs(p.sway-M.motion(i*.25+20,12).sway)>.02),'not a fixed twenty-second loop');
 assert.ok(a.some((p,i)=>Math.abs(p.sway-M.motion(i*.25,13).sway)>.02),'guests move independently');
 const m=M.mesh(0),start=M.deform(m,0,{seed:12});let extent=0;
 for(let t=0;t<45;t+=.5){const v=M.deform(m,t,{seed:12});for(let i=0;i<v.length;i+=4)extent=Math.max(extent,Math.abs(v[i]-start[i]));}
 assert.ok(extent>.025,'head/hair motion is clearly visible at phone portrait sizes');
});
test('probabilistic gesture boundaries remain continuous and never fold',()=>{
 const m=M.mesh(5,16,24);
 for(let seed=0;seed<6;seed++)for(let t=0;t<120;t+=.73){
  const v=M.deform(m,t,{seed}),next=M.deform(m,t+.001,{seed});
  assert.ok(v.every(Number.isFinite));assert.ok(next.every((x,i)=>Math.abs(x-v[i])<.001));
  for(let i=0;i<m.indices.length;i+=3){const a=m.indices[i]*4,b=m.indices[i+1]*4,c=m.indices[i+2]*4;assert.ok((v[b]-v[a])*(v[c+1]-v[a+1])-(v[b+1]-v[a+1])*(v[c]-v[a])>0);}
 }
});
