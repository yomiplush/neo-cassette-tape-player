import { test, expect } from "@playwright/test";
test("self-hosted edition keeps large transport keys within phone viewports", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-edition",
    "selfhost",
  );
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [390, 844],
    [430, 932],
    [667, 375],
    [844, 390],
    [932, 430],
    [956, 440],
    [1024, 500],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${width}x${height}`,
    ).toBe(true);
    for (const name of ["Stop", "Rewind", "Fast forward", "Play", "Pause"]) {
      const box = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      expect(box.width, name).toBeGreaterThanOrEqual(44);
      expect(box.height, name).toBeGreaterThanOrEqual(44);
      expect(box.y, name).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height, name).toBeLessThanOrEqual(height);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#status")).toContainText("PLAY");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const box = await page
    .getByRole("button", { name: "Stop", exact: true })
    .boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator("#status")).toHaveText("READY");
  expect(errors).toEqual([]);
});
test("self-hosted drawers fit a narrow phone and rotate without overflowing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open tape collection" }).click();
  let box = await page.locator("#library-dialog").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  await page.locator("#import-open").click();
  await expect(page.locator("#import-dialog")).toBeVisible();
  await page.setViewportSize({ width: 667, height: 375 });
  box = await page.locator("#import-dialog").boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(375);
  await page.getByRole("button", { name: "Close import dialog" }).click();
  await expect(page.locator("#import-dialog")).not.toBeVisible();
});
