"""Original 32-bar late-night nylon/felt instrumental; no sampled music or voices."""
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt
import wave, subprocess
RATE=44100; TEMPO=68; BEAT=60/TEMPO; BARS=32; DURATION=BARS*4*BEAT
rng=np.random.default_rng(2808); count=round(RATE*DURATION); mix=np.zeros((count,2),np.float64)
def add(at,midi,velocity=1,voice='guitar',pan=0):
    f=440*2**((midi-69)/12); length=4.8 if voice=='felt' else 3.7
    t=np.arange(round(length*RATE))/RATE
    if voice=='felt':
        out=sum(a*np.sin(2*np.pi*f*h*t)*np.exp(-t*(.8+h*.3)) for h,a in [(1,1),(2,.22),(3,.085),(4,.025)])
        out*=1-np.exp(-t/.045); gain=.032
    else:
        out=sum(a*np.sin(2*np.pi*f*h*t+.02*np.sin(2*np.pi*3.1*t))*np.exp(-t*(1.6+h*.25)) for h,a in [(1,1),(2,.32),(3,.115),(4,.035),(5,.012)])
        out*=(1-np.exp(-t/.012)); gain=.047
    out*=np.minimum(1,(length-t)/.3)*gain*velocity
    start=round((at+rng.uniform(-.012,.012))*RATE)%count
    stereo=out[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])
    first=min(len(out),count-start); mix[start:start+first]+=stereo[:first]
    if first<len(out):mix[:len(out)-first]+=stereo[first:]
chords=[[50,57,61,64,66],[47,54,57,62,66],[43,50,54,57,59],[45,52,59,61,64],[42,49,52,57,61],[47,54,57,62,66],[40,47,50,54,57],[45,52,57,59,61]]
melodies=[[69,66,64],[66,64,62],[66,69,71],[69,66,64],[64,66,69],[66,64,62],[64,62,59],[61,64,66]]
for bar in range(BARS):
    ch=chords[bar%8]; base=bar*4*BEAT
    add(base,ch[0],.72,'felt',-.1)
    for beat,idx,vel in [(0,1,.82),(1.5,3,.72),(2.5,2,.64),(3.25,4,.58)]:
        add(base+beat*BEAT,ch[idx],vel*(.96+rng.random()*.08),'guitar',-.16)
    if bar%2==0:
        m=melodies[(bar//2)%8]
        add(base+BEAT,m[0],.62,'felt',.2);add(base+2.75*BEAT,m[1],.49,'felt',.2)
        if bar>=16:add(base+3.5*BEAT,m[2],.32,'guitar',.1)
# Short, dark circular room reflections: a seamless musical loop, not room noise.
original=mix.copy()
for delay,gain in [(.137,.13),(.257,.08),(.431,.045),(.673,.025)]:
    shifted=np.roll(original,round(delay*RATE),axis=0)
    reflected=sosfilt(butter(2,2400,fs=RATE,output='sos'),np.concatenate((shifted[-4096:],shifted)),axis=0)[4096:]
    mix+=gain*reflected
mix=sosfilt(butter(2,4200,fs=RATE,output='sos'),np.concatenate((mix[-4096:],mix)),axis=0)[4096:]
mix-=mix.mean(axis=0); mix*=.34/max(abs(mix).max(),1e-9)
output=Path('/workspace/work/midnight-diner/v28/cozy-original.wav')
with wave.open(str(output),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-v','error','-y','-i',str(output),'-c:a','libmp3lame','-q:a','3','docs/assets/music-cozy-v28.mp3'],check=True)
print({'seconds':DURATION,'peak':float(abs(mix).max()),'rms':float(np.sqrt(np.mean(mix*mix))),'loopBoundary':float(abs(mix[0]-mix[-1]).max())})
