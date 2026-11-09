# Real-date calendar

The game starts on September 1, 2026. The existing persisted night index stays unchanged; `game-date.js` maps it to a Gregorian date using UTC arithmetic, so existing funds, inventory, story choices, planned consequences and historical report IDs survive without migration or reset. A new service day advances one date; midnight during the same service does not advance the business date.

HUD month, day tens and day ones are three independent paper leaves, each on one aged brass loop. Existing 23px date digits and 36/40/48px responsive clock sizes remain; walnut panel padding is reduced to 2px vertically and 6px horizontally. Date month changes naturally and only changed leaves flip, respecting reduced motion. The expanded calendar uses real month lengths, weekday offsets and year/leap rollovers. Report and story-journal date stamps use the same mapping. Funds/reputation appearance is unchanged.

Validation: pure date tests cover valid mapping, roundtrips, month/year/leap transitions and invalid inputs; browser checks cover five viewport sizes, exact content sizes, three leaves, date activation, actual Sep30→Oct1 engine progression, month navigation and existing story/report/follow-up mappings. Main and approved entry remain identical except the approved entry's canonical URL script; immutable approved cooking artwork is untouched.
