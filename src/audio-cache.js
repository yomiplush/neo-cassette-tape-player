const MiB = 1024 * 1024;
export function audioBudget({ cores, memory } = {}) {
  const low = (cores > 0 && cores <= 2) || (memory > 0 && memory <= 2);
  return Object.freeze({
    maxBytes: (low ? 48 : memory >= 8 ? 128 : 80) * MiB,
    maxEntries: 2,
    sampleRate: low ? 32000 : undefined,
  });
}

// Only decoded PCM is retained here. The active Web Audio source owns its buffer
// independently, so an oversized side can play without defeating the cache limit.
export class AudioBufferCache {
  #entries = new Map();
  #bytes = 0;
  constructor({ maxBytes = 80 * MiB, maxEntries = 2 } = {}) {
    this.maxBytes = maxBytes;
    this.maxEntries = maxEntries;
  }
  get size() {
    return this.#entries.size;
  }
  get bytes() {
    return this.#bytes;
  }
  has(key) {
    return this.#entries.has(key);
  }
  get(key) {
    const item = this.#entries.get(key);
    if (!item) return;
    this.#entries.delete(key);
    this.#entries.set(key, item);
    return item.buffer;
  }
  delete(key) {
    const item = this.#entries.get(key);
    if (!item) return false;
    this.#bytes -= item.bytes;
    return this.#entries.delete(key);
  }
  clear() {
    this.#entries.clear();
    this.#bytes = 0;
  }
  set(key, buffer) {
    this.delete(key);
    const bytes = buffer.length * buffer.numberOfChannels * 4;
    if (bytes > this.maxBytes) {
      this.clear();
      return this;
    }
    while (
      this.size &&
      (this.size >= this.maxEntries || this.#bytes + bytes > this.maxBytes)
    )
      this.delete(this.#entries.keys().next().value);
    this.#entries.set(key, { buffer, bytes });
    this.#bytes += bytes;
    return this;
  }
}
