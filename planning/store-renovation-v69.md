# Approved 50-level store renovation integration

The user approved preview commit `8d264d3` ("이렇게 적용해줘! 좋다."). The live **가게 꾸미기** dock keeps its existing button and now opens **분위기 및 환경 개선**. Individual item buying and placement are disabled in both UI and engine. The new section offers independent internal/external next improvements and a Lv1–50 plan selector with before/after images, required level, total cost, historical credit usage and both stat gains.

The runtime directly reuses the approved preview model and approved 100 WebP states. No approved mockup, cooking, appliance or food image was regenerated or edited. Scene rendering selects one complete background per area, plus the existing identical-source counter occlusion layer. Previous individual furniture overlays and whole-theme switching no longer run. Guests, rain, daylight and the existing location navigation remain. Preparation uses the same renovated architecture dimmed; during the short installation preview the approved lit image is shown, then the prior opening/preparation state resumes. A ResizeObserver keeps ceiling/floor joins aligned while the existing installation overview changes width.

The sweep and short completion chime are new effect names in the existing master-muted audio system. Cooking sound generation and recording mappings are unchanged. Sparkles respect reduced motion; the banner retains the existing washi material with readable dark stat text. A pending or active renovation is counted by `Scene.isPlacing()` so arrival/update routines do not interrupt it.

## Save and financial behavior

- Keep `midnight-diner-save-v11`, save version11, existing money, inventory, customers, payment state and partial cooking.
- Optional `renovation` stores version1, inside/outside stage0–50, corresponding historical credits, and any atmosphere amount needed to retain the old equipped score.
- For a pre-renovation save only, sum each area's historical item prices times quantity, install as many sequential improvements as that credit can fund at the earned level, and retain the remainder as area-specific credit. Do not increase/decrease current money. Keep item ownership/equipping records and their prior gameplay benefits. Reloading the migrated object never credits it again.
- A purchase carries its expected stage so stale clicks cannot buy a different stage. Images load before mutation; cash and credit apply once. Failed local saves roll back the entire synchronous transaction. Spending only records actual cash used in the existing active-night ledger.
- Atmosphere and environment come from completed area improvements. A fixed legacy atmosphere remainder preserves the old score while allowing every subsequent improvement to award its advertised increase.

## Fifty-level progression

Player levels extend to50 using the existing XP/reputation/satisfaction continuation. The 100 recipes retain their existing unlocks: three per level through33, one at34, none added35–50. Atmosphere targets now use65% of the combined atmosphere available through the previous level, with zero needed for Lv1/2, so renovation locks cannot create a circular level gate. Earned levels remain earned. Restore accepts Lv50 progress and regular-guest return levels through52. Future rewards list the two renovations instead of removed item rewards.

## Validation

- Unit tests cover the reachable Lv1→50 path, all100 sequential upgrades, stale/invalid/locked requests, both stat rewards, one-time migration/credit, existing fridge/collection benefits, and unchanged active cooking on restore.
- `tests/browser/renovation.cjs` exercises the actual game at393×852: real cash deduction, both background changes, level/credit display, sound counts, fresh reload, offline Lv50 purchases, guests restored, no duplicate decoration nodes, failed image loads, failed storage writes, master mute and reduced motion.
- Existing asset/cooking source hashes are compared against the pre-change commit. Pixel comparisons additionally cover the egg-pouring, rice-portioning and stove screens before/after this change.
- The PWA precache includes the100 approved state images and new runtime/model/CSS. Release hashes are regenerated after the last code edit; offline navigation and MP4 byte-range tests remain required.

No real-money checkout is introduced by this change. All costs use the existing game funds.
