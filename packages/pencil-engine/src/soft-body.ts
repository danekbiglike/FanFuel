import { flattenPath } from "./geometry.js";
import type { PathCommand, Point } from "./model.js";

export type SoftBodySurface = { id: string; left: number; right: number; top: number; bottom?: number; solid?: boolean };
export type SoftBodyImpact = {
  surfaceId: string;
  speed: number;
  kind: "soft" | "hard";
  normal: "top" | "left" | "right" | "bottom";
  squeeze?: { surfaceIds: [string, string]; axis: "x" | "y"; compression: number };
};
export type SoftBodyBounds = { x: number; y: number; width: number; height: number };
export type SoftBodyOptions = { maxSegmentLength?: number; maxSpringStretch?: number };
export type SoftBodyNode = Point & { previousX: number; previousY: number };
export type SoftBodyGrab = {
  nodeIndex: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  vx: number;
  vy: number;
  influenceWeights: Float32Array;
};
export type SoftBody = {
  bounds: SoftBodyBounds;
  columns: number;
  rows: number;
  nodes: SoftBodyNode[];
  springs: Array<{ a: number; b: number; length: number }>;
  triangles: Array<{ a: number; b: number; c: number; minimumArea: number }>;
  collider?: BoundPath;
  contactRadius: number;
  softness: number;
  maxSpringStretch: number;
  worldBounds?: { left: number; right: number; top?: number };
  grab?: SoftBodyGrab;
  impactCooldown: number;
  squeezeActive?: boolean;
  supportSurfaceId?: string;
  sleeping: boolean;
  restSeconds: number;
  sleepSurfaceTop?: number;
};

export type BoundPoint = { cell: number; u: number; v: number };
export type BoundPath = { contours: Array<{ closed: boolean; points: BoundPoint[] }> };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Небольшая решётка формы: частицы и ограничения длины работают в CSS px. */
export function createSoftBody(bounds: SoftBodyBounds, columnsOrOptions: number | SoftBodyOptions = 5, rows = 5): SoftBody {
  const options = typeof columnsOrOptions === "object" ? columnsOrOptions : undefined;
  const maxSegmentLength = options?.maxSegmentLength ?? 28;
  const columns = options ? clamp(Math.ceil(bounds.width / maxSegmentLength) + 1, 5, 9) : columnsOrOptions as number;
  rows = options ? clamp(Math.ceil(bounds.height / maxSegmentLength) + 1, 5, 9) : rows;
  if (!(bounds.width > 0 && bounds.height > 0) || columns < 2 || rows < 2) throw new Error("Invalid soft body bounds");
  if (options && (!(maxSegmentLength > 0) || !Number.isFinite(maxSegmentLength))) throw new Error("Invalid soft body segment length");
  const maxSpringStretch = options?.maxSpringStretch ?? 1.45;
  if (!(maxSpringStretch >= 1.05 && maxSpringStretch <= 2.5)) throw new Error("Invalid soft body stretch limit");
  const nodes: SoftBodyNode[] = [];
  const springs: SoftBody["springs"] = [];
  const triangles: SoftBody["triangles"] = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const x = bounds.x + bounds.width * column / (columns - 1);
    const y = bounds.y + bounds.height * row / (rows - 1);
    nodes.push({ x, y, previousX: x, previousY: y });
  }
  const add = (a: number, b: number) => {
    const first = nodes[a], second = nodes[b];
    springs.push({ a, b, length: Math.hypot(second.x - first.x, second.y - first.y) });
  };
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const index = row * columns + column;
    if (column + 1 < columns) add(index, index + 1);
    if (row + 1 < rows) add(index, index + columns);
    if (column + 1 < columns && row + 1 < rows) {
      add(index, index + columns + 1);
      add(index + 1, index + columns);
    }
    if (column + 2 < columns) add(index, index + 2);
    if (row + 2 < rows) add(index, index + columns * 2);
    if (column + 1 < columns && row + 1 < rows) {
      const right = index + 1, below = index + columns, diagonal = below + 1;
      const minimumArea = bounds.width * bounds.height / ((columns - 1) * (rows - 1)) * 0.35;
      triangles.push({ a: index, b: right, c: below, minimumArea });
      triangles.push({ a: right, b: diagonal, c: below, minimumArea });
    }
  }
  const body: SoftBody = { bounds, columns, rows, nodes, springs, triangles, contactRadius: 0, softness: 0.6, maxSpringStretch,
    impactCooldown: 0, squeezeActive: false, sleeping: false, restSeconds: 0 };
  setSoftBodyCollider(body, [
    { op: "M", x: bounds.x, y: bounds.y },
    { op: "L", x: bounds.x + bounds.width, y: bounds.y },
    { op: "L", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { op: "L", x: bounds.x, y: bounds.y + bounds.height }, { op: "Z" }
  ]);
  return body;
}

