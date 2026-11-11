/* Platform layer: in-app purchases. Game code calls only window.MidnightPlatform.store.

   Browser: no real store. Purchases succeed and are kept in memory for this page only,
   so screens can be tried on the test site.
   Native: @capgo/native-purchases (StoreKit 2 on iOS, Play Billing on Android). There is
   no server: ownership comes from the store on the device and is cached locally so the
   game still knows it offline. Nothing is ever granted from a failed, pending, revoked
   or unverified transaction.

   "No ads" is true when the player owns the remove-ads product, or on iOS got the app
   while it was still a paid app (AppTransaction.originalPurchaseDate before
   config.store.iosFreeSince). When that cannot be determined, the player is treated as
   ad-free for the session rather than risk showing ads to someone who paid. */
(()=>{'use strict';
  const PLUGIN='NativePurchases',CACHE_KEY='midnight-diner-store-v1';
  const cap=()=>window.Capacitor;
  const isNative=()=>cap()?.isNativePlatform?.()===true;
  const platform=()=>isNative()?String(cap().getPlatform?.()||''):'web';
  const call=(method,options={})=>cap().nativePromise(PLUGIN,method,options);
  const settings=()=>window.MidnightPlatform?.config?.store||{};
  const catalogue=()=>(Array.isArray(settings().products)?settings().products:[]).filter(product=>product&&typeof product.id==='string'&&(product.type==='consumable'||product.type==='non-consumable'));
  const find=id=>catalogue().find(product=>product.id===id);
  const listeners=new Set();
  let owned=new Set(),legacy=null,available=false,started=null,busy=false;

  function readCache(){
    try{
      const data=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}');
      return{owned:Array.isArray(data.owned)?data.owned.filter(id=>typeof id==='string'):[],legacy:data.legacy===true};
    }catch{return{owned:[],legacy:false};}
  }
  function writeCache(change){
    try{localStorage.setItem(CACHE_KEY,JSON.stringify({...readCache(),...change}));}catch{}
  }
  const hasNoAds=()=>owned.has(settings().removeAdsProductId)||(platform()==='ios'&&legacy!==false);
  function publish(){
    try{window.MidnightPlatform?.ads?.setAdFree?.(hasNoAds());}catch{}
    for(const listener of [...listeners])try{listener(state());}catch{}
  }
  const state=()=>({available,noAds:hasNoAds(),owned:[...owned],legacy:legacy===true});
  // A store record counts only when it is a completed, verified purchase that was not refunded.
  const valid=purchase=>Boolean(purchase)&&!purchase.verificationError&&!purchase.revocationDate&&
    (platform()!=='android'||purchase.purchaseState==='1');
  async function refreshOwned(){
    const {purchases=[]}=await call('getPurchases',platform()==='ios'?{onlyCurrentEntitlements:true}:{productType:'inapp'});
    const next=new Set();
    for(const purchase of purchases){
      const product=valid(purchase)&&find(purchase.productIdentifier);
      if(product&&product.type==='non-consumable')next.add(product.id);
    }
    owned=next;writeCache({owned:[...owned]});
  }
  async function refreshLegacy(){
    if(platform()!=='ios'){legacy=false;return;}
    const since=Date.parse(settings().iosFreeSince||'');
    if(!Number.isFinite(since)){legacy=true;return;}      // still a paid app: everyone bought it
    if(readCache().legacy){legacy=true;return;}
    try{
      const {appTransaction}=await call('getAppTransaction');
      // Sandbox and TestFlight report a fixed old date, so only real App Store installs count.
      const bought=Date.parse(appTransaction?.originalPurchaseDate||'');
      legacy=appTransaction?.environment==='Production'&&Number.isFinite(bought)&&bought<since;
      if(legacy)writeCache({legacy:true});
    }catch{legacy=null;}                                   // unknown (offline, iOS 15): ad-free for now
  }
  async function refresh(){
    if(!isNative()||typeof cap().nativePromise!=='function')return state();
    try{available=(await call('isBillingSupported')).isBillingSupported===true;}catch{available=false;}
    await refreshLegacy();
    if(available)try{await refreshOwned();}catch{}        // keep the cached ownership on a failed query
    publish();
    return state();
  }
  const store={
    isNative,
    // Call once after launch, and again whenever the app returns to the foreground.
    init(){
      if(!isNative()){available=true;publish();return Promise.resolve(state());}
      if(!started){
        const cached=readCache();owned=new Set(cached.owned);publish();
        started=refresh();
      }
      return started;
    },
    refresh(){return isNative()?(started=refresh()):Promise.resolve(state());},
    isAvailable:()=>available,
    // Resolves [{id,type,title,price}] with the store's localized price text; an empty
    // list when the store cannot be reached or the product is not registered there.
    async getProducts(){
      const list=catalogue();
      if(!isNative())return list.map(product=>({...product,title:'',price:null}));
      if(!available||!list.length)return[];
      try{
        const {products=[]}=await call('getProducts',{productIdentifiers:list.map(product=>product.id),productType:'inapp'});
        return products.map(item=>({...find(item.identifier),title:item.title||'',price:item.priceString||null})).filter(product=>product.id);
      }catch{return[];}
    },
    // Resolves {ok,productId,reason}. The caller grants goods only when ok is true.
    // reason: 'cancelled' | 'pending' | 'unavailable' | 'unknown-product' | 'busy' | 'failed'.
    async purchase(productId){
      const product=find(productId);
      if(!product)return{ok:false,productId,reason:'unknown-product'};
      if(!isNative()){
        if(product.type==='non-consumable'){owned.add(productId);publish();}
        return{ok:true,productId,reason:'browser-fallback'};
      }
      if(!available)return{ok:false,productId,reason:'unavailable'};
      if(busy)return{ok:false,productId,reason:'busy'};
      busy=true;
      try{
        const purchase=await call('purchaseProduct',{productIdentifier:productId,productType:'inapp',quantity:1,isConsumable:product.type==='consumable'});
        if(platform()==='android'&&purchase?.purchaseState==='0')return{ok:false,productId,reason:'pending'};
        if(!valid(purchase)||purchase.productIdentifier!==productId)return{ok:false,productId,reason:'failed'};
        if(product.type==='non-consumable'){owned.add(productId);writeCache({owned:[...owned]});publish();}
        return{ok:true,productId,transactionId:purchase.transactionId||''};
      }catch(error){
        return{ok:false,productId,reason:/cancel/i.test(String(error?.message||error))?'cancelled':'failed'};
      }finally{busy=false;}
    },
    // Asks the store again for everything this account owns. Resolves {ok,restored:[ids]}.
    async restore(){
      if(!isNative())return{ok:true,restored:[...owned],reason:'browser-fallback'};
      if(!available)return{ok:false,restored:[],reason:'unavailable'};
      try{
        await call('restorePurchases');
        await refreshOwned();publish();
        return{ok:true,restored:[...owned]};
      }catch{return{ok:false,restored:[],reason:'failed'};}
    },
    isOwned:productId=>owned.has(productId),
    hasNoAds,
    // Calls listener({available,noAds,owned,legacy}) on every change; returns an unsubscribe function.
    onChange(listener){listeners.add(listener);return()=>listeners.delete(listener);}
  };
  (window.MidnightPlatform=window.MidnightPlatform||{}).store=store;
})();
