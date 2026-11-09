import test from "node:test";
import assert from "node:assert/strict";
import { TapeTransport } from "../src/transport.js";
const tape = {
  id: "test",
  sides: { A: { duration: 60 }, B: { duration: 40 } },
};
test("empty deck cannot play and insertion requires open door", () => {
  const t = new TapeTransport();
  assert.equal(t.play(), false);
  assert.equal(t.insert(tape), false);
  t.door();
  assert.equal(t.insert(tape), true);
  assert.equal(t.play(), false);
  t.door();
  assert.equal(t.play(), true);
});
test("pause and stop retain position, playing locks the door", () => {
  const t = new TapeTransport();
  t.door();
  t.insert(tape);
  t.door();
  t.play();
  t.tick(10);
  assert.equal(t.door(), false);
  t.pause();
  t.tick(10);
  assert.equal(t.position, 10);
  t.stop();
  assert.equal(t.position, 10);
  assert.equal(t.door(), true);
  assert.equal(t.eject().id, "test");
});
test("wind clamps at each end and triggers auto stop", () => {
  const t = new TapeTransport();
  t.door();
  t.insert(tape);
  t.door();
  t.wind(1);
  t.tick(10);
  assert.equal(t.position, 60);
  assert.equal(t.mode, "stopped");
  t.wind(-1);
  t.tick(10);
  assert.equal(t.position, 0);
  assert.equal(t.mode, "stopped");
});
test("flip and reinsertion remember each side independently", () => {
  const t = new TapeTransport();
  t.door();
  t.insert(tape);
  t.door();
  t.play();
  t.tick(12);
  t.stop();
  t.door();
  t.flip();
  t.door();
  t.play();
  t.tick(7);
  t.stop();
  t.door();
  t.eject();
  t.insert(tape);
  assert.equal(t.side, "B");
  assert.equal(t.position, 7);
  t.flip();
  assert.equal(t.position, 12);
});
test("finite playback ends without automatically flipping or looping", () => {
  const t = new TapeTransport();
  t.door();
  t.insert(tape);
  t.door();
  t.play();
  assert.equal(t.tick(65), true);
  assert.equal(t.position, 60);
  assert.equal(t.side, "A");
  assert.equal(t.mode, "stopped");
  assert.equal(t.play(), false);
});
test("invalid saved positions are clamped and invalid side ignored", () => {
  const t = new TapeTransport({ test: { A: 999, B: -9, side: "C" } });
  t.door();
  t.insert(tape);
  assert.equal(t.side, "A");
  assert.equal(t.position, 60);
  t.flip();
  assert.equal(t.position, 0);
});
