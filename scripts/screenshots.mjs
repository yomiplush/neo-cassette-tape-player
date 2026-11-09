import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage();
await mkdir("docs/screenshots", { recursive: true });
async function load(url) {
  await page.goto(url);
  await page.getByRole("button", { name: "Open tape collection" }).click();
  await page.locator(".load-tape").first().click();
  await page.waitForTimeout(4700);
}
await page.setViewportSize({ width: 1440, height: 1100 });
await load(process.env.NEO_DEMO_PREVIEW_URL || "http://127.0.0.1:5173");
await page.screenshot({ path: "docs/screenshots/desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "docs/screenshots/mobile.png", fullPage: true });
await page.getByRole("button", { name: "Open or close door" }).click();
await page.getByRole("button", { name: "Flip side A/B" }).click();
await page.waitForTimeout(330);
await page.screenshot({ path: "docs/screenshots/flip.png", fullPage: false });
await page.waitForTimeout(1400);
await page.getByRole("button", { name: "Open tape collection" }).click();
await page.screenshot({ path: "docs/screenshots/library.png", fullPage: true });
await load(process.env.NEO_SELFHOST_PREVIEW_URL || "http://127.0.0.1:5175");
await page.screenshot({
  path: "docs/screenshots/selfhost-mobile.png",
  fullPage: false,
});
await page.setViewportSize({ width: 844, height: 390 });
await page.screenshot({
  path: "docs/screenshots/selfhost-landscape.png",
  fullPage: false,
});
await page.setViewportSize({ width: 320, height: 568 });
await page.screenshot({
  path: "docs/screenshots/selfhost-small.png",
  fullPage: false,
});
await browser.close();
