/* Ads as small events of the alley, not interruptions. Uses only window.MidnightPlatform.ads.

   Dawn bulletin: after enough real play, the alley bulletin sometimes arrives when the owner
   moves on to the next night. It carries a short piece about last night; for players who
   see ads its next page is an advertisement, announced as such before it opens.
   Shared clip: once a night a satisfied, departing guest brings up a clip in conversation and
   asks to watch it together. The answer the owner picks says it is an advertisement; watching
   it to the end brings that guest a little closer.
   Privacy: there is no separate notice. The first time, the same guest explains in passing
   what the phone is about to ask (whether ads may follow the owner's interests) and that
   saying no changes nothing. Only then are Google's consent form and the iOS tracking
   question shown. Until a guest has had that talk, no ad is requested and the bulletin
   arrives without an ad page. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const platform=window.MidnightPlatform||{},ads=platform.ads,settings=platform.config?.ads||{};
  const dialog=$('bulletin-dialog');
  if(!ads||!dialog)return;
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
      await bulletin(context);
    })().catch(()=>{if(dialog.open)dialog.close();}).finally(()=>{pending=null;});
    return pending;
  }

  // ---- The shared clip, told as a short exchange at the goodbye ----
  // The guest brings it up, the owner answers, and the first time the guest also explains,
  // in their own words, the question the phone is about to ask. Nothing is promised for
  // saying yes, and saying no still plays the clip.
  const TEXT={
    offers:['가기 전에 잠깐만요. 오는 길에 본 광고가 자꾸 생각나서요. 삼십 초쯤인데, 주인장도 같이 보실래요? 혼자 보긴 아까워서요.',
      '아, 나가기 전에 하나만요. 요즘 눈에 밟히는 광고가 있는데 같이 보면 재밌을 것 같아요. 잠깐이면 돼요.',
      '배가 부르니 떠오르네요. 어제 본 광고가 하나 있는데, 주인장한테도 보여 드리고 싶었어요. 같이 보실래요?'],
    watch:'같이 봐요 · 광고 시청 (친밀도 ↑)',pass:'오늘은 마음만 받을게요',
    ask:'좋아요! 틀기 전에 화면에 관심사를 알려 줄지 묻는 창이 뜰 거예요. 광고 일 하는 친구 말로는, 알려 주면 뜬금없는 광고 대신 주인장 취향에 맞는 게 나온대요. 허용하지 않아도 영상은 똑같이 볼 수 있어요.',
    go:'알겠어요, 틀어 주세요',
    loading:'잠깐만요, 금방 틀게요.',
    thanks:'같이 보니까 더 재밌네요. 다음에 또 좋은 걸 찾으면 들고 올게요. 잘 먹고 갑니다.',
    early:'앗, 끝까지는 못 봤네요. 다시 틀어 볼까요?',again:'다시 볼게요 · 광고 시청',later:'다음에 볼게요',
    fail:'어라, 지금은 영상이 안 열리네요. 다음에 꼭 보여 드릴게요. 잘 먹고 갑니다.',
    declined:'괜찮아요. 다음에 재밌는 걸 찾으면 또 말씀드릴게요. 잘 먹고 갑니다.'
  };
  let forcePrivacy=false;
  try{forcePrivacy=ads.browserTestMode?.()==='privacy';}catch{}
  const needsPrivacy=()=>ads.isNative()?ads.needsPrivacyPrompt():forcePrivacy;
  let talk=null; // {id,night,name,node,said}
  const refresh=()=>{try{window.MidnightApp?.refreshTalk?.();}catch{}};
  // Called while a departing guest's goodbye is on screen. Returns what the guest says and
  // what the owner can answer, or null when this guest has nothing to share tonight.
  function farewellScene(guest){
    const mine=memory.offerNight===guest.night&&memory.offerGuest===guest.id;
    if(!talk||talk.id!==guest.id||talk.night!==guest.night){
      if(guest.score<65)return null;
      if(mine&&memory.doneNight===guest.night)return null;            // already watched together
      if(!mine&&(memory.offerNight===guest.night||!ads.rewardedAvailable()))return null; // one guest a night
      if(!mine){memory.offerNight=guest.night;memory.offerGuest=guest.id;remember();}
      talk={id:guest.id,night:guest.night,name:guest.name,node:'offer',said:''};
    }
    const n=talk.node,line=n==='offer'?TEXT.offers[guest.night%TEXT.offers.length]:TEXT[n];
    const choices=n==='offer'?[{id:'watch',label:TEXT.watch},{id:'pass',label:TEXT.pass}]
      :n==='ask'?[{id:'go',label:TEXT.go}]
      :n==='early'?[{id:'watch',label:TEXT.again},{id:'pass',label:TEXT.later}]:[];
    return{key:n,line,playerLine:talk.said,choices,hideNext:['offer','ask','loading','early'].includes(n),
      status:n==='thanks'?`${talk.name} 님과 한층 가까워졌어요.`:''};
  }
  async function play(){
    talk.node='loading';refresh();
    const current=talk;
    let result={rewarded:false,reason:'failed'};
    try{
      if(ads.isNative()&&ads.needsPrivacyPrompt()){await ads.requestPrivacy();paintPrivacy();}
      forcePrivacy=false;
      result=await ads.showRewarded('guest-share');
    }catch{}
    if(talk!==current)return;
    if(result.rewarded&&window.MidnightApp?.befriend?.(current.id,Number(settings.shareAffinity)||2)){
      memory.doneNight=current.night;remember();current.node='thanks';
    }else current.node=result.reason==='closed-early'?'early':'fail';
    refresh();
  }
  // The owner picked one of the answers offered by farewellScene().
  function answerScene(reply){
    if(!talk||['loading','thanks','fail','declined'].includes(talk.node))return;
    if(reply==='pass'){talk.said=talk.node==='early'?TEXT.later:TEXT.pass;talk.node='declined';return;}
    if(reply==='watch'&&needsPrivacy()){talk.said=TEXT.watch;talk.node='ask';return;}
    if(reply==='watch'||reply==='go'){talk.said=reply==='go'?TEXT.go:TEXT.watch;play();}
  }
  // Settings row for changing or withdrawing ad consent, shown only where the law requires it.
  const privacy=$('ads-privacy');
  paintPrivacy=()=>{if(privacy)privacy.hidden=!ads.privacyOptionsRequired?.();};
  privacy?.addEventListener('click',async()=>{privacy.disabled=true;try{await ads.showPrivacyOptions();}finally{privacy.disabled=false;paintPrivacy();}});
  window.MidnightAdEvents={beforeNextNight,farewellScene,answerScene,playMs:()=>memory.playMs};
  Promise.resolve(ads.init()).catch(()=>{}).then(paintPrivacy);
})();
