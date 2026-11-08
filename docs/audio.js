/* Original physical foley models: wet bubbles, thick paste, dry grains and hot oil. */
(()=>{'use strict';
 let ctx,master,analyser,enabled=true;const loops=new Map(),plays={};try{enabled=localStorage.getItem('midnight-diner-sfx')!=='off'}catch{}
 function unlock(){try{if(!enabled)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!ctx){ctx=new C();master=ctx.createGain();master.gain.value=.48;analyser=ctx.createAnalyser();analyser.fftSize=1024;master.connect(analyser);analyser.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume().catch(()=>{})}catch{}}
 function buffer(kind,seconds){const rate=ctx.sampleRate,b=ctx.createBuffer(1,Math.ceil(rate*seconds),rate),a=b.getChannelData(0);let low=0,mid=0;for(let i=0;i<a.length;i++){const n=Math.random()*2-1,t=i/rate;low=.985*low+.015*n;mid=.7*mid+.3*n;const swish=.55+.3*Math.sin(t*32)+.15*Math.sin(t*59);a[i]=kind==='sizzle'?(n-mid)*(.12+Math.pow(Math.random(),15)*1.8):kind==='powder'?mid*.5+low*2:kind==='paste'?low*3.4*(.3+.7*Math.pow(Math.sin(t*12),2)):kind==='boil'?low*.7+(n-mid)*.025:kind==='whisk'?(mid*.3+low*2)*swish:kind==='pour'?(mid*.24+low*1.9)*(.6+.4*Math.sin(t*47)**2):mid*.6;}
  if(['pour','boil','whisk','wash','paste'].includes(kind)){const density=kind==='boil'?15:kind==='pour'?25:kind==='paste'?5:11;for(let k=0;k<seconds*density;k++){const start=Math.floor(Math.random()*(a.length-rate*.1)),freq=kind==='paste'?85+Math.random()*100:kind==='boil'?130+Math.random()*440:350+Math.random()*1100,dur=kind==='paste'?.09:.025+Math.random()*.045;for(let j=0;j<rate*dur&&start+j<a.length;j++){const t=j/rate,env=Math.sin(Math.PI*t/dur)*Math.exp(-t*(kind==='paste'?28:65));a[start+j]+=Math.sin(2*Math.PI*(freq*t+freq*7*t*t))*env*(kind==='boil'?.22:kind==='paste'?.4:.13)}}}
  const fade=Math.floor(rate*.008);for(let i=0;i<fade;i++){a[i]*=i/fade;a[a.length-1-i]*=i/fade}return b;
 }
 function texture(kind,duration=.25,gain=.7,freq=1600){if(!ctx)return;const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer(kind,duration);f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(gain,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);src.connect(f);f.connect(g);g.connect(master);src.start();src.onended=()=>{src.disconnect();f.disconnect();g.disconnect()}}
 function resonance(freq,duration,gain,delay=0){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.72,t+duration);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(gain,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(master);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect()}}
 function play(kind){if(!enabled)return;unlock();if(!ctx)return;plays[kind]=(plays[kind]||0)+1;
  if(kind==='cut'){texture('hit',.08,.9,2500);resonance(170,.045,.13)}
  else if(kind==='paste-scoop'){texture('paste',.46,.8,700);texture('hit',.16,.13,900)}
  else if(kind==='dry-measure'){texture('powder',.45,.7,1800)}
  else if(kind==='pour'||kind==='liquid-pour'){texture('pour',.7,.8,2400)}
  else if(kind==='whisk'||kind==='egg-whisk'){texture('whisk',.22,.8,2000);resonance(1580,.035,.012)}
  else if(kind==='egg-crack'){texture('hit',.06,.6,3800);texture('pour',.2,.3,1300)}
  else if(kind==='scoop'||kind==='rice-scoop'){texture('paste',.23,.35,800);texture('powder',.19,.3,1200)}
  else if(kind==='shape'||kind==='rice-shape'){texture('paste',.18,.42,450)}
  else if(kind==='nori'){texture('powder',.24,.8,4200)}
  else if(kind==='shell-peel'){texture('paste',.2,.28,1100);texture('hit',.07,.25,2800)}
  else if(kind==='peel'){texture('powder',.28,.5,1200);texture('hit',.09,.14,900)}
  else if(kind==='wash'){texture('wash',.55,.85,2200)}
  else if(kind==='flip'){texture('sizzle',.4,.85,6500);texture('hit',.1,.2,900)}
  else if(kind==='lid'||kind==='door'){texture('hit',.12,.6,1500);resonance(180,.08,.1)}
  else if(kind==='serve'){resonance(1250,.14,.035);texture('hit',.08,.2,2500)}
  else if(kind==='cash'){texture('hit',.32,.6,1800);resonance(140,.09,.12);resonance(1700,.45,.055,.1);resonance(2250,.32,.035,.17)}
  else if(kind==='buy'||kind==='place'){resonance(1000,.12,.04);resonance(1450,.18,.025,.08)}
  else if(kind==='report'){[523,659,784,1046].forEach((v,i)=>resonance(v,.3,.04,i*.09))}
  else if(kind==='open'){texture('hit',.07,.5,2200)}
 }
 function loop(kind,on,strength=1){if(!enabled||!on){const node=loops.get(kind);if(node){node.src.stop();node.src.disconnect();node.f.disconnect();node.g.disconnect();loops.delete(kind)}return}unlock();if(!ctx)return;let node=loops.get(kind);if(!node){const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer(kind,2.3);src.loop=true;f.type='lowpass';f.frequency.value=kind==='sizzle'?8500:kind==='paste'?700:kind==='powder'?1900:2600;src.connect(f);f.connect(g);g.connect(master);src.start();node={src,f,g};loops.set(kind,node)}node.g.gain.setTargetAtTime((kind==='boil'?.8:kind==='paste'?.5:.65)*Math.max(.2,Math.min(1.4,strength)),ctx.currentTime,.08);node.src.playbackRate.setTargetAtTime(.8+Math.min(1.6,strength)*.25,ctx.currentTime,.1)}
 function stopCooking(){for(const kind of [...loops.keys()])loop(kind,false)}
 function heat(on,power,mode='sizzle'){const kind=mode==='boil'?'boil':'sizzle';loop(kind==='boil'?'sizzle':'boil',false);loop(kind,on,power)}
 function flow(st,on){const kind=st?.mode==='measure'&&st.part==='miso'?'paste':st?.mode==='measure'&&['flour','sugar'].includes(st.part)?'powder':'pour';for(const other of ['paste','powder','pour'])loop(other,on&&other===kind)}
 function action(st){play(st.mode==='measure'?(st.part==='miso'?'paste-scoop':['flour','sugar'].includes(st.part)?'dry-measure':'liquid-pour'):st.mode==='cut'?'cut':st.mode==='wash'?'wash':st.mode==='peel'?(['shrimp','crab'].includes(st.part)?'shell-peel':'peel'):st.mode==='crack'?'egg-crack':st.mode==='fold'||st.id==='wrap'?'nori':st.id==='beat'?'egg-whisk':st.id==='portion'?'rice-scoop':st.id==='shape'?'rice-shape':['pour','broth'].includes(st.id)?'liquid-pour':st.id==='lid'?'lid':'serve')}
 function setEnabled(value){enabled=!!value;try{localStorage.setItem('midnight-diner-sfx',enabled?'on':'off')}catch{}if(!enabled){stopCooking();if(master)master.gain.value=0}else{unlock();if(master)master.gain.value=.48}return enabled}
 function status(){let rms=0;if(analyser){const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);rms=Math.sqrt(a.reduce((n,x)=>n+x*x,0)/a.length)}return{enabled,context:ctx?.state||'not-started',loops:[...loops.keys()],plays:{...plays},rms}}
 window.MidnightAudio={unlock,play,action,heat,flow,pour:on=>loop('pour',on),stopCooking,setEnabled,status,get enabled(){return enabled}};document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCooking()});window.addEventListener('pagehide',stopCooking);
})();
