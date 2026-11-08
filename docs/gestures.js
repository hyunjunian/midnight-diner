/* Normalized physical gesture recognizer; clicks never complete cooking actions. */
(()=>{const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function begin(id,x,y){return{id,start:{x,y},last:{x,y},distance:0,angle:0,points:1,minY:y,minX:x};}
function move(g,x,y){const p=g.last;g.distance+=Math.hypot(x-p.x,y-p.y);const a=Math.atan2(p.y-.5,p.x-.5),b=Math.atan2(y-.5,x-.5);let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d< -Math.PI)d+=2*Math.PI;if(Math.hypot(x-.5,y-.5)>.08&&Math.hypot(x-.5,y-.5)<.48)g.angle+=d;g.minY=Math.min(g.minY,y);g.minX=Math.min(g.minX,x);g.last={x,y};g.points++;return g;}
function valid(g){const a=g.start,b=g.last;if(g.points<3||g.distance<.16)return false;switch(g.id){case'beat':return Math.abs(g.angle)>Math.PI*1.4;case'cut':return a.x>=.28&&a.x<=.72&&b.x>=.28&&b.x<=.72&&a.y<=.34&&b.y>=.67&&Math.abs(b.x-a.x)<.09;case'lid':return a.y-b.y>.25;case'shape':return Math.abs(b.x-.5)<.22&&Math.abs(a.x-.5)-Math.abs(b.x-.5)>.13;case'assemble':case'measure':return a.x>=.12&&a.x<=.48&&a.y>=.15&&a.y<=.6&&b.x>=.58&&b.x<=.92&&b.y>=.45&&b.y<=.9;case'portion':return a.x>=.12&&a.x<=.48&&a.y>=.2&&a.y<=.55&&g.minY<a.y-.08&&b.x>=.58&&b.x<=.92&&b.y>=.55&&b.y<=.9;case'pour':case'broth':case'oil':case'crack':return a.x>.15&&a.x<.85&&b.y-a.y>.18;case'peel':return a.x>.25&&a.x<.75&&Math.hypot(b.x-.5,b.y-.5)>Math.hypot(a.x-.5,a.y-.5)+.17;case'wrap-legacy':return Math.abs(b.x-.5)<.2&&Math.abs(a.x-.5)>.28;case'paste':return a.x>.58&&a.y>.4&&g.minX<.45&&b.x>.58&&b.y>.4;case'wrap':return a.x<.4&&b.x>.5&&b.x<.8&&a.y-b.y>.12;case'drain':return a.y-b.y>.24;default:return g.distance>.45;}}
function power(x,y){let angle=Math.atan2(x,-y)*180/Math.PI;return clamp((angle+135)/270*1.6,0,1.6);}
function guide(id,options={}){
 const line=(points,label)=>({points,label});
 const paths={
  cut:[.35,.5,.65].filter((x,i)=>!(options.cuts||[]).includes(i)).map((x,i)=>line([[x,.22],[x,.78]],'썰기')),
  beat:[line(Array.from({length:33},(_,i)=>[.5+.23*Math.cos(i/32*Math.PI*2),.5+.23*Math.sin(i/32*Math.PI*2)]),'원을 그려 젓기')],
  lid:[line([[.5,.72],[.5,.22]],'위로 열기')],
  shape:[line([[.13,.5],[.5,.5]],'가운데로 모으기')],
  portion:[line([[.3,.35],[.4,.18],[.72,.7]],'밥을 떠서 담기')],
  assemble:[line([[.3,.35],[.5,.5],[.72,.7]],'도구를 접시로')],
  measure:[line([[.3,.4],[.5,.48],[.72,.6]],'덜어 담기')],
  pour:[line([[.5,.25],[.5,.72]],'아래로 기울이기')],
  broth:[line([[.5,.25],[.5,.72]],'아래로 기울이기')],
  crack:[line([[.5,.25],[.5,.72]],'아래로 내려 깨기')],
  peel:[line([[.5,.42],[.82,.74]],'바깥으로 벗기기')],
  'wrap-legacy':[line([[.12,.5],[.5,.5]],'김 감싸기')],
  wrap:[line([[.18,.72],[.64,.70],[.64,.46]],'김을 앞면에 세로로 붙이기')],
  paste:[line([[.74,.68],[.3,.4],[.74,.68]],'스푼으로 된장 떠서 가져오기')],
  drain:[line([[.5,.72],[.5,.22]],'위로 건지기')]
 };
 return paths[id]||[];
}
const api={begin,move,valid,power,guide};if(typeof module!=='undefined')module.exports=api;else window.MidnightGestures=api;})();
