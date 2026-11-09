"""Re-encode the six selected CC0 tracks from a local upstream clone.
Usage: python scripts/prepare-audio.py /path/to/duru-ai-cc0-bgm
Requires ffmpeg; normal app builds do not run this script.
"""
import sys, subprocess, pathlib, hashlib, json
root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1])
names=['hyak-ep1-rhythm','hyak-ep3-suika','hyak-ep4-blackhole','hyak-ep5-2048','hyak-ep6-galaxy','duru-ai-ep2-music']
manifest=[]
for name in names:
    original=source/'mp3'/f'{name}.mp3'
    target=root/'public/audio'/f'{name}.mp3'
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(original),'-map_metadata','-1','-codec:a','libmp3lame','-b:a','128k',str(target)],check=True)
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(target)]))
    manifest.append(dict(file=target.name,duration=duration,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),upstream_sha256=hashlib.sha256(original.read_bytes()).hexdigest(),license='CC0-1.0'))
(root/'public/audio/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
