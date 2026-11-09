import { MechanismSounds } from "./mechanisms.js";
// Original Web Audio tape model. Everything, including mechanisms, passes through master.
export class CassetteAudio {
  constructor() {
    this.volume = 0.65;
    this.wear = 0.5;
    this.profile = "archive";
    this.cache = new Map();
    this.mode = "stopped";
    this.clock = 0;
  }
  async unlock() {
    if (!this.ctx) this.create();
    if (this.ctx.state !== "running") await this.ctx.resume();
    this.mechanisms.preload().catch(() => {});
  }
  create() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error("This browser does not support Web Audio.");
    this.ctx = new Ctx();
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.volume;
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -5;
    this.limiter.ratio.value = 12;
    this.master.connect(this.limiter).connect(c.destination);
    this.input = c.createGain();
    this.input.gain.value = 0.64;
    this.highpass = c.createBiquadFilter();
    this.highpass.type = "highpass";
    this.highpass.frequency.value = 65;
    this.lowpass = c.createBiquadFilter();
    this.lowpass.type = "lowpass";
    this.lowpass.Q.value = 0.5;
    this.saturator = c.createWaveShaper();
    this.saturator.oversample = "2x";
    this.delay = c.createDelay(0.1);
    this.delay.delayTime.value = 0.025;
    this.dropout = c.createGain();
    this.envelope = c.createGain();
    this.envelope.gain.value = 0;
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 256;
    this.input
      .connect(this.highpass)
      .connect(this.saturator)
      .connect(this.lowpass)
      .connect(this.delay)
      .connect(this.dropout)
      .connect(this.envelope)
      .connect(this.analyser)
      .connect(this.master);
    this.lfos = [];
    for (const frequency of [0.73, 7.6]) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.frequency.value = frequency;
      osc.connect(gain).connect(this.delay.delayTime);
      osc.start();
      this.lfos.push(gain);
    }
    const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    this.hiss = c.createGain();
    this.hiss.gain.value = 0;
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 900;
    const hissCeiling=c.createBiquadFilter();hissCeiling.type="lowpass";hissCeiling.frequency.value=10800;
    noise.connect(filter).connect(hissCeiling).connect(this.hiss).connect(this.master);
    noise.start();
    this.motor = c.createOscillator();
    this.motor.type = "triangle";
    this.motor.frequency.value = 72;
    this.motorGain = c.createGain();
    this.motorGain.gain.value = 0;
    this.motor.connect(this.motorGain).connect(this.master);
    this.motor.start();
    this.createWinding();
    this.setWear(this.wear);
    this.clock = c.currentTime;
    const dropout = () => {
      if (this.mode === "playing" && c.state === "running" && Math.random() < this.wear) {
        const now = c.currentTime, amount = .01 + this.wear * .15;
        this.dropout.gain.cancelScheduledValues(now); this.dropout.gain.setValueAtTime(1, now);
        this.dropout.gain.linearRampToValueAtTime(1 - amount, now + .025);
        this.dropout.gain.linearRampToValueAtTime(1, now + .09 + Math.random() * .12);
      }
      this.dropTimer = setTimeout(dropout, 5000 + Math.random() * 9000);
    };
    this.dropTimer = setTimeout(dropout, 5000 + Math.random() * 9000);
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.ctx)
      this.master.gain.setTargetAtTime(
        this.volume,
        this.ctx.currentTime,
        0.025,
      );
  }
  setProfile(name) {
    this.profile = ["light", "medium", "heavy"].includes(name) ? name : "archive";
    this.setWear(this.wear);
  }
  setWear(value) {
    this.wear = Math.max(0, Math.min(1, value));
    if (!this.ctx) return;
    const w = this.wear,
      now = this.ctx.currentTime;
    // Tone targets adapted from YomiPlush's MIT youtube-cassette-filter presets.
    // Retain this engine's restrained instability and independent mechanism recordings.
    const tone = {archive:[65,7300,3800,1.25,2,1],light:[50,9000,1200,2.2,.6,.85],medium:[80,6200,1400,3.6,.8,1.15],heavy:[110,4200,1300,5.5,1,1.4]}[this.profile];
    this.highpass.frequency.setTargetAtTime(tone[0], now, .1);
    this.lowpass.frequency.setTargetAtTime(tone[1] - w * tone[2], now, .1);
    const curve = new Float32Array(2048),
      drive = tone[3] + w * tone[4];
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / (curve.length - 1) - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    this.saturator.curve = curve;
    this.lfos[0].gain.setTargetAtTime((0.00012 + w * 0.00075) * tone[5], now, 0.1);
    this.lfos[1].gain.setTargetAtTime((0.000008 + w * 0.000045) * tone[5], now, 0.1);
    this.ambience();
  }
  async decode(id, data) {
    if (this.cache.has(id)) return this.cache.get(id);
    const buffer = await this.ctx.decodeAudioData(data.slice(0));
    this.cache.set(id, buffer);
    const bytes = () =>
      [...this.cache.values()].reduce(
        (sum, b) => sum + b.length * b.numberOfChannels * 4,
        0,
      );
    while (
      this.cache.size > 1 &&
      (this.cache.size > 2 || bytes() > 80 * 1024 * 1024)
    )
      this.cache.delete(this.cache.keys().next().value);
    return buffer;
  }
  async load(side, signal) {
    if (this.cache.has(side.key || side.url))
      return this.cache.get(side.key || side.url);
    let data;
    if (side.blob) data = await side.blob.arrayBuffer();
    else {
      const res = await fetch(side.url, { signal });
      if (!res.ok)
        throw new Error("Could not load audio. Check your connection.");
      data = await res.arrayBuffer();
    }
    return this.decode(side.key || side.url, data);
  }
  start(buffer, offset) {
    this.stopSource();
    const c = this.ctx;
    this.source = c.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.input);
    const source = this.source;
    source.onended = () => {
      source.disconnect();
      if (this.source !== source) return;
      this.source = null;
      this.onPlaybackEnd?.();
    };
    this.source.start(0, Math.min(offset, Math.max(0, buffer.duration - 0.01)));
    this.envelope.gain.setTargetAtTime(1, c.currentTime, 0.04);
    this.setMode("playing");
  }
  stopSource() {
    if (this.source) {
      try {
        this.source.stop();
      } catch {}
      this.source.disconnect();
      this.source = null;
    }
    if (this.ctx)
      this.envelope.gain.setTargetAtTime(0, this.ctx.currentTime, 0.012);
  }
  setMode(mode) {
    const previous = this.mode;
    this.mode = mode;
    this.mechanisms?.setMode(mode);
    if (mode === "stopped" && ["playing","forwarding","rewinding"].includes(previous)) this.sound("stop");
    if (mode !== "playing") this.stopSource();
    this.ambience();
    this.setSpoolPosition(this.spoolPosition ?? 0.5);
  }
  ambience() {
    if (!this.ctx) return;
    const running = ["playing", "forwarding", "rewinding"].includes(this.mode),
      winding = this.mode.endsWith("ing") && this.mode !== "playing";
    this.hiss.gain.setTargetAtTime(
      running ? (winding ? 0.0015 : (0.004 + this.wear * 0.012) * ({archive:1,light:.75,medium:1.2,heavy:1.65}[this.profile])) : 0,
      this.ctx.currentTime,
      0.05,
    );
    this.motorGain.gain.setTargetAtTime(
      running ? (winding ? 0.001 : 0.003) : 0,
      this.ctx.currentTime,
      0.05,
    );
    this.windEnvelope.gain.setTargetAtTime(
      winding ? 0.9 : 0,
      this.ctx.currentTime,
      winding ? 0.09 : 0.035,
    );
    this.motor.frequency.setTargetAtTime(
      winding ? 155 : 72,
      this.ctx.currentTime,
      0.08,
    );
  }
  createWinding() {
    this.mechanisms = new MechanismSounds(this.ctx, this.master, this.noiseBuffer);
    this.windEnvelope = this.mechanisms.windEnvelope;
  }
  setSpoolPosition(fraction) {
    this.spoolPosition = Math.max(0, Math.min(1, fraction));
    this.mechanisms?.position(this.spoolPosition);
  }
  sound(kind = "click") {
    if (!this.ctx) return;
    if (this.mechanisms?.play(kind)) return;
    const c = this.ctx,
      now = c.currentTime;
    // Two separate impacts: the latch catches, then its spring bounces back.
    const taps =
      kind === "click"
        ? [
            { at: 0, duration: 0.024, frequency: 1850, volume: 0.3 },
            { at: 0.029, duration: 0.052, frequency: 630, volume: 0.2 },
          ]
        : [
            {
              at: 0,
              duration:
                kind === "door"
                  ? 0.18
                  : kind === "flip"
                    ? 0.16
                    : kind === "seat"
                      ? 0.11
                      : 0.25,
              frequency:
                kind === "door"
                  ? 480
                  : kind === "flip"
                    ? 1100
                    : kind === "seat"
                      ? 620
                      : 1800,
              volume: kind === "flip" ? 0.075 : kind === "squeak" ? 0.06 : 0.3,
            },
          ];
    for (const tap of taps) {
      const when = now + tap.at,
        squeak = kind === "squeak";
      const src = squeak ? c.createOscillator() : c.createBufferSource();
      if (squeak) {
        src.type = "sine";
        src.frequency.setValueAtTime(1650, when);
        src.frequency.exponentialRampToValueAtTime(340, when + tap.duration);
      } else src.buffer = this.noiseBuffer;
      const filter = c.createBiquadFilter(),
        gain = c.createGain();
      filter.type = "bandpass";
      filter.frequency.value = tap.frequency;
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(tap.volume, when);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + tap.duration);
      src.connect(filter).connect(gain).connect(this.master);
      src.start(when);
      src.stop(when + tap.duration);
      src.onended = () => {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
  }
  delta() {
    if (!this.ctx) return 0;
    const now = this.ctx.currentTime,
      d = Math.max(0, now - this.clock);
    this.clock = now;
    return d;
  }
  level() {
    if (!this.ctx || this.mode !== "playing") return 0;
    const a = new Uint8Array(128);
    this.analyser.getByteTimeDomainData(a);
    return Math.sqrt(
      a.reduce((s, x) => s + ((x - 128) / 128) ** 2, 0) / a.length,
    );
  }
}
