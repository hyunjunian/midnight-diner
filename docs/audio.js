/* Original procedural kitchen foley. No recordings, external samples, or network audio. */
(()=>{'use strict';
  let ctx,master,analyser,enabled=true;const loops=new Map(),plays={};
  try{enabled=localStorage.getItem('midnight-diner-sfx')!=='off';}catch{}
  function unlock(){try{if(!enabled)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!ctx){ctx=new C();master=ctx.createGain();master.gain.value=.36;analyser=ctx.createAnalyser();analyser.fftSize=512;master.connect(analyser);analyser.connect(ctx.destination);}if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}}
  function tone(freq,end,duration,gain=.12,delay=0,type='sine'){if(!ctx)return;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
  function noiseBuffer(duration,kind){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),a=b.getChannelData(0);let low=0;for(let i=0;i<a.length;i++){const n=Math.random()*2-1;low=low*.97+n*.03;const tt=i/ctx.sampleRate;const pulse=kind==='sizzle'?.4+.6*Math.pow(Math.random(),5):kind==='pour'?.5+.25*Math.sin(tt*48)+.25*Math.sin(tt*73):1;a[i]=(kind==='pour'?n*.4+low*4:n)*pulse;}return b;}
  function noise(duration,gain=.13,freq=1800,kind='hit',delay=0){if(!ctx)return;const t=ctx.currentTime+delay,src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noiseBuffer(duration,kind);filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.6;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);src.connect(filter);filter.connect(g);g.connect(master);src.start(t);src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect();};}
  function play(kind){if(!enabled)return;unlock();if(!ctx)return;plays[kind]=(plays[kind]||0)+1;
    if(kind==='cut'){tone(165,72,.095,.18,0,'triangle');noise(.075,.22,2100);tone(1300,700,.05,.015,.018);}
    else if(kind==='cash'){noise(.28,.19,1200);tone(135,70,.13,.16);tone(1660,1640,.5,.075,.09);tone(2210,2180,.45,.045,.15);noise(.11,.07,3600,'hit',.15);}
    else if(kind==='pour'){noise(.38,.2,900,'pour');tone(170,105,.2,.025);}
    else if(kind==='whisk'){noise(.14,.1,1900);tone(440,390,.08,.018);}
    else if(kind==='scoop'){noise(.16,.12,650);tone(620,470,.12,.045);}
    else if(kind==='shape'){noise(.13,.12,400);tone(100,60,.1,.03);}
    else if(kind==='flip'){noise(.3,.18,2300,'sizzle');tone(260,130,.13,.05);}
    else if(kind==='lid'||kind==='door'){tone(260,90,.16,.12,0,'triangle');noise(.09,.13,800);}
    else if(kind==='serve'){tone(820,800,.3,.055);tone(1240,1210,.2,.025,.025);noise(.1,.1,2100);}
    else if(kind==='buy'||kind==='place'){tone(950,930,.13,.045);tone(1350,1320,.2,.04,.07);}
    else if(kind==='report'){[523,659,784,1046].forEach((f,i)=>tone(f,f,.38,.055,i*.09));}
    else if(kind==='open'){noise(.06,.14,1700);tone(520,330,.09,.05);}
  }
  function loop(kind,on,strength=1){if(!enabled||!on){const old=loops.get(kind);if(old){old.src.stop();old.src.disconnect();old.filter.disconnect();old.g.disconnect();loops.delete(kind);}return;}unlock();if(!ctx)return;let node=loops.get(kind);if(!node){const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noiseBuffer(2,kind);src.loop=true;filter.type=kind==='sizzle'?'highpass':'lowpass';filter.frequency.value=kind==='sizzle'?1100:1300;src.connect(filter);filter.connect(g);g.connect(master);src.start();node={src,filter,g};loops.set(kind,node);}node.g.gain.setTargetAtTime((kind==='sizzle'?.085:.11)*Math.max(.15,Math.min(1.6,strength)),ctx.currentTime,.05);}
  function stopCooking(){for(const kind of [...loops.keys()])loop(kind,false);}
  function setEnabled(value){enabled=!!value;try{localStorage.setItem('midnight-diner-sfx',enabled?'on':'off');}catch{}if(!enabled){stopCooking();if(master)master.gain.setValueAtTime(0,ctx.currentTime);}else{unlock();if(master)master.gain.setValueAtTime(.36,ctx.currentTime);}return enabled;}
  function status(){let rms=0;if(analyser){const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);rms=Math.sqrt(a.reduce((n,x)=>n+x*x,0)/a.length);}return{enabled,context:ctx?.state||'not-started',loops:[...loops.keys()],plays:{...plays},rms};}
  window.MidnightAudio={unlock,play,heat:(on,power)=>loop('sizzle',on,power),pour:on=>loop('pour',on),stopCooking,setEnabled,status,get enabled(){return enabled;}};
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCooking();});window.addEventListener('pagehide',stopCooking);
})();
