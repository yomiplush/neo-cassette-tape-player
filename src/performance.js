const TIERS = ['low', 'medium', 'high'];
const BUDGETS = {
  low: { fps: 30, renderScale: 0.5, uiInterval: 120 },
  medium: { fps: 60, renderScale: 0.75, uiInterval: 80 },
  high: { fps: 60, renderScale: 1, uiInterval: 50 },
};

/** Rendering policy only: sample every visible rAF, independently of render throttling. */
export class AdaptiveQuality {
  #tier;
  #override = 'auto';
  #slowMs = 0;
  #fastMs = 0;

  constructor({ cores, memory, saveData } = {}) {
    const knownCores = Number.isFinite(cores) && cores > 0;
    const knownMemory = Number.isFinite(memory) && memory > 0;
    this.#tier = saveData || (knownCores && cores <= 2) || (knownMemory && memory <= 2)
      ? 'low'
      : knownCores && knownMemory && cores >= 8 && memory >= 8 ? 'high' : 'medium';
  }

  get state() {
    const tier = this.#override === 'auto' ? this.#tier : this.#override;
    return { tier, ...BUDGETS[tier] };
  }

  resetSamples() {
    this.#slowMs = 0;
    this.#fastMs = 0;
  }

  setOverride(tier) {
    if (tier !== 'auto' && !TIERS.includes(tier)) throw new RangeError('Unknown quality tier');
    this.#override = tier;
    this.resetSamples();
    return this.state;
  }

  sample(frameMs) {
    // Background/resume gaps are not evidence about visible rendering capacity.
    if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 250) {
      this.resetSamples();
      return this.state;
    }
    if (this.#override !== 'auto') return this.state;

    // Two seconds of consecutive pressure drops one tier. Recovery requires twelve
    // seconds of stricter headroom, so occasional stalls cannot make quality flap.
    const slowThreshold = this.#tier === 'high' ? 24 : 1000 / 30;
    const fastThreshold = this.#tier === 'low' ? 25 : 19;
    this.#slowMs = frameMs > slowThreshold ? Math.min(2000, this.#slowMs + frameMs) : 0;
    this.#fastMs = frameMs < fastThreshold ? Math.min(12000, this.#fastMs + frameMs) : 0;
    const index = TIERS.indexOf(this.#tier);
    if (this.#slowMs >= 2000 && index > 0) {
      this.#tier = TIERS[index - 1];
      this.resetSamples();
    } else if (this.#fastMs >= 12000 && index < TIERS.length - 1) {
      this.#tier = TIERS[index + 1];
      this.resetSamples();
    }
    return this.state;
  }
}
