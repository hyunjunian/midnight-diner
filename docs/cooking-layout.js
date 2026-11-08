/* One source-space transform for the art, visible guides and pointer coordinates. */
(()=>{'use strict';
function frame(width,height,{portrait=true,focus=.58,span=.68,safeTop,safeBottom}={}){
 const top=safeTop??Math.min(94,height*.24),bottom=Math.max(top+12,safeBottom??height-54),ratio=portrait?2/3:1;
 const fullWidth=portrait&&height>width*1.15;
 const artHeight=Math.max(1,fullWidth?width/ratio:Math.min(width/ratio,(bottom-top)/span)),artWidth=artHeight*ratio;
 const center=(top+bottom)/2,y=center-artHeight*focus;
 return{width:artWidth,height:artHeight,left:(width-artWidth)/2,top:y,center,foodTop:center-artHeight*span/2,foodBottom:center+artHeight*span/2};
}
function focus(file){if(file.includes('measure'))return{focus:.65,span:.56};if(file.includes('portion'))return{focus:.59,span:.76};if(file.includes('broth'))return{focus:.59,span:.71};return{focus:.59,span:.7};}
const api={frame,focus};if(typeof module!=='undefined')module.exports=api;else window.MidnightCookingLayout=api;
})();
