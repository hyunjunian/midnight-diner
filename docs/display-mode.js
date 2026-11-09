/* Installed mobile display policy. Browser tabs retain their normal controls. */
(()=>{'use strict';
 const media=query=>matchMedia(query),fullscreen=media('(display-mode: fullscreen)'),standalone=media('(display-mode: standalone)');
 let installedAtLaunch=standalone.matches||navigator.standalone===true||(fullscreen.matches&&!document.fullscreenElement);
 const isInstalled=()=>installedAtLaunch||standalone.matches||navigator.standalone===true;
 const isMobileInstalled=()=>isInstalled()&&(navigator.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
 let locking=null,entering=null;
 async function lockPortrait(){
  if(locking)return locking;
  if(!screen.orientation?.lock)return false;
  try{locking=Promise.resolve(screen.orientation.lock('portrait-primary')).then(()=>true,()=>false);return await locking;}catch{return false;}finally{locking=null;}
 }
 async function enterFullscreen(){
  if(entering)return entering;
  if(document.fullscreenElement||fullscreen.matches){await lockPortrait();return true;}
  const root=document.documentElement;if(!root.requestFullscreen)return false;
  try{entering=Promise.resolve(root.requestFullscreen({navigationUI:'hide'})).then(async()=>{await lockPortrait();return true;},()=>false);return await entering;}catch{return false;}finally{entering=null;}
 }
 function refresh(){if(standalone.matches||navigator.standalone===true)installedAtLaunch=true;if(!document.hidden&&isMobileInstalled())void lockPortrait();}
 document.addEventListener('visibilitychange',refresh);
 document.addEventListener('fullscreenchange',refresh);
 window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);
 fullscreen.addEventListener?.('change',refresh);standalone.addEventListener?.('change',refresh);
 screen.orientation?.addEventListener?.('change',refresh);
 window.MidnightDisplay={lockPortrait,enterFullscreen,refresh,isInstalled,isMobileInstalled};refresh();
})();
