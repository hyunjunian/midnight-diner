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
 const api={dateForNight,label,nightForDate,monthPage,monthInfo,firstNight};
 if(typeof module!=='undefined')module.exports=api;else window.MidnightDate=api;
})();
