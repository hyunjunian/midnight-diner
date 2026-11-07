# Project workflow

- Work in this checkout on `main` unless the user requests otherwise.
- After each completed and verified change, commit and push to `origin main`, as requested by the user. Report push/deployment failures honestly.
- GitHub Pages publishes `/docs` from `main`. Keep asset URLs relative so the repository subpath works.
- Keep the prototype small until game design is agreed. Temporary guests and dialogue are original placeholders.
- Never commit credentials, local saves, or .DS_Store.

# PWA delivery

- The browser URL is an installation entry. Preserve installed-app-only gameplay, a full-viewport intro followed by a separate game stage, and repository-relative manifest scope/start URLs.
- Whenever any precached app file changes, bump `VERSION` in `docs/sw.js`; keep its precache file list in sync. Verify offline navigation and MP4 byte-range responses.
- The current intro uses newly generated 9:16 visuals. Do not restore the source video's footage. Keep portrait orientation and mobile-safe captions.
- The user subsequently required a wholly new intro: do not reuse reference footage, music, recording, dialogue, or cloned actor voices. Keep the female protagonist and newly synthesized female narration consistent. Record asset provenance and applicable tool/model licenses; do not promise absolute legal clearance.
- Keep the current intro camera locked. Do not reintroduce animated rain overlays, zoom/pan, or brightness oscillation; the user explicitly removed them.
