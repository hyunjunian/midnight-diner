/* Material foley: stochastic filtered excitation, no musical UI oscillator tones.
   Pure render/flowKind exports also support deterministic offline audio checks. */
(function(root){'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function random(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
 const defaults={cut:.16,'paste-scoop':.55,'dry-measure':.55,'liquid-pour':1.1,'egg-pour':.9,'oil-pour':.6,'egg-whisk':.65,'egg-crack':.25,'rice-scoop':.55,'rice-shape':.3,nori:.32,'shell-peel':.3,peel:.35,wash:.32,flip:.45,lid:.3,door:.4,serve:.32,cash:.8,buy:.3,place:.45,report:.7,complete:2.4,open:.15,'arrival-step':.28,'sliding-door':1.1,utensil:.28,'dish-set':.4,eating:.4,traffic:4};
 function normalized(kind){return({pour:'liquid-pour',whisk:'egg-whisk',scoop:'rice-scoop',shape:'rice-shape'})[kind]||kind}
 function flowKind(st){if(st?.mode==='wash')return 'wash';if(st?.id==='beat')return 'whisk';if(st?.mode==='measure')return st.part==='miso'?'paste':['flour','sugar','sesame'].includes(st.part)?'powder':'pour';return st?.id==='pour'&&/달걀|계란|egg|batter/.test(`${st.title||''} ${st.art||''}`)?'batter':st?.id==='oil'?'oil':'pour'}
 function actionKind(st={}){return st.mode==='measure'?(st.part==='miso'?'paste-scoop':['flour','sugar','sesame'].includes(st.part)?'dry-measure':'liquid-pour'):st.mode==='cut'?'cut':st.mode==='wash'?'wash':st.mode==='peel'?(['shrimp','crab'].includes(st.part)?'shell-peel':'peel'):st.mode==='crack'?'egg-crack':st.mode==='fold'||st.id==='wrap'?'nori':st.id==='beat'?'egg-whisk':st.id==='portion'?'rice-scoop':st.id==='shape'?'rice-shape':['pour','broth'].includes(st.id)?(flowKind(st)==='batter'?'egg-pour':'liquid-pour'):st.id==='oil'?'oil-pour':st.id==='lid'?'lid':'serve'}
 function render(kind,seconds=defaults[normalized(kind)]||1,rate=44100,seed=Date.now(),looping=false){
  kind=normalized(kind);const rng=random(seed),out=new Float32Array(Math.ceil(rate*seconds));let low=0,body=0,smooth=0,slow=0;
  const is=(...names)=>names.includes(kind),continuous=is('sizzle','boil','rain','room','paste','powder','pour','batter','oil','traffic');
  // Continuous sources have random envelopes instead of a recognisable short sine cycle.
  let drift=0,driftTarget=0,driftCountdown=0;
  for(let i=0;i<out.length;i++){
   const n=rng()*2-1,t=i/rate;low+=.009*(n-low);body+=.12*(n-body);smooth+=.4*(n-smooth);slow+=.0005*(n-slow);
   if(--driftCountdown<=0){driftTarget=.6+rng()*.8;driftCountdown=rate*(.04+rng()*.18)}drift+=(driftTarget-drift)*.001;
   const hi=n-smooth;let v=0;
   if(is('rain'))v=(smooth*.32+body*.17+hi*.075)*drift;
   else if(is('room'))v=(low*.38+body*.014)*(.8+Math.abs(slow)*4);
   else if(is('traffic'))v=(low*.7+body*.045)*Math.sin(Math.PI*t/seconds)**2;
   else if(is('sizzle','flip'))v=(hi*.035+body*.05)*drift;
   else if(is('boil'))v=(low*.4+body*.055)*drift;
   else if(is('pour','liquid-pour','wash'))v=(body*.23+smooth*.055+hi*.018)*drift;
   else if(is('batter','egg-pour'))v=(low*.8+body*.035)*drift;
   else if(is('oil','oil-pour'))v=(low*.16+body*.025)*drift;
   else if(is('paste','paste-scoop','rice-shape','rice-scoop'))v=(low*.65+body*.025)*drift;
   else if(is('powder','dry-measure','nori','peel','shell-peel'))v=(body*.22+hi*.05)*drift;
   else if(is('egg-whisk','eating'))v=(body*.2+low*.25)*drift;
   else if(is('sliding-door'))v=(body*.14+low*.25)*Math.sin(Math.PI*t/seconds)**.7;
   out[i]=v;
  }
  // Tiny damped cavity events excite liquid, oil and ceramic resonances. No pitch sweeps.
  function burst(at,duration,level,band=600,tone=0){const start=Math.floor(at*rate),len=Math.floor(duration*rate);let lp=0;const k=1-Math.exp(-2*Math.PI*band/rate);for(let j=0;j<len&&start+j<out.length;j++){if(start+j<0)continue;const n=rng()*2-1;lp+=k*(n-lp);const env=(1-Math.exp(-j/(rate*.0015)))*Math.exp(-j/(len*.22));out[start+j]+=(lp*(1-tone)+Math.sin(j/rate*2*Math.PI*band)*tone)*env*level}}
  function grains(count,dur,level,band){for(let k=0;k<count;k++)burst(rng()*Math.max(0,seconds-dur),dur*(.6+rng()*.8),level*(.5+rng()*.7),band*(.6+rng()*.8))}
  if(is('pour','liquid-pour','wash')){grains(seconds*34,.045,.19,1100);grains(seconds*7,.06,.15,400)}
  else if(is('batter','egg-pour'))grains(seconds*5,.1,.32,150);
  else if(is('oil','oil-pour'))grains(seconds*3,.06,.09,250);
  else if(is('boil')){grains(seconds*18,.09,.29,220);grains(seconds*8,.045,.11,650)}
  else if(is('sizzle','flip'))grains(seconds*60,.014,.21,4500);
  else if(is('paste','paste-scoop')){grains(seconds*6,.12,.24,130);if(!looping)burst(.04,.18,.13,850)}
  else if(is('egg-whisk')){for(let t=.03;t<seconds;t+=.09+rng()*.08){burst(t,.1,.24,500);burst(t+.015,.025,.04,1900,.25)}}
  else if(is('cut')){burst(.015,.035,.9,2400);burst(.025,.08,.48,140,.22);burst(.005,.045,.13,500)}
  else if(is('egg-crack')){burst(.02,.025,.55,3600);burst(.055,.03,.25,2300);burst(.11,.12,.2,260)}
  else if(is('rice-scoop')){grains(4,.07,.12,700);burst(.1,.15,.16,160)}
  else if(is('rice-shape'))burst(.035,.15,.25,180);
  else if(is('nori','shell-peel'))grains(16,.018,.13,4000);
  else if(is('arrival-step')){burst(.015,.13,.42,120,.2);burst(.026,.045,.14,1400)}
  else if(is('sliding-door')){burst(.05,.12,.14,280);burst(seconds-.15,.12,.25,160,.1)}
  else if(is('lid','door','open')){burst(.015,.06,.33,650);burst(.04,.12,.18,180,.2)}
  else if(is('cash')){grains(6,.08,.11,1600);burst(.02,.12,.25,160);burst(.26,.32,.055,2400,.4);burst(.3,.3,.04,3100,.35)}
  else if(is('serve','utensil','dish-set')){burst(.025,.04,.16,800);burst(.04,.17,.038,1900,.42);if(kind==='utensil')burst(.12,.08,.04,3100,.3)}
  else if(is('eating')){grains(3,.04,.045,550);burst(.23,.05,.022,1800,.15)}
  else if(is('buy','place','report')){burst(.03,.1,.19,280);burst(.1,.12,.10,650);if(kind==='report')burst(.3,.12,.14,180)}
  if(kind==='complete'){for(const [start,freq,level]of [[0,784,.18],[.13,988,.15],[.27,1174.66,.14],[.44,1568,.1]])for(let j=0;j<rate*.72&&Math.floor(start*rate)+j<out.length;j++){const t=j/rate,env=(1-Math.exp(-t*180))*Math.exp(-t*7);out[Math.floor(start*rate)+j]+=level*env*(Math.sin(2*Math.PI*freq*t)+.17*Math.sin(2*Math.PI*freq*2*t));}}
  const fade=Math.min(Math.floor(rate*(looping?.03:.016)),Math.floor(out.length/2));let peak=0;
  for(let i=0;i<out.length;i++){if(i<fade)out[i]*=i/fade;if(i>=out.length-fade)out[i]*=(out.length-i-1)/fade;if(!looping&&!continuous)out[i]*=Math.min(1,(out.length-i)/(rate*.05));peak=Math.max(peak,Math.abs(out[i]))}
  // Conservatively cap peaks before the master bus; never normalize tiny ambience to full scale.
  const gain=peak>.82?.82/peak:1;for(let i=0;i<out.length;i++)out[i]*=gain;
  return out;
 }
 const pure={render,flowKind,actionKind,defaults};if(typeof module!=='undefined'&&module.exports){module.exports=pure;return}
 let ctx,master,analyser,compressor,enabled=true,activated=false;const loops=new Map(),plays={},active=new Set(),cache=new Map();try{enabled=localStorage.getItem('midnight-diner-sfx')!=='off'}catch{}
 const sampleFiles={complete:'complete-furin-v24.wav',whisk:'whisk-v24.wav','egg-whisk':'whisk-v24.wav',sizzle:'fry-v24.wav',flip:'fry-v24.wav',cut:'cut-v24.wav','rice-scoop':'rice-utensil-v24.wav',paste:'paste-v23.wav','paste-scoop':'paste-v23.wav',pour:'pour-v22.wav','liquid-pour':'pour-v22.wav',batter:'pour-v22.wav','egg-pour':'pour-v22.wav',oil:'pour-v22.wav','oil-pour':'pour-v22.wav',wash:'wash-v24.wav',boil:'boil-v22.wav'};
 const encoded=new Map(),decoded=new Map(),decoding=new Set(),sampleErrors=[];
 const sampleRoot=new URL('./assets/sfx/',document.currentScript.src);
 function primeSamples(){if(!ctx)return;for(const [file,bytes]of encoded)if(!decoded.has(file)&&!decoding.has(file)){decoding.add(file);ctx.decodeAudioData(bytes.slice(0)).then(b=>decoded.set(file,b)).catch(()=>sampleErrors.push(file));}}
 const sampleReady=Promise.all([...new Set(Object.values(sampleFiles))].map(async file=>{try{const r=await fetch(new URL(file,sampleRoot));if(!r.ok)throw new Error();encoded.set(file,await r.arrayBuffer());primeSamples();}catch{sampleErrors.push(file);}}));
 const silentBackground=new Set(['rain','room','traffic','eating','utensil','dish-set','arrival-step','sliding-door']);
 function usable(){return activated&&enabled&&!document.hidden&&!document.getElementById('intro')?.open&&!document.getElementById('app')?.hidden}
 function unlock(event){if(event?.isTrusted||navigator.userActivation?.hasBeenActive)activated=true;if(!activated||!enabled)return;try{const C=root.AudioContext||root.webkitAudioContext;if(!C)return;if(!ctx){ctx=new C();master=ctx.createGain();master.gain.value=.55;compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-13;compressor.knee.value=15;compressor.ratio.value=3;analyser=ctx.createAnalyser();analyser.fftSize=1024;master.connect(compressor);compressor.connect(analyser);analyser.connect(ctx.destination)}primeSamples();if(ctx.state==='suspended')ctx.resume().catch(()=>{})}catch{}}
 function makeBuffer(kind,duration,looping=false){if(sampleFiles[kind])return decoded.get(sampleFiles[kind]);const key=`${kind}/${duration}/${looping}`;if(looping&&cache.has(key))return cache.get(key);const a=render(kind,duration,ctx.sampleRate,Math.random()*0xffffffff,looping),b=ctx.createBuffer(1,a.length,ctx.sampleRate);b.copyToChannel(a,0);if(looping)cache.set(key,b);return b}
 function source(kind,duration,gain,pan=0,looping=false,ambient=false){const src=ctx.createBufferSource(),g=ctx.createGain(),p=ctx.createStereoPanner?.();src.buffer=makeBuffer(kind,duration,looping);if(!src.buffer)return null;src.loop=looping;g.gain.value=gain;if(['batter','egg-pour','oil','oil-pour'].includes(kind)){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=kind.includes('oil')?1900:2600;src.connect(f);f.connect(g);src.playbackRate.value=kind.includes('oil')?.95:.9;}else src.connect(g);if(p){p.pan.value=clamp(pan,-.9,.9);g.connect(p);p.connect(master)}else g.connect(master);const node={src,g,p,ambient,stop(){try{src.stop()}catch{}src.disconnect();g.disconnect();p?.disconnect();active.delete(node)}};active.add(node);src.onended=()=>{src.disconnect();g.disconnect();p?.disconnect();active.delete(node)};if(looping)src.start();else{const t=ctx.currentTime,d=Math.min(duration,src.buffer.duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.015);g.gain.setValueAtTime(gain,t+Math.max(.02,d-.06));g.gain.linearRampToValueAtTime(0,t+d);src.start(0,0,d);}return node}
 function play(kind,options={}){if(!usable()||options.ambient||silentBackground.has(kind))return;unlock();if(!ctx||ctx.state!=='running'||sampleFiles[kind]&&!decoded.has(sampleFiles[kind]))return;plays[kind]=(plays[kind]||0)+1;return source(kind,defaults[normalized(kind)]||.35,clamp(options.gain??.72,0,1.4),options.pan||0,false,!!options.ambient)}
 function stopLoop(key){const node=loops.get(key);if(node){node.stop();loops.delete(key)}}
 function loop(kind,on,strength=1,ambient=false,pan=0){const key=ambient?`ambient:${kind}`:kind;if(!on||!usable()||ambient||silentBackground.has(kind)){stopLoop(key);return}unlock();if(!ctx||ctx.state!=='running')return;let node=loops.get(key);if(!node){node=source(kind,ambient?13.7:6.7,0,pan,true,ambient);if(!node)return;loops.set(key,node)}const level=ambient?strength:(kind==='boil'?.85:kind==='sizzle'?.6:kind==='batter'?.85:kind==='paste'?.55:.7)*clamp(strength,.12,1.4);node.g.gain.setTargetAtTime(level,ctx.currentTime,ambient?1.2:.07);if(node.p)node.p.pan.setTargetAtTime(pan,ctx.currentTime,.3);if(!ambient)node.src.playbackRate.setTargetAtTime(.9+clamp(strength,0,1.4)*.12,ctx.currentTime,.1)}
 function stopCooking(){for(const key of [...loops.keys()])if(!key.startsWith('ambient:'))stopLoop(key)}
 function stopAmbient(){for(const node of [...active])if(node.ambient)node.stop();for(const key of [...loops.keys()])if(key.startsWith('ambient:'))loops.delete(key)}
 function stopAll(){for(const node of [...active])node.stop();loops.clear()}
 function heat(on,power,mode='sizzle'){const kind=mode==='boil'?'boil':'sizzle';loop(kind==='boil'?'sizzle':'boil',false);loop(kind,on,power)}
 function flow(st,on){const kind=flowKind(st);for(const other of ['paste','powder','pour','batter','oil','whisk','wash'])loop(other,on&&other===kind)}
 function action(st){if(st?.id==='beat'||st?.mode==='wash')return;if(st?.mode==='measure'&&!['miso','flour','sugar','sesame'].includes(st.part)||['pour','broth'].includes(st?.id))return;play(actionKind(st))}
 function setEnabled(value){enabled=!!value;try{localStorage.setItem('midnight-diner-sfx',enabled?'on':'off')}catch{}if(!enabled){stopAll();if(master)master.gain.value=0}else{unlock();if(master)master.gain.value=.55}root.dispatchEvent(new Event('midnight-audio-change'));return enabled}
 function status(){let rms=0;if(analyser){const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);rms=Math.sqrt(a.reduce((n,x)=>n+x*x,0)/a.length)}return{enabled,samples:[...decoded.keys()],sampleErrors:[...sampleErrors],activated,context:ctx?.state||'not-started',loops:[...loops.keys()],plays:{...plays},rms}}
 root.MidnightAudio={unlock,play,action,heat,flow,pour:on=>loop('pour',on),stopCooking,stopAll,stopAmbient,setEnabled,status,get enabled(){return enabled}};
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll()});root.addEventListener('pagehide',stopAll);
})(typeof window!=='undefined'?window:globalThis);
