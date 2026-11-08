# Analog installation and feedback notices

`docs/analog-feedback-v25.css` is a final override layer, loaded after the existing material/physical-icon/polish styles. It changes surfaces only; no game.js, scene.js, engine.js, HTML or accounting logic is modified.

## Audited and updated

- `.placement-banner`: existing two-phase item placement/benefit text on real washi in the existing 9-slice walnut frame; existing flight, camera focus and hide timing stay intact.
- `.placement-gain` / `.loss`: small paper inventory tags with signed green/red ink, replacing the rounded digital pill.
- `#toast`: a softly uneven paper slip with readable printed text, no modern capsule fill; remains noninteractive.
- `#kitchen-inline-feedback`: the same material as an in-flow instruction slip, preserving unobstructed drag controls.
- `.cash-flight`: actual washi texture and banknote border on its existing cash-to-wallet animation.
- `.ambience-reward` / `.replace-delta`: benefit/replacement values as small green/red ink marks on paper.

Existing report growth cards, reward galleries and measuring panels already use the washi/material layers, so their layout and numeric behavior are retained. Navigation/scene appliance signs are handled by the parallel navigation workstream.

## Story candle

The same `#story-badge` element remains controlled by `MidnightEngine.storyNeedsAttention`. The old amber pilot icon is replaced by a small candle: the lower brass/wood base reuses the original transparent object atlas; a quiet ivory wax column and tiny local flame are drawn on the same element. Only the flame changes shape, through a reproducible irregular sequence generated with fixed seed 25051, 13.7 seconds per cycle. No button/background brightness pulsing is introduced. Reduced motion holds the flame steady. No new asset, scheduler, DOM element, story-state mutation or saved-data migration is needed.

Reused materials: `ui-washi-v21.webp`, `ui-frame-walnut-v21.webp`, `ui-objects-v21.webp`; existing provenance applies.

## Verification

Chromium with the integrated app and final CSS injected, 320/393/430 × 852:

- Actual ceramics purchase: item grows and flies, installation note appears, paper gain/benefit appears briefly and disappears; funds decrease once and atmosphere increases once, with no later duplicate reward.
- Placement banner remains inside the viewport; real pantry refill triggers the updated paper toast.
- Actual two-step story choice completion hides the candle.
- Unread night news lights it; opening/reading clears it and it remains off after restoring/reloading that saved state.
- Badge wrapper and entire story button have no animation; only `::after` flame animates; reduced-motion has no flame animation.
- No JavaScript errors.

Harness: `/workspace/work/midnight-diner/v25/feedback-check.cjs`.
Screenshots: `feedback-install-{320,393,430}.png`, `feedback-gain-{320,393,430}.png`, `feedback-toast-{320,393,430}.png`, and `feedback-candle-393.png` in the same work directory. Actual installation and candle composites were visually inspected.
