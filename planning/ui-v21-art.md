# v21 analog interface materials

The interface uses quiet cream washi surfaces, walnut rails, ink colored text, and Korean brush lettering for short headings. Numeric values, ingredient names, item descriptions, and touch controls retain readable printed typography. The food, furnishing, scene, and portrait images are not filtered or replaced by this stylesheet. The approved opening video is outside its scope.

## New assets

- `docs/assets/ui-washi-v21.webp`: generated full-frame ivory washi texture, 1254 × 1254. Revised original: `/workspace/generated_images/exec-c7214dbd-59ad-4c11-bd91-0a8d066f375a.png`.
- `docs/assets/ui-walnut-v21.webp`: generated full-frame warm dark walnut, 1254 × 1254. Original: `/workspace/generated_images/exec-78a75e3a-8d07-486d-97bd-df38c6ad2746.png`.

Both were created with image_gen specifically for this game, with even illumination, no text or objects, and restrained grain/fibers so UI text remains legible. The PNG originals were encoded to WebP using Pillow quality 88 (walnut) / 90 (revised washi), method 6; visual content was not edited or resampled. Combined WebP size is approximately 447 KB.

`docs/analog.css` defines DinerBrush using the official Nanum Brush Script font installed separately by the root agent at `docs/assets/fonts/nanum-brush-script.woff2`. Its OFL license is stored alongside it. Short headings use the brush face, while small text/data use existing readable body fonts. The font has a serif fallback and `font-display: swap`.

## Integration

Load `analog.css` after `style.css`, `kitchen.css`, `customer.css` and `motion.css`. Cache the stylesheet, both WebP textures, and the font in the service worker's release asset list. All texture references are relative local paths and work offline. Existing selectors and event handlers are preserved.

## Validation

Chromium with service workers blocked, stylesheet injected after component styles: initial preparation and all 60 furnishing cards checked at 320, 393 and 430 CSS pixels. Shop content has no horizontal overflow; level and atmosphere badges remain at 11–12 pixels. Final root integration also covers customer geometry, report/story readability and component precedence. A separate furnishing quantity control had an existing 43-pixel minimum; this stylesheet raises it to 44 pixels.

Evidence screenshots and the temporary browser harness are under `/workspace/work/midnight-diner/v21/analog-*`. No cooking art or later-recipe assets were generated or changed.


## Tactile paper follow-up

After the user reviewed the initial interface and requested real paper texture, the washi image was edited using image_gen. The revision adds long mulberry fibers, felted pulp, shallow broad creases/depressions and small relief shadows under soft upper-left illumination. The center stays quiet enough for text. `--ui-paper` now has a 10% cream wash instead of the previous 32%, so the texture is actually visible. Conversation speech and choices now reference the texture explicitly at matching component specificity.

Card/speech edges use different light/shadow values on each side instead of a uniform drawn line, plus shallow inset shadows suggesting paper thickness. Outer wooden frames are owned by the separate `frames.css` layer, loaded after `analog.css`. No decorative frame/image is applied to food, people, scene art or the opening video.

Integrated Chromium checks (actual linked styles, not an isolated mockup): 393px shop panel and customer dialog show the fibers and creases, and 320px customer dialog has no horizontal overflow or text clipping. The computed backgrounds for both `.talk-card` and `.talk-speech` include the washi file. Evidence: `/workspace/work/midnight-diner/v21/paper-material-shop393.png`, `paper-material-dialog393.png`, `paper-material-dialog320.png`; harness `paper-check.cjs`. No JavaScript errors.
