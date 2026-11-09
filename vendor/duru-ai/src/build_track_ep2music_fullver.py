# duru-ai-ep2-music — full version, 2:00.0 (90 bars @ 180 BPM), CC0.
# A dorian i-IV vamp (Am7-D7) x tresillo 3-3-2 grid. Same voices as the episode cut.
#   intro8 -> A1(+hat)8 -> B1(+bass)8 -> A2(+arp)8 -> drop1(full)16
#   -> break(sine+pad)8 -> build2 8 -> drop2(full, arp octave-up)16 -> outro10 = 90 bars
# Deterministic: fixed seeds, pure numpy/scipy. [pure] - zero external audio samples.
# Run: python build_track_ep2music_fullver.py  (hyak_synth.py must sit in the same directory)
import sys, os
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hyak_synth import (SR, m2f, lp, adsr, tail_taper, soft_clip, hard_kick,
                        closed_hat, clap, noise_riser, noise_impact, sub_bass,
                        super_saw_lead, pluck_arp, limiter, sidechain_env)

BPM = 180.0
BEAT = 60.0 / BPM
BAR = BEAT * 4
N_BARS = 90
TOTAL = BAR * N_BARS            # 120.000s
N = int(round(TOTAL * SR))

# ---- 구간 (마디) ----
S_INTRO, S_A1, S_B1, S_A2 = 0, 8, 16, 24
S_DROP1, S_BREAK, S_BUILD2, S_DROP2, S_OUTRO = 32, 48, 56, 64, 80

def in_any(bar, spans):
    return any(a <= bar < b for a, b in spans)

HAT_SP   = [(S_A1, S_DROP1), (S_DROP1, S_BREAK), (S_BUILD2, S_OUTRO), (S_OUTRO, S_OUTRO + 6)]
BASS_SP  = [(S_B1, S_BREAK), (S_BUILD2, S_OUTRO), (S_OUTRO, S_OUTRO + 4)]
ARP_SP   = [(S_A2, S_BREAK), (S_BUILD2, S_OUTRO)]
PAD_SP   = [(S_DROP1, S_BUILD2), (S_DROP2, N_BARS)]
DROP_SP  = [(S_DROP1, S_BREAK), (S_DROP2, S_OUTRO)]
KICK_SP  = [(0, S_BREAK), (S_BUILD2, S_OUTRO), (S_OUTRO, S_OUTRO + 6)]

mix = np.zeros(N)

def put(buf, sig, t0, gain=1.0):
    i = int(round(t0 * SR))
    j = min(i + len(sig), N)
    if i < N and j > i:
        buf[i:j] += sig[:j - i] * gain

CH_AM = [57, 60, 64, 67]
CH_D7 = [50, 54, 57, 60]
def chord_at(bar):
    return CH_AM if bar % 2 == 0 else CH_D7

TRES = [0.0, 1.5, 3.0]

def sine_lead(freq, dur, amp=0.42):
    n = int(round(dur * SR)); t = np.arange(n) / SR
    vib = 1.0 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(t / 0.12, 1.0)
    sig = np.sin(2 * np.pi * freq * vib * t)
    sig += 0.18 * np.sin(2 * np.pi * freq * 2 * vib * t)
    env = adsr(n, 0.008, 0.05, 0.0, 0.06, sus=0.75)
    return tail_taper(sig * env * amp)

PH_A = [(81, 0.0, 1.5), (84, 1.5, 1.5), (83, 3.0, 1.0),
        (79, 4.0, 1.5), (81, 5.5, 1.5), (76, 7.0, 1.0)]
PH_B = [(84, 0.0, 1.5), (86, 1.5, 1.5), (88, 3.0, 1.0),
        (86, 4.0, 1.5), (83, 5.5, 1.5), (81, 7.0, 1.0)]
# 풀버전 전용 C 프레이즈(드롭2 후반 정점: E6 터치 후 하강 착지 — 루프 폐합 유지)
PH_C = [(88, 0.0, 1.5), (86, 1.5, 1.5), (84, 3.0, 1.0),
        (83, 4.0, 1.5), (79, 5.5, 1.5), (81, 7.0, 1.0)]

