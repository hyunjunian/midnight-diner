(() => {
 'use strict';
 const M=window.RenovationDesign,$=s=>document.querySelector(s),areas=['inside','outside'],n=v=>v.toLocaleString('ko-KR');
 let state=M.showcase(1),busy=false,soundEnabled=true,audioContext;
 const path=(area,level)=>`assets/${area}-${String(level).padStart(2,'0')}.webp`;
 const imageCache=new Map();
 function loadImage(url){if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{imageCache.delete(url);reject(Error('이미지를 불러오지 못했습니다. 캐쉬는 차감되지 않았습니다.'));};image.src=url;}));return imageCache.get(url);}
 function context(){if(!soundEnabled)return null;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();return audioContext;}catch{return null;}}
 function swoosh(){const a=context();if(!a)return;const now=a.currentTime,len=Math.floor(a.sampleRate*.85),b=a.createBuffer(1,len,a.sampleRate),v=b.getChannelData(0);for(let i=0;i<len;i++)v[i]=(Math.random()*2-1)*.4;const source=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain();source.buffer=b;filter.type='bandpass';filter.frequency.setValueAtTime(600,now);filter.frequency.exponentialRampToValueAtTime(5500,now+.65);filter.Q.value=.7;gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(.12,now+.15);gain.gain.exponentialRampToValueAtTime(.001,now+.85);source.connect(filter).connect(gain).connect(a.destination);source.start(now);source.stop(now+.9);}
 function chime(){const a=context();if(!a)return;[659.25,830.61,987.77,1318.51].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+i*.085;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.07,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.58);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.62);});}
 function render(){
  $('#player-level').textContent=`Lv${state.level}`;$('#cash').textContent=n(state.cash);$('#atmosphere').textContent=`+${state.atmosphere}`;$('#environment').textContent=`+${state.environment}`;
  for(const area of areas){const u=M.next(state,area),check=M.eligibility(state,area),button=$(`[data-buy="${area}"]`);$(`#${area}-current`).src=path(area,state[area]);$(`#${area}-current`).alt=`Lv${state[area]} ${area==='inside'?'내부':'외부'} 개선 상태`;
   $(`#${area}-title`).textContent=u?`${u.zone} · ${u.name}`:'50단계 개선 완료';
   $(`#${area}-requirement`).textContent=u?`필요 레벨 Lv${u.level} · ${n(u.cost)} 캐쉬`:'모든 개보수를 마쳤습니다.';
   $(`#${area}-reward`).textContent=u?`분위기 +${u.atmosphere} · 환경 +${u.environment}`:`내부·외부는 각각 독립적으로 개선됩니다.`;
   button.disabled=busy||!check.ok;button.textContent=busy?'개선 중…':check.ok?`${area==='inside'?'내부':'외부'} 개선 · ${n(u.cost)} 캐쉬`:check.reason;
   if(!busy)$(`#${area}-status`).textContent=u?`현재 ${state[area]}/50단계 · ${check.ok?'개선할 수 있어요.':check.reason}`:'50/50단계 완료';
  }
  for(const id of ['demo-level','reset','empty-wallet'])$('#'+id).disabled=busy;
 }
 function reset(){if(busy)return;state=M.showcase(Number($('#demo-level').value));for(const area of areas)$(`[data-area="${area}"] .reveal`).classList.remove('installing','show-gain');render();}
 async function purchase(area){
  if(busy)return;const check=M.eligibility(state,area);if(!check.ok)return;context();busy=true;render();$(`#${area}-status`).textContent='새로운 모습을 준비하고 있어요…';
  const u=check.upgrade,frame=$(`[data-area="${area}"] .reveal`),target=$(`#${area}-next`);
  try{
   await loadImage(u.image);const result=M.purchase(state,area);if(!result.ok)throw Error(result.reason);
   target.src=u.image;await target.decode();
   // Deduct only after the target image is ready. This transaction runs once.
   state=result.state;$('#cash').textContent=n(state.cash);target.alt=`개선된 ${area==='inside'?'내부':'외부'}`;frame.classList.remove('show-gain');frame.classList.add('installing');swoosh();
   $(`#${area}-status`).textContent=`${n(u.cost)} 캐쉬 차감 · ${u.zone} 개선 중`;
   await new Promise(resolve=>setTimeout(resolve,1250));
   $(`#${area}-current`).src=u.image;frame.classList.remove('installing');
   const sparks=frame.querySelector('.sparkles');sparks.replaceChildren();for(let i=0;i<22;i++){const dot=document.createElement('i');dot.style.cssText=`left:${10+Math.random()*80}%;top:${15+Math.random()*70}%;--delay:${Math.random()*.65}s`;sparks.append(dot);}
   $(`#${area}-gain`).innerHTML=`<strong>개선 완료</strong>분위기 +${u.atmosphere} · 환경 +${u.environment}`;frame.classList.add('show-gain');chime();
   setTimeout(()=>{frame.classList.remove('show-gain');sparks.replaceChildren();},2900);
   busy=false;render();$(`#${area}-status`).textContent=`Lv${u.level} 개선 완료 · 분위기 +${u.atmosphere}, 환경 +${u.environment}`;
  }catch(error){frame.classList.remove('installing');busy=false;render();$(`#${area}-status`).textContent=error.message;}
 }
 let gallerySequence=0;
 async function gallery(level){const sequence=++gallerySequence;$('#gallery-level').value=level;$('#gallery-label').textContent=level===0?'개선 전':`Lv${level}`;document.querySelectorAll('[data-gallery]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.gallery)===level)));await Promise.all(areas.map(async area=>{const url=path(area,level);try{await loadImage(url);if(sequence!==gallerySequence)return;$(`#${area}-gallery`).src=url;$(`#${area}-gallery`).alt=`${level===0?'개선 전':`Lv${level}`} 매장 ${area==='inside'?'내부':'외부'} 시안`;$(`#${area}-full`).href=url;}catch{$('#gallery-label').textContent='이미지를 불러오지 못했어요';}}));}
 for(let level=1;level<=50;level++){const option=document.createElement('option');option.value=level;option.textContent=`Lv${level}`;$('#demo-level').append(option);const a=M.catalog.inside[level-1],b=M.catalog.outside[level-1],row=document.createElement('tr');row.innerHTML=`<td>Lv${level}</td><td>${a.zone}<small>${a.name}</small></td><td>${n(a.cost)}<small>분위기 +${a.atmosphere} · 환경 +${a.environment}</small></td><td>${b.zone}<small>${b.name}</small></td><td>${n(b.cost)}<small>분위기 +${b.atmosphere} · 환경 +${b.environment}</small></td>`;$('#catalog').append(row);}
 $('#demo-level').addEventListener('change',reset);$('#reset').addEventListener('click',reset);$('#empty-wallet').addEventListener('click',()=>{if(busy)return;state={...state,cash:0};render();});
 document.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>purchase(b.dataset.buy)));
 $('#sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('#sound').textContent=soundEnabled?'효과음 켜짐':'효과음 꺼짐';$('#sound').setAttribute('aria-pressed',String(soundEnabled));if(!soundEnabled&&audioContext)audioContext.suspend();else context();});
 $('#gallery-level').addEventListener('input',e=>gallery(Number(e.target.value)));document.querySelectorAll('[data-gallery]').forEach(b=>b.addEventListener('click',()=>gallery(Number(b.dataset.gallery))));
 window.getRenovationPreviewState=()=>({...state});render();
})();
