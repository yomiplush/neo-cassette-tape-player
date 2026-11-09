// Original Web Audio tape model. Everything, including mechanisms, passes through master.
export class CassetteAudio {
  constructor() {
    this.volume = 0.65;
    this.wear = 0.5;
    this.cache = new Map();
    this.mode = "stopped";
    this.clock = 0;
  }
  async unlock() {
    if (!this.ctx) this.create();
    if (this.ctx.state !== "running") await this.ctx.resume();
  }
  create() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error("このブラウザは Web Audio に対応していません。");
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
    filter.frequency.value = 1700;
    noise.connect(filter).connect(this.hiss).connect(this.master);
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
    this.dropTimer = setInterval(() => {
      if (this.mode !== "playing" || c.state !== "running") return;
      const now = c.currentTime;
      const amount = 0.04 + this.wear * 0.45;
      this.dropout.gain.cancelScheduledValues(now);
      this.dropout.gain.setValueAtTime(1, now);
      this.dropout.gain.linearRampToValueAtTime(1 - amount, now + 0.035);
      this.dropout.gain.linearRampToValueAtTime(
        1,
        now + 0.12 + this.wear * 0.12,
      );
    }, 4200);
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
  setWear(value) {
    this.wear = Math.max(0, Math.min(1, value));
    if (!this.ctx) return;
    const w = this.wear,
      now = this.ctx.currentTime;
    this.lowpass.frequency.setTargetAtTime(7300 - w * 3800, now, 0.1);
    const curve = new Float32Array(2048),
      drive = 1.25 + w * 2;
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / (curve.length - 1) - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    this.saturator.curve = curve;
    this.lfos[0].gain.setTargetAtTime(0.0003 + w * 0.0015, now, 0.1);
    this.lfos[1].gain.setTargetAtTime(0.000025 + w * 0.00011, now, 0.1);
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
        throw new Error("音源を読み込めませんでした。接続を確認してください。");
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
    this.mode = mode;
    if (mode !== "playing") this.stopSource();
    this.ambience();
    this.setSpoolPosition(this.spoolPosition ?? 0.5);
  }
  ambience() {
    if (!this.ctx) return;
    const running = ["playing", "forwarding", "rewinding"].includes(this.mode),
      winding = this.mode.endsWith("ing") && this.mode !== "playing";
    this.hiss.gain.setTargetAtTime(
      running ? (winding ? 0.008 : 0.007 + this.wear * 0.022) : 0,
      this.ctx.currentTime,
      0.05,
    );
    this.motorGain.gain.setTargetAtTime(
      running ? (winding ? 0.012 : 0.003) : 0,
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
    const c = this.ctx;
    this.windEnvelope = c.createGain();
    this.windEnvelope.gain.value = 0;
    const wheel = c.createGain();
    wheel.gain.value = 0.8;
    wheel.connect(this.windEnvelope).connect(this.master);
    this.windTones = [];
    for (const [frequency, type, volume] of [
      [125, "sawtooth", 0.18],
      [465, "sine", 0.045],
      [980, "sine", 0.022],
    ]) {
      const osc = c.createOscillator(),
        gain = c.createGain(),
        filter = c.createBiquadFilter();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = volume;
      filter.type = "lowpass";
      filter.frequency.value = 2300;
      osc.connect(filter).connect(gain).connect(wheel);
      osc.start();
      this.windTones.push({ osc, frequency });
    }
    const gear = c.createOscillator(),
      pulse = c.createGain(),
      wobble = c.createGain();
    gear.type = "triangle";
    gear.frequency.value = 17.5;
    pulse.gain.value = 0.19;
    wobble.gain.value = 24;
    gear.connect(pulse).connect(wheel.gain);
    gear.connect(wobble).connect(this.windTones[1].osc.frequency);
    gear.start();
    const friction = c.createBufferSource(),
      band = c.createBiquadFilter(),
      frictionGain = c.createGain();
    friction.buffer = this.noiseBuffer;
    friction.loop = true;
    band.type = "bandpass";
    band.frequency.value = 1450;
    band.Q.value = 0.75;
    frictionGain.gain.value = 0.07;
    friction.connect(band).connect(frictionGain).connect(wheel);
    friction.start();
  }
  setSpoolPosition(fraction) {
    this.spoolPosition = Math.max(0, Math.min(1, fraction));
    if (!this.ctx || !["forwarding", "rewinding"].includes(this.mode)) return;
    const reverse = this.mode === "rewinding";
    const ratio =
      (0.88 + 0.28 * (reverse ? 1 - this.spoolPosition : this.spoolPosition)) *
      (reverse ? 1.07 : 1);
    for (const { osc, frequency } of this.windTones)
      osc.frequency.setTargetAtTime(
        frequency * ratio,
        this.ctx.currentTime,
        0.12,
      );
  }
  sound(kind = "click") {
    if (!this.ctx) return;
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
