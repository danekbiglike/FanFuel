import "./style.css";
import "./ink.css";
import {
  bindSoftBodyPath, createSoftBody, deformSoftBodyPath, flattenPath, grabSoftBody, moveSoftBodyGrab,
  releaseSoftBody, renderPencilContours, setSoftBodyCollider, setSoftBodySoftness, softBodyColliderPoints,
  stepSoftBody, type BoundPath, type PathCommand, type PencilContourBrush, type PencilContourStroke,
  type SoftBody, type SoftBodySurface
} from "../src/index.js";
import { bodyBounds, hardLandPose, previousGraphite, softGraphite, source } from "../demo/soft-body-demo.js";
import type { SoftRenderRequest, SoftRenderResult } from "../demo/soft-body-worker.js";
import { messages, type Locale, type MessageKey } from "../../i18n/src/playground.js";
import { formatMoney } from "../../i18n/src/format.js";

type SliderKey = "width" | "density" | "grain" | "pressure" | "variation" | "randomness" | "taper" | "softness" | "boil";
type Slider = { key: SliderKey; min: number; max: number; step: number; value: number; unit: string };
const defaults: Slider[] = [
  { key: "width", min: 1, max: 10, step: 0.2, value: 5.1, unit: "px" },
  { key: "density", min: 20, max: 100, step: 1, value: 76, unit: "%" },
  { key: "grain", min: 0, max: 100, step: 1, value: 58, unit: "%" },
  { key: "pressure", min: 40, max: 180, step: 5, value: 100, unit: "%" },
  { key: "variation", min: 0, max: 200, step: 5, value: 100, unit: "%" },
  { key: "randomness", min: 0, max: 100, step: 5, value: 12, unit: "%" },
  { key: "taper", min: 0, max: 40, step: 1, value: 15, unit: "px" },
  { key: "softness", min: 0, max: 100, step: 1, value: 66, unit: "%" },
  { key: "boil", min: 0, max: 100, step: 1, value: 22, unit: "%" }
];
const state = Object.fromEntries(defaults.map(item => [item.key, item.value])) as Record<SliderKey, number>;
let locale: Locale = navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("oily-canvas");
const hit = $<HTMLButtonElement>("oily-hit");
const status = $("oily-status");
const timing = $("render-timing");
const settings = $("settings");
const brushSelect = $<HTMLSelectElement>("setting-brush");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function redrawReduced(): void { if (reducedMotion) requestAnimationFrame(render); }
let lastStatus: MessageKey = reducedMotion ? "reduced" : "ready";

