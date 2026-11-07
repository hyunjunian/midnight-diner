const {test}=require('node:test');const assert=require('node:assert/strict');const M=require('../docs/morph.js');
test('one connected mesh remains continuous and never folds across idle, speech, walking and cooking',()=>{
 for(const person of [-1,0,6,15,23]){const m=M.mesh(person);for(const state of [{},{talk:1,open:1},{walk:1},{cook:1,talk:1,open:1,walk:1}])for(const t of [0,.37,1.1,3.3,8.2]){
  const v=M.deform(m,t,state);assert.ok(v.every(Number.isFinite));
  for(let i=0;i<m.indices.length;i+=3){const a=m.indices[i]*4,b=m.indices[i+1]*4,c=m.indices[i+2]*4;const area=(v[b]-v[a])*(v[c+1]-v[a+1])-(v[b+1]-v[a+1])*(v[c]-v[a]);assert.ok(area>0,'no inverted / detached triangles');}
  const next=M.deform(m,t+.001,state);assert.ok(Math.max(...next.map((n,i)=>Math.abs(n-v[i])))<.001,'no temporal jump');
 }}
});
test('breathing, hair follow-through and jaw motion deform different local regions',()=>{
 const m=M.mesh(-1);const a=M.deform(m,0),b=M.deform(m,1.2);assert.notEqual(a[12*4],b[12*4]);
 const speaking=M.deform(m,1.2,{talk:1,open:1});assert.ok(speaking.some((v,i)=>Math.abs(v-b[i])>.001));
});
test('Korean syllables interpolate different vowel shapes and close smoothly at the end',()=>{
 const script=M.syllables('아 이 오 우.');const shapes=[.1,.45,.8,1.1].map(t=>M.mouthShape(t,script));assert.ok(new Set(shapes.map(s=>s.width.toFixed(3))).size>1);
 for(let t=0;t<script.at(-1).end;t+=.003){const a=M.mouthShape(t,script),b=M.mouthShape(t+.0001,script);assert.ok(Math.abs(a.height-b.height)<.001);}
 assert.equal(M.mouthShape(999,script).active,false);
});
