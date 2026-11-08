# Preparation layout and licensed music — v29

## Changes

- Non-heating step labels move down into the quiet board area (32–50 CSS px below the work area top, depending on height). The stage/step and action title remain; all long process-heading instruction paragraphs are removed across cooking screens, including the “준비된 칼로…” text. Gesture paths, counters, measuring targets and concise invalid-action feedback remain.
- The approved Lv.1–5 egg-pouring atlas is edited so the pan rests directly on the same wooden board. No portable stove, grate or platform remains. Broth and draining scenes were inspected and already have board-only backgrounds. These three preparation steps now use the workbench station label/hotspot; step IDs/counts and saved progress are unchanged. Actual heating keeps the approved stove.
- Portrait night/time and progress frames start at the same safe-area-adjusted left edge. Short landscape layout retains its separate columns to avoid navigation overlap.
- The portrait-source detector recognizes versioned portrait names, including v29, so new art uses the same guide/input coordinate transform.

## Music and license

BGM is now **Minamo — PeriTune (Sei Mutsuki / むつき醒)**, an existing free-use Japanese-style ambient piano/koto/string track,85 BPM, originally published June12,2016. It replaces the v28 synthesized recording. The official description identifies it as gentle, calm and relaxing.

Official track page: https://peritune.com/blog/2016/06/12/minamo/

Official license statement: https://peritune.com/about/ — tracks published before March2026 remain under **CC BY4.0**. License: https://creativecommons.org/licenses/by/4.0/

The MP3 copy was obtained from the public pinned mirror, whose audio provenance identifies PeriTune's Konohana collection:
https://github.com/evgenyvinnik/tensho-web/blob/1d50c09f82ba2d733edb3a1c43f1ebf1528a9b86/public/assets/music/Minamo.mp3

Source SHA-256: `ca2d9e94e800b15101cfc47a79e3adef273b0141bd1057660d810933bcbd807a`.

The mirror describes a prior MP3/RMS conversion. We further normalized loudness to **−23.00 LUFS**, encoded MP3, and kept the full approximately194.2-second recording. Measured true peak is−10.82 dBTP and loudness range4.50 LU; no melody, tempo or pitch edit was made. Output SHA-256: `4dfbbb4451a3af95def3e83feb63fef910ab6b69c86527f765126d27d277fae7`.

Settings displays title/author, official source, CC BY4.0 and the changes made. The offline license/attribution record is `docs/assets/music-Minamo-LICENSE.txt`. Existing enabled/volume preferences and intro/hidden-page pause remain unchanged. Selection is supported by official musical description and technical playback/loudness checks; direct subjective listening in this environment is not claimed.

## Verification

-88 rule/gesture/audio/appearance/service-worker tests pass.
-320/393/430px browser checks cover seven preparation modes, lower labels, no instruction paragraphs, the workbench station, the new no-stove pouring source, its portrait guide transform and actual successful pouring. HUD left edges match within0.5 CSS px.
-Real browser music playback verifies the new194-second source, loop wrap, volume/on/off persistence, independent effect mute, intro pause/resume, correct in-game credits and no errors.
-Offline reload preserves v11 cooking/input, fetches all281 cached WebP assets and the license text, and returns206 for MP4 and the new MP3 ranges.

## Image provenance

The pouring edit used the image generation tool with the v28 atlas as its sole visual reference, preserving all four jug/pan/egg-fill states, exact action layout and native2:3 cell geometry.
Generated source: /workspace/generated_images/exec-fb0d8944-bc7c-4089-8c8c-1d589a3d9991.png
Output: `docs/assets/portrait-v29-core-pour.webp` (Pillow WebP encoding quality94). Other cooking artwork and the level1–5 rollout boundary are unchanged.
