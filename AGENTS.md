# Project workflow

- Work in this checkout on `main` unless the user requests otherwise.
- After each completed and verified change, commit and push to `origin main`, as requested by the user. Report push/deployment failures honestly.
- GitHub Pages publishes `/docs` from `main`. Keep asset URLs relative so the repository subpath works.
- Keep the prototype small until game design is agreed. Temporary guests and dialogue are original placeholders.
- Never commit credentials, local saves, or .DS_Store.

# PWA delivery

- The browser URL is an installation entry. Preserve installed-app-only gameplay, a full-viewport intro followed by a separate game stage, and repository-relative manifest scope/start URLs.
- Whenever any precached app file changes, bump `VERSION` in `docs/sw.js`; keep its precache file list in sync. Verify offline navigation and MP4 byte-range responses.
- Preserve the user-provided opening clip's burnt-in subtitles; do not recreate them as separate text overlays.
