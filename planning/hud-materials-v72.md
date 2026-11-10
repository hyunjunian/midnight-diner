# HUD materials and constant calendar sheet

The wallet now has two separate horizontal ledger lines, stacked vertically: funds and reputation. Each opens its existing detail dialog, retains a 44px touch target, and stays in the top HUD row. Full amounts remain visible; only the funds font scales down when required by the available width. Preparation scroll space follows the actual navigation bottom.

The clock uses generated ivory-enamel dial and transparent aged-brass hand images. Its hour/minute SVG groups still rotate independently from game time. Source PNGs remain in generated_images; integrated 512px WebP assets preserve alpha. Images were generated with OpenAI image generation for this game UI.

The calendar allocates a fixed 287px grid area and fixed heading/quote/footer slots. Four, five and six-week months distribute their rows within that area without changing the physical sheet height, preserving 44px minimum date targets.

Validation: wallet browser regression covers 56 amount/reputation/viewport combinations, exact detail values and no row reflow. Calendar regression covers 4/5/6 weeks at three widths and archived reports. Clock images and independent rotation were inspected in Chromium.

## v73: match the first-row frame heights

The user requested the two-line wallet frame match the unchanged date/clock frame height. Measure that frame on each layout pass and use the same border-box height for wallet and settings. The two wallet actions divide its internal height, superseding the previous 44px minimum per wallet row; use compact line-height and retain exact amounts, independent detail actions, side padding, and a single header row. Browser regression now requires equal top-frame heights and full values including1,000,000,000 at320px.
