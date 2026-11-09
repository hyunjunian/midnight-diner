/* One source-space transform for the art, visible guides and pointer coordinates. */
(()=>{'use strict';
function frame(width,height,{portrait=true,focus=.58,span=.68,safeTop,safeBottom,edgeBottom}={}){
 const top=safeTop??Math.min(94,height*.24),bottom=Math.max(top+12,safeBottom??height-54),ratio=portrait?2/3:1;
 const fullWidth=portrait&&height>width*1.15;
 const artHeight=Math.max(1,fullWidth?width/ratio:Math.min(width/ratio,(bottom-top)/span)),artWidth=artHeight*ratio;
 const y=Math.max((top+bottom)/2-artHeight*focus,fullWidth&&Number.isFinite(edgeBottom)?edgeBottom-artHeight:-Infinity),center=y+artHeight*focus;
 return{width:artWidth,height:artHeight,left:(width-artWidth)/2,top:y,center,foodTop:center-artHeight*span/2,foodBottom:center+artHeight*span/2};
}
function focus(file){if(file.includes('measure'))return{focus:.65,span:.56};if(file.includes('portion'))return{focus:.59,span:.76};if(file.includes('broth'))return{focus:.59,span:.71};return{focus:.59,span:.7};}
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
const api={frame,focus,room,cabinet};if(typeof module!=='undefined')module.exports=api;else window.MidnightCookingLayout=api;
})();
