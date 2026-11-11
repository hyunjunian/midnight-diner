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
      // Show the "remove ads" purchase in Settings of the apps (ads exist since stage 4).
      // The row still appears only when the store really returns the product.
      removeAdsOnSale: true,
      // iOS was sold as a paid app first. Set the UTC time it became free, e.g.
      // '2027-03-01T00:00:00Z': people who got the app before it never see interstitials.
      // While this is empty the app is still paid, so every iOS player is ad-free.
      iosFreeSince: ''
    },
    ads: {
      // false turns ads off completely: no SDK start, no ad requests, no privacy questions.
      // The ids below were written by `node tools/set-admob.cjs` (app ids live in the native projects).
      enabled: true,
      // true: request only Google's public test ads instead of the real units below.
      // On while the apps are being tested; set to false before the store release.
      testMode: true,
      units: {
        ios: { interstitial: 'ca-app-pub-7477519330314468/3681611083', rewarded: 'ca-app-pub-7477519330314468/8554838820' },
        android: { interstitial: 'ca-app-pub-7477519330314468/9220732439', rewarded: 'ca-app-pub-7477519330314468/2352071758' }
      },
      // The dawn bulletin (and its ad page) appears when moving on to the next night only after
      // this much active play since the last one. Short gaps earn little and wear the event out.
      bulletinMinPlayMinutes: 12,
      // Closeness a guest gains when the owner watches the clip they share (customer book, max 20).
      shareAffinity: 2
    }
  };
})();