/** Контактная граница берётся из видимого силуэта, а не из прямоугольника решётки. */
export function setSoftBodyCollider(body: SoftBody, path: PathCommand[], radius = 0): void {
  const bound = bindSoftBodyPath(path, body, 1.2);
  if (!bound.contours.some(contour => contour.closed && contour.points.length >= 4)) {
    throw new Error("Soft body collider must be a closed path");
  }
  body.collider = bound;
  body.contactRadius = Math.max(0, radius);
}

/** 0 — упругая плотная форма, 1 — самый мягкий вариант стенда. */
export function setSoftBodySoftness(body: SoftBody, softness: number): void {
  if (!Number.isFinite(softness)) throw new Error("Invalid soft body softness");
  body.softness = clamp(softness, 0, 1);
  body.sleeping = false;
  body.restSeconds = 0;
}

/** Верхний предел длины локальной связи относительно длины покоя. */
export function setSoftBodyMaxSpringStretch(body: SoftBody, ratio: number): void {
  if (!Number.isFinite(ratio) || ratio < 1.05 || ratio > 2.5) throw new Error("Invalid soft body stretch limit");
  body.maxSpringStretch = ratio;
  body.sleeping = false;
  body.restSeconds = 0;
}

function boundWeights(body: SoftBody, point: BoundPoint): Array<{ index: number; weight: number }> {
  const { cell, u, v } = point;
  return [
    { index: cell, weight: (1 - u) * (1 - v) },
    { index: cell + 1, weight: u * (1 - v) },
    { index: cell + body.columns, weight: (1 - u) * v },
    { index: cell + body.columns + 1, weight: u * v }
  ];
}

function boundPosition(body: SoftBody, point: BoundPoint): Point {
  let x = 0, y = 0;
  for (const { index, weight } of boundWeights(body, point)) {
    x += body.nodes[index].x * weight;
    y += body.nodes[index].y * weight;
  }
  return { x, y };
}

function projectBoundPoint(body: SoftBody, point: BoundPoint, axis: "x" | "y", correction: number): boolean {
  const weights = boundWeights(body, point).filter(weight => weight.index !== body.grab?.nodeIndex);
  const denominator = weights.reduce((sum, weight) => sum + weight.weight ** 2, 0);
  if (denominator < 1e-7) return false;
  for (const { index, weight } of weights) {
    const node = body.nodes[index];
    node[axis] += correction * weight / denominator;
    if (axis === "x") node.previousX = node.x;
    else node.previousY = node.y;
  }
  return true;
}

/** Координаты точек физического силуэта в текущей деформированной позе. */
export function softBodyColliderPoints(body: SoftBody): Point[] {
  if (!body.collider) return [];
  return body.collider.contours.filter(contour => contour.closed)
    .flatMap(contour => contour.points.slice(0, -1).map(point => boundPosition(body, point)));
}

function solveTriangle(body: SoftBody, triangle: SoftBody["triangles"][number]): void {
  const a = body.nodes[triangle.a], b = body.nodes[triangle.b], c = body.nodes[triangle.c];
  const area = ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) * 0.5;
  if (area >= triangle.minimumArea) return;
  const gradients = [
    { x: (b.y - c.y) * 0.5, y: (c.x - b.x) * 0.5, index: triangle.a },
    { x: (c.y - a.y) * 0.5, y: (a.x - c.x) * 0.5, index: triangle.b },
    { x: (a.y - b.y) * 0.5, y: (b.x - a.x) * 0.5, index: triangle.c }
  ];
  const denominator = gradients.reduce((sum, gradient) =>
    sum + (gradient.index === body.grab?.nodeIndex ? 0 : gradient.x ** 2 + gradient.y ** 2), 0);
  if (denominator < 1e-7) return;
  const correction = Math.min(3, (triangle.minimumArea - area) / denominator * 0.65);
  for (const gradient of gradients) {
    if (gradient.index === body.grab?.nodeIndex) continue;
    const node = body.nodes[gradient.index];
    node.x += gradient.x * correction;
    node.y += gradient.y * correction;
  }
}

