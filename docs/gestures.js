/* Normalized physical gesture recognizer; clicks never complete cooking actions. */
(()=>{const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function begin(id,x,y){return{id,start:{x,y},last:{x,y},distance:0,angle:0,points:1};}
function move(g,x,y){const p=g.last;g.distance+=Math.hypot(x-p.x,y-p.y);const a=Math.atan2(p.y-.5,p.x-.5),b=Math.atan2(y-.5,x-.5);let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d< -Math.PI)d+=2*Math.PI;if(Math.hypot(x-.5,y-.5)>.08&&Math.hypot(x-.5,y-.5)<.48)g.angle+=d;g.last={x,y};g.points++;return g;}
function valid(g){const a=g.start,b=g.last;if(g.points<3||g.distance<.16)return false;switch(g.id){case'beat':return Math.abs(g.angle)>Math.PI*1.4;case'cut':return a.y<.45&&b.y>.65&&Math.abs(b.x-a.x)<.35;case'lid':return a.y-b.y>.25;case'shape':return Math.abs(b.x-.5)<.22&&Math.abs(a.x-.5)-Math.abs(b.x-.5)>.13;case'portion':case'assemble':case'garnish':case'add':case'pour':case'broth':case'season':case'oil':case'wrap':return a.x<.48&&b.x>.62&&b.y>.35;case'drain':return a.y-b.y>.24;default:return g.distance>.45;}}
function power(x,y){let angle=Math.atan2(x,-y)*180/Math.PI;return clamp((angle+135)/270*1.6,0,1.6);}
const api={begin,move,valid,power};if(typeof module!=='undefined')module.exports=api;else window.MidnightGestures=api;})();
