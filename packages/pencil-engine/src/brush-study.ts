import { flattenPath, random } from "./geometry.js";
import type { GbrTip } from "./gbr.js";
import type { PathCommand, Point } from "./model.js";

export type PencilBrushPreset = {
  id: string;
  width: number;
  opacity: number;
  fibers: number;
  spread: number;
  dry: number;
};

export const pencilBrushes: Record<string, PencilBrushPreset> = {
  softGraphite: { id: "softGraphite", width: 1.8, opacity: 0.52, fibers: 4, spread: 2.1, dry: 0.28 },
  sharpGraphite: { id: "sharpGraphite", width: 0.95, opacity: 0.64, fibers: 2, spread: 0.7, dry: 0.22 },
  coloredPencil: { id: "coloredPencil", width: 1.35, opacity: 0.33, fibers: 3, spread: 1.5, dry: 0.32 }
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const tipCache = new WeakMap<GbrTip, Map<string, HTMLCanvasElement>>();

function tipCanvas(tip: GbrTip, color: string): HTMLCanvasElement {
  let variants = tipCache.get(tip);
  if (!variants) { variants = new Map(); tipCache.set(tip, variants); }
  const cached = variants.get(color);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = tip.width;
  canvas.height = tip.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const pixels = new Uint8ClampedArray(tip.pixels);
  if (tip.colorMode === "mask") {
    const match = /^#([0-9a-f]{6})$/i.exec(color);
    if (!match) throw new Error("GBR mask requires a six-digit hex color");
    const value = Number.parseInt(match[1], 16);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = (value >>> 16) & 255;
      pixels[i + 1] = (value >>> 8) & 255;
      pixels[i + 2] = value & 255;
    }
  }
  context.putImageData(new ImageData(pixels, tip.width, tip.height), 0, 0);
  variants.set(color, canvas);
  return canvas;
}

export function path2d(commands: PathCommand[]): Path2D {
  const path = new Path2D();
  for (const command of commands) {
    if (command.op === "M") path.moveTo(command.x, command.y);
    else if (command.op === "L") path.lineTo(command.x, command.y);
    else if (command.op === "Q") path.quadraticCurveTo(command.cx, command.cy, command.x, command.y);
    else if (command.op === "C") path.bezierCurveTo(command.c1x, command.c1y, command.c2x, command.c2y, command.x, command.y);
    else path.closePath();
  }
  return path;
}

function resample(points: Point[], step: number): Point[] {
  const output: Point[] = [points[0]];
  let accumulated = 0;
  let next = step;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    while (next <= accumulated + distance && distance > 0) {
      const t = (next - accumulated) / distance;
      output.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      next += step;
    }
    accumulated += distance;
  }
  output.push(points[points.length - 1]);
  return output;
}

function cellNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x * 1.7), iy = Math.floor(y * 1.7);
  let value = Math.imul(ix ^ seed, 0x45d9f3b) ^ Math.imul(iy, 0x119de1f3);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value >>> 0) / 0x100000000;
}

function roughOutline(mask: PathCommand[], seed: number): PathCommand[] {
  const output: PathCommand[] = [];
  for (const contour of flattenPath(mask, 0.45)) {
    const source = resample(contour.points, 1.35);
    const points = contour.closed ? source.slice(0, -1) : source;
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const prev = points[(i - 1 + points.length) % points.length];
      const next = points[(i + 1) % points.length];
      const dx = next.x - prev.x, dy = next.y - prev.y;
      const length = Math.hypot(dx, dy) || 1;
      const noise = cellNoise(i * 0.24, 0, seed) - 0.5;
      const shift = noise * 1.7 + Math.sin(i * 0.19 + seed) * 0.32;
      const x = point.x - dy / length * shift;
      const y = point.y + dx / length * shift;
      output.push(i === 0 ? { op: "M", x, y } : { op: "L", x, y });
    }
    if (contour.closed) output.push({ op: "Z" });
  }
  return output;
}

