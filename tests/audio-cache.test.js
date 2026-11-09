import test from "node:test";
import assert from "node:assert/strict";
import { AudioBufferCache, audioBudget } from "../src/audio-cache.js";
const buffer = (bytes) => ({ length: bytes / 4, numberOfChannels: 1 });
test("decoded buffers stay byte bounded and recently used sides survive eviction", () => {
  const c = new AudioBufferCache({ maxBytes: 100, maxEntries: 2 });
  c.set("a", buffer(40));
  c.set("b", buffer(40));
  c.get("a");
  c.set("c", buffer(40));
  assert.equal(c.has("b"), false);
  assert.equal(c.has("a"), true);
  assert.equal(c.bytes, 80);
  c.set("huge", buffer(104));
  assert.equal(c.size, 0);
  assert.equal(c.bytes, 0);
  c.set("a", buffer(40));
  c.set("a", buffer(60));
  assert.equal(c.bytes, 60);
  c.delete("a");
  assert.equal(c.bytes, 0);
  c.clear();
  assert.equal(c.bytes, 0);
});
test("low-memory audio uses a smaller cache and processing rate without removing effects", () => {
  assert.equal(audioBudget({ cores: 2, memory: 2 }).sampleRate, 32000);
  assert.equal(audioBudget({ cores: 2, memory: 2 }).maxBytes, 48 * 1024 * 1024);
  assert.equal(
    audioBudget({ cores: 8, memory: 8 }).maxBytes,
    128 * 1024 * 1024,
  );
  assert.equal(audioBudget({}).sampleRate, undefined);
});
