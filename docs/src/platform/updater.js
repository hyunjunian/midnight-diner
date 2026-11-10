/* Platform layer: live updates of the bundled app. Game code calls only
   window.MidnightPlatform.updater. Stage 1 always skips: browsers update through
   the service worker (pwa.js), and native builds ship their files inside the app
   until stage 2 adds the manual-mode updater behind this file. */
(()=>{'use strict';
  const isNative=()=>window.Capacitor?.isNativePlatform?.()===true;
  const release=()=>document.querySelector('meta[name="app-release"]')?.content||'';
  const updater={
    isNative,
    currentRelease:release,
    // Call once after launch, so stage 2 can confirm a new bundle booted.
    async init(){return{ready:true,native:isNative()};},
    // Resolves {status:'skipped'|'ready'|'none'|'failed',release}.
    async check(){return{status:'skipped',release:release()};},
    // Resolves {applied}. Applying restarts the web view in stage 2.
    async apply(){return{applied:false,reason:'skipped'};}
  };
  (window.MidnightPlatform=window.MidnightPlatform||{}).updater=updater;
})();
