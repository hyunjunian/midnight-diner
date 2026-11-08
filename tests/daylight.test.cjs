const{test}=require('node:test'),assert=require('node:assert/strict'),D=require('../docs/daylight');
test('one authoritative clock combines persisted playing time and service progress',()=>{
 assert.equal(D.minutes({phase:'prep'}),1430);assert.equal(D.minutes({phase:'end'}),420);
 assert.equal(D.minutes({phase:'open',nightElapsedMs:0,nightScores:[],target:9}),30);
 assert.equal(D.minutes({phase:'open',nightElapsedMs:90000,nightScores:[],target:9}),90,'clock passes during cooking or idle');
 assert.equal(D.minutes({phase:'open',nightElapsedMs:90000,nightScores:[80,90,70],target:9}),160,'service provides a minimum time');
 assert.equal(D.minutes({phase:'open',nightElapsedMs:9e6,nightScores:[],target:9}),405,'never forces an overnight closing');
 assert.equal(D.minutes({phase:'open',nightElapsedMs:NaN,target:0}),30);
});
test('late night darkens before dawn brightens, with street lamps extinguishing only at dawn',()=>{
 const start=D.sample(30),deep=D.sample(150),dawn=D.sample(360);
 assert.ok(deep.brightness<start.brightness);assert.ok(dawn.brightness>start.brightness);assert.equal(start.street,1);assert.equal(deep.street,1);assert.equal(dawn.street,0);assert.ok(dawn.dawn>.3);
 for(let m=30;m<=420;m+=.1){const a=D.sample(m),b=D.sample(m+.01);assert.ok(Object.values(a).every(v=>typeof v!=='number'||Number.isFinite(v)));assert.ok(Math.abs(a.brightness-b.brightness)<.001);assert.ok(Math.abs(a.street-b.street)<.001);}
});
