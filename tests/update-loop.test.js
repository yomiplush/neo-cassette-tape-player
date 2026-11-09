import test from "node:test";
import assert from "node:assert/strict";
import { createUpdateLoop } from "../src/update-loop.js";
test("idle has no timer, wakes coalesce, pause and disposal cannot resurrect work", () => {
  let id = 0,
    active = false,
    calls = 0;
  const tasks = new Map();
  const clock = {
    setTimeout(fn) {
      tasks.set(++id, fn);
      return id;
    },
    clearTimeout(id) {
      tasks.delete(id);
    },
  };
  const loop = createUpdateLoop(
    {
      update() {
        calls++;
        loop.wake();
      },
      active: () => active,
      delay: () => 50,
    },
    clock,
  );
  const tick = () => {
    const [id, fn] = tasks.entries().next().value;
    tasks.delete(id);
    fn();
  };
  loop.wake();
  loop.wake();
  assert.equal(tasks.size, 1);
  tick();
  assert.equal(tasks.size, 0);
  assert.equal(calls, 1);
  active = true;
  loop.wake();
  tick();
  assert.equal(tasks.size, 1);
  loop.pause();
  assert.equal(tasks.size, 0);
  loop.wake();
  assert.equal(tasks.size, 0);
  loop.resume();
  assert.equal(tasks.size, 1);
  loop.dispose();
  loop.resume();
  loop.wake();
  assert.equal(tasks.size, 0);
});
