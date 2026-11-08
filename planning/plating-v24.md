# v24 heat-state plating continuity

The five approved early recipes now use dedicated undercooked/overcooked plating scenes. Normal food retains the exact existing `plating-1`/`plating-2` source. The state is selected from the authoritative saved kitchen heat value, not inferred from total score or preparation quality. Serving and completion keep the previously approved corresponding `raw-menu-*`/`burnt-menu-*` images and original vessels.

## Six new original image_gen edits

- `docs/assets/plating-raw-v24.webp`: `/workspace/generated_images/exec-995e6166-321a-4b18-94b9-9e9dbfd1704b.png`
- `docs/assets/plating-burnt-v24.webp`: `/workspace/generated_images/exec-42eb8cc4-42b3-47a9-aad0-4d519979ad4d.png`
- `docs/assets/plating-negi-raw-v24.webp`: `/workspace/generated_images/exec-7661db21-7adc-4874-866e-68973feee889.png`
- `docs/assets/plating-negi-burnt-v24.webp`: `/workspace/generated_images/exec-213cc33f-cc69-4c70-972e-bbda863b3b25.png`

- `docs/assets/core-wrap-raw-v24.webp`: `/workspace/generated_images/exec-2a38b3b8-8410-45f3-92ed-25bb4e6774bd.png`
- `docs/assets/core-wrap-burnt-v24.webp`: `/workspace/generated_images/exec-bcca6d7b-b799-457c-b36c-48adf7dd093f.png`

The first two are2×2 atlases for onigiri,tamago,tonjiru,ochazuke, matching the existing serving-workbench geometry. The next two are single sharp scenes for negi_omelette, matching the top-left original plating-2 scene. image_gen was given the existing plating scenes and existing raw/burnt finished-dish art as references. The final two are four-action onigiri wrapping atlases with the same raw/scorched rice through every frame and a dark navy nighttime exterior. Only food condition changes; cookware, receiving vessels, tools and nighttime workbench retain their ordinary material appearance. No scene-wide scorching filter is applied. Post-heat filtered copies of healthy food have been removed entirely. The four plating images received a final local correction of top window openings to navy night while preserving interior lamp light, food and cookware. First condition-edit PNG sources remain in generated_images: exec-4e7e3c0e-9b1b-41db-9540-e61fbf67105e.png, exec-af557311-be06-4ce1-af25-0675d58bc912.png, exec-e9bdde06-2c00-4baf-b230-c5e69af47616.png, exec-73b4c737-2015-481f-935a-ff203f95a07c.png. PNGs are1254×1254; Pillow encoded WebP quality90/method6 without resizing, cropping or image compositing.

`MidnightCookingRules.platingArt` and `wrapArt` keeps every non-pilot recipe on its existing approved scene. Dry and burnt use the overcooked art, matching the existing finished-food policy. This does not expand the five-dish cooking-image approval boundary. The other95 recipes' appearance data and save/service lifecycle were audited, but no new imagery was generated or borrowed from another recipe.

## Validation

`tests/plating.test.cjs` audits all100 recipes in four heat states through post-heat steps, plating, completion, save/restore, serving, payment and another restore. All91 heated recipes preserve their exact heat value and appearance; all9 unheated dishes remain normal. All atlas positions and files resolve. Existing engine tests remain green.

Actual first-five browser drag/plating/completion/service screenshots and logs are in `/workspace/work/midnight-diner/v24-plating/`. The real UI's assembly frame uses the same saved heat outcome as completion and serving; there is no filtered duplicate of a healthy meal over the new plating artwork.
