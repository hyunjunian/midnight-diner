/* All gameplay is free. Cosmetic purchases never grant operating advantages. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.MidnightGrowth=api;})(globalThis,function(){
 'use strict';
 const initialAccess=()=>({version:1,kind:'free'});
 const restoreAccess=()=>initialAccess();
 const levelLimit=()=>50;
 const needsPass=()=>false;
 const benefits=()=>({tips:0,operatingDiscount:0});
 return Object.freeze({initialAccess,restoreAccess,levelLimit,needsPass,benefits});
});
