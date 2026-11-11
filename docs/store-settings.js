/* Settings rows for the "remove ads" purchase and purchase restore.
   Uses only window.MidnightPlatform.store; no store plugin is called from here.
   Shown in the apps when config.store.removeAdsOnSale is true and the store returns the product;
   in a browser only with ?store-test. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const platform=window.MidnightPlatform||{},store=platform.store,settings=platform.config?.store||{};
  const section=$('store-section'),buy=$('store-remove-ads'),price=$('store-remove-ads-price'),restore=$('store-restore'),status=$('store-status');
  if(!store||!section||!buy||!price||!restore||!status)return;
  const testing=!store.isNative()&&new URLSearchParams(location.search).has('store-test');
  // Real purchases exist only in the apps; the browser site shows the rows for testing only.
  const onSale=store.isNative()?settings.removeAdsOnSale===true:testing;
  const productId=settings.removeAdsProductId;
  let working=false,drawn=0;
  async function render(){
    const turn=++drawn;
    if(!onSale){section.hidden=true;return;}
    if(store.hasNoAds()){
      price.textContent='적용됨';buy.disabled=true;restore.hidden=true;section.hidden=false;return;
    }
    const product=(await store.getProducts()).find(item=>item.id===productId);
    if(turn!==drawn)return;                 // a newer render already ran
    if(!product){section.hidden=true;return;} // store unreachable or product not registered yet
    price.textContent=product.price||(store.isNative()?'':'테스트 결제');buy.disabled=working;restore.hidden=false;restore.disabled=working;section.hidden=false;
  }
  async function run(action){
    if(working)return;
    working=true;buy.disabled=true;restore.disabled=true;
    try{status.textContent=await action();}
    catch{status.textContent='잠시 후 다시 시도해 주세요.';}
    finally{working=false;render();}
  }
  buy.addEventListener('click',()=>run(async()=>{
    status.textContent='결제를 진행하고 있어요…';
    const result=await store.purchase(productId);
    if(result.ok)return'광고 제거가 적용됐어요.';
    if(result.reason==='cancelled')return'';
    if(result.reason==='pending')return'결제 승인을 기다리고 있어요. 승인되면 자동으로 적용돼요.';
    return'결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }));
  restore.addEventListener('click',()=>run(async()=>{
    status.textContent='구매 내역을 확인하고 있어요…';
    const result=await store.restore();
    if(!result.ok)return'구매 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    return store.hasNoAds()?'구매 내역을 복원했어요.':'복원할 구매 내역이 없어요.';
  }));
  store.onChange(()=>{render();});
  // Ownership can change outside the app (refund, approval of a pending payment).
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)store.refresh();});
  Promise.resolve(store.init()).catch(()=>{}).then(render);
})();
