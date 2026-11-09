# Reported cooking-art boundary repairs — v49

Scope: the user's pictured damaged rice hand/bowl, broth grip, pork matte, cabbage plating handle, misoshiru cooking vessel, and salmon-teriyaki stove seam/handle. No new generated images were requested or produced for this repair.

- Rice: recover the complete pre-v48 lower right-hand/paddle source before the colour-based segmentation. Enlarge the intact lower actor at the existing scale/anchor, retaining the paddle head and gesture. Recover the receiving bowl from its complete original outline; retain the existing slight downward offset and all four scoop states.
- Broth: keep all existing upper 478 native rows unchanged. Use the coherent existing right-only lower source as a whole, without cutting the thumb at the wood edge.
- Pork: remove only exterior-connected matte through alpha. Every retained nontransparent pixel has its original RGBA; no recolouring or food regeneration.
- Cabbage plating: use the complete handle from this dish's unchanged stove source, rigidly reflected/rotated/scaled onto the attachment. Complete end has transparent atlas margins. Preserve food/body above the attachment and the plate/spatula.
- Misoshiru plating: use the actual corresponding stove saucepan and quality-state contents, retaining the original empty lacquer receiver and ladle in front. No stove asset was edited.
- Salmon-teriyaki heating: narrowly scope the mask to physical burner, pan, complete original handle, and control mount. The fixed existing steel/tile background remains the only surround. Other recipes' heating masks are unchanged.

Implementation scope was checked before release metadata changes: exactly seven image files and the two-line scoped mask addition in kitchen.js. All other tracked implementation files were identical to 5f9ff90. Pixel checks retained 407,479 upper-broth pixels, 715,605 protected cabbage pixels, 143,101 protected misoshiru receiver pixels, and 461,100 pork pixels exactly. Low-alpha composite rounding in protected vessel pixels was corrected by restoring original RGBA after composition.

Validation: 125 unit tests; opaque skin regression points across previously missing fingers/palm; complete cabbage handle atlas margins; six action scenes at 320/393/430 and landscape, real pointer rice/pour actions; clear-glass and three rice deposits at 320/393/430; targeted six repair screenshots at 320/393/430. Desktop Chromium simulation, not physical-device testing. No backgrounds, typography, headings, navigation, ingredient stock, progress, guide geometry, completed dishes, egg glass/pour pan, or unrelated photo assets changed. Release metadata only refreshes delivery hashes/cache identity.
