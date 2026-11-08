# v25 location navigation

The former standalone outside button is replaced by one three-button walnut rail: counter,kitchen,outside. The same navigation node moves below the main HUD or directly after the kitchen header, so only one copy exists. The active location has a restrained gold edge and aria-pressed. All three targets remain at least44px. The old area-toggle ID belongs to the explicit outside tab; the old kitchen-back/resume controls remain compatible but are hidden to avoid duplicate directions.

`MidnightScene.navigate(location)` coordinates location changes and the existing Scene.showArea API. Main-screen positioning measures the actual progress/night/wallet/settings rectangles, then places the rail at least8px below their lowest edge, with a130px minimum. ResizeObserver handles wrapped growth labels, font sizing and responsive changes. Short landscape screens keep the main rail to the left of the growth HUD. Keyboard focus survives moving the navigation node.

`MidnightKitchen.open()` also opens an idle first-person kitchen when there is no accepted order. Its real room background and appliance hotspots remain available; refrigerator access opens the normal pantry for advance restocking. Other appliances explain their use inline. Browsing does not create a recipe or change inventory/funds.

A suspended active kitchen retains its engine object, step identity and in-memory local action data. Returning restores the same room/fridge/process view, partial rice portions, cut slots, measurement state, refrigerator doors/refill quantity, heat and burner power. Leaving stops audio and transient pointer input; existing hidden-kitchen heating pauses. Only a genuinely new kitchen object or a different step initializes fresh local action data. No engine service/progression code is changed.

Outside viewing hides the preparation card and counter-only service hint so the facade is visible; the counter restores them. The opening/night workflow, furnishings, intro and food art are unchanged.

## Validation

Actual Chromium at320,393,430×852 and852×393: one visible rail, all44px targets, no nav overlap with kitchen header or main HUD, no horizontal overflow; idle kitchen/pantry→outside→counter spends nothing. Active fridge selection/open door/refill quantity, one rice scoop, one of three cuts and a70% burner with23% heat all survived outside→counter→kitchen with exact selected ingredients, steps, inventory and money preserved. The wrapped Lv2 growth1359/1500 case measured progress-bottom129.84 and nav-top138; a narrow multiline stress measured169.53 and178. Separate HUD/settings/navigation rectangles did not intersect. No browser errors.

Screenshots,harnesses and logs: `/workspace/work/midnight-diner/v25-nav/`. The existing85 Node tests passed. Load/cache `location-nav-v25.css` after polish.css; no new image assets or script files are required.
