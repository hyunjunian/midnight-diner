/* Platform layer settings shared by the app and the publishing tools.
   updateBaseUrl: public HTTPS address of the R2 bucket that hosts latest.json and
   the update files, without a trailing slash. Leave empty to turn live updates off. */
(()=>{'use strict';
  (window.MidnightPlatform=window.MidnightPlatform||{}).config={
    updateBaseUrl: ''
  };
})();
