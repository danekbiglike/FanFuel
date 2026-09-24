import { unzipSync } from "fflate";
import { parseGbr, type GbrTip } from "./gbr.js";

const MAX_FILE_BYTES = 16 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 48 * 1024 * 1024;
const MAX_TIPS = 64;
const MAX_SIDE = 2048;
const MAX_TOTAL_PIXELS = 12_000_000;

function maskTip(name: string, width: number, height: number, mask: Uint8Array, spacingPercent = 10): GbrTip {
  if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE || mask.length !== width * height) {
    throw new Error("Invalid brush mask size");
  }
  const pixels = new Uint8ClampedArray(mask.length * 4);
  for (let i = 0; i < mask.length; i++) {
    pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = 255;
    pixels[i * 4 + 3] = mask[i];
  }
  return { name, colorMode: "mask", width, height, spacingPercent, pixels };
}

/** Читает параметрический наконечник GIMP VBR 1.0/1.5; paint dynamics сюда не входят. */
export function parseVbr(input: string): GbrTip {
  const lines = input.replace(/\r/g, "").trim().split("\n");
  if (lines[0] !== "GIMP-VBR" || !["1.0", "1.5"].includes(lines[1])) throw new Error("Unsupported VBR");
  const version15 = lines[1] === "1.5";
  if (lines.length < (version15 ? 10 : 8)) throw new Error("Truncated VBR");
  const name = lines[2].slice(0, 120);
  const shape = version15 ? lines[3] : "circle";
  const offset = version15 ? 4 : 3;
  const values = lines.slice(offset, offset + (version15 ? 6 : 5)).map(Number);
  if (values.some(value => !Number.isFinite(value))) throw new Error("Invalid VBR parameters");
  const [spacing, radius] = values;
  const spikes = version15 ? values[2] : 2;
  const hardness = version15 ? values[3] : values[2];
  const aspect = version15 ? values[4] : values[3];
  const angle = (version15 ? values[5] : values[4]) * Math.PI / 180;
  if (radius <= 0 || radius > 1024 || aspect < 1 || aspect > 100 || hardness < 0 || hardness > 1 ||
      spacing <= 0 || spacing > 1000 || spikes < 2 || spikes > 20 || !["circle", "square", "diamond"].includes(shape)) {
    throw new Error("Unsupported VBR parameters");
  }
  const side = Math.min(MAX_SIDE, Math.max(3, Math.ceil(radius * 2 + 3)));
  const mask = new Uint8Array(side * side);
  const center = (side - 1) / 2;
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const dx = (x - center) / radius, dy = (y - center) / radius;
    const rotatedX = dx * cosine + dy * sine;
    const rotatedY = (-dx * sine + dy * cosine) * aspect;
    const distance = shape === "square" ? Math.max(Math.abs(rotatedX), Math.abs(rotatedY))
      : shape === "diamond" ? Math.abs(rotatedX) + Math.abs(rotatedY)
      : Math.hypot(rotatedX, rotatedY);
    const spike = spikes > 2 ? 0.75 + 0.25 * Math.cos(Math.atan2(rotatedY, rotatedX) * spikes) : 1;
    const coverage = Math.max(0, Math.min(1, (distance * spike >= 1 ? 0 : (1 - distance * spike) / Math.max(0.001, 1 - hardness))));
    mask[y * side + x] = Math.round(coverage * 255);
  }
  return maskTip(name, side, side, mask, spacing);
}

function decodePackBits(bytes: Uint8Array, offset: number, length: number, width: number): Uint8Array {
  const row = new Uint8Array(width);
  const end = offset + length;
  let at = 0;
  while (offset < end) {
    const marker = bytes[offset++];
    if (marker === 128) continue;
    if (marker < 128) {
      const count = marker + 1;
      if (offset + count > end || at + count > width) throw new Error("Invalid ABR row");
      row.set(bytes.subarray(offset, offset + count), at);
      offset += count; at += count;
    } else {
      const count = 257 - marker;
      if (offset >= end || at + count > width) throw new Error("Invalid ABR row");
      row.fill(bytes[offset++], at, at + count);
      at += count;
    }
  }
  if (at !== width) throw new Error("Truncated ABR row");
  return row;
}

function minifyMask(mask: Uint8Array, width: number, height: number): { mask: Uint8Array; width: number; height: number } {
  const ratio = Math.min(1, 128 / Math.max(width, height));
  if (ratio === 1) return { mask, width, height };
  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));
  const reduced = new Uint8Array(targetWidth * targetHeight);
  for (let y = 0; y < targetHeight; y++) for (let x = 0; x < targetWidth; x++) {
    const minX = Math.floor(x * width / targetWidth), maxX = Math.ceil((x + 1) * width / targetWidth);
    const minY = Math.floor(y * height / targetHeight), maxY = Math.ceil((y + 1) * height / targetHeight);
    let sum = 0;
    for (let row = minY; row < maxY; row++) for (let col = minX; col < maxX; col++) sum += mask[row * width + col];
    reduced[y * targetWidth + x] = Math.round(sum / ((maxX - minX) * (maxY - minY)));
  }
  return { mask: reduced, width: targetWidth, height: targetHeight };
}

