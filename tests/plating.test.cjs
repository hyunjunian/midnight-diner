const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),E=require('../docs/engine'),R=E.Cooking;
function fixture(id){const s=E.fresh();s.level=34;s.money=2000000;s.stoveTutorialDone=true;for(const key in s.inventory)s.inventory[key]=20;E.progress(s);E.open(s);const g=E.arrive(s);g.recipe=id;s.nightOrders[0]=id;assert.ok(E.acceptOrder(s,g.id));assert.ok(E.beginCooking(s,g.id));for(const key of E.recipes[id].ingredients)assert.ok(E.selectIngredient(s,key));assert.ok(E.prepareIngredients(s));return{s,g};}
test('all 100 plating mappings use valid authored cells and only the five pilots use new condition scenes',()=>{
 assert.equal(Object.keys(E.recipes).length,100);
 for(const id of Object.keys(E.recipes))for(const look of ['good','raw','dry','burnt']){
  const art=R.platingArt(id,look);assert.ok(fs.existsSync(path.join(__dirname,'../docs/assets',art.file+'.webp')),id+' '+look);assert.ok(art.col>=0&&art.col<art.cols&&art.row>=0&&art.row<art.rows);
  if(!R.imagePilot.includes(id)||look==='good')assert.ok(/^plating-\d+$/.test(art.file),'retain approved original scene for '+id);
  else{assert.ok(art.file.includes('-v24'));assert.ok(art.file.includes(look==='raw'?'raw':'burnt'));assert.equal(art.cols,id==='negi_omelette'?1:2);assert.ok(!Object.keys(E.recipes).filter(x=>!R.imagePilot.includes(x)).some(x=>R.platingArt(x,look).file===art.file),'never borrow pilot food for another recipe');}
 }
 assert.equal(R.platingArt('missing'),null);
});
test('every recipe retains exact heat outcome through post-heat actions, plating, completion, save, serving and payment',()=>{
 let heated=0,cold=0;
 for(const id of Object.keys(E.recipes)){
  const steps=R.plan(id,E.recipes[id]),heats=steps.filter(st=>st.id==='heat');assert.ok(heats.length<=1,id);if(heats.length)heated++;else cold++;
  for(const mode of ['raw','good','dry','burnt']){
   let{s,g}=fixture(id);const spec=E.cookSpec(s,id),value=mode==='raw'?0:mode==='good'?spec.ideal:mode==='dry'?Math.min(.93,spec.ideal+spec.band*.75):1;
   const expected=heats.length?mode:'good';assert.equal(E.heatLook(s,id,value),expected,id+' '+mode);let finishedHeat=false;
   for(const st of steps){
    if(st.id==='assemble'){assert.equal(E.kitchenLook(s),expected,id+' plating');s=E.restore(JSON.stringify(s));assert.equal(E.kitchenLook(s),expected,id+' plating reload');}
    assert.ok(E.completeCookingStep(s,st.id==='heat'?E.heatQuality(s,id,value):1,st.id==='heat'?{heat:value}:undefined),id+' '+st.id);
    if(st.id==='heat')finishedHeat=true;if(finishedHeat)assert.equal(E.kitchenLook(s),expected,id+' after '+st.id);
   }
   assert.equal(s.kitchen.stage,'complete');assert.equal(E.kitchenLook(s),expected,id+' complete');s=E.restore(JSON.stringify(s));assert.equal(E.kitchenLook(s),expected,id+' complete reload');const bill=E.deliver(s);assert.ok(bill,id);assert.equal(bill.appearance,expected,id+' serving');if(heats.length)assert.equal(bill.heatValue,value,id+' exact heat');
   s=E.restore(JSON.stringify(s));assert.equal(s.guests[0].bill.appearance,expected,id+' served reload');assert.ok(E.finishEating(s,g.id));const paid=E.collect(s,g.id);assert.equal(paid.appearance,expected,id+' payment');assert.equal(E.restore(JSON.stringify(s)).guests[0].bill.appearance,expected,id+' paid reload');
  }
 }
 assert.equal(heated,91);assert.equal(cold,9);
});
test('the pilot onigiri wrap preserves raw/scorched rice in every action frame without expanding other recipes',()=>{
 for(const id of Object.keys(E.recipes))for(const look of ['good','raw','dry','burnt']){
  const art=R.wrapArt(id,look);
  if(id!=='onigiri'||look==='good')assert.equal(art,null,id+' '+look);
  else{assert.equal(art.file,`core-wrap-${look==='raw'?'raw':'burnt'}-v24`);assert.equal(art.cols,2);assert.equal(art.rows,2);assert.ok(fs.existsSync(path.join(__dirname,'../docs/assets',art.file+'.webp')));}
 }
 for(const id of R.imagePilot){const p=R.plan(id,E.recipes[id]),at=p.findIndex(x=>x.id==='heat');assert.deepEqual(p.slice(at+1).map(x=>x.id),id==='onigiri'?['wrap','assemble']:['assemble']);}
});
test('night lighting routes exactly the five approved dishes, preserving all other recipe assets',()=>{
 assert.equal(Object.keys(R.nightSceneFiles).length,15);
 for(const id of Object.keys(E.recipes))for(const [source,target]of Object.entries(R.nightSceneFiles)){
  assert.ok(fs.existsSync(path.join(__dirname,'../docs/assets',target+'.webp')),target);
  assert.equal(R.nightImage(id,source),R.imagePilot.includes(id)?target:source,id+' '+source);
 }
 assert.equal(R.nightImage('hiyayakko',R.prepImage('hiyayakko','scallion')),'prep-night-v22-scallion');
 assert.equal(R.nightImage('onigiri','core-portion-v19'),'core-portion-v19');
});
