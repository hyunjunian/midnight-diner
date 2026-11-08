/* Stable, interruptible dialogue lettering; unrelated game renders never restart a line. */
(()=>{'use strict';const runs=new WeakMap();
function finish(el){const run=runs.get(el);if(!run)return;clearTimeout(run.timer);run.ink.textContent=run.text;run.done=true;el.classList.remove('is-typing');}
function write(el,key,text){const previous=runs.get(el);if(previous?.key===key&&previous.text===text)return;finish(el);
 const ghost=document.createElement('span'),ink=document.createElement('span'),reader=document.createElement('span');ghost.className='dialogue-full';ghost.textContent=text;ghost.setAttribute('aria-hidden','true');ink.className='dialogue-ink';ink.setAttribute('aria-hidden','true');reader.className='dialogue-reader';reader.textContent=text;el.setAttribute('aria-live','off');el.replaceChildren(ghost,ink,reader);
 const run={key,text,ink,index:0,done:false,timer:0};runs.set(el,run);
 const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(text)].map(x=>x.segment):Array.from(text);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden){finish(el);return;}
 el.classList.add('is-typing');
 function tick(){if(!el.isConnected||!el.closest('dialog')?.open){finish(el);return;}ink.textContent+=parts[run.index++]||'';if(run.index>=parts.length){finish(el);return;}run.timer=setTimeout(tick,/[.!?。…]/.test(parts[run.index-1])?130:28);}
 tick();
}
document.addEventListener('click',event=>{if(event.target.closest('#guest-dialog .talk-speech'))finish(document.getElementById('talk-line'));});
document.addEventListener('keydown',event=>{if(event.target.matches('#guest-dialog .talk-speech')&&['Enter',' '].includes(event.key)){event.preventDefault();finish(document.getElementById('talk-line'));}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(document.getElementById('talk-line'));});
document.getElementById('guest-dialog').addEventListener('close',()=>finish(document.getElementById('talk-line')));
window.MidnightDialogue={write,finish};})();
