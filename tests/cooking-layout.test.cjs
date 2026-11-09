const{test}=require('node:test'),assert=require('node:assert/strict'),L=require('../docs/cooking-layout'),G=require('../docs/gestures');
test('one source transform centers food between the caption and fixed footer across phone sizes',()=>{
 for(const[width,height]of[[320,568],[393,659],[393,852],[430,932],[852,393]])for(const file of ['portrait-v28-measure-dashi','portrait-v28-core-portion','portrait-v28-core-broth','portrait-v28-prep-egg']){
  const box=L.frame(width,height,{portrait:true,...L.focus(file),safeTop:180,safeBottom:height-100});
  assert.equal(box.left+box.width/2,width/2);assert.ok(Math.abs((box.top+box.height*L.focus(file).focus)-box.center)<.001);assert.ok(box.width<=width+.01);assert.ok(Math.abs(box.width/box.height-2/3)<.001);
 }
});
test('rice and miso move straight to the receiving bowl without an upward detour',()=>{
 for(const id of ['portion','paste']){const points=G.guide(id)[0].points,[a,b,c]=points;assert.ok(Math.abs((b[1]-a[1])*(c[0]-a[0])-(c[1]-a[1])*(b[0]-a[0]))<.00001);const g=G.begin(id,...a);G.move(g,...b);G.move(g,...c);assert.ok(G.valid(g));}
 const wrong=G.begin('portion',.72,.7);G.move(wrong,.5,.5);G.move(wrong,.3,.35);assert.equal(G.valid(wrong),false);
});

test('a quick direct mobile transfer needs only its real start and end, while taps remain invalid',()=>{
 for(const id of ['portion','measure','assemble','paste','wrap']){const points=G.guide(id)[0].points,g=G.begin(id,...points[0]);G.move(g,...points.at(-1));assert.ok(G.valid(g),id);const tap=G.begin(id,...points[0]);G.move(tap,points[0][0]+.01,points[0][1]);assert.equal(G.valid(tap),false);}
});

test('room cover crop preserves the native photo and keeps appliance targets reachable on resize',()=>{
 for(const[w,h]of[[320,300],[393,600],[852,393],[1280,600],[1920,900]]){
  const r=L.room(w,h);assert.ok(Math.abs(r.width/r.height-941/1672)<1e-9);assert.ok(r.width>=w-.01&&r.height>=h-.01);
  for(const [id,b]of Object.entries(r.hotspots)){assert.ok(b.width>0&&b.height>0,id+' reachable');assert.ok(b.left>=0&&b.top>=0&&b.left+b.width<=w+.01&&b.top+b.height<=h+.01,id+' stays inside cropped room');}
 }
});

test('food stays at the approved center while extended sleeves leave the viewport',()=>{
 for(const [width,height,footer]of[[320,568,490],[393,734,650],[393,852,750],[430,932,830]])for(const name of ['core-beat','measure-miso','core-broth']){
  const spec=L.focus('foreground-v39-'+name),top=Math.max(180,height*.245+66),box=L.frame(width,height,{portrait:true,...spec,safeTop:top,safeBottom:footer-60});
  assert.ok(Math.abs(box.center-height*.6)<.01,name+' fixed food anchor');
  assert.ok(box.foodTop>=top-.01&&box.foodBottom<=footer-60+.01,name+' clear of caption/footer');
  assert.ok(box.top+box.height>height,name+' sleeve exits viewport');
  assert.ok(Math.abs(box.width/box.height-.5)<.001);
 }
});

test('approved caption position is independent of food size and restores pouring aspect',()=>{
 for(const [width,height]of [[320,568],[393,852],[430,932]]){
  const a=L.workspace(width,height,{navBottom:105,footerTop:height-66,step:'beat'}),b=L.workspace(width,height,{navBottom:105,footerTop:height-66,step:'assemble'});
  assert.equal(a.captionTop,b.captionTop);assert.equal(a.captionTop,Math.max(125,height*.20));
  assert.equal(a.titleTop,a.captionTop+24.5);assert.ok(b.safeBottom>a.safeBottom);
 }
 const spec=L.focus('foreground-v39-core-pour');assert.equal(spec.ratio,2/3);assert.equal(spec.scale,1.5);
 const b=L.frame(393,852,{...spec,safeTop:242,safeBottom:748});assert.ok(b.foodTop>=242-.01);assert.ok(b.foodBottom<=748+.01);
});

test('shared preparation has the same transparent source for every recipe',()=>{
 const R=require('../docs/cooking-rules');
 for(const id of Object.keys(require('../docs/catalog').recipes)){
  const expected=true;
  assert.equal(R.nightImage(id,'core-beat').startsWith('foreground-v39-'),expected,id);
 }
 for(const name of ['prep-rice','prep-egg','measure-miso','core-portion','core-shape','core-beat','core-pour','core-broth','core-wrap']){
  const src=L.source('foreground-v39-'+name);for(const y of [.22,.5,.78])assert.ok(Math.abs(((y+src.offset)/src.scale)*src.scale-src.offset-y)<1e-9);
 }
});

test('portrait fridge photo fills the scene while keeping every shelf row reachable',()=>{
 for(const[w,h]of[[393,475],[393,550],[430,580],[320,500],[393,650]]){const b=L.cabinet(w,h);assert.ok(b.cover);assert.ok(b.width>=w-.001);assert.ok(Math.abs(b.width/b.height-941/1672)<.0001);assert.ok(b.top+b.height*.158>=5);assert.ok(b.top+b.height*.763+12<=h+.01);}
 for(const[w,h]of[[320,300],[852,393],[1280,450]]){const b=L.cabinet(w,h);assert.equal(b.cover,false);assert.ok(b.width<=w&&b.height<=h);}
});
