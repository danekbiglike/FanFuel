import { renderPencilContours, type GbrTip, type PathCommand, type PencilContourBrush, type PencilContourStroke } from "../src/index.js";
import type { ContourTuning } from "./contour-scene.js";
import { contourMessages } from "./locales.js";

type Copy = typeof contourMessages.ru | typeof contourMessages.en;
type PenSample = {
  x: number; y: number; pressure: number; tiltX: number; tiltY: number; twist: number;
  tangentialPressure: number; contactWidth: number; contactHeight: number; timeMs: number;
};
type RecordedStroke = { id: string; pointerType: string; widthCss: number; samples: PenSample[] };

const WIDTH = 512, HEIGHT = 320;
const finite = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function profile(samples: PenSample[]): number[] {
  if (samples.length === 1) return [0.55 + samples[0].pressure * 0.85];
  const distances = [0];
  for (let i = 1; i < samples.length; i++) distances.push(distances[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  const total = distances[distances.length - 1];
  if (total <= 0) return [0.55 + samples[0].pressure * 0.85];
  const values: number[] = [];
  let at = 0;
  for (let i = 0; i <= 24; i++) {
    const target = total * i / 24;
    while (at < distances.length - 2 && distances[at + 1] < target) at++;
    const length = distances[at + 1] - distances[at] || 1;
    const t = clamp((target - distances[at]) / length, 0, 1);
    const pressure = samples[at].pressure * (1 - t) + samples[at + 1].pressure * t;
    values.push(0.55 + pressure * 0.85);
  }
  return values;
}

export function setupPenPad(copy: Copy, getSettings: () => {
  widthCss: number; grain: number; tip?: GbrTip; tuning: ContourTuning; seed: number;
}): { refresh: () => void } {
  const canvas = document.getElementById("contour-pen-canvas") as HTMLCanvasElement;
  const status = document.getElementById("contour-pen-status")!;
  const exportButton = document.getElementById("contour-pen-export") as HTMLButtonElement;
  const clearButton = document.getElementById("contour-pen-clear") as HTMLButtonElement;
  const importInput = document.getElementById("contour-pen-import") as HTMLInputElement;
  document.getElementById("contour-pen-title")!.textContent = copy.penTitle;
  document.getElementById("contour-pen-note")!.textContent = copy.penNote;
  document.getElementById("contour-pen-import-label")!.textContent = copy.penImport;
  exportButton.textContent = copy.penExport;
  clearButton.textContent = copy.penClear;
  status.textContent = copy.penStatus;

  const strokes: RecordedStroke[] = [];
  let active: RecordedStroke | undefined;
  let activePointer = -1;
  let startedAt = 0;
  const context = canvas.getContext("2d")!;

  function pencilStrokes(): PencilContourStroke[] {
    const settings = getSettings();
    return strokes.filter(stroke => stroke.samples.length > 0).map(stroke => {
      const path: PathCommand[] = [{ op: "M", x: stroke.samples[0].x, y: stroke.samples[0].y }];
      for (const sample of stroke.samples.slice(1)) path.push({ op: "L", x: sample.x, y: sample.y });
      if (path.length === 1) path.push({ op: "L", x: stroke.samples[0].x + 0.01, y: stroke.samples[0].y });
      const brush: PencilContourBrush = {
        widthCss: stroke.widthCss, pigment: [24, 24, 22], density: 0.85, grain: settings.grain,
        tilt: 0.08, fray: 0, tip: settings.tip, ...settings.tuning
      };
      return { id: stroke.id, path, brush, pressureProfile: profile(stroke.samples), taper: "both" };
    });
  }

  function refresh() {
    renderPencilContours(canvas, pencilStrokes(), {
      sceneWidth: WIDTH, sceneHeight: HEIGHT, cssWidth: WIDTH, cssHeight: HEIGHT,
      dpr: 1, seed: getSettings().seed
    });
  }

  function sample(event: PointerEvent): PenSample {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) * WIDTH / rect.width, 0, WIDTH),
      y: clamp((event.clientY - rect.top) * HEIGHT / rect.height, 0, HEIGHT),
      pressure: clamp(finite(event.pressure, 0.5), 0, 1),
      tiltX: clamp(finite(event.tiltX), -90, 90), tiltY: clamp(finite(event.tiltY), -90, 90),
      twist: clamp(finite(event.twist), 0, 359), tangentialPressure: clamp(finite(event.tangentialPressure), -1, 1),
      contactWidth: Math.max(0, finite(event.width)), contactHeight: Math.max(0, finite(event.height)),
      timeMs: Math.max(0, event.timeStamp - startedAt)
    };
  }

  function append(event: PointerEvent) {
    if (!active || active.samples.length >= 10000) return;
    const point = sample(event);
    const last = active.samples.at(-1);
    active.samples.push(point);
    status.textContent = copy.penLive.replace("{pressure}", point.pressure.toFixed(2))
      .replace("{tiltX}", String(point.tiltX)).replace("{tiltY}", String(point.tiltY))
      .replace("{count}", String(strokes.length));
    if (last) {
      context.strokeStyle = "rgba(24, 24, 22, .7)";
      context.lineCap = "round";
      context.lineWidth = Math.max(0.5, active.widthCss * (0.5 + point.pressure));
      context.beginPath(); context.moveTo(last.x, last.y); context.lineTo(point.x, point.y); context.stroke();
    }
  }

  canvas.addEventListener("pointerdown", event => {
    if (active || strokes.length >= 50) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    activePointer = event.pointerId;
    startedAt = event.timeStamp;
    active = { id: `pen-${Date.now()}-${strokes.length}`, pointerType: event.pointerType,
      widthCss: getSettings().widthCss, samples: [] };
    strokes.push(active);
    append(event);
  });
  canvas.addEventListener("pointermove", event => {
    if (!active || event.pointerId !== activePointer) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.();
    for (const point of events?.length ? events : [event]) append(point);
  });
  function finish(event: PointerEvent) {
    if (!active || event.pointerId !== activePointer) return;
    append(event);
    active = undefined;
    activePointer = -1;
    refresh();
    status.textContent = copy.penSaved.replace("{count}", String(strokes.length));
  }
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);

  clearButton.addEventListener("click", () => { strokes.length = 0; active = undefined; refresh(); status.textContent = copy.penStatus; });
  exportButton.addEventListener("click", () => {
    const data = { schemaVersion: 1, canvas: { width: WIDTH, height: HEIGHT }, strokes };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "pencil-strokes.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("large file");
      const data = JSON.parse(await file.text()) as { schemaVersion: number; canvas: { width: number; height: number }; strokes: RecordedStroke[] };
      if (data.schemaVersion !== 1 || data.canvas.width !== WIDTH || data.canvas.height !== HEIGHT ||
          !Array.isArray(data.strokes) || data.strokes.length > 50) throw new Error("invalid strokes");
      let totalSamples = 0;
      for (const stroke of data.strokes) {
        if (!Array.isArray(stroke.samples) || stroke.samples.length > 10000 ||
            !Number.isFinite(stroke.widthCss) || stroke.widthCss < 0.1 || stroke.widthCss > 64 ||
            typeof stroke.id !== "string" || stroke.id.length > 100) throw new Error("invalid stroke");
        totalSamples += stroke.samples.length;
        if (totalSamples > 20000) throw new Error("too many samples");
        for (const point of stroke.samples) {
          if (![point.x, point.y, point.pressure, point.tiltX, point.tiltY, point.twist, point.timeMs].every(Number.isFinite) ||
              point.x < 0 || point.x > WIDTH || point.y < 0 || point.y > HEIGHT || point.pressure < 0 || point.pressure > 1 ||
              point.tiltX < -90 || point.tiltX > 90 || point.tiltY < -90 || point.tiltY > 90 ||
              point.twist < 0 || point.twist > 359 || point.timeMs < 0) throw new Error("invalid point");
        }
      }
      strokes.splice(0, strokes.length, ...data.strokes);
      refresh();
      status.textContent = copy.penSaved.replace("{count}", String(strokes.length));
    } catch { status.textContent = copy.penImportError; }
    importInput.value = "";
  });
  refresh();
  return { refresh };
}
