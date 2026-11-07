"""Original, deterministic DSP soundscape; no source recording or sample library."""
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
import argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
args=parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
sr=24000;n=34*sr
rng=np.random.default_rng(20261107);t=np.arange(n)/sr
noise=rng.normal(size=(n,2))
rain=sosfilt(butter(2,[500,7500],fs=sr,btype='bandpass',output='sos'),noise,axis=0)
rain*=.007*(.8+.2*np.sin(2*np.pi*t*.13))[:,None]
# Distinct short drops on an imaginary stone sill.
for at in rng.uniform(0,34,170):
 start=int(at*sr);length=min(int(.055*sr),n-start);u=np.arange(length)/sr
 drop=np.exp(-u*95)*(np.sin(2*np.pi*rng.uniform(1500,4000)*u)+rng.normal(0,.18,length))*.012
 pan=rng.uniform(.1,.9);rain[start:start+length,0]+=drop*(1-pan);rain[start:start+length,1]+=drop*pan
kitchen=sosfilt(butter(2,[150,2400],fs=sr,btype='bandpass',output='sos'),rng.normal(size=(n,2)),axis=0)
kitchen*=((.003+.003*np.sin(t*4.1)**2)*np.clip((t-7)/3,0,1))[:,None]
# A few original ceramic taps, synthesized as damped resonances.
for at,f in [(17.8,1830),(20.7,2460),(26.0,1710),(28.4,2280)]:
 start=int(at*sr);u=np.arange(int(.6*sr))/sr
 tap=(np.sin(2*np.pi*f*u)*np.exp(-u*23)+.3*np.sin(2*np.pi*f*1.74*u)*np.exp(-u*34))*.025
 kitchen[start:start+len(u),0]+=tap;kitchen[start:start+len(u),1]+=tap*.8
# Original sparse, non-melodic felt-bell/harmonic bed. No existing song.
music=np.zeros((n,2))
for at,f in [(0.6,146.832),(5.4,220),(10.0,174.614),(14.7,261.626),(19.4,164.814),(24.2,220),(28.8,293.665)]:
 start=int(at*sr);u=np.arange(min(int(8*sr),n-start))/sr
 attack=1-np.exp(-u*17)
 tone=(np.sin(2*np.pi*f*u)*np.exp(-u*.75)+.22*np.sin(2*np.pi*f*2.003*u)*np.exp(-u*1.0)+.08*np.sin(2*np.pi*f*3.99*u)*np.exp(-u*1.5))*.024*attack
 music[start:start+len(u),0]+=tone;music[start:start+len(u),1]+=tone*.88
 for delay,gain in [(.13,.15),(.29,.1),(.43,.06)]:
  off=start+int(delay*sr);keep=min(len(tone),n-off)
  music[off:off+keep,1]+=tone[:keep]*gain
sound=rain+kitchen+music
fade=np.minimum(1,t/1.2)*np.minimum(1,(34-t)/1.2);sound*=fade[:,None]
wavfile.write(args.output,sr,sound.astype(np.float32))
print('Original 34s stereo soundscape:',float(np.max(np.abs(sound))))
