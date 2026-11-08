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
- No old no-timer checkbox. Preparation uses direct appliance/drag actions, while stove heating uses active timing; align the target label with its green zone. Show varied guest dialogue only in detail/story panels. Preserve v2–v7 saves when migrating to the v8 save key.

- Live gameplay now has moderate downward rain in the outdoor view and behind indoor glass panes only; the user explicitly requested this. Preserve the approved intro video. Keep stronger smooth breathing/head/hair motion without changing mouths or breaking mesh continuity.

- Service lifecycle is seated → accepted/waiting → cooking → eating → paying → farewell → left. Never award money/XP/score on delivery; collect once on explicit payment, then wait for the player to finish goodbye before freeing the seat.
- Each wave of three must have three different recipes, including recommendation orders. Only start the next wave after all three previous guests leave. Migrate duplicate old unaccepted orders without discarding progress.
- Clicking a guest opens the bottom conversation, not the former kitchen sheet. After the final request the player can enter a full-screen first-person kitchen. Keep the fridge/freezer doors, physical stock selection, recipe-specific station sequences and tactile riceball interactions.
- Payment/star badges above guests are explicitly authorized; speech still belongs only in conversation/story screens. Eating can move hands/chopsticks and body, never mouths.
- Ingredients unlock at the earliest recipe level using them. Block locked purchases in engine and UI; retain old owned quantities. The ceramics upgrade uses the edited original-shelf image patch, not a separate floating shelf sprite. Keep room overflow clipped so dialog focus cannot scroll the service camera.

- Direct cooking v16 uses `prep-anime-1`–`prep-anime-7` for one selected ingredient at a time, followed by `process-anime-1`–`process-anime-25` for complete cooking scenes. Never restore separate tiny food/plate/board stickers. All preparation/cooking art is first-person overhead: no owner face, head, torso or apron; only necessary hands/tools may enter from the bottom edge. Preserve customers in service scenes and the approved intro.
- Preparation must come only from the exact refrigerator selection. Show the cabbage/scallion bundle explicitly in stock, then prepare each part separately. Cut only solid food on its target, measure paste/sauce, wash/peel where appropriate. A held knife can make multiple deliberate downward cuts without releasing. Taps/background swipes cannot advance preparation. Use natural lift/tilt/ladle gestures, no artificial source/target labels or final plate tap.
- On first heating, let the player practice turning the gas dial on and back to zero before timed cooking. Persist `stoveTutorialDone`, keep the explicit stop button and visible OFF state. Preserve v2–v7 money/inventory/payment records in v8; restart unfinished old cooking sequences because the step order changed.
