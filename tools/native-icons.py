#!/usr/bin/env python3
"""Regenerate the iOS/Android launcher icons and splash images from the game's
existing icon artwork: python3 tools/native-icons.py  (needs Pillow).
The 512px PWA icon is the largest original, so the 1024px store icon is a Lanczos upscale."""
import glob, os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
icon = Image.open(os.path.join(ROOT, 'docs/assets/icon-diner-v31-512.png')).convert('RGB')
padded = Image.open(os.path.join(ROOT, 'docs/assets/icon-diner-v31-maskable-512.png')).convert('RGB')
BG = padded.getpixel((4, 4))  # the dark surround already used by the maskable web icon
HEX = '#%02X%02X%02X' % BG

def fit(image, size): return image.resize((size, size), Image.LANCZOS)
def masked(image, radius):
    size = image.size[0]; mask = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size * 4 - 1, size * 4 - 1), radius * 4, fill=255)
    out = image.convert('RGBA'); out.putalpha(mask.resize((size, size), Image.LANCZOS)); return out
def centred(width, height, art_size, rounding=0.2):
    canvas = Image.new('RGB', (width, height), BG); art = masked(fit(icon, art_size), art_size * rounding)
    canvas.paste(art, ((width - art_size) // 2, (height - art_size) // 2), art); return canvas

# iOS: one opaque 1024px icon, and the square launch image shown under the storyboard.
ios = os.path.join(ROOT, 'ios/App/App/Assets.xcassets')
fit(icon, 1024).save(os.path.join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png'))
for path in glob.glob(os.path.join(ios, 'Splash.imageset/*.png')): centred(2732, 2732, 560).save(path, optimize=True)

# Android: adaptive foreground (art inside the 66/108 safe zone), legacy and round icons, splashes.
res = os.path.join(ROOT, 'android/app/src/main/res')
for name, dp in {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}.items():
    folder = os.path.join(res, 'mipmap-' + name); legacy = round(48 * dp); full = round(108 * dp)
    centred(full, full, round(64 * dp), 0).save(os.path.join(folder, 'ic_launcher_foreground.png'))
    masked(fit(icon, legacy), legacy * 0.18).save(os.path.join(folder, 'ic_launcher.png'))
    masked(fit(icon, legacy), legacy / 2).save(os.path.join(folder, 'ic_launcher_round.png'))
for path in glob.glob(os.path.join(res, 'drawable*/splash.png')):
    width, height = Image.open(path).size
    centred(width, height, round(min(width, height) * 0.36)).save(path, optimize=True)
with open(os.path.join(res, 'values/ic_launcher_background.xml'), 'w') as out:
    out.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">%s</color>\n</resources>\n' % HEX)
print('Native icons and splashes written with background', HEX)
