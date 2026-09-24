import { flattenPath, hash, softenPolyline } from "./geometry.js";
import type { PathCommand, Point } from "./model.js";
import type { GbrTip } from "./gbr.js";

export type PencilContourBrush = {
  /** Базовая ширина на экране в CSS px; от размера рисунка не зависит. */
  widthCss: number;
  pigment: [number, number, number];
  density: number;
  grain: number;
  tilt: number;
  /** Сила редких графитных волокон по краям; 0 отключает их. */
  fray?: number;
  /** Небольшое наложение соседних жестов, угловые выходы и локальный повтор; 0 отключает. */
  handwork?: number;
  /** Сторона повторного прохода относительно направления оси. */
  handworkSide?: -1 | 1;
  tip?: GbrTip;
  /** Общая сила нажима: одновременно влияет на ширину и насыщенность. */
  pressureScale?: number;
  /** Амплитуда авторского профиля нажима относительно среднего уровня. */
  pressureVariation?: number;
  /** Медленная детерминированная неоднородность жеста, без дрожания оси. */
  randomness?: number;
  /** Длина сужения от конца штриха в CSS px. */
  taperLengthCss?: number;
  /** Остаточная доля ширины на самом конце. */
  taperMinimum?: number;
};

export type PencilContourStroke = {
  id: string;
  path: PathCommand[];
  brush: PencilContourBrush;
  /** Исходная длина штриха в CSS px: удерживает фактуру при деформации пути. */
  materialLengthCss?: number;
  /** Авторские значения нажима вдоль длины пути через равные интервалы. */
  pressureProfile?: readonly number[];
  /** Сужение открытого штриха; у стыков составного контура можно отключить. */
  taper?: "both" | "start" | "end" | "none";
  transform?: { x?: number; y?: number; rotation?: number; scale?: number };
};

export type PencilContourOptions = {
  sceneWidth: number;
  sceneHeight: number;
  cssWidth: number;
  cssHeight: number;
  dpr?: number;
  seed?: number;
  /** Меняет только мелкое бумажное зерно; форма оси и нажим остаются стабильными. */
  boilFrame?: number;
  boilStrength?: number;
  /** Номер показанного рисунка: даёт небольшое отклонение оси между перерисовками. */
  redrawFrame?: number;
  /** Максимальный характерный размах отклонения оси в CSS px; 0 сохраняет исходный путь. */
  redrawStrengthCss?: number;
  /** Лёгкое сглаживание ломаной после деформации, в экранных CSS px. */
  smoothingCss?: number;
  /** Для движущегося персонажа зерно привязывается к материалу штриха. */
  grainSpace?: "paper" | "stroke";
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function hash2(x: number, y: number, seed: number): number {
  let value = Math.imul(x ^ seed, 0x45d9f3b) ^ Math.imul(y, 0x119de1f3);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value >>> 0) / 0x100000000;
}

function smoothNoise(value: number, seed: number): number {
  const index = Math.floor(value);
  const fraction = value - index;
  const t = fraction * fraction * (3 - 2 * fraction);
  return hash2(index, 0, seed) * (1 - t) + hash2(index + 1, 0, seed) * t;
}

function softBand(distance: number, inner: number, outer: number): number {
  const absolute = Math.abs(distance);
  if (absolute >= outer) return 0;
  if (absolute <= inner) return 1;
  const t = (outer - absolute) / (outer - inner);
  return t * t * (3 - 2 * t);
}

export type HandworkCandidate = { index: number; distance: number; bend: number; joinWeight: number; retraceWeight: number };
type HandworkMark = { position: number; before: number; after: number; shift: number; strength: number };
export type CornerSample = Point & { distance: number; tangentX: number; tangentY: number; tipDensity: number };
type RoundedContourMetrics = { rounded: boolean; maxY: number; height: number; inwardSign: number };

function roundedContourMetrics(
  samples: Array<Point & { distance: number }>, total: number, closed: boolean
): RoundedContourMetrics {
  if (!closed || total <= 0 || samples.length < 4) return { rounded: false, maxY: 0, height: 1, inwardSign: 1 };
  let twiceArea = 0, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    twiceArea += a.x * b.y - b.x * a.y;
    minY = Math.min(minY, a.y);
    maxY = Math.max(maxY, a.y);
  }
  const first = samples[0], last = samples[samples.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) > 0.001) {
    twiceArea += last.x * first.y - first.x * last.y;
    minY = Math.min(minY, last.y);
    maxY = Math.max(maxY, last.y);
  }
  const circularity = Math.PI * 2 * Math.abs(twiceArea) / (total * total);
  return { rounded: circularity > 0.86, maxY, height: Math.max(1, maxY - minY),
    inwardSign: Math.sign(twiceArea) || 1 };
}