def lead_track():
    buf = np.zeros(N)
    for bar in range(0, N_BARS, 4):
        if S_BREAK <= bar < S_BUILD2 and bar >= S_BREAK + 4:
            continue  # 브레이크 후반 4마디 = 리드 휴지(호흡)
        blk = (bar // 4) % 2
        if bar >= S_DROP2 + 8:
            ph = PH_C if blk == 0 else PH_B
        else:
            ph = PH_A if blk == 0 else PH_B
        base = bar * BAR
        drop = in_any(bar, DROP_SP)
        for (m, b0, bl) in ph:
            t0 = base + b0 * BEAT
            if t0 >= TOTAL: break
            dur = bl * BEAT * 0.92
            if drop:
                put(buf, sine_lead(m2f(m), dur, 0.34), t0)
                put(buf, super_saw_lead(m2f(m), dur, amp=0.20, detune_cents=11), t0)
            else:
                put(buf, sine_lead(m2f(m), dur), t0)
    return buf

def kick_track():
    buf = np.zeros(N); times = []
    for bar in range(N_BARS):
        if not in_any(bar, KICK_SP): continue
        for b in range(4):
            t0 = bar * BAR + b * BEAT
            amp = 1.0 if in_any(bar, DROP_SP) else 0.85
            put(buf, hard_kick(amp=amp), t0)
            times.append(t0)
    return buf, times

def hat_track():
    buf = np.zeros(N)
    for bar in range(N_BARS):
        if not in_any(bar, HAT_SP): continue
        if in_any(bar, DROP_SP):
            for s in range(16):
                t0 = bar * BAR + s * BEAT / 4
                put(buf, closed_hat(amp=0.16 if s % 4 else 0.24, seed=1 + s), t0)
        else:
            for b in range(4):
                put(buf, closed_hat(amp=0.22, seed=3), bar * BAR + (b + 0.5) * BEAT)
    return buf

def bass_track():
    buf = np.zeros(N)
    for bar in range(N_BARS):
        if not in_any(bar, BASS_SP): continue
        root = chord_at(bar)[0] - 24
        for k, b0 in enumerate(TRES):
            dur = (TRES[k + 1] - b0 if k + 1 < len(TRES) else 4.0 - b0) * BEAT * 0.9
            put(buf, sub_bass(m2f(root), dur, amp=0.8), bar * BAR + b0 * BEAT)
    return buf

def arp_track():
    buf = np.zeros(N)
    for bar in range(N_BARS):
        if not in_any(bar, ARP_SP): continue
        ch = chord_at(bar)
        lift = 12 if bar >= S_DROP2 else 0  # 드롭2 = 옥타브업 변주
        for s in range(8):
            m = ch[s % 4] + 12 * (1 + s // 4) + lift
            t0 = bar * BAR + s * BEAT / 2
            put(buf, pluck_arp(m2f(m), BEAT * 0.45, amp=0.20), t0)
    return buf

def pad_track():
    buf = np.zeros(N)
    spans = PAD_SP + [(S_BREAK, S_BUILD2)]  # 브레이크에도 패드(호흡 담당)
    for bar in range(N_BARS):
        if not in_any(bar, spans): continue
        ch = chord_at(bar)
        n = int(round(BAR * SR)); t = np.arange(n) / SR
        sig = np.zeros(n)
        for m in ch:
            f = m2f(m + 12)
            sig += np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.005 * t)
        sig = lp(sig, 2400) * adsr(n, 0.20, 0.2, 0.0, 0.25, sus=0.85)
        put(buf, tail_taper(sig, 0.05), bar * BAR, gain=0.055)
    return buf

def perc_track():
    buf = np.zeros(N)
    for bar in range(N_BARS):
        if in_any(bar, DROP_SP):
            for b in (1, 3):
                put(buf, clap(amp=0.5), bar * BAR + b * BEAT)
    for target in (S_DROP1, S_DROP2):
        put(buf, noise_riser(BAR * 2, amp=0.32), (target - 2) * BAR)
        put(buf, noise_impact(amp=0.55), target * BAR)
    put(buf, noise_riser(BAR * 1.5, amp=0.16), (S_A1 - 1.5) * BAR)
    put(buf, noise_riser(BAR * 1, amp=0.20), (S_A2 - 1) * BAR)
    return buf

lead = lead_track()
kick, ktimes = kick_track()
hat = hat_track()
bass = bass_track()
arp = arp_track()
pad = pad_track()
perc = perc_track()

sc = sidechain_env(N, ktimes, depth=0.55)
mix = (lead * 1.0 + kick * 0.95 + hat * 1.0 + (bass * 0.9 + arp * 0.9 + pad * 1.0) * sc + perc * 1.0)

# 매크로 다이내믹스 (구간 계단 + 0.5마디 램프)
MACRO = [(0, 0.42), (S_A1, 0.50), (S_B1, 0.60), (S_A2, 0.70),
         (S_DROP1, 1.00), (S_BREAK, 0.52), (S_BUILD2, 0.72),
         (S_DROP2, 1.00), (S_OUTRO, 0.80), (S_OUTRO + 6, 0.55)]
env = np.zeros(N)
ramp = int(0.5 * BAR * SR)
for idx, (b0, g) in enumerate(MACRO):
    i = int(b0 * BAR * SR)
    j = int(MACRO[idx + 1][0] * BAR * SR) if idx + 1 < len(MACRO) else N
    env[i:j] = g
    if i > 0 and ramp > 0:
        prev_g = MACRO[idx - 1][1]
        k = min(i + ramp, N)
        env[i:k] = np.linspace(prev_g, g, k - i)
# 최종 3마디 페이드아웃(풀버전 종지)
fo = int(3 * BAR * SR)
env[N - fo:] *= np.linspace(1.0, 0.0, fo) ** 1.5
mix *= env
mix = soft_clip(mix, 1.05)
mix = limiter(mix, ceiling=0.92)

dly = int(0.011 * SR)
L = mix.copy()
R = np.concatenate([np.zeros(dly), mix[:-dly]]) * 0.98 + mix * 0.02
st = np.stack([L, R], axis=1)
peak = np.max(np.abs(st))
if peak > 0.98:
    st *= 0.98 / peak

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "duru-ai-ep2-music.wav")
from scipy.io import wavfile
wavfile.write(out, SR, (st * 32767).astype(np.int16))
rms = np.sqrt(np.mean(st ** 2))
print("WROTE", out, f"{TOTAL:.3f}s bars={N_BARS}")
print(f"RMS {20*np.log10(rms+1e-12):.1f} dBFS  peak {20*np.log10(peak+1e-12):.1f} dBFS")
# 구간 아크 리포트
mono = st.mean(axis=1)
for name, a, b in [("intro",0,8),("A1",8,16),("B1",16,24),("A2",24,32),("drop1",32,48),
                   ("break",48,56),("build2",56,64),("drop2",64,80),("outro",80,90)]:
    s = mono[int(a*BAR*SR):int(b*BAR*SR)]
    print(f"  {name:<5} {20*np.log10(np.sqrt(np.mean(s**2))+1e-12):6.1f} dBFS")