function restorePose(body: SoftBody): void {
  if (body.grab) return;
  const center = body.nodes.reduce((sum, node) => ({ x: sum.x + node.x, y: sum.y + node.y }), { x: 0, y: 0 });
  center.x /= body.nodes.length;
  center.y /= body.nodes.length;
  const top = body.nodes[Math.floor((body.columns - 1) / 2)];
  const bottom = body.nodes[(body.rows - 1) * body.columns + Math.floor((body.columns - 1) / 2)];
  const angle = Math.atan2(top.x - bottom.x, bottom.y - top.y);
  const sine = Math.sin(angle), cosine = Math.cos(angle);
  const strength = 0.008 - body.softness * 0.006;
  for (let row = 0; row < body.rows; row++) for (let column = 0; column < body.columns; column++) {
    const node = body.nodes[row * body.columns + column];
    const localX = body.bounds.width * (column / (body.columns - 1) - 0.5);
    const localY = body.bounds.height * (row / (body.rows - 1) - 0.5);
    const targetX = center.x + localX * cosine - localY * sine;
    const targetY = center.y + localX * sine + localY * cosine;
    node.x += (targetX - node.x) * strength;
    node.y += (targetY - node.y) * strength;
  }
}

function rightBody(body: SoftBody, grounded: boolean): void {
  if (body.grab || !grounded) return;
  const top = body.nodes[Math.floor((body.columns - 1) / 2)];
  const bottom = body.nodes[(body.rows - 1) * body.columns + Math.floor((body.columns - 1) / 2)];
  const angle = Math.atan2(top.x - bottom.x, bottom.y - top.y);
  if (Math.abs(angle) < 0.002) return;
  const correction = -angle * 0.07;
  const center = body.nodes[Math.floor(body.rows / 2) * body.columns + Math.floor(body.columns / 2)];
  const sine = Math.sin(correction), cosine = Math.cos(correction);
  for (const node of body.nodes) {
    const x = node.x - center.x, y = node.y - center.y;
    node.x = center.x + x * cosine - y * sine;
    node.y = center.y + x * sine + y * cosine;
    const previousX = node.previousX - center.x, previousY = node.previousY - center.y;
    node.previousX = center.x + previousX * cosine - previousY * sine;
    node.previousY = center.y + previousX * sine + previousY * cosine;
  }
}

export function grabSoftBody(body: SoftBody, point: Point): boolean {
  const nearest = body.nodes.reduce((best, node, index) => {
    const distance = Math.hypot(point.x - node.x, point.y - node.y);
    return distance < best.distance ? { index, distance } : best;
  }, { index: -1, distance: Infinity });
  if (nearest.distance > Math.max(body.bounds.width, body.bounds.height) * 0.34) return false;
  body.sleeping = false;
  body.restSeconds = 0;
  const cellSize = Math.max(body.bounds.width / (body.columns - 1), body.bounds.height / (body.rows - 1));
  const influenceRadius = cellSize * 1.65;
  const anchor = body.nodes[nearest.index];
  const influenceWeights = new Float32Array(body.nodes.length);
  body.nodes.forEach((node, nodeIndex) => {
    const distance = Math.hypot(anchor.x - node.x, anchor.y - node.y);
    if (distance <= influenceRadius) influenceWeights[nodeIndex] = Math.cos(distance / influenceRadius * Math.PI / 2);
  });
  body.grab = { nodeIndex: nearest.index, x: anchor.x, y: anchor.y,
    offsetX: point.x - anchor.x, offsetY: point.y - anchor.y, vx: 0, vy: 0,
    influenceWeights };
  return true;
}

