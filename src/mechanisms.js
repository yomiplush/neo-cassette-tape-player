// CC0 microphone recordings and an offline-safe stochastic fallback.
const clips = [
  "press",
  "stop",
  "door-open",
  "door-close",
  "wind-forward",
  "wind-reverse",
];
export class MechanismSounds {
  constructor(ctx, output, noise) {
    this.ctx = ctx;
    this.output = output;
    this.buffers = new Map();
    this.mode = "stopped";
    this.sources = new Set();
    this.controller = new AbortController();
    this.disposed = false;
    this.windEnvelope = ctx.createGain();
    this.windEnvelope.gain.value = 0;
    this.windEnvelope.connect(output);
    this.fallback = ctx.createGain();
    this.fallback.gain.value = 0.25;
    const source = ctx.createBufferSource(),
      band = ctx.createBiquadFilter(),
      low = ctx.createBiquadFilter();
    source.buffer = noise;
    source.loop = true;
    band.type = "bandpass";
    band.frequency.value = 610;
    band.Q.value = 0.55;
    low.type = "lowpass";
    low.frequency.value = 4200;
    source
      .connect(band)
      .connect(low)
      .connect(this.fallback)
      .connect(this.windEnvelope);
    source.start();
    this.fallbackSource = source;
    this.nodes = [source, band, low, this.fallback, this.windEnvelope];
  }
  preload() {
    if (this.disposed || this.buffers.size === clips.length)
      return Promise.resolve();
    if (!this.loading)
      this.loading = Promise.allSettled(
        clips
          .filter((name) => !this.buffers.has(name))
          .map(async (name) => {
            const r = await fetch(
              `${import.meta.env.BASE_URL}sfx/${name}.wav`,
              { signal: this.controller.signal },
            );
            if (!r.ok) throw new Error(`Mechanism asset: ${name}`);
            const buffer = await this.ctx.decodeAudioData(
              await r.arrayBuffer(),
            );
            if (this.disposed) return;
            this.buffers.set(name, buffer);
            if (
              this.isWinding() &&
              name ===
                (this.mode === "rewinding" ? "wind-reverse" : "wind-forward")
            )
              this.startLoop();
          }),
      )
        .then((results) => {
          const failed = results.find((r) => r.status === "rejected");
          if (failed) throw failed.reason;
        })
        .finally(() => {
          this.loading = null;
        });
    return this.loading;
  }
  track(source, gain) {
    const entry = { source, gain };
    this.sources.add(entry);
    const release = () => {
      source.onended = null;
      source.disconnect();
      gain.disconnect();
      this.sources.delete(entry);
    };
    source.onended = release;
    entry.release = release;
    return entry;
  }
  isWinding() {
    return this.mode === "forwarding" || this.mode === "rewinding";
  }
  setMode(mode) {
    if (this.disposed || this.mode === mode) return;
    this.mode = mode;
    if (this.isWinding()) this.startLoop();
    else this.stopLoop();
  }
  startLoop() {
    if (this.disposed) return;
    const buffer = this.buffers.get(
      this.mode === "rewinding" ? "wind-reverse" : "wind-forward",
    );
    this.stopLoop();
    if (!buffer) {
      this.fallback.gain.setTargetAtTime(0.25, this.ctx.currentTime, 0.04);
      return;
    }
    const source = this.ctx.createBufferSource(),
      gain = this.ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain).connect(this.windEnvelope);
    this.track(source, gain);
    source.start();
    gain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.08);
    this.fallback.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    this.loop = { source, gain };
    this.position(this.fraction ?? 0.5);
  }
  stopLoop() {
    if (!this.loop) return;
    const { source, gain } = this.loop;
    this.loop = null;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.025);
    source.stop(this.ctx.currentTime + 0.16);
  }
  position(fraction) {
    this.fraction = Math.max(0, Math.min(1, fraction));
    if (this.loop) {
      const p = this.mode === "rewinding" ? 1 - this.fraction : this.fraction;
      this.loop.source.playbackRate.setTargetAtTime(
        0.96 + 0.08 * p,
        this.ctx.currentTime,
        0.25,
      );
    }
  }
  play(kind) {
    if (this.disposed) return false;
    const key =
        { click: "press", seat: "press", door: "door-close" }[kind] || kind,
      buffer = this.buffers.get(key);
    if (!buffer) return false;
    if (this.sources.size >= 12) {
      const oldest = [...this.sources].find(
        (entry) => entry.source !== this.loop?.source,
      );
      if (oldest) {
        try {
          oldest.source.stop();
        } catch {}
        oldest.release();
      }
    }
    const source = this.ctx.createBufferSource(),
      gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = key === "press" ? 0.5 : key === "stop" ? 0.6 : 0.7;
    source.connect(gain).connect(this.output);
    this.track(source, gain);
    source.start();
    return true;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.abort();
    this.mode = "stopped";
    this.loop = null;
    for (const entry of this.sources) {
      try {
        entry.source.stop();
      } catch {}
      entry.release();
    }
    try {
      this.fallbackSource.stop();
    } catch {}
    for (const node of this.nodes) node.disconnect();
    this.buffers.clear();
    this.nodes = [];
  }
}
