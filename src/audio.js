import { AudioBufferCache, audioBudget } from "./audio-cache.js";
import { MechanismSounds } from "./mechanisms.js";
// Original Web Audio tape model. Everything, including mechanisms, passes through master.
export class CassetteAudio {
  constructor(
    hints = {
      cores: globalThis.navigator?.hardwareConcurrency,
      memory: globalThis.navigator?.deviceMemory,
    },
  ) {
    this.volume = 0.65;
    this.wear = 0.5;
    this.profile = "archive";
    this.budget = audioBudget(hints);
    this.cache = new AudioBufferCache(this.budget);
    this.pending = new Map();
    this.controllers = new Set();
    this.transients = new Set();
    this.oscillators = [];
    this.disposed = false;
    this.dropTimer = null;
    this.meterSamples = new Uint8Array(128);
    this.idleTimer = null;
    this.mode = "stopped";
    this.clock = 0;
  }
  async unlock() {
    if (this.disposed)
      throw new DOMException("Audio was disposed", "AbortError");
    clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (!this.ctx) this.create();
    if (this.ctx.state !== "running") await this.ctx.resume();
    this.mechanisms.preload().catch(() => {});
    this.scheduleIdle();
  }
  create() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error("This browser does not support Web Audio.");
    if (this.disposed)
      throw new DOMException("Audio was disposed", "AbortError");
    try {
      this.ctx = new Ctx({
        latencyHint: "balanced",
        ...(this.budget.sampleRate
          ? { sampleRate: this.budget.sampleRate }
          : {}),
      });
    } catch {
      this.ctx = new Ctx();
    }
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
      this.oscillators.push(osc);
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
    const hissCeiling = c.createBiquadFilter();
    hissCeiling.type = "lowpass";
    hissCeiling.frequency.value = 10800;
    noise
      .connect(filter)
      .connect(hissCeiling)
      .connect(this.hiss)
      .connect(this.master);
    noise.start();
    this.noise = noise;
    this.hissFilters = [filter, hissCeiling];
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
      if (this.disposed) return;
      if (
        this.mode === "playing" &&
        c.state === "running" &&
        Math.random() < this.wear
      ) {
        const now = c.currentTime,
          amount = 0.01 + this.wear * 0.15;
        this.dropout.gain.cancelScheduledValues(now);
        this.dropout.gain.setValueAtTime(1, now);
        this.dropout.gain.linearRampToValueAtTime(1 - amount, now + 0.025);
        this.dropout.gain.linearRampToValueAtTime(
          1,
          now + 0.09 + Math.random() * 0.12,
        );
      }
      this.dropTimer = setTimeout(dropout, 5000 + Math.random() * 9000);
    };
    this.dropTimer = setTimeout(dropout, 5000 + Math.random() * 9000);
  }

  scheduleIdle() {
    clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (
      this.disposed ||
      !this.ctx ||
      typeof this.ctx.startRendering === "function" ||
      !["stopped", "paused"].includes(this.mode)
    )
      return;
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      if (this.disposed || !["stopped", "paused"].includes(this.mode)) return;
      if (this.pending.size || this.controllers.size) {
        this.scheduleIdle();
        return;
      }
      if (this.ctx.state === "running") void this.ctx.suspend().catch(() => {});
    }, 1000);
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
    this.profile = ["light", "medium", "heavy"].includes(name)
      ? name
      : "archive";
    this.setWear(this.wear);
  }
  setWear(value) {
    this.wear = Math.max(0, Math.min(1, value));
    if (!this.ctx) return;
    const w = this.wear,
      now = this.ctx.currentTime;
    // Tone targets adapted from YomiPlush's MIT youtube-cassette-filter presets.
    // Retain this engine's restrained instability and independent mechanism recordings.
    const tone = {
      archive: [65, 7300, 3800, 1.25, 2, 1],
      light: [50, 9000, 1200, 2.2, 0.6, 0.85],
      medium: [80, 6200, 1400, 3.6, 0.8, 1.15],
      heavy: [110, 4200, 1300, 5.5, 1, 1.4],
    }[this.profile];
    this.highpass.frequency.setTargetAtTime(tone[0], now, 0.1);
    this.lowpass.frequency.setTargetAtTime(tone[1] - w * tone[2], now, 0.1);
    const curve = new Float32Array(2048),
      drive = tone[3] + w * tone[4];
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / (curve.length - 1) - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    this.saturator.curve = curve;
    this.lfos[0].gain.setTargetAtTime(
      (0.00012 + w * 0.00075) * tone[5],
      now,
      0.1,
    );
    this.lfos[1].gain.setTargetAtTime(
      (0.000008 + w * 0.000045) * tone[5],
      now,
      0.1,
    );
    this.ambience();
  }
  async decode(id, data, { signal } = {}) {
    if (this.disposed || signal?.aborted)
      throw signal?.reason || new DOMException("Aborted", "AbortError");
    if (this.cache.has(id)) return this.cache.get(id);
    let job = this.pending.get(id);
    if (!job) {
      // Web Audio consumes the compressed ArrayBuffer; copying it doubles peak input memory.
      job = this.ctx.decodeAudioData(data);
      this.pending.set(id, job);
    }
    try {
      const buffer = await job;
      if (this.disposed || signal?.aborted)
        throw signal?.reason || new DOMException("Aborted", "AbortError");
      this.cache.set(id, buffer);
      return buffer;
    } finally {
      if (this.pending.get(id) === job) this.pending.delete(id);
    }
  }
  async load(side, signal) {
    if (this.disposed || signal?.aborted)
      throw signal?.reason || new DOMException("Aborted", "AbortError");
    const key = side.key || side.url;
    if (this.cache.has(key)) return this.cache.get(key);
    const controller = new AbortController(),
      abort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", abort, { once: true });
    this.controllers.add(controller);
    try {
      let data;
      if (side.blob) data = await side.blob.arrayBuffer();
      else {
        const res = await fetch(side.url, { signal: controller.signal });
        if (!res.ok)
          throw new Error("Could not load audio. Check your connection.");
        data = await res.arrayBuffer();
      }
      return await this.decode(key, data, { signal: controller.signal });
    } finally {
      signal?.removeEventListener("abort", abort);
      this.controllers.delete(controller);
    }
  }
  evict(tape) {
    for (const side of Object.values(tape.sides))
      this.cache.delete(side.key || side.url);
  }
  dispose() {
    if (this.disposal) return this.disposal;
    this.disposed = true;
    clearTimeout(this.dropTimer);
    this.dropTimer = null;
    clearTimeout(this.idleTimer);
    this.idleTimer = null;
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
    this.stopSource();
    this.onPlaybackEnd = null;
    this.mode = "stopped";
    this.mechanisms?.dispose();
    for (const { source, nodes } of this.transients) {
      source.onended = null;
      try {
        source.stop();
      } catch {}
      for (const node of nodes) node.disconnect();
    }
    this.transients.clear();
    for (const source of [...this.oscillators, this.noise, this.motor].filter(
      Boolean,
    )) {
      try {
        source.stop();
      } catch {}
      source.disconnect();
    }
    for (const node of [
      this.master,
      this.limiter,
      this.input,
      this.highpass,
      this.lowpass,
      this.saturator,
      this.delay,
      this.dropout,
      this.envelope,
      this.analyser,
      this.hiss,
      this.motorGain,
      ...(this.lfos || []),
      ...(this.hissFilters || []),
    ].filter(Boolean))
      node.disconnect();
    this.oscillators = [];
    this.noiseBuffer = null;
    this.cache.clear();
    this.pending.clear();
    this.disposal =
      this.ctx &&
      this.ctx.state !== "closed" &&
      typeof this.ctx.close === "function"
        ? this.ctx.close().catch(() => {})
        : Promise.resolve();
    return this.disposal;
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
      this.source.onended = null;
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
    if (
      mode === "stopped" &&
      ["playing", "forwarding", "rewinding"].includes(previous)
    )
      this.sound("stop");
    if (mode !== "playing") this.stopSource();
    this.ambience();
    this.setSpoolPosition(this.spoolPosition ?? 0.5);
    this.scheduleIdle();
  }
  ambience() {
    if (!this.ctx) return;
    const running = ["playing", "forwarding", "rewinding"].includes(this.mode),
      winding = this.mode.endsWith("ing") && this.mode !== "playing";
    this.hiss.gain.setTargetAtTime(
      running
        ? winding
          ? 0.0015
          : (0.004 + this.wear * 0.012) *
            { archive: 1, light: 0.75, medium: 1.2, heavy: 1.65 }[this.profile]
        : 0,
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
    this.mechanisms = new MechanismSounds(
      this.ctx,
      this.master,
      this.noiseBuffer,
    );
    this.windEnvelope = this.mechanisms.windEnvelope;
  }
  setSpoolPosition(fraction) {
    this.spoolPosition = Math.max(0, Math.min(1, fraction));
    this.mechanisms?.position(this.spoolPosition);
  }
  sound(kind = "click") {
    if (!this.ctx || this.disposed) return;
    this.scheduleIdle();
    if (this.mechanisms?.play(kind)) return;
    if (this.transients.size >= 24) return;
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
      const transient = { source: src, nodes: [src, filter, gain] };
      this.transients.add(transient);
      src.onended = () => {
        this.transients.delete(transient);
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
    const a = this.meterSamples;
    this.analyser.getByteTimeDomainData(a);
    return Math.sqrt(
      a.reduce((s, x) => s + ((x - 128) / 128) ** 2, 0) / a.length,
    );
  }
}