export function moveSoftBodyGrab(body: SoftBody, point: Point, elapsedSeconds: number): void {
  if (!body.grab) return;
  const elapsed = clamp(elapsedSeconds, 1 / 240, 0.1);
  const targetX = point.x - body.grab.offsetX, targetY = point.y - body.grab.offsetY;
  const dx = targetX - body.grab.x, dy = targetY - body.grab.y;
  body.grab.vx = clamp(dx / elapsed, -1800, 1800);
  body.grab.vy = clamp(dy / elapsed, -1800, 1800);
  for (let index = 0; index < body.nodes.length; index++) {
    const node = body.nodes[index];
    const movement = 0.25 + body.grab.influenceWeights[index] * 0.75;
    node.x += dx * movement;
    node.y += dy * movement;
    node.previousX += dx * movement;
    node.previousY += dy * movement;
  }
  body.grab.x = targetX;
  body.grab.y = targetY;
}

export function releaseSoftBody(body: SoftBody, stepSeconds = 1 / 120): void {
  if (!body.grab) return;
  const { vx, vy, nodeIndex } = body.grab;
  const node = body.nodes[nodeIndex];
  node.previousX = node.x - clamp(vx, -900, 900) * stepSeconds;
  node.previousY = node.y - clamp(vy, -900, 900) * stepSeconds;
  body.grab = undefined;
  body.sleeping = false;
  body.restSeconds = 0;
}

