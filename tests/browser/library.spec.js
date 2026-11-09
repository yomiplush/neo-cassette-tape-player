import { test, expect } from "@playwright/test";
function wav() {
  const rate = 8000,
    samples = 8000,
    bytes = Buffer.alloc(44 + samples * 2);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    bytes.writeInt16LE(
      Math.sin((i * 2 * Math.PI * 440) / rate) * 8000,
      44 + i * 2,
    );
  return bytes;
}
test("import persists locally, ends automatically, and can be deleted", async ({
  page,
}) => {
  // LAN HTTP origins may not expose the secure-context-only randomUUID API.
  await page.addInitScript(() =>
    Object.defineProperty(Crypto.prototype, "randomUUID", { value: undefined }),
  );
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator("#import-open").click();
  await page.locator("[name=title]").fill("My <Mix>");
  await page.locator("[name=sideA]").setInputFiles({
    name: "test-tone.wav",
    mimeType: "audio/wav",
    buffer: wav(),
  });
  await page.locator(".import-submit").click();
  await expect(page.locator(".tape-card")).toHaveCount(4);
  await page.reload();
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await expect(page.locator(".tape-card")).toHaveCount(4);
  await expect(page.locator(".tape-card").last()).toContainText("My <Mix>");
  await page.locator(".load-tape").last().click();
  await expect(page.locator("#status")).toHaveText("READY");
  await page.getByRole("button", { name: "再生", exact: true }).click();
  await expect(page.locator("#status")).toContainText("PLAY");
  await expect(page.locator("#status")).toHaveText("READY", { timeout: 4000 });
  await page.getByRole("button", { name: "蓋を開閉" }).click();
  await page.getByRole("button", { name: "テープを取り出す" }).click();
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator(".delete-tape").click();
  await expect(page.locator(".tape-card")).toHaveCount(3);
  expect(errors).toEqual([]);
});
test("invalid audio reports a recoverable error without adding a tape", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "テープ棚を開く" }).click();
  await page.locator("#import-open").click();
  await page.locator("[name=title]").fill("Broken");
  await page.locator("[name=sideA]").setInputFiles({
    name: "bad.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("not audio"),
  });
  await page.locator(".import-submit").click();
  await expect(page.locator("#import-status")).toContainText("再生できない");
  await expect(page.locator(".import-submit")).toBeEnabled();
});
test("all six demos decode and the player has no horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const ctx = new AudioContext(),
      manifest = await (await fetch("./audio/manifest.json")).json();
    const durations = [];
    for (const track of manifest) {
      const response = await fetch(`./audio/${track.file}`);
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      durations.push(buffer.duration);
    }
    await ctx.close();
    return durations;
  });
  expect(results).toHaveLength(6);
  expect(results.every((n) => n >= 100)).toBe(true);
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${width}px`,
    ).toBe(true);
  }
});
