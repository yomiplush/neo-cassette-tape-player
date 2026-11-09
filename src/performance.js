const TIERS = ["low", "medium", "high"];
const BUDGETS = {
  low: { fps: 30, renderScale: 0.5, uiInterval: 120, effects: "reduced" },
  medium: { fps: 60, renderScale: 0.75, uiInterval: 80, effects: "balanced" },
  high: { fps: 60, renderScale: 1, uiInterval: 50, effects: "full" },
};
/** Policy only. Use unthrottled visible rAF intervals, never the audio clock. */
export class AdaptiveQuality {
  #tier;
  #override = "auto";
  #slowMs = 0;
  #fastMs = 0;
  #windowMs = 0;
  #frames = 0;
  #minimal = false;
  #snapshot;
  #key = "";
  constructor({ cores, memory, saveData } = {}) {
    this.#tier =
      saveData || (cores > 0 && cores <= 2) || (memory > 0 && memory <= 2)
        ? "low"
        : cores >= 8 && memory >= 8
          ? "high"
          : "medium";
  }
  get state() {
    const tier = this.#override === "auto" ? this.#tier : this.#override;
    const minimal = this.#override === "auto" && this.#minimal;
    const key = tier + minimal;
    if (key !== this.#key) {
      this.#key = key;
      this.#snapshot = Object.freeze({
        tier,
        ...BUDGETS[tier],
        ...(minimal ? { effects: "minimal", uiInterval: 200 } : {}),
      });
    }
    return this.#snapshot;
  }
  resetSamples() {
    this.#slowMs = 0;
    this.#fastMs = 0;
    this.#windowMs = 0;
    this.#frames = 0;
  }
  setOverride(tier) {
    if (tier !== "auto" && !TIERS.includes(tier))
      throw new RangeError("Unknown quality tier");
    this.#override = tier;
    this.resetSamples();
    return this.state;
  }
  sample(frameMs) {
    if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 1000) {
      this.resetSamples();
      return this.state;
    }
    if (this.#override !== "auto") return this.state;
    this.#windowMs += Math.min(frameMs, 250);
    this.#frames++;
    if (this.#windowMs < 1000) return this.state;
    const elapsed = this.#windowMs,
      average = elapsed / this.#frames;
    this.#windowMs = 0;
    this.#frames = 0;
    // Whole windows include mixed good/bad frames. Two slow seconds reduce detail;
    // twelve seconds of headroom restore one step, including from minimal effects.
    const slow =
      average >
      (this.#tier === "low" ? 1000 / 30 : this.#tier === "high" ? 21 : 24);
    this.#slowMs = slow ? this.#slowMs + elapsed : 0;
    this.#fastMs =
      average < (this.#tier === "low" ? 25 : 19) ? this.#fastMs + elapsed : 0;
    const index = TIERS.indexOf(this.#tier);
    if (this.#slowMs >= 2000 && index > 0) {
      this.#tier = TIERS[index - 1];
      this.resetSamples();
    } else if (this.#slowMs >= 4000 && index === 0 && !this.#minimal) {
      this.#minimal = true;
      this.resetSamples();
    } else if (
      this.#fastMs >= 12000 &&
      (index < TIERS.length - 1 || this.#minimal)
    ) {
      if (this.#minimal) this.#minimal = false;
      else this.#tier = TIERS[index + 1];
      this.resetSamples();
    }
    return this.state;
  }
}

// Browser rAF timestamps are rounded; exact 33.333ms comparisons otherwise turn
// a 30 FPS budget into 20 FPS by needlessly waiting for a third 60Hz frame.
export function frameDue(now, last, fps) {
  return fps > 0 && now - last >= 1000 / fps - 0.75;
}
