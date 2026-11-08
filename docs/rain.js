/* Downward rain in the alley and behind the kitchen's individual glass panes. */
(() => {
  'use strict';
  const spawn=(random=Math.random,initial=false)=>{const depth=random();return{x:random(),y:initial?random():-.04,depth,vx:.012+depth*.013,vy:.35+depth*.36,length:.012+depth*.016};};
  const spawnWindow=(random=Math.random,initial=false)=>{const d=spawn(random,initial);return {...d,x:.344+d.x*.35,y:initial?.313+d.y*.16:.30,vy:.11+d.depth*.09,vx:.003+d.depth*.004,length:.006+d.depth*.009};};
  function step(drop,dt){drop.x+=drop.vx*dt;drop.y+=drop.vy*dt;return drop;}
  const panes=[];
  for(const [x,right]of [[529,571],[580,619],[633,672],[682,730],[744,781],[805,837],[848,884],[896,931],[943,980],[994,1031],[1043,1065]])for(const [y,bottom]of [[322,369],[380,425],[436,483]]){
    // The flower arrangement stands in front of the two rightmost lower panes.
    if(x>980&&y>369)continue;panes.push([x/1536,y/1024,(right-x)/1536,(bottom-y)/1024]);
  }
  const api={spawn,spawnWindow,step,panes};if(typeof module!=='undefined'){module.exports=api;return;}window.MidnightRain=api;
  const canvas=document.getElementById('scene-rain'),world=document.getElementById('scene-world'),app=document.getElementById('app'),ctx=canvas?.getContext('2d');if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),drops=Array.from({length:110},()=>spawn(Math.random,true)),windowDrops=Array.from({length:48},()=>spawnWindow(Math.random,true));
  let last=0,lastDraw=0,w=0,h=0,frames=0;
  function resize(){w=world.clientWidth;h=world.clientHeight;const ratio=Math.min(1.5,devicePixelRatio||1);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
  new ResizeObserver(resize).observe(world);resize();
  function frame(now){requestAnimationFrame(frame);if(now-lastDraw<1000/30)return;const dt=Math.min(.05,(now-last)/1000||.033);last=now;lastDraw=now;
    if(document.hidden||app.hidden||reduced.matches){ctx.clearRect(0,0,w,h);return;}
    const outside=world.classList.contains('exterior-world');ctx.clearRect(0,0,w,h);ctx.save();
    if(!outside){ctx.beginPath();for(const [x,y,a,b]of panes)ctx.rect(x*w,y*h,a*w,b*h);ctx.clip();}
    const active=outside?drops:windowDrops,count=active.length;
    for(let i=0;i<count;i++){let d=active[i];step(d,dt);if(d.y>(outside?1.04:.483)||d.x>(outside?1.04:.695))d=active[i]=outside?spawn():spawnWindow();
      const alpha=(outside?.3:.29)+d.depth*(outside?.3:.25);ctx.strokeStyle=`rgba(191,215,218,${alpha})`;ctx.lineWidth=.55+d.depth*.75;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(d.x*w,d.y*h);ctx.lineTo((d.x-d.vx*d.length/d.vy)*w,(d.y-d.length)*h);ctx.stroke();
    }
    ctx.restore();canvas.dataset.frames=String(++frames);canvas.dataset.area=outside?'alley':'window-panes';
  }
  api.status=()=>({frames,area:canvas.dataset.area,drops:(canvas.dataset.area==='alley'?drops:windowDrops).slice(0,3).map(d=>({...d})),width:w,height:h});requestAnimationFrame(frame);
})();