function drawDryEdge(ctx: CanvasRenderingContext2D, commands: PathCommand[], color: string, seed: number): void {
  const rng = random(seed ^ 0x3af47e);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "butt";
  for (const contour of flattenPath(commands, 0.5)) {
    const points = resample(contour.points, 1.4);
    for (let i = 1; i < points.length - 1; i++) {
      if (rng() > 0.57) continue;
      const prev = points[i - 1], point = points[i], next = points[i + 1];
      const dx = next.x - prev.x, dy = next.y - prev.y;
      const length = Math.hypot(dx, dy) || 1;
      const tangentX = dx / length, tangentY = dy / length;
      const offset = (rng() - 0.5) * 3.4;
      const x = point.x - tangentY * offset, y = point.y + tangentX * offset;
      const reach = 0.8 + rng() * 3.8;
      const paperChip = rng() < 0.22;
      ctx.strokeStyle = paperChip ? "#fffdf7" : color;
      ctx.globalAlpha = paperChip ? 0.7 + rng() * 0.25 : 0.25 + rng() * 0.42;
      ctx.lineWidth = 0.3 + rng() * 0.43;
      ctx.beginPath();
      ctx.moveTo(x - tangentX * reach * 0.4, y - tangentY * reach * 0.4);
      ctx.lineTo(x + tangentX * reach * 0.6, y + tangentY * reach * 0.6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Наносит несколько волокон по одной векторной траектории с устойчивыми бумажными пропусками. */
export function drawPencilPath(
  ctx: CanvasRenderingContext2D,
  commands: PathCommand[],
  brush: PencilBrushPreset,
  color: string,
  seed: number,
  scale: number,
  opacity = 1,
  tip?: GbrTip
): void {
  const contours = flattenPath(commands, clamp(0.38 / scale, 0.08, 0.5));
  const rng = random(seed);
  ctx.save();
  if (tip) {
    const bitmap = tipCanvas(tip, color);
    const diameter = Math.max(1.5, brush.width * 3);
    const height = diameter * tip.height / tip.width;
    const step = clamp(diameter * tip.spacingPercent / 100, 0.55 / scale, 6);
    for (const contour of contours) {
      const points = resample(contour.points, step);
      for (const point of points) {
        if (cellNoise(point.x * 0.46, point.y * 0.46, seed) < brush.dry) continue;
        ctx.globalAlpha = brush.opacity * opacity * (0.55 + cellNoise(point.x, point.y, seed ^ 773) * 0.45);
        ctx.drawImage(bitmap, point.x - diameter / 2, point.y - height / 2, diameter, height);
      }
    }
    ctx.restore();
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const contour of contours) {
    const points = resample(contour.points, clamp(1.1 / scale, 0.35, 1.2));
    for (let fiber = 0; fiber < brush.fibers; fiber++) {
      const displacement = (fiber - (brush.fibers - 1) / 2) * brush.spread / Math.max(1, brush.fibers - 1);
      const phase = rng() * 6.283;
      ctx.lineWidth = brush.width * (fiber === 0 ? 0.74 : 0.38 + rng() * 0.22);
      ctx.globalAlpha = brush.opacity * opacity * (fiber === 0 ? 0.9 : 0.57);
      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
        const dx = next.x - prev.x, dy = next.y - prev.y;
        const length = Math.hypot(dx, dy) || 1;
        const pressure = 0.63 + 0.37 * Math.sin(Math.PI * i / Math.max(1, points.length - 1));
        const rough = (cellNoise(point.x * 0.41, point.y * 0.41, seed + fiber * 179) - 0.5) * brush.spread * 0.75;
        const offset = displacement + rough + Math.sin(i * 0.12 + phase) * brush.spread * 0.2;
        const x = point.x - dy / length * offset, y = point.y + dx / length * offset;
        const tooth = cellNoise(point.x * 0.46 + fiber * 4.3, point.y * 0.46 - fiber * 2.9, seed ^ 0x5137);
        const keep = tooth > brush.dry * (1.2 - pressure);
        if (!keep) { drawing = false; continue; }
        if (drawing) ctx.lineTo(x, y);
        else { ctx.moveTo(x, y); drawing = true; }
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawGuidedRegion(
  ctx: CanvasRenderingContext2D,
  mask: PathCommand[],
  tracks: PathCommand[][],
  brush: PencilBrushPreset,
  colors: { ground: string; dark: string; glint: string; outline?: string },
  seed: number,
  scale: number,
  tip?: GbrTip,
  edge: "dry" | "firm" = "firm"
): void {
  const outline = edge === "dry" ? roughOutline(mask, seed) : mask;
  const maskPath = path2d(outline);
  ctx.save();
  ctx.fillStyle = colors.ground;
  ctx.fill(maskPath);
  ctx.clip(maskPath);
  const rng = random(seed ^ 0x7919a11);
  for (let i = 0; i < tracks.length; i++) {
    const chance = rng();
    const glint = chance < 0.2;
    drawPencilPath(ctx, tracks[i], brush, glint ? colors.glint : colors.dark,
      seed + Math.imul(i + 1, 0x9e3779b1), scale, glint ? 0.72 : 0.65 + rng() * 0.45, tip);
  }
  ctx.restore();
  if (edge === "dry") {
    const dryBrush: PencilBrushPreset = {
      ...pencilBrushes.sharpGraphite, width: 1.15, spread: 0.45, fibers: 2, opacity: 0.84, dry: 0.32
    };
    drawPencilPath(ctx, outline, dryBrush, colors.outline ?? colors.dark, seed ^ 0x85ebca6b, scale);
    drawDryEdge(ctx, outline, colors.outline ?? colors.dark, seed);
  } else {
    const contourBrush: PencilBrushPreset = {
      ...pencilBrushes.sharpGraphite, width: 2.8, spread: 1.7, fibers: 4, opacity: 0.7, dry: 0.23
    };
    for (let pass = 0; pass < 3; pass++) {
      drawPencilPath(ctx, mask, contourBrush, colors.outline ?? colors.dark,
        seed ^ Math.imul(pass + 1, 0x85ebca6b), scale, pass === 0 ? 1 : 0.52);
    }
  }
}
