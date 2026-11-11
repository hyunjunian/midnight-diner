/* Ads as small events of the alley, not interruptions. Uses only window.MidnightPlatform.ads.

   Dawn bulletin: after enough real play, the alley bulletin sometimes arrives when the owner
   moves on to the next night. It carries a short piece about last night; for players who
   see ads its next page is an advertisement, announced as such before it opens.
   Shared clip: once a night a satisfied, departing guest may offer to watch a clip together.
   It is an advertisement and says so; watching it to the end brings that guest a little closer.
   Delivery note: before the first ad request the bulletin's editors explain, in plain words,
   that the pages carry ads and that the next screens ask how ads may be chosen. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const platform=window.MidnightPlatform||{},ads=platform.ads,settings=platform.config?.ads||{};
  const dialog=$('bulletin-dialog'),share=$('talk-share'),shareStatus=$('talk-share-status');
  if(!ads||!dialog||!share||!shareStatus)return;
  const KEY='midnight-diner-ad-events-v1';
  const minPlayMs=Math.max(1,Number(settings.bulletinMinPlayMinutes)||12)*60000;
  let memory={playMs:0,offerNight:0,offerGuest:'',doneNight:0};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');for(const key of Object.keys(memory))if(typeof saved[key]===typeof memory[key])memory[key]=saved[key];}catch{}
  const remember=()=>{try{localStorage.setItem(KEY,JSON.stringify(memory));}catch{}};

  // Only time actually spent playing counts: visible, past the intro, no ad on screen.
  let last=Date.now(),unsaved=0;
  const playing=()=>!document.hidden&&!$('app').hidden&&!$('intro')?.open&&!document.documentElement.hasAttribute('data-ad');
  function tick(){
    const now=Date.now(),step=Math.min(2000,Math.max(0,now-last));last=now;
    if(!playing())return;
    memory.playMs+=step;unsaved+=step;
    if(unsaved>=10000){unsaved=0;remember();}
  }
  setInterval(tick,1000);
  document.addEventListener('visibilitychange',()=>{last=Date.now();if(document.hidden)remember();});

  const escape=text=>String(text).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  // Shows one page in the bulletin sheet and resolves when its button is pressed.
  function page({tag,title,date='',headline='',paragraphs=[],note='',button}){
    return new Promise(resolve=>{
      $('bulletin-tag').textContent=tag;$('bulletin-title').textContent=title;
      $('bulletin-date').textContent=date;$('bulletin-date').hidden=!date;
      $('bulletin-headline').textContent=headline;$('bulletin-headline').hidden=!headline;
      $('bulletin-text').innerHTML=paragraphs.map(text=>`<p>${escape(text)}</p>`).join('');
      $('bulletin-note').textContent=note;$('bulletin-note').hidden=!note;
      const next=$('bulletin-next');next.textContent=button;next.disabled=false;
      const done=()=>{next.removeEventListener('click',done);next.disabled=true;resolve();};
      next.addEventListener('click',done);
      if(!dialog.open)dialog.showModal();
      dialog.scrollTop=0;
    });
  }
  dialog.addEventListener('cancel',event=>event.preventDefault()); // pages close through their button only

  let paintPrivacy=()=>{};
  async function deliveryNote(reason){
    await page({tag:'편집부에서 온 쪽지',title:'골목 소식지',
      paragraphs:[reason==='share'
        ?'골목 소식지 편집부입니다. 손님이 보여 주려는 영상은 광고입니다. 처음 광고를 보여 드리기 전에 한 가지만 여쭙니다.'
        :'골목 소식지 편집부입니다. 앞으로 가끔 새벽에 소식지를 넣어 드릴게요. 소식지에는 골목 이야기와 함께 광고 지면이 실립니다.',
        '광고를 사장님의 관심사에 맞춰 골라도 될지, 이어지는 안내에서 정해 주세요. 허용하지 않아도 소식지와 식당 영업은 똑같이 이어집니다.'],
      button:'안내 이어서 보기'});
    dialog.close();
    await ads.requestPrivacy();
    paintPrivacy();
  }
  const articles=[
    c=>({headline:`어젯밤 ${c.served}명이 쉬어 간 골목 끝 식당`,paragraphs:['늦은 시간까지 불이 켜진 가게가 드문 골목에서, 끝집 식당의 등불은 어젯밤에도 꺼지지 않았다.',`다녀간 손님은 ${c.served}명. 주인장은 한 사람 한 사람의 이야기를 들으며 밥을 지었다고 한다.`]}),
    c=>({headline:'비 오는 밤에는 따뜻한 한 끼',paragraphs:['골목에 비가 잦아들지 않는 요즘, 우산을 접고 들어서는 발걸음이 늘었다.',`어젯밤 식당을 찾은 ${c.served}명의 손님도 젖은 어깨를 말리며 그릇을 비웠다.`]}),
    c=>({headline:`손님들이 매긴 어젯밤 점수는 ${c.average}점`,paragraphs:['맛은 숫자로 다 말할 수 없지만, 비워진 그릇은 거짓말을 하지 않는다.',`편집부가 손님들에게 물어 모은 어젯밤의 평균은 ${c.average}점이었다.`]}),
    c=>({headline:'골목 사람들의 늦은 저녁',paragraphs:['야근을 마친 사람, 첫차를 기다리는 사람, 잠이 오지 않는 사람. 이 골목의 저녁은 자정이 넘어서야 시작된다.',`어젯밤에도 ${c.served}명이 같은 카운터에 나란히 앉았다.`]}),
    c=>({headline:`${c.level}단계에 오른 가게, 달라진 풍경`,paragraphs:['가게를 조금씩 손보는 주인장 덕분에 골목 끝이 한결 환해졌다는 이야기가 들린다.','지나가던 이웃들도 창 너머를 한 번씩 들여다보고 간다.']}),
    c=>({headline:'새벽 첫차 전, 마지막 주문',paragraphs:['동이 트기 전 마지막 손님이 자리를 뜨면 골목에는 신문 넣는 소리만 남는다.',`주인장은 ${c.served}명분의 그릇을 닦고 나서야 가게 불을 내렸다.`]})
  ];
  async function bulletin(context){
    const report=context.report||{},reviews=Array.isArray(report.reviews)?report.reviews:[];
    const facts={served:context.served||0,average:report.average||0,level:context.level||1};
    const article=articles[context.night%articles.length](facts),paragraphs=[...article.paragraphs];
    const review=reviews.find(item=>item&&item.text&&item.score>=65);
    if(review)paragraphs.push(`“${review.text}” — 어젯밤 손님 한마디 (${review.dish})`);
    const withAd=ads.interstitialReady();
    await page({tag:'새벽에 도착한 소식',title:'골목 소식지',date:window.MidnightDate?.label?.(context.night)||'',headline:article.headline,paragraphs,
      note:withAd?'다음 장은 광고 지면입니다. 광고가 끝나면 다음 밤 준비로 이어집니다.':'',
      button:withAd?'다음 장 넘기기 · 광고':'소식지를 접고 다음 밤 준비하기'});
    dialog.close();
    memory.playMs=0;remember();
    if(withAd)await ads.showInterstitial('dawn-bulletin');
  }
  let pending=null;
  // Called when the owner leaves the nightly report. Resolves when the next night may begin.
  function beforeNextNight(context){
    if(!pending)pending=(async()=>{
      tick();
      // Never after the very first night, and only after enough real play since the last issue.
      if(!context||context.night<2||memory.playMs<minPlayMs)return;
      if(ads.isNative()&&!ads.isAdFree()&&ads.needsPrivacyPrompt())await deliveryNote('bulletin');
      await bulletin(context);
    })().catch(()=>{if(dialog.open)dialog.close();}).finally(()=>{pending=null;});
    return pending;
  }

  let panel=null,working=false;
  // Called on every guest panel render. Offers the clip once a night, at a happy goodbye.
  function guestPanel(guest){
    panel=guest;
    const mine=memory.offerNight===guest.night&&memory.offerGuest===guest.id;
    const done=mine&&memory.doneNight===guest.night;
    const eligible=guest.status==='farewell'&&guest.score>=65;
    const offer=eligible&&!done&&(mine||(memory.offerNight!==guest.night&&ads.rewardedAvailable()));
    if(offer&&!mine){memory.offerNight=guest.night;memory.offerGuest=guest.id;remember();}
    share.hidden=!offer;share.disabled=working;
    if(offer)share.textContent=`${guest.name} 님이 권하는 영상 함께 보기 · 광고 (친밀도 ↑)`;
    shareStatus.hidden=!(eligible&&mine&&shareStatus.textContent);
    if(!eligible||!mine)shareStatus.textContent='';
  }
  share.addEventListener('click',async()=>{
    const guest=panel;if(!guest||working)return;
    working=true;share.disabled=true;shareStatus.textContent='';
    try{
      if(ads.isNative()&&ads.needsPrivacyPrompt())await deliveryNote('share');
      const result=await ads.showRewarded('guest-share');
      if(result.rewarded&&window.MidnightApp?.befriend?.(guest.id,Number(settings.shareAffinity)||2)){
        memory.doneNight=guest.night;remember();
        shareStatus.textContent=`${guest.name} 님과 나란히 영상을 봤어요. 한층 가까워졌어요.`;
      }else shareStatus.textContent=result.reason==='closed-early'?'끝까지 보지 못했어요. 다시 볼 수 있어요.':'지금은 영상을 불러오지 못했어요. 잠시 후 다시 볼 수 있어요.';
    }catch{shareStatus.textContent='지금은 영상을 불러오지 못했어요.';}
    finally{working=false;if(panel)guestPanel(panel);}
  });
  // Settings row for changing or withdrawing ad consent, shown only where the law requires it.
  const privacy=$('ads-privacy');
  paintPrivacy=()=>{if(privacy)privacy.hidden=!ads.privacyOptionsRequired?.();};
  privacy?.addEventListener('click',async()=>{privacy.disabled=true;try{await ads.showPrivacyOptions();}finally{privacy.disabled=false;paintPrivacy();}});
  window.MidnightAdEvents={beforeNextNight,guestPanel,playMs:()=>memory.playMs};
  Promise.resolve(ads.init()).catch(()=>{}).then(paintPrivacy);
})();
