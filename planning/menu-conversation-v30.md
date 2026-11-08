# Menu notifications and compact conversation

All changes ship to the existing main Pages address, without a version-specific public URL. Internal cache identifiers still change so installed clients can detect the release.

- The story unread badge is a 12px red circle with a cream border. Only the dot glows between red and bright coral; reduced motion keeps a static glow. Its existing unread/unfinished decision rules remain intact. The button's accessible label announces unread attention.
- Guest replies, including optional replies, use dark green stained wood and light text instead of paper-on-paper. The guest folio keeps its paper texture. Removed the header tagline and temporary-leave button; reduced top spacing and retained 44px minimum targets.
- A complete outside tap dismisses the guest dialog. A drag starting inside the panel does not dismiss it. Reopening and reloading preserve the conversation; Escape still works.
- Keyboard focus no longer adds a ring. Keyboard behavior and selected-state borders remain.
- No changes to the v11 save schema, intro, music, cooking imagery, or update activation policy.

Validation: 88 Node tests pass. Playwright checked 320/393/430px layouts, actual reply progression, inside clicks, outside dismissal, inside-to-outside drags, reopen/reload persistence, Escape and keyboard focus styling. Badge checks covered glow keyframes, reduced motion, accessible labels and clearing after reading. Offline browser verification covered saved cooking, all 281 cached WebP assets, offline navigation, MP4/MP3 range responses and the music license file.
