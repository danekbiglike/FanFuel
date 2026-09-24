import { importBrushFile, renderPencilContours, type GbrTip } from "../src/index.js";
import { contourMessages } from "./locales.js";
import { oilyContours, type ContourTuning } from "./contour-scene.js";
import { setupPenPad } from "./pen-pad.js";
import { setupSoftBodyDemo } from "./soft-body-demo.js";
import "./style.css";
import "./study.css";

const locale = navigator.language.startsWith("ru") ? "ru" : "en";
const copy = contourMessages[locale];
document.documentElement.lang = locale;
document.title = copy.title;
for (const key of ["eyebrow", "title", "subtitle", "back", "note"] as const) {
  document.getElementById(`contour-${key}`)!.textContent = copy[key];
}
for (const key of ["size", "width", "grain", "pressure", "variation", "randomness", "taperLength", "taperMin", "seed", "import", "brush", "reference", "result"] as const) {
  const id = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  document.getElementById(`contour-${id}-label`)!.textContent = copy[key];
}
document.getElementById("contour-default-brush")!.textContent = copy.defaultBrush;
document.getElementById("contour-brush-note")!.textContent = copy.brushNote;
const reference = document.getElementById("contour-reference") as HTMLImageElement;
reference.src = new URL("../reference/oily-original.png", import.meta.url).href;
reference.alt = copy.referenceAlt;
const canvas = document.getElementById("contour-canvas") as HTMLCanvasElement;
canvas.setAttribute("role", "img");
canvas.setAttribute("aria-label", copy.resultAlt);
const size = document.getElementById("contour-size") as HTMLSelectElement;
const width = document.getElementById("contour-width") as HTMLInputElement;
const grain = document.getElementById("contour-grain") as HTMLInputElement;
const pressure = document.getElementById("contour-pressure") as HTMLInputElement;
const variation = document.getElementById("contour-variation") as HTMLInputElement;
const randomness = document.getElementById("contour-randomness") as HTMLInputElement;
const taperLength = document.getElementById("contour-taper-length") as HTMLInputElement;
const taperMin = document.getElementById("contour-taper-min") as HTMLInputElement;
const seed = document.getElementById("contour-seed") as HTMLInputElement;
const importInput = document.getElementById("contour-import") as HTMLInputElement;
const brushSelect = document.getElementById("contour-brush-select") as HTMLSelectElement;
const status = document.getElementById("contour-status")!;
const widthValue = document.getElementById("contour-width-value")!;
const grainValue = document.getElementById("contour-grain-value")!;
const pressureValue = document.getElementById("contour-pressure-value")!;
const variationValue = document.getElementById("contour-variation-value")!;
const randomnessValue = document.getElementById("contour-randomness-value")!;
const taperLengthValue = document.getElementById("contour-taper-length-value")!;
const taperMinValue = document.getElementById("contour-taper-min-value")!;
const themeButton = document.getElementById("contour-theme") as HTMLButtonElement;
const compare = document.querySelector(".study-compare")!;
let theme: "light" | "dark" = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === "light" ? copy.themeDark : copy.themeLight;
  themeButton.setAttribute("aria-pressed", String(theme === "dark"));
}
themeButton.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; applyTheme(); });
applyTheme();

