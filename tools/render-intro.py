"""Render the portrait intro with a locked camera and exterior-only natural rain.

Requires FFmpeg and Pillow for the generated rain layer. Reuses the released audio bitstream without re-encoding it.
"""
from pathlib import Path
import argparse
import subprocess
import sys

REPO = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--work', type=Path, required=True)
parser.add_argument('--audio-from', type=Path, required=True)
parser.add_argument('--rain-layer', type=Path)
parser.add_argument('--output', type=Path, default=REPO / 'docs/assets/opening-portrait.mp4')
args = parser.parse_args()
args.work.mkdir(parents=True, exist_ok=True)
art = REPO / 'planning/assets/intro-storyboard.png'
captions = REPO / 'planning/assets/intro-captions.ass'
audio = args.work / 'preserved-audio.m4a'


def run(*arguments):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', *map(str, arguments)], check=True)


run('-i', args.audio_from, '-map', '0:a:0', '-vn', '-c:a', 'copy', '-y', audio)
rain = args.rain_layer or args.work / 'rain.mov'
if not args.rain_layer:
    subprocess.run([sys.executable, str(REPO / 'tools/generate-intro-rain.py'), str(rain),
                    '--stats', str(args.work / 'rain-stats.json')], check=True)
for scene in range(4):
    x, y = (scene % 2) * 471, (scene // 2) * 836
    # Camera stays fixed; only the outdoor first scene receives the rain input.
    base = f'[0:v]crop=470:836:{x}:{y},scale=720:1280:flags=lanczos,setsar=1,format=yuv420p[base]'
    extra_inputs = []
    if scene == 0:
        extra_inputs = ['-i', rain]
        graph = base + ';[base][1:v]overlay=shortest=1:format=auto,format=yuv420p[out]'
    elif scene in (1, 3):
        # Only local food steam moves. The camera and all scene geometry stay fixed.
        cx, cy = (120, 160) if scene == 1 else (149, 260)
        alpha = (f'32*exp(-pow((X-{cx}-10*sin(Y/30-T*1.1))/13,2))'
                 f'*exp(-pow((Y-{cy}+mod(T*13,65))/90,2))*(0.7+0.3*sin(T*2+Y/33))')
        steam = (f"color=c=black:s=240x426:r=24:d=9.25,format=rgba,"
                 f"geq=r=230:g=226:b=212:a='{alpha}',gblur=sigma=4,scale=720:1280[steam]")
        graph = base + ';' + steam + ';[base][steam]overlay=shortest=1:format=auto,format=yuv420p[out]'
    else:
        graph = base + ';[base]null[out]'
    run('-filter_complex_threads', '2', '-loop', '1', '-framerate', '24', '-i', art, *extra_inputs,
        '-filter_complex', graph, '-map', '[out]', '-an', '-t', '9.25', '-r', '24',
        '-c:v', 'libx264', '-threads', '3', '-preset', 'fast', '-crf', '18' if scene == 0 else '21',
        '-y', args.work / f'scene-{scene}.mp4')
    print(f'Rendered fixed scene {scene + 1}/4', flush=True)

inputs = []
for scene in range(4):
    inputs += ['-i', args.work / f'scene-{scene}.mp4']
graph = ("[0:v][1:v]xfade=transition=fade:duration=1:offset=8.25[v1];"
         "[v1][2:v]xfade=transition=fade:duration=1:offset=16.5[v2];"
         "[v2][3:v]xfade=transition=fade:duration=1:offset=24.75,"
         "fade=t=in:st=0:d=0.5,fade=t=out:st=33.3:d=0.7,format=yuv420p[v]")
silent = args.work / 'fixed-silent.mp4'
run('-filter_complex_threads', '2', *inputs, '-filter_complex', graph, '-map', '[v]', '-an',
    '-t', '34', '-c:v', 'libx264', '-threads', '3', '-preset', 'fast', '-crf', '21', '-y', silent)

# Reuse the checked-in captions without changing their timing or text.
subtitle_filter = f'ass={captions.as_posix()}'
rendered = args.work / 'opening-fixed.mp4'
run('-i', silent, '-i', audio, '-vf', subtitle_filter, '-map', '0:v:0', '-map', '1:a:0',
    '-t', '34', '-c:v', 'libx264', '-threads', '3', '-preset', 'fast', '-crf', '19',
    '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', '-y', rendered)
args.output.parent.mkdir(parents=True, exist_ok=True)
import shutil
shutil.copyfile(rendered, args.output)
run('-ss', '1.2', '-i', args.output, '-frames:v', '1', '-q:v', '3', '-y',
    args.output.with_name('opening-portrait-poster.jpg'))
print(f'Updated {args.output}', flush=True)
