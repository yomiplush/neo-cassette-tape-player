# DURU-AI — CC0 BGM (unified)

Background music from the creator's YouTube channels (**DURU-AI**: <https://www.youtube.com/@DURU-AI0503>),
released into the public domain under **CC0 1.0** — free for anything (videos, games, streams,
commercial projects), **no attribution required** (attribution welcome, never obligatory).

This repo unifies the previously separate `duru-cc0-bgm` and `hyak-cc0-bgm` packs into one place.
**MP3 320 kbps** — grab any track from [`mp3/`](mp3/). The Python code that generated the
tracks lives in [`src/`](src/) (see "Source code" below).

**Download options**
- 📦 Everything in one zip: [latest release](https://github.com/uncle-sheepsky/duru-ai-cc0-bgm/releases/latest)
- 📁 Google Drive mirror (pick single tracks): <https://drive.google.com/drive/folders/1CCKVPIC68w8mGrOxzZk6TtZ8B32mVntz>

Every track is **composed and produced in code** (Python + NumPy / SciPy). Two groups:

- **[pure]** — 100% synthesized in code, **zero external audio samples**, no VST instruments.
- **[+sfx]** — original music that also layers in **third-party sound effects that are themselves CC0**
  (see "Third-party CC0 audio" below). The whole mix is CC0; these are **not** claimed to be sample-free.
- **[+samples]** — original music played with **CC0 sampled acoustic instruments** (VSCO 2 Community Edition)
  plus code-synthesized parts (music box, steel pan, nylon guitar/banjo/ukulele via Karplus–Strong, whistle, kazoo).
  Composed note-by-note in Python; **not** sample-free, but every sample is CC0.

## Tracks

| file | used in | length | melody | build |
|---|---|---|---|---|
| `hyak-ep2-korobeiniki-tetris` | *내 AI만 실수하는 이유* / bank & schema making-of explainer | 2:40 | *Korobeiniki* (public domain) | **[pure]** |
| `korobeiniki-arcade-fullver` | arcade arrangement (Korobeiniki) | 2:40 | *Korobeiniki* (public domain) | **[+sfx]** |
| `korobeiniki-boombap-loop` | *DURU BLOCK FEVER* (Tetris tribute) | 0:48 (loop) | *Korobeiniki* (public domain) | **[pure]** |
| `mountainking-arcade-loop` | *DURU 2048* (4-seed race) | 0:40 (loop) | Grieg, *In the Hall of the Mountain King* (public domain) | **[pure]** |
| `duru-rondo` | *Channel surfing (MV)* (ep13) · *CHANNEL SURF* (ep29) | 1:04 | original | **[pure]** |
| `duru-roomscene-lofi` | lo-fi radio room (ep11) | 1:44 | original | **[pure]** |
| `duru-arcade-vibe` | *Arcade — vibe (MV)* chiptune (ep14) | 1:02 | original | **[pure]** |
| `duru-rhythm-fever` | *RHYTHM FEVER (Full Stage)* (ep19) | 1:28 | original | **[+sfx]** |
| `duru-denparcade` | *DENPARCADE* (ep16) | 1:25 | original | **[+sfx]** + Faust DSP lead |
| `duru-winter-arcade` | winter arcade (ep14) | 1:02 | original | **[+sfx]** |
| `hyak-ep1-rhythm` | Rhythm game | 2:40 | original | **[pure]** |
| `hyak-ep3-suika` | Suika (fruit merge) | 2:40 | original | **[pure]** |
| `hyak-ep4-blackhole` | Black hole | 2:38 | original | **[pure]** |
| `hyak-ep5-2048` | 2048 | 2:40 | original | **[pure]** |
| `hyak-ep6-galaxy` | Galaxy collision | 2:40 | original | **[pure]** |
| `hyak-ep7-danmaku` | Bullet-hell dodge | 2:40 | original | **[pure]** |
| `duru-ai-ep2-music` | *music-from-code explainer* (upcoming episode — the track that builds itself layer by layer on screen) | 2:00 | original (A dorian / tresillo) | **[pure]** |
| `duru-zoneout-01-melty-afternoon` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #1 — 흐물흐물 오후 (Melty Afternoon) · clarinet · flute · kazoo · tuba | 1:46 | original | **[+samples]** |
| `duru-zoneout-02-nosebubble-polka` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #2 — 콧방울 폴카 (Nose-Bubble Polka) · piccolo · xylophone · accordion-like reed | 2:16 | original | **[+samples]** |
| `duru-zoneout-03-mismatched-socks-march` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #3 — 짝짝이 양말 행진곡 (Mismatched Socks March) · trumpet · horns · trombone | 3:49 | original | **[+samples]** |
| `duru-zoneout-04-pillow-waltz` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #4 — 베개 왈츠 (Pillow Waltz) · music box · harp | 3:54 | original | **[+samples]** |
| `duru-zoneout-05-droopy-socks-blues` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #5 — 늘어진 양말 블루스 (Droopy Socks Blues) · harmon-mute trumpet · piano | 3:43 | original | **[+samples]** |
| `duru-zoneout-06-sleepy-bossa` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #6 — 졸린 보사 (Sleepy Bossa) · flute · nylon guitar | 3:29 | original | **[+samples]** |
| `duru-zoneout-07-blanket-habanera` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #7 — 이불 하바네라 (Blanket Habanera) · bassoon · oboe · pizzicato | 3:37 | original | **[+samples]** |
| `duru-zoneout-08-tummyrumble-calypso` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #8 — 꼬르륵 칼립소 (Tummy-Rumble Calypso) · steel pan · ukulele | 4:17 | original | **[+samples]** |
| `duru-zoneout-09-tossandturn-ska` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #9 — 뒤척뒤척 스카 (Toss-and-Turn Ska) · horns · organ · melodica | 3:35 | original | **[+samples]** |
| `duru-zoneout-10-five-beats-on-a-cloud` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #10 — 구름 위 5박자 (Five Beats on a Cloud) · celesta · harp | 4:15 | original | **[+samples]** |
| `duru-zoneout-11-warm-milk-nocturne` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #11 — 우유 한 잔 녹턴 (Warm Milk Nocturne) · piano · clarinet · violin | 3:48 | original | **[+samples]** |
| `duru-zoneout-12-hophop-slip-jig` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #12 — 깡총 슬립지그 (Hop-Hop Slip Jig) · flute · fiddle · harp | 4:20 | original | **[+samples]** |
| `duru-zoneout-13-crumbly-charleston` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #13 — 부스러기 찰스턴 (Crumbly Charleston) · clarinet · banjo · trombone | 3:12 | original | **[+samples]** |
| `duru-zoneout-14-yawning-minuet` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #14 — 하품 미뉴에트 (Yawning Minuet) · oboe · bassoon · strings | 4:22 | original | **[+samples]** |
| `duru-zoneout-15-snail-march` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #15 — 달팽이 행진 (Snail March) · tuba · glockenspiel | 4:33 | original | **[+samples]** |
| `duru-zoneout-16-shootingstar-whistle` | [*멍 때리기 플레이리스트 · 1시간*](https://youtu.be/nQNfS5DZUiM) #16 — 별똥별 휘파람 (Shooting-Star Whistle) · whistle · glockenspiel · harp | 4:40 | original | **[+samples]** |

## License — please read

- **All tracks are released under CC0 1.0** (public-domain dedication). Use them for anything —
  no attribution required. See [LICENSE](LICENSE).
- **Melody**: tracks marked *original* are the creator's own composition. `korobeiniki-*` and
  `hyak-ep2-korobeiniki-tetris` arrange *Korobeiniki* (Коробейники) and `mountainking-*` arranges
  Grieg's *In the Hall of the Mountain King* — both **19th-century, public-domain** melodies anyone
  may freely use. The arrangements & recordings are dedicated to the public domain under CC0.
- **[pure] tracks** are 100% synthesized in code (Python + NumPy / SciPy): no external audio samples,
  no sample libraries, no VST instruments.
- **[+sfx] tracks** are original music with third-party **CC0** sound effects layered in (see below).
  Because every added component is itself CC0, the finished track is CC0 too — but these are, honestly,
  not sample-free.

### Third-party CC0 audio used in the [+sfx] tracks

All of it is public-domain / CC0 and free to redistribute:

- **Sheep "baa" vocalizations** — BigSoundBank (CC0, no attribution).
- **Retro coin / gem one-shots** — *80 CC0 RPG SFX* pack (CC0).
- **Arcade / interface one-shots** (blip, sparkle, coin, boss, laser) — Kenney *Interface Sounds* & *Sci-Fi Sounds* (CC0).
- **Vocal-chop hit** — Freesound (cat-fox_alex, CC0).
- **Glockenspiel / marimba** (ep19) — VSCO 2 Community Edition (CC0) sampled instruments.
- **Orchestral / band instruments** (all `duru-zoneout-*`: tuba, bassoon, clarinet, flute, piccolo, oboe, trumpet, horn, trombone,
  strings, harp, piano, organ, mallets, percussion) — VSCO 2 Community Edition (CC0).
- **Faust DSP lead** (ep16 `duru-denparcade`) — a synth instrument *defined in code* (Faust via DawDreamer); output is original synthesis, not a copyrighted VST.

## Source code

[`src/`](src/) contains the Python build scripts that synthesized the **[pure]** hyak tracks and
`duru-ai-ep2-music` — every sound is computed with NumPy/SciPy (shared DSP helpers in
`src/hyak_synth.py`). Run a script next to `hyak_synth.py` and it writes the track as WAV:

```bash
python src/build_track_ep2music_fullver.py
```

[`src/duru-zoneout-1h/`](src/duru-zoneout-1h/) holds the composers' code for the 16 `duru-zoneout-*` tracks
(one script per song + a small shared sampler/mixer `band.py`); see its README for how to rebuild them.

The scripts are CC0 like everything else here. Builders for the remaining `duru-*` tracks will be
added progressively.

## Not affiliated with Tetris

*Korobeiniki* is a public-domain folk melody widely recognized from the game *Tetris*. The
`korobeiniki-*` and `hyak-ep2-korobeiniki-tetris` files are independent arrangements of that
public-domain melody and are **not affiliated with, sponsored by, or endorsed by Tetris Holding, LLC**.
"Tetris" is a trademark of its respective owner.

## Channels

▶ https://www.youtube.com/@DURU-AI0503

Made with Claude + code.
