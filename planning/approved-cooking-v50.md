# Approved cooking repairs — v50

The user approved the final preview with “이렇게해.” The exact approved screenshots are immutable at:
https://raw.githubusercontent.com/hyunjunian/midnight-diner/dc743754a1ee2f27b2bc0cbcbe98e86653b11155/cooking-preview.png

Final scope:
- Freeze the repaired receiving bowl and cooker atlas; remove the old bowl rim from the cooker layer. The user explicitly approved this bowl and prohibited further edits.
- Enlarge the rice paddle and keep its enlarged head continuous with the held shaft. Render it in an extended source layer, with the same held right hand and a wider floral sleeve. Switch only the paddle scoop state while dragging.
- Accept rice deposits throughout the actual bowl ellipse, including its left, right, top and lower areas, retaining source pickup and the three-scoop requirement. Use the release position on pointerup.
- Use the unchanged stove tamago pan body and metal fitting in the pouring scene. Keep the separately requested longer pouring-scene wood grip and the final approved slender right-hand pose. The stove source photos themselves remain unchanged.
- Narrowly repair the previously pictured tamago, ochazuke and negi_omelette stove masks so their original handles are complete and excess native steel does not create a second surround. No other recipe masks changed.

No title, caption, background image, navigation, completed dish, inventory, saved progress or unrelated photo asset is changed. The cooker/bowl atlas stayed SHA256 0dd49c2a4bddb5e51719aead75bd6d0b24aa3e531e30970275269f9cfe950aa5 after bowl approval. Runtime cooking images are frozen for final release checks; validation must not regenerate them.

New grip work used existing owner/garment references and image_gen outputs exec-427de2ee-d3be-44d1-a27a-c2ef3257df0a and exec-a0726394-92e8-487a-8331-f1e07ca93845; only the requested grip region was applied, with the existing wider sleeve restored. Pan outline/neck/wood texture derives from the existing stove-v28-tamago source. Paddle changes reuse the intact earlier rice/paddle art, with a continuous neck transition and extra source margins.

Final validation: all 126 unit tests passed; six scoped cooking scenes passed at 320×568, 393×852, 430×932 and 852×393; glass/rice browser checks passed with real mouse/touch transfers and extended sleeves at three mobile widths; offline cold-open, media byte ranges and background-worker upgrades preserved partial scoops and progress. The test's intentional offline network failures were expected. The approved image hashes were checked unchanged after all tests.