type RenderRequest = { type: "render"; id: number; size: number; width: number; grain: number; dpr: number; tuning: ContourTuning; seed: number };
type RenderResult = { id: number; elapsed: number; bitmap: ImageBitmap };
let worker: Worker | undefined;
let workerBusy = false;
let pending: RenderRequest | undefined;
let nextId = 0;
let sentAt = 0;
let customTip: GbrTip | undefined;
const softDemo = setupSoftBodyDemo(copy, () => customTip);
const importedTips: GbrTip[] = [];
function tipLabel() { return customTip ? ` · ${copy.loaded.replace("{name}", customTip.name)}` : ""; }
if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
  try {
    worker = new Worker(new URL("./contour-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<RenderResult>) => {
      workerBusy = false;
      if (pending) {
        event.data.bitmap.close();
        sendPending();
        return;
      }
      const { id, bitmap, elapsed } = event.data;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.style.width = `${size.value}px`;
      canvas.style.height = `${size.value}px`;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();
      const wallTime = performance.now() - sentAt;
      status.textContent = copy.timingWorker.replace("{ms}", elapsed.toFixed(1)).replace("{total}", wallTime.toFixed(1)) + tipLabel();
      canvas.dataset.renderMs = elapsed.toFixed(1);
      canvas.dataset.displayMs = wallTime.toFixed(1);
      canvas.dataset.renderId = String(id);
      canvas.dataset.worker = "true";
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = undefined;
      workerBusy = false;
      renderDirect(pending ?? currentRequest());
      pending = undefined;
    };
  } catch { worker = undefined; }
}
function currentRequest(): RenderRequest {
  return {
    type: "render", id: ++nextId, size: Number(size.value), width: Number(width.value),
    grain: Number(grain.value) / 100, dpr: Math.min(window.devicePixelRatio || 1, 2),
    tuning: currentTuning(), seed: Number(seed.value) || 0
  };
}
function currentTuning(): ContourTuning {
  return {
    pressureScale: Number(pressure.value) / 100,
    pressureVariation: Number(variation.value) / 100,
    randomness: Number(randomness.value) / 100,
    taperLengthCss: Number(taperLength.value),
    taperMinimum: Number(taperMin.value) / 100
  };
}
const penPad = setupPenPad(copy, () => ({
  widthCss: Number(width.value), grain: Number(grain.value) / 100,
  tip: customTip, tuning: currentTuning(), seed: Number(seed.value) || 0
}));
function sendPending() {
  if (!worker || workerBusy || !pending) return;
  const request = pending;
  pending = undefined;
  workerBusy = true;
  sentAt = performance.now();
  worker.postMessage(request);
}
function renderDirect(request: RenderRequest) {
  const started = performance.now();
  renderPencilContours(canvas, oilyContours(request.width, request.grain, customTip, request.tuning), {
    sceneWidth: 512, sceneHeight: 512, cssWidth: request.size, cssHeight: request.size,
    dpr: request.dpr, seed: request.seed
  });
  const elapsed = performance.now() - started;
  status.textContent = copy.timing.replace("{ms}", elapsed.toFixed(1)) + tipLabel();
  canvas.dataset.renderMs = elapsed.toFixed(1);
  canvas.dataset.displayMs = elapsed.toFixed(1);
  canvas.dataset.renderId = String(request.id);
  canvas.dataset.worker = "false";
}
let scheduled = false;
function render() {
  const cssSize = Number(size.value);
  const brushWidth = Number(width.value);
  reference.style.width = reference.style.height = `${cssSize}px`;
  compare.classList.toggle("large", cssSize > 700);
  widthValue.textContent = copy.widthValue.replace("{value}", brushWidth.toFixed(1));
  grainValue.textContent = copy.grainValue.replace("{value}", String(grain.value));
  pressureValue.textContent = `${pressure.value} %`;
  variationValue.textContent = `${variation.value} %`;
  randomnessValue.textContent = `${randomness.value} %`;
  taperLengthValue.textContent = `${taperLength.value} px`;
  taperMinValue.textContent = `${taperMin.value} %`;
  penPad.refresh();
  const request = currentRequest();
  if (worker) {
    status.textContent = copy.working;
    pending = request;
    sendPending();
  } else renderDirect(request);
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; render(); });
}
for (const control of [size, width, grain, pressure, variation, randomness, taperLength, taperMin, seed]) control.addEventListener("input", schedule);
brushSelect.addEventListener("change", () => {
  customTip = brushSelect.value === "" ? undefined : importedTips[Number(brushSelect.value)];
  softDemo.refreshBrush();
  worker?.postMessage({ type: "tip", tip: customTip });
  schedule();
});
importInput.addEventListener("change", async () => {
  const files = Array.from(importInput.files ?? []);
  if (!files.length) return;
  try {
    const added: GbrTip[] = [];
    for (const file of files) {
      if (file.size > 16 * 1024 * 1024) throw new Error("file exceeds 16 MB");
      added.push(...importBrushFile(file.name, new Uint8Array(await file.arrayBuffer())));
      if (added.length + importedTips.length > 64) throw new Error("too many tips");
    }
    const pixels = [...importedTips, ...added].reduce((sum, tip) => sum + tip.width * tip.height, 0);
    if (pixels > 12_000_000) throw new Error("brush tips exceed the memory limit");
    const firstIndex = importedTips.length;
    importedTips.push(...added);
    for (let index = firstIndex; index < importedTips.length; index++) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = importedTips[index].name;
      brushSelect.append(option);
    }
    brushSelect.value = String(firstIndex);
    customTip = importedTips[firstIndex];
    softDemo.refreshBrush();
    worker?.postMessage({ type: "tip", tip: customTip });
    schedule();
    status.textContent = copy.imported.replace("{count}", String(added.length));
  } catch (error) {
    status.textContent = copy.importError.replace("{reason}", error instanceof Error ? error.message : String(error));
  }
  importInput.value = "";
});
schedule();
