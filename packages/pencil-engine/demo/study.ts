import { parseGbr, pencilBrushes, type GbrTip, type PencilBrushPreset } from "../src/index.js";
import { messages, studyMessages } from "./locales.js";
import { drawStudy, drawStudyBoil } from "./study-scene.js";
import "./style.css";
import "./study.css";

const locale = navigator.language.startsWith("ru") ? "ru" : "en";
const copy = studyMessages[locale];
const mainCopy = messages[locale];
document.documentElement.lang = locale;
document.title = copy.title;
document.getElementById("study-contour-link")!.textContent = copy.contourLink;
for (const key of ["eyebrow", "title", "subtitle", "back", "scale", "body", "canister", "import", "reference", "render", "note"] as const) {
  document.getElementById(`study-${["body", "canister", "scale", "import", "reference", "render"].includes(key) ? `${key}-label` : key}`)!.textContent = copy[key];
}
const reference = document.getElementById("study-reference") as HTMLImageElement;
reference.src = new URL("../reference/oily-original.png", import.meta.url).href;
reference.alt = copy.referenceAlt;
const canvas = document.getElementById("study-canvas") as HTMLCanvasElement;
canvas.setAttribute("aria-label", copy.renderAlt);
const status = document.getElementById("study-status")!;
const sizeSelect = document.getElementById("study-scale") as HTMLSelectElement;
const bodySelect = document.getElementById("study-body-brush") as HTMLSelectElement;
const canisterSelect = document.getElementById("study-canister-brush") as HTMLSelectElement;
const importInput = document.getElementById("study-import") as HTMLInputElement;
const animateButton = document.getElementById("study-animate") as HTMLButtonElement;
let customTip: GbrTip | undefined;
let customTipVersion = 0;

for (const select of [bodySelect, canisterSelect]) {
  for (const [id, label] of Object.entries(copy.brushes)) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    select.append(option);
  }
}
bodySelect.value = "softGraphite";
canisterSelect.value = "coloredPencil";

let theme: "light" | "dark" = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const themeButton = document.getElementById("study-theme") as HTMLButtonElement;
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === "light" ? mainCopy.themeDark : mainCopy.themeLight;
  themeButton.setAttribute("aria-pressed", String(theme === "dark"));
}
themeButton.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; applyTheme(); });
applyTheme();

const layerCache = new Map<string, HTMLCanvasElement>();
let preparedCanvas: HTMLCanvasElement | undefined;
let preparationStatus = "";
let animation = false;
let animationStart = 0;
let animationFrame = -1;
let animationRequest = 0;
let frameSamples: number[] = [];
let skippedFrames = 0;
let drawnFrames = 0;
let scheduled = false;

function updateStatus() {
  const loaded = customTip ? `${copy.loaded.replace("{name}", customTip.name)} · ` : "";
  const average = frameSamples.length
    ? `${copy.frameTiming.replace("{ms}", (frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length).toFixed(2))}`
    : "";
  const skipped = animation && average ? ` · ${copy.skippedFrames.replace("{count}", String(skippedFrames))}` : "";
  status.textContent = `${loaded}${preparationStatus}${animation && average ? ` · ${average}${skipped}` : ""}`;
}

function paintFrame(frame: number, boil: boolean): number {
  if (!preparedCanvas) return 0;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return 0;
  const started = performance.now();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.drawImage(preparedCanvas, 0, 0);
  if (boil) drawStudyBoil(context, frame);
  canvas.dataset.frame = String(boil ? frame : 0);
  if (boil) drawnFrames++;
  canvas.dataset.drawnFrames = String(drawnFrames);
  return performance.now() - started;
}

function tick(now: number) {
  animationRequest = 0;
  if (!animation || document.hidden) return;
  const frame = Math.floor((now - animationStart) * 24 / 1000);
  if (frame !== animationFrame) {
    if (animationFrame >= 0 && frame > animationFrame + 1) skippedFrames += frame - animationFrame - 1;
    animationFrame = frame;
    frameSamples.push(paintFrame(frame, true));
    if (frameSamples.length > 48) frameSamples.shift();
    if (frame % 24 === 0) updateStatus();
  }
  animationRequest = requestAnimationFrame(tick);
}

function startAnimation() {
  if (animationRequest || !animation || document.hidden) return;
  animationStart = performance.now();
  animationFrame = -1;
  skippedFrames = 0;
  drawnFrames = 0;
  frameSamples = [];
  animationRequest = requestAnimationFrame(tick);
}

function updateAnimationButton() {
  animateButton.textContent = animation ? copy.pauseBoil : copy.playBoil;
  animateButton.setAttribute("aria-pressed", String(animation));
}
animateButton.addEventListener("click", () => {
  animation = !animation;
  updateAnimationButton();
  if (animation) startAnimation();
  else {
    if (animationRequest) cancelAnimationFrame(animationRequest);
    animationRequest = 0;
    paintFrame(0, false);
  }
  updateStatus();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && animationRequest) {
    cancelAnimationFrame(animationRequest);
    animationRequest = 0;
  } else if (animation) startAnimation();
});
updateAnimationButton();

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    const size = Number(sizeSelect.value);
    reference.style.width = reference.style.height = `${size}px`;
    const bodyBrush = (pencilBrushes[bodySelect.value] ?? pencilBrushes.softGraphite) as PencilBrushPreset;
    const canisterBrush = (pencilBrushes[canisterSelect.value] ?? pencilBrushes.coloredPencil) as PencilBrushPreset;
    const key = [size, Math.min(devicePixelRatio || 1, 2), bodySelect.value, canisterSelect.value, customTipVersion].join(":");
    let prepared = layerCache.get(key);
    if (!prepared) {
      prepared = document.createElement("canvas");
      const started = performance.now();
      drawStudy(prepared, size, bodyBrush, canisterBrush,
        bodySelect.value === "customGbr" ? customTip : undefined,
        canisterSelect.value === "customGbr" ? customTip : undefined);
      preparationStatus = copy.timing.replace("{ms}", String(Math.round(performance.now() - started)));
      layerCache.set(key, prepared);
      if (layerCache.size > 2) layerCache.delete(layerCache.keys().next().value!);
    } else preparationStatus = copy.cacheHit;
    preparedCanvas = prepared;
    canvas.width = prepared.width;
    canvas.height = prepared.height;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    paintFrame(animationFrame < 0 ? 0 : animationFrame, animation);
    updateStatus();
  });
}
for (const control of [sizeSelect, bodySelect, canisterSelect]) control.addEventListener("change", schedule);
importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  try {
    if (file.size > 16 * 1024 * 1024) throw new Error("file too large");
    customTip = parseGbr(await file.arrayBuffer());
    customTipVersion++;
    for (const select of [bodySelect, canisterSelect]) {
      let option = select.querySelector<HTMLOptionElement>('option[value="customGbr"]');
      if (!option) {
        option = document.createElement("option");
        option.value = "customGbr";
        select.append(option);
      }
      option.textContent = copy.customBrush.replace("{name}", customTip.name);
    }
    bodySelect.value = "customGbr";
    schedule();
  } catch {
    status.textContent = copy.importError;
  }
});
schedule();
