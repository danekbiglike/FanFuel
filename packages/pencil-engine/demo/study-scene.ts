import {
  drawGuidedRegion, drawPencilPath, path2d, pencilBrushes,
  type GbrTip, type PathCommand, type PencilBrushPreset, type SceneNode, type ShapeNode
} from "../src/index.js";
import { mascotScene } from "./scene.js";
import { random } from "../src/geometry.js";

function shape(id: string, nodes: SceneNode[] = mascotScene.nodes): ShapeNode {
  for (const node of nodes) {
    if (node.type === "shape" && node.id === id) return node;
    if (node.type === "group") {
      try { return shape(id, node.children); } catch { /* Продолжаем поиск по дереву. */ }
    }
  }
  throw new Error(`Missing study path: ${id}`);
}

const M = (x: number, y: number): PathCommand => ({ op: "M", x, y });
const C = (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): PathCommand =>
  ({ op: "C", c1x, c1y, c2x, c2y, x, y });
const Z: PathCommand = { op: "Z" };

// Ручной силуэт сравнительного образца в локальных координатах тела.
export const bodyMask: PathCommand[] = [
  M(-34, -151),
  C(-60, -130, -66, -90, -100, -35),
  C(-130, 16, -137, 62, -114, 89),
  C(-105, 106, -83, 112, -56, 111),
  C(16, 132, 104, 112, 123, 48),
  C(141, -21, 81, -95, 17, -130),
  C(1, -144, -19, -154, -34, -151), Z
];

export const curlMask: PathCommand[] = [
  M(-34, -151),
  C(-43, -172, -57, -198, -75, -202),
  C(-93, -209, -107, -199, -101, -182),
  C(-98, -169, -85, -164, -74, -176),
  C(-69, -183, -79, -190, -85, -183),
  C(-89, -178, -94, -178, -94, -186),
  C(-93, -196, -83, -202, -72, -194),
  C(-55, -179, -49, -149, -34, -151), Z
];

function curlTracks(): PathCommand[][] {
  const tracks: PathCommand[][] = [];
  for (let i = 0; i < 95; i++) {
    const u = (i - 47) * 0.42;
    tracks.push([
      M(-34 + u, -148),
      C(-53 + u, -189, -78 + u * 0.5, -211, -97 + u * 0.3, -186),
      C(-101 + u * 0.3, -172, -81 + u * 0.3, -166, -77 + u * 0.3, -181)
    ]);
  }
  return tracks;
}

function bodyTracks(): PathCommand[][] {
  const tracks: PathCommand[][] = [];
  for (let i = 0; i < 790; i++) {
    const u = (i + 0.5) / 790;
    const wave = Math.sin(i * 1.91) * 2.7;
    tracks.push([
      M(-69 + u * 100 + wave, -220 + u * 13),
      C(-123 + u * 205 + Math.sin(i * 0.63) * 7, -127,
        -194 + u * 356 + Math.cos(i * 0.27) * 8, -8,
        -141 + u * 300, 132)
    ]);
  }
  for (let i = 0; i < 135; i++) {
    const u = (i + 0.5) / 135;
    const sway = Math.sin(i * 1.27) * 6;
    tracks.push([
      M(-141 + u * 18 + sway, -11 + u * 96),
      C(-113 + sway, 89 + u * 43, 18 - sway, 148 + u * 22, 143, 47 + u * 74)
    ]);
  }
  for (let i = 0; i < 66; i++) {
    const u = (i + 0.5) / 66;
    tracks.push([
      M(-93 + u * 245, -130 + Math.sin(i * 0.71) * 9),
      C(-54 + u * 170, -37, -76 + u * 210, 54, -115 + u * 277, 130)
    ]);
  }
  return tracks;
}

function canisterTracks(): PathCommand[][] {
  const tracks: PathCommand[][] = [];
  for (let i = 0; i < 360; i++) {
    const x = -65 + i * 0.8;
    const sway = Math.sin(i * 2.13) * 3.5;
    tracks.push([
      M(x, 205),
      C(x + 13 + sway, 143, x + 51 - sway, 52, x + 79 + sway, -17)
    ]);
  }
  for (let i = 0; i < 90; i++) {
    const y = 5 + i * 2;
    tracks.push([M(-16, y + 54), C(38, y + 13, 105, y - 9, 193, y - 20)]);
  }
  return tracks;
}

const graphiteTracks = bodyTracks();
const swirlTracks = curlTracks();
const limeTracks = canisterTracks();
const limbBrush: PencilBrushPreset = {
  ...pencilBrushes.softGraphite, width: 8, opacity: 0.72, spread: 3.5, fibers: 5, dry: 0.2
};

function filledDetail(
  ctx: CanvasRenderingContext2D, id: string, fill: string,
  stroke: string, scale: number, seed: number
) {
  const path = shape(id).path;
  ctx.fillStyle = fill;
  ctx.fill(path2d(path));
  drawPencilPath(ctx, path, { ...pencilBrushes.sharpGraphite, width: 2.4, fibers: 3 }, stroke, seed, scale);
}

