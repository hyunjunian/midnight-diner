# Approved stove and workbench — v28

## Approved scope

The user explicitly limited this delivery to catalogue levels1–5 (15 recipes), then approved the full-width parallel-sided steel stove, one centered pan/burner and one centered physical knob. Workbench backgrounds are the approved continuous wooden cutting board, without room scenery or a utensil holder. Level6–34 recipes retain their previous cooking art; the shared routing is gated by the recipe, not the player's current level. Existing v11 saves, sequenceVersion2, stock, purchases, money, quality and service timing are preserved.

## Artwork

Images were edited with the image generation tool using the approved game sources and approved stove/workbench prototypes. The separate rotating grip remains `gas-knob-v24.webp`; the generated scene has only its fixed collar/socket, preventing a second painted knob. Source atlas geometry is native2:3 for workbench cells and approximately9:16 for stove cells; guides and input share the same coordinate transform. An 8px footer clearance keeps the live knob reachable on short phones. No gas flame artwork or overlay is rendered.

Rice shaping was rebuilt against the user's supplied real cooked-rice photograph. Portioning, shaping, wrapping, rice-bearing heating/plating and completion sprites were reviewed for ordinary overlapping elongated grains. Shaping finishes with plain white rice; the later wrapping step applies a narrow vertical nori strip. Butadon uses matching oval pork slices during cooking and on the finished bowl. Washing noodles has no invisible-source falling water. Food-state artwork carries raw/good/scorched food through plating, completion and service; cookware is unchanged.

Generated source provenance is recorded in `approved-assets-v28.json`. WebP encoding uses Pillow; analysis contact sheets do not modify game art. Experimental unused sources remain outside the checkout and are not shipped. Approved intro video/audio and customer art are unchanged.

## Original music

`music-cozy-v28.mp3` is an original112.94s,68BPM instrumental synthesized by `generate-bgm-v28.py` from newly generated harmonics/envelopes: quiet nylon-like plucks and felt-keyboard-like chords, no sampled commercial recording, voice or ambient scheduler. NumPy/SciPy synthesize and filter the signal; ffmpeg/libmp3lame encode it. Peak0.34, RMS0.07017, loop-boundary difference0.001707. Default25% setting maps to0.1 media volume beneath effects. This is an original generated composition; no third-party song is reproduced. Previous effect recording provenance remains in v22–v27 records.

`music.js` persists independent on/off and volume preferences. Trusted input unlocks playback; intro, hidden page and pagehide pause it. FX mute does not mute music. Settings remain small washi controls. Rain/room/traffic/speech ambience is still removed.

## Interface and delivery

Story candle becomes a small steady warm circular light using the existing unread/unfinished gate. Dock icon/text geometry is equal across all four items. Report figures/headings and level badges are smaller; 레벨 is centered above the number. Decorative four-point stars and bulk-restock success toast are removed. The service tally/story hint is raised to the requested area near71.5% of tall portrait screens, below guest plaques and well above the dock. All extra action-replay/practice buttons above Next are removed; the real dial, stop/flip controls and gesture guides remain.

## Validation

-88 model/gesture/audio/appearance/service-worker tests pass.
-320/393/430px browser checks cover full-bleed native work art, actual egg-crack input, no helper/flame elements, heat/stop, dock alignment, compact reports, centered Korean levels, circular story indicator and restock without toast.
-Real pointer gestures cover washing, cracking, three distinct cuts, paste, held measuring, three rice scoops, shaping, wrapping, beating, pouring, broth, draining and plating.
-All14 heated early recipes exercise their single centered working knob, burnt scene, exact saved heat and matching post-heat appearance. Short-phone knob/footer clearance is checked.
-430×1040 and996×2048 service-note placement checks use the requested higher position.
-BGM checks cover quiet playback,112s loop wrap, independent FX toggle, on/off and volume persistence, intro pause/resume and no errors. Subjective listening is not claimed; this environment has no audio input for direct listening verification.
-Offline reload retains v11 cooking and valid pointer input; all281 precached WebP files fetch, fonts/effects are local and video plus MP3 byte-range responses are206.

Release is published from docs on origin/main, with a new atomic worker version and preview release tag. Exact commit/Pages status is checked after push.
