export class TapeTransport {
  constructor(memory = {}) {
    this.memory = memory && typeof memory === "object" ? memory : {};
    this.tape = null;
    this.side = "A";
    this.position = 0;
    this.open = false;
    this.mode = "stopped";
  }
  get duration() {
    return this.tape?.sides[this.side]?.duration || 0;
  }
  remember() {
    if (!this.tape) return;
    this.memory[this.tape.id] = {
      ...this.memory[this.tape.id],
      [this.side]: this.position,
      side: this.side,
    };
  }
  restore() {
    const n = Number(this.memory[this.tape.id]?.[this.side]);
    this.position = Number.isFinite(n)
      ? Math.max(0, Math.min(this.duration, n))
      : 0;
  }
  insert(tape) {
    if (!this.open || this.tape) return false;
    this.tape = tape;
    this.side = this.memory[tape.id]?.side === "B" ? "B" : "A";
    this.restore();
    return true;
  }
  eject() {
    if (!this.open || !this.tape) return null;
    this.remember();
    const tape = this.tape;
    this.tape = null;
    this.position = 0;
    return tape;
  }
  door() {
    if (this.mode !== "stopped") return false;
    this.open = !this.open;
    return true;
  }
  play() {
    if (!this.tape || this.open || this.position >= this.duration) return false;
    this.mode = "playing";
    return true;
  }
  pause() {
    if (this.mode === "playing") this.mode = "paused";
    else if (this.mode === "paused") this.play();
  }
  stop() {
    this.mode = "stopped";
    this.remember();
  }
  wind(direction) {
    if (!this.tape || this.open) return false;
    this.mode = direction < 0 ? "rewinding" : "forwarding";
    return true;
  }
  flip() {
    if (!this.tape || !this.open) return false;
    const atEnd = this.duration > 0 && this.position >= this.duration;
    this.remember();
    this.side = this.side === "A" ? "B" : "A";
    if (atEnd) {
      this.position = 0;
      this.remember();
    } else {
      this.restore();
    }
    return true;
  }
  tick(seconds) {
    const speed =
      { playing: 1, forwarding: 12, rewinding: -12 }[this.mode] || 0;
    if (!speed || !Number.isFinite(seconds) || seconds < 0) return false;
    this.position = Math.max(
      0,
      Math.min(this.duration, this.position + seconds * speed),
    );
    if (
      (speed > 0 && this.position >= this.duration) ||
      (speed < 0 && this.position <= 0)
    ) {
      this.stop();
      return true;
    }
    return false;
  }
  snapshot() {
    this.remember();
    return this.memory;
  }
}
