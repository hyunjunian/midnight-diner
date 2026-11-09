/* First-person kitchen: clickable equipment, a two-compartment fridge, and tactile recipe steps. */
(() => {
  'use strict';
  const E=window.MidnightEngine,R=window.MidnightCookingRules,G=window.MidnightGestures,$=id=>document.getElementById(id);
  const FX=window.MidnightAudio,L=window.MidnightCookingLayout;
  const setStage=name=>{$('kitchen-screen').dataset.stage=name;};
  let completedKitchen=null,retainedKitchen=null;
  const CHECKPOINT='midnight-diner-cooking-checkpoint-v1';
  let bridge,view='room',visible=false,stepKey='',local={},doors={fridge:false,freezer:false},pages={fridge:0,freezer:0},down=null,skipClick=0,ricePointer=null;
  const state=()=>bridge.getState(),order=()=>state().guests.find(g=>g.id===state().kitchen?.guest),recipe=()=>E.recipes[order()?.recipe],plan=()=>R.plan(order().recipe,recipe()),step=()=>plan()[state().kitchen.step];
  function resetStep(){const key=`${state().night}-${order().id}-${state().kitchen.step}`;if(stepKey===key)return;stepKey=key;local={count:0,done:false,quality:1,heat:0,power:0,started:false,flipped:false,flipQuality:1,oil:null,knife:true,cutSlots:[],tutorial:0,toolX:.35,toolY:.22,fill:0,motion:0,practiceScore:0,practiceGood:false,demoUntil:0};restoreCheckpoint();}
  function checkpointKey(){const k=state().kitchen;return k?`${state().night}-${k.guest}-${order()?.recipe}-${k.stage}-${k.step}`:null;}
  function clearCheckpoint(){try{localStorage.removeItem(CHECKPOINT);}catch{}}
  function checkpoint(){
    if(!bridge)return false;
    try {const key=checkpointKey();if(!key){localStorage.removeItem(CHECKPOINT);return true;}
      if(retainedKitchen!==state().kitchen||!Number.isFinite(local.count))return true;
      localStorage.setItem(CHECKPOINT,JSON.stringify({key,local:{...local,motion:0,demoUntil:0},view,doors,pages}));return true;
    }catch{return false;}
  }
  function restoreCheckpoint(){
    try {const saved=JSON.parse(localStorage.getItem(CHECKPOINT)||'null');if(saved?.key!==checkpointKey()||!saved.local)return;
      const data=saved.local,st=step();if(!st)return;
      for(const key of ['count','heat','power','fill','quality','flipQuality','toolX','toolY'])if(!Number.isFinite(data[key]))return;
      if(data.count<0||data.count>st.goal||data.heat<0||data.heat>1||data.power<0||data.power>1.6||data.fill<0||data.fill>1||data.quality<0||data.quality>1||data.flipQuality<0||data.flipQuality>1)return;
      if(!Array.isArray(data.cutSlots)||data.cutSlots.some(x=>![0,1,2].includes(x))||new Set(data.cutSlots).size!==data.cutSlots.length)return;
      Object.assign(local,{count:data.count,heat:data.heat,power:data.power,fill:data.fill,quality:data.quality,flipQuality:data.flipQuality,toolX:data.toolX,toolY:data.toolY,cutSlots:data.cutSlots,done:!!data.done,started:!!data.started,flipped:!!data.flipped,oil:data.oil===true,knife:true,motion:0});
      for(const key of ['fridge','freezer'])doors[key]=!!saved.doors?.[key];
      for(const key of ['fridge','freezer'])if(Number.isInteger(saved.pages?.[key])&&saved.pages[key]>=0)pages[key]=saved.pages[key];
    }catch{}
  }
  function show(){
    const k=state().kitchen;visible=true;$('kitchen-screen').classList.remove('immersive-heat');$('kitchen-screen').classList.toggle('kitchen-upgraded',E.hasUpgrade(state(),'fridge'));$('kitchen-screen').hidden=false;$('app').classList.add('in-kitchen');
    if(!k){view='room';header();room();document.dispatchEvent(new Event('midnight:kitchen'));return;}
    const guestKey=`${state().night}-${order().id}`,sameSession=retainedKitchen===k,sameStep=sameSession&&stepKey===`${guestKey}-${k.step}`;
    if(!sameSession){stepKey='';retainedKitchen=k;}
    if(!sameStep)view=k.stage==='fridge'?'fridge':k.stage==='complete'?'complete':k.stage==='process'?'process':'room';
    resetStep();render();document.dispatchEvent(new Event('midnight:kitchen'));
  }
  function open(){if(!bridge)return false;show();return true;}
  function hide(){ricePointer=null;$('kitchen-screen').classList.remove('immersive-heat');FX?.stopCooking();down=null;local.motion=0;visible=false;$('kitchen-screen').hidden=true;$('app').classList.remove('in-kitchen');bridge?.save();document.dispatchEvent(new Event('midnight:kitchen'));}
  function header(){const k=state().kitchen,g=order();if(!k||!g){$('kitchen-guest').textContent='내 가게 · 준비와 점검';$('kitchen-order').textContent='부엌 둘러보기';$('kitchen-step-count').textContent='';return;}$('kitchen-guest').textContent='';$('kitchen-order').textContent=recipe().name;$('kitchen-step-count').textContent=k.stage==='complete'?'완성':`${k.step+1} / ${plan().length}`;}
  function footer(html){$('kitchen-footer').classList.toggle('fridge-footer',view==='fridge');$('kitchen-footer').innerHTML=html;}
  function room(){setStage('room');const k=state().kitchen,names={fridge:'냉장고',rice:'밥솥',stove:'화구',board:'작업대'};
    if(!k){$('kitchen-content').innerHTML=`<div class="kitchen-room-art empty-kitchen ${E.hasUpgrade(state(),'fridge')?'renovated':''}"><p class="room-task"><b>다음 한 끼를 준비하는 곳</b><span>냉장고를 채워 두고 조리 도구를 둘러보세요.</span></p>${['fridge','stove','rice','board'].map(id=>`<button data-station="${id}" class="room-hotspot hotspot-${id} ${id==='fridge'?'station-next':''}" aria-label="${names[id]} 둘러보기"><span>${names[id]}</span></button>`).join('')}</div>`;footer('<p id="empty-kitchen-note" role="status">손님에게 주문을 받으면 이곳에서 요리를 시작해요.</p><button type="button" data-browse-pantry class="primary">냉장고 미리 채우기</button>');fitWorkspace();requestAnimationFrame(fitWorkspace);return;}
    const prepared=k.stage==='process',target=prepared?step().station:'fridge';
    $('kitchen-content').innerHTML=`<div class="kitchen-room-art ${E.hasUpgrade(state(),'fridge')?'renovated':''}"><p class="room-task"><b>${prepared?step().title:'냉장고에서 재료 꺼내기'}</b><span>${prepared?names[target]+'를 눌러 이어서 만들어요.':'냉장고와 냉동실 문을 직접 열어 보세요.'}</span></p>${['fridge','stove','rice','board'].map(id=>`<button data-station="${id}" class="room-hotspot hotspot-${id} ${target===id?'station-next':''}" aria-label="${names[id]}로 이동"><span>${names[id]}</span></button>`).join('')}</div>`;
    footer(`${k.step?'<button data-work="resume" class="primary">진행 중인 조리 이어서 하기 </button>':''}`);fitWorkspace();requestAnimationFrame(fitWorkspace);
  }
  function stockButtons(chamber){const ids=Object.keys(E.ingredients).filter(id=>E.ingredients[id].storage===chamber&&E.ingredientAvailable(state(),id)),per=chamber==='freezer'?8:12,count=Math.max(1,Math.ceil(ids.length/per));pages[chamber]=Math.min(pages[chamber],count-1);
    const buttons=ids.slice(pages[chamber]*per,(pages[chamber]+1)*per).map((id,i)=>{const item=E.ingredients[id],stock=state().inventory[id],selected=state().kitchen.selected.includes(id),required=recipe().ingredients.includes(id),row=Math.floor(i/4),top=(chamber==='freezer'?15.8+row*7.5:45.1+row*11.1);
      return `<button data-stock="${id}" class="stored-ingredient ${stock?'in-stock':'empty-stock'} ${selected?'stock-selected':''} ${required?'stock-required':''}" style="left:${14+i%4*18}%;top:${top}%"  aria-label="${item.name} 재고 ${stock}개${selected?' 선택됨':''}">${bridge.food(id)}<b>${item.name}</b><small>${selected?'✓ ':''}×${stock}</small></button>`;
    }).join('');return{buttons,count};
  }
  function doorControl(chamber){const name=chamber==='freezer'?'냉동실':'냉장실',needed=recipe().ingredients.some(id=>E.ingredients[id].storage===chamber&&!state().kitchen.selected.includes(id));
    return `<div class="fridge-door door-${chamber}" aria-hidden="true"></div><button class="fridge-door-touch touch-${chamber} ${needed?'door-needed':''} ${needed&&!state().fridgeDoorHintSeen&&!doors[chamber]?'first-door-hint':''}" data-door="${chamber}" aria-label="${name} 문 ${doors[chamber]?'닫기':'열기'}" aria-expanded="${doors[chamber]}" aria-controls="shelf-${chamber}"><span class="door-handle-cue" aria-hidden="true"></span></button>`;
  }
  function fridge(){setStage('fridge');const cold=stockButtons('fridge'),frozen=stockButtons('freezer');
    $('kitchen-content').innerHTML=`<div class="fridge-view"><div class="fridge-cabinet ${doors.fridge?'fridge-open':''} ${doors.freezer?'freezer-open':''} ${E.hasUpgrade(state(),'fridge')?'upgraded':''}"><img src="./assets/fridge-open.webp" alt="선반이 있는 냉장고와 냉동실 내부"><div id="shelf-freezer" class="shelf-items freezer-items" ${doors.freezer?'':'inert'}>${frozen.buttons}</div><div id="shelf-fridge" class="shelf-items fridge-items" ${doors.fridge?'':'inert'}>${cold.buttons}</div>${doorControl('freezer')}${doorControl('fridge')}</div><div class="fridge-pages">${frozen.count>1?`<button data-shelf-page="freezer">냉동실 선반 ${pages.freezer+1}/${frozen.count}</button>`:''}${cold.count>1?`<button data-shelf-page="fridge">냉장실 선반 ${pages.fridge+1}/${cold.count}</button>`:''}</div></div>`;
    fridgeFooter();fitWorkspace();requestAnimationFrame(fitWorkspace);
  }
  function fridgeFooter(){
    const k=state().kitchen,missing=recipe().ingredients.filter(id=>!k.selected.includes(id));
    const selected=recipe().ingredients.length-missing.length;
    footer(`<section class="recipe-ingredients" aria-label="이번 요리에 필요한 재료"><header><h3>이번 요리 재료</h3><strong id="fridge-selection-status" role="status">${selected} / ${recipe().ingredients.length}</strong></header><div class="recipe-ingredient-cards" >${recipe().ingredients.map(id=>`<div class="required-ingredient ${k.selected.includes(id)?'is-ready':'is-missing'}" data-required="${id}">${bridge.food(id)}<b>${k.selected.includes(id)?'<svg class="ingredient-check" viewBox="0 0 20 20" role="img" aria-label="담음"><path d="m3 10 4 4 10-10"/></svg>':''}${E.ingredients[id].name}</b></div>`).join('')}</div></section>${E.rescueNeeds(state())?'<button data-work="rescue" class="neighbor-help">재료 도움받기 · 평판 −3</button>':''}<button data-work="ingredients-next" class="primary" ${!k.step&&!E.readyIngredients(state())?'disabled':''}>조리대로 이동</button>`);
  }
  function toggleDoor(chamber){FX?.play('door');doors[chamber]=!doors[chamber];if(doors[chamber]&&!state().fridgeDoorHintSeen){state().fridgeDoorHintSeen=true;document.querySelectorAll('.first-door-hint').forEach(el=>el.classList.remove('first-door-hint'));bridge.save();}document.querySelector('.fridge-cabinet')?.classList.toggle(`${chamber}-open`,doors[chamber]);const shelf=document.querySelector(`.${chamber}-items`);if(shelf)shelf.inert=!doors[chamber];document.querySelectorAll(`[data-door="${chamber}"]`).forEach(b=>{b.setAttribute('aria-expanded',String(doors[chamber]));b.setAttribute('aria-label',`${chamber==='freezer'?'냉동실':'냉장실'} 문 ${doors[chamber]?'닫기':'열기'}`);});}
  function visual(st){
    const count=Math.max(0,local.count+(local.motion||0));
    if(st.id==='assemble')return R.platingArt(order().recipe,E.kitchenLook(state()));
    if(st.id==='prep'&&st.mode==='measure'){const n=st.part==='miso'?(local.done?3:down?.paste?(local.fill>.6?2:1):0):Math.min(3,Math.floor(local.fill*3));return {file:st.part==='miso'&&R.imagePilot.includes(order().recipe)?'measure-miso-v23':`measure-${st.part}`,cols:2,rows:2,col:n%2,row:Math.floor(n/2),className:'measure-frame'};}
    if(st.id==='heat'&&R.heatArt(order().recipe)){const spec=E.cookSpec(state(),order().recipe),look=E.heatLook(state(),order().recipe,local.heat),phase=look==='raw'?(local.heat<spec.ideal*.4?0:1):look==='good'?2:3;return R.heatArt(order().recipe,phase);}
    if(st.id==='heat'){const n=R.heated.indexOf(order().recipe),spec=E.cookSpec(state(),order().recipe),phase=local.heat<spec.ideal*.4?0:local.heat<spec.ideal*.86?1:2;return {file:`heat-hi-${Math.floor(n/2)+1}`,cols:2,rows:3,col:n%2,row:phase,className:'heat-frame'};}
    const n=st.id==='portion'?Math.min(3,local.count):st.mode==='fold'?(local.done?2:Math.min(1,Math.floor((local.motion||0)*2))):st.id==='lid'?(local.done?3:(local.motion||0)>.2?2:0):Math.min(3,Math.floor(count/st.goal*3));
    if(st.id==='wrap'){const art=R.wrapArt(order().recipe,E.kitchenLook(state()));if(art)return {...art,col:n%2,row:Math.floor(n/2)};}
    return {file:st.id==='prep'?R.prepImage(order().recipe,st.part):(st.id==='portion'?'core-portion-v19':st.id==='wrap'?'core-wrap-v20':`core-${st.id}`),cols:2,rows:2,col:n%2,row:Math.floor(n/2),className:st.id==='prep'?'prep-frame':'core-frame'};
  }
  function burnAmount(){const spec=E.cookSpec(state(),order().recipe);return Math.max(0,Math.min(1,(local.heat-spec.ideal-spec.band/2)/(1-spec.ideal-spec.band/2)));}
  function frameStyle(v){const file=R.nightImage(order().recipe,v.file),position=(n,total)=>total>1?n*100/(total-1):0;return `background-image:url('./assets/${file}.webp');background-size:${v.cols*100}% ${v.rows*100}%;background-position:${position(v.col,v.cols)}% ${position(v.row,v.rows)}%`;}
  function sceneFrame(){
    const st=step(),v=visual(st),pilot=R.imagePilot.includes(order().recipe),heat=st.id==='heat',n=heat?R.heated.indexOf(order().recipe):-1,look=heat?E.heatLook(state(),order().recipe,local.heat):E.kitchenLook(state());
    // Every approved post-heat action uses real state-specific food artwork.
    return `<span class="recipe-frame ${v.className}" data-appearance="${look}" data-ingredient="${st.ingredient||''}" data-part="${st.part||''}" data-frame="${v.col+v.row*v.cols}" role="img" aria-label="${st.title} · ${st.id==='portion'?`그릇에 밥 ${local.count}주걱`:local.done?'준비 완료':'조리 중'}" style="${frameStyle(v)}">${heat&&pilot&&!R.heatArt(order().recipe)?`<span class="heat-burnt-layer" style="background-image:url('./assets/${R.nightImage(order().recipe,`heat-burnt-${Math.floor(n/2)+1}`)}.webp');background-position:${n%2*100}% 100%;opacity:${burnAmount()}"></span>`:''}</span>`;
  }
  function paintFrame(){
    const el=document.querySelector('#cook-object .recipe-frame');if(!el)return;const st=step(),v=visual(st);el.style.cssText=frameStyle(v);el.dataset.frame=String(v.col+v.row*v.cols);el.dataset.appearance=st.id==='heat'?E.heatLook(state(),order().recipe,local.heat):E.kitchenLook(state());const layer=el.querySelector('.heat-burnt-layer');if(layer)layer.style.opacity=burnAmount();
  }
  const measurements={soy:{amount:15,unit:'mL',vessel:'계량스푼'},dashi:{amount:150,unit:'mL',vessel:'계량컵'},milk:{amount:100,unit:'mL',vessel:'계량컵'},miso:{amount:1,unit:'스푼',vessel:'나무 스푼'},flour:{amount:30,unit:'g',vessel:'계량 그릇'},sugar:{amount:1,unit:'스푼',vessel:'계량스푼'}};
  function measureSpec(){return measurements[step()?.part]||measurements.soy;}
  function gestureId(st){if(st.id==='prep'&&st.part==='miso')return 'paste';return st.id==='prep'?({cut:'cut',wash:'beat',peel:'peel',crack:'crack',fold:'fold',measure:'measure'}[st.mode]):st.id;}
  function guideText(st){return local.done?'':'동그라미에서 시작해 점선 끝까지 움직여 주세요.';}
  function guideMarkup(st){
    if(local.done||st.id==='heat')return '';
    const paths=G.guide(gestureId(st),{cuts:local.cutSlots,lowerBowl:st.id==='portion'&&R.nightImage(order().recipe,visual(st).file)==='foreground-v39-core-portion'}),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    return `<svg class="motion-guide" viewBox="${portraitStep()?`0 ${-sourceSpace().offset*100} 100 ${sourceSpace().scale*100}`:'0 0 100 100'}" aria-hidden="true"><defs><marker id="cook-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#fff0b3" stroke-width="2"/></marker></defs>${paths.map((g,i)=>{const d=g.points.map(([x,y],j)=>`${j?'L':'M'}${x*100},${y*100}`).join(' '),[x,y]=g.points[0];return `<g class="guide-path" data-cut="${gestureId(st)==='cut'?Math.round((x-.35)/.15):''}"><path d="${d}" class="guide-shadow"/><path d="${d}" class="guide-line" marker-end="url(#cook-arrow)"/><circle cx="${x*100}" cy="${y*100}" r="4.2" class="guide-start"/><text x="${x*100}" y="${y*100+1.5}" text-anchor="middle">${gestureId(st)==='cut'?Math.round((x-.35)/.15)+1:'●'}</text>${reduce?'':`<circle r="2.5" class="guide-finger"><animateMotion dur="2.2s" repeatCount="indefinite" path="${d}"/></circle>`}</g>`;}).join('')}</svg>`;
  }
  function refreshGuides(){const el=$('motion-guides');if(el)el.innerHTML=guideMarkup(step());}
  function measureDisplay(){const m=measureSpec(),name=R.prepNames[step().part];return `<div class="measure-status" role="meter" aria-label="${name} 계량" aria-valuemin="0" aria-valuemax="${m.amount}" aria-valuenow="${Math.round(local.fill*m.amount)}"><span id="measure-value">${Math.round(local.fill*m.amount)} / ${m.amount}${m.unit}</span><div class="measure-progress"><i id="measure-fill" style="width:${local.fill*100}%"></i></div></div>`;}
  function portraitStep(){return !!state().kitchen&&step()?.id!=='heat'&&R.portraitImage(order().recipe,visual(step()).file);}
  const sourceSpace=()=>L.source(R.nightImage(order().recipe,visual(step()).file));
  const displayY=y=>portraitStep()?(y+sourceSpace().offset)/sourceSpace().scale:y;
  const inputY=y=>portraitStep()?y*sourceSpace().scale-sourceSpace().offset:y;
  function paintRiceHand(){const el=document.querySelector('.rice-hand');if(!el)return;const object=$('cook-object'),x=ricePointer?.x??.70,y=ricePointer?.y??.88;
    el.style.left=`${x*100}%`;el.style.top=`${displayY(y)*100}%`;el.style.width=`${Math.min(180,Math.max(130,object.clientWidth*.46))}px`;
    el.classList.toggle('is-loaded',!!ricePointer);el.dataset.tipX=String(x);el.dataset.tipY=String(y);
  }
  function knifeAngle(x,y){return Math.atan2(1.16-y,.86-x)*180/Math.PI-48;}
  function cookingMode(){return R.heatMode(order().recipe,recipe());}
  function cookingMotion(){return `<svg class="cooking-surface" viewBox="0 0 100 100" aria-hidden="true">${Array.from({length:20},(_,i)=>`<circle class="cooking-bubble" cx="${25+(i*17)%52}" cy="${35+(i*11)%30}" r="${1.2+(i%4)*.6}" style="animation-delay:${-i*.17}s"/>`).join('')}<path class="surface-ripple" d="M20 50 Q35 44 50 50 T80 50 M25 60 Q40 54 55 60 T75 60"/></svg><svg class="cooking-steam" viewBox="0 0 100 100" aria-hidden="true">${[35,50,65].map((x,i)=>`<path d="M${x} 65 Q${x-8} 45 ${x} 28 T${x} 5" style="animation-delay:${-i*.6}s"/>`).join('')}</svg>`;}
  function objectContent(st){return sceneFrame()+(st.id==='portion'?'<span class="rice-hand" aria-hidden="true"></span>':'')+(st.id==='heat'?(R.imagePilot.includes(order().recipe)&&!R.heatArt(order().recipe)?cookingMotion():''):st.id==='prep'&&st.mode==='cut'&&local.knife?`<span class="held-knife" style="left:${local.toolX*100}%;top:${displayY(local.toolY)*100}%;--knife-angle:${knifeAngle(local.toolX,local.toolY)}deg"></span>`:'')+`<span id="motion-guides">${guideMarkup(st)}</span>`;}
  function lesson(){
    const phase=local.tutorial||0,spec=E.cookSpec(state(),order().recipe);
    return `<aside id="heat-lesson" class="heat-lesson"><small>재료가 줄지 않는 불 조절 연습</small><h4>${phase===2?(local.practiceGood?'알맞게 멈췄어요!':'이번엔 조금 달랐어요'):phase===0?'손잡이를 잡고 시계 방향으로 돌려 보세요.':'익힘 막대를 보고 초록 구간에서 불을 꺼 보세요.'}</h4><p>${phase===2?`이번 연습 익힘 점수 <b>${local.practiceScore} / 100</b>. ${local.practiceGood?'이 타이밍이면 만족도와 팁을 높이기 좋아요.':'너무 덜 익거나 지나치게 익으면 만족도와 팁이 줄어요.'}`:`알맞음은 ${Math.round((spec.ideal-spec.band/2)*100)}–${Math.round((spec.ideal+spec.band/2)*100)}%. 다이얼을 0으로 돌리거나 ‘불 끄고 마무리’를 눌러요. 알맞게 익힐수록 높은 만족도와 팁을 기대할 수 있어요.`}</p>${phase===2?'<div class="practice-actions"><button data-work="practice-retry">다시 연습</button><button data-work="tutorial-done">이제 직접 요리하기 </button></div>':'<span id="practice-live">아래 익힘 막대가 실제처럼 움직여요.</span>'}</aside>`;
  }
  function nativeMask(){
    const id=order().recipe,mount=(R.heatLayout[id]?.y||.845)*100;
    const handles={butadon:[64,62,83,79],cabbage_stir:[64,62,84,80],midnight:[64,62,83,80],misoshiru:[50,67,50,81],negi_omelette:[64,62,82,79],ochazuke:[62,65,76,80],onigiri:[67,65,85,81],potato_soup:[52,64,56,80],salmon_teriyaki:[63,64,81,81],soba:[64,63,79,81],tamago:[50,64,50,78],tonjiru:[62,64,73,83],udon:[64,62,80,81]};
    const pan=id==='tamago'?'<rect x="19" y="18" width="62" height="44" rx="4"/>':'<ellipse cx="50" cy="41" rx="45" ry="21"/>';
    const h=handles[id],handle=h?`<path transform="scale(.17777778 .1)" d="M${h[0]*5.625} ${h[1]*10} L${h[2]*5.625} ${h[3]*10}" fill="none" stroke="white" stroke-width="${id==='onigiri'?50:45}" stroke-linecap="round"/>`:'';
    return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><filter id="soft"><feGaussianBlur stdDeviation=".2"/></filter></defs><g fill="white" filter="url(#soft)"><rect x="3" y="24" width="94" height="43" rx="2"/>${pan}${handle}<ellipse cx="50" cy="${mount}" rx="11" ry="7"/></g></svg>`);
  }
  function nativeStove(st){return `<div style="--native-mask:url('${nativeMask()}')" class="prep-scene heat stove-unit native-stove ${local.done?'action-done':''}"><div class="heat-worktop"><div id="cook-object" class="cook-object" role="img" aria-label="${st.title} · 음식과 화구">${objectContent(st)}</div></div><div class="stove-front"><div class="dial-wrap" style="top:${(R.heatLayout[order().recipe]?.y||.845)*100}%"><svg class="dial-turn-cue" viewBox="0 0 100 100" aria-hidden="true"><path d="M15 65 A39 39 0 1 1 84 72 M72 67 L85 74 L89 59"/></svg><span class="dial-turn-label">돌려서 불 켜기</span><button id="gas-dial" role="slider" aria-label="가스레인지 불 조절 다이얼" aria-valuemin="0" aria-valuemax="160" aria-valuenow="${Math.round(local.power*100)}"><i style="transform:rotate(${local.power/1.6*270-135}deg)"></i></button></div></div></div>`;}
  function stoveUnit(st){if(R.heatArt(order().recipe))return nativeStove(st);return `<div class="prep-scene heat stove-unit ${local.done?'action-done':''}"><div class="heat-worktop"><div id="cook-object" class="cook-object" role="img" aria-label="${st.title} · 팬과 음식">${objectContent(st)}</div></div><div class="stove-front"><div class="dial-wrap"><svg class="dial-guide" viewBox="0 0 100 100" aria-hidden="true"><path d="M16 80 A42 42 0 1 1 84 80" fill="none" stroke="#f6d699" stroke-width="2" stroke-dasharray="4 4"/><path d="M78 76 L84 83 L90 74" fill="none" stroke="#f6d699" stroke-width="2"/></svg><svg class="dial-turn-cue" viewBox="0 0 100 100" aria-hidden="true"><path d="M15 65 A39 39 0 1 1 84 72 M72 67 L85 74 L89 59"/></svg><span class="dial-turn-label">돌려서 불 켜기</span><button id="gas-dial" role="slider" aria-label="가스레인지 불 조절 다이얼" aria-valuemin="0" aria-valuemax="160" aria-valuenow="${Math.round(local.power*100)}"><i style="transform:rotate(${local.power/1.6*270-135}deg)"></i></button><svg class="dial-demo" viewBox="0 0 100 100" aria-hidden="true"><g><path d="M50 50 L50 15" stroke="#fff0af" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="15" r="6" fill="#ffe9a6"/><animateTransform attributeName="transform" type="rotate" values="-125 50 50;35 50 50;-125 50 50" dur="3s" repeatCount="indefinite"/></g></svg></div><span class="stove-off-tick" aria-hidden="true">0</span><span class="stove-high-tick" aria-hidden="true">강</span><output id="stove-state" class="stove-enamel">불 꺼짐</output></div></div>`;}
  function heatControls(st,spec){return `<div class="stove-controls">${R.heatArt(order().recipe)?'<output id="stove-state" class="native-stove-state">불 꺼짐</output>':''}${!state().stoveTutorialDone?lesson():''}<p id="cook-look" class="cook-look"></p><div class="heat-label"><span>덜 익음</span><span class="heat-target" style="left:${spec.ideal*100}%">알맞음</span><span>너무 익음</span></div><div class="heat-meter" role="meter" aria-label="익힘 정도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="perfect-zone" style="left:${(spec.ideal-spec.band/2)*100}%;width:${spec.band*100}%"></div><i id="heat-marker"></i></div></div>`;}

  function process(){
    setStage('process');resetStep();const st=step(),spec=E.cookSpec(state(),order().recipe),isHeat=st.id==='heat',names={rice:'밥솥',stove:'화구',board:'작업대'};
    $('kitchen-screen').classList.toggle('immersive-heat',isHeat&&!!R.heatArt(order().recipe));
    $('kitchen-screen').classList.toggle('is-heating',isHeat);
    if(isHeat&&!state().stoveTutorialDone){state().stoveTutorialDone=true;bridge.save();}
    const scene=isHeat?`${heatControls(st,spec)}${stoveUnit(st)}`:`<div class="prep-scene ${st.id} ${local.done?'action-done':''}"><button id="cook-object" class="cook-object" aria-label="${st.title} 조작">${objectContent(st)}</button><div class="action-spark" aria-hidden="true"></div></div>${st.id==='prep'&&st.mode==='measure'?measureDisplay():''}<div class="action-counter" aria-live="polite">${st.id==='prep'&&st.mode==='measure'?'':st.id==='portion'?`그릇에 밥 ${local.count}주걱 / 3주걱`:local.done?'':`${Math.min(local.count,st.goal)} / ${st.goal}`}</div>`;
    $('kitchen-content').innerHTML=`<div class="process-view ${R.transparentImage(order().recipe,visual(st).file)?'foreground-workspace':''} station-${st.station} ${isHeat?'':R.inImagePilot(order().recipe)?'photo-workspace':'legacy-workspace'}"><div class="process-heading"><span>${names[st.station]} · ${state().kitchen.step+1}단계</span><h3>${st.title}</h3></div>${scene}</div>`;
    processFooter();fitWorkspace();requestAnimationFrame(fitWorkspace);if(isHeat)updateHeat();else FX?.heat(false,0);
  }
  function fitWorkspace(){
    const area=$('kitchen-content'),hot=document.querySelector('.native-stove');
    const room=area.querySelector('.kitchen-room-art');
    if(room){const layout=L.room(room.clientWidth,room.clientHeight);for(const[id,box]of Object.entries(layout.hotspots)){const button=room.querySelector(`[data-station="${id}"]`);for(const key of ['left','top','width','height'])button.style[key]=`${box[key]}px`;button.hidden=!box.width||!box.height;}return;}
    const areaRect=area.getBoundingClientRect(),footerRect=$('kitchen-footer').getBoundingClientRect(),separateColumn=footerRect.right<=areaRect.left+2;
    const footerTop=separateColumn?area.clientHeight:footerRect.top-areaRect.top;
    area.style.setProperty('--work-bottom',`${Math.max(10,area.clientHeight-footerTop+16)}px`);
    if(hot){
      const ratio=9/16,mount=R.heatLayout[order().recipe]?.y||.845,nav=$('location-nav').getBoundingClientRect(),captionTop=separateColumn?12:nav.bottom-area.getBoundingClientRect().top+6;
      const center=(captionTop+47+footerTop-80)/2,width=Math.max(70,Math.min(area.clientWidth,(footerTop-12-center)/((mount-.4)/ratio+.095))),height=width/ratio;
      const desiredTop=center-height*.4,top=desiredTop-Math.max(0,desiredTop+height*mount+Math.max(22,width*.095)*1.13+8-footerTop);
      hot.style.width=`${width}px`;hot.style.height=`${height}px`;hot.style.transform='translateX(-50%)';hot.style.top=`${top}px`;
      area.style.setProperty('--heat-caption-top',`${captionTop}px`);return;
    }
    const workspace=document.querySelector('.process-view'),scene=workspace?.querySelector('.prep-scene');
    const areaBox=area.getBoundingClientRect(),navBox=$('location-nav').getBoundingClientRect(),placement=L.workspace(area.clientWidth,area.clientHeight,{viewportHeight:innerHeight,areaTop:areaBox.top,navBottom:navBox.bottom,footerTop,separateColumn,step:scene?.classList.contains('assemble')?'assemble':scene?.classList.contains('pour')?'pour':undefined}),{captionTop,safeBottom}=placement;
    area.style.setProperty('--process-caption-top',`${captionTop}px`);
    if(scene){
      if(scene.classList.contains('stove-unit')){const top=captionTop+104,width=Math.min(area.clientWidth,Math.max(1,safeBottom-top)/1.2);scene.style.cssText=`position:absolute;left:${(area.clientWidth-width)/2}px;top:${top}px;width:${width}px`;return;}
      const portrait=portraitStep(),art=visual(step()),file=R.nightImage(order().recipe,art.file),box=L.frame(area.clientWidth,area.clientHeight,{portrait,...L.focus(file),safeTop:placement.safeTop,safeBottom,center:placement.center});
      for(const name of ['width','height','left','top'])scene.style[name]=`${box[name]}px`;
      workspace.dataset.foodCenter=String(box.center);workspace.dataset.sourceAspect=String(portrait?L.source(file).ratio:1);
      paintRiceHand();
    }
    const completed=area.querySelector('.completed-dish');
    if(completed){
      const plate=completed.querySelector('.original-ready'),art=plate.querySelector('.food-art'),heading=completed.querySelector('h3');
      const titleTop=placement.titleTop;
      heading.style.top=`${titleTop}px`;
      const ratioParts=getComputedStyle(art).getPropertyValue('--food-ratio').trim().split('/'),ratio=(Number(ratioParts[0])||1)/(Number(ratioParts[1])||1);
      const above=titleTop+heading.getBoundingClientRect().height+16,below=area.clientHeight-118;
      const span=.8,height=Math.max(20,(below-above)/span),width=Math.min(area.clientWidth*.84,height*ratio,370),half=width/ratio*span/2;
      const center=Math.max(above+half,Math.min(below-half,(separateColumn?area.clientHeight*.49:innerHeight*.56-areaRect.top)));
      art.style.width=`${width}px`;art.style.height=`${width/ratio}px`;plate.style.top=`${center}px`;
    }
    const cabinet=area.querySelector('.fridge-cabinet');if(cabinet){const pages=area.querySelector('.fridge-pages'),height=Math.max(1,area.clientHeight-(pages?.getBoundingClientRect().height||0)),box=L.cabinet(area.clientWidth,height);cabinet.dataset.fit=box.cover?'cover':'contain';cabinet.style.cssText=`flex:0 0 auto;width:${box.width}px;height:${box.height}px;position:${box.cover?'absolute':'relative'};left:${box.cover?'50%':'auto'};top:${box.top}px;transform:${box.cover?'translateX(-50%)':'none'}`;pages.style.cssText=box.cover?'position:absolute;left:0;right:0;bottom:0;z-index:4;justify-content:center':'';}
  }

  new ResizeObserver(fitWorkspace).observe($('kitchen-content'));
  function processFooter(){
    const st=step(),next=plan()[state().kitchen.step+1];
    if(st.id==='heat'&&!local.done){
      if(!state().stoveTutorialDone&&local.tutorial===2){footer('<p>연습 결과를 보고 직접 요리하기를 눌러 주세요.</p>');return;}
      footer(`<div class="heat-actions"><button data-work="heat-stop" class="primary" ${!local.started?'disabled':''}>불 끄고 마무리</button>${st.flip&&state().stoveTutorialDone?`<button data-work="flip" ${!local.started||local.flipped?'disabled':''}>${local.flipped?'반대쪽도 익히는 중':R.family(order().recipe,recipe())==='egg'?'도구로 말기':'뒤집개로 뒤집기'}</button>`:''}</div>${!state().stoveTutorialDone?'<p>불 조절 연습 · 재료는 줄지 않아요</p>':''}`);return;
    }
    footer(`<button data-work="next-step" class="primary" ${local.done?'':'disabled'}>${st.id==='prep'&&next?.id==='prep'?`${R.prepNames[next.part]} 꺼내기 `:'다음 '}</button>`);
  }
  function complete(){setStage('complete');$('kitchen-screen').classList.remove('immersive-heat');if(completedKitchen!==state().kitchen){completedKitchen=state().kitchen;FX?.play('complete');}const r=recipe();$('kitchen-content').innerHTML=`<div class="completed-dish"><h3>한 접시가 완성됐어요.</h3><div class="ready-plate original-ready">${bridge.food(order().recipe,false,E.kitchenLook(state()))}</div><strong>${r.name}</strong><p>${E.person(order().person).name} 님의 주문</p></div>`;footer('<button data-work="deliver" class="primary">내어놓기 </button>');fitWorkspace();requestAnimationFrame(fitWorkspace);}
  function render(){if(!visible||!state().kitchen)return;if(view!=='process')$('kitchen-screen').classList.remove('immersive-heat');header();if(state().kitchen.stage==='complete')view='complete';if(view!=='process')FX?.stopCooking();if(view==='room')room();else if(view==='fridge')fridge();else if(view==='complete')complete();else process();bridge.save();}
  function feedbackMotion(){const el=$('cook-object');el?.animate([{transform:'translateY(0)'},{transform:'translateY(5px) scale(.98)'},{transform:'translateY(0)'}],{duration:270});const spark=document.querySelector('.action-spark');spark?.animate([{opacity:1,transform:'scale(.5)'},{opacity:0,transform:'scale(1.2)'}],{duration:450});}
  function commitDrag(g){if(view!=='process'||local.done)return;const st=step();if(st.id==='prep'&&st.part==='miso'){if(G.valid(g)){local.fill=1;local.count=1;local.done=true;FX?.play('paste-scoop');process();}else{local.fill=0;process();bridge.toast('왼쪽 된장통에서 시작해 오른쪽 빈 그릇까지 옮겨 주세요.');}return;}if(st.id==='prep'&&st.mode==='measure'){if(local.fill>=1&&G.valid(g)){FX?.action(st);local.count=1;local.done=true;process();}else{process();bridge.toast(local.fill?'조금 더 덜어 주세요. 점선 끝에서 목표량까지 유지하세요.':'왼쪽 용기에서 시작해 오른쪽 계량 도구로 끌어 주세요.');}return;}if(st.id==='heat')return;if(!G.valid(g)){bridge.toast(guideText(st));refreshGuides();return;}
    if(st.id==='prep'&&st.mode==='cut'){const slot=Math.max(0,Math.min(2,Math.round((g.start.x-.35)/.15)));if(local.cutSlots.includes(slot)){bridge.toast('아직 썰지 않은 부분을 손질해 주세요.');return;}local.cutSlots.push(slot);}
    FX?.action(st);local.count+=st.id==='beat'?Math.max(1,Math.floor(Math.abs(g.angle)/(Math.PI*2))):1;local.done=local.count>=st.goal;local.quality=1;if(st.id==='oil')local.oil=true;if(st.id==='assemble'&&local.done){E.completeCookingStep(state(),local.quality,step().id==='heat'?{heat:local.heat}:undefined);view='complete';render();bridge.changed();return;}process();
  }
  function setPower(power){
    if(local.done||!state().stoveTutorialDone&&local.tutorial===2)return;
    const wasStarted=local.started;local.power=power;if(power>.04){local.started=true;if(!state().stoveTutorialDone)local.tutorial=1;}
    if(power<=.04&&wasStarted){stopHeat();return;}
    const dial=$('gas-dial');if(dial){dial.setAttribute('aria-valuenow',String(Math.round(power*100)));dial.querySelector('i').style.transform=`rotate(${power/1.6*270-135}deg)`;}
    if(!state().stoveTutorialDone){const card=$('heat-lesson');if(card){const wrap=document.createElement('div');wrap.innerHTML=lesson();card.replaceWith(wrap.firstElementChild);}}
    updateHeat();
  }
  function updateHeat(){FX?.heat(visible&&view==='process'&&local.started&&local.power>.04&&!local.done,local.power,cookingMode());
    const currentLook=E.heatLook(state(),order().recipe,local.heat),look=$('cook-look');if(look){look.hidden=!R.imagePilot.includes(order().recipe);look.textContent={raw:'아직 설익었어요',good:'알맞게 익고 있어요',dry:cookingMode()==='boil'?'국물이 졸아들고 있어요':'겉면이 마르고 있어요',burnt:cookingMode()==='boil'?'너무 졸아 바닥에 눌어붙었어요':'음식이 타고 있어요'}[currentLook];look.dataset.look=currentLook;}
    const caption=$('stove-state');if(caption)caption.textContent=local.done||local.power<=.04?'불 꺼짐':local.power<.55?'약불':local.power<1.1?'중불':'강불';
    const stop=document.querySelector('[data-work="heat-stop"]');if(stop){stop.disabled=!local.started||local.done;const spec=E.cookSpec(state(),order().recipe);stop.classList.toggle('at-ideal',Math.abs(local.heat-spec.ideal)<=spec.band/2);}
    const flip=document.querySelector('[data-work="flip"]');if(flip)flip.disabled=!local.started||local.flipped||local.done;
    const meter=document.querySelector('.stove-controls .heat-meter');if(!meter)return;meter.setAttribute('aria-valuenow',String(Math.round(local.heat*100)));$('heat-marker').style.left=`${local.heat*100}%`;paintFrame();
    const scene=document.querySelector('.prep-scene');scene?.classList.toggle('fire-on',local.started&&local.power>.04&&!local.done);scene?.style.setProperty('--gas-strength',String(local.power/1.6));scene?.classList.toggle('boiling',cookingMode()==='boil');scene?.classList.toggle('scorching',currentLook==='burnt');scene?.style.setProperty('--bubble-speed',`${1.5/Math.max(.4,local.power)}s`);
    document.querySelector('.dial-wrap')?.classList.toggle('dial-engaged',(local.started||local.done||local.tutorial===2)&&performance.now()>local.demoUntil);
    const live=$('practice-live');if(live)live.textContent=`지금 익힘 ${Math.round(local.heat*100)}% · 초록 구간에 오면 불을 꺼 보세요.`;
  }
  function stopHeat(){
    const st=step(),spec=E.cookSpec(state(),order().recipe);local.power=0;
    if(!state().stoveTutorialDone){local.practiceScore=Math.round(E.heatQuality(state(),order().recipe,local.heat)*100);local.practiceGood=Math.abs(local.heat-spec.ideal)<=spec.band/2;local.started=false;local.tutorial=2;process();return;}
    local.done=true;local.quality=E.heatQuality(state(),order().recipe,local.heat)*(st.flip?(local.flipped?local.flipQuality:.65):1);process();
  }
  function resetPractice(){state().stoveTutorialDone=false;Object.assign(local,{tutorial:0,heat:0,power:0,started:false,done:false,flipped:false,practiceScore:0,practiceGood:false});process();bridge.changed();}
  function work(action){if(!state().kitchen)return;const k=state().kitchen;if(action==='tutorial-done'&&local.tutorial===2){state().stoveTutorialDone=true;local.started=false;local.power=0;local.heat=0;local.flipped=false;process();bridge.changed();return;}if(action==='practice-start'||action==='practice-retry'){resetPractice();return;}
    if(action==='guide-replay'){if(step().id==='heat'){const wrap=document.querySelector('.dial-wrap');local.demoUntil=performance.now()+3000;wrap?.classList.remove('dial-engaged');}else refreshGuides();return;}if(action==='overview'){view='room';render();return;}if(action==='resume'){view=k.stage==='complete'?'complete':'process';render();return;}
    if(action==='ingredients-next'){if(k.step||E.prepareIngredients(state())){view='room';render();bridge.changed();}return;}
    if(action==='rescue'){if(E.rescue(state())){render();bridge.changed();}return;}
    if(action==='deliver'){const g=order(),result=E.deliver(state());if(result){hide();bridge.onDeliver(g);}else bridge.toast('재료를 확인하고 다시 내어 주세요.');return;}
    if(view!=='process')return;const st=step();
    if(action==='next-step'&&local.done){bridge.clearToast?.();if(E.completeCookingStep(state(),local.quality,step().id==='heat'?{heat:local.heat}:undefined)){view=k.stage==='complete'?'complete':'process';resetStep();render();bridge.changed();}return;}
    if(action==='less-rice'){local.count=Math.max(0,local.count-1);local.done=local.count>=3;local.quality=Math.max(.25,1-Math.abs(3-local.count)*.25);process();return;}
    if(st.id==='oil'&&(action==='oil'||action==='dry-pan')){local.oil=action==='oil';local.done=true;local.quality=st.required&&!local.oil?.45:1;process();if(local.oil)FX?.play('oil-pour');if(local.oil)document.querySelector('.oil-cruet')?.animate([{transform:'rotate(0)'},{transform:'translate(-40px,-10px) rotate(-45deg)'},{transform:'rotate(0)'}],{duration:650});return;}
    if(st.id==='heat'){
      if(action==='heat-start'&&!local.started){local.started=true;process();}
      if(action==='heat-stop'&&local.started&&!local.done){local.power=0;stopHeat();}
      if(action==='flip'&&st.flip&&local.started&&!local.done&&!local.flipped){FX?.play('flip');local.flipped=true;local.flipQuality=local.heat>=.25&&local.heat<=.65?1:.82;process();document.querySelector('.heat-vessel')?.animate([{transform:'rotate(0)'},{transform:'translateY(-20px) rotate(-12deg)'},{transform:'rotate(0)'}],{duration:550});}
    }
  }
  function init(api){bridge=api;$('kitchen-back').addEventListener('click',()=>{window.MidnightScene.navigate('counter');bridge.changed();});const root=$('kitchen-screen');
    root.addEventListener('click',event=>{if(event.target.closest('[data-browse-pantry]')){bridge.openPantry?.();return;}const station=event.target.closest('[data-station]');if(station){const id=station.dataset.station,k=state().kitchen;if(!k){if(id==='fridge')bridge.openPantry?.();else{$('empty-kitchen-note').textContent={rice:'밥솥에서 따뜻한 밥을 지어요. 손님 주문을 받은 뒤 밥을 준비할 수 있어요.',stove:'불 세기를 조절해 굽고 끓이는 화구예요. 주문받은 요리에 맞춰 사용할 수 있어요.',board:'재료를 하나씩 손질하고 마지막 한 접시를 담는 작업대예요.'}[id];}return;}if(id==='fridge'){view='fridge';if(!k.step)k.stage='fridge';render();}else if(k.stage==='process'&&step().station===id){view='process';render();}else bridge.toast(k.stage==='process'?`다음은 ${step().title} 단계예요. 표시된 도구를 눌러 주세요.`:'먼저 냉장고에서 주문에 필요한 재료를 꺼내 주세요.');return;}
      const door=event.target.closest('[data-door]');if(door){toggleDoor(door.dataset.door);return;}
      const page=event.target.closest('[data-shelf-page]');if(page){const chamber=page.dataset.shelfPage,per=chamber==='freezer'?8:12,total=Object.keys(E.ingredients).filter(id=>E.ingredients[id].storage===chamber&&E.ingredientAvailable(state(),id)).length;pages[chamber]=(pages[chamber]+1)%Math.ceil(total/per);render();return;}
      const stock=event.target.closest('[data-stock]');if(stock){const id=stock.dataset.stock;
        if(state().kitchen.selected.includes(id)||!recipe().ingredients.includes(id)||!state().kitchen.step&&recipe().ingredients.includes(id)){
          if(!state().inventory[id]||state().kitchen.selected.includes(id)||!recipe().ingredients.includes(id)){if(E.buy(state(),id,1)){FX?.play('buy');if(!state().kitchen.selected.includes(id))E.selectIngredient(state(),id);bridge.changed();}else bridge.toast('재료를 채울 자금과 수량을 확인해 주세요.');}
          else E.selectIngredient(state(),id);
        }render();return;}
      const power=event.target.closest('[data-power]');if(power){local.power=Number(power.dataset.power);document.querySelectorAll('[data-power]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.power)===local.power)));return;}
      const button=event.target.closest('[data-work]');if(button&&!button.disabled){work(button.dataset.work);return;}
    });
    root.addEventListener('pointerdown',event=>{
      const dial=event.target.closest('#gas-dial'),object=event.target.closest('#cook-object');if(!dial&&!object||local.done)return;
      const box=(dial||object).getBoundingClientRect(),x=(event.clientX-box.x)/box.width,y=dial?(event.clientY-box.y)/box.height:inputY((event.clientY-box.y)/box.height),st=step(),id=gestureId(st);
      if(!dial&&['measure','assemble','paste','portion'].includes(id)&&!(x>=.12&&x<=.48&&y>=.15&&y<=.6)){bridge.toast('점선이 시작되는 왼쪽 동그라미를 잡아 주세요.');refreshGuides();return;}
      if(!dial&&id==='heat')return;local.motion=0;bridge.clearToast?.();down={gesture:G.begin(id,x,y),box,dial:!!dial,id:event.pointerId,el:dial||object,measure:id==='measure',paste:id==='paste',overTarget:false};
      down.el.setPointerCapture(event.pointerId);document.querySelector('.prep-scene')?.classList.add('is-dragging');event.preventDefault();
      if(id==='portion'){ricePointer={x,y};paintRiceHand();}
    });
    root.addEventListener('pointermove',event=>{
      if(!down||down.id!==event.pointerId)return;const x=(event.clientX-down.box.x)/down.box.width,y=down.dial?(event.clientY-down.box.y)/down.box.height:inputY((event.clientY-down.box.y)/down.box.height);
      if(down.dial){setPower(G.power(x-.5,y-.5));return;}
      if(step().id==='prep'&&step().mode==='cut'&&down.strokeDone&&y<.32){down.gesture=G.begin('cut',x,y);down.strokeDone=false;}
      G.move(down.gesture,x,y);if(gestureId(step())==='beat'&&down.gesture.distance>.04&&Math.abs(down.gesture.angle)>.08){FX?.flow(step(),true);down.soundAt=performance.now();}if(['pour','broth'].includes(step().id)&&down.gesture.distance>.12)FX?.flow(step(),true);
      if(step().id==='portion'){ricePointer={x,y};paintRiceHand();}
      if(down.paste){local.fill=Math.max(0,Math.min(.99,(x-.3)/.44));FX?.flow(step(),down.gesture.distance>.05);paintFrame();return;}
      if(down.measure){down.overTarget=x>=.58&&x<=.92&&y>=.4&&y<=.85;FX?.flow(step(),down.overTarget&&local.fill<1);document.querySelector('.prep-scene')?.classList.toggle('is-pouring',down.overTarget);return;}
      if(step().id==='prep'&&step().mode==='cut'&&local.knife&&!local.done&&!down.strokeDone&&G.valid(down.gesture)){
        const slot=Math.max(0,Math.min(2,Math.round((down.gesture.start.x-.35)/.15)));
        if(!local.cutSlots.includes(slot)){local.cutSlots.push(slot);FX?.play('cut');local.count++;local.done=local.count>=step().goal;down.cutsCommitted=true;down.strokeDone=true;
          paintFrame();const counter=document.querySelector('.action-counter');if(counter)counter.textContent=local.done?'':`${local.count} / ${step().goal}`;refreshGuides();}
      }
      if(step().id!=='portion'&&step().id!=='assemble'&&!(step().id==='prep'&&step().mode==='cut')){
        const id=gestureId(step()),g=down.gesture;
        local.motion=id==='beat'?Math.abs(g.angle)/(Math.PI*2):Math.min(1,g.distance/.5);
        paintFrame();
      }
      const knife=document.querySelector('.held-knife');if(knife){local.toolX=x;local.toolY=y;knife.style.left=`${x*100}%`;knife.style.top=`${displayY(y)*100}%`;knife.style.setProperty('--knife-angle',`${knifeAngle(x,y)}deg`);}
      if(step().id==='assemble'){const progress=Math.max(0,Math.min(1,(x-.3)/.42));document.querySelector('.prep-scene')?.style.setProperty('--transfer',progress);}
    });
    root.addEventListener('pointerup',event=>{if(!down||down.id!==event.pointerId)return;const current=down;if(current.paste)G.move(current.gesture,(event.clientX-current.box.x)/current.box.width,inputY((event.clientY-current.box.y)/current.box.height));FX?.flow(step(),false);down=null;ricePointer=null;paintRiceHand();local.motion=0;document.querySelector('.prep-scene')?.classList.remove('is-dragging','is-pouring');if(!current.dial){if(current.cutsCommitted)process();else commitDrag(current.gesture);}});
    root.addEventListener('pointercancel',()=>{if(!state().kitchen){down=null;return;}FX?.flow(step(),false);down=null;ricePointer=null;paintRiceHand();local.motion=0;paintFrame();document.querySelector('.prep-scene')?.classList.remove('is-dragging','is-pouring');});
    root.addEventListener('keydown',event=>{if(event.target.id==='gas-dial'&&['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();setPower(Math.max(0,Math.min(1.6,local.power+(['ArrowRight','ArrowUp'].includes(event.key)?.1:-.1))));}});
  }

  function tick(dt){
    if(down?.soundAt&&performance.now()-down.soundAt>160){FX?.flow({id:'beat'},false);down.soundAt=0;}
    if(visible&&view==='process'&&down?.measure&&down.overTarget&&state().kitchen&&!local.done){
      local.fill=Math.min(1,local.fill+dt/1400);if(local.fill>=1)FX?.flow(step(),false);const m=measureSpec(),frame=document.querySelector('.measure-frame'),n=Math.min(3,Math.floor(local.fill*3));
      if(frame)frame.style.backgroundPosition=`${n%2*100}% ${Math.floor(n/2)*100}%`;
      document.querySelector('.measure-status')?.setAttribute('aria-valuenow',String(Math.round(local.fill*m.amount)));
      if($('measure-value'))$('measure-value').textContent=`${Math.round(local.fill*m.amount)} / ${m.amount}${m.unit}`;
      if($('measure-fill'))$('measure-fill').style.width=`${local.fill*100}%`;
      if($('measure-help'))$('measure-help').textContent=local.fill>=1?'다 찼어요. 손을 떼세요.':'채우는 중… 손을 떼면 멈춰요.';
    }
    if(!visible||view!=='process'||!state().kitchen||step()?.id!=='heat'||!local.started||local.done||!state().stoveTutorialDone&&local.tutorial===2)return;
    const spec=E.cookSpec(state(),order().recipe);local.heat=Math.min(1,local.heat+dt/spec.heatTime*local.power);updateHeat();
    if(local.heat>=1){stopHeat();if(state().stoveTutorialDone)bridge.toast('불을 늦게 껐어요. 다음에는 초록 구간에서 멈춰 주세요.');}
  }

  window.MidnightKitchen={init,open,show,hide,tick,checkpoint,clearCheckpoint,isVisible:()=>visible};
})();