/** Вызывать фиксированным шагом 1/120 с; возвращает контакт, требующий выбора клипа. */
export function stepSoftBody(body: SoftBody, seconds: number, surfaces: readonly SoftBodySurface[], hardImpactSpeed = 440): SoftBodyImpact | undefined {
  const dt = clamp(seconds, 1 / 240, 1 / 30);
  if (body.sleeping) {
    const support = surfaces.find(surface => surface.id === body.supportSurfaceId);
    const center = body.nodes[Math.floor(body.rows / 2) * body.columns + Math.floor(body.columns / 2)];
    if (support && Math.abs(support.top - (body.sleepSurfaceTop ?? support.top)) < 0.5 && !body.grab &&
      (support.bottom === undefined || center.x >= support.left && center.x <= support.right)) return;
    body.sleeping = false;
    body.restSeconds = 0;
  }
  body.impactCooldown = Math.max(0, body.impactCooldown - dt);
  const contacts = body.collider?.contours.filter(contour => contour.closed).flatMap(contour => contour.points.slice(0, -1)) ?? [];
  const priorContacts = contacts.map(point => boundPosition(body, point));
  for (const node of body.nodes) {
    const vx = (node.x - node.previousX) * 0.993;
    const vy = (node.y - node.previousY) * 0.993;
    node.previousX = node.x;
    node.previousY = node.y;
    node.x += vx;
    node.y += vy + 1100 * dt * dt;
  }
  rightBody(body, Boolean(body.supportSurfaceId));
  let impact: SoftBodyImpact | undefined;
  let supportSurfaceId: string | undefined;
  const contactsByNormal = new Map<SoftBodyImpact["normal"], Set<string>>();
  const springStrength = 0.16 - body.softness * 0.11;
  for (let iteration = 0; iteration < 7; iteration++) {
    for (const spring of body.springs) {
      const a = body.nodes[spring.a], b = body.nodes[spring.b];
      const dx = b.x - a.x, dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 1;
      const extension = distance - spring.length;
      const stretchCorrection = extension / distance * springStrength;
      const limitCorrection = Math.max(0, distance - spring.length * body.maxSpringStretch) / distance * 0.5;
      const correction = Math.min(stretchCorrection + limitCorrection, (distance - 1e-4) / (2 * distance));
      if (spring.a === body.grab?.nodeIndex) {
        b.x -= dx * correction * 2; b.y -= dy * correction * 2;
      } else if (spring.b === body.grab?.nodeIndex) {
        a.x += dx * correction * 2; a.y += dy * correction * 2;
      } else {
        a.x += dx * correction; a.y += dy * correction;
        b.x -= dx * correction; b.y -= dy * correction;
      }
    }
    for (const triangle of body.triangles) solveTriangle(body, triangle);
    restorePose(body);
    if (body.grab) {
      const node = body.nodes[body.grab.nodeIndex];
      node.x = body.grab.x;
      node.y = body.grab.y;
      node.previousX = node.x - body.grab.vx * dt;
      node.previousY = node.y - body.grab.vy * dt;
    }
    for (const surface of surfaces) {
      const center = body.nodes[Math.floor(body.rows / 2) * body.columns + Math.floor(body.columns / 2)];
      if (surface.bottom === undefined && !surface.solid && (center.x < surface.left - body.bounds.width * 0.1 ||
        center.x > surface.right + body.bounds.width * 0.1)) continue;
      for (let index = 0; index < contacts.length; index++) {
        const bound = contacts[index];
        const point = boundPosition(body, bound);
        const prior = priorContacts[index];
        const radius = body.contactRadius;
        let normal: SoftBodyImpact["normal"] = "top";
        let correction = surface.top - radius - point.y;
        if (surface.bottom === undefined) {
          if (point.x < surface.left || point.x > surface.right || correction >= 0) continue;
          const wasAbove = prior.y + radius <= surface.top + 6;
          if (!surface.solid && !wasAbove && !(center.y < surface.top + body.bounds.height * 0.25 && -correction < 28)) continue;
        } else {
          if (point.x + radius <= surface.left || point.x - radius >= surface.right ||
            point.y + radius <= surface.top || point.y - radius >= surface.bottom) continue;
          if (center.x < surface.left) normal = "left";
          else if (center.x > surface.right) normal = "right";
          else {
            const penetrations = {
              top: point.y + radius - surface.top,
              left: point.x + radius - surface.left,
              right: surface.right - point.x + radius,
              bottom: surface.bottom - point.y + radius
            };
            const crossed: Array<SoftBodyImpact["normal"]> = [];
            if (prior.y + radius <= surface.top + 1) crossed.push("top");
            if (prior.x + radius <= surface.left + 1) crossed.push("left");
            if (prior.x - radius >= surface.right - 1) crossed.push("right");
            if (prior.y - radius >= surface.bottom - 1) crossed.push("bottom");
            normal = (crossed.length ? crossed : ["top", "left", "right", "bottom"] as const)
              .reduce((best, side) => penetrations[side] < penetrations[best] ? side : best);
          }
          correction = normal === "top" ? surface.top - radius - point.y : normal === "left" ? surface.left - radius - point.x :
            normal === "right" ? surface.right + radius - point.x : surface.bottom + radius - point.y;
        }
        const axis = normal === "left" || normal === "right" ? "x" : "y";
        const direction = normal === "top" || normal === "left" ? 1 : -1;
        const speed = Math.max(0, (point[axis] - prior[axis]) * direction / dt);
        if (iteration === 0 && speed > 35 && body.impactCooldown <= 0 && (!impact || speed > impact.speed)) {
          impact = { surfaceId: surface.id, speed, kind: speed >= hardImpactSpeed ? "hard" : "soft", normal };
        }
        if (projectBoundPoint(body, bound, axis, correction)) {
          const ids = contactsByNormal.get(normal) ?? new Set<string>();
          ids.add(surface.id);
          contactsByNormal.set(normal, ids);
          if (normal === "top") supportSurfaceId = surface.id;
        }
      }
    }
    if (body.worldBounds) for (const bound of contacts) {
      const point = boundPosition(body, bound);
      const left = body.worldBounds.left + body.contactRadius;
      const right = body.worldBounds.right - body.contactRadius;
      const correction = point.x < left ? left - point.x : point.x > right ? right - point.x : 0;
      if (correction) projectBoundPoint(body, bound, "x", correction);
      if (body.worldBounds.top !== undefined && point.y < body.worldBounds.top + body.contactRadius) {
        projectBoundPoint(body, bound, "y", body.worldBounds.top + body.contactRadius - point.y);
      }
    }
  }
  const opposingPairs: Array<{ first: SoftBodyImpact["normal"]; second: SoftBodyImpact["normal"]; axis: "x" | "y" }> = [
    { first: "top", second: "bottom", axis: "y" },
    { first: "left", second: "right", axis: "x" }
  ];
  let squeeze: SoftBodyImpact["squeeze"];
  for (const pair of opposingPairs) {
    const firstIds = contactsByNormal.get(pair.first);
    const secondIds = contactsByNormal.get(pair.second);
    if (!firstIds || !secondIds) continue;
    const distinct = [...firstIds].flatMap(first => [...secondIds].filter(second => first !== second).map(second => [first, second] as [string, string]));
    if (!distinct.length) continue;
    const coordinates = body.nodes.map(node => node[pair.axis]);
    const extent = Math.max(...coordinates) - Math.min(...coordinates);
    const originalExtent = pair.axis === "x" ? body.bounds.width : body.bounds.height;
    const measuredCompression = clamp(1 - extent / originalExtent, 0, 1);
    const pairIds = distinct[0];
    const firstSurface = surfaces.find(surface => surface.id === pairIds[0]);
    const secondSurface = surfaces.find(surface => surface.id === pairIds[1]);
    const firstPlane = pair.axis === "x" ? firstSurface?.left : firstSurface?.top;
    const secondPlane = pair.axis === "x" ? secondSurface?.right : secondSurface?.bottom;
    const freeGap = firstPlane !== undefined && secondPlane !== undefined ? Math.abs(firstPlane - secondPlane) : originalExtent;
    const gapCompression = clamp(1 - freeGap / originalExtent, 0, 1);
    const compression = Math.max(measuredCompression, gapCompression);
    // Встречные проекции уже означают, что тело зажато; степень сжатия
    // оцениваем по зазору, так как упругие связи могут пока удерживать форму.
    squeeze = { surfaceIds: distinct[0], axis: pair.axis, compression };
    break;
  }
  const enteredSqueeze = Boolean(squeeze) && !body.squeezeActive;
  body.squeezeActive = Boolean(squeeze);
  if (enteredSqueeze && squeeze) {
    const squeezeKind = squeeze.compression >= 0.18 ? "hard" : "soft";
    impact = {
      surfaceId: squeeze.surfaceIds[0], speed: impact?.speed ?? 0,
      kind: impact?.kind === "hard" || squeezeKind === "hard" ? "hard" : "soft",
      normal: squeeze.axis === "y" ? "top" : "left", squeeze
    };
  } else if (impact && squeeze) {
    impact.squeeze = squeeze;
    if (squeeze.compression >= 0.18) impact.kind = "hard";
  }
  body.supportSurfaceId = supportSurfaceId;
  if (supportSurfaceId && !body.grab) {
    const maxMotion = Math.max(...body.nodes.map(node => Math.hypot(node.x - node.previousX, node.y - node.previousY)));
    const top = body.nodes[Math.floor((body.columns - 1) / 2)];
    const bottom = body.nodes[(body.rows - 1) * body.columns + Math.floor((body.columns - 1) / 2)];
    const angle = Math.atan2(top.x - bottom.x, bottom.y - top.y);
    body.restSeconds = maxMotion < 0.6 && Math.abs(angle) < 0.08 ? body.restSeconds + dt : 0;
    if (body.restSeconds > 0.35) {
      body.sleeping = true;
      body.sleepSurfaceTop = surfaces.find(surface => surface.id === supportSurfaceId)?.top;
      for (const node of body.nodes) { node.previousX = node.x; node.previousY = node.y; }
    }
  } else body.restSeconds = 0;
  if (impact) body.impactCooldown = 0.16;
  return impact;
}

