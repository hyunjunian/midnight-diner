/* Minamo by PeriTune, CC BY 4.0; source/license in assets/music-Minamo-LICENSE.txt. */
(()=>{'use strict';const $=id=>document.getElementById(id);let enabled=true,volume=.25,unlocked=false,lastError='',fade=0;
try{enabled=localStorage.getItem('midnight-diner-music')!=='off';const saved=localStorage.getItem('midnight-diner-music-volume');if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));}catch{}
const song=new Audio(new URL('./assets/music-minamo-v29.mp3',document.currentScript.src));song.loop=true;song.preload='auto';song.volume=0;
function allowed(){return enabled&&unlocked&&!document.hidden&&!$('app').hidden&&!$('intro').open&&!document.documentElement.hasAttribute('data-ad');}
function paint(){const toggle=$('music-toggle');toggle.textContent=enabled?'켜짐':'꺼짐';toggle.setAttribute('aria-pressed',String(enabled));$('music-volume').value=String(Math.round(volume*100));$('music-volume-value').textContent=`${Math.round(volume*100)}%`;}
function ramp(target){cancelAnimationFrame(fade);const from=song.volume,start=performance.now();function next(now){const p=Math.max(0,Math.min(1,(now-start)/450));song.volume=Math.max(0,Math.min(1,from+(target-from)*p));if(p<1)fade=requestAnimationFrame(next);}fade=requestAnimationFrame(next);}
function sync(){if(allowed()){ramp(volume*.4);if(song.paused)song.play().then(()=>lastError='').catch(e=>{lastError=e.name;});}else{cancelAnimationFrame(fade);song.pause();song.volume=0;}}
function setEnabled(on){enabled=!!on;try{localStorage.setItem('midnight-diner-music',enabled?'on':'off');}catch{}paint();sync();}
function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem('midnight-diner-music-volume',String(volume));}catch{}paint();sync();}
$('music-toggle').addEventListener('click',()=>setEnabled(!enabled));$('music-volume').addEventListener('input',e=>setVolume(Number(e.target.value)/100));
function unlock(e){if(e.isTrusted){unlocked=true;sync();}}
document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});document.addEventListener('visibilitychange',sync);document.addEventListener('midnight:ad',sync);window.addEventListener('pagehide',()=>{cancelAnimationFrame(fade);song.pause();});window.addEventListener('pageshow',sync);
const observer=new MutationObserver(sync);observer.observe($('app'),{attributes:true,attributeFilter:['hidden']});observer.observe($('intro'),{attributes:true,attributeFilter:['open']});
song.addEventListener('error',()=>lastError='media-error');paint();
window.MidnightMusic={setEnabled,setVolume,status:()=>({enabled,volume,playing:!song.paused,muted:song.volume===0,currentTime:song.currentTime,duration:song.duration,error:lastError,source:song.currentSrc||song.src})};})();
