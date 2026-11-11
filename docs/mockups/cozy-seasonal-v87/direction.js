(()=>{
 'use strict';
 const $=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const monthSeason=month=>month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
 const names={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'},examples={spring:'2027-04-01',summer:'2027-07-01',autumn:'2026-09-01',winter:'2026-12-01'};
 const copy={spring:'짧은 꽃가지와 옅은 봄빛을 조금 더해요. 가게 전체를 꽃으로 덮지 않아요.',summer:'푸른 천과 작은 초록 가지로 가볍고 시원한 인상을 더해요.',autumn:'초가을에는 억새와 차분한 갈색을, 깊은 가을에는 작은 단풍 장식을 더하는 방향이에요.',winter:'두툼해 보이는 노렌과 작은 동백·상록 가지로 포근하게 정돈해요. 날씨를 강제로 눈으로 바꾸지 않아요.'};
 const art=p=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${p.rect.join(' ')}" role="img" aria-label="${escape(p.title)}"><image href="${escape(p.file)}" width="${p.size[0]}" height="${p.size[1]}"/></svg>`;
 let data=null,images=new Map();
 function card(p,key,detail){images.set(key,p);return `<article class="design"><div class="design-heading"><span class="area">${p.area==='inside'?'내부':'외부'}</span><span class="stage">수정 방향 시안</span></div><button type="button" class="art-button" data-art-key="${key}" aria-label="${escape(p.title)} 확대">${art(p)}</button><h3>${escape(p.title)}</h3><p class="materials">${escape(detail)}</p></article>`;}
 function season(){
  if(!data)return;const [year,month,day]=$('game-date').value.split('-').map(Number);if(!year||!month||!day)return;const selected=monthSeason(month),parts=data.seasons[selected];
  $('season-title').textContent=`${year}년 ${month}월 ${day}일 · ${names[selected]}`;$('season-copy').textContent=copy[selected];
  document.querySelectorAll('[data-season]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.season===selected)));
  $('season-pair').innerHTML=parts.map(p=>card(p,`season-${selected}-${p.area}`,'기본 성장과 별도로 선택하는 작은 계절 장식 예시')).join('');
 }
 $('game-date').addEventListener('change',season);document.querySelector('.season-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-season]');if(b){$('game-date').value=examples[b.dataset.season];season();}});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-art-key]');if(!b)return;const p=images.get(b.dataset.artKey);if(!p)return;$('zoom-level').textContent=p.label;$('zoom-title').textContent=p.title;$('zoom-art').innerHTML=art(p);$('zoom-materials').textContent='성장·계절감을 확인하는 검토용 시안';$('zoom').showModal();});$('zoom-close').addEventListener('click',()=>$('zoom').close());
 fetch('./direction.json').then(r=>{if(!r.ok)throw Error('direction');return r.json();}).then(result=>{
  data=result;$('stages').innerHTML=data.stages.map(s=>`<section class="stage-block"><header class="stage-caption"><strong>레벨 ${s.level}</strong><div><h3>${escape(s.title)}</h3><p>${escape(s.description)}</p></div><span class="stage-range">${s.range[0]}~${s.range[1]}레벨 기준</span></header><div class="pair">${s.images.map(p=>card(p,`growth-${s.level}-${p.area}`,s.materials.join(' | '))).join('')}</div></section>`).join('');$('stages').setAttribute('aria-busy','false');
  const first=window.MidnightDate.dateForNight(1);$('game-date').value=`${first.year}-${String(first.month).padStart(2,'0')}-${String(first.day).padStart(2,'0')}`;season();
 }).catch(()=>{$('stages').innerHTML='<p class="loading" role="alert">시안을 불러오지 못했어요. 새로고침해 주세요.</p>';$('stages').setAttribute('aria-busy','false');});
})();
