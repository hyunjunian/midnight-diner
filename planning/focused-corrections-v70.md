# Requested focused corrections

This release addresses only the user's subsequent marked issues:

- Remove the level-plan wording, dropdown and its unused controller; the two next eligible area improvements remain.
- Remove MY LITTLE DINER from the management header and remove the trailing sequential-purchase explanation.
- Use 자금 for live renovation messages. Show prices as ¥450 and make the purchase button's visible text the amount alone. Clarify the summary as 매장 개선 현황 with required-level instructions, separate money/score labels and improvement counts. Leave20px between stat rewards and the button.
- Match the settings square to the measured wallet plaque height, including its square width and responsive frame thickness. Do not change the gear image, calendar or wallet content.
- Fix status plaque width/height/border across readiness, eating, payment and goodbye. Preserve the ready-state attention color and keep other statuses' outer wood frame at the same extent. No guest, food, payment or service rules change.
- The photograph extension below the renovated room sampled y904 onward, repeating the counter face before its floor. Restrict this extension to native y925–1024 so the old counter strip no longer repeats. The approved room, exterior and counter images remain unchanged.
- Fix only the pictured final cracked-egg food: the earlier glass-alpha operation removed bright egg highlights too. Reuse the original pre-operation atlas **byte-for-byte**, clipped to the final egg's food silhouette in CSS. The current clear glass, shell, hands, board and all other action tiles remain unchanged. No image was regenerated or repainted.

`assets/egg-food-source-v70.webp` SHA256 is `b083f97a7197e8fde55f37575dd83732456efd63869e9e81a37a98569765d0cf`, matching `7055dbe:docs/assets/foreground-v39-prep-egg.webp`, the source before the v48 glass-alpha operation. `egg-food-v70.css` applies only to `data-part="egg"` / `data-frame="3"`. The measured before/after screenshot changed1464 pixels, all inside the egg food (x69–257/y469–613 at393×852); no surrounding scene pixels changed.

Browser checks at320/393/430/1280 verify identical wallet/settings heights and top edges,91×30 status bodies through an actual eating→payment transition,20px reward/button spacing, no removed controls/wording, amount-only purchase labels and no horizontal overflow. Existing renovation cash/save/offline/mute tests are rerun. All previously tracked artwork, cooking layout, kitchen code, gestures, engine rules and approved store previews are unchanged.

Screenshots are in `docs/mockups/focused-v70/`. Verification details are in `focused-corrections-v70-verification.json`.
