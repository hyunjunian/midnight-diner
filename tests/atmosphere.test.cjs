const{test}=require('node:test'),assert=require('node:assert/strict'),A=require('../docs/atmosphere');
test('stove steam rises behind the counter and fades at both ends of its life',()=>{
 for(let i=0;i<15;i++)for(let t=0;t<20;t+=.05){const a=A.wisp(t,i),b=A.wisp(t+.001,i);assert.ok(a.x>.23&&a.x<.31);assert.ok(a.y>.34&&a.y<.527);assert.ok(a.alpha>=0&&a.alpha<.3);if(b.y<a.y)assert.ok(Math.abs(b.y-a.y)<.001);else assert.ok(a.alpha<.002&&b.alpha<.002,'respawn is invisible');}
});
