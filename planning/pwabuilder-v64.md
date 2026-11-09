# PWABuilder recommendation review

Applied useful install metadata from the supplied PWABuilder checklist:

- Real portrait screenshots of the existing game and cooking UI plus a wide gameplay screenshot, with PNG dimensions, narrow/wide form factors and Korean accessible descriptions for the corresponding richer install dialogs. They are captured from the current game, not generated mockups or new recipe artwork.
- Explicit `dir: "ltr"` for Korean interface text.
- Explicit `prefer_related_applications: false`: this product is the PWA; there is no related native application to prefer.
- `launch_handler.client_mode: "focus-existing"`: supporting browsers focus the existing game window instead of opening another copy that might compete over a shared local save. Unsupported browsers retain their normal launch fallback.

Install identity, repository-relative start URL/scope, fullscreen/standalone fallback, portrait orientation, and optional installation remain unchanged.

The other checklist entries are optional capabilities, not missing requirements:

- No native application IDs or IARC rating were invented. Related application metadata and an IARC ID need actual published app/certification details.
- Scope extensions are unnecessary because the game stays on its single origin and repository scope.
- Shortcuts were deferred because there is no defined, safe deep-link contract for menu/calendar actions while cooking or an existing game window is active.
- File/protocol handlers, receiving shares, note-taking, widgets and an Edge side panel have no corresponding game workflow. Declaring them without implemented behavior would be misleading.
- Window controls overlay and tabbed display conflict with the current single-view fullscreen portrait game design; display preferences are preserved.
- Background/periodic sync have no queued server writes or external changing data to synchronize. Existing local saves, verified offline precaching and silent foreground version checks already address this game's connectivity needs.
- Push notifications require a real notification service and user-facing opt-in experience. No notification permission is requested solely to improve a checklist score.

Validation checks repository-scoped URLs, unchanged install identity, launcher intent, screenshot file signatures, real dimensions/aspect ratios and display metadata.
