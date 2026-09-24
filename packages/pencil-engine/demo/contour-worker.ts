import { renderPencilContours, type GbrTip } from "../src/index.js";
import { oilyContours, type ContourTuning } from "./contour-scene.js";

type ContourRequest = { type: "render"; id: number; size: number; width: number; grain: number; dpr: number; tuning: ContourTuning; seed: number };
type TipRequest = { type: "tip"; tip?: GbrTip };
const canvas = new OffscreenCanvas(1, 1);
let tip: GbrTip | undefined;

self.onmessage = (event: MessageEvent<ContourRequest | TipRequest>) => {
  if (event.data.type === "tip") {
    tip = event.data.tip;
    return;
  }
  const { id, size, width, grain, dpr, tuning, seed } = event.data;
  const started = performance.now();
  renderPencilContours(canvas, oilyContours(width, grain, tip, tuning), {
    sceneWidth: 512, sceneHeight: 512, cssWidth: size, cssHeight: size,
    dpr, seed
  });
  const elapsed = performance.now() - started;
  const bitmap = canvas.transferToImageBitmap();
  self.postMessage({ id, elapsed, bitmap }, { transfer: [bitmap] });
};
