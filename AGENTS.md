# Project workflow

- Work in this checkout on `main` unless the user requests otherwise.
- After each completed and verified change, commit and push to `origin main`, as requested by the user. Report push/deployment failures honestly.
- GitHub Pages publishes `/docs` from `main`. Keep asset URLs relative so the repository subpath works.
- Keep the prototype small until game design is agreed. Temporary guests and dialogue are original placeholders.
- Never commit credentials, local saves, or .DS_Store.

# PWA delivery

- The browser URL is an installation entry. Preserve installed-app-only gameplay, a full-viewport intro followed by a separate game stage, and repository-relative manifest scope/start URLs.
- Keep the explicit `preview.html` playtest entry available without installation. Bump its `release` query tag with UI releases so an older worker cannot serve stale preview scripts.
- Whenever any precached app file changes, bump `VERSION` in `docs/sw.js`; keep its precache file list in sync. Verify offline navigation and MP4 byte-range responses.
- The current intro uses newly generated 9:16 visuals. Do not restore the source video's footage. Keep portrait orientation and mobile-safe captions.
- The user subsequently required a wholly new intro: do not reuse reference footage, music, recording, dialogue, or cloned actor voices. Keep the female protagonist and newly synthesized female narration consistent. Record asset provenance and applicable tool/model licenses; do not promise absolute legal clearance.
- Keep the current intro camera locked: no zoom/pan or brightness oscillation. The user later authorized moderate, physically downward rain in the FIRST exterior scene only. Keep all indoor scenes free of rain overlays; use positive screen-Y trajectories, not looping stripe patterns.
- Keep the approved woman, camera composition and warm lighting. The restaurant architecture itself uses Japanese timber sliding doors, lattice windows and aged timber/plaster; do not reduce this direction to small decorative props or restore the arched cafe entrance.

- In-game guests use softly painted Japanese animation character art, preserving their established hair, clothing and identities. Keep the approved cinematic intro unchanged when editing game character art; the in-game room uses the stool-free first-person counter background.

- The player is the unseen owner. Show guest upper bodies behind the foreground bar, with no owner avatar, guest legs, or stools. Never animate mouths in any scene or detail panel; never show customer speech or order thought bubbles in the room. Dialogue belongs in explicit guest detail/story panels.
- Use the painted food / realistic furnishing atlases instead of ingredient emoji or vector decoration stickers. Guest portraits span diverse ages; nightly faces are unique and satisfied visitors return only after two level gains. Preserve continuous mesh morphing and safe renderer fallback without cut-out seams.

- Keep only the existing central ceiling fixture; a purchased lantern improves its light rather than adding an overlapping lamp. Ingredient controls must explain missing stock/selection and offer in-place refill. Food art needs clear tile margins to prevent neighboring-cell fragments.

- The catalogue contains 100 individually illustrated dishes. Start with 3 at Lv.1; add exactly 3 each level through Lv.33, then the remaining one at Lv.34. Never restore ten dishes per level. Progression caps at Lv.34; the replacement fridge unlocks at Lv.20 and discounts ingredient purchases by 10%.
- Furnishings use measured surface slots, keyed DOM elements, automatic area/pan focus, visible installation and completion glow. Keep the fridge replacement at the original fridge footprint. Do not recreate decoration nodes during ordinary state renders.
- No leisurely/manual cooking mode. Both preparation and heat use timing; align the target label with its green zone. Show varied guest dialogue only in detail/story panels. Preserve v4 saves when migrating to the v5 save key.

- Live gameplay now has moderate downward rain in the outdoor view and behind indoor glass panes only; the user explicitly requested this. Preserve the approved intro video. Keep stronger smooth breathing/head/hair motion without changing mouths or breaking mesh continuity.