function chooseHandworkCandidate(
  candidates: HandworkCandidate[], seed: number, salt: number, kind: "join" | "retrace",
  excluded?: number, separation = 0
): HandworkCandidate | undefined {
  const weightOf = (candidate: HandworkCandidate) => kind === "join"
    ? candidate.joinWeight : candidate.retraceWeight;
  let total = 0;
  for (const candidate of candidates) {
    if (excluded === undefined || Math.abs(candidate.distance - excluded) >= separation) total += weightOf(candidate);
  }
  if (total <= 0) return undefined;
  let target = hash2(salt, 0, seed) * total;
  let last: HandworkCandidate | undefined;
  for (const candidate of candidates) {
    if (excluded !== undefined && Math.abs(candidate.distance - excluded) < separation) continue;
    last = candidate;
    target -= weightOf(candidate);
    if (target <= 0) return candidate;
  }
  return last;
}

/** Стык жестов тяготеет к поворотам или нижней дуге округлой формы; повтор — к середине прямой. */
export function handworkCandidates(
  samples: Array<Point & { distance: number }>, total: number, step: number,
  closed: boolean, profile: readonly number[] | undefined, seed: number, dpr: number,
  roundMetrics?: RoundedContourMetrics
): HandworkCandidate[] {
  const candidates: HandworkCandidate[] = [];
  const stride = Math.max(1, Math.round(3 * dpr / step));
  const reach = Math.max(1, Math.round(6 * dpr / step));
  const wideReach = Math.max(reach, Math.round(18 * dpr / step));
  const margin = Math.min(total * 0.13, 5 * dpr);
  const round = roundMetrics ?? roundedContourMetrics(samples, total, closed);
  const last = samples[samples.length - 1];
  const duplicateEnd = closed && Math.hypot(samples[0].x - last.x, samples[0].y - last.y) < step * 0.4;
  const count = samples.length - (duplicateEnd ? 1 : 0);
  const at = (index: number) => closed ? samples[(index % count + count) % count]
    : samples[clamp(index, 0, samples.length - 1)];
  for (let i = closed ? 0 : stride; i < count - (closed ? 0 : stride); i += stride) {
    const sample = samples[i];
    if (!closed && (sample.distance < margin || total - sample.distance < margin)) continue;
    const a = at(i - reach), b = at(i + reach);
    const ax = sample.x - a.x, ay = sample.y - a.y, bx = b.x - sample.x, by = b.y - sample.y;
    const bend = Math.acos(clamp((ax * bx + ay * by) /
      (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1), -1, 1));
    const wideA = at(i - wideReach);
    const wideB = at(i + wideReach);
    const wideAx = sample.x - wideA.x, wideAy = sample.y - wideA.y;
    const wideBx = wideB.x - sample.x, wideBy = wideB.y - sample.y;
    const wideBend = Math.acos(clamp((wideAx * wideBx + wideAy * wideBy) /
      (Math.hypot(wideAx, wideAy) * Math.hypot(wideBx, wideBy) || 1), -1, 1));
    const progress = sample.distance / total;
    const pressureChange = Math.abs(gesturePressure(Math.min(1, progress + 0.035), profile, seed)
      - gesturePressure(Math.max(0, progress - 0.035), profile, seed));
    const endDistance = Math.min(sample.distance, total - sample.distance) / dpr;
    const endpoint = closed ? 0 : Math.exp(-Math.pow((endDistance - 12) / 9, 2)) * 0.9;
    const lowerArc = round.rounded ? Math.exp(-Math.pow((round.maxY - sample.y) / (round.height * 0.2), 2)) : 0;
    const joinWeight = 0.035 + Math.pow(clamp(bend / 0.42, 0, 1), 1.5) * 3.2
      + Math.min(0.6, pressureChange * 2) + endpoint + lowerArc * 24;
    const straightness = Math.pow(1 - clamp(wideBend / 0.28, 0, 1), 2);
    const interior = closed ? 1 : clamp((endDistance - 12) / 14, 0, 1);
    const retraceWeight = 0.01 + straightness * interior * 2.4;
    candidates.push({ index: i, distance: sample.distance, bend, joinWeight, retraceWeight });
  }
  return candidates;
}

function materialDistance(position: number, markPosition: number, materialLength: number, closed: boolean): number {
  let distance = position - markPosition;
  if (closed && Math.abs(distance) > materialLength / 2) distance -= Math.sign(distance) * materialLength;
  return distance;
}

