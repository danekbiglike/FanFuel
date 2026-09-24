import { flattenPath, hash, random, sampleMotion, type Contour } from "./geometry.js";
import type { PencilScene, PathCommand, Point, SceneNode, ShapeNode, Transform } from "./model.js";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function traceCommands(ctx: CanvasRenderingContext2D, commands: PathCommand[]) {
  ctx.beginPath();
  for (const command of commands) {
    if (command.op === "M") ctx.moveTo(command.x, command.y);
    else if (command.op === "L") ctx.lineTo(command.x, command.y);
    else if (command.op === "Q") ctx.quadraticCurveTo(command.cx, command.cy, command.x, command.y);
    else if (command.op === "C") ctx.bezierCurveTo(command.c1x, command.c1y, command.c2x, command.c2y, command.x, command.y);
    else ctx.closePath();
  }
}

function applyTransform(ctx: CanvasRenderingContext2D, transform: Transform) {
  ctx.translate(transform.x ?? 0, transform.y ?? 0);
  ctx.rotate(transform.rotation ?? 0);
  ctx.scale(transform.scaleX ?? 1, transform.scaleY ?? 1);
}

function resample(contour: Contour, step: number): Point[] {
  const result: Point[] = [contour.points[0]];
  const count = clamp(Math.ceil(contour.length / step), 1, 12000);
  let segment = 1;
  for (let index = 1; index <= count; index++) {
    const target = contour.length * index / count;
    while (segment < contour.lengths.length - 1 && contour.lengths[segment] < target) segment++;
    const prev = contour.points[segment - 1], next = contour.points[segment];
    const portion = (target - contour.lengths[segment - 1]) /
      Math.max(0.000001, contour.lengths[segment] - contour.lengths[segment - 1]);
    result.push({ x: prev.x + (next.x - prev.x) * portion, y: prev.y + (next.y - prev.y) * portion });
  }
  return result;
}

function strokeMarks(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  visible: number,
  width: number,
  grain: number,
  seed: number,
  color: string
) {
  if (points.length < 2 || visible <= 0) return;
  const max = (points.length - 1) * visible;
  const whole = Math.floor(max);
  const fraction = max - whole;
  const jitter = (pass: number) => {
    const rng = random(seed ^ Math.imul(pass + 1, 0x9e3779b1));
    return points.map(point => ({
      x: point.x + (rng() - 0.5) * grain,
      y: point.y + (rng() - 0.5) * grain
    }));
  };
  ctx.strokeStyle = color;
  const baseAlpha = ctx.globalAlpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let pass = 0; pass < 3; pass++) {
    const sampled = jitter(pass);
    ctx.globalAlpha = baseAlpha * (pass === 0 ? 0.9 : pass === 1 ? 0.22 : 0.1);
    ctx.lineWidth = width * (pass === 0 ? 0.62 : pass === 1 ? 1.15 : 1.8);
    ctx.beginPath();
    ctx.moveTo(sampled[0].x, sampled[0].y);
    for (let i = 1; i <= whole; i++) ctx.lineTo(sampled[i].x, sampled[i].y);
    if (fraction && whole + 1 < sampled.length) {
      const a = sampled[whole], b = sampled[whole + 1];
      ctx.lineTo(a.x + (b.x - a.x) * fraction, a.y + (b.y - a.y) * fraction);
    }
    ctx.stroke();
  }
  // Sparse graphite fibers use fixed seeds. They do not accumulate over time.
  const rng = random(seed ^ 0x510e527f);
  ctx.globalAlpha = baseAlpha * 0.22;
  ctx.lineWidth = Math.max(0.25, width * 0.16);
  ctx.beginPath();
  for (let i = 1; i <= whole; i += 3) {
    if (rng() < 0.35) continue;
    const p = points[i], q = points[Math.min(i + 1, points.length - 1)];
    const dx = q.x - p.x, dy = q.y - p.y;
    const length = Math.hypot(dx, dy) || 1;
    const offset = (rng() - 0.5) * width * 1.5;
    const x = p.x - dy / length * offset, y = p.y + dx / length * offset;
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * 0.7, y + dy * 0.7);
  }
  ctx.stroke();
  ctx.globalAlpha = baseAlpha;
}

type DrawOptions = { width: number; height: number; dpr?: number; reducedMotion?: boolean };

export class PencilRenderer {
  private contours = new WeakMap<ShapeNode, Map<number, Contour[]>>();
  private marks = new WeakMap<ShapeNode, Map<string, Path2D>>();
  constructor(readonly scene: PencilScene) {
    if (!(scene.width > 0 && scene.height > 0)) throw new Error("Scene dimensions must be positive");
  }

