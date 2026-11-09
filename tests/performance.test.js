import test from "node:test";
import assert from "node:assert/strict";
import { AdaptiveQuality } from "../src/performance.js";

function observe(governor, count, ms) {
  for (let i = 0; i < count; i += 1) governor.sample(ms);
  return governor.state;
}

test("uses conservative device hints and complete rendering budgets", () => {
  assert.deepEqual(new AdaptiveQuality().state, {
    tier: "medium",
    fps: 60,
    renderScale: 0.75,
    uiInterval: 80,
    effects: "balanced",
  });
  assert.deepEqual(new AdaptiveQuality({ cores: 2, memory: 8 }).state, {
    tier: "low",
    fps: 30,
    renderScale: 0.5,
    uiInterval: 120,
    effects: "reduced",
  });
  assert.equal(new AdaptiveQuality({ cores: 12, memory: 2 }).state.tier, "low");
  assert.equal(
    new AdaptiveQuality({ cores: 12, memory: 16, saveData: true }).state.tier,
    "low",
  );
  assert.equal(new AdaptiveQuality({ cores: 12 }).state.tier, "medium");
  assert.deepEqual(new AdaptiveQuality({ cores: 8, memory: 8 }).state, {
    tier: "high",
    fps: 60,
    renderScale: 1,
    uiInterval: 50,
    effects: "full",
  });
});

test("ignores brief stalls but reduces quality under sustained missed frames", () => {
  const quality = new AdaptiveQuality({ cores: 8, memory: 8 });
  observe(quality, 10, 50);
  assert.equal(quality.state.tier, "high");
  observe(quality, 60, 50);
  assert.equal(quality.state.tier, "medium");
  observe(quality, 60, 50);
  assert.equal(quality.state.tier, "low");
});

test("recovers one tier only after long stable headroom and resists cadence flapping", () => {
  const quality = new AdaptiveQuality({ cores: 2 });
  observe(quality, 300, 16);
  assert.equal(quality.state.tier, "low");
  observe(quality, 500, 16);
  assert.equal(quality.state.tier, "medium");
  observe(quality, 800, 16);
  assert.equal(quality.state.tier, "high");
  for (let i = 0; i < 1000; i += 1) {
    quality.sample(20);
    quality.sample(16);
  }
  assert.equal(quality.state.tier, "high");
});

test("pause gaps and explicit resets discard accumulated pressure", () => {
  const quality = new AdaptiveQuality({ cores: 8, memory: 8 });
  observe(quality, 30, 50);
  quality.sample(5000);
  observe(quality, 15, 50);
  assert.equal(quality.state.tier, "high");
  quality.resetSamples();
  observe(quality, 30, 50);
  assert.equal(quality.state.tier, "high");
  for (const ms of [NaN, Infinity, 0, -10]) quality.sample(ms);
  assert.equal(quality.state.tier, "high");
});

test("explicit overrides hold their budgets and auto resumes the learned tier", () => {
  const quality = new AdaptiveQuality();
  assert.equal(quality.setOverride("high").tier, "high");
  observe(quality, 1000, 100);
  assert.equal(quality.state.tier, "high");
  assert.equal(quality.setOverride("low").fps, 30);
  assert.equal(quality.setOverride("medium").renderScale, 0.75);
  assert.equal(quality.setOverride("auto").tier, "medium");
  assert.throws(() => quality.setOverride("invalid"), RangeError);
  const state = quality.state;
  assert.throws(() => {
    state.tier = "low";
  }, TypeError);
  assert.equal(quality.state.tier, "medium");
});

test("sustained sub-30 fps pressure reduces materials even at 29 fps", () => {
  const quality = new AdaptiveQuality();
  observe(quality, 65, 1000 / 29);
  assert.equal(quality.state.tier, "low");
  assert.equal(quality.state.fps, 30);
});

test("mixed slow frames reduce quality instead of resetting pressure every fast frame", () => {
  const q = new AdaptiveQuality({ cores: 8, memory: 8 });
  for (let i = 0; i < 120; i++) {
    q.sample(45);
    q.sample(16);
  }
  assert.notEqual(q.state.tier, "high");
});
test("sustained overload at minimum resolution drops decoration and later recovers", () => {
  const q = new AdaptiveQuality({ cores: 2 });
  observe(q, 200, 45);
  assert.equal(q.state.effects, "minimal");
  assert.equal(q.state.fps, 30);
  observe(q, 1000, 16);
  assert.notEqual(q.state.effects, "minimal");
});

test("frame pacing tolerates fractional browser timestamps at the 30 FPS boundary", async () => {
  const { frameDue } = await import("../src/performance.js");
  assert.equal(frameDue(33.3, 0, 30), true);
  assert.equal(frameDue(16.7, 0, 30), false);
  assert.equal(frameDue(16.6, 0, 60), true);
  assert.equal(frameDue(1000, 0, 0), false);
});