export function roundedGestureSplit(position: number, materialLength: number, mark: HandworkMark, dpr: number) {
  const distance = materialDistance(position, mark.position, materialLength, true);
  if (distance < -mark.before || distance > mark.after) return undefined;
  const smooth = (value: number) => value * value * (3 - 2 * value);
  const before = Math.min(3 * dpr, mark.before * 0.68);
  const after = Math.min(3 * dpr, mark.after * 0.68);
  const shared = Math.min(0.55 * dpr, mark.before * 0.16, mark.after * 0.16);
  const first = smooth(clamp((after + shared - distance) / after, 0, 1));
  const second = smooth(clamp((distance + before + shared) / before, 0, 1));
  const total = first + second;
  const transfer = total > 1.3 ? 1.3 / total : 1;
  const progress = clamp((distance + mark.before) / (mark.before + mark.after), 0, 1);
  const envelope = Math.sin(Math.PI * progress) * Math.abs(mark.shift) * mark.strength;
  const approach = clamp(-distance / mark.before, 0, 1);
  const departure = clamp(distance / mark.after, 0, 1);
  return { left: first * transfer, right: second * transfer,
    firstShift: envelope * (departure * 1.4 - approach * 0.08),
    secondShift: envelope * (approach * 1.4 - departure * 0.08) };
}

function handworkOverlap(
  position: number, materialLength: number, closed: boolean, marks: HandworkMark[], dpr: number
): { presence: number; shift: number; strength: number } {
  let presence = 0, shift = 0, strength = 0;
  for (const mark of marks) {
    const distance = materialDistance(position, mark.position, materialLength, closed);
    const enter = clamp((distance + mark.before) / Math.min(2.2 * dpr, mark.before * 0.55), 0, 1);
    const leave = clamp((mark.after - distance) / Math.min(2.8 * dpr, mark.after * 0.55), 0, 1);
    const local = enter * enter * (3 - 2 * enter) * leave * leave * (3 - 2 * leave);
    if (local > presence) {
      presence = local;
      shift = mark.shift * (0.7 + 0.3 * softBand(distance, 0, Math.min(mark.before, mark.after)));
      strength = mark.strength;
    }
  }
  return { presence, shift, strength };
}

export function cornerExtensionSamples(
  samples: Array<Point & { distance: number }>, candidates: HandworkCandidate[],
  total: number, step: number, closed: boolean, frameSeed: number, handwork: number, dpr: number
): CornerSample[] {
  if (handwork < 0.3) return [];
  const sharp = candidates.filter(candidate => candidate.bend > 0.62)
    .sort((a, b) => b.bend - a.bend);
  const chosen: HandworkCandidate[] = [];
  for (const candidate of sharp) {
    const separated = chosen.every(prior => {
      const distance = Math.abs(candidate.distance - prior.distance);
      return (closed ? Math.min(distance, total - distance) : distance) > 12 * dpr;
    });
    if (separated) chosen.push(candidate);
    if (chosen.length === 3) break;
  }
  const duplicateEnd = closed && Math.hypot(samples[0].x - samples[samples.length - 1].x,
    samples[0].y - samples[samples.length - 1].y) < step * 0.4;
  const count = samples.length - (duplicateEnd ? 1 : 0);
  const at = (index: number) => closed ? samples[(index % count + count) % count]
    : samples[clamp(index, 0, samples.length - 1)];
  const output: CornerSample[] = [];
  for (const corner of chosen) {
    if (hash2(corner.index, 7, frameSeed) >= 0.45 + handwork * 0.55) continue;
    const point = samples[corner.index];
    const reach = Math.max(1, Math.round(5 * dpr / step));
    const before = at(corner.index - reach), after = at(corner.index + reach);
    const incomingLength = Math.hypot(point.x - before.x, point.y - before.y) || 1;
    const outgoingLength = Math.hypot(after.x - point.x, after.y - point.y) || 1;
    const incoming = { x: (point.x - before.x) / incomingLength,
      y: (point.y - before.y) / incomingLength };
    const outgoing = { x: (after.x - point.x) / outgoingLength,
      y: (after.y - point.y) / outgoingLength };
    const countTips = hash2(corner.index, 8, frameSeed) < 0.28 + handwork * 0.25 ? 2 : 1;
    for (let tip = 0; tip < countTips; tip++) {
      const tangent = tip === 0 ? incoming : outgoing;
      const length = (1.3 + hash2(corner.index, 9 + tip, frameSeed) * 1.8) * dpr;
      const start = tip === 0 ? -1.5 * dpr : -length;
      const end = tip === 0 ? length : 1.5 * dpr;
      const countStamps = Math.ceil((end - start) / Math.max(0.6 * dpr, step));
      for (let i = 0; i <= countStamps; i++) {
        const offset = start + (end - start) * i / countStamps;
        const extension = tip === 0 ? Math.max(0, offset) : Math.max(0, -offset);
        const tipDensity = (0.35 + handwork * 0.7) * (1 - extension / length * 0.78);
        output.push({ x: point.x + tangent.x * offset, y: point.y + tangent.y * offset,
          distance: point.distance + offset, tangentX: tangent.x, tangentY: tangent.y, tipDensity });
      }
    }
  }
  return output;
}

