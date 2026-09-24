import {
  bindSoftBodyPath, createSoftBody, deformSoftBodyPath, flattenPath, grabSoftBody, moveSoftBodyGrab,
  releaseSoftBody, renderPencilContours, setSoftBodyCollider, setSoftBodySoftness, softBodyColliderPoints, stepSoftBody,
  type BoundPath, type GbrTip, type PathCommand, type PencilContourBrush, type PencilContourStroke, type SoftBody,
  type SoftBodySurface
} from "../src/index.js";
import type { SoftRenderRequest, SoftRenderResult } from "./soft-body-worker.js";
import type { contourMessages } from "./locales.js";

type Copy = typeof contourMessages.ru | typeof contourMessages.en;
type SourceStroke = PencilContourStroke & { bound?: BoundPath };

const sceneWidth = 720, sceneHeight = 370;
export const bodyBounds = { x: 62, y: 18, width: 132, height: 160 };
const M = (x: number, y: number): PathCommand => ({ op: "M", x, y });
const C = (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): PathCommand =>
  ({ op: "C", c1x, c1y, c2x, c2y, x, y });
const Z: PathCommand = { op: "Z" };
export const previousGraphite: PencilContourBrush = {
  widthCss: 3.6, pigment: [28, 29, 27], density: 0.8, grain: 0.42, tilt: 0.06,
  taperLengthCss: 13, handwork: 0.4, handworkSide: 1
};
export const softGraphite: PencilContourBrush = {
  widthCss: 5.1, pigment: [24, 24, 22], density: 0.85, grain: 0.45,
  fray: 0, tilt: 0.08, taperLengthCss: 15, pressureVariation: 1.55,
  handwork: 0.65, handworkSide: 1
};
const fine = { ...previousGraphite, widthCss: 2.7 };
const hardLandKeys = [
  { at: 0, scaleX: 1, scaleY: 1 },
  { at: 0.055, scaleX: 1.18, scaleY: 0.78 },
  { at: 0.14, scaleX: 0.95, scaleY: 1.06 },
  { at: 0.28, scaleX: 1, scaleY: 1 }
];
export function hardLandPose(seconds: number): { scaleX: number; scaleY: number } {
  if (seconds <= 0 || seconds >= hardLandKeys[hardLandKeys.length - 1].at) return hardLandKeys[0];
  const nextIndex = hardLandKeys.findIndex(key => key.at >= seconds);
  const before = hardLandKeys[nextIndex - 1], after = hardLandKeys[nextIndex];
  const fraction = (seconds - before.at) / (after.at - before.at);
  const smooth = fraction * fraction * (3 - 2 * fraction);
  return { scaleX: before.scaleX + (after.scaleX - before.scaleX) * smooth,
    scaleY: before.scaleY + (after.scaleY - before.scaleY) * smooth };
}
export const source: SourceStroke[] = [
  { id: "soft-silhouette", brush: previousGraphite, taper: "none", pressureProfile: [0.85, 1.12, 1.27, 0.94, 1.18, 0.9], path: [
    M(128, 21), C(119, 34, 102, 52, 87, 77), C(70, 105, 60, 131, 65, 150),
    C(70, 172, 91, 176, 125, 176), C(158, 179, 187, 171, 193, 149),
    C(199, 128, 180, 91, 151, 66), C(141, 51, 147, 30, 128, 21), Z
  ] },
  { id: "soft-eye-left", brush: fine, path: [M(107, 103), C(94, 99, 86, 111, 88, 128), C(90, 145, 103, 149, 112, 137), C(119, 125, 116, 107, 107, 103), Z] },
  { id: "soft-eye-right", brush: fine, path: [M(146, 101), C(135, 98, 126, 110, 128, 128), C(130, 144, 143, 149, 152, 138), C(161, 126, 156, 104, 146, 101), Z] },
  { id: "soft-pupil-left", brush: fine, path: [M(105, 110), C(100, 108, 98, 117, 101, 124), C(104, 131, 110, 126, 109, 119), C(109, 115, 107, 111, 105, 110), Z] },
  { id: "soft-pupil-right", brush: fine, path: [M(144, 107), C(139, 105, 137, 114, 140, 121), C(143, 129, 149, 125, 149, 117), C(149, 113, 147, 109, 144, 107), Z] },
  { id: "soft-smile", brush: fine, path: [M(111, 145), C(119, 156, 139, 157, 148, 145)] }
];
const sourceLengths = new Map(source.map(stroke => [stroke.id, flattenPath(stroke.path, 0.45).reduce((total, contour) =>
  total + contour.points.slice(1).reduce((length, point, index) =>
    length + Math.hypot(point.x - contour.points[index].x, point.y - contour.points[index].y), 0), 0)]));

