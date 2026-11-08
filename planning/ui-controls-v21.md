# Tactile controls · v21

The control layer uses the existing photographed washi and walnut textures, after `analog.css` and `frames.css`. It changes controls only; no cooking art, gesture target, character, intro/install surface, game logic, save data or audio changes.

- Guest replies and story choices are separate loose paper slips: uneven cut edges, fine fiber texture, bent corner, slightly varied angles and an offset cast shadow. Story choice numbers look like vermilion ink stamps. Pressing a slip settles its shadow and lowers it toward the page.
- Opening the restaurant, accepting an order, advancing cooking and preparing the next night use thick walnut plaques. Grain, light upper bevel and dark lower edge make them read as physical wood. The pressed state compresses that lower edge.
- Smaller actions, folio close controls and dock entries are cut paper tabs. Active collection filters receive a red ink outline; shop actions use paper and ink instead of flat green fills.
- Quantity controls use wooden tally blocks around a paper count field. Numeric inputs stay 16px, touch targets stay at least 44px, and the narrow lamp controls retain their 44px buttons at 320px.
- Disabled actions have faded ink and subdued paper. Keyboard focus keeps a high contrast external ring. Body labels, costs and choice numbers remain in legible printed type; only the short opening action uses brush lettering.

No screws, tape, folds or decorative marks cover text. The complete rectangular control remains clickable even where its painted paper edge is uneven. Existing panel frames remain owned by `frames.css`.

Validation: `/workspace/work/midnight-diner/v21/tactile-check.cjs` covers actual 393px and 320px preparation, guest replies, story choices, shop, pantry quantities and the report action. It checks texture application, 44px touch targets, quantity geometry and absence of horizontal overflow. Screenshots are `tactile-{prep,guest,story,shop,pantry}-{393,320}.png` plus `tactile-report-393.png` in that directory.
