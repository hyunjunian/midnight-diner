/* Platform layer: ads. Game code calls only window.MidnightPlatform.ads.
   Stage 1 has no ad SDK. A browser treats every ad as watched; a native build
   reports ads as unavailable until stage 4 adds the plugin behind this file. */
(()=>{'use strict';
  const isNative=()=>window.Capacitor?.isNativePlatform?.()===true;
  let adFree=false,ready=false;
  const ads={
    isNative,
    // Call once after launch. Safe to call again.
    async init(){ready=true;return{ready,native:isNative()};},
    // Stage 3 tells the ad layer when the player owns "no ads".
    setAdFree(value){adFree=value===true;},
    isAdFree:()=>adFree,
    // Resolves {shown}. Ad-free players never see an interstitial.
    async showInterstitial(placement=''){
      if(adFree)return{shown:false,reason:'ad-free',placement};
      if(isNative())return{shown:false,reason:'unavailable',placement};
      return{shown:true,reason:'browser-fallback',placement};
    },
    // Resolves {rewarded}. Rewarded ads stay an optional choice for everyone.
    async showRewarded(placement=''){
      if(isNative())return{rewarded:false,reason:'unavailable',placement};
      return{rewarded:true,reason:'browser-fallback',placement};
    }
  };
  (window.MidnightPlatform=window.MidnightPlatform||{}).ads=ads;
})();
