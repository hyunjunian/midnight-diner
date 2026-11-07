"""Generate a moderate, downward-only rain layer for the exterior shot.

This draws original transparent animation, not edits to the scene artwork.
Requires Pillow and FFmpeg; these are production tools, not app dependencies.
"""
import argparse
import json
import math
from pathlib import Path
import random
import subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFilter

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
parser.add_argument('--stats', type=Path)
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
W, H, FPS, SCALE = 720, 1280, 24, 2
FRAMES = 222
rng = random.Random(20261107)

# The distant/middle rain is occluded by the building; the open alley and
# foreground street receive rain. A few defocused near drops pass the lens.
street = Image.new('L', (W*SCALE, H*SCALE), 0)
ImageDraw.Draw(street).polygon([(int(x*SCALE), int(y*SCALE)) for x,y in
    [(0,0),(55,0),(130,365),(230,660),(345,823),(720,965),(720,1280),(0,1280)]], fill=255)
street = street.filter(ImageFilter.GaussianBlur(7*SCALE))
particles = []
next_id = 0
for count, speed, opacity, width, blur in [
    (95, (140,250), (22,39), (.45,.7), .1),
    (65, (340,540), (42,66), (.65,1.0), .15),
    (14, (660,870), (30,50), (1.0,1.3), .65),
]:
    for _ in range(count):
        p = dict(id=next_id, x=rng.uniform(-20,W+20), y=rng.uniform(-60,H),
                 speed=rng.uniform(*speed), opacity=rng.uniform(*opacity),
                 width=rng.uniform(*width), close=blur>.5, blur=blur,
                 wind=rng.uniform(5,18), length=0)
        p['length'] = p['speed'] * rng.uniform(.018,.027)
        particles.append(p); next_id += 1

# Sparse, very small ground impacts. No expanding giant rings or downpour.
impacts = [(rng.uniform(0,9.25), rng.uniform(20,W-15), rng.uniform(960,H-20),
            rng.uniform(2.5,5.5)) for _ in range(40)]
command = ['ffmpeg','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba',
           '-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-',
           '-an','-c:v','qtrle','-threads','2','-y',str(args.output)]
encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
upward = 0; min_step = float('inf'); max_step = 0; visible_counts = []
try:
    for frame in range(FRAMES):
        t = frame / FPS
        distant = Image.new('RGBA', (W*SCALE,H*SCALE), (0,0,0,0))
        near = Image.new('RGBA', distant.size, (0,0,0,0))
        draw_far, draw_near = ImageDraw.Draw(distant), ImageDraw.Draw(near)
        visible = 0
        for p in particles:
            if frame:
                prior = p['y']; p['y'] += p['speed']/FPS; p['x'] += p['wind']/FPS
                step = p['y']-prior
                upward += step <= 0; min_step = min(min_step,step); max_step = max(max_step,step)
                # End this trajectory below the frame. Its replacement is a NEW
                # drop above the top, never the same drop moving upward.
                if p['y'] > H+p['length']+3 or p['x'] > W+30:
                    p['id'] = next_id; next_id += 1
                    p['y'] = -rng.uniform(15,150); p['x'] = rng.uniform(-15,W+15)
            if p['y'] < -p['length'] or p['y'] > H+p['length']: continue
            if not p['close'] and street.getpixel((int(max(0,min(W*SCALE-1,p['x']*SCALE))),int(max(0,min(H*SCALE-1,p['y']*SCALE)))))<50: continue
            visible += 1
            draw = draw_near if p['close'] else draw_far
            # Short, shutter-length trails, with a brighter lower end. Random
            # spacing/velocities prevent a repeated pattern reading in reverse.
            glow = math.exp(-((p['x']-460)/240)**2-((p['y']-650)/440)**2)
            rgb = (int(177+42*glow),int(199+12*glow),int(214-24*glow))
            exposure = (.72+.28*glow) * (.94+.06*math.sin(t*.8+p['id']))
            for part in range(4):
                a,b = part/4,(part+1)/4
                y1=p['y']-p['length']*(1-a);y2=p['y']-p['length']*(1-b)
                x1=p['x']-p['wind']/p['speed']*p['length']*(1-a)
                x2=p['x']-p['wind']/p['speed']*p['length']*(1-b)
                alpha=round(p['opacity']*(.28+.72*b)*exposure)
                draw.line([(x1*SCALE,y1*SCALE),(x2*SCALE,y2*SCALE)],fill=(*rgb,alpha),width=max(1,round(p['width']*SCALE)))
        # Soft street-only rain, and a very sparse near-lens layer.
        distant.putalpha(ImageChops.multiply(distant.getchannel('A'),street))
        near=near.filter(ImageFilter.GaussianBlur(.55*SCALE))
        image=Image.alpha_composite(distant,near)
        draw=ImageDraw.Draw(image)
        for at,x,y,radius in impacts:
            age=t-at
            if 0<=age<.24:
                radius*=age/.24
                alpha=round(22*(1-age/.24))
                draw.arc(((x-radius)*SCALE,(y-radius*.23)*SCALE,(x+radius)*SCALE,(y+radius*.23)*SCALE),0,310,fill=(205,211,199,alpha),width=1)
        image=image.resize((W,H),Image.Resampling.LANCZOS)
        encoder.stdin.write(image.tobytes())
        visible_counts.append(visible)
    encoder.stdin.close()
    if encoder.wait(): raise RuntimeError('Rain encoding failed')
except Exception:
    encoder.kill(); raise
summary = dict(frames=FRAMES,fps=FPS,upward_steps=upward,
               min_downward_step_px=min_step,max_downward_step_px=max_step,
               average_visible_drops=sum(visible_counts)/len(visible_counts),
               first_second_visible_drops=sum(visible_counts[:FPS])/FPS,
               last_second_visible_drops=sum(visible_counts[-FPS:])/FPS,
               direction='positive screen Y; reset drops have new identities')
assert upward == 0
if args.stats: args.stats.write_text(json.dumps(summary,indent=2))
print(json.dumps(summary),flush=True)