function gesturePressure(progress: number, profile: readonly number[] | undefined, seed: number): number {
  if (!profile?.length) return 0.72 + smoothNoise(progress * 2.4, seed ^ 0x3bd1) * 0.6;
  if (profile.length === 1) return clamp(profile[0], 0.55, 1.4);
  const position = clamp(progress, 0, 1) * (profile.length - 1);
  const index = Math.min(Math.floor(position), profile.length - 2);
  const t = position - index;
  const left = profile[index], right = profile[index + 1];
  const previous = profile[Math.max(0, index - 1)], next = profile[Math.min(profile.length - 1, index + 2)];
  const tangentLeft = (right - previous) * 0.5, tangentRight = (next - left) * 0.5;
  const t2 = t * t, t3 = t2 * t;
  const value = (2 * t3 - 3 * t2 + 1) * left + (t3 - 2 * t2 + t) * tangentLeft
    + (-2 * t3 + 3 * t2) * right + (t3 - t2) * tangentRight;
  return clamp(value, Math.max(0.55, Math.min(left, right)), Math.min(1.4, Math.max(left, right)));
}

function transformPoint(point: Point, stroke: PencilContourStroke, scale: number, offsetX: number, offsetY: number): Point {
  const transform = stroke.transform;
  const localScale = transform?.scale ?? 1;
  const angle = transform?.rotation ?? 0;
  const x = point.x * localScale, y = point.y * localScale;
  return {
    x: offsetX + (x * Math.cos(angle) - y * Math.sin(angle) + (transform?.x ?? 0)) * scale,
    y: offsetY + (x * Math.sin(angle) + y * Math.cos(angle) + (transform?.y ?? 0)) * scale
  };
}

function samplePolyline(points: Point[], step: number): Array<Point & { distance: number }> {
  const samples: Array<Point & { distance: number }> = [{ ...points[0], distance: 0 }];
  let total = 0;
  let next = step;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const segment = Math.hypot(b.x - a.x, b.y - a.y);
    while (segment > 0 && next <= total + segment) {
      const t = (next - total) / segment;
      samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, distance: next });
      next += step;
    }
    total += segment;
  }
  if (total > samples[samples.length - 1].distance + step * 0.35) {
    samples.push({ ...points[points.length - 1], distance: total });
  }
  return samples;
}

function paperContact(x: number, y: number, seed: number, toothCache: Uint8Array, index: number, boilFrame: number, boilStrength: number): number {
  if (toothCache[index] === 0) {
    const stableFine = hash2(x, y, seed);
    const movingFine = boilStrength > 0 ? hash2(x, y, seed ^ Math.imul(boilFrame + 1, 0x9e3779b9)) : stableFine;
    const fine = stableFine * (1 - boilStrength) + movingFine * boilStrength;
    const mid = hash2(x >> 2, y >> 2, seed ^ 0x571a);
    const broad = hash2(x >> 4, y >> 3, seed ^ 0x23a7);
    toothCache[index] = 1 + Math.floor((fine * 0.5 + mid * 0.33 + broad * 0.17) * 254);
  }
  return toothCache[index] / 255;
}

function strokeContact(along: number, across: number, seed: number, boilFrame: number, boilStrength: number): number {
  const x = Math.floor(along), y = Math.floor(across);
  const stableFine = hash2(x, y, seed ^ 0x61c8);
  const lane = Math.floor(across * 0.7);
  const stableMid = smoothNoise(along / 5.5, seed ^ Math.imul(lane, 0x5bd1e995) ^ 0x571a);
  const fine = boilStrength > 0 ? stableFine * (1 - boilStrength) +
    hash2(x, y, seed ^ Math.imul(boilFrame + 1, 0x27d4eb2d)) * boilStrength : stableFine;
  const mid = boilStrength > 0 ? stableMid * (1 - boilStrength) +
    smoothNoise(along / 5.5, seed ^ Math.imul(lane, 0x5bd1e995) ^
      Math.imul(boilFrame + 1, 0x6a09e667)) * boilStrength : stableMid;
  const broad = smoothNoise(along / 24, seed ^ Math.imul(Math.floor(across / 3), 0x119de1f3) ^ 0x23a7);
  return fine * 0.29 + mid * 0.47 + broad * 0.24;
}

