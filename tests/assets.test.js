import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
test("six unique demo recordings match the pinned licensed asset manifest", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/audio/manifest.json", import.meta.url)),
  );
  assert.equal(manifest.length, 6);
  assert.equal(new Set(manifest.map((t) => t.file)).size, 6);
  for (const track of manifest) {
    assert.equal(track.license, "CC0-1.0");
    assert.ok(track.duration > 100 && track.duration < 180);
    const file = await readFile(
      new URL(`../public/audio/${track.file}`, import.meta.url),
    );
    assert.equal(createHash("sha256").update(file).digest("hex"), track.sha256);
  }
  const upstream = await readFile(
    new URL("../vendor/duru-ai/LICENSE", import.meta.url),
    "utf8",
  );
  assert.match(upstream, /CC0 1.0 Universal/);
  assert.equal(
    upstream,
    await readFile(
      new URL("../public/licenses/DURU-CC0.txt", import.meta.url),
      "utf8",
    ),
  );
});
test("six CC0 mechanism assets retain their hashes and WAV headers", async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/sfx/manifest.json', import.meta.url)));
  assert.equal(manifest.length, 6);
  for (const clip of manifest) {
    assert.equal(clip.license, 'CC0-1.0');
    const data = await readFile(new URL(`../public/sfx/${clip.file}`, import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(createHash('sha256').update(data).digest('hex'), clip.sha256);
  }
});
