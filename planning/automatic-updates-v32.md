# Fresh normal navigation and automatic updates

Previously the worker returned cached index HTML first and waited for a manual Settings action to activate a new worker. A normal refresh could therefore show the old application repeatedly.

Normal online navigation now requests server HTML with `cache: no-store`, falling back to the fully precached shell when offline, timed out or receiving a server error. Entry scripts, styles and manifest carry the same release identifier. A tagged request can only use that release's cache; it never silently takes another version's code. Newly tagged code bypasses HTTP cache when not yet in a matching shell. Successful online HTML does not overwrite only the index of the offline shell.

A new worker fetches every shell entry without HTTP cache and activates automatically only after the entire download succeeds. Failure deletes its partial cache and leaves the active worker alone. The current and immediately previous shell are retained so the page finishing a meal still has its own code after controller change. Old cache cleanup remains scoped to this application.

The application checks at startup, foreground/online return and every active minute. When a newer prepared worker is available it saves and reloads once, with no update button required. It waits through cooking, an open dialog, background visibility and hidden pre-intro stages; a failed save prevents a reload. Both activation announcements and a controller-version handshake handle foreground/suspended-page timing. Initial installation, the same release and older announcements cannot form a reload loop. Existing pre-v32 pages cannot handle the new automatic-reload message; the newly activated worker still lets their next ordinary refresh fetch the new shell, without closing all tabs or hard-refreshing.

The user's subsequent choice-style correction removes the dark-green reply override and restores the existing textured washi slips. Compact panel spacing, outside-tap dismissal and no focus ring remain.

Use `node tools/set-release.cjs YYYYMMDD-vNN-description` to keep the worker, entry and preview release identifiers aligned. Existing v11 saves, manifest identity, intro, icon and music are preserved.

Validation:

- 100 Node tests pass, including new network-first/server-error behavior, release separation, atomic install/failure, retained previous shell, automatic reload deferral, save failure, foreground checks and release-tag consistency.
- `node tests/browser/updates.cjs` uses real v31 code and a real worker, then current and simulated future releases from an isolated HTTP server with year-long HTTP cache headers. It does not clear storage or issue a hard reload. With the old cooking page still open, the new worker activates; ordinary reload gets current code. A later update waits for the real delivery button, then automatically reloads while preserving funds and served-meal state. Offline reload and MP4/MP3 byte ranges pass.
- The startup browser regression passes in ordinary, standalone and embedded modes. Manual-style browser automation checks the restored paper reply controls at 320/393/430px, dialog dismissal/drag safety, focus styling and conversation persistence.
