import type { PathCommand, Point, Transform, Motion } from "./model.js";

export type Contour = { points: Point[]; closed: boolean; lengths: number[]; length: number };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function finish(points: Point[], closed: boolean): Contour | undefined {
  if (points.length < 2) return undefined;
  const list = closed ? [...points, points[0]] : points;
  const lengths = [0];
  for (let i = 1; i < list.length; i++) lengths.push(lengths[i - 1] + distance(list[i - 1], list[i]));
  return { points: list, closed, lengths, length: lengths[lengths.length - 1] };
}

/** Adaptive De Casteljau subdivision; tolerance is expressed in scene units. */
export function flattenPath(commands: PathCommand[], tolerance: number): Contour[] {
  const output: Contour[] = [];
  let points: Point[] = [];
  let current: Point = { x: 0, y: 0 };
  const push = (closed: boolean) => {
    const contour = finish(points, closed);
    if (contour) output.push(contour);
    points = [];
  };
  const subdivide = (p: Point[], depth: number) => {
    const chord = distance(p[0], p[p.length - 1]);
    const polygon = p.slice(1).reduce((sum, point, i) => sum + distance(p[i], point), 0);
    if (depth >= 12 || polygon - chord <= tolerance) {
      points.push(p[p.length - 1]);
      return;
    }
    const levels: Point[][] = [p];
    while (levels[levels.length - 1].length > 1) {
      const prior = levels[levels.length - 1];
      levels.push(prior.slice(1).map((point, i) => midpoint(prior[i], point)));
    }
    const left = levels.map(level => level[0]);
    const right = levels.map(level => level[level.length - 1]).reverse();
    subdivide(left, depth + 1);
    subdivide(right, depth + 1);
  };
  for (const command of commands) {
    if (command.op === "M") {
      push(false);
      current = { x: command.x, y: command.y };
      points.push(current);
    } else if (command.op === "L") {
      current = { x: command.x, y: command.y };
      points.push(current);
    } else if (command.op === "Q") {
      const end = { x: command.x, y: command.y };
      subdivide([current, { x: command.cx, y: command.cy }, end], 0);
      current = end;
    } else if (command.op === "C") {
      const end = { x: command.x, y: command.y };
      subdivide([current, { x: command.c1x, y: command.c1y }, { x: command.c2x, y: command.c2y }, end], 0);
      current = end;
    } else {
      push(true);
    }
  }
  push(false);
  return output;
}

/** Смягчает ось в экранных координатах, ограничивая сдвиг от исходной ломаной. */
export function softenPolyline(points: Point[], closed: boolean, maxShift: number): Point[] {
  if (maxShift <= 0 || points.length < 3) return points;
  const count = closed ? points.length - 1 : points.length;
  if (count < 3) return points;
  const cumulative = [0];
  for (let index = 1; index < points.length; index++) {
    cumulative.push(cumulative[index - 1] + distance(points[index - 1], points[index]));
  }
  const total = cumulative.at(-1) ?? 0;
  if (total < 0.001) return points;
  const steps = Math.min(4096, Math.max(count, Math.ceil(total / Math.max(0.8, maxShift * 0.75))));
  const spacing = total / steps;
  const samples: Point[] = [];
  let segment = 1;
  for (let index = 0; index < (closed ? steps : steps + 1); index++) {
    const target = index * spacing;
    while (segment < cumulative.length - 1 && cumulative[segment] < target) segment++;
    const start = points[segment - 1], end = points[segment];
    const fraction = (target - cumulative[segment - 1]) /
      Math.max(0.000001, cumulative[segment] - cumulative[segment - 1]);
    samples.push({ x: start.x + (end.x - start.x) * fraction,
      y: start.y + (end.y - start.y) * fraction });
  }
  const radius = Math.max(2, Math.ceil(maxShift * 4.5 / spacing));
  const softened: Point[] = samples.map((sample, index) => {
    if (!closed && (index === 0 || index === samples.length - 1)) return sample;
    let weightedX = 0, weightedY = 0, weightTotal = 0;
    for (let offset = -radius; offset <= radius; offset++) {
      const neighbor = closed ? (index + offset + samples.length) % samples.length : index + offset;
      if (neighbor < 0 || neighbor >= samples.length) continue;
      const weight = radius + 1 - Math.abs(offset);
      weightedX += samples[neighbor].x * weight;
      weightedY += samples[neighbor].y * weight;
      weightTotal += weight;
    }
    const moveX = weightedX / weightTotal - sample.x;
    const moveY = weightedY / weightTotal - sample.y;
    const move = Math.hypot(moveX, moveY);
    const limit = closed ? maxShift : Math.min(maxShift, index * spacing * 0.35,
      (samples.length - 1 - index) * spacing * 0.35);
    const fraction = move > limit ? limit / move : 1;
    return { x: sample.x + moveX * fraction, y: sample.y + moveY * fraction };
  });
  if (closed) softened.push({ ...softened[0] });
  return softened;
}

export function sampleMotion(motion: Motion | undefined, seconds: number): Transform {
  if (!motion?.keys.length) return {};
  const keys = motion.keys;
  const duration = keys[keys.length - 1].at;
  const t = motion.loop && duration > 0 ? ((seconds % duration) + duration) % duration : Math.max(0, seconds);
  if (t <= keys[0].at) return keys[0].value;
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].at) {
      const a = keys[i - 1], b = keys[i];
      const f = (t - a.at) / Math.max(0.000001, b.at - a.at);
      return {
        x: (a.value.x ?? 0) + ((b.value.x ?? 0) - (a.value.x ?? 0)) * f,
        y: (a.value.y ?? 0) + ((b.value.y ?? 0) - (a.value.y ?? 0)) * f,
        rotation: (a.value.rotation ?? 0) + ((b.value.rotation ?? 0) - (a.value.rotation ?? 0)) * f,
        scaleX: (a.value.scaleX ?? 1) + ((b.value.scaleX ?? 1) - (a.value.scaleX ?? 1)) * f,
        scaleY: (a.value.scaleY ?? 1) + ((b.value.scaleY ?? 1) - (a.value.scaleY ?? 1)) * f
      };
    }
  }
  return keys[keys.length - 1].value;
}

export function hash(seed: number, value: string): number {
  let h = seed | 0;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
