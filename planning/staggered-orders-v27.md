# v27 staggered orders and full workspace

Each three-guest wave starts with the first arrival ready to order. The second selects for8s, the third15s, measured from each own arrival in the saved active night clock. Menu selection has no gold border/heartbeat. Ready labels and cues update at the actual deadline without rerendering the whole application. Background/offline time does not advance the clock, and reload retains the deadline. A direct conversation choice settling an order can finish selection early. Older saves with no deadline remain ready; invalid optional values are sanitized without a reset.

The preparation ingredient queue and non-heat replay button are removed. Portrait preparation/portioning/shaping/wrapping/plating now use one native-square cover photograph across the entire available work area, with compact readable overlay captions and bottom counters. The foreground image and recognizer share the same geometry. Wrapping shifts focus sufficiently to retain its left starting circle. Stove composition and its physical knob are retained.

All100 recipe plans omit the lid action. Rice dishes go from ingredient preparation to portioning. sequenceVersion2 identifies the new plan. Existing v11 kitchens before/at/after the deleted lid and already-complete plates migrate by removing the lid mark only when completed and shifting later indices once. Other marks, stage, heatValue, selection, inventory and money are preserved. Legacy plans remain accessible only to migration.

## Rice picture

`core-portion-v27.webp` is an imagegen edit of the existing core-portion-v19.webp: `/workspace/generated_images/exec-5de5b239-f28d-41d4-b05e-833bc5cf72c9.png`, encoded WebP quality94. The four original square frames, same cooker/bowl/paddle/hand placement and0/1/2/3 scoop progression are preserved. Rice grains are irregular elongated translucent grains instead of radial flower-like clusters. It routes through the existing five-dish image gate; only pilot recipes consuming rice currently use it. Other cooking artwork was not expanded.

## Sound

The completion cue restores the first1.25s original four-note synthesis introduced in commit3e2a597. The later wind-chime sample is not loaded or played. Intro audio is unchanged.

Gameplay recordings and synthesis share active50ms-window balancing (85th-percentile non-silent window, target RMS0.085), with smooth peak limiting above0.4, bounded below0.65. This preserves timing/envelopes and raises quiet cash rather than only turning cooking down. Recorded materials measured active RMS0.0808–0.085 after balancing; actual isolated Chromium analyser maxima for cash/rice-scoop/complete were approximately0.036/0.041/0.042 in the final run. Loops share the same reference gain, retaining physical power/gesture scaling. Muting and background silence remain intact. Routing/decoding/waveform/output metrics were tested; the environment does not provide subjective direct listening.

## Burner references and implementation

Image search examined gas flames beneath pans, followed by the [Blomberg manufacturer hob guide](https://www.blomberg.co.uk/support/buying-guides/built-in-hobs), especially its upward-facing burner photograph/explanation. The [Nadia heat-level guide](https://oceans-nadia.com/cooking_basics/411) was another search reference. External reference photographs are not embedded in the game.

The front flame row is replaced by two small groups at the lower lateral gaps underneath cookware. Each pilot shape has its own vessel geometry; an SVG occlusion mask hides the pot/pan interior and handle. The exposed blue tips gently breathe with power. There are no high-wall flames, center/front stripe, or flames after OFF. Reduced motion remains static.

## Verification

88 Node tests pass, including deadline/save behavior, all-menu lid removal, old active/completed save migration and balanced audio peaks. Actual Chromium320/393/430px: first/second/third ready transitions and gold cues, reload continuity, no queue/replay, native-ratio full-bleed coverage, all3 actual rice scoops and wrapping. All five pilot vessels were checked with real knob input and immediate OFF. Actual wrapping→plating→one original completion cue, isolated cash/cooking volume and mute passed. Offline reload,215 cached WebP assets, fonts, saved v11 gesture and MP4 byte-range206 passed. Source fixtures, screenshots and logs are outside the repository in `/workspace/work/midnight-diner/v27`.
