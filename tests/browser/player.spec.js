import { test, expect } from "@playwright/test";
test("insert, play, pause, wind, flip and eject on a phone", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#status")).toContainText("NO TAPE");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toContainText("READY");
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await expect(page.locator("#status")).toContainText("PLAY");
  await page.waitForTimeout(1400);
  await page.getByRole("button", { name: "一時停止", exact: true }).click();
  await expect(page.locator("#status")).toContainText("PAUSE");
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await page.getByRole("button", { name: "早送り", exact: true }).click();
  await expect(page.locator("#status")).toContainText("FF");
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await page.getByRole("button", { name: "蓋を開閉", exact: true }).click();
  await page.getByRole("button", { name: "A/B面を裏返す" }).click();
  await expect(page.locator("#side-label")).toHaveText("B");
  await page.getByRole("button", { name: "テープを取り出す" }).click();
  await expect(page.locator("#status")).toContainText("NO TAPE");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("leaving during a delayed audio load never starts hidden playback", async ({
  page,
}) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/hyak-ep1-rhythm.mp3", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  release();
  await expect(page.locator("#status")).not.toHaveText("LOADING…");
  await expect(page.locator("#status")).toHaveText("READY");
});
test("STOP cancels a pending request and permits another tape immediately", async ({
  page,
}) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/hyak-ep1-rhythm.mp3", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await expect(
    page.getByRole("button", { name: "停止", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").nth(1).click();
  await expect(page.locator("#current-title")).toHaveText("OUTER SIGNAL");
  release();
});
test("keyboard S cancels loading even while the play button has focus", async ({
  page,
}) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/hyak-ep1-rhythm.mp3", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await page.keyboard.press("s");
  await expect(page.locator("#status")).toHaveText("READY");
  release();
});
test("stalled audio times out with an actionable error", async ({ page }) => {
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route("**/audio/hyak-ep1-rhythm.mp3", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.clock.install();
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("LOADING…");
  await page.clock.fastForward(26000);
  await expect(page.locator("#status")).toHaveText("READY");
  await expect(page.locator("#toast")).toContainText("タイムアウト");
  release();
});
test("FLIP lifts and turns the tape once, locks controls, and settles on the reverse face", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "蓋を開閉" }).click();
  await page.getByRole("button", { name: "A/B面を裏返す" }).click();
  await expect(page.locator("#player")).toHaveClass(/flipping/);
  await expect(
    page.getByRole("button", { name: "A/B面を裏返す" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "蓋を開閉" })).toBeDisabled();
  await expect(page.locator("#side-label")).toHaveText("B");
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
  await expect(page.locator("#loaded-tape .tape-side")).toHaveText("B");
  await page.getByRole("button", { name: "A/B面を裏返す" }).click();
  await expect(page.locator("#side-label")).toHaveText("A");
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
});
test("reduced motion flips without a long animation or a stuck interlock", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "蓋を開閉" }).click();
  await page.getByRole("button", { name: "A/B面を裏返す" }).click();
  await expect(page.locator("#side-label")).toHaveText("B");
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
  await expect(page.getByRole("button", { name: "蓋を開閉" })).toBeEnabled();
});
test("rotating during FLIP restores the real tape and releases the operation lock", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "蓋を開閉" }).click();
  await page.getByRole("button", { name: "A/B面を裏返す" }).click();
  await expect(page.locator(".flip-stage")).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator(".flip-stage")).toHaveCount(0);
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
  await expect(page.locator("#loaded-tape .cassette")).toHaveCSS(
    "visibility",
    "visible",
  );
  await expect(
    page.getByRole("button", { name: "A/B面を裏返す" }),
  ).toBeEnabled();
  const side = await page.locator("#side-label").textContent();
  await page.waitForTimeout(1200);
  await expect(page.locator("#side-label")).toHaveText(side);
  await page.getByRole("button", { name: "A/B面を裏返す" }).click();
  await expect(page.locator("#side-label")).toHaveText(
    side === "A" ? "B" : "A",
  );
  await expect(page.locator("#player")).not.toHaveClass(/flipping/);
});
