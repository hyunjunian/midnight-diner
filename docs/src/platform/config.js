/* Platform layer settings shared by the app and the publishing tools.
   updateBaseUrl: public HTTPS address of the update site that serves latest.json and
   the bundle files (route in wrangler.updates.jsonc), without a trailing slash. Leave empty to turn live updates off. */
(()=>{'use strict';
  (window.MidnightPlatform=window.MidnightPlatform||{}).config={
    updateBaseUrl: 'https://midnight-update.couprice.com'
  };
})();
