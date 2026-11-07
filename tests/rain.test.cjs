const{test}=require('node:test'),assert=require('node:assert/strict'),R=require('../docs/rain.js');
test('all rain depths move downward continuously, never reverse or jump',()=>{
 for(const spawn of [R.spawn,R.spawnWindow])for(const depth of [0,.2,.5,1]){const d=spawn(()=>depth,true),before={...d};R.step(d,.033);assert.ok(d.y>before.y);assert.ok(d.y-before.y<.03);assert.ok(d.length>0);}
});
test('indoor rain is confined to glass panes, never the counter or ceiling',()=>{
 assert.ok(R.panes.length>20);for(const [x,y,w,h]of R.panes){assert.ok(x>.34&&x+w<.7);assert.ok(y>.31&&y+h<.48);assert.ok(w>0&&h>0);}
});
