# Night-window audit and five-dish correction

The user reported daylight still visible during pork preparation and requested a full review. The existing cooking-image approval gate remains exactly `onigiri`, `tamago`, `tonjiru`, `ochazuke`, `negi_omelette`; this work does not expand image production to the other 95 recipes. Existing v22 night cabbage/scallion correction, including its narrow hiyayakko exception, is retained.

## Full visual audit

Reviewed the 22 `prep-hi-*`, seven `measure-*`, ten `core-*`, 46 `heat-hi-*`, three `heat-burnt-*`, 25 `plating-*` atlases and the two v22 night-prep variants: **115 existing cooking sheets**. Contact sheets and enlarged window strips were used; suspect pilot sources were also opened at full resolution before editing. Existing ingredient/menu/used-vessel transparent catalogue pictures have no exterior scenery and need no time-of-day edits.

Evidence is under `/workspace/work/midnight-diner/v24/`: `prep-audit.jpg`, `pilot-window-audit.jpg`, `remaining-window-audit.jpg`, `heat-plating-audit-0.jpg` through `-3.jpg`.

### Corrected within the five-dish pilot

Fifteen independent night variants were generated, leaving all original source files intact. Five preparation sheets contain obvious daytime foliage, sky, or sharp sunlight on the counter: rice, nori, egg, pork and salmon. Core lid/pour also contain direct sunlit foliage and shadow. Core beat/broth/wrap, dashi measuring and heat sheets 2/3 have bright cream/white window light that clashes with the nighttime service; those windows now read unambiguously dark outside. The corresponding burnt heat sheets 2/3 receive matching night windows, preserving burnt states.

All square four-state sheets remain 1254 × 1254 (2 × 2). Heat sheets remain 1024 × 1536 (2 × 3). The exact state sequence, food type/quantity, utensils, necessary female hands, camera and panel layout were visually checked. Editing is limited to window time-of-day and its direct light/reflections; food stays clearly lit by warm indoor light. No code edits were made by this workstream.

For heat sheet 3 and burnt sheet 3, only the three LEFT-column scallion-omelette windows were edited; the right-column non-pilot pork dish retains its existing appearance. Even the copied sheets must be selected only for imagePilot recipes.

### Already night / no outdoor scene: unchanged

- `prep-night-v22-scallion`, `prep-night-v22-vegetables`: explicit dark blue night windows; retained.
- `core-shape`, `core-portion`, `core-portion-v19`: dark exterior/actual warm fixture reflections; retained.
- `heat-hi-1`, `heat-burnt-1`: dark outdoor windows and sparse amber points; retained.
- `measure-miso-v23`, `measure-miso`, `measure-soy`: wooden work surface / no visible exterior; retained.
- `plating-1`–`plating-25`: overhead plating counter, warm interior fixture/frame detail, no clearly sunlit outdoor foliage/sky; no new plating art generated for the night pass. Separate bad-dish state work is owned by another workstream.

### Remaining sources outside approved generation scope

All 17 other `prep-hi-*` sheets retain daytime foliage or daylight window/shadow cues in their original source: beef, butter, cheese, chicken, clam, crab, fish, mushroom, noodles, oyster, potato, scallion, scallops, shrimp, tofu, tuna and vegetables. Pilot vegetables/scallion already route to their v22 night variants; this pass leaves non-pilot routing unchanged.

`core-drain`, legacy `core-wrap`, and `measure-flour`/`measure-milk`/`measure-sugar` retain bright backlit window details (daylight is explicit in drain's grid shadows; the measuring sheets have no clear outside sky and may also be interior-lit shoji). They are not used by the five pilot dishes and were not regenerated. Heat sheets 4–46 retain predominantly bright warm lattice/shoji/window strips; their tiny background strips do not always distinguish lamp-lit paper from daylight. They are flagged for future night consistency review if the user approves catalogue expansion. No image generation or new variants were created for these other dishes.

## Source mapping and encoding

Machine-readable mapping, original PNGs, cell geometry and sizes: `/workspace/work/midnight-diner/v24/night-asset-mapping.json`. Generated PNG originals are retained under `/workspace/generated_images/`. New outputs are separate `docs/assets/*night-v24*.webp` files encoded using Pillow quality 94, method 6 without resizing or visual manipulation. All visual edits were made with image_gen using the corresponding original local asset as reference.

Routing belongs to the root integration: original stem → replacement stem, only while `imagePilot.includes(recipe)`. Add all new variants to the offline cache. Do not replace the global original sources or alter the existing hiyayakko exception. New files and mapping have been supplied; root verifies actual playable screens, cache/offline and routing tests.

Visual result contact sheets: `night-batch1.jpg`, `night-batch2.jpg`, `night-batch34.jpg` in the same v24 work directory.
