# Direct main launch and painted game icon

The main URL now opens the approved intro and game directly in a browser, with installation optional in Settings. The former installation-only entry has been removed from the document. Saves remain under v11; the manifest id, start URL and scope are unchanged.

The startup flash was reproduced in the embedded preview: its iframe had `hidden=true` but author CSS set `display:block`, exposing the old installation screen until the iframe's load handler launched the intro. The preview now enforces hidden in its own inline CSS, marks the embedded document to defer startup, and reveals it only after launching the intro. Main-entry critical hidden-stage rules are inline, ahead of external styles/scripts.

The PWA icon is one newly generated opaque square painting: a large glazed pork-rice bowl under an amber hanging paper lantern, using the game's room/finished-dish art as style references. No cooking assets were changed. OpenAI image generation produced the source at `/workspace/generated_images/exec-3e71d6a0-1856-45a3-9bb0-2b89f86387dc.png` (SHA256 `0d4e76ff304fc036efc9311dfd34d5b7222ad3ed6bf073952ea1c18f6e6a6e9e`). ImageMagick resampled it for 192/512px standard icons and a 180px Apple touch icon; a separate 512px maskable variant has safe-area padding. Versioned icon URLs help browsers detect the replacement. OS refresh timing for an already-installed icon remains platform-controlled.

Verification:

- 88 Node tests pass.
- `node tests/browser/startup.cjs` checks normal browser, standalone display mode and embedded preview with deliberately delayed game code. No inactive stage appears during sampled paint frames; the intro opens without installation, Skip reveals the game with the existing saved funds, and optional installation controls work in Settings.
- An isolated HTTP/Playwright upgrade check installs the previous v30 worker and its actual old entry, downloads v31, closes the old client and waits for the new worker's activation/cache cleanup. Reopening the same main URL plays directly with saved funds; offline reload, new icon/manifest fetches and intro byte-range responses work.
- Worker activation remains deferred while existing clients are open, preserving an active cooking session. A client still showing the old installation page must close the old site tabs/windows once for the prepared update to activate; no save deletion is required.
