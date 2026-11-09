import { test, expect } from "@playwright/test";
test("real rendered tape signal rolls off highs, adds hiss, and obeys master mute", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { CassetteAudio } = await import("/src/audio.js");
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends OfflineAudioContext {
      constructor() {
        super(2, 44100, 44100);
      }
    };
    async function render(frequency, mute = false, silent = false) {
      const a = new CassetteAudio();
      a.create();
      a.setVolume(mute ? 0 : 1);
      if (silent) a.setMode("playing");
      else {
        const b = a.ctx.createBuffer(1, 44100, 44100),
          d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++)
          d[i] = 0.3 * Math.sin((i * 2 * Math.PI * frequency) / 44100);
        a.start(b, 0);
      }
      const b = await a.ctx.startRendering();
      clearInterval(a.dropTimer);
      const d = b.getChannelData(0);
      let sum = 0;
      for (let i = 22050; i < d.length; i++) sum += d[i] ** 2;
      return Math.sqrt(sum / (d.length - 22050));
    }
    const result = {
      mid: await render(1000),
      high: await render(14000),
      hiss: await render(0, false, true),
      muted: await render(1000, true),
    };
    window.AudioContext = NativeAudioContext;
    return result;
  });
  expect(result.mid).toBeGreaterThan(0.1);
  expect(result.high).toBeLessThan(result.mid * 0.4);
  expect(result.hiss).toBeGreaterThan(0.002);
  expect(result.muted).toBeLessThan(0.000001);
});
test("fast winding makes a sustained mechanical rumble and stops cleanly", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { CassetteAudio } = await import("/src/audio.js");
    const Native = window.AudioContext;
    window.AudioContext = class extends OfflineAudioContext {
      constructor() {
        super(2, 88200, 44100);
      }
    };
    async function run(mode, stop) {
      const a = new CassetteAudio();
      a.create();
      a.setVolume(1);
      a.setMode(mode);
      const paused = stop ? a.ctx.suspend(0.8) : null;
      const rendering = a.ctx.startRendering();
      if (paused) {
        await paused;
        a.setMode("stopped");
        await a.ctx.resume();
      }
      const b = await rendering;
      clearInterval(a.dropTimer);
      const d = b.getChannelData(0);
      let sum = 0;
      for (let i = 57330; i < 70560; i++) sum += d[i] ** 2;
      return Math.sqrt(sum / (70560 - 57330));
    }
    const value = {
      forward: await run("forwarding", false),
      reverse: await run("rewinding", false),
      stopped: await run("forwarding", true),
    };
    window.AudioContext = Native;
    return value;
  });
  expect(result.forward).toBeGreaterThan(0.018);
  expect(result.reverse).toBeGreaterThan(0.018);
  expect(result.stopped).toBeLessThan(0.0001);
});
