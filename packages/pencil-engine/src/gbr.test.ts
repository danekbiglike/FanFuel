import assert from "node:assert/strict";
import test from "node:test";
import { parseGbr } from "./gbr.js";

function fixture(channels: 1 | 4, pixels: number[], override: Partial<{
  version: number; width: number; height: number; magic: number; spacing: number;
}> = {}) {
  const name = new TextEncoder().encode("Тест\0");
  const bytes = new Uint8Array(28 + name.length + pixels.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 28 + name.length);
  view.setUint32(4, override.version ?? 2);
  view.setUint32(8, override.width ?? 2);
  view.setUint32(12, override.height ?? 1);
  view.setUint32(16, channels);
  view.setUint32(20, override.magic ?? 0x47494d50);
  view.setUint32(24, override.spacing ?? 25);
  bytes.set(name, 28);
  bytes.set(pixels, 28 + name.length);
  return bytes;
}

test("GBR v2 grayscale uses dark pixels as opaque masks", () => {
  const result = parseGbr(fixture(1, [0, 255]));
  assert.equal(result.name, "Тест");
  assert.equal(result.colorMode, "mask");
  assert.equal(result.spacingPercent, 25);
  assert.deepEqual(Array.from(result.pixels), [255, 255, 255, 255, 255, 255, 255, 0]);
});

test("GBR v2 keeps RGBA pixel values", () => {
  const result = parseGbr(fixture(4, [1, 2, 3, 4, 5, 6, 7, 8]));
  assert.equal(result.colorMode, "rgba");
  assert.deepEqual(Array.from(result.pixels), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("GBR rejects malformed and oversized input", () => {
  assert.throws(() => parseGbr(new Uint8Array(12)), /truncated/);
  assert.throws(() => parseGbr(fixture(1, [0, 255], { version: 3 })), /GBR v2/);
  assert.throws(() => parseGbr(fixture(1, [0, 255], { width: 99999 })), /dimensions/);
  assert.throws(() => parseGbr(fixture(1, [0])), /pixel data length/);
});
