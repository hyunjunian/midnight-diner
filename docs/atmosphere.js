/* Scene-only steam and localized fixture light. The approved intro is untouched. */
(() => {
  'use strict';
  const hash=n=>{const v=Math.sin(n*127.1+17.31)*43758.5453;return v-Math.floor(v);};
  function wisp(t,id){
    const life=4.5+hash(id+3)*2.8,u=((t+hash(id+9)*life)%life)/life;
    return {x:.268+(hash(id+2)-.5)*.027+Math.sin(u*6+id)*(.003+u*.012),
      y:.526-u*.175,r:.003+u*.014,alpha:Math.sin(Math.PI*u)*(.17+hash(id+7)*.12)};
  }
  const api={wisp};if(typeof module!=='undefined'){module.exports=api;return;}window.MidnightAtmosphere=api;
  const world=document.getElementById('scene-world'),scene=document.getElementById('scene'),app=document.getElementById('app');if(!world||!scene)return;
  const canvas=document.createElement('canvas');canvas.id='scene-atmosphere';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  world.insertBefore(canvas,document.getElementById('decorations'));world.classList.add('atmosphere-ready');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let w=0,h=0,last=0,frames=0,lights=0,steam=0,opening=0,openedAt=null;
  let fixtures=[],dirty=true;
  new MutationObserver(()=>dirty=true).observe(document.getElementById('decorations'),{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  function resize(){w=world.clientWidth;h=world.clientHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;}
  new ResizeObserver(resize).observe(world);resize();
  function halo(x,y,r,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,199,104,${alpha})`);g.addColorStop(.35,`rgba(255,181,77,${alpha*.45})`);g.addColorStop(1,'rgba(255,168,64,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function frame(now){requestAnimationFrame(frame);if(now-last<1000/24)return;last=now;ctx.clearRect(0,0,w,h);steam=0;lights=0;
    // Darkness is physical before opening; neither smoke nor purchased lamps leak light.
    if(document.hidden||app?.hidden||scene.classList.contains('is-prep')||!world.getClientRects().length){opening=0;openedAt=null;return;}
    openedAt??=now;opening=Math.min(1,(now-openedAt)/1350);
    if(dirty){fixtures=[...world.querySelectorAll('.slot-lantern,.slot-andon')];dirty=false;}
    const outside=world.classList.contains('exterior-world'),t=now/1000;
    for(const el of fixtures){
      if(el.classList.contains('placement-pending')||!el.isConnected||!el.offsetWidth)continue;
      if(outside!==el.classList.contains('slot-andon'))continue;
      const x=el.offsetLeft+el.offsetWidth*.5,y=el.offsetTop+el.offsetHeight*(outside?.5:.73);
      const shimmer=reduced.matches?1:1+Math.sin(t*.9+el.offsetLeft)*.035;
      halo(x,y,w*(outside?.082:.067),opening*.16*shimmer);lights++;
      // Dust is visible only inside this lamp's own small pool of light.
      if(!reduced.matches&&!outside)for(let i=0;i<5;i++){
        const phase=(t*.055+hash(i+el.offsetLeft))%1,dx=Math.sin(t*.3+i)*w*.012;
        ctx.fillStyle=`rgba(255,226,166,${Math.sin(Math.PI*phase)*.28*opening})`;
        ctx.beginPath();ctx.arc(x+dx+(hash(i+31)-.5)*w*.06,y+phase*h*.09,w*.0008,0,Math.PI*2);ctx.fill();
      }
    }
    if(!outside&&!reduced.matches){
      ctx.save();ctx.globalCompositeOperation='screen';
      for(let i=0;i<15;i++){
        const p=wisp(t,i),x=p.x*w,y=p.y*h,r=p.r*w;
        const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(226,222,202,${p.alpha*opening})`);g.addColorStop(.5,`rgba(216,216,204,${p.alpha*.35*opening})`);g.addColorStop(1,'rgba(216,216,204,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r*.72,r*1.4,Math.sin(t*.3+i)*.3,0,Math.PI*2);ctx.fill();steam++;
      }ctx.restore();
    }
    canvas.dataset.area=outside?'alley':'room';canvas.dataset.frames=String(++frames);
  }
  api.status=()=>({frames,lights,steam,opening,area:canvas.dataset.area,width:w,height:h,reduced:reduced.matches});requestAnimationFrame(frame);
})();
