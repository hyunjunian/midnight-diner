# Material foley and restaurant soundscape

## Source and method

All sounds in `docs/audio.js` are original procedural foley, generated locally from filtered random excitation and short damped material resonances. No third-party recordings were downloaded. A brief attempt to obtain a CC0 Kenney impact pack failed at the network boundary; no pack content is present and no third-party licensing is claimed.

The old shared watery-pour model and musical feedback tones were replaced. Thin water/dashi/soy pours have fine turbulent splash events; egg batter uses a slower, low-frequency viscous body with sparse soft folds; oil is a restrained thin stream. Miso uses low sticky scoop/friction events rather than a liquid gurgle. Whisking has irregular bowl contact and wet agitation; rice, nori, cutting, simmering, sizzling, drawer and ceramic placement each have independent models. There are no frequency sweeps or musical UI oscillator melodies. Small fixed resonances represent wood/ceramic/metal only.

`flowKind` and `actionKind` are shared routing functions. Egg-pour routing reads the actual cooking step title/art; dashi/broth remains thin liquid. The kitchen oil hook uses `oil-pour`. The public `MidnightAudio` API preserves the existing methods and persistent `midnight-diner-sfx` master preference. New `ambientEnabled`/`setAmbientEnabled` use `midnight-diner-ambient` separately.

## Soundscape behavior

`docs/soundscape.js` observes existing scene/customer lifecycle nodes. It starts only after a user gesture, outside the intro, while the app is visible. Rain and quiet room tone work before any diner is present; rain is louder outdoors and softened indoors/in the kitchen. Occasional traffic is quiet indoors. No voices are synthesized by the soundscape.

Arrivals play one wooden sliding door and three softly panned footsteps, globally throttled for group arrivals. A dining guest gets its first subtle bowl/utensil/eating cue 2–3.5 seconds into the short meal and subsequent cues after 4.5–8.5 seconds, with a global 3.2-second detail throttle. Eating represents restrained scoop/bowl texture, avoiding conspicuous lip/slurp sounds. Scene switches and speaking duck the mix. Settings/reset, hidden pages, intro replay and mute stop the ambience including active ambient transients. `stopCooking` only stops tactile cooking loops, preserving room/rain.

The mutation observer filters for app/scene flags, dialog open/hidden state, direct customer additions and customer dining/arrival flags. It ignores actor/morph classes and unrelated DOM updates; the baseline update interval is 700 ms.

## Verification and listening limitation

`node --test tests/audio.test.cjs` checks material routing, finite/clamped sample data, deterministic rendering, thin-liquid versus viscous-batter spectral roughness, and irregular loop content. Live Chromium checks cover gesture gating, no-diner ambience, nonzero output, actual egg-batter and boil loops, cooking/ambient separation, both mute preferences, settings pause/resume, live arrival door/steps, page hiding and JavaScript errors.

A 33.50-second WAV sampler was rendered through Chromium's OfflineAudioContext with the same 0.55 master gain and compressor as gameplay. Peak 0.15650, RMS 0.01398, 22,050 Hz mono PCM16, no clipping. The ordered cue list identifies all 20 examples. Artifacts:

- `/workspace/work/midnight-diner/v21/audio-material-sampler.wav`
- `/workspace/work/midnight-diner/v21/audio-material-cues.json`
- `/workspace/work/midnight-diner/v21/audio-sampler.cjs`
- `/workspace/work/midnight-diner/v21/audio-browser.cjs`

Subjective listening was not possible: no listening tool was available, and the audio-emission environment explicitly returned that audio input is unsupported. These are rendered and technically verified sounds, not a claimed human/perceptual audition. The sampler is available for the user to hear and assess. No original intro/video soundtrack or story speech voice is altered.
