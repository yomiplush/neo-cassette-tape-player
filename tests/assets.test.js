import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
test("six creator-supplied tracks map to three A/B folders and match their source manifest", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/audio/manifest.json", import.meta.url)),
  );
  assert.equal(manifest.length, 6);
  assert.equal(new Set(manifest.map((t) => t.file)).size, 6);
  for (const track of manifest) {
    assert.equal(track.license, "LicenseRef-Creator-Supplied");
    assert.equal(track.author, "MobileAmbience");
    assert.match(track.source_sha256, /^[a-f0-9]{64}$/);
    assert.ok(track.duration > 100 && track.duration < 300);
    const file = await readFile(
      new URL(`../public/audio/${track.file}`, import.meta.url),
    );
    assert.equal(createHash("sha256").update(file).digest("hex"), track.sha256);
  }
  assert.equal(new Set(manifest.map(t=>t.source_folder)).size, 3);
  for(const id of ['shrine-afterglow','pillow-radio','midnight-circuit']) {
    assert.deepEqual(manifest.filter(t=>t.tape===id).map(t=>t.side).sort(), ['A','B']);
  }

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
