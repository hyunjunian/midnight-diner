# Deliver the approved art despite an old installed worker

The user still saw the old, broken pour photo after closing and reopening the normal URL. A successful Pages job did not prove that an existing client displayed the approved image. Older workers can serve the same image URL from their previous cache while an active cooking session defers application replacement.

This repair changes delivery only. The five original approved image bytes remain unchanged. Exact copies have never-before-used `-approved-dc743754.webp` paths. Recipe source geometry continues to use its original logical names; only the rendered URL changes. The paddle and hand CSS uses the corresponding immutable copies. The new paths are precached in the atomic offline shell.

`approved.html` is the same complete game document as index.html, with one invisible inline history canonicalization. Its previously unused navigation path avoids an installed copy of the main entry, and its immutable image paths avoid the old image cache. It uses the same origin and saved progress. The release helper keeps both documents on the same version. No storage is erased, no worker is unregistered, no game artwork or UI is regenerated.

Validation reproduces an installed v49 worker with old image bytes, then deliberately blocks every new worker script response. Both tamago pouring and salmon rice portioning still render all five approved image hashes from the fresh entry. The old worker remains active throughout and money/inventory stay unchanged. Screenshots are captured from the actual rendered game. Unit checks freeze both original and immutable-copy SHA256 values and require the entry UI to match index exactly.