function translate(): void {
  document.documentElement.lang = locale;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n as MessageKey;
    element.textContent = messages[locale][key];
  });
  document.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach(element => {
    element.placeholder = messages[locale][element.dataset.i18nPlaceholder as MessageKey];
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach(element => {
    element.setAttribute("aria-label", messages[locale][element.dataset.i18nAria as MessageKey]);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach(element => {
    element.title = messages[locale][element.dataset.i18nTitle as MessageKey];
  });
  document.querySelectorAll<HTMLElement>("[data-price]").forEach(element => {
    element.textContent = formatMoney({ amountMinor: Number(element.dataset.price), currency: "RUB", locale,
      trimZeroFraction: true });
  });
  hit.setAttribute("aria-label", messages[locale].oilyHit);
  status.textContent = messages[locale][lastStatus];
  for (const slider of defaults) {
    $("label-" + slider.key).textContent = messages[locale][slider.key];
  }
  $("language-toggle").textContent = locale === "ru" ? "EN" : "RU";
  document.title = locale === "ru" ? "FanFuel — площадка Ойли" : "FanFuel — Oily Playground";
}

const sliderContainer = $("settings-sliders");
for (const slider of defaults) {
  const row = document.createElement("div");
  row.className = "setting-row";
  const labelLine = document.createElement("div");
  labelLine.className = "setting-label";
  const label = document.createElement("label");
  label.id = "label-" + slider.key;
  label.htmlFor = "setting-" + slider.key;
  const output = document.createElement("output");
  output.id = "output-" + slider.key;
  output.htmlFor = "setting-" + slider.key;
  output.textContent = `${slider.value} ${slider.unit}`;
  const input = document.createElement("input");
  input.id = "setting-" + slider.key;
  input.type = "range";
  input.min = String(slider.min);
  input.max = String(slider.max);
  input.step = String(slider.step);
  input.value = String(slider.value);
  input.addEventListener("input", () => {
    state[slider.key] = Number(input.value);
    output.textContent = `${input.value} ${slider.unit}`;
    if (slider.key === "softness") setSoftBodySoftness(body, state.softness / 100);
    if (slider.key === "width") body.contactRadius = state.width / 2;
    renderEpoch++;
    nextRender = 0;
    redrawReduced();
  });
  labelLine.append(label, output);
  row.append(labelLine, input);
  sliderContainer.append(row);
}

$("settings-toggle").addEventListener("click", () => {
  const open = settings.dataset.open !== "true";
  settings.dataset.open = String(open);
  $("settings-toggle").setAttribute("aria-expanded", String(open));
});
$("language-toggle").addEventListener("click", () => { locale = locale === "ru" ? "en" : "ru"; translate(); });
$("theme-toggle").addEventListener("click", () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  renderEpoch++;
  nextRender = 0;
  redrawReduced();
});
$("reset-settings").addEventListener("click", () => {
  brushSelect.value = "soft";
  for (const slider of defaults) {
    state[slider.key] = slider.value;
    $<HTMLInputElement>("setting-" + slider.key).value = String(slider.value);
    $("output-" + slider.key).textContent = `${slider.value} ${slider.unit}`;
  }
  setSoftBodySoftness(body, state.softness / 100);
  body.contactRadius = state.width / 2;
  renderEpoch++;
  nextRender = 0;
  redrawReduced();
});
brushSelect.addEventListener("change", () => { renderEpoch++; nextRender = 0; redrawReduced(); });
translate();

function shiftPath(path: PathCommand[], dx: number, dy: number): PathCommand[] {
  return path.map(command => {
    if (command.op === "M" || command.op === "L") return { ...command, x: command.x + dx, y: command.y + dy };
    if (command.op === "C") return { ...command, c1x: command.c1x + dx, c1y: command.c1y + dy,
      c2x: command.c2x + dx, c2y: command.c2y + dy, x: command.x + dx, y: command.y + dy };
    if (command.op === "Q") return { ...command, cx: command.cx + dx, cy: command.cy + dy,
      x: command.x + dx, y: command.y + dy };
    return command;
  });
}

function spawnPosition(): { x: number; y: number } {
  return { x: Math.max(12, Math.min(innerWidth - 165, innerWidth * (innerWidth < 760 ? 0.53 : 0.7) - 80)),
    y: innerWidth < 760 ? 330 : 205 };
}
const spawn = spawnPosition();
const dx = spawn.x - bodyBounds.x, dy = spawn.y - bodyBounds.y;
const shapes = source.map(stroke => ({ ...stroke, path: shiftPath(stroke.path, dx, dy) }));
const lengths = new Map(shapes.map(stroke => [stroke.id, flattenPath(stroke.path, 0.45).reduce((sum, contour) =>
  sum + contour.points.slice(1).reduce((length, point, index) => length + Math.hypot(point.x - contour.points[index].x,
    point.y - contour.points[index].y), 0), 0)]));
let body: SoftBody;
let bound: BoundPath[];
let renderEpoch = 0;
let nextRender = 0;
let lastImpact = 0;
function resetBody(): void {
  const position = spawnPosition();
  const changeX = position.x - spawn.x, changeY = position.y - spawn.y;
  body = createSoftBody({ x: spawn.x, y: spawn.y, width: bodyBounds.width, height: bodyBounds.height });
  for (const node of body.nodes) {
    node.x += changeX; node.previousX += changeX; node.y += changeY; node.previousY += changeY;
  }
  setSoftBodyCollider(body, shapes[0].path, state.width / 2);
  setSoftBodySoftness(body, state.softness / 100);
  body.worldBounds = { left: 0, right: innerWidth, top: 0 };
  bound = shapes.map(stroke => bindSoftBodyPath(stroke.path, body, 0.45));
  lastImpact = 0;
  renderEpoch++;
  nextRender = 0;
  redrawReduced();
  lastStatus = "ready";
  status.textContent = messages[locale].ready;
}
resetBody();
$("reset-oily").addEventListener("click", resetBody);

let surfaces: SoftBodySurface[] = [];
function measure(): void {
  body.worldBounds = { left: 0, right: innerWidth, top: 0 };
  surfaces = Array.from(document.querySelectorAll<HTMLElement>("[data-oily-surface]")).flatMap(element => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return [];
    return [{ id: element.dataset.oilySurface!, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }];
  });
  surfaces.push({ id: "floor", left: 0, right: innerWidth, top: innerHeight - 8, solid: true });
  renderEpoch++;
  nextRender = 0;
  redrawReduced();
}
addEventListener("resize", measure, { passive: true });
addEventListener("scroll", measure, { passive: true });
new ResizeObserver(measure).observe(document.querySelector(".product-grid")!);
measure();

const pointer = (event: PointerEvent) => ({ x: event.clientX, y: event.clientY });
let activePointer = -1, pointerTime = 0;
hit.addEventListener("pointerdown", event => {
  if (reducedMotion || activePointer !== -1 || !grabSoftBody(body, pointer(event))) return;
  activePointer = event.pointerId;
  pointerTime = event.timeStamp;
  lastImpact = 0;
  nextRender = 0;
  hit.setPointerCapture(event.pointerId);
  lastStatus = "dragging";
  status.textContent = messages[locale].dragging;
  event.preventDefault();
});
hit.addEventListener("pointermove", event => {
  if (event.pointerId !== activePointer) return;
  moveSoftBodyGrab(body, pointer(event), (event.timeStamp - pointerTime) / 1000);
  pointerTime = event.timeStamp;
});
function release(event: PointerEvent): void {
  if (event.pointerId !== activePointer) return;
  releaseSoftBody(body);
  activePointer = -1;
  if (hit.hasPointerCapture(event.pointerId)) hit.releasePointerCapture(event.pointerId);
}
hit.addEventListener("pointerup", release);
hit.addEventListener("pointercancel", release);
hit.addEventListener("keydown", event => {
  const distance = event.shiftKey ? 36 : 12;
  const movement: Record<string, [number, number]> = {
    ArrowLeft: [-distance, 0], ArrowRight: [distance, 0], ArrowUp: [0, -distance], ArrowDown: [0, distance]
  };
  const offset = movement[event.key];
  if (!offset || reducedMotion) return;
  event.preventDefault();
  body.sleeping = false;
  body.restSeconds = 0;
  for (const node of body.nodes) {
    node.x += offset[0]; node.previousX += offset[0];
    node.y += offset[1]; node.previousY += offset[1];
  }
  nextRender = 0;
});
if (reducedMotion) hit.disabled = true;

let worker: Worker | undefined;
let workerBusy = false;
let pending: SoftRenderRequest | undefined;
let requestId = 0, latestShown = 0, lastRenderMs = 0;
function display(bitmap: ImageBitmap, request: Pick<SoftRenderResult, "x" | "y" | "dpr">): void {
  const context = canvas.getContext("2d")!;
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.style.width = `${bitmap.width / request.dpr}px`;
  canvas.style.height = `${bitmap.height / request.dpr}px`;
  canvas.style.left = `${request.x}px`;
  canvas.style.top = `${request.y}px`;
  context.drawImage(bitmap, 0, 0);
}
function dispatch(request: SoftRenderRequest): void {
  if (worker) {
    if (workerBusy) { pending = request; return; }
    workerBusy = true;
    worker.postMessage(request);
    return;
  }
  const temporary = document.createElement("canvas");
  const started = performance.now();
  renderPencilContours(temporary, request.strokes, {
    sceneWidth: request.width, sceneHeight: request.height, cssWidth: request.width, cssHeight: request.height,
    dpr: request.dpr, seed: 72801, boilFrame: request.boilFrame, boilStrength: request.boilStrength,
    grainSpace: "stroke", smoothingCss: request.smoothingCss
  });
  lastRenderMs = performance.now() - started;
  const context = canvas.getContext("2d")!;
  canvas.width = temporary.width;
  canvas.height = temporary.height;
  canvas.style.width = `${request.width}px`;
  canvas.style.height = `${request.height}px`;
  canvas.style.left = `${request.x}px`;
  canvas.style.top = `${request.y}px`;
  context.drawImage(temporary, 0, 0);
}
if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
  try {
    worker = new Worker(new URL("../demo/soft-body-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<SoftRenderResult>) => {
      workerBusy = false;
      const result = event.data;
      if (result.id > latestShown && result.epoch === renderEpoch) {
        latestShown = result.id;
        display(result.bitmap, result);
        lastRenderMs = result.elapsed;
      }
      result.bitmap.close();
      if (pending) { const current = pending; pending = undefined; dispatch(current); }
    };
    worker.onerror = () => { worker?.terminate(); worker = undefined; workerBusy = false; pending = undefined; nextRender = 0; };
  } catch { worker = undefined; }
}

function brushFor(stroke: PencilContourStroke): PencilContourBrush {
  const preset = brushSelect.value === "classic" ? previousGraphite : softGraphite;
  const face = stroke.id !== "soft-silhouette";
  return { ...preset, widthCss: state.width * (face ? 0.75 : 1),
    pigment: document.documentElement.dataset.theme === "dark" ? [238, 241, 225] : preset.pigment,
    density: Math.min(1, state.density / 100 * (face ? 1.12 : 1)),
    grain: state.grain / 100 * (face ? 0.82 : 1),
    pressureScale: state.pressure / 100 * (face ? 1.12 : 1),
    pressureVariation: face ? Math.min(state.variation / 100, 0.6) : state.variation / 100,
    handwork: face ? (stroke.id === "soft-smile" ? 0 : 0.12) : preset.handwork,
    randomness: state.randomness / 100,
    taperLengthCss: stroke.id === "soft-smile" ? Math.min(state.taper, 9) : state.taper,
    taperMinimum: stroke.id === "soft-smile" ? 0.55 : preset.taperMinimum };
}
function positionHit(): void {
  const points = softBodyColliderPoints(body);
  if (points.length < 3) return;
  const left = Math.min(...points.map(point => point.x)), right = Math.max(...points.map(point => point.x));
  const top = Math.min(...points.map(point => point.y)), bottom = Math.max(...points.map(point => point.y));
  hit.style.left = `${left}px`;
  hit.style.top = `${top}px`;
  hit.style.width = `${right - left}px`;
  hit.style.height = `${bottom - top}px`;
  hit.style.clipPath = `polygon(${points.map(point => `${(point.x - left) / Math.max(1, right - left) * 100}% ${(point.y - top) / Math.max(1, bottom - top) * 100}%`).join(",")})`;
}
function render(now: number): void {
  const pose = hardLandPose(lastImpact ? (now - lastImpact) / 1000 : 0);
  const center = body.nodes[Math.floor(body.rows / 2) * body.columns + Math.floor(body.columns / 2)];
  const strokes: PencilContourStroke[] = shapes.map((stroke, index) => ({
    ...stroke, brush: brushFor(stroke),
    path: deformSoftBodyPath(bound[index], body).map(command => "x" in command ? {
      ...command, x: center.x + (command.x - center.x) * pose.scaleX,
      y: center.y + (command.y - center.y) * pose.scaleY
    } : command),
    materialLengthCss: lengths.get(stroke.id)
  }));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const stroke of strokes) for (const command of stroke.path) {
    if ("x" in command) { minX = Math.min(minX, command.x); maxX = Math.max(maxX, command.x);
      minY = Math.min(minY, command.y); maxY = Math.max(maxY, command.y); }
    if (command.op === "C") { minX = Math.min(minX, command.c1x, command.c2x); maxX = Math.max(maxX, command.c1x, command.c2x);
      minY = Math.min(minY, command.c1y, command.c2y); maxY = Math.max(maxY, command.c1y, command.c2y); }
  }
  if (!Number.isFinite(minX)) return;
  const padding = Math.max(14, state.width * 4);
  const x = Math.floor(minX - padding), y = Math.floor(minY - padding);
  const width = Math.min(600, Math.max(1, Math.ceil(maxX + padding - x)));
  const height = Math.min(600, Math.max(1, Math.ceil(maxY + padding - y)));
  const local = strokes.map(stroke => ({ ...stroke, path: shiftPath(stroke.path, -x, -y) }));
  const dpr = Math.min(devicePixelRatio || 1, 2);
  dispatch({ id: ++requestId, epoch: renderEpoch, strokes: local, x, y, width, height, dpr,
    boilFrame: reducedMotion ? 0 : Math.floor(now / 500), boilStrength: state.boil / 100,
    redrawFrame: reducedMotion ? 0 : requestId, smoothingCss: 2.1 });
}

