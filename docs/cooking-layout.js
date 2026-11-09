/* One source-space transform for the art, visible guides and pointer coordinates. */
(()=>{'use strict';
function frame(width,height,{portrait=true,focus=.58,focusX=.5,span=.68,start=focus-span/2,end=focus+span/2,ratio=portrait?2/3:1,safeTop,safeBottom,center:desiredCenter}={}){
 const top=safeTop??Math.min(94,height*.24),bottom=Math.max(top+12,safeBottom??height-54);
 const center=Math.max(top+6,Math.min(bottom-6,desiredCenter??height*.60));
 // Center the food independently of long sleeves; fit only its occupied region.
 const artHeight=Math.max(1,Math.min(width/ratio,(center-top)/Math.max(.01,focus-start),(bottom-center)/Math.max(.01,end-focus))),artWidth=artHeight*ratio;
 const y=center-artHeight*focus;
 return{width:artWidth,height:artHeight,left:width/2-artWidth*focusX,top:y,center,foodTop:y+artHeight*start,foodBottom:y+artHeight*end};
}
function source(file){
 if(file==='foreground-v47-plate-ochazuke')return{ratio:393/852,scale:852/393,offset:0};
 const key=file.replace('foreground-v39-','');
 const extended=file.startsWith('foreground-v39-')&&['prep-rice','prep-egg','measure-miso','core-portion','core-shape','core-beat','core-broth','core-wrap','core-wrap-raw','core-wrap-burnt'].includes(key);
 const offsets={'prep-rice':.29,'prep-egg':.21,'measure-miso':.24,'core-portion':.4,'core-shape':.26,'core-beat':.25,'core-pour':.24,'core-broth':.24,'core-wrap':.28,'core-wrap-raw':.24,'core-wrap-burnt':.12};
 return extended?{ratio:.5,scale:2,offset:offsets[key]}:{ratio:2/3,scale:1.5,offset:.4};
}
function focus(file){
 if(file==='foreground-v47-plate-ochazuke')return{focus:.5,span:.9,...source(file)};
 if(file.startsWith('foreground-v39-')){
  const key=file.replace('foreground-v39-','');if(key.startsWith('plate-'))return{focus:.50,span:.88,start:.06,end:.94,...source(file)};const spec={
   'measure-miso':[.37,.40,.17,.55],'measure-dashi':[.65,.52],
   'core-portion':[.50,.75,.08,.83],'core-shape':[.38,.42,.22,.54],'core-beat':[.375,.45,.15,.59],
   'core-pour':[.52,.90,.07,.97],'core-broth':[.36,.68,.015,.545],'core-wrap':[.39,.43,.25,.56],'core-wrap-raw':[.35,.4,.20,.56],'core-wrap-burnt':[.32,.4,.15,.58],
   'prep-rice':[.395,.49,.16,.62],'prep-egg':[.36,.50,.16,.62],'prep-nori':[.55,.55],
   'prep-pork':[.56,.56],'prep-salmon':[.60,.48],'prep-vegetables':[.62,.57],'prep-scallion':[.61,.62]
  }[key];return{focus:spec[0],focusX:key==='core-wrap'?.556:.5,span:spec[1],...(spec.length>2?{start:spec[2],end:spec[3]}:{}),...source(file)};
 }
 if(file.includes('measure'))return{focus:.65,span:.56};if(file.includes('portion'))return{focus:.59,span:.76};if(file.includes('broth'))return{focus:.59,span:.71};return{focus:.59,span:.7};
}
// Approved v42 composition: phase at 20% of viewport, title directly below it.
// Keep caption placement separate from food fitting; never lower it to fit sleeves.
function workspace(width,height,{viewportHeight=height,areaTop=0,navBottom=0,footerTop=height,separateColumn=false,step}={}){
 const captionTop=separateColumn?14:Math.max(navBottom-areaTop+20,viewportHeight*.20-areaTop);
 return{captionTop,safeTop:captionTop+72,safeBottom:footerTop-(['assemble','pour'].includes(step)?36:60),center:height*(separateColumn?.53:step==='assemble'?.58:.60),titleTop:captionTop+24.5};
}
function room(width,height){
 const scale=Math.max(width/941,height/1672),artWidth=941*scale,artHeight=1672*scale,left=(width-artWidth)/2,top=(height-artHeight)/2;
 const zones={fridge:[.01,.25,.29,.49],stove:[.32,.46,.38,.13],rice:[.76,.42,.21,.11],board:[.62,.56,.37,.13]},hotspots={};
 for(const[id,[x,y,w,h]]of Object.entries(zones)){
  const x1=Math.max(0,left+x*artWidth),y1=Math.max(0,top+y*artHeight),x2=Math.min(width,left+(x+w)*artWidth),y2=Math.min(height,top+(y+h)*artHeight);
  hotspots[id]={left:x1,top:y1,width:Math.max(0,x2-x1),height:Math.max(0,y2-y1)};
 }
 return{width:artWidth,height:artHeight,left,top,hotspots};
}
function cabinet(width,height){
 const ratio=941/1672,cover=width/height<.9&&height>=width/ratio*.65;
 const h=cover?Math.max(height,width/ratio):Math.min(height,width/ratio),w=h*ratio;
 const lower=Math.max(0,h*.763+12-height),upper=Math.max(0,h*.158-6),crop=cover?Math.min(upper,Math.max(lower,(h-height)/2)):0;
 return{width:w,height:h,top:-crop,cover};
}
const api={frame,focus,source,workspace,room,cabinet};if(typeof module!=='undefined')module.exports=api;else window.MidnightCookingLayout=api;
})();