export function setupSoftBodyDemo(copy: Copy, getImportedTip: () => GbrTip | undefined): { refreshBrush: () => void } {
  const stage = document.getElementById("contour-soft-stage")!;
  const canvas = document.getElementById("contour-soft-canvas") as HTMLCanvasElement;
  const hit = document.getElementById("contour-soft-hit") as HTMLButtonElement;
  hit.setAttribute("aria-label", copy.softHit);
  const context = canvas.getContext("2d")!;
  const status = document.getElementById("contour-soft-status")!;
  const timing = document.getElementById("contour-soft-timing")!;
  const reset = document.getElementById("contour-soft-reset") as HTMLButtonElement;
  const brushSelect = document.getElementById("contour-soft-brush") as HTMLSelectElement;
  const softnessInput = document.getElementById("contour-soft-softness") as HTMLInputElement;
  const softnessValue = document.getElementById("contour-soft-softness-value")!;
  const redrawInput = document.getElementById("contour-soft-redraw") as HTMLInputElement;
  const redrawValue = document.getElementById("contour-soft-redraw-value")!;
  const smoothingInput = document.getElementById("contour-soft-smoothing") as HTMLInputElement;
  const smoothingValue = document.getElementById("contour-soft-smoothing-value")!;
  const handworkInput = document.getElementById("contour-soft-handwork") as HTMLInputElement;
  const handworkValue = document.getElementById("contour-soft-handwork-value")!;
  const importedOption = document.getElementById("contour-soft-brush-imported") as HTMLOptionElement;
  document.getElementById("contour-soft-brush-label")!.textContent = copy.softBrush;
  document.getElementById("contour-soft-brush-soft")!.textContent = copy.softBrushSoft;
  document.getElementById("contour-soft-brush-previous")!.textContent = copy.softBrushPrevious;
  importedOption.textContent = copy.softBrushImported;
  document.getElementById("contour-soft-softness-label")!.textContent = copy.softSoftness;
  document.getElementById("contour-soft-redraw-label")!.textContent = copy.softRedraw;
  document.getElementById("contour-soft-smoothing-label")!.textContent = copy.softSmoothing;
  document.getElementById("contour-soft-handwork-label")!.textContent = copy.softHandwork;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const key of ["title", "note", "card-a", "card-b", "reset"] as const) {
    document.getElementById(`contour-soft-${key}`)!.textContent = ({
      title: copy.softTitle, note: copy.softNote, "card-a": copy.softCardA,
      "card-b": copy.softCardB, reset: copy.softReset
    })[key];
  }
  status.textContent = reducedMotion ? copy.softReduced : copy.softReady;
  hit.disabled = reducedMotion;
  reset.disabled = reducedMotion;
  brushSelect.disabled = reducedMotion;
  softnessInput.disabled = reducedMotion;
  redrawInput.disabled = reducedMotion;
  smoothingInput.disabled = reducedMotion;
  handworkInput.disabled = reducedMotion;
  let body: SoftBody = createSoftBody(bodyBounds, { maxSegmentLength: 28, maxSpringStretch: 1.45 });
  setSoftBodySoftness(body, Number(softnessInput.value) / 100);
  softnessInput.addEventListener("input", () => {
    softnessValue.textContent = `${softnessInput.value} %`;
    setSoftBodySoftness(body, Number(softnessInput.value) / 100);
    canvas.dataset.softness = softnessInput.value;
  });
  canvas.dataset.softness = softnessInput.value;
  canvas.dataset.redrawStrength = redrawInput.value;
  canvas.dataset.smoothing = smoothingInput.value;
  canvas.dataset.handwork = handworkInput.value;
  redrawInput.addEventListener("input", () => {
    redrawValue.textContent = `${redrawInput.value} %`;
    canvas.dataset.redrawStrength = redrawInput.value;
    renderEpoch++;
    nextRender = 0;
  });
  smoothingInput.addEventListener("input", () => {
    smoothingValue.textContent = `${smoothingInput.value} %`;
    canvas.dataset.smoothing = smoothingInput.value;
    renderEpoch++;
    nextRender = 0;
  });
  handworkInput.addEventListener("input", () => {
    handworkValue.textContent = `${handworkInput.value} %`;
    canvas.dataset.handwork = handworkInput.value;
    renderEpoch++;
    nextRender = 0;
  });
  setSoftBodyCollider(body, source[0].path, 2);
  body.worldBounds = { left: 0, right: sceneWidth };
  for (const stroke of source) stroke.bound = bindSoftBodyPath(stroke.path, body, 0.45);
  let surfaces: SoftBodySurface[] = [];
  let renderScaleX = 1, renderScaleY = 1, renderDpr = Math.min(window.devicePixelRatio || 1, 2);
  let renderEpoch = 0;
  let previousRenderedNodes: Float32Array | undefined;
  const measure = () => {
    const box = canvas.getBoundingClientRect();
    const sx = sceneWidth / box.width, sy = sceneHeight / box.height;
    renderScaleX = box.width / sceneWidth;
    renderScaleY = box.height / sceneHeight;
    body.contactRadius = (brushSelect.value === "previous" ? previousGraphite.widthCss : softGraphite.widthCss) / (2 * renderScaleY);
    renderDpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(box.width * renderDpr), targetHeight = Math.round(box.height * renderDpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      renderEpoch++;
      previousRenderedNodes = undefined;
    }
    surfaces = Array.from(stage.querySelectorAll<HTMLElement>("[data-soft-surface]")).map(element => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.dataset.softSurface!, solid: element.dataset.softSurface === "floor", left: (rect.left - box.left) * sx,
        right: (rect.right - box.left) * sx, top: (rect.top - box.top) * sy,
        bottom: element.dataset.softSurface === "floor" ? undefined : (rect.bottom - box.top) * sy
      };
    });
  };
  new ResizeObserver(measure).observe(stage);
  measure();
  if (reducedMotion) for (let index = 0; index < 480; index++) stepSoftBody(body, 1 / 120, surfaces);
  const point = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(sceneWidth, (event.clientX - box.left) * sceneWidth / box.width)),
      y: Math.max(0, Math.min(sceneHeight, (event.clientY - box.top) * sceneHeight / box.height)) };
  };
  let activePointer = -1, pointerTime = 0;
  hit.addEventListener("pointerdown", event => {
    if (activePointer !== -1 || !grabSoftBody(body, point(event))) return;
    activePointer = event.pointerId;
    pointerTime = event.timeStamp;
    hardLandStarted = 0;
    hardPoseAxis = "y";
    impactEpisodeUntil = 0;
    impactEpisodeRank = -1;
    nextRender = 0;
    hit.setPointerCapture(event.pointerId);
    status.textContent = copy.softDrag;
    event.preventDefault();
  });
  hit.addEventListener("pointermove", event => {
    if (event.pointerId !== activePointer) return;
    moveSoftBodyGrab(body, point(event), (event.timeStamp - pointerTime) / 1000);
    pointerTime = event.timeStamp;
  });
  const endDrag = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    releaseSoftBody(body);
    activePointer = -1;
    if (hit.hasPointerCapture(event.pointerId)) hit.releasePointerCapture(event.pointerId);
  };
  hit.addEventListener("pointerup", endDrag);
  hit.addEventListener("pointercancel", endDrag);
  hit.addEventListener("keydown", event => {
    const delta = event.shiftKey ? 36 : 12;
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta]
    };
    const offset = movement[event.key];
    if (!offset) return;
    event.preventDefault();
    hardLandStarted = 0;
    hardPoseAxis = "y";
    impactEpisodeUntil = 0;
    impactEpisodeRank = -1;
    body.sleeping = false;
    body.restSeconds = 0;
    for (const node of body.nodes) {
      node.x += offset[0]; node.previousX += offset[0];
      node.y += offset[1]; node.previousY += offset[1];
    }
  });
  reset.addEventListener("click", () => {
    body = createSoftBody(bodyBounds, { maxSegmentLength: 28, maxSpringStretch: 1.45 });
    setSoftBodySoftness(body, Number(softnessInput.value) / 100);
    setSoftBodyCollider(body, source[0].path, 2);
    body.worldBounds = { left: 0, right: sceneWidth };
    activePointer = -1;
    hardLandStarted = 0;
    hardPoseAxis = "y";
    wasClipActive = false;
    impactEpisodeUntil = 0;
    impactEpisodeRank = -1;
    previousRenderedNodes = undefined;
    renderEpoch++;
    nextRender = 0;
    lastImpactText = "";
    status.textContent = copy.softReady;
  });

  let worker: Worker | undefined;
  let workerBusy = false;
  let pending: SoftRenderRequest | undefined;
  let nextId = 0;
  let latestShown = 0;
  let renderElapsed = 0;
  const refreshBrush = () => {
    importedOption.disabled = !getImportedTip();
    if (importedOption.disabled && brushSelect.value === "imported") brushSelect.value = "soft";
    body.contactRadius = (brushSelect.value === "previous" ? previousGraphite.widthCss : softGraphite.widthCss) / (2 * renderScaleY);
    renderEpoch++;
    nextRender = 0;
  };
  brushSelect.addEventListener("change", refreshBrush);
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    try {
      worker = new Worker(new URL("./soft-body-worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<SoftRenderResult>) => {
        workerBusy = false;
        const result = event.data;
        if (result.id > latestShown && result.epoch === renderEpoch) {
          latestShown = result.id;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(result.bitmap, result.x * result.dpr, result.y * result.dpr);
          renderElapsed = result.elapsed;
          canvas.dataset.boilFrame = String(result.boilFrame);
          canvas.dataset.redrawFrame = String(result.redrawFrame);
        }
        result.bitmap.close();
        if (pending) {
          const current = pending;
          pending = undefined;
          dispatch(current);
        }
      };
      worker.onerror = () => { worker?.terminate(); worker = undefined; workerBusy = false; pending = undefined; };
    } catch { worker = undefined; }
  }
  function dispatch(request: SoftRenderRequest) {
    if (worker) {
      if (workerBusy) { pending = request; return; }
      workerBusy = true;
      worker.postMessage(request);
      return;
    }
    const offscreen = document.createElement("canvas");
    const started = performance.now();
    renderPencilContours(offscreen, request.strokes, {
      sceneWidth: request.width, sceneHeight: request.height,
      cssWidth: request.width, cssHeight: request.height, dpr: request.dpr, seed: 72801,
      boilFrame: request.boilFrame, boilStrength: request.boilStrength,
      redrawFrame: request.redrawFrame, redrawStrengthCss: request.redrawStrengthCss,
      smoothingCss: request.smoothingCss, grainSpace: "stroke"
    });
    renderElapsed = performance.now() - started;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(offscreen, request.x * renderDpr, request.y * renderDpr);
    canvas.dataset.boilFrame = String(request.boilFrame);
    canvas.dataset.redrawFrame = String(request.redrawFrame);
  }
  let hardLandStarted = 0;
  let hardPoseAxis: "x" | "y" = "y";
  let impactEpisodeUntil = 0, impactEpisodeRank = -1;
  let lastFrame = performance.now(), accumulator = 0, nextRender = 0, wasMoving = false;
  let wasClipActive = false;
  let physicsElapsed = 0, nextTiming = 0, lastImpactText = "", renderedReduced = false;
  function positionHitArea() {
    const points = softBodyColliderPoints(body);
    if (!points.length) return;
    const xs = points.map(point => point.x), ys = points.map(point => point.y);
    const left = Math.min(...xs), right = Math.max(...xs);
    const top = Math.min(...ys), bottom = Math.max(...ys);
    hit.style.left = `${left / sceneWidth * 100}%`;
    hit.style.top = `${top / sceneHeight * 100}%`;
    hit.style.width = `${(right - left) / sceneWidth * 100}%`;
    hit.style.height = `${(bottom - top) / sceneHeight * 100}%`;
    hit.style.clipPath = `polygon(${points.map(point =>
      `${(point.x - left) / Math.max(1, right - left) * 100}% ${(point.y - top) / Math.max(1, bottom - top) * 100}%`).join(",")})`;
  }
  const tick = (now: number) => {
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    accumulator += dt;
    const started = performance.now();
    while (!reducedMotion && accumulator >= 1 / 120) {
      const impact = stepSoftBody(body, 1 / 120, surfaces);
      if (impact && !body.grab) {
        const sameEpisode = now <= impactEpisodeUntil;
        const rank = impact.squeeze ? 5 : impact.kind === "hard" ? (impact.normal === "top" ? 4 : 3)
          : impact.normal === "top" ? 2 : 1;
        if (!sameEpisode || rank > impactEpisodeRank) {
          impactEpisodeRank = rank;
          if (impact.kind === "hard" && (impact.normal === "top" || impact.squeeze)) {
            hardLandStarted = now;
            hardPoseAxis = impact.squeeze?.axis ?? "y";
          }
          const surface = stage.querySelector<HTMLElement>(`[data-soft-surface="${impact.surfaceId}"]`);
          const name = impact.surfaceId === "floor" ? copy.softFloor : surface?.textContent?.trim() || impact.surfaceId;
          if (impact.squeeze) {
            const pairNames = impact.squeeze.surfaceIds.map(id => {
              if (id === "floor") return copy.softFloor;
              return stage.querySelector<HTMLElement>(`[data-soft-surface="${id}"]`)?.textContent?.trim() || id;
            }).join(" · ");
            const impactCopy = impact.kind === "hard" ? copy.softHardSqueeze : copy.softSqueeze;
            lastImpactText = impactCopy.replace("{surfaces}", pairNames)
              .replace("{amount}", String(Math.round(impact.squeeze.compression * 100)));
          } else {
            const impactCopy = impact.normal === "top" ? (impact.kind === "hard" ? copy.softHard : copy.softLand) :
              (impact.kind === "hard" ? copy.softHardBump : copy.softBump);
            lastImpactText = impactCopy.replace("{name}", name).replace("{speed}", impact.speed.toFixed(0));
          }
          status.textContent = lastImpactText;
        } else {
          impactEpisodeRank = Math.max(impactEpisodeRank, rank);
        }
        // Несколько контактов от одного падения или сжатия считаются одной реакцией.
        impactEpisodeUntil = now + 750;
      }
      accumulator -= 1 / 120;
    }
    physicsElapsed = performance.now() - started;
    const activeClip = hardLandStarted > 0 && now - hardLandStarted < 280;
    const moved = !previousRenderedNodes || body.nodes.some((node, index) =>
      Math.abs(node.x - previousRenderedNodes![index * 2]) > 0.18 ||
      Math.abs(node.y - previousRenderedNodes![index * 2 + 1]) > 0.18);
    if (moved) positionHitArea();
    const moving = !body.sleeping && (body.grab !== undefined || moved || activeClip);
    if (moving && !wasMoving) nextRender = 0;
    wasMoving = moving;
    if (now >= nextRender && !document.hidden && (!reducedMotion || !renderedReduced)) {
      renderedReduced = true;
      nextRender = now + (moving ? 1000 / 24 : 500);
      const clipFinished = wasClipActive && !activeClip;
      wasClipActive = activeClip;
      if (!moved && !activeClip && !clipFinished && reducedMotion) {
        requestAnimationFrame(tick);
        return;
      }
      previousRenderedNodes = Float32Array.from(body.nodes.flatMap(node => [node.x, node.y]));
      // Профиль при сильном ударе задан ключами; слабый удар остаётся чистой физикой.
      const basePose = hardLandPose(hardLandStarted ? (now - hardLandStarted) / 1000 : 0);
      const pose = hardPoseAxis === "x" ? { scaleX: basePose.scaleY, scaleY: basePose.scaleX } : basePose;
      const center = body.nodes[Math.floor(body.rows / 2) * body.columns + Math.floor(body.columns / 2)];
      const selectedBrush = brushSelect.value === "previous" ? previousGraphite : softGraphite;
      const handworkAmount = Number(handworkInput.value) / 100;
      const tip = brushSelect.value === "imported" ? getImportedTip() : undefined;
      const strokes = source.map(stroke => {
        const path = deformSoftBodyPath(stroke.bound!, body).map(command => {
          if (!("x" in command)) return command;
          return { ...command, x: center.x + (command.x - center.x) * pose.scaleX,
            y: center.y + (command.y - center.y) * pose.scaleY };
        });
        const face = stroke.id !== "soft-silhouette";
        const brush = { ...selectedBrush, widthCss: selectedBrush.widthCss * (face ? 0.75 : 1),
          density: face ? Math.min(1, selectedBrush.density * 1.12) : selectedBrush.density,
          grain: face ? selectedBrush.grain * 0.82 : selectedBrush.grain,
          pressureScale: face ? (selectedBrush.pressureScale ?? 1) * 1.12 : selectedBrush.pressureScale,
          pressureVariation: face ? Math.min(selectedBrush.pressureVariation ?? 1, 0.6) : selectedBrush.pressureVariation,
          handwork: face ? (stroke.id === "soft-smile" ? 0
            : handworkAmount * (stroke.id.startsWith("soft-eye") ? 0.85 : 0.5))
            : handworkAmount * (selectedBrush.handwork ?? 0) / 0.65,
          taperLengthCss: stroke.id === "soft-smile" ? 9 : selectedBrush.taperLengthCss,
          taperMinimum: stroke.id === "soft-smile" ? 0.55 : selectedBrush.taperMinimum,
          tip: tip ?? selectedBrush.tip };
        return { ...stroke, brush, bound: undefined, path,
          materialLengthCss: (sourceLengths.get(stroke.id) ?? 1) * renderScaleX };
      });
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const stroke of strokes) for (const command of stroke.path) if ("x" in command) {
        minX = Math.min(minX, command.x); minY = Math.min(minY, command.y);
        maxX = Math.max(maxX, command.x); maxY = Math.max(maxY, command.y);
      }
      const x = Math.floor((minX * renderScaleX - 12) / 8) * 8;
      const y = Math.floor((minY * renderScaleY - 12) / 8) * 8;
      const imageWidth = Math.min(1600, Math.max(1, Math.ceil(maxX * renderScaleX + 12 - x)));
      const imageHeight = Math.min(1200, Math.max(1, Math.ceil(maxY * renderScaleY + 12 - y)));
      const local = strokes.map(stroke => ({ ...stroke, path: stroke.path.map(command =>
        "x" in command ? { ...command, x: command.x * renderScaleX - x, y: command.y * renderScaleY - y } : command) }));
      const renderId = ++nextId;
      const redrawAmount = reducedMotion ? 0 : Number(redrawInput.value) / 100;
      dispatch({ id: renderId, epoch: renderEpoch, strokes: local, x, y, width: imageWidth, height: imageHeight,
        dpr: renderDpr, boilFrame: reducedMotion ? 0 : Math.floor(now / 500),
        boilStrength: Math.min(1, redrawAmount * 1.25), redrawFrame: reducedMotion ? 0 : renderId,
        redrawStrengthCss: redrawAmount * 1.2, smoothingCss: Number(smoothingInput.value) * 0.03 });
      canvas.dataset.renderRequests = String(nextId);
    }
    if (now >= nextTiming) {
      timing.textContent = copy.softTiming.replace("{physics}", physicsElapsed.toFixed(2)).replace("{render}", renderElapsed.toFixed(1));
      nextTiming = now + 1000;
    }
    if (!reducedMotion) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return { refreshBrush };
}