  draw(ctx: CanvasRenderingContext2D, seconds: number, options: DrawOptions) {
    const dpr = clamp(options.dpr ?? 1, 1, 3);
    const pixelsWide = Math.round(options.width * dpr);
    const pixelsHigh = Math.round(options.height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelsWide, pixelsHigh);
    const scale = Math.min(pixelsWide / this.scene.width, pixelsHigh / this.scene.height);
    ctx.setTransform(scale, 0, 0, scale,
      (pixelsWide - this.scene.width * scale) / 2,
      (pixelsHigh - this.scene.height * scale) / 2);
    const sceneTime = options.reducedMotion ? 0 : Math.max(0, seconds);
    for (const node of this.scene.nodes) this.drawNode(ctx, node, sceneTime, scale, options.reducedMotion ?? false);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: SceneNode, seconds: number, scale: number, reduced: boolean) {
    ctx.save();
    applyTransform(ctx, node.transform ?? {});
    applyTransform(ctx, reduced ? {} : sampleMotion(node.motion, seconds));
    if (node.type === "shape") this.drawShape(ctx, node, seconds, scale, reduced);
    else if (node.type === "group") for (const child of node.children) this.drawNode(ctx, child, seconds, scale, reduced);
    else if (node.frames.length) {
      const raw = Math.floor(seconds * node.fps);
      const index = reduced ? 0 : node.loop === false
        ? Math.min(raw, node.frames.length - 1)
        : raw % node.frames.length;
      for (const child of node.frames[index]) this.drawNode(ctx, child, seconds, scale, reduced);
    }
    ctx.restore();
  }

  private drawShape(ctx: CanvasRenderingContext2D, node: ShapeNode, seconds: number, scale: number, reduced: boolean) {
    const style = node.style;
    const reveal = node.reveal && !reduced
      ? clamp((seconds - node.reveal.start) / Math.max(0.000001, node.reveal.end - node.reveal.start), 0, 1)
      : 1;
    if (reveal <= 0) return;
    const key = Math.round(scale * 4) / 4;
    const frame = style.temporal === "boil" && !reduced && !node.reveal
      ? Math.floor(seconds * (this.scene.boilFps ?? 12)) : 0;
    const seed = hash(this.scene.seed, `${node.id}:${frame}:${key}`);
    let scales = this.contours.get(node);
    if (!scales) { scales = new Map(); this.contours.set(node, scales); }
    let contours = scales.get(key);
    if (!contours) {
      contours = flattenPath(node.path, Math.max(0.05, 0.55 / scale));
      if (scales.size > 8) scales.clear();
      scales.set(key, contours);
    }
    ctx.save();
    ctx.globalAlpha = style.opacity ?? 1;
    if (style.fill && reveal === 1) {
      traceCommands(ctx, node.path);
      ctx.fillStyle = style.fill;
      ctx.fill();
    }
    if (style.hatch && reveal === 1 && contours.length) {
      const bounds = contours.flatMap(contour => contour.points);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const point of bounds) {
        minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
      }
      const hatch = style.hatch;
      const spacing = Math.max(0.8 / scale, hatch.spacing / Math.sqrt(Math.max(0.25, scale)));
      const markKey = `${key}:${frame}`;
      let cachedMarks = this.marks.get(node);
      if (!cachedMarks) { cachedMarks = new Map(); this.marks.set(node, cachedMarks); }
      let marks = cachedMarks.get(markKey);
      if (!marks) {
        marks = new Path2D();
        const rng = random(seed ^ 0xa54ff53a);
        const count = Math.min(3500, Math.ceil((maxX - minX) * (maxY - minY) / (spacing * spacing) * 0.12));
        for (let i = 0; i < count; i++) {
          const x = minX + rng() * (maxX - minX), y = minY + rng() * (maxY - minY);
          const angle = hatch.angle + (rng() - 0.5) * 0.95;
          const length = spacing * (1.1 + rng() * 4.2);
          const dx = Math.cos(angle) * length, dy = Math.sin(angle) * length;
          const bend = (rng() - 0.5) * spacing * 1.6;
          marks.moveTo(x - dx * 0.5, y - dy * 0.5);
          marks.quadraticCurveTo(x + bend, y - bend, x + dx * 0.5, y + dy * 0.5);
        }
        if (cachedMarks.size > 4) cachedMarks.clear();
        cachedMarks.set(markKey, marks);
      }
      ctx.save();
      traceCommands(ctx, node.path);
      ctx.clip();
      ctx.strokeStyle = hatch.color;
      ctx.lineWidth = hatch.width ?? Math.max(0.3, spacing * 0.18);
      ctx.globalAlpha = (style.opacity ?? 1) * (hatch.opacity ?? 0.35);
      ctx.stroke(marks);
      ctx.restore();
    }
    if (style.stroke && (style.width ?? 0) > 0) {
      const total = contours.reduce((sum, contour) => sum + contour.length, 0);
      let consumed = 0;
      contours.forEach((contour, index) => {
        const portion = clamp((reveal * total - consumed) / Math.max(0.000001, contour.length), 0, 1);
        const points = resample(contour, Math.max(0.8 / scale, 1.7 / scale));
        strokeMarks(ctx, points, portion, style.width!, (style.grain ?? 0.8) / Math.sqrt(Math.max(0.25, scale)),
          seed ^ Math.imul(index + 1, 0x85ebca6b), style.stroke!);
        consumed += contour.length;
      });
    }
    ctx.restore();
  }
}
