/* Fixed fictional calendar dates; UTC arithmetic keeps saves independent of device timezone. */
(()=>{'use strict';
 const DAY=86400000,START=Date.UTC(2026,8,1);
 function integer(value,name){if(!Number.isSafeInteger(value))throw new RangeError(`Invalid ${name}`);return value;}
 function dateForNight(n){integer(n,'night');if(n<1)throw new RangeError('Invalid night');const d=new Date(START+(n-1)*DAY);if(!Number.isFinite(d.getTime()))throw new RangeError('Invalid night');return{year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),weekday:d.getUTCDay()};}
 function nightForDate(year,month,day){integer(year,'year');integer(month,'month');integer(day,'day');if(year<100||month<1||month>12||day<1||day>31)throw new RangeError('Invalid date');const value=Date.UTC(year,month-1,day),d=new Date(value);if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)throw new RangeError('Invalid date');return Math.round((value-START)/DAY)+1;}
 function label(n,withYear=false){const d=dateForNight(n);return`${withYear?d.year+'년 ':''}${d.month}월 ${d.day}일`;}
 function monthPage(n){const d=dateForNight(n);return(d.year-2026)*12+d.month-9;}
 function monthInfo(offset){integer(offset,'month offset');if(offset<0)throw new RangeError('Invalid month offset');const d=new Date(Date.UTC(2026,8+offset,1));if(!Number.isFinite(d.getTime()))throw new RangeError('Invalid month offset');return{year:d.getUTCFullYear(),month:d.getUTCMonth()+1,days:new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate(),weekday:d.getUTCDay()};}
 function firstNight(offset){const d=monthInfo(offset);return nightForDate(d.year,d.month,1);}
 // Original short lines, shuffled once per calendar year without changing saves.
 const quotes=[
  '정성은 서두르지 않아도 전해져요.',
  '따뜻한 한 끼가 긴 하루를 안아 줘요.',
  '잠깐의 쉼도 내일을 위한 준비예요.',
  '작은 친절이 오래 남는 온기가 돼요.',
  '오늘의 수고를 조용히 다독여 주세요.',
  '천천히 쌓은 마음은 쉽게 식지 않아요.',
  '잘 쉬는 날에도 삶은 앞으로 흘러가요.',
  '한 사람을 위한 정성도 충분히 빛나요.',
  '익숙한 자리에도 새로운 이야기가 와요.',
  '기다려 주는 마음이 편안한 자리를 만들어요.',
  '서툰 하루에도 다정함은 남길 수 있어요.',
  '작은 시작을 오래 아껴 주세요.',
  '누군가의 안부가 하루의 불빛이 돼요.',
  '조금 느린 걸음에도 저마다의 길이 있어요.',
  '마음을 담은 일은 흔적을 남겨요.',
  '함께 나눈 온기는 쉽게 사라지지 않아요.',
  '오늘 할 수 있는 만큼이면 충분해요.',
  '좋은 기억은 사소한 순간에 머물러요.',
  '돌아올 자리가 있다는 건 작은 위로예요.',
  '어제보다 다정한 오늘을 차려 보세요.',
  '비 오는 날에도 마음의 불은 켤 수 있어요.',
  '마지막 한 사람에게도 처음 같은 마음을.',
  '비워 둔 자리에는 새 인연이 앉아요.',
  '하루를 마친 당신에게도 온기를 건네요.'
 ];
 function monthQuote(year,month){
  integer(year,'year');integer(month,'month');if(year<100||month<1||month>12)throw new RangeError('Invalid quote month');
  let seed=2166136261;for(const c of `${year}:monthly-lines:v1`)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  const random=()=>{seed=(seed+0x6d2b79f5)>>>0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  const order=[...quotes];for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  return order[month-1];
 }
 const api={dateForNight,label,nightForDate,monthPage,monthInfo,firstNight,monthQuote};
 if(typeof module!=='undefined')module.exports=api;else window.MidnightDate=api;
})();