/** Растеризует векторную ось штриха с физической шириной в CSS px и зерном бумаги. */
export function renderPencilContours(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  strokes: PencilContourStroke[],
  options: PencilContourOptions
): void {
  if (!(options.sceneWidth > 0 && options.sceneHeight > 0 && options.cssWidth > 0 && options.cssHeight > 0)) {
    throw new Error("Contour dimensions must be positive");
  }
  const dpr = clamp(options.dpr ?? 1, 1, 3);
  const width = Math.round(options.cssWidth * dpr);
  const height = Math.round(options.cssHeight * dpr);
  canvas.width = width;
  canvas.height = height;
  if ("style" in canvas) {
    canvas.style.width = `${options.cssWidth}px`;
    canvas.style.height = `${options.cssHeight}px`;
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const scale = Math.min(width / options.sceneWidth, height / options.sceneHeight);
  const offsetX = (width - options.sceneWidth * scale) / 2;
  const offsetY = (height - options.sceneHeight * scale) / 2;
  const smoothingPx = clamp(options.smoothingCss ?? 0, 0, 3) * dpr;
  const prepared = strokes.map(stroke => {
    const widthPx = clamp(stroke.brush.widthCss * dpr, 0.25, 64 * dpr);
    const pressureProfile = stroke.pressureProfile?.map(value => Number.isFinite(value) ? clamp(value, 0.55, 1.4) : 1);
    const contours = flattenPath(stroke.path, Math.max(0.06, 0.27 / scale))
      .map(contour => ({
        closed: contour.closed,
        points: softenPolyline(contour.points.map(point => transformPoint(point, stroke, scale, offsetX, offsetY)),
          contour.closed, smoothingPx)
      }));
    return { stroke, widthPx, pressureProfile, contours };
  });
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (const entry of prepared) {
    const padding = Math.ceil(entry.widthPx * 1.1 + 3 * dpr);
    for (const contour of entry.contours) for (const point of contour.points) {
      minX = Math.min(minX, Math.floor(point.x) - padding);
      minY = Math.min(minY, Math.floor(point.y) - padding);
      maxX = Math.max(maxX, Math.ceil(point.x) + padding);
      maxY = Math.max(maxY, Math.ceil(point.y) + padding);
    }
  }
  minX = clamp(minX, 0, width);
  minY = clamp(minY, 0, height);
  maxX = clamp(maxX, -1, width - 1);
  maxY = clamp(maxY, -1, height - 1);
  if (maxX < minX || maxY < minY) return;
  const tileWidth = maxX - minX + 1;
  const tileHeight = maxY - minY + 1;
  const pixels = tileWidth * tileHeight;
  const opacity = new Float32Array(pixels);
  const colorIds = new Uint8Array(pixels);
  const tooth = new Uint8Array(pixels);
  const image = context.createImageData(tileWidth, tileHeight);
  const colorBytes = image.data;
  const colorKeys = new Map<string, number>();
  const paperSeed = options.seed ?? 73571;
  const boilFrame = Math.max(0, Math.floor(options.boilFrame ?? 0));
  const boilStrength = clamp(options.boilStrength ?? 0, 0, 1);
  const strokeGrain = options.grainSpace === "stroke";
  const redrawFrame = Math.max(0, Math.floor(options.redrawFrame ?? 0));
  const redrawStrengthPx = strokeGrain ? clamp(options.redrawStrengthCss ?? 0, 0, 1.5) * dpr : 0;

  for (const entry of prepared) {
    const { stroke, widthPx } = entry;
    const brush = stroke.brush;
    const pigment = brush.pigment;
    const tip = brush.tip;
    const colorKey = pigment.join(",");
    let colorId = colorKeys.get(colorKey);
    if (colorId === undefined) {
      colorId = Math.min(colorKeys.size + 1, 255);
      colorKeys.set(colorKey, colorId);
    }
    const strokeSeed = hash(paperSeed, stroke.id);
    const redrawSeed = strokeSeed ^ Math.imul(redrawFrame + 1, 0x3c6ef35f);
    const phaseA = hash2(0, 0, redrawSeed) * Math.PI * 2;
    const phaseB = hash2(1, 0, redrawSeed) * Math.PI * 2;
    for (const contour of entry.contours) {
      const sampleStep = clamp(widthPx * 0.27, 0.38 * dpr, 1.1 * dpr);
      const samples = samplePolyline(contour.points, sampleStep);
      const total = samples[samples.length - 1]?.distance ?? 0;
      const materialLength = stroke.materialLengthCss ? stroke.materialLengthCss * dpr : total;
      const handwork = clamp(brush.handwork ?? 0, 0, 1);
      const retraceAmount = Math.min(1, handwork * 2);
      const roundMetrics = handwork > 0 ? roundedContourMetrics(samples, total, contour.closed) : undefined;
      const rounded = roundMetrics?.rounded ?? false;
      const handFrameSeed = strokeSeed ^ Math.imul(redrawFrame + 1, 0x27d4eb2d)
        ^ Math.imul(boilFrame + 1, 0x6a09e667);
      const candidates = handwork > 0 && total > 0
        ? handworkCandidates(samples, total, sampleStep, contour.closed, entry.pressureProfile, strokeSeed, dpr, roundMetrics)
        : [];
      const contourScale = contour.closed ? clamp(materialLength / (120 * dpr), 0.35, 1) : 0;
      const shapeAmplitude = widthPx * handwork * contourScale * (rounded ? 0.75 : 0.6);
      const shapePhaseA = hash2(12, 0, handFrameSeed) * Math.PI * 2;
      const shapePhaseB = hash2(12, 1, handFrameSeed) * Math.PI * 2;
      const pressurePhaseA = hash2(13, 0, strokeSeed) * Math.PI * 2;
      const pressurePhaseB = hash2(13, 1, strokeSeed) * Math.PI * 2;
      const lowerCandidates = rounded && roundMetrics ? candidates.filter(candidate =>
        samples[candidate.index].y >= roundMetrics.maxY - roundMetrics.height * 0.05) : [];
      const toMaterial = (candidate: HandworkCandidate): number => candidate.distance / total * materialLength;
      const joinMarks: HandworkMark[] = [];
      const addJoin = (candidate: HandworkCandidate, salt: number, strength: number) => {
        const side = rounded ? 1 : hash2(salt, 4, handFrameSeed) < 0.5 ? -1 : 1;
        joinMarks.push({ position: toMaterial(candidate),
          before: rounded
            ? Math.min((6 + hash2(salt, 5, handFrameSeed) * 2.5) * dpr, materialLength * 0.07)
            : Math.min((5 + hash2(salt, 5, handFrameSeed) * 3) * dpr, materialLength * 0.11),
          after: rounded
            ? Math.min((6.5 + hash2(salt, 6, handFrameSeed) * 2.5) * dpr, materialLength * 0.07)
            : Math.min((6 + hash2(salt, 6, handFrameSeed) * 3) * dpr, materialLength * 0.11),
          shift: side * (rounded
            ? Math.min((1.3 + Math.pow(hash2(salt, 7, handFrameSeed), 1.5) * 0.45) * widthPx
              * clamp(materialLength / (140 * dpr), 0.55, 1), materialLength * 0.07)
            : (0.14 + hash2(salt, 7, handFrameSeed) * 0.14) * widthPx),
          strength: (rounded ? (0.7 + handwork * 0.3) * clamp(handwork / 0.25, 0, 1)
            : 0.45 + handwork * 0.45) * strength });
      };
      const firstJoinCandidates = rounded && lowerCandidates.length && hash2(0, 11, handFrameSeed) < 0.96
        ? lowerCandidates : candidates;
      const firstJoin = rounded || hash2(0, 1, handFrameSeed) < 0.65 + handwork * 0.25
        ? chooseHandworkCandidate(firstJoinCandidates, handFrameSeed, 1, "join") : undefined;
      if (firstJoin) addJoin(firstJoin, 1, 1);
      const secondJoin = firstJoin && !rounded && hash2(0, 2, handFrameSeed) < 0.18 + handwork * 0.35
        ? chooseHandworkCandidate(candidates, handFrameSeed, 2, "join", firstJoin.distance,
          Math.min(total * 0.2, 20 * dpr)) : undefined;
      if (secondJoin) addJoin(secondJoin, 2, 0.8);
      const retrace = !rounded && hash2(0, 3, handFrameSeed) < 0.4 + retraceAmount * 0.4
        ? chooseHandworkCandidate(candidates, handFrameSeed, 3, "retrace") : undefined;
      const retraceCenter = retrace ? toMaterial(retrace) : -Infinity;
      const retraceHalf = (11 + hash2(5, 1, handFrameSeed) * 5) * dpr;
      const retraceSide = brush.handworkSide ?? (hash2(5, 2, handFrameSeed) < 0.5 ? -1 : 1);
      const cornerSamples = rounded ? [] : cornerExtensionSamples(samples, candidates, total, sampleStep,
        contour.closed, handFrameSeed, handwork, dpr);
      const frayCount = brush.fray && brush.fray > 0 ? 2 : 0;
      for (let i = 0; i < samples.length + cornerSamples.length; i++) {
        const cornerSample = i >= samples.length ? cornerSamples[i - samples.length] : undefined;
        const sample = cornerSample ?? samples[i];
        const prev = samples[clamp(i - 1, 0, samples.length - 1)];
        const next = samples[clamp(i + 1, 0, samples.length - 1)];
        const dx = next.x - prev.x, dy = next.y - prev.y;
        const length = Math.hypot(dx, dy) || 1;
        const tangentX = cornerSample?.tangentX ?? dx / length;
        const tangentY = cornerSample?.tangentY ?? dy / length;
        const taperMode = contour.closed ? "none" : stroke.taper ?? "both";
        const taperLength = (brush.taperLengthCss ?? brush.widthCss * 3) * dpr;
        const head = taperMode === "both" || taperMode === "start"
          ? (taperLength > 0 ? clamp(sample.distance / taperLength, 0, 1) : 1) : 1;
        const tail = taperMode === "both" || taperMode === "end"
          ? (taperLength > 0 ? clamp((total - sample.distance) / taperLength, 0, 1) : 1) : 1;
        const fade = Math.min(head, tail);
        const taperMinimum = clamp(brush.taperMinimum ?? 0.36, 0.05, 1);
        const taper = taperMinimum + (1 - taperMinimum) * fade * fade * (3 - 2 * fade);
        const progress = total > 0 ? clamp(sample.distance / total, 0, 1) : 0;
        const authored = gesturePressure(progress, entry.pressureProfile, strokeSeed);
        const variation = clamp(brush.pressureVariation ?? 1, 0, 2);
        const random = 1 + (smoothNoise(progress * 3.2, strokeSeed ^ 0x81f3) - 0.5)
          * clamp(brush.randomness ?? 0, 0, 1) * 0.64;
        const roundPressure = rounded ? 1 + handwork * (
          Math.sin(progress * Math.PI * 2 + pressurePhaseA) * 0.14
          + Math.sin(progress * Math.PI * 6 + pressurePhaseB) * 0.08) : 1;
        const pressure = clamp((1 + (authored - 1) * variation) * (brush.pressureScale ?? 1)
          * random * roundPressure, 0.1, 2.5) * taper;
        const materialPosition = progress * materialLength;
        const roundSplit = rounded && !cornerSample && joinMarks[0]
          ? roundedGestureSplit(materialPosition, materialLength, joinMarks[0], dpr) : undefined;
        const overlap = cornerSample || rounded ? { presence: 0, shift: 0, strength: 0 }
          : handworkOverlap(materialPosition, materialLength, contour.closed, joinMarks, dpr);
        const retracePresence = handwork > 0
          ? softBand(materialPosition - retraceCenter, 3 * dpr, retraceHalf) : 0;
        const redrawOffset = redrawStrengthPx === 0 ? 0 : redrawStrengthPx * (rounded ? 0.35 : 1) * (
          Math.sin(progress * Math.PI * 4 + phaseA) * 0.62 +
          Math.sin(progress * Math.PI * 10 + phaseB) * 0.24
        );
        const contourAxisOffset = contour.closed ? shapeAmplitude * (
          Math.sin(progress * Math.PI * 4 + shapePhaseA) * 0.7
          + Math.sin(progress * Math.PI * 6 + shapePhaseB) * 0.3) : 0;
        const joinIndex = 3 + frayCount;
        const retraceIndex = joinIndex + 1;
        const baseStrands = 3 + frayCount;
        const strandCount = cornerSample ? 1 : roundSplit ? baseStrands * 2
          : rounded ? baseStrands : baseStrands + (handwork > 0 ? 2 : 0);
        for (let strand = 0; strand < strandCount; strand++) {
          const splitPass = roundSplit ? Math.floor(strand / baseStrands) : 0;
          const strandIndex = roundSplit ? strand % baseStrands : strand;
          const gestureWeight = roundSplit ? (splitPass === 0 ? roundSplit.left : roundSplit.right) : 1;
          const companionWeight = roundSplit ? (splitPass === 0 ? roundSplit.right : roundSplit.left) : 0;
          const auxiliary = Math.max(0, companionWeight - gestureWeight);
          const sharedDeposit = roundSplit ? Math.min(roundSplit.left, roundSplit.right) : 0;
          const gestureTone = roundSplit ? 1 - 0.45 * sharedDeposit - 0.32 * auxiliary : 1;
          if (gestureWeight < 0.03) continue;
          if (auxiliary > 0.05 && strandIndex !== 1) continue;
          const join = !rounded && strandIndex === joinIndex;
          const retrace = !rounded && strandIndex === retraceIndex;
          const echo = strandIndex >= 3 && strandIndex < joinIndex;
          if (join && overlap.presence < 0.03) continue;
          if (retrace && retracePresence < 0.03) continue;
          const echoStrength = echo
            ? smoothNoise(sample.distance / (31 * dpr), strokeSeed ^ (strandIndex * 0x6389))
            : 1;
          if (echo && echoStrength < 0.45) continue;
          const strandDensity = cornerSample ? cornerSample.tipDensity : join
            ? overlap.strength * overlap.presence * 0.75 : retrace
            ? retraceAmount * retracePresence * 0.65 : echo
            ? clamp(brush.fray ?? 0, 0, 1) * (echoStrength - 0.45) * 1.25
            : auxiliary > 0.05 ? 2.8 : strandIndex === 1 ? 1.24 : strandIndex === 0 ? 0.68 : 0.78;
          const materialShift = join ? overlap.shift : (cornerSample ? 0 : retrace ? retraceSide * 0.52 : echo
            ? (strandIndex === 3 ? -0.43 : 0.43) : (strandIndex - 1) * 0.23) * widthPx;
          const shift = materialShift + redrawOffset + contourAxisOffset + (roundSplit
            ? (roundMetrics?.inwardSign ?? 1) * (splitPass === 0
              ? roundSplit.firstShift : roundSplit.secondShift) : 0);
          const centerX = sample.x - tangentY * shift;
          const centerY = sample.y + tangentX * shift;
          const strandWidth = cornerSample ? 0.15 : join ? 0.18 : retrace ? 0.18
            : echo ? 0.14 : strandIndex === 1 ? 0.27 : 0.22;
          const splitWidth = roundSplit ? (1 - 0.55 * auxiliary - 0.3 * sharedDeposit)
            * (0.48 + 0.52 * Math.sqrt(gestureWeight)) : 1;
          const acrossRadius = Math.max(0.3 * dpr, widthPx * pressure * strandWidth * splitWidth);
          const alongRadius = Math.max(0.5 * dpr, acrossRadius * (1.55 + clamp(brush.tilt, 0, 1) * 0.76));
          const referenceAcross = Math.max(0.3 * dpr, widthPx * strandWidth);
          const referenceAlong = Math.max(0.5 * dpr, referenceAcross * (1.55 + clamp(brush.tilt, 0, 1) * 0.76));
          const flow = strokeGrain ? clamp(sampleStep / (2 * referenceAlong) * 1.7, 0.3, 0.92) : 1;
          const reach = Math.ceil(Math.max(acrossRadius, alongRadius) + 1);
          const stampMinX = Math.max(minX, Math.floor(centerX - reach)), stampMaxX = Math.min(maxX, Math.ceil(centerX + reach));
          const stampMinY = Math.max(minY, Math.floor(centerY - reach)), stampMaxY = Math.min(maxY, Math.ceil(centerY + reach));
          for (let y = stampMinY; y <= stampMaxY; y++) {
            for (let x = stampMinX; x <= stampMaxX; x++) {
              const relativeX = x + 0.5 - centerX, relativeY = y + 0.5 - centerY;
              const along = (relativeX * tangentX + relativeY * tangentY) / alongRadius;
              const across = (-relativeX * tangentY + relativeY * tangentX) / acrossRadius;
              const radius2 = along * along + across * across;
              if (radius2 >= 1) continue;
              const index = (y - minY) * tileWidth + x - minX;
              const contact = strokeGrain
                ? strokeContact(progress * materialLength + along * alongRadius,
                  materialShift + across * acrossRadius, strokeSeed, boilFrame, boilStrength)
                : paperContact(x, y, paperSeed, tooth, index, boilFrame, boilStrength);
              const edgeDistance = (1 - radius2) * (0.7 - 0.2 * radius2) * acrossRadius;
              let coverage = clamp(edgeDistance + 0.3, 0, 1);
              if (tip) {
                const tipX = Math.min(tip.width - 1, Math.max(0, Math.floor((across + 1) * 0.5 * tip.width)));
                const tipY = Math.min(tip.height - 1, Math.max(0, Math.floor((along + 1) * 0.5 * tip.height)));
                coverage *= tip.pixels[(tipY * tip.width + tipX) * 4 + 3] / 255;
                if (coverage <= 0) continue;
              }
              const pressureTooth = strokeGrain ? clamp(1 - pressure, -0.4, 0.6) * 0.1 : 0;
              const threshold = brush.grain * (0.47 + (1 - coverage) * 0.72) + pressureTooth;
              if (contact < threshold) continue;
              const adhesion = strokeGrain ? clamp((contact - threshold) * 2.8, 0, 1) : 1;
              const tone = strokeGrain ? (0.18 + adhesion * 0.82) * (0.55 + contact * 0.45) : 0.38 + contact * 0.62;
              const handContact = !cornerSample && !join && !retrace && !rounded
                ? 1 - Math.min(0.16, handwork * 0.16) * overlap.presence : 1;
              const deposit = clamp(brush.density * strandDensity * coverage * tone * pressure * flow
                * handContact * gestureWeight * gestureTone, 0, 0.86);
              const added = (1 - opacity[index]) * deposit;
              const prior = opacity[index];
              const current = prior + added;
              opacity[index] = current;
              const offset = index * 4;
              if (prior === 0) {
                colorBytes[offset] = pigment[0];
                colorBytes[offset + 1] = pigment[1];
                colorBytes[offset + 2] = pigment[2];
                colorIds[index] = colorId;
              } else if (colorIds[index] !== colorId || colorId === 255) {
                colorBytes[offset] = (colorBytes[offset] * prior + pigment[0] * added) / current;
                colorBytes[offset + 1] = (colorBytes[offset + 1] * prior + pigment[1] * added) / current;
                colorBytes[offset + 2] = (colorBytes[offset + 2] * prior + pigment[2] * added) / current;
                colorIds[index] = 255;
              }
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < pixels; i++) {
    const alpha = opacity[i];
    if (alpha <= 0) continue;
    const offset = i * 4;
    colorBytes[offset + 3] = Math.round(alpha * 0.88 * 255);
  }
  context.putImageData(image, minX, minY);
}
