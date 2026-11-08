/* A quiet room around the player. No speech, artificial crowd loops or mouth sounds. */
(()=>{'use strict';
 const FX=window.MidnightAudio;if(!FX)return;
 const clock=()=>performance.now(),rand=(a,b)=>a+Math.random()*(b-a),known=new Set(),diners=new Map();
 let ready=false,running=false,lastArrival=-Infinity,nextTraffic=0,nextRoom=0,lastDetail=-Infinity,arrivalTimers=[],scanTimer;
 const counts={arrivals:0,utensils:0,eating:0,traffic:0,room:0};
 function state(){const app=document.getElementById('app'),scene=document.getElementById('scene');const paused=document.hidden||!app||app.hidden||document.getElementById('intro')?.open||document.getElementById('settings-dialog')?.open||document.getElementById('reset-dialog')?.open;return{live:!paused&&FX.enabled&&FX.ambientEnabled&&FX.status().activated,outside:!!scene?.classList.contains('outside'),kitchen:!!app?.classList.contains('in-kitchen'),prep:!!scene?.classList.contains('is-prep'),speaking:!!window.speechSynthesis?.speaking}}
 function event(kind,gain,pan){const s=state();if(!s.live)return;FX.play(kind,{gain,pan,ambient:true})}
 function cancelArrival(){for(const id of arrivalTimers)clearTimeout(id);arrivalTimers=[]}
 function arrival(seat){const s=state(),now=clock();if(!s.live||s.prep||now-lastArrival<2600)return;lastArrival=now;counts.arrivals++;const endPan=[-.55,0,.5][seat]||0;event('sliding-door',s.outside?.29:.22,.72);for(let i=0;i<3;i++)arrivalTimers.push(setTimeout(()=>event('arrival-step',(s.outside?.18:.24)*(1-i*.1),.7+(endPan-.7)*(i+1)/3),280+i*310+rand(-25,40)))}
 function syncGuests(){const guests=[...document.querySelectorAll('#customers .customer')],ids=new Set();for(const g of guests){const id=g.dataset.customer;if(!id)continue;ids.add(id);if(!known.has(id)){known.add(id);if(ready&&g.classList.contains('arriving'))arrival(Number((g.className.match(/seat-(\d+)/)||[])[1]||0))}if(g.classList.contains('dining')){if(!diners.has(id))diners.set(id,{at:clock()+rand(2000,3500),pan:[-.55,0,.55][Number((g.className.match(/seat-(\d+)/)||[])[1]||0)]||0})}else diners.delete(id)}for(const id of [...known])if(!ids.has(id)){known.delete(id);diners.delete(id)}ready=true}
 function pause(){FX.stopAmbient();cancelArrival();running=false}
 function tick(){syncGuests();const s=state(),now=clock();if(!s.live){pause();return}if(!running){running=true;nextTraffic=now+rand(12000,25000);nextRoom=now+rand(7000,18000);for(const d of diners.values())d.at=now+rand(2000,3500)}
  const duck=s.speaking?.35:1;FX.ambient('rain',true,(s.outside?.23:s.kitchen?.10:.12)*duck,s.outside?0:.25);FX.ambient('room',!s.outside,(s.prep?.15:s.kitchen?.16:.21)*duck,0);
  if(now>nextTraffic){nextTraffic=now+rand(26000,55000);counts.traffic++;event('traffic',(s.outside?.19:.065)*duck,rand(-.65,.65))}
  if(!s.outside&&!s.prep&&now>nextRoom&&now-lastDetail>3500){nextRoom=now+rand(16000,34000);counts.room++;lastDetail=now;event('dish-set',(s.kitchen?.07:.11)*duck,rand(-.6,.6))}
  if(!s.outside)for(const d of diners.values()){if(now<d.at||now-lastDetail<3200)continue;d.at=now+rand(4500,8500);const eat=Math.random()<.32,kind=eat?'eating':'utensil';counts[eat?'eating':'utensils']++;lastDetail=now;event(kind,(s.kitchen?.08:.18)*duck,d.pan);break}
 }
 function schedule(){if(scanTimer)return;scanTimer=setTimeout(()=>{scanTimer=null;tick()},50)}
 function lifecycleChange(record){const e=record.target;if(record.type==='childList')return e.id==='customers';if(['intro','settings-dialog','reset-dialog'].includes(e.id))return record.attributeName==='open'||record.attributeName==='hidden';if(e.id==='app'&&record.attributeName==='hidden')return true;const before=(record.oldValue||'').split(/\s+/),changed=flag=>before.includes(flag)!==e.classList.contains(flag);if(e.id==='app')return changed('in-kitchen');if(e.id==='scene')return changed('outside')||changed('is-prep');return e.classList?.contains('customer')&&(changed('dining')||changed('arriving'))}
 const observer=new MutationObserver(records=>{if(records.some(lifecycleChange))schedule()});observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','hidden','open']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else schedule()});document.addEventListener('pointerdown',schedule,{passive:true});document.addEventListener('keydown',schedule);window.addEventListener('midnight-audio-change',schedule);window.addEventListener('pagehide',pause);setInterval(tick,700);tick();
 window.MidnightSoundscape={status:()=>({running,known:known.size,diners:diners.size,counts:{...counts},...state()}),stop:pause};
})();
