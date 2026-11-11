/* Platform layer: ads. Game code calls only window.MidnightPlatform.ads.

   Browser: no ad SDK. Nothing is shown; an ad counts as watched. Readiness is reported
   only with ?ads-test in the address, so the in-game ad moments can be tried on the test site.
   Native: @capacitor-community/admob (interstitial and rewarded).
   - No ad is requested before the privacy questions are settled: Google's consent form
     where the law requires it, then the iOS tracking permission. The game shows its own
     in-world note first and then calls requestPrivacy().
   - Players who own "no ads" never get an interstitial. Rewarded ads stay an optional choice.
   - A reward is reported only when the SDK says it was earned. */
(()=>{'use strict';
  const PLUGIN='AdMob';
  // Google's public sample units: they always serve test ads and never earn or risk an account.
  const TEST={ios:{interstitial:'ca-app-pub-3940256099942544/4411468910',rewarded:'ca-app-pub-3940256099942544/1712485313'},
    android:{interstitial:'ca-app-pub-3940256099942544/1033173712',rewarded:'ca-app-pub-3940256099942544/5224354917'}};
  const cap=()=>window.Capacitor;
  const isNative=()=>cap()?.isNativePlatform?.()===true;
  const platform=()=>isNative()?String(cap().getPlatform?.()||''):'web';
  const usable=()=>isNative()&&typeof cap().nativePromise==='function';
  const call=(method,options={})=>cap().nativePromise(PLUGIN,method,options);
  const settings=()=>window.MidnightPlatform?.config?.ads||{};
  const testing=()=>settings().testMode!==false;
  const unit=type=>testing()?(TEST[platform()]?.[type]||''):String(settings().units?.[platform()]?.[type]||'');
  const browserTest=()=>{try{return!isNative()&&new URLSearchParams(location.search).has('ads-test');}catch{return false;}};
  let adFree=false,started=null,sdk=false,canRequest=false,needsForm=false,tracking='',showing=false;
  const slot={interstitial:{ready:false,loading:null},rewarded:{ready:false,loading:null}};
  const waiters=new Set();
  function emit(name){for(const waiter of [...waiters])if(waiter.names.includes(name)){waiters.delete(waiter);waiter.resolve(name);}}
  // Resolves with the first of the named plugin events, or '' when none arrives in time.
  function until(names,timeoutMs){
    return new Promise(resolve=>{
      const waiter={names,resolve:name=>{clearTimeout(timer);resolve(name);}};
      const timer=setTimeout(()=>{waiters.delete(waiter);resolve('');},timeoutMs);
      waiters.add(waiter);
    });
  }
  let earned=false;
  function listen(){
    if(typeof cap().addListener!=='function')return;
    for(const name of ['interstitialAdDismissed','interstitialAdFailedToShow','onRewardedVideoAdDismissed','onRewardedVideoAdFailedToShow'])
      try{cap().addListener(PLUGIN,name,()=>emit(name));}catch{}
    try{cap().addListener(PLUGIN,'onRewardedVideoAdReward',()=>{earned=true;});}catch{}
  }
  // The game pauses its music while a full-screen ad is on top.
  function stage(on){
    showing=on;
    try{
      if(on)document.documentElement.setAttribute('data-ad','1');else document.documentElement.removeAttribute('data-ad');
      document.dispatchEvent(new Event('midnight:ad'));
    }catch{}
  }
  async function readPrivacy(){
    try{
      const info=await call('requestConsentInfo');
      canRequest=info?.canRequestAds!==false;
      needsForm=info?.status==='REQUIRED'&&info?.isConsentFormAvailable===true;
    }catch{canRequest=true;needsForm=false;}   // consent service unreachable: Google still applies its own limits
    if(platform()==='ios')try{tracking=(await call('trackingAuthorizationStatus')).status||'';}catch{tracking='';}
    else tracking='';
  }
  const needsPrompt=()=>needsForm||tracking==='notDetermined';
  function load(type){
    const entry=slot[type],adId=unit(type);
    if(!sdk||!canRequest||needsPrompt()||!adId||entry.ready)return Promise.resolve(entry.ready);
    if(type==='interstitial'&&adFree)return Promise.resolve(false);
    if(!entry.loading)entry.loading=call(type==='interstitial'?'prepareInterstitial':'prepareRewardVideoAd',{adId,isTesting:testing()})
      .then(()=>{entry.ready=true;return true;},()=>false).finally(()=>{entry.loading=null;});
    return entry.loading;
  }
  function preload(){load('interstitial');load('rewarded');}
  async function start(){
    try{await call('initialize',{initializeForTesting:testing()});sdk=true;}catch{sdk=false;return state();}
    listen();
    await readPrivacy();
    preload();
    return state();
  }
  const state=()=>({native:isNative(),ready:sdk,adFree,needsPrivacyPrompt:sdk&&needsPrompt()});
  const ads={
    isNative,
    // Call once after launch. Safe to call again.
    init(){
      if(!usable())return Promise.resolve(state());
      if(!started)started=start();
      return started;
    },
    // The store tells the ad layer when the player owns "no ads".
    setAdFree(value){adFree=value===true;if(!adFree)load('interstitial');},
    isAdFree:()=>adFree,
    // True when a consent form or the iOS tracking question still has to be shown.
    needsPrivacyPrompt:()=>sdk&&needsPrompt(),
    // Shows Google's consent form when required, then the iOS tracking question, then
    // starts loading ads. Show the game's own explanation before calling this.
    async requestPrivacy(){
      if(!sdk)return state();
      if(needsForm)try{
        const info=await call('showConsentForm');
        canRequest=info?.canRequestAds!==false;needsForm=false;
      }catch{needsForm=false;}
      if(tracking==='notDetermined'){
        try{await call('requestTrackingAuthorization');}catch{}
        try{tracking=(await call('trackingAuthorizationStatus')).status||'';}catch{tracking='';}
        if(tracking==='notDetermined')tracking='';   // never ask twice in one session
      }
      preload();
      return state();
    },
    // An interstitial is loaded and may be shown to this player right now.
    interstitialReady:()=>isNative()?(slot.interstitial.ready&&!adFree&&!showing):browserTest()&&!adFree,
    // A rewarded ad can be offered: one is loaded, or it can load once the player answers the privacy note.
    rewardedAvailable:()=>isNative()?(sdk&&!showing&&Boolean(unit('rewarded'))&&(slot.rewarded.ready||needsPrompt())):browserTest(),
    // Resolves {shown} after the ad is closed. Ad-free players never see an interstitial.
    async showInterstitial(placement=''){
      if(adFree)return{shown:false,reason:'ad-free',placement};
      if(!isNative())return{shown:true,reason:'browser-fallback',placement};
      if(!sdk||showing)return{shown:false,reason:'unavailable',placement};
      if(!slot.interstitial.ready){load('interstitial');return{shown:false,reason:'not-ready',placement};}
      slot.interstitial.ready=false;stage(true);
      try{
        const closed=until(['interstitialAdDismissed','interstitialAdFailedToShow'],180000);
        await call('showInterstitial');
        const event=typeof cap().addListener==='function'?await closed:'interstitialAdDismissed';
        return{shown:event==='interstitialAdDismissed',reason:event?'':'timeout',placement};
      }catch{return{shown:false,reason:'failed',placement};}
      finally{stage(false);load('interstitial');}
    },
    // Resolves {rewarded} after the ad is closed; true only when the reward was earned.
    async showRewarded(placement=''){
      if(!isNative())return{rewarded:true,reason:'browser-fallback',placement};
      if(!sdk||showing)return{rewarded:false,reason:'unavailable',placement};
      if(!slot.rewarded.ready&&!(await load('rewarded')))return{rewarded:false,reason:'not-ready',placement};
      slot.rewarded.ready=false;earned=false;stage(true);
      try{
        const closed=until(['onRewardedVideoAdDismissed','onRewardedVideoAdFailedToShow'],240000);
        // The plugin's own promise settles only when a reward is earned, so it is not awaited.
        const shown=call('showRewardVideoAd').then(()=>{earned=true;return true;},()=>false);
        const event=typeof cap().addListener==='function'?await closed:await Promise.race([shown.then(()=>'onRewardedVideoAdDismissed'),closed]);
        if(event==='onRewardedVideoAdDismissed'&&!earned)await new Promise(resolve=>setTimeout(resolve,400)); // reward callbacks can trail the close
        return{rewarded:earned,reason:earned?'':(event?'closed-early':'timeout'),placement};
      }catch{return{rewarded:false,reason:'failed',placement};}
      finally{stage(false);load('rewarded');}
    }
  };
  (window.MidnightPlatform=window.MidnightPlatform||{}).ads=ads;
})();
