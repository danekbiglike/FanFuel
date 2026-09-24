import { renderPencilContours, type PencilContourStroke } from "../src/index.js";

export type SoftRenderRequest = { id: number; epoch: number; strokes: PencilContourStroke[]; x: number; y: number; width: number; height: number; dpr: number; boilFrame: number; boilStrength: number; redrawFrame?: number; redrawStrengthCss?: number; smoothingCss?: number };
export type SoftRenderResult = { id: number; epoch: number; x: number; y: number; dpr: number; boilFrame: number; redrawFrame: number; elapsed: number; bitmap: ImageBitmap };

self.onmessage = (event: MessageEvent<SoftRenderRequest>) => {
  const request = event.data;
  const canvas = new OffscreenCanvas(request.width, request.height);
  const started = performance.now();
  renderPencilContours(canvas, request.strokes, {
    sceneWidth: request.width, sceneHeight: request.height,
    cssWidth: request.width, cssHeight: request.height, dpr: request.dpr, seed: 72801,
    boilFrame: request.boilFrame, boilStrength: request.boilStrength,
    redrawFrame: request.redrawFrame, redrawStrengthCss: request.redrawStrengthCss,
    smoothingCss: request.smoothingCss, grainSpace: "stroke"
  });
  const result: SoftRenderResult = {
    id: request.id, epoch: request.epoch, x: request.x, y: request.y, dpr: request.dpr,
    boilFrame: request.boilFrame, redrawFrame: request.redrawFrame ?? 0,
    elapsed: performance.now() - started, bitmap: canvas.transferToImageBitmap()
  };
  self.postMessage(result, { transfer: [result.bitmap] });
};
