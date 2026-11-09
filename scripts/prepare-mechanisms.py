"""Rebuild CC0 mechanism clips from the explicitly credited source downloads.
Usage: python scripts/prepare-mechanisms.py /directory/with/source/files
Requires numpy + ffmpeg. This is not run by normal app builds.
"""
from pathlib import Path
import hashlib,json,subprocess,sys,tempfile,wave
import numpy as np
root=Path(__file__).resolve().parents[1]; sources=Path(sys.argv[1]); out=root/'public/sfx';out.mkdir(exist_ok=True)
rate=22050
recipes=[('wind-reverse','stecman-376058.mp3',2.1,4.35,True),('wind-forward','stecman-376058.mp3',9.2,24.7,True),('press','sardin-0566.mp3',.01,.43,False),('stop','sardin-0566.mp3',2.50,2.96,False),('door-open','hatch-open.wav',0,None,False),('door-close','hatch-close.wav',0,None,False)]
clips=[]
for name,file,start,end,loop in recipes:
 with tempfile.NamedTemporaryFile(suffix='.wav') as temp:
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(sources/file),'-ac','1','-ar',str(rate),'-af','highpass=f=65,lowpass=f=9500','-c:a','pcm_s16le',temp.name],check=True)
  with wave.open(temp.name) as f: x=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(float)/32768
 x=x[round(start*rate):round(end*rate) if end else None].copy()
 if loop:
  n=min(round(.12*rate),len(x)//5);theta=np.linspace(0,np.pi/2,n)
  x=np.concatenate([x[n:-n],x[-n:]*np.cos(theta)+x[:n]*np.sin(theta)])
  x*=.065/max(np.sqrt(np.mean(x*x)),1e-9)
 else:
  x*=.50/max(np.max(np.abs(x)),1e-9);n=min(round(.004*rate),len(x)//10);x[:n]*=np.linspace(0,1,n);x[-n:]*=np.linspace(1,0,n)
 x*=min(1,.9/max(np.max(np.abs(x)),1e-9))
 target=out/f'{name}.wav'
 with wave.open(str(target),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((x*32767).astype('<i2').tobytes())
 clips.append(dict(file=target.name,duration=len(x)/rate,source=file,start=start,end=end,loop=loop,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),source_sha256=hashlib.sha256((sources/file).read_bytes()).hexdigest(),license='CC0-1.0'))
(out/'manifest.json').write_text(json.dumps(clips,indent=2)+'\n')