export function drawStudy(
  canvas: HTMLCanvasElement,
  size: number,
  bodyBrush: PencilBrushPreset,
  canisterBrush: PencilBrushPreset,
  bodyTip?: GbrTip,
  canisterTip?: GbrTip
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = Math.round(size * dpr);
  canvas.width = pixels;
  canvas.height = pixels;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, pixels, pixels);
  const scale = pixels / 512;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  drawPencilPath(ctx, shape("ground").path, { ...limbBrush, width: 11, opacity: 0.23 }, "#888981", 301, scale, 0.54);
  drawPencilPath(ctx, shape("left-leg").path, limbBrush, "#171815", 302, scale);
  drawPencilPath(ctx, shape("right-leg").path, limbBrush, "#171815", 303, scale);
  ctx.save();
  ctx.translate(160, 276);
  drawPencilPath(ctx, shape("left-arm-stroke").path, limbBrush, "#151611", 304, scale);
  ctx.restore();

  ctx.save();
  ctx.translate(264, 315);
  drawGuidedRegion(ctx, curlMask, swirlTracks, bodyBrush,
    { ground: "#2a2b28", dark: "#080908", glint: "#d0d0c9", outline: "#11120f" }, 72802, scale, bodyTip, "dry");
  drawGuidedRegion(ctx, bodyMask, graphiteTracks, bodyBrush,
    { ground: "#2a2b28", dark: "#080908", glint: "#d0d0c9", outline: "#11120f" }, 72801, scale, bodyTip, "dry");
  filledDetail(ctx, "highlight", "#c7fa32", "#b5e71d", scale, 101);
  ctx.translate(25, -36);
  filledDetail(ctx, "eye-left", "#fffdf7", "#141511", scale, 102);
  filledDetail(ctx, "eye-right", "#fffdf7", "#141511", scale, 103);
  filledDetail(ctx, "pupil-left", "#10110f", "#10110f", scale, 104);
  filledDetail(ctx, "pupil-right", "#10110f", "#10110f", scale, 105);
  drawPencilPath(ctx, shape("smile").path, pencilBrushes.sharpGraphite, "#f5f2e8", 106, scale);
  ctx.restore();

  drawPencilPath(ctx, shape("right-arm").path, limbBrush, "#141511", 305, scale);

  ctx.save();
  ctx.translate(260, 45);
  ctx.rotate(0.25);
  ctx.scale(0.8, 0.8);
  drawGuidedRegion(ctx, shape("canister-body").path, limeTracks, canisterBrush,
    { ground: "#d0ff38", dark: "#80ae16", glint: "#f3ffc3", outline: "#141610" }, 51901, scale, canisterTip);
  drawGuidedRegion(ctx, shape("canister-neck").path, limeTracks, canisterBrush,
    { ground: "#d1ff3b", dark: "#80ae16", glint: "#f5ffc7", outline: "#141610" }, 51902, scale, canisterTip);
  filledDetail(ctx, "handle-hole", "#151711", "#171914", scale, 201);
  ctx.fillStyle = "#95d116";
  ctx.beginPath();
  ctx.ellipse(125, 36, 9, 5, -0.12, 0, Math.PI * 2);
  ctx.fill();
  drawGuidedRegion(ctx, shape("canister-ridge").path, limeTracks, canisterBrush,
    { ground: "#b8ec2e", dark: "#648c16", glint: "#e0fd7f", outline: "#151711" }, 51903, scale, canisterTip);
  filledDetail(ctx, "canister-f", "#121410", "#0b0d09", scale, 202);
  drawPencilPath(ctx, shape("canister-highlight").path,
    pencilBrushes.sharpGraphite, "#f8ffe3", 203, scale);
  ctx.restore();

  drawPencilPath(ctx, shape("left-motion-one").path, pencilBrushes.sharpGraphite, "#52534f", 401, scale, 0.6);
  drawPencilPath(ctx, shape("left-motion-two").path, pencilBrushes.sharpGraphite, "#52534f", 402, scale, 0.6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const boilAnchors = (() => {
  const rng = random(91823);
  return Array.from({ length: 190 }, () => ({
    x: -130 + rng() * 270,
    y: 34 + rng() * 100,
    angle: -0.9 + rng() * 1.8,
    length: 0.7 + rng() * 2.7,
    phase: rng() * Math.PI * 2
  }));
})();

/** Только малая подвижная фактура: тяжёлые штрихи остаются в кэше. */
export function drawStudyBoil(ctx: CanvasRenderingContext2D, frame: number): void {
  const scale = ctx.canvas.width / 512;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.translate(264, 315);
  ctx.clip(path2d(bodyMask));
  ctx.strokeStyle = "#e0e0d6";
  ctx.lineCap = "round";
  for (const mark of boilAnchors) {
    const pulse = Math.sin(frame * 0.77 + mark.phase);
    if (pulse < -0.16) continue;
    ctx.globalAlpha = 0.055 + (pulse + 1) * 0.062;
    ctx.lineWidth = 0.2 + (pulse + 1) * 0.13;
    const dx = Math.cos(mark.angle) * mark.length;
    const dy = Math.sin(mark.angle) * mark.length;
    ctx.beginPath();
    ctx.moveTo(mark.x - dx * 0.5, mark.y - dy * 0.5);
    ctx.lineTo(mark.x + dx * 0.5, mark.y + dy * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
