const{test}=require('node:test'),assert=require('node:assert/strict'),A=require('../docs/audio');
const metrics=a=>({rms:Math.sqrt(a.reduce((n,x)=>n+x*x,0)/a.length),peak:a.reduce((n,x)=>Math.max(n,Math.abs(x)),0),rough:a.slice(1).reduce((n,x,i)=>n+(x-a[i])**2,0)/a.length});
test('water, viscous egg batter, oil and miso use distinct material mappings',()=>{
 assert.equal(A.flowKind({id:'beat',title:'달걀 풀기'}),'whisk');assert.equal(A.flowKind({id:'prep',mode:'wash',part:'rice'}),'wash');
 assert.equal(A.flowKind({id:'pour',title:'달걀물 붓기',art:'egg-pan'}),'batter');assert.equal(A.actionKind({id:'pour',title:'달걀물 붓기',art:'egg-pan'}),'egg-pour');
 assert.equal(A.flowKind({id:'broth',title:'국물 붓기'}),'pour');assert.equal(A.actionKind({id:'broth'}),'liquid-pour');assert.equal(A.flowKind({mode:'measure',part:'dashi'}),'pour');
 assert.equal(A.flowKind({mode:'measure',part:'miso'}),'paste');assert.equal(A.actionKind({mode:'measure',part:'miso'}),'paste-scoop');assert.equal(A.flowKind({id:'oil'}),'oil');
});
test('rendered materials are finite, conservative peaks, and deterministic for review',()=>{
 for(const k of [...Object.keys(A.defaults),'rain','room','sizzle','boil','paste','pour','batter','powder']){const a=A.render(k,1,22050,617),b=A.render(k,1,22050,617),m=metrics(a);assert.deepEqual(a,b,k);assert.equal(a.length,22050);assert.ok(a.every(Number.isFinite),k);assert.ok(m.peak<=.83&&m.peak>0,k);assert.ok(m.rms>.0001&&m.rms<.2,`${k} ${m.rms}`);assert.ok(a[0]===0);assert.ok(a.at(-1)===0)}
});
test('thin liquid is brighter and more active than batter; paste has no watery pour stream',()=>{
 const water=metrics(A.render('pour',3,22050,332)),egg=metrics(A.render('batter',3,22050,332)),paste=metrics(A.render('paste',3,22050,332));assert.ok(water.rough>egg.rough*3);assert.ok(water.rough>paste.rough*3);
});
test('loop samples are longer than short repetitive foley and use varying random events',()=>{
 const a=A.render('boil',6.7,22050,101,true),b=A.render('boil',6.7,22050,102,true);assert.notDeepEqual(a,b);const quarters=[0,1,2,3].map(n=>metrics(a.slice(n*22050,(n+1)*22050)).rms);assert.ok(Math.max(...quarters)-Math.min(...quarters)>.0001);
});
test('shared sound balancing lifts cash to the cooking reference while retaining peaks and silence',()=>{
 const rate=22050,active=a=>{const windows=[];for(let i=0;i<a.length;i+=Math.round(rate*.05)){const b=a.slice(i,i+Math.round(rate*.05)),r=metrics(b).rms;if(r>1e-5)windows.push(r);}windows.sort((a,b)=>a-b);return windows[Math.floor((windows.length-1)*.85)]||0;};
 for(const kind of ['cash','complete','cut','rice-scoop','egg-crack','sizzle','boil','paste','pour','buy','place','report']){const a=A.render(kind,A.defaults[kind]||2,rate,481),before=Float32Array.from(a),gain=A.volumeGain([a],rate),out=A.balancedSamples([a],rate)[0];assert.ok(Math.abs(active(out)-.085)<.005,kind);assert.ok(metrics(out).peak<=.651,kind);assert.deepEqual(a,before,'measurement never mutates the source');assert.ok(out[0]===0);assert.ok(out.at(-1)===0);if(kind==='cash')assert.ok(gain>1.5,'cash is raised, not merely other sounds lowered');}
 assert.equal(A.volumeGain([new Float32Array(rate)],rate),1);
});
