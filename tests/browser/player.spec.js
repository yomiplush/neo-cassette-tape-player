import { test, expect } from "@playwright/test";
test("insert, play, pause, wind, flip and eject on a phone", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#status")).toContainText("NO TAPE");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toContainText("READY");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toContainText("PLAY");
  await page.waitForTimeout(1400);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator("#status")).toContainText("PAUSE");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Fast forward", exact: true }).click();
  await expect(page.locator("#status")).toContainText("FF");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("button", { name: "Open or close door", exact: true }).click();
  await page.getByRole("button", { name: "Flip side A/B" }).click();
  await expect(page.locator("#side-label")).toHaveText("B");
  await page.getByRole("button", { name: "Eject tape" }).click();
  await expect(page.locator("#status")).toContainText("NO TAPE");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("switching tabs during a requested audio load preserves playback", async ({
  page,
}) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/shrine-ethereal-sanctuary.mp3", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  release();
  await expect(page.locator("#status")).toContainText("PLAY");
  const before = await page.locator("#track-time").textContent();
  await page.waitForTimeout(1500);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator("#track-time")).not.toHaveText(before);
  await expect(page.locator("#status")).toContainText("PLAY");
});
test("STOP cancels a pending request and permits another tape immediately", async ({
  page,
}) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/shrine-ethereal-sanctuary.mp3", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await expect(
    page.getByRole("button", { name: "Stop", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").nth(1).click();
  await expect(page.locator("#current-title")).toHaveText("PILLOW RADIO");
  release();
});
test("keyboard S cancels loading even while the play button has focus", async ({
  page,
}) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/shrine-ethereal-sanctuary.mp3", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await page.keyboard.press("s");
  await expect(page.locator("#status")).toHaveText("READY");
  release();
});
test("stalled audio times out with an actionable error", async ({ page }) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/shrine-ethereal-sanctuary.mp3", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.clock.install();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await page.clock.fastForward(26000);
  await expect(page.locator("#status")).toHaveText("READY");
  await expect(page.locator("#toast")).toContainText("timed out");
  release();
});
test("FLIP lifts and turns the tape once, locks controls, and settles on the reverse face", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Open or close door" }).click();
  await page.getByRole("button", { name: "Flip side A/B" }).click();
  await expect(page.locator("#player")).toHaveClass(/flipping/);
  await expect(
    page.getByRole("button", { name: "Flip side A/B" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Open or close door" })).toBeDisabled();
  await expect(page.locator("#side-label")).toHaveText("B");
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
  await expect(page.locator("#loaded-tape .tape-side")).toHaveText("B");
  await page.getByRole("button", { name: "Flip side A/B" }).click();
  await expect(page.locator("#side-label")).toHaveText("A");
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
});
test("reduced motion flips without a long animation or a stuck interlock", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Open or close door" }).click();
  await page.getByRole("button", { name: "Flip side A/B" }).click();
  await expect(page.locator("#side-label")).toHaveText("B");
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
  await expect(page.getByRole("button", { name: "Open or close door" })).toBeEnabled();
});
test("rotating during FLIP restores the real tape and releases the operation lock", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Open or close door" }).click();
  await page.getByRole("button", { name: "Flip side A/B" }).click();
  await expect(page.locator(".flip-stage")).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator(".flip-stage")).toHaveCount(0);
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
  await expect(page.locator("#loaded-tape .cassette")).toHaveCSS(
    "visibility",
    "visible",
  );
  await expect(
    page.getByRole("button", { name: "Flip side A/B" }),
  ).toBeEnabled();
  const side = await page.locator("#side-label").textContent();
  await page.waitForTimeout(1200);
  await expect(page.locator("#side-label")).toHaveText(side);
  await page.getByRole("button", { name: "Flip side A/B" }).click();
  await expect(page.locator("#side-label")).toHaveText(
    side === "A" ? "B" : "A",
  );
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
});
test('generated navigation icons link to homepage, repository and sponsors in order', async ({page}) => {
 await page.goto('/');
 const links=page.locator('.creator-links a'); await expect(links).toHaveCount(3);
 expect(await links.evaluateAll(nodes=>nodes.map(a=>a.href))).toEqual(['https://www.yomiplush.dev/','https://github.com/yomiplush/neo-cassette-tape-player','https://github.com/sponsors/yomiplush']);
 for(const link of await links.all()) { await expect(link.locator('img')).toBeVisible(); expect(await link.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true); }
});
test('all service controls are on the case and closed-deck FLIP and EJECT sequence safely', async ({page})=>{
 await page.goto('/');
 for(const name of ['Open or close door','Flip side A/B','Eject tape']) expect(await page.getByRole('button',{name,exact:true}).evaluate(b=>!!b.closest('#player'))).toBe(true);
 await page.getByRole('button',{name:'Open tape collection'}).click();await page.locator('.load-tape').first().click();await expect(page.locator('#status')).toHaveText('READY');
 await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('#status')).toContainText('PLAY');
 await page.getByRole('button',{name:'Flip side A/B'}).click();await expect(page.locator('.flip-stage')).toBeVisible();
 await expect(page.locator('.flip-edge')).toHaveCount(4);
 await expect(page.locator('#side-label')).toHaveText('B');await expect(page.locator('#status')).toHaveText('READY');await expect(page.locator('#player')).not.toHaveClass(/door-open/);
 await page.getByRole('button',{name:'Eject tape'}).click();await expect(page.locator('#status')).toHaveText('NO TAPE');await expect(page.locator('#player')).toHaveClass(/door-open/);
});

