/* Authoritative restaurant clock and scene-only night → dawn lighting. */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function minutes(state={}){
    if(state.phase==='prep')return 1430;
    if(state.phase==='end')return 420;
    const elapsed=Number.isFinite(state.nightElapsedMs)?Math.max(0,state.nightElapsedMs):0;
    const paid=Array.isArray(state.nightScores)?state.nightScores.length:0,target=Math.max(1,Number(state.target)||9);
    return Math.min(405,Math.max(30+elapsed/1500,30+paid/target*390));
  }
  const keys=[
    [30,.96,.008,0,1],[150,.72,.035,0,1],[240,.77,.055,.015,1],
    [300,.94,.09,.11,1],[330,1.05,.1,.22,.55],[360,1.14,.08,.32,0],
    [405,1.21,.055,.4,0],[420,1.23,.045,.42,0]
  ];
  function sample(minute){
    const m=clamp(minute,30,420);let a=keys[0],b=keys[1];
    for(let i=1;i<keys.length;i++){b=keys[i];if(m<=b[0])break;a=b;}
    const f=clamp((m-a[0])/(b[0]-a[0]||1)),u=f*f*(3-2*f),mix=i=>a[i]+(b[i]-a[i])*u;
    return {minutes:m,brightness:mix(1),blue:mix(2),dawn:mix(3),street:mix(4),period:m<240?'night':m<315?'predawn':'dawn'};
  }
  const api={minutes,sample};if(typeof module!=='undefined'){module.exports=api;return;}window.MidnightDaylight=api;
  const world=document.getElementById('scene-world'),scene=document.getElementById('scene');if(!world||!scene)return;
  const canvas=document.createElement('canvas');canvas.id='scene-daylight';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;world.insertBefore(canvas,document.getElementById('decorations'));
  const off=document.createElement('div');off.className='daylight-street-off';off.setAttribute('aria-hidden','true');world.insertBefore(off,canvas);
  const glow=document.createElement('div');glow.className='daylight-street-glow';glow.setAttribute('aria-hidden','true');world.insertBefore(glow,canvas);
  let current={phase:'prep'},w=0,h=0,lighting=sample(30);
  function paint(){
    ctx.clearRect(0,0,w,h);if(current.phase==='prep')return;
    const q=lighting,outside=world.classList.contains('exterior-world');
    if(outside){
      // The wet alley gradually receives broad overcast sky light; no fake sun disk.
      const g=ctx.createLinearGradient(0,0,w*.25,h);g.addColorStop(0,`rgba(212,229,237,${q.dawn})`);g.addColorStop(.48,`rgba(201,218,223,${q.dawn*.63})`);g.addColorStop(1,`rgba(228,219,197,${q.dawn*.3})`);
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      ctx.fillStyle=`rgba(29,64,98,${q.blue})`;ctx.fillRect(0,0,w,h);
    }else{
      // Light enters through actual glass, leaving the wooden lattice and customers intact.
      const panes=window.MidnightRain?.panes||[];
      ctx.save();ctx.beginPath();for(const [x,y,a,b]of panes)ctx.rect(x*w,y*h,a*w,b*h);ctx.clip();
      const g=ctx.createLinearGradient(0,h*.3,0,h*.48);g.addColorStop(0,`rgba(195,221,234,${q.dawn*.92})`);g.addColorStop(1,`rgba(228,224,203,${q.dawn*.58})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.restore();
      // A very soft pool from the window stays on the rear work surface, behind the bar.
      if(q.dawn){const g=ctx.createRadialGradient(w*.53,h*.48,0,w*.53,h*.48,w*.2);g.addColorStop(0,`rgba(178,204,216,${q.dawn*.15})`);g.addColorStop(1,'rgba(178,204,216,0)');ctx.fillStyle=g;ctx.fillRect(w*.32,h*.35,w*.42,h*.25);}
    }
  }
  function update(state){
    current=state||current;lighting=sample(minutes(current));const q=lighting;
    scene.classList.toggle('daylight-active',current.phase!=='prep');scene.dataset.sky=current.phase==='prep'?'closed':q.period;
    scene.style.setProperty('--alley-brightness',q.brightness.toFixed(4));
    // Each authored theme has a registered unlit counterpart. Only the existing bulbs
    // and their immediate wall pools are masked; this never grants a decoration.
    const art=world.querySelector('.exterior-art');off.style.backgroundImage=art?.style.getPropertyValue('--exterior-closed-image')||"url('./assets/exterior-closed-v19.webp')";
    off.style.opacity=current.phase==='prep'?'0':String(1-q.street);glow.style.opacity=current.phase==='prep'?'0':String(q.street*.55);paint();
  }
  function resize(){w=world.clientWidth;h=world.clientHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);paint();}
  new ResizeObserver(resize).observe(world);
  new MutationObserver(paint).observe(world,{attributes:true,attributeFilter:['class']});
  api.update=update;api.status=()=>({...lighting,minutes:minutes(current),phase:current.phase,width:w,height:h});resize();update(current);
})();