let lastFrame = performance.now(), accumulator = 0, previousNodes: Float32Array | undefined;
let wasMoving = false, nextTiming = 0, renderedReduced = false;
function tick(now: number): void {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  accumulator += dt;
  if (!reducedMotion) while (accumulator >= 1 / 120) {
    const impact = stepSoftBody(body, 1 / 120, surfaces);
    if (impact && !body.grab) {
      if (impact.kind === "hard" && impact.normal === "top") lastImpact = now;
      const name = impact.surfaceId === "floor" ? messages[locale].floor :
        document.querySelector<HTMLElement>(`[data-oily-surface="${impact.surfaceId}"] h3`)?.textContent ?? impact.surfaceId;
      lastStatus = "landed";
      status.textContent = messages[locale].landed.replace("{name}", name);
    }
    accumulator -= 1 / 120;
  }
  const moved = !previousNodes || body.nodes.some((node, index) =>
    Math.abs(node.x - previousNodes![index * 2]) > 0.18 || Math.abs(node.y - previousNodes![index * 2 + 1]) > 0.18);
  if (moved) positionHit();
  const clipActive = lastImpact > 0 && now - lastImpact < 280;
  const moving = !body.sleeping && (body.grab !== undefined || moved || clipActive);
  if (moving && !wasMoving) nextRender = 0;
  wasMoving = moving;
  if (!document.hidden && now >= nextRender && (!reducedMotion || !renderedReduced)) {
    renderedReduced = true;
    nextRender = now + (moving ? 1000 / 24 : 500);
    previousNodes = Float32Array.from(body.nodes.flatMap(node => [node.x, node.y]));
    render(now);
  }
  if (now >= nextTiming) {
    timing.textContent = messages[locale].rendering.replace("{ms}", lastRenderMs.toFixed(1));
    nextTiming = now + 1000;
  }
  if (!reducedMotion) requestAnimationFrame(tick);
}
positionHit();
requestAnimationFrame(tick);
