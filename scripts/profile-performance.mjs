// Reproducible smoke profile, not a guarantee of real-device GPU or audio performance.
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const client = await page.context().newCDPSession(page);
  await page.goto(process.env.NEO_PREVIEW_URL || "http://127.0.0.1:5173");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.locator("#status").filter({ hasText: "PLAY" }).waitFor();
  const results = [];
  for (const rate of [1, 6]) {
    await client.send("Emulation.setCPUThrottlingRate", { rate });
    results.push(
      await page.evaluate(async (rate) => {
        let mutations = 0;
        const intervals = [];
        const observer = new MutationObserver(
          (records) => (mutations += records.length),
        );
        observer.observe(document.querySelector("#player"), {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        const start = performance.now();
        let last = start;
        await new Promise((resolve) => {
          const tick = (now) => {
            intervals.push(now - last);
            last = now;
            if (now - start < 5000) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
        observer.disconnect();
        intervals.sort((a, b) => a - b);
        return {
          cpuSlowdown: rate,
          seconds: (last - start) / 1000,
          mutations,
          fps: 1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length),
          p95FrameMs: intervals[Math.floor(intervals.length * 0.95)],
          quality: document.documentElement.dataset.quality,
        };
      }, rate),
    );
  }
  await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await client.send("HeapProfiler.collectGarbage");
  const heap = await client.send("Runtime.getHeapUsage");
  const result = {
    note: "Headless Chromium, CSS 3D; CPU throttle does not simulate a low-end GPU or native audio memory.",
    results,
    jsHeapBytes: heap.usedSize,
  };
  console.log(JSON.stringify(result, null, 2));
  if (process.env.NEO_PROFILE_OUTPUT)
    await writeFile(
      process.env.NEO_PROFILE_OUTPUT,
      JSON.stringify(result, null, 2) + "\n",
    );
} finally {
  await browser.close();
}
