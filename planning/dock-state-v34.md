# Dock selection follows the open panel

The management renderer previously marked its last-used section active even when the management dialog was closed. Story attention also added a gold whole-button border that looked like selection. Both could appear at once on the counter.

`syncDockState()` now derives each dock button's active/expanded state from its actual matching open dialog. Management section memory is preserved without drawing selection on a closed panel. Open/close handlers and an `open`-attribute observer keep native Escape, programmatic closes and dialog switches synchronized. These are dialog-opening actions, so the buttons expose `aria-expanded`, `aria-controls` and `aria-haspopup="dialog"` rather than `aria-pressed`.

Unread news and unfinished decisions retain the requested glowing red dot. The whole-button story-attention border is removed. Neutral buttons no longer have an inset lower stripe; the currently open panel alone gets a subtle brown lower selection line. Paper/wood materials and badge gating are preserved.

Validation: 103 Node tests pass. `node tests/browser/dock.cjs` checks opening/closing all three management sections, Escape, switching to Settings, refresh, startup with no selection, unread/unfinished story attention, reading news and independent story-panel selection at 320/393/430px. No recipe photo or cooking artwork was changed.
