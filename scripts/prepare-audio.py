"""Prepare the six creator-supplied tracks in the three my vibes folders.
Usage: python scripts/prepare-audio.py '/path/to/my vibes'
Requires ffmpeg/ffprobe. Source files are never modified; builds use checked-in MP3s.
"""
import sys, subprocess, pathlib, hashlib, json
root = pathlib.Path(__file__).resolve().parents[1]
source = pathlib.Path(sys.argv[1])
tracks = [
    ('Shrine Mix', '幽玄の刻印 (Ethereal Sanctuary).mp3', 'shrine-ethereal-sanctuary', 'Ethereal Sanctuary', 'shrine-afterglow', 'A'),
    ('Shrine Mix', '幽玄の刻印 (Ethereal Sanctuary) - Take 2.mp3', 'shrine-ethereal-sanctuary-take-2', 'Ethereal Sanctuary / Take 2', 'shrine-afterglow', 'B'),
    ('Cozy Mix', 'lost-inari.mp3', 'cozy-lost-inari', 'Lost Inari', 'pillow-radio', 'A'),
    ('Cozy Mix', 'oursquishydreams.mp3', 'cozy-our-squishy-dreams', 'Our Squishy Dreams', 'pillow-radio', 'B'),
    ('Cool Mix', 'Corner Booth.mp3', 'cool-corner-booth', 'Corner Booth', 'midnight-circuit', 'A'),
    ('Cool Mix', 'infosec.mp3', 'cool-infosec', 'Infosec', 'midnight-circuit', 'B'),
]
# Validate the entire set before changing any served assets.
for folder, filename, *_ in tracks:
    if not (source / folder / filename).is_file():
        raise FileNotFoundError(source / folder / filename)
manifest = []
for folder, filename, slug, title, tape, side in tracks:
    original = source / folder / filename
    metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'quiet', '-show_format', '-of', 'json', str(original)]))['format']
    tags = metadata.get('tags', {})
    artist = tags.get('artist', 'Creator-supplied')
    target = root / 'public/audio' / f'{slug}.mp3'
    # The supplied .mp3 files contain M4A streams. Produce actual MP3 for browser portability.
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(original), '-vn', '-map_metadata', '-1', '-metadata', f'artist={artist}', '-metadata', f'title={title}', '-codec:a', 'libmp3lame', '-b:a', '128k', str(target)], check=True)
    duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(target)]))
    manifest.append(dict(file=target.name, title=title, author=artist, tape=tape, side=side, source_folder=folder, source_file=filename, source_title=tags.get('title', filename), duration=duration, sha256=hashlib.sha256(target.read_bytes()).hexdigest(), source_sha256=hashlib.sha256(original.read_bytes()).hexdigest(), license='LicenseRef-Creator-Supplied'))
(root / 'public/audio/manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
for name in ['hyak-ep1-rhythm', 'hyak-ep3-suika', 'hyak-ep4-blackhole', 'hyak-ep5-2048', 'hyak-ep6-galaxy', 'duru-ai-ep2-music']:
    (root / 'public/audio' / f'{name}.mp3').unlink(missing_ok=True)
print(f'Prepared {len(manifest)} tracks across three A/B cassettes.')