/** Из ABR v6 извлекаются только sampled tips. Динамические настройки Photoshop не переносятся. */
export function parseAbrTips(input: Uint8Array): GbrTip[] {
  if (input.length > MAX_FILE_BYTES || input.length < 16) throw new Error("Invalid ABR size");
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const version = view.getUint16(0, false), subversion = view.getUint16(2, false);
  if (version !== 6 || (subversion !== 1 && subversion !== 2)) throw new Error("Unsupported ABR version");
  const tips: GbrTip[] = [];
  let totalPixels = 0;
  let block = 4;
  while (block + 12 <= input.length) {
    if (view.getUint32(block, false) !== 0x3842494d) throw new Error("Invalid ABR block");
    const key = view.getUint32(block + 4, false);
    const size = view.getUint32(block + 8, false);
    const start = block + 12, end = start + size;
    if (end > input.length) throw new Error("Truncated ABR block");
    if (key === 0x73616d70) {
      let at = start;
      while (at + 4 <= end && tips.length < MAX_TIPS) {
        const entrySize = view.getUint32(at, false);
        const entryStart = at + 4, entryEnd = entryStart + entrySize;
        if (entrySize < (subversion === 2 ? 320 : 66) || entryEnd > end) throw new Error("Invalid ABR sample");
        const header = entryStart + (subversion === 2 ? 301 : 47);
        const top = view.getUint32(header, false), left = view.getUint32(header + 4, false);
        const bottom = view.getUint32(header + 8, false), right = view.getUint32(header + 12, false);
        const width = right - left, height = bottom - top;
        const depth = view.getUint16(header + 16, false), compression = input[header + 18];
        if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE || ![8, 16].includes(depth)) {
          throw new Error("Unsupported ABR sample dimensions");
        }
        totalPixels += width * height;
        if (totalPixels > MAX_TOTAL_PIXELS) throw new Error("ABR tips exceed the memory limit");
        let dataAt = header + 19;
        const mask = new Uint8Array(width * height);
        if (compression === 0) {
          const channels = depth / 8;
          if (dataAt + mask.length * channels > entryEnd) throw new Error("Truncated ABR mask");
          for (let i = 0; i < mask.length; i++) mask[i] = input[dataAt + i * channels];
        } else if (compression === 1) {
          if (dataAt + height * 2 > entryEnd) throw new Error("Truncated ABR row lengths");
          const lengths = Array.from({ length: height }, (_, row) => view.getUint16(dataAt + row * 2, false));
          dataAt += height * 2;
          for (let row = 0; row < height; row++) {
            const byteWidth = width * (depth / 8);
            if (dataAt + lengths[row] > entryEnd) throw new Error("Truncated ABR row");
            const decoded = decodePackBits(input, dataAt, lengths[row], byteWidth);
            for (let x = 0; x < width; x++) mask[row * width + x] = decoded[x * (depth / 8)];
            dataAt += lengths[row];
          }
        } else throw new Error("Unsupported ABR compression");
        const reduced = minifyMask(mask, width, height);
        tips.push(maskTip(`Photoshop ${tips.length + 1}`, reduced.width, reduced.height, reduced.mask));
        at = entryEnd + ((4 - entrySize % 4) % 4);
      }
    }
    block = end + ((4 - size % 4) % 4);
  }
  if (!tips.length) throw new Error("No sampled tips in ABR");
  return tips;
}

export function importBrushFile(name: string, bytes: Uint8Array): GbrTip[] {
  if (bytes.length > MAX_FILE_BYTES) throw new Error("Brush file exceeds 16 MB");
  const lower = name.toLowerCase();
  if (lower.endsWith(".gbr")) return [parseGbr(bytes)];
  if (lower.endsWith(".vbr")) return [parseVbr(new TextDecoder("utf-8", { fatal: true }).decode(bytes))];
  if (lower.endsWith(".abr")) return parseAbrTips(bytes);
  if (lower.endsWith(".zip")) {
    let entryCount = 0, expandedBytes = 0;
    const entries = unzipSync(bytes, { filter: entry => {
      entryCount++;
      expandedBytes += entry.originalSize;
      if (entryCount > 256 || expandedBytes > MAX_ARCHIVE_BYTES) throw new Error("ZIP exceeds the safety limit");
      return entry.originalSize <= MAX_FILE_BYTES && /\.(abr|vbr|gbr)$/i.test(entry.name) && !entry.name.includes("__MACOSX/");
    } });
    const tips: GbrTip[] = [];
    let totalPixels = 0;
    for (const [entryName, entryBytes] of Object.entries(entries)) {
      const added = importBrushFile(entryName, entryBytes);
      totalPixels += added.reduce((sum, tip) => sum + tip.width * tip.height, 0);
      if (totalPixels > MAX_TOTAL_PIXELS) throw new Error("Brush tips exceed the memory limit");
      tips.push(...added);
      if (tips.length > MAX_TIPS) throw new Error("Too many brush tips");
    }
    if (!tips.length) throw new Error("No supported brushes in ZIP");
    return tips;
  }
  throw new Error("Unsupported brush format");
}
