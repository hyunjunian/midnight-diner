(()=>{
 'use strict';
 const $=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let all=[],visible=[],area='all',current=0;
 const picture=d=>d.preview.type==='poster'?`<img src="${escape(d.preview.file)}" alt="${escape(d.name)}" loading="lazy" decoding="async">`:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${d.preview.rect.join(' ')}" role="img" aria-label="${escape(d.name)}"><image href="${escape(d.preview.file)}" width="${d.preview.size[0]}" height="${d.preview.size[1]}"/></svg>`;
 function filter(){
  visible=all.filter(d=>area==='all'||d.area===area);
  document.querySelectorAll('.design').forEach(card=>card.hidden=area!=='all'&&card.dataset.area!==area);
  document.querySelectorAll('[data-area]').forEach(button=>{if(button.tagName==='BUTTON')button.setAttribute('aria-pressed',String(button.dataset.area===area));});
 }
 function zoom(index){
  current=index;const d=visible[current];if(!d)return;
  $('zoom-level').textContent=`레벨 ${d.revealLevel} · ${d.area==='inside'?'내부':'외부'}`;$('zoom-title').textContent=d.name;$('zoom-art').innerHTML=picture(d);$('zoom-materials').textContent=d.materials.join(' | ');$('zoom-position').textContent=`${current+1} / ${visible.length}`;$('previous').disabled=current===0;$('next').disabled=current===visible.length-1;
  if(!$('zoom').open)$('zoom').showModal();
 }
 document.querySelector('.filters').addEventListener('click',e=>{const button=e.target.closest('button[data-area]');if(button){area=button.dataset.area;filter();}});
 $('level-jump').addEventListener('change',e=>{if(e.target.value){location.hash=`level-${e.target.value}`;document.getElementById(`level-${e.target.value}`)?.scrollIntoView({block:'start'});}});
 $('gallery').addEventListener('click',e=>{const button=e.target.closest('[data-design]');if(button)zoom(visible.findIndex(d=>d.id===button.dataset.design));});
 $('zoom-close').addEventListener('click',()=>$('zoom').close());$('previous').addEventListener('click',()=>zoom(current-1));$('next').addEventListener('click',()=>zoom(current+1));
 document.addEventListener('keydown',e=>{if(!$('zoom').open)return;if(e.key==='ArrowLeft'&&current>0){e.preventDefault();zoom(current-1);}if(e.key==='ArrowRight'&&current<visible.length-1){e.preventDefault();zoom(current+1);}});
 fetch('./catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json();}).then(data=>{
  all=data.collections.flatMap(c=>c.designs.map(d=>({...d,revealLevel:c.revealLevel})));visible=all;
  $('level-jump').insertAdjacentHTML('beforeend',data.collections.map(c=>`<option value="${c.revealLevel}">레벨 ${c.revealLevel}</option>`).join(''));
  $('gallery').innerHTML=data.collections.map(c=>`<section class="collection" id="level-${c.revealLevel}"><header class="collection-heading"><h2>레벨 ${c.revealLevel}</h2><p>${escape(c.theme)}</p></header><div class="pair">${c.designs.map(d=>`<article class="design" data-area="${d.area}"><div class="design-heading"><span class="area">${d.area==='inside'?'내부':'외부'}</span><span class="stage">${d.preview.type==='poster'?'승인된 상품 화면':'신규 디자인 시안'}</span></div><button class="art-button" type="button" data-design="${d.id}" aria-label="레벨 ${c.revealLevel} ${escape(d.name)} 확대">${picture(d)}</button><h3>${escape(d.name)}</h3><p class="materials">${d.materials.map(escape).join(' | ')}</p></article>`).join('')}</div></section>`).join('');
  $('gallery').setAttribute('aria-busy','false');filter();if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});
 }).catch(()=>{$('gallery').innerHTML='<p class="loading" role="alert">시안을 불러오지 못했어요. 페이지를 새로 열어 주세요.</p>';$('gallery').setAttribute('aria-busy','false');});
})();
