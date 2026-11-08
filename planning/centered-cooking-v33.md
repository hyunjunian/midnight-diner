# Centered cooking, compact controls and tactile conversation

Cooking now uses one full-viewport stage with fixed controls. `cooking-layout.js` provides the same source-space transform for food art, gesture guides and pointer input; `mobile-layout-v33.css` is the final responsive layer. The board continues behind the order header, location rail and footer instead of revealing a room strip. Food is placed in the usable center, the fill/count display stays above the footer and full-image proportions are retained. Heating has a continuous full-width steel substrate with the existing approved vessel/grate and one live knob; recipe-specific masks follow the actual handle rather than carrying a rectangle of the source background. No new food artwork was generated. This release used the existing fifteen-menu Lv.1–5 native renderer; the user subsequently clarified that photo production/composition must first be limited to exactly five dishes. The clarification and current footprint are recorded below.

The measure target card and long instruction paragraph are gone. A short quantity label and fill bar remain, including real meter semantics. There are no replay/helper footer cards or empty inline feedback panels. Rice, miso, measuring, plating and nori transfer guides are straight, with the recognizer accepting a deliberate quick start-to-target drag; circular mixing is unchanged. The stove knob has a curved turning arrow and small paper label until it is first turned. Cooking and completion have no scroll; completion explicitly parses fraction aspect ratios rather than treating `3/4` as the number 3. The compact landscape arrangement places controls beside the scene. iOS text-size adjustment is fixed at 100%, and titles use stacked horizontal lines.

Preparation no longer says `9끼분`, `3끼` or similar numeric meal-count labels. Forecasting, stock charges and the saved 3/9 preparation choice are unchanged. The growth panel and location rail are smaller; the rail retains 44px hit regions. Preparation ingredient cards fit their grid instead of cutting off the last card.

Story sheets use a stable header with an upright plain cross and a separately scrollable body sized to the current viewport. Choice numbers/cards and the jump control have no red borders or rotation. Long costs/guest profiles wrap within the sheet. Payment is a small washi receipt; notices have a real dismiss control. Tactile paper/wood materials remain shared by dialogue and clickable controls, while physical equipment keeps its actual material.

`dialogue-motion.js` types guest dialogue by grapheme and holds the full sentence's layout height so choices do not jump. Unrelated renders do not restart it. A small ink cursor and speaking dots add activity without moving mouths. Bubble tap/Enter/Space finishes immediately; closing, backgrounding and reduced motion finish it quietly. No speech or sound was added. Existing v11 saves, intro, music controls, service lifecycle and automatic updates are unchanged.

Generated background provenance:

- OpenAI image generation edited the existing approved board reference into a single prop-free board: `/workspace/generated_images/exec-b36e37d3-eaf5-4cf7-a11e-95bf7cb33a88.png`. Encoded as `assets/workbench-v33.webp`; SHA256 `6b118e1fc369542c1c52054c43167761138588ec02fb5c7896744697b4650b87`.
- The approved native stove reference supplied the empty tile/steel substrate: `/workspace/generated_images/exec-25208b4b-1296-4249-85bc-24fbd2360245.png`. Encoded as `assets/stove-background-v33.webp`; SHA256 `8107a9738cf2e41b826dede1e586e3469e0e778e5b31e948f14dc21ff5c44e9f`.
- ImageMagick only encoded these generated sources as WebP. Existing cooking/food image files were not edited.

Validation:

- 103 Node tests pass, including source transforms, direct quick transfers, all recipe/quality/save invariants and cache coherence.
- `node tests/browser/mobile-cooking.cjs` inspected all 100 recipes at all 673 preparation/heating/completion states at 393×659. It checks scroll extent, caption width, footer containment and counter separation. The short/tall/landscape regression covers 320×568, 393×734, 393×852 (47/34px installed safe-area emulation), 430×932 and 852×393. Actual three straight rice scoops, held measuring and knob activation pass. Final changes to native composition were separately checked for all fourteen heated pilot dishes.
- `node tests/browser/dialogue-materials.cjs` covers progressive lettering, full-line reveal, stable height, no restart, reduced motion, reachable upright story choices, dismissible notices, paper payment receipts, and management pages at 320/393/430px.
- Startup and real-worker migration/offline tests cover the new assets/modules and release-tagged shell. MP4/MP3 byte ranges and saved cooking/service/funds remain intact.
- These are Chromium touch/viewport/safe-area checks, not a physical iPhone Safari test. WebKit's runner is not installed in this environment. Rendered native-stove contact sheets were inspected for food/control/handle placement; no claim of physical-device verification is made.

## Scope correction after the user's question

Inspection confirms the live `MidnightCookingRules.imagePilot` contains fifteen recipes, not five. The release changed two shared background image files and performed recipe-specific native composition across that existing footprint. The earlier “five levels = fifteen dishes” interpretation did not follow the user's “five dishes first” photo-review instruction.

The working rule is now exactly onigiri, tamago, tonjiru, ochazuke and negi_omelette first, including recipe-specific compositing/masks. Show those results and obtain explicit approval before extending photo work to other dishes. The already-live fifteen-recipe mapping is unchanged by this documentation correction; no rollback to five is claimed. This distinguishes the current implementation from the stricter rule for subsequent photo work without silently changing existing art in response to a question.
