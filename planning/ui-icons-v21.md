# Physical object icons and pilot notification

## Original art

`docs/assets/ui-objects-v21.webp` is an original image_gen transparent atlas, 1774 × 887 pixels: exactly four columns and two rows of square 443.5-pixel cells. No object aspect ratio is stretched. Source PNG retained at `/workspace/generated_images/exec-e940df3d-6165-476a-b066-3af7160ec9a4.png`. Encoded to transparent WebP at quality 92, method 6; no pixels were redrawn, recolored, removed or resampled by code.

The consistent warm lighting and cream/walnut/brass materials depict actual small objects rather than UI glyphs:

| Cell | Object | Use |
|---|---|---|
| 1,1 | Aged cream two-door refrigerator | Pantry dock icon |
| 2,1 | Clothbound menu notebook with paper edges | Menu dock icon |
| 3,1 | Amber hanging paper lantern | Shop/decor dock icon |
| 4,1 | Letter/envelope and fountain pen | Story dock icon |
| 1,2 | Antique brass key with wooden tag | Settings |
| 2,2 | Lit amber glass pilot lamp in a brass rim | Story notification |
| 3,2 | Vintage walnut radio | Reserved, currently unused |
| 4,2 | Crescent brass charm | Night HUD |

The raw transparent atlas viewer exaggerates nearly transparent red/yellow RGB values around some object silhouettes (sample alpha 1/255). Actual Chromium composites over cream paper and walnut were inspected at both mobile widths and have no visible colored fringe. Original object shadows remain natural.

## Integration and behavior

Load `docs/physical-icons.css` last, after `tactile-controls.css` and `frames.css`, and cache it and the atlas with the release. It replaces only the dock's decorative span glyphs, the settings glyph via `::before`, the moon decoration and the notification dot. Existing button labels/ARIA names, dimensions, handlers, wood frames and paper surfaces remain. Glyph text is visually hidden with `font-size: 0`; the actual semantic button names still come from the existing `aria-label` and visible labels.

The story badge is now a 20–21px real amber pilot lamp with a gentle warm glow. `prefers-reduced-motion` makes the glow steady. Payment values and other important customer state remain unchanged. No JavaScript or markup modifications are required.

## Verification

Chromium at 393 × 852 and 320 × 852, with service workers blocked and CSS injected after the integrated controls: all four dock controls retain accessible names, minimum 44px targets, square icon geometry and no viewport/content overflow. The settings object opens the settings dialog; reduced motion disables the pilot pulse. No JavaScript errors. Actual full-screen composites inspected for atlas-edge artifacts and legibility.

Evidence:

- `/workspace/work/midnight-diner/v21/physical-icons-393.png`
- `/workspace/work/midnight-diner/v21/physical-icons-320.png`
- `/workspace/work/midnight-diner/v21/physical-icons-check.cjs`

No food, cooking process, portrait, scene artwork or approved intro was modified.
