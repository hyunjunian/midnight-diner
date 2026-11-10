/* Trial and renovation rewards. No checkout or paid entitlement is enabled here. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.MidnightGrowth=api;})(globalThis,function(){
 'use strict';
 const trialLevel=2,plannedPrice=7900;
 const initialAccess=()=>({version:1,kind:'trial'});
 function restoreAccess(source,earnedLevel){
  if(source?.version===1&&['trial','existing-player'].includes(source.kind))return {version:1,kind:source.kind};
  // Existing players retain their earned content. This is not a purchase receipt.
  return !source&&earnedLevel>trialLevel?{version:1,kind:'existing-player'}:initialAccess();
 }
 const levelLimit=s=>s.access?.kind==='existing-player'?50:trialLevel;
 const needsPass=(s,threshold)=>levelLimit(s)===trialLevel&&s.level<=trialLevel&&s.xp>=threshold;
 function benefits(totals){
  const bounded=v=>Math.max(0,Math.min(180,Number.isFinite(v)?v:0));
  return {tips:Math.round(bounded(totals.atmosphere)*2)/10,operatingDiscount:Math.round(bounded(totals.environment))/10};
 }
 return Object.freeze({trialLevel,plannedPrice,initialAccess,restoreAccess,levelLimit,needsPass,benefits});
});