/** Привязка оси карандашного штриха к ячейкам решётки выполняется один раз. */
export function bindSoftBodyPath(path: PathCommand[], body: SoftBody, tolerance = 0.5): BoundPath {
  return { contours: flattenPath(path, tolerance).map(contour => ({
    closed: contour.closed,
    points: contour.points.map(point => {
      const gx = clamp((point.x - body.bounds.x) / body.bounds.width * (body.columns - 1), 0, body.columns - 1 - 1e-6);
      const gy = clamp((point.y - body.bounds.y) / body.bounds.height * (body.rows - 1), 0, body.rows - 1 - 1e-6);
      const x = Math.floor(gx), y = Math.floor(gy);
      return { cell: y * body.columns + x, u: gx - x, v: gy - y };
    })
  })) };
}

/** Меняет координаты самой оси; параметры кисти и исходный профиль нажима остаются прежними. */
export function deformSoftBodyPath(bound: BoundPath, body: SoftBody): PathCommand[] {
  const result: PathCommand[] = [];
  for (const contour of bound.contours) {
    for (let index = 0; index < contour.points.length; index++) {
      if (contour.closed && index === contour.points.length - 1) break;
      const point = contour.points[index];
      const { x, y } = boundPosition(body, point);
      result.push(index === 0 ? { op: "M", x, y } : { op: "L", x, y });
    }
    if (contour.closed) result.push({ op: "Z" });
  }
  return result;
}
