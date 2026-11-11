/* Platform layer settings shared by the app and the publishing tools. */
(()=>{'use strict';
  (window.MidnightPlatform=window.MidnightPlatform||{}).config={
    // Public HTTPS address of the update site that serves latest.json and the bundle
    // files (route in workers/update/wrangler.jsonc), without a trailing slash.
    // Leave empty to turn live updates off.
    updateBaseUrl: 'https://midnight-update.couprice.com',
    store: {
      // Products as registered in App Store Connect and Play Console, same id in both.
      // type: 'non-consumable' (owned forever, restorable) or 'consumable'.
      products: [
        { id: 'midnight_remove_ads', type: 'non-consumable' }
      ],
      // The product that turns interstitial ads off.
      removeAdsProductId: 'midnight_remove_ads',
      // Show the "remove ads" purchase in Settings. Stays false until ads exist (stage 4).
      removeAdsOnSale: false,
      // iOS was sold as a paid app first. Set the UTC time it became free, e.g.
      // '2027-03-01T00:00:00Z': people who got the app before it never see interstitials.
      // While this is empty the app is still paid, so every iOS player is ad-free.
      iosFreeSince: ''
    }
  };
})();