test('social preview is available in initial HTML without executing JavaScript', async ({ request }) => {
  const response = await request.get('/');
  const html = await response.text();
  expect(html).toContain('property="og:url" content="https://neo-cassette-tape-player-demo.yomiplush.dev/"');
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  const cover = await request.get('/social/neo-cassette.png');
  expect(cover.ok()).toBeTruthy();
  const png = await cover.body();
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test('demo fits one viewport with reachable controls in portrait and landscape', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Open tape collection'}).click();
  await page.locator('.load-tape').first().click();
  await expect(page.locator('#status')).toHaveText('READY');
  for (const [width,height] of [[1440,900],[1280,720],[390,844],[320,568],[320,480],[844,390]]) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(150);
    const boxes = await page.locator('.creator-links a, #player, [data-action], #volume, #wear, #case-skin, #tape-character, #deck-model, #render-quality, #credits-open').evaluateAll(elements => elements.filter(el=>el.getClientRects().length).map(el => {
      const r=el.getBoundingClientRect(); return {label:el.getAttribute('aria-label') || el.id, left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width,height:r.height};
    }));
    for (const b of boxes) {
      expect(b.left, `${width}x${height} ${b.label}`).toBeGreaterThanOrEqual(-1);
      expect(b.top).toBeGreaterThanOrEqual(-1);
      expect(b.right).toBeLessThanOrEqual(width+1);
      expect(b.bottom, `${width}x${height} ${b.label}`).toBeLessThanOrEqual(height+1);
      expect(b.height).toBeGreaterThan(0);
      if (["Play", "Pause", "Stop", "Rewind", "Fast forward", "Open or close door", "Flip side A/B", "Eject tape"].includes(b.label)) {
        // A short landscape view scales the complete physical model uniformly.
        const target = width > height && height <= 500 ? 24 : 44;
        expect(b.height).toBeGreaterThanOrEqual(target);
        expect(b.width).toBeGreaterThanOrEqual(target);
      }
    }
    const tape = await page.locator('#loaded-tape .cassette').boundingBox();
    expect(Math.max(tape.width,tape.height)).toBeGreaterThanOrEqual(60);
    expect(Math.min(tape.width,tape.height)).toBeGreaterThanOrEqual(40);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  }
});

test('playing survives visibility changes but page navigation still stops it', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Open tape collection'}).click();
  await page.locator('.load-tape').first().click();
  await expect(page.locator('#status')).toHaveText('READY');
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect(page.locator('#status')).toContainText('PLAY');
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{value:true,configurable:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const before=await page.locator('#track-time').textContent();
  await page.waitForTimeout(1300);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#status')).toContainText('PLAY');
  await expect(page.locator('#track-time')).not.toHaveText(before);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await expect(page.locator('#status')).toHaveText('READY');
});

test('physical transport and service keys use loaded image assets instead of font symbols', async ({page}) => {
  await page.goto('/');
  for (const action of ['play','pause','stop','rewind','forward','door','flip','eject']) {
    const button=page.locator(`.transport [data-action="${action}"], .case-controls [data-action="${action}"]`);
    await expect(button.locator('img.control-icon')).toHaveCount(1);
    expect(await button.locator('img').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
    expect(await button.textContent()).not.toMatch(/[▶◀■Ⅱ⏏↻↗]/);
  }
});
