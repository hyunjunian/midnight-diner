# Approved trial and growth structure

The user approved levels 1–2 as the free trial, a one-time operating pass for levels 3–50, ordinary renovations funded by earned ¥, and optional visual themes. They subsequently selected **payment provider undecided; implement the trial screens and growth benefits first**, and explicitly prohibited unrelated changes.

## Shipped now

- New games grow using the existing XP thresholds, capped at level 2. Reputation, satisfaction and atmosphere no longer block XP progression. Six existing recipes and the first two renovations in each area are available during the trial; all existing recipe/renovation schedules and prices remain unchanged.
- XP, money and improvements continue accumulating. When a trial player reaches the level-3 XP threshold, the next-night action in the completed nightly report opens the operating-pass sheet. Service and cooking are never interrupted. The player can dismiss the sheet or continue another free night at level 2 without resetting anything.
- Settings offers the same sheet. It describes one-time full play, a planned ₩7,900 price, earned-¥ renovations and optional future store themes. Checkout is visibly disabled as **결제 준비 중**. No purchase, premium balance, fake success action or theme sale exists.
- Atmosphere adds 0.2 percentage points of tip bonus per point, capped at +36%. It adds to retained legacy furnishing tip bonuses. Existing food quality, base prices, ingredients and collection timing are untouched. Meal bills snapshot the tip when served and are collected only once.
- Environment reduces the fixed nightly operating charge by 0.1% per point, capped at 18%. The discounted charge is rounded to whole ¥ and bounded by available funds. It is applied only when closing a completed night. Historical bills and archived expenses are not recalculated.
- Renovation stat cards show the actual live benefits; purchase cards show their before/after percentages. These additions do not alter approved scene previews, prices or installation effects.

## Save compatibility and payment boundary

The v11 key and save version remain unchanged. Optional `access` metadata marks trial saves. Pre-release saves already at level 3+ migrate to `existing-player`, retaining further play and earned levels. Saves below level 3 become trial saves. Unrecognized paid flags do not grant access. Reset preserves the access category while resetting the ordinary playthrough. Ongoing cooking, inventory, guest bills, old furnishing rights and funds remain intact.

`existing-player` is a compatibility marker in a local single-player save, **not proof of purchase or a secure payment entitlement**. No live payment credentials, checkout, account system or receipt verification is configured. Before enabling paid sales, add provider-backed purchase verification, durable ownership and restoration; do not accept a local `paid` flag or a checkout return URL as proof. New trial players currently cannot purchase levels 3–50. No new theme art has been generated or approved for sale.

## Validation

- 165 Node tests pass, including actual tip/expense settlement, trial limits, legacy progress/cooking migration, all 100 recipe sequences, approved art hashes, exact offline file digests, offline navigation and MP4 ranges.
- `tests/browser/trial-growth.cjs` checks actual report → pass → free replay, disabled checkout, saved funds/XP and reload, real renovation purchase and displayed benefits, existing active cooking, paused pass-sheet gameplay and 320/393/430/1280 layouts.
- No cooking artwork, kitchen code/styles, gestures, approved room/exterior images, normal button materials or prior HUD sizing files are changed.
