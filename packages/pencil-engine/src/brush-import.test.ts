import assert from "node:assert/strict";
import test from "node:test";
import { zipSync } from "fflate";
import { importBrushFile, parseAbrTips, parseVbr } from "./brush-import.js";

test("параметрический VBR создаёт маску без внешней динамики", () => {
  const tip = parseVbr("GIMP-VBR\n1.5\nGraphite\ncircle\n10\n8\n2\n0.7\n1\n0\n");
  assert.equal(tip.name, "Graphite");
  assert.equal(tip.width, 19);
  assert.ok(tip.pixels[(9 * 19 + 9) * 4 + 3] > 200);
  assert.equal(tip.pixels[3], 0);
});

test("ABR v6 извлекает sampled tip без пресета Photoshop", () => {
  const entry = new Uint8Array(322);
  const view = new DataView(entry.buffer);
  view.setUint32(301 + 8, 1, false);
  view.setUint32(301 + 12, 2, false);
  view.setUint16(301 + 16, 8, false);
  entry[301 + 19] = 0;
  entry[301 + 20] = 255;
  const abr = new Uint8Array(4 + 12 + 4 + 324);
  const header = new DataView(abr.buffer);
  header.setUint16(0, 6, false); header.setUint16(2, 2, false);
  abr.set([0x38, 0x42, 0x49, 0x4d, 0x73, 0x61, 0x6d, 0x70], 4);
  header.setUint32(12, 328, false);
  header.setUint32(16, 322, false);
  abr.set(entry, 20);
  const tips = parseAbrTips(abr);
  assert.equal(tips.length, 1);
  assert.equal(tips[0].width, 2);
  assert.equal(tips[0].pixels[3], 0);
  assert.equal(tips[0].pixels[7], 255);
});

test("ZIP импортирует вложенные наконечники и отклоняет неподходящий файл", () => {
  const text = new TextEncoder().encode("GIMP-VBR\n1.0\nCircle\n10\n4\n1\n1\n0\n");
  const zip = zipSync({ "brushes/Circle.vbr": text, "dynamics.gdyn": new Uint8Array([1, 2]) });
  assert.equal(importBrushFile("brushes.zip", zip).length, 1);
  assert.throws(() => importBrushFile("dynamics.gdyn", new Uint8Array([1, 2])));
});
