import { test, expect } from "@playwright/test";

test("playing updates time without continuously replacing static tape labels", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("PLAY");
  const result = await page.evaluate(async () => {
    let changes = 0;
    const o = new MutationObserver((r) => (changes += r.length));
    for (const e of document.querySelectorAll(
      "#track-name,#current-title,#loaded-tape .tape-title,#status",
    ))
      o.observe(e, { childList: true, subtree: true, attributes: true });
    const before = document.querySelector("#track-time").textContent;
    await new Promise((r) => setTimeout(r, 2200));
    o.disconnect();
    return {
      changes,
      before,
      after: document.querySelector("#track-time").textContent,
    };
  });
  expect(result.changes).toBeLessThan(5);
  expect(result.after).not.toBe(result.before);
});

test("audio disposes sources, cache, pending decode results and context idempotently", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { CassetteAudio } = await import("/src/audio.js");
    const a = new CassetteAudio({ cores: 2, memory: 2 });
    await a.unlock();
    const sampleRate = a.ctx.sampleRate,
      ctx = a.ctx;
    a.start(ctx.createBuffer(1, 32000, 32000), 0);
    a.sound("click");
    const disposal = a.dispose();
    await disposal;
    await a.dispose();
    return {
      sampleRate,
      state: ctx.state,
      cache: a.cache.size,
      bytes: a.cache.bytes,
      pending: a.pending.size,
      source: !!a.source,
      dropTimer: a.dropTimer,
    };
  });
  expect(result).toEqual({
    sampleRate: 32000,
    state: "closed",
    cache: 0,
    bytes: 0,
    pending: 0,
    source: false,
    dropTimer: null,
  });
});

test("aborted decodes never populate the cache and deleted imports release buffers", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { CassetteAudio } = await import("/src/audio.js");
    const a = new CassetteAudio();
    a.create();
    let complete;
    a.ctx.decodeAudioData = () => new Promise((r) => (complete = r));
    const c = new AbortController(),
      job = a
        .decode("cancelled", new ArrayBuffer(4), { signal: c.signal })
        .then(
          () => false,
          (e) => e.name === "AbortError",
        );
    c.abort();
    complete(a.ctx.createBuffer(1, 100, 44100));
    const aborted = await job;
    a.cache.set("my-A", a.ctx.createBuffer(1, 100, 44100));
    a.evict({ sides: { A: { key: "my-A" } } });
    const size = a.cache.size;
    await a.dispose();
    return { aborted, size };
  });
  expect(result).toEqual({ aborted: true, size: 0 });
});

test("silent audio suspends when idle and resumes before the next transport action", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { CassetteAudio } = await import("/src/audio.js");
    const a = new CassetteAudio();
    await a.unlock();
    a.setMode("stopped");
    await new Promise((r) => setTimeout(r, 1300));
    const idle = a.ctx.state;
    await a.unlock();
    a.start(a.ctx.createBuffer(1, 44100, 44100), 0);
    const resumed = a.ctx.state;
    await a.dispose();
    return { idle, resumed };
  });
  expect(result).toEqual({ idle: "suspended", resumed: "running" });
});

test("repeated renderer and model disposal returns document listeners to baseline", async ({
  page,
}) => {
  await page.goto("/");
  const client = await page.context().newCDPSession(page);
  const count = async () =>
    (
      await client.send("Runtime.evaluate", {
        expression:
          "Object.values(getEventListeners(document)).reduce((n,a)=>n+a.length,0)",
        includeCommandLineAPI: true,
        returnByValue: true,
      })
    ).result.value;
  const before = await count();
  await page.evaluate(async () => {
    const { createAdaptiveRendering } = await import("/src/rendering.js");
    const { createCaseModel } = await import("/src/case-model.js");
    for (let i = 0; i < 12; i++) {
      const renderer = createAdaptiveRendering({ isActive: () => true });
      renderer.wake();
      const device = document.createElement("div"),
        player = document.createElement("div");
      device.append(player);
      document.body.append(device);
      const model = createCaseModel({
        device,
        player,
        icon: () => "",
        isBusy: () => false,
      });
      renderer.dispose();
      renderer.dispose();
      model.dispose();
      model.dispose();
      device.remove();
    }
  });
  expect(await count()).toBe(before);
});

test("mechanical one-shots remain bounded and all finished voices disconnect", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { CassetteAudio } = await import("/src/audio.js");
    const a = new CassetteAudio();
    await a.unlock();
    await a.mechanisms.preload();
    for (let i = 0; i < 50; i++) a.sound("click");
    const peak = a.mechanisms.sources.size;
    await new Promise((r) => setTimeout(r, 500));
    const remaining = a.mechanisms.sources.size;
    await a.dispose();
    return { peak, remaining };
  });
  expect(result.peak).toBeLessThanOrEqual(12);
  expect(result.remaining).toBe(0);
});

test("back-forward page suspension keeps controls usable without duplicated schedulers", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.evaluate(() => {
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    );
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
  });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("PLAY");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("PAUSE");
  await page.waitForTimeout(1300);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("PLAY");
});

test("limiting rapid clicks never steals the sustained winding voice", async ({
  page,
}) => {
  await page.goto("/");
  const protectedLoop = await page.evaluate(async () => {
    const { CassetteAudio } = await import("/src/audio.js");
    const a = new CassetteAudio();
    await a.unlock();
    await a.mechanisms.preload();
    a.setMode("forwarding");
    const source = a.mechanisms.loop.source;
    for (let i = 0; i < 50; i++) a.sound("click");
    const retained = [...a.mechanisms.sources].some(
      (entry) => entry.source === source,
    );
    await a.dispose();
    return retained;
  });
  expect(protectedLoop).toBe(true);
});
