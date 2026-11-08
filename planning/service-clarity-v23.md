# v23 service, kitchen and story clarity

The ongoing wave/meal count is a compact11–12px printed paper tally, separate from the actual opening/closing button. The pending-story hint uses an explicit newline after “손님들의 이야기가 이어지고 있어요.” and wraps as two readable lines at320/393/430px.

All game interface type resolves to the existing local OFL Nanum Myeongjo Regular face. Story headers are21–23px and choice prompts20–21px. Native story speech, its script and listening/replay controls are removed at the user's request. The approved intro video and its original audio are unchanged.

Wooden nameplates and return/outside controls keep the material theme. The active appliance's label has a gold rim and restrained double pulse; the entire appliance has no outline. Decorative Unicode arrows and the redundant counter pan panel are removed; scene swipe and functional dotted cooking paths remain. The cooking-resume sign has a steady gold rim. Story attention uses a steady gold border only for pending choices/unread news, and read-news state persists. Resolved/read stories clear the indicator.

The fridge footer first displays the exact recipe's illustrated ingredients and their selected state, then compact44px restocking controls. Selection, quantities, money and ingredient gates retain existing engine rules.

## Miso repair

The old source/receiver return path and hold-meter could show1/1 while rejecting completion. Miso is now a single directed scoop from the left jar into the right bowl. Its guide, pointer-up coordinates, recognizer and rendered completion all use this same condition; a short intentional drag works without waiting. Reverse motion or a tap does not complete it. The enabled next action advances into the next actual recipe step.

`assets/measure-miso-v23.webp` is an image_gen edit of the existing measure-miso atlas. Original output: `/workspace/generated_images/exec-edac808d-f77a-43cb-b2bf-d16852ed60c0.png`. Four equal panels show an empty receiving bowl, one spoonful lifted from the jar, its transfer, and one portion in the bowl. No duplicate receiving spoon/portion. WebP quality94 with no resizing. Only the original five imagePilot recipes may show this new cooking art; other recipes retain prior images.

`assets/sfx/paste-v23.wav` derives from **slime_01.ogg**, **rubberduck**, **40 CC0 water / splash / slime SFX**. Original free effect page: https://opengameart.org/content/40-cc0-water-splash-slime-sfx . The author lists CC0 and notes that some slime effects were recorded from real slime. Retrieved from the independent public mirror https://github.com/lavenderdotpet/CC0-Public-Domain-Sounds/blob/main/40-cc0-water-splash-slime-sfx/slime_01.ogg . Uses a quiet0.473s wet/sticky effect, converted to mono44.1kHz PCM16 with90Hz high-pass,2300Hz low-pass,0.8 gain and short fades. Existing local liquid and boiling files remain from Freesound/OpenGameArt as recorded in quiet-service-v22.md. All files play locally/offline, with no ambient bed or story voice. Subjective listening is unsupported in this environment; source descriptions, waveform levels, decoding and actual gesture playback are checked rather than claiming a listening audition.

## Verification

80 model/gesture/PWA tests pass, including a short correct miso drag, rejected reverse/tap, completed-story attention and news-read persistence. Live Chromium at320/393px confirms the refrigerator cards/selection, bounded refill controls, nameplate-only emphasis, wood controls, no decorative arrows, and highlighted cooking resume. A short miso drag completes without holding and clicking Next reaches “다시 계량”. Story speech controls are absent, typography matches, and completing both choices turns off story attention. Separate320/393/430 checks confirm the small tally and exact two-line hint. Offline navigation, assets and MP4 ranges are checked after integration.
