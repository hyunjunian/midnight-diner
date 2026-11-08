const{test}=require('node:test'),assert=require('node:assert/strict'),G=require('../docs/gestures');
function path(id,points){const g=G.begin(id,...points[0]);for(const p of points.slice(1))G.move(g,...p);return G.valid(g);}
test('clicks and short swipes cannot complete cutting, mixing or plating',()=>{for(const id of ['cut','beat','assemble'])assert.equal(path(id,[[.4,.4],[.41,.41],[.4,.4]]),false);});
test('cutting needs a downward stroke; serving needs source to destination',()=>{assert.ok(path('cut',[[.4,.2],[.4,.45],[.4,.8]]));assert.equal(path('cut',[[.2,.5],[.5,.5],[.8,.5]]),false);assert.ok(path('assemble',[[.4,.5],[.4,.3],[.55,.7]]));assert.equal(path('assemble',[[.8,.6],[.5,.5],[.2,.5]]),false);});
test('beating eggs requires a circular path, not straight travel',()=>{const points=Array.from({length:33},(_,i)=>[.5+.25*Math.cos(i/32*2*Math.PI),.5+.25*Math.sin(i/32*2*Math.PI)]);assert.ok(path('beat',points));assert.equal(path('beat',[[.2,.4],[.5,.4],[.8,.4]]),false);});
test('dial is continuous and bounded',()=>{assert.equal(G.power(-1,1),0);assert.equal(G.power(1,1),1.6);assert.ok(G.power(0,-1)>0&&G.power(0,-1)<1.6);});
test('knife paths outside the ingredient do not count as cuts',()=>{for(const x of [.05,.2,.85,.95])assert.equal(path('cut',[[x,.2],[x,.5],[x,.85]]),false);for(const x of [.35,.5,.65])assert.ok(path('cut',[[x,.2],[x,.5],[x,.85]]));});
