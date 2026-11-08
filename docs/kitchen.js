/* First-person kitchen: clickable equipment, a two-compartment fridge, and tactile recipe steps. */
(() => {
  'use strict';
  const E=window.MidnightEngine,R=window.MidnightCookingRules,G=window.MidnightGestures,$=id=>document.getElementById(id);
  const FX=window.MidnightAudio;
  let refillQuantity=1;
  let bridge,view='room',visible=false,stepKey='',local={},doors={fridge:false,freezer:false},pages={fridge:0,freezer:0},focused=null,down=null,skipClick=0;
  const state=()=>bridge.getState(),order=()=>state().guests.find(g=>g.id===state().kitchen?.guest),recipe=()=>E.recipes[order()?.recipe],plan=()=>R.plan(order().recipe,recipe()),step=()=>plan()[state().kitchen.step];
  function resetStep(){const key=`${state().night}-${order().id}-${state().kitchen.step}`;if(stepKey===key)return;stepKey=key;local={count:0,done:false,quality:1,heat:0,power:0,started:false,flipped:false,flipQuality:1,oil:null,knife:true,cutSlots:[],tutorial:0,toolX:.35,toolY:.22,fill:0,motion:0,practiceScore:0,practiceGood:false,demoUntil:0};}
  function show(){if(!state().kitchen)return;visible=true;$('kitchen-screen').classList.toggle('kitchen-upgraded',state().upgrades.includes('fridge'));view=state().kitchen.stage==='fridge'?'fridge':state().kitchen.stage==='complete'?'complete':state().kitchen.stage==='process'?'process':'room';resetStep();$('kitchen-screen').hidden=false;$('app').classList.add('in-kitchen');render();}
  function hide(){FX?.stopCooking();visible=false;$('kitchen-screen').hidden=true;$('app').classList.remove('in-kitchen');bridge?.save();}
  function header(){const k=state().kitchen,g=order();$('kitchen-guest').textContent=`${E.person(g.person).name} 님의 주문 · COUNTER 0${g.seat+1}`;$('kitchen-order').textContent=recipe().name;$('kitchen-step-count').textContent=k.stage==='complete'?'완성':`${k.step+1} / ${plan().length}`;}
  function footer(html){$('kitchen-footer').innerHTML=html;}
  function room(){const k=state().kitchen,prepared=k.stage==='process',target=prepared?step().station:'fridge',names={fridge:'냉장고',rice:'밥솥',stove:'화구',board:'작업대'};
    $('kitchen-content').innerHTML=`<div class="kitchen-room-art ${state().upgrades.includes('fridge')?'renovated':''}"><p class="room-task"><small>다음 할 일</small><b>${prepared?step().title:'냉장고에서 재료 꺼내기'}</b><span>${prepared?names[target]+'를 눌러 이어서 만들어요.':'냉장고와 냉동실 문을 직접 열어 보세요.'}</span></p>${['fridge','stove','rice','board'].map(id=>`<button data-station="${id}" class="room-hotspot hotspot-${id} ${target===id?'station-next':''}" aria-label="${names[id]}로 이동"><span>${names[id]} ${target===id?'↗':''}</span></button>`).join('')}</div>`;
    footer(`<p>부엌 도구를 직접 눌러 요리해요.</p>${k.step?'<button data-work="resume" class="primary">진행 중인 조리 이어서 하기 →</button>':''}`);
  }
  function stockButtons(chamber){const ids=Object.keys(E.ingredients).filter(id=>E.ingredients[id].storage===chamber&&E.ingredientAvailable(state(),id)),per=chamber==='freezer'?8:12,count=Math.max(1,Math.ceil(ids.length/per));pages[chamber]=Math.min(pages[chamber],count-1);
    const buttons=ids.slice(pages[chamber]*per,(pages[chamber]+1)*per).map((id,i)=>{const item=E.ingredients[id],stock=state().inventory[id],selected=state().kitchen.selected.includes(id),required=recipe().ingredients.includes(id),row=Math.floor(i/4),top=(chamber==='freezer'?15.8+row*7.5:45.1+row*11.1);
      return `<button data-stock="${id}" class="stored-ingredient ${stock?'in-stock':'empty-stock'} ${selected?'stock-selected':''} ${required?'stock-required':''}" style="left:${14+i%4*18}%;top:${top}%"  aria-label="${item.name} 재고 ${stock}개${selected?' 선택됨':''}">${bridge.food(id)}<b>${item.name}</b><small>${selected?'✓ ':''}×${stock}</small></button>`;
    }).join('');return{buttons,count};
  }
  function fridge(){const cold=stockButtons('fridge'),frozen=stockButtons('freezer');
    $('kitchen-content').innerHTML=`<div class="fridge-view"><div class="fridge-tabs"><button data-door="freezer" aria-expanded="${doors.freezer}">냉동실 ${doors.freezer?'닫기':'열기'}</button><button data-door="fridge" aria-expanded="${doors.fridge}">냉장실 ${doors.fridge?'닫기':'열기'}</button></div><div class="fridge-cabinet ${doors.fridge?'fridge-open':''} ${doors.freezer?'freezer-open':''} ${state().upgrades.includes('fridge')?'upgraded':''}"><img src="./assets/fridge-open.webp" alt="선반이 있는 실제 냉장고와 냉동실 내부"><div class="shelf-items freezer-items" ${doors.freezer?'':'inert'}>${frozen.buttons}</div><div class="shelf-items fridge-items" ${doors.fridge?'':'inert'}>${cold.buttons}</div><button class="fridge-door door-freezer" data-door="freezer" aria-label="냉동실 문 열기"></button><button class="fridge-door door-fridge" data-door="fridge" aria-label="냉장고 문 열기"></button></div><div class="fridge-pages">${frozen.count>1?`<button data-shelf-page="freezer">냉동실 선반 ${pages.freezer+1}/${frozen.count} ›</button>`:''}${cold.count>1?`<button data-shelf-page="fridge">냉장실 선반 ${pages.fridge+1}/${cold.count} ›</button>`:''}</div></div>`;
    fridgeFooter();
  }
  function refillMax(){return focused?Math.max(0,Math.min(99,999-state().inventory[focused],Math.floor(state().money/E.buyPrice(state(),focused)))):0;}
  function fridgeFooter(){
    const k=state().kitchen,missing=recipe().ingredients.filter(id=>!k.selected.includes(id)),item=E.ingredients[focused],max=refillMax(),locked=Object.entries(E.ingredients).filter(([id])=>!E.ingredientAvailable(state(),id));refillQuantity=Math.max(1,Math.min(refillQuantity,max||1));
    footer(`${item?`<div class="stock-inspector"><div><b>${item.name}</b><span>재고 ${state().inventory[focused]}개</span></div><div class="refill-order"><div class="quantity-stepper"><button data-refill-step="-1" ${refillQuantity<=1?'disabled':''} aria-label="구매 수량 줄이기">−</button><input data-refill-qty type="number" inputmode="numeric" min="1" max="${max||1}" value="${refillQuantity}" aria-label="${item.name} 구매 수량"><button data-refill-step="1" ${refillQuantity>=max?'disabled':''} aria-label="구매 수량 늘리기">+</button></div><button data-refill="${focused}" ${!max?'disabled':''}>${refillQuantity}개 채우기 · ¥${E.buyPrice(state(),focused)*refillQuantity}</button></div></div><p class="refill-tip">필요한 재료는 테두리로 표시돼요. 선택한 재료를 다시 누르면 1개씩 추가 구매해요.</p>`:''}<div class="needed-ingredients">${recipe().ingredients.map(id=>`<span class="${k.selected.includes(id)?'ready':''}">${k.selected.includes(id)?'✓ ':''}${E.ingredients[id].name}</span>`).join('')}</div><p>${k.step?'재료 준비는 끝났어요. 조리를 이어 가세요.':missing.length?`문을 열고 ${missing.map(id=>E.ingredients[id].name).join(' · ')}을(를) 골라 주세요.`:'재료를 모두 꺼냈어요. 다음 조리 단계로 이동해요.'}</p>${E.rescueNeeds(state())?'<button data-work="rescue" class="neighbor-help">재료 도움받기 · 평판 −3</button>':''}<button data-work="ingredients-next" class="primary" ${!k.step&&!E.readyIngredients(state())?'disabled':''}>다음 · 조리대로 이동 →</button>${locked.length?`<details class="fridge-locked"><summary>앞으로 열릴 재료 ${locked.length}종 보기</summary>${locked.map(([id,item])=>`<span>Lv.${item.level} · ${item.name}</span>`).join('')}</details>`:''}`);
  }
  function toggleDoor(chamber){FX?.play('door');doors[chamber]=!doors[chamber];document.querySelector('.fridge-cabinet')?.classList.toggle(`${chamber}-open`,doors[chamber]);const shelf=document.querySelector(`.${chamber}-items`);if(shelf)shelf.inert=!doors[chamber];document.querySelectorAll(`[data-door="${chamber}"]`).forEach(b=>{b.setAttribute('aria-expanded',String(doors[chamber]));if(!b.classList.contains('fridge-door'))b.textContent=`${chamber==='freezer'?'냉동실':'냉장실'} ${doors[chamber]?'닫기':'열기'}`;});}
  function visual(st){
    const index=Object.keys(E.recipes).indexOf(order().recipe),count=Math.max(0,local.count+(local.motion||0));
    if(st.id==='assemble')return {file:`plating-${Math.floor(index/4)+1}`,cols:2,rows:2,col:index%2,row:Math.floor(index%4/2),className:'plating-frame'};
    if(st.id==='prep'&&st.mode==='measure'){const n=Math.min(3,Math.floor(local.fill*3));return {file:`measure-${st.part}`,cols:2,rows:2,col:n%2,row:Math.floor(n/2),className:'measure-frame'};}
    if(st.id==='heat'){const n=R.heated.indexOf(order().recipe),spec=E.cookSpec(state(),order().recipe),phase=local.heat<spec.ideal*.4?0:local.heat<spec.ideal*.86?1:2;return {file:`heat-hi-${Math.floor(n/2)+1}`,cols:2,rows:3,col:n%2,row:phase,className:'heat-frame'};}
    const n=st.id==='portion'?Math.min(3,local.count):st.id==='lid'?(local.done?3:(local.motion||0)>.2?2:0):Math.min(3,Math.floor(count/st.goal*3));
    return {file:st.id==='prep'?`prep-hi-${st.part}`:(st.id==='portion'?'core-portion-v19':`core-${st.id}`),cols:2,rows:2,col:n%2,row:Math.floor(n/2),className:st.id==='prep'?'prep-frame':'core-frame'};
  }
  function sceneFrame(){const st=step(),v=visual(st);return `<span class="recipe-frame ${v.className}" data-ingredient="${st.ingredient||''}" data-part="${st.part||''}" data-frame="${v.col+v.row*v.cols}" role="img" aria-label="${st.title} · ${st.id==='portion'?`그릇에 밥 ${local.count}주걱`:local.done?'준비 완료':'조리 중'}" style="background-image:url('./assets/${v.file}.webp');background-size:${v.cols*100}% ${v.rows*100}%;background-position:${v.col*100/(v.cols-1)}% ${v.row*100/(v.rows-1)}%"></span>`;}
  function paintFrame(){const el=document.querySelector('#cook-object .recipe-frame');if(!el)return;const v=visual(step());el.style.backgroundPosition=`${v.col*100/(v.cols-1)}% ${v.row*100/(v.rows-1)}%`;el.dataset.frame=String(v.col+v.row*v.cols);}
  const measurements={soy:{amount:15,unit:'mL',vessel:'계량스푼'},dashi:{amount:150,unit:'mL',vessel:'계량컵'},milk:{amount:100,unit:'mL',vessel:'계량컵'},miso:{amount:1,unit:'스푼',vessel:'나무 스푼'},flour:{amount:30,unit:'g',vessel:'계량 그릇'},sugar:{amount:1,unit:'스푼',vessel:'계량스푼'}};
  function measureSpec(){return measurements[step()?.part]||measurements.soy;}
  function gestureId(st){return st.id==='prep'?({cut:'cut',wash:'beat',peel:'peel',crack:'crack',fold:'shape',measure:'measure'}[st.mode]):st.id;}
  function guideText(st){
    if(local.done)return '✓ 끝났어요. 아래의 다음 버튼을 눌러 주세요.';
    if(st.id==='heat'&&!state().stoveTutorialDone)return '연습에서도 익힘이 실제처럼 올라가요. 다이얼을 돌려 켜고 초록 구간에서 꺼 보세요.';
    if(st.id==='prep'&&st.mode==='cut')return '준비된 칼로 점선의 위쪽 동그라미에서 화살표 끝까지 내려 썰어 주세요.';
    if(st.id==='prep'&&st.mode==='wash')return '그릇 안 동그란 점선을 한 바퀴 따라 움직이며 씻어 주세요.';
    if(st.id==='prep'&&st.mode==='fold')return '김 가장자리의 동그라미에서 가운데까지 한 번 접어 주세요.';
    if(st.id==='prep'&&st.mode==='measure'){const m=measureSpec();return `왼쪽 용기를 오른쪽 ${m.vessel} 위로 끌어 ${m.amount}${m.unit}가 될 때까지 유지하세요. 손을 떼면 멈춰요.`;}
    return {beat:'동그란 점선을 따라 그릇 안을 저으세요. 3바퀴면 준비돼요.',lid:'뚜껑의 동그라미에서 위로 밀어 밥솥을 열어 주세요.',shape:'흩어진 밥을 모으고, 둥글게 쥔 뒤 세모로 빚어요. 점선을 세 번 따라 주세요.',portion:'왼쪽 밥솥에서 밥을 떠 점선을 따라 오른쪽 아래 그릇에 담아 주세요. 세 주걱이면 돼요.',assemble:'조리된 음식 위 동그라미를 잡고 점선을 따라 서빙 접시로 옮겨 주세요.',pour:'위쪽 동그라미에서 아래로 끌어 그릇을 기울여 부으세요.',broth:'위쪽 동그라미에서 아래로 끌어 냄비에 부으세요. 두 번 반복해요.',wrap:'김 가장자리의 동그라미에서 가운데로 밀어 감싸 주세요.',drain:'아래 동그라미에서 위로 끌어 면을 건져 주세요.',crack:'위쪽 동그라미에서 아래로 내려 달걀을 깨 주세요.',peel:'가운데 동그라미에서 바깥쪽 화살표 끝까지 벗겨 주세요.',heat:st.flip?'다이얼로 불을 켜고 뒤집기 버튼으로 반대쪽도 익혀요. 초록 구간에서 불을 꺼 주세요.':'다이얼로 불을 켜고 초록 구간에서 불 끄고 마무리를 눌러 주세요.'}[gestureId(st)]||'동그라미를 잡고 점선을 따라 움직여 주세요.';
  }
  function guideMarkup(st){
    if(local.done||st.id==='heat')return '';
    const paths=G.guide(gestureId(st),{cuts:local.cutSlots}),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    return `<svg class="motion-guide" viewBox="0 0 100 100" aria-hidden="true"><defs><marker id="cook-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#fff0b3" stroke-width="2"/></marker></defs>${paths.map((g,i)=>{const d=g.points.map(([x,y],j)=>`${j?'L':'M'}${x*100},${y*100}`).join(' '),[x,y]=g.points[0];return `<g class="guide-path" data-cut="${gestureId(st)==='cut'?Math.round((x-.35)/.15):''}"><path d="${d}" class="guide-shadow"/><path d="${d}" class="guide-line" marker-end="url(#cook-arrow)"/><circle cx="${x*100}" cy="${y*100}" r="4.2" class="guide-start"/><text x="${x*100}" y="${y*100+1.5}" text-anchor="middle">${gestureId(st)==='cut'?Math.round((x-.35)/.15)+1:'●'}</text>${reduce?'':`<circle r="2.5" class="guide-finger"><animateMotion dur="2.2s" repeatCount="indefinite" path="${d}"/></circle>`}</g>`;}).join('')}</svg>`;
  }
  function refreshGuides(){const el=$('motion-guides');if(el)el.innerHTML=guideMarkup(step());}
  function measureDisplay(){const m=measureSpec();return `<div class="measure-status" aria-live="polite"><b>${R.prepNames[step().part]} · 목표 ${m.amount}${m.unit}</b><span id="measure-value">${Math.round(local.fill*m.amount)} / ${m.amount}${m.unit}</span><div class="measure-progress"><i id="measure-fill" style="width:${local.fill*100}%"></i></div><small id="measure-help">${local.done?'✓ 계량됐어요':local.fill>=1?'다 찼어요. 손을 떼세요.':'점선 끝의 용기 위에 잠시 유지하면 채워져요.'}</small></div>`;}
  function fire(){return `<svg class="live-gas" viewBox="0 0 240 90" aria-label="실제 불 세기에 따라 흔들리는 가스 불꽃">${Array.from({length:14},(_,i)=>{const x=20+i*15;return `<path style="animation-delay:${-i*.073}s" d="M${x} 80 Q${x-10} 60 ${x} 25 Q${x+13} 62 ${x} 80" fill="#318ffc"/><path style="animation-delay:${-i*.073}s" d="M${x} 79 Q${x-4} 65 ${x} 48 Q${x+5} 65 ${x} 79" fill="#b6eeff"/>`;}).join('')}</svg>`;}
  function knifeAngle(x,y){return Math.atan2(1.16-y,.86-x)*180/Math.PI-48;}
  function objectContent(st){return sceneFrame()+(st.id==='heat'?fire():st.id==='prep'&&st.mode==='cut'&&local.knife?`<span class="held-knife" style="left:${local.toolX*100}%;top:${local.toolY*100}%;--knife-angle:${knifeAngle(local.toolX,local.toolY)}deg"></span>`:'')+`<span id="motion-guides">${guideMarkup(st)}</span>`;}
  function lesson(){
    const phase=local.tutorial||0,spec=E.cookSpec(state(),order().recipe);
    return `<aside id="heat-lesson" class="heat-lesson"><small>재료가 줄지 않는 불 조절 연습</small><h4>${phase===2?(local.practiceGood?'알맞게 멈췄어요!':'이번엔 조금 달랐어요'):phase===0?'손잡이를 잡고 시계 방향으로 돌려 보세요.':'익힘 막대를 보고 초록 구간에서 불을 꺼 보세요.'}</h4><p>${phase===2?`이번 연습 익힘 점수 <b>${local.practiceScore} / 100</b>. ${local.practiceGood?'이 타이밍이면 만족도와 팁을 높이기 좋아요.':'너무 덜 익거나 지나치게 익으면 만족도와 팁이 줄어요.'}`:`알맞음은 ${Math.round((spec.ideal-spec.band/2)*100)}–${Math.round((spec.ideal+spec.band/2)*100)}%. 다이얼을 0으로 돌리거나 ‘불 끄고 마무리’를 눌러요. 알맞게 익힐수록 높은 만족도와 팁을 기대할 수 있어요.`}</p>${phase===2?'<div class="practice-actions"><button data-work="practice-retry">다시 연습</button><button data-work="tutorial-done">이제 직접 요리하기 →</button></div>':'<span id="practice-live">아래 익힘 막대가 실제처럼 움직여요.</span>'}</aside>`;
  }
  function heatControls(st,spec){return `<div class="stove-controls">${!state().stoveTutorialDone?lesson():''}<div class="heat-label"><span>덜 익음</span><span class="heat-target" style="left:${spec.ideal*100}%">알맞음</span><span>너무 익음</span></div><div class="heat-meter" role="meter" aria-label="익힘 정도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="perfect-zone" style="left:${(spec.ideal-spec.band/2)*100}%;width:${spec.band*100}%"></div><i id="heat-marker"></i></div><div class="gas-panel"><div class="dial-wrap"><svg class="dial-guide" viewBox="0 0 100 100" aria-hidden="true"><path d="M16 80 A42 42 0 1 1 84 80" fill="none" stroke="#f6d699" stroke-width="2" stroke-dasharray="4 4"/><path d="M78 76 L84 83 L90 74" fill="none" stroke="#f6d699" stroke-width="2"/></svg><button id="gas-dial" role="slider" aria-label="가스레인지 불 조절 다이얼" aria-valuemin="0" aria-valuemax="160" aria-valuenow="${Math.round(local.power*100)}"><i style="transform:rotate(${local.power/1.6*270-135}deg)"></i></button><svg class="dial-demo" viewBox="0 0 100 100" aria-hidden="true"><g><path d="M50 50 L50 15" stroke="#fff0af" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="15" r="6" fill="#ffe9a6"/><animateTransform attributeName="transform" type="rotate" values="-125 50 50;35 50 50;-125 50 50" dur="3s" repeatCount="indefinite"/></g></svg></div><span><b id="stove-state">불 꺼짐</b><br>↻ 시계 방향: 세게<br>↶ 반대 방향: 약하게<br><strong>0 · 끔으로 돌리면 멈춰요</strong></span></div><span class="dial-off-mark">↙ 0 · 끔</span><div class="heat-actions"><button data-work="heat-stop" ${!local.started||local.done?'disabled':''}>불 끄고 마무리</button>${st.flip&&state().stoveTutorialDone?`<button data-work="flip" ${!local.started||local.flipped||local.done?'disabled':''}>${local.flipped?'✓ 반대쪽도 익히는 중':R.family(order().recipe,recipe())==='egg'?'도구로 말기':'뒤집개로 뒤집기'}</button>`:''}</div><button data-work="guide-replay" class="guide-replay">↻ 다이얼 돌리는 모습 보기</button>${state().stoveTutorialDone&&!local.started?'<button data-work="practice-start" class="subtle-action">불 조절 다시 연습하기</button>':''}</div>`;}
  function process(){
    resetStep();const st=step(),spec=E.cookSpec(state(),order().recipe),isHeat=st.id==='heat',names={rice:'밥솥',stove:'화구',board:'작업대'};
    $('kitchen-content').innerHTML=`<div class="process-view station-${st.station}"><div class="process-heading"><span>${names[st.station]} · ${state().kitchen.step+1}단계</span><h3>${st.title}</h3><p>${guideText(st)}</p>${st.id==='prep'?`<div class="prep-queue">${plan().filter(x=>x.id==='prep').map(x=>`<span class="${x.art===st.art?'current':''}">${R.prepNames[x.part]}</span>`).join('')}</div>`:''}</div><div class="prep-scene ${st.id} ${local.done?'action-done':''}"><button id="cook-object" class="cook-object" aria-label="${st.title} 조작">${objectContent(st)}</button><div class="action-spark" aria-hidden="true"></div></div>${isHeat?heatControls(st,spec):`${st.id==='prep'&&st.mode==='measure'?measureDisplay():''}<div class="action-counter" aria-live="polite">${st.id==='portion'?`그릇에 밥 ${local.count}주걱 / 3주걱`:local.done?'✓ 준비됐어요':`${Math.min(local.count,st.goal)} / ${st.goal}`}</div>${st.id==='portion'&&local.count?'<button data-work="less-rice" class="subtle-action">한 주걱 덜기</button>':''}${!local.done?'<button data-work="guide-replay" class="guide-replay">↻ 동작 다시 보기</button>':''}`}</div>`;
    processFooter();if(isHeat)updateHeat();else FX?.heat(false,0);
  }
  function processFooter(){
    const st=step(),next=plan()[state().kitchen.step+1];
    if(st.id==='heat'&&!state().stoveTutorialDone){footer('<p>불 조절 연습 중이에요. 실제처럼 익혀 보고, 초록 구간에서 멈춰 보세요.<br>연습에는 재료와 돈이 들지 않아요.</p>');return;}
    footer(`<p id="step-feedback">${local.done?'✓ 끝났어요. 다음으로 넘어가세요.':guideText(st)}</p><button data-work="next-step" class="primary" ${local.done?'':'disabled'}>${st.id==='prep'&&next?.id==='prep'?`${R.prepNames[next.part]} 꺼내기 →`:'다음 →'}</button><button data-work="overview" class="subtle-action">부엌 둘러보기</button>`);
  }
  function complete(){const r=recipe();$('kitchen-content').innerHTML=`<div class="completed-dish"><span class="eyebrow">READY TO SERVE</span><h3>한 접시가 완성됐어요.</h3><div class="ready-plate original-ready">${bridge.food(order().recipe)}</div><strong>${r.name}</strong><p>${E.person(order().person).name} 님께 따뜻할 때 내어 드릴까요?</p></div>`;footer('<button data-work="deliver" class="primary">내어놓기 →</button><p>손님이 식사를 마친 뒤 만족도와 음식값을 확인해요.</p>');}
  function render(){if(!visible||!state().kitchen)return;header();if(state().kitchen.stage==='complete')view='complete';if(view!=='process')FX?.stopCooking();if(view==='room')room();else if(view==='fridge')fridge();else if(view==='complete')complete();else process();bridge.save();}
  function feedbackMotion(){const el=$('cook-object');el?.animate([{transform:'translateY(0)'},{transform:'translateY(5px) scale(.98)'},{transform:'translateY(0)'}],{duration:270});const spark=document.querySelector('.action-spark');spark?.animate([{opacity:1,transform:'scale(.5)'},{opacity:0,transform:'scale(1.2)'}],{duration:450});}
  function commitDrag(g){if(view!=='process'||local.done)return;const st=step();if(st.id==='prep'&&st.mode==='measure'){if(local.fill>=1&&G.valid(g)){local.count=1;local.done=true;FX?.play('serve');process();}else{process();bridge.toast(local.fill?'조금 더 덜어 주세요. 점선 끝에서 목표량까지 유지하세요.':'왼쪽 용기에서 시작해 오른쪽 계량 도구로 끌어 주세요.');}return;}if(st.id==='heat')return;if(!G.valid(g)){bridge.toast(guideText(st));refreshGuides();return;}
    if(st.id==='prep'&&st.mode==='cut'){const slot=Math.max(0,Math.min(2,Math.round((g.start.x-.35)/.15)));if(local.cutSlots.includes(slot)){bridge.toast('아직 썰지 않은 부분을 손질해 주세요.');return;}local.cutSlots.push(slot);}
    FX?.play(st.id==='portion'?'scoop':st.id==='lid'?'lid':['pour','broth'].includes(st.id)?'pour':st.id==='beat'?'whisk':st.mode==='cut'?'cut':['shape','wrap'].includes(st.id)||['peel','fold'].includes(st.mode)?'shape':st.mode==='wash'?'whisk':st.mode==='crack'?'lid':'serve');local.count+=st.id==='beat'?Math.max(1,Math.floor(Math.abs(g.angle)/(Math.PI*2))):1;local.done=local.count>=st.goal;local.quality=1;if(st.id==='oil')local.oil=true;if(st.id==='assemble'&&local.done){E.completeCookingStep(state(),local.quality);view='complete';render();bridge.changed();return;}process();
  }
  function setPower(power){
    if(local.done||!state().stoveTutorialDone&&local.tutorial===2)return;
    const wasStarted=local.started;local.power=power;if(power>.04){local.started=true;if(!state().stoveTutorialDone)local.tutorial=1;}
    if(power<=.04&&wasStarted){stopHeat();return;}
    const dial=$('gas-dial');if(dial){dial.setAttribute('aria-valuenow',String(Math.round(power*100)));dial.querySelector('i').style.transform=`rotate(${power/1.6*270-135}deg)`;}
    if(!state().stoveTutorialDone){const card=$('heat-lesson');if(card){const wrap=document.createElement('div');wrap.innerHTML=lesson();card.replaceWith(wrap.firstElementChild);}}
    updateHeat();
  }
  function updateHeat(){FX?.heat(visible&&view==='process'&&local.started&&local.power>.04&&!local.done,local.power);
    const caption=$('stove-state');if(caption)caption.textContent=local.done?'불 꺼짐 · 조리 완료':local.power>.04?'불 켜짐 · 익히는 중':'불 꺼짐';
    const stop=document.querySelector('[data-work="heat-stop"]');if(stop)stop.disabled=!local.started||local.done;
    const flip=document.querySelector('[data-work="flip"]');if(flip)flip.disabled=!local.started||local.flipped||local.done;
    const meter=document.querySelector('.stove-controls .heat-meter');if(!meter)return;meter.setAttribute('aria-valuenow',String(Math.round(local.heat*100)));$('heat-marker').style.left=`${local.heat*100}%`;paintFrame();
    const scene=document.querySelector('.prep-scene');scene?.classList.toggle('fire-on',local.started&&local.power>.04&&!local.done);scene?.style.setProperty('--gas-strength',String(local.power/1.6));
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
    if(action==='next-step'&&local.done){bridge.clearToast?.();if(E.completeCookingStep(state(),local.quality)){view=k.stage==='complete'?'complete':'process';resetStep();render();bridge.changed();}return;}
    if(action==='less-rice'){local.count=Math.max(0,local.count-1);local.done=local.count>=3;local.quality=Math.max(.25,1-Math.abs(3-local.count)*.25);process();return;}
    if(st.id==='oil'&&(action==='oil'||action==='dry-pan')){local.oil=action==='oil';local.done=true;local.quality=st.required&&!local.oil?.45:1;process();if(local.oil)FX?.play('pour');if(local.oil)document.querySelector('.oil-cruet')?.animate([{transform:'rotate(0)'},{transform:'translate(-40px,-10px) rotate(-45deg)'},{transform:'rotate(0)'}],{duration:650});return;}
    if(st.id==='heat'){
      if(action==='heat-start'&&!local.started){local.started=true;process();}
      if(action==='heat-stop'&&local.started&&!local.done){local.power=0;stopHeat();}
      if(action==='flip'&&st.flip&&local.started&&!local.done&&!local.flipped){FX?.play('flip');local.flipped=true;local.flipQuality=local.heat>=.25&&local.heat<=.65?1:.82;process();document.querySelector('.heat-vessel')?.animate([{transform:'rotate(0)'},{transform:'translateY(-20px) rotate(-12deg)'},{transform:'rotate(0)'}],{duration:550});}
    }
  }
  function init(api){bridge=api;$('kitchen-back').addEventListener('click',()=>{hide();bridge.changed();});const root=$('kitchen-screen');
    root.addEventListener('click',event=>{const station=event.target.closest('[data-station]');if(station){const id=station.dataset.station,k=state().kitchen;if(id==='fridge'){view='fridge';if(!k.step)k.stage='fridge';render();}else if(k.stage==='process'&&step().station===id){view='process';render();}else bridge.toast(k.stage==='process'?`다음은 ${step().title} 단계예요. 표시된 도구를 눌러 주세요.`:'먼저 냉장고에서 주문에 필요한 재료를 꺼내 주세요.');return;}
      const door=event.target.closest('[data-door]');if(door){toggleDoor(door.dataset.door);return;}
      const page=event.target.closest('[data-shelf-page]');if(page){const chamber=page.dataset.shelfPage,per=chamber==='freezer'?8:12,total=Object.keys(E.ingredients).filter(id=>E.ingredients[id].storage===chamber&&E.ingredientAvailable(state(),id)).length;pages[chamber]=(pages[chamber]+1)%Math.ceil(total/per);render();return;}
      const stock=event.target.closest('[data-stock]');if(stock){const id=stock.dataset.stock;if(focused!==id)refillQuantity=1;focused=id;
        if(state().kitchen.selected.includes(id)||!state().kitchen.step&&recipe().ingredients.includes(id)){
          if(!state().inventory[id]||state().kitchen.selected.includes(id)){if(E.buy(state(),id,1)){FX?.play('buy');if(!state().kitchen.selected.includes(id))E.selectIngredient(state(),id);bridge.changed();}else bridge.toast('재료를 채울 자금과 수량을 확인해 주세요.');}
          else E.selectIngredient(state(),id);
        }render();return;}
      const qty=event.target.closest('[data-refill-step]');if(qty){refillQuantity=Math.max(1,Math.min(refillMax()||1,refillQuantity+Number(qty.dataset.refillStep)));fridgeFooter();return;}
      const refill=event.target.closest('[data-refill]');if(refill){const id=refill.dataset.refill;if(E.buy(state(),id,refillQuantity)){FX?.play('buy');if(!state().kitchen.step&&recipe().ingredients.includes(id)&&!state().kitchen.selected.includes(id))E.selectIngredient(state(),id);render();bridge.changed();}return;}
      const power=event.target.closest('[data-power]');if(power){local.power=Number(power.dataset.power);document.querySelectorAll('[data-power]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.power)===local.power)));return;}
      const button=event.target.closest('[data-work]');if(button&&!button.disabled){work(button.dataset.work);return;}
    });
    root.addEventListener('pointerdown',event=>{
      const dial=event.target.closest('#gas-dial'),object=event.target.closest('#cook-object');if(!dial&&!object||local.done)return;
      const box=(dial||object).getBoundingClientRect(),x=(event.clientX-box.x)/box.width,y=(event.clientY-box.y)/box.height,st=step(),id=gestureId(st);
      if(!dial&&['measure','assemble'].includes(id)&&!(x>=.12&&x<=.48&&y>=.15&&y<=.6)){bridge.toast('점선이 시작되는 왼쪽 동그라미를 잡아 주세요.');refreshGuides();return;}
      if(!dial&&id==='heat')return;local.motion=0;bridge.clearToast?.();down={gesture:G.begin(id,x,y),box,dial:!!dial,id:event.pointerId,el:dial||object,measure:id==='measure',overTarget:false};
      down.el.setPointerCapture(event.pointerId);document.querySelector('.prep-scene')?.classList.add('is-dragging');event.preventDefault();
    });
    root.addEventListener('pointermove',event=>{
      if(!down||down.id!==event.pointerId)return;const x=(event.clientX-down.box.x)/down.box.width,y=(event.clientY-down.box.y)/down.box.height;
      if(down.dial){setPower(G.power(x-.5,y-.5));return;}
      if(step().id==='prep'&&step().mode==='cut'&&down.strokeDone&&y<.32){down.gesture=G.begin('cut',x,y);down.strokeDone=false;}
      G.move(down.gesture,x,y);if((gestureId(step())==='beat')&&performance.now()-(down.soundAt||0)>150){FX?.play('whisk');down.soundAt=performance.now();}if(['pour','broth'].includes(step().id)&&down.gesture.distance>.12)FX?.pour(true);
      if(down.measure){down.overTarget=x>=.58&&x<=.92&&y>=.4&&y<=.85;FX?.pour(down.overTarget&&local.fill<1);document.querySelector('.prep-scene')?.classList.toggle('is-pouring',down.overTarget);return;}
      if(step().id==='prep'&&step().mode==='cut'&&local.knife&&!local.done&&!down.strokeDone&&G.valid(down.gesture)){
        const slot=Math.max(0,Math.min(2,Math.round((down.gesture.start.x-.35)/.15)));
        if(!local.cutSlots.includes(slot)){local.cutSlots.push(slot);FX?.play('cut');local.count++;local.done=local.count>=step().goal;down.cutsCommitted=true;down.strokeDone=true;
          paintFrame();const counter=document.querySelector('.action-counter');if(counter)counter.textContent=local.done?'✓ 준비됐어요':`${local.count} / ${step().goal}`;refreshGuides();}
      }
      if(step().id!=='portion'&&step().id!=='assemble'&&!(step().id==='prep'&&step().mode==='cut')){
        const id=gestureId(step()),g=down.gesture;
        local.motion=id==='beat'?Math.abs(g.angle)/(Math.PI*2):Math.min(1,g.distance/.5);
        paintFrame();
      }
      const knife=document.querySelector('.held-knife');if(knife){local.toolX=x;local.toolY=y;knife.style.left=`${x*100}%`;knife.style.top=`${y*100}%`;knife.style.setProperty('--knife-angle',`${knifeAngle(x,y)}deg`);}
      if(step().id==='assemble'){const progress=Math.max(0,Math.min(1,(x-.3)/.42));document.querySelector('.prep-scene')?.style.setProperty('--transfer',progress);}
    });
    root.addEventListener('pointerup',event=>{if(!down||down.id!==event.pointerId)return;const current=down;FX?.pour(false);down=null;local.motion=0;document.querySelector('.prep-scene')?.classList.remove('is-dragging','is-pouring');if(!current.dial){if(current.cutsCommitted)process();else commitDrag(current.gesture);}});
    root.addEventListener('pointercancel',()=>{FX?.pour(false);down=null;local.motion=0;paintFrame();document.querySelector('.prep-scene')?.classList.remove('is-dragging','is-pouring');});
    root.addEventListener('input',event=>{if(!event.target.matches('[data-refill-qty]'))return;refillQuantity=Math.max(1,Math.min(refillMax()||1,Math.floor(Number(event.target.value)||1)));const buy=root.querySelector('[data-refill]');if(buy)buy.textContent=`${refillQuantity}개 채우기 · ¥${E.buyPrice(state(),focused)*refillQuantity}`;});
    root.addEventListener('change',event=>{if(event.target.matches('[data-refill-qty]'))event.target.value=String(refillQuantity);});
    root.addEventListener('keydown',event=>{if(event.target.id==='gas-dial'&&['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();setPower(Math.max(0,Math.min(1.6,local.power+(['ArrowRight','ArrowUp'].includes(event.key)?.1:-.1))));}});
  }

  function tick(dt){
    if(visible&&view==='process'&&down?.measure&&down.overTarget&&state().kitchen&&!local.done){
      local.fill=Math.min(1,local.fill+dt/1400);if(local.fill>=1)FX?.pour(false);const m=measureSpec(),frame=document.querySelector('.measure-frame'),n=Math.min(3,Math.floor(local.fill*3));
      if(frame)frame.style.backgroundPosition=`${n%2*100}% ${Math.floor(n/2)*100}%`;
      if($('measure-value'))$('measure-value').textContent=`${Math.round(local.fill*m.amount)} / ${m.amount}${m.unit}`;
      if($('measure-fill'))$('measure-fill').style.width=`${local.fill*100}%`;
      if($('measure-help'))$('measure-help').textContent=local.fill>=1?'다 찼어요. 손을 떼세요.':'채우는 중… 손을 떼면 멈춰요.';
    }
    if(!visible||view!=='process'||!state().kitchen||step()?.id!=='heat'||!local.started||local.done||!state().stoveTutorialDone&&local.tutorial===2)return;
    const spec=E.cookSpec(state(),order().recipe);local.heat=Math.min(1,local.heat+dt/spec.heatTime*local.power);updateHeat();
    if(local.heat>=1){stopHeat();if(state().stoveTutorialDone)bridge.toast('불을 늦게 껐어요. 다음에는 초록 구간에서 멈춰 주세요.');}
  }

  window.MidnightKitchen={init,show,hide,tick,isVisible:()=>visible};
})();
