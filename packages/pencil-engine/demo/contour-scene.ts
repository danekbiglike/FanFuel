import type { GbrTip, PathCommand, PencilContourBrush, PencilContourStroke, SceneNode, ShapeNode } from "../src/index.js";
import { mascotScene } from "./scene.js";
import { curlMask } from "./study-scene.js";

const M = (x: number, y: number): PathCommand => ({ op: "M", x, y });
const C = (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): PathCommand =>
  ({ op: "C", c1x, c1y, c2x, c2y, x, y });
const Z: PathCommand = { op: "Z" };

// Только видимый край тела: верхняя дуга скрыта канистрой и не должна пересекать её.
const bodyLeft: PathCommand[] = [
  M(235, 171), C(217, 200, 187, 245, 165, 291),
  C(141, 337, 135, 379, 155, 405)
];
const bodyBase: PathCommand[] = [
  M(153, 402), C(174, 430, 218, 438, 273, 435),
  C(327, 433, 365, 407, 383, 376)
];
const bodyRight: PathCommand[] = [
  M(366, 398), C(394, 365, 400, 345, 394, 302),
  C(391, 289, 382, 277, 369, 269),
  C(348, 240, 314, 215, 286, 200)
];
const eyeLeft: PathCommand[] = [
  M(256, 278), C(242, 273, 233, 288, 232, 309),
  C(231, 330, 240, 343, 253, 343),
  C(269, 343, 278, 324, 277, 304),
  C(276, 289, 267, 279, 256, 278), Z
];
const eyeRight: PathCommand[] = [
  M(312, 266), C(297, 261, 288, 276, 288, 298),
  C(286, 322, 296, 343, 314, 344),
  C(332, 346, 346, 326, 346, 301),
  C(346, 280, 331, 267, 312, 266), Z
];
const pupilLeft: PathCommand[] = [
  M(255, 284), C(246, 282, 244, 292, 247, 302),
  C(250, 312, 259, 315, 264, 307),
  C(268, 299, 264, 287, 255, 284), Z
];
const pupilRight: PathCommand[] = [
  M(313, 272), C(303, 269, 300, 280, 303, 290),
  C(307, 302, 317, 305, 323, 296),
  C(329, 286, 324, 275, 313, 272), Z
];

function shape(id: string, nodes: SceneNode[] = mascotScene.nodes): ShapeNode {
  for (const node of nodes) {
    if (node.type === "shape" && node.id === id) return node;
    if (node.type === "group") {
      try { return shape(id, node.children); } catch { /* Ищем в следующей группе. */ }
    }
  }
  throw new Error(`Missing contour path: ${id}`);
}

export type ContourTuning = {
  pressureScale: number;
  pressureVariation: number;
  randomness: number;
  taperLengthCss: number;
  taperMinimum: number;
};

export function oilyContours(widthCss: number, grain: number, tip?: GbrTip, tuning?: ContourTuning): PencilContourStroke[] {
  const brush: PencilContourBrush = {
    widthCss, pigment: [24, 24, 22], density: 0.85, grain, tilt: 0.08, fray: 0, tip, ...tuning
  };
  const bodyBrush = { ...brush, density: 0.77 };
  const detail = { ...brush, widthCss: widthCss * 0.68, density: 0.78 };
  const roundedDetail = { ...detail, handwork: 0.65 };
  const roundedPupil = { ...detail, handwork: 0.45 };
  const light = { ...brush, widthCss: widthCss * 0.65, pigment: [88, 89, 82] as [number, number, number], density: 0.36 };
  const pressureProfiles: Record<string, number[]> = {
    "body-left": [0.72, 0.86, 1.14, 1.32, 0.9],
    "body-base": [0.82, 1.1, 1.35, 1.12, 0.8],
    "body-right": [0.78, 1.08, 1.34, 1.1, 0.73],
    curl: [0.62, 1.13, 1.35, 0.78],
    "canister-body": [0.82, 1.17, 0.87, 1.25, 0.82]
  };
  const taperModes: Record<string, PencilContourStroke["taper"]> = {
    "body-left": "start",
    "body-base": "none",
    "body-right": "end"
  };
  const line = (id: string, path = shape(id).path, b = brush, transform?: PencilContourStroke["transform"]): PencilContourStroke =>
    ({ id, path, brush: b, pressureProfile: pressureProfiles[id], taper: taperModes[id], transform });
  const face = { x: 289, y: 279 };
  const canister = { x: 260, y: 45, rotation: 0.25, scale: 0.8 };
  return [
    line("left-leg", shape("left-leg").path, brush, { x: 16 }), line("right-leg"),
    line("left-arm-stroke", shape("left-arm-stroke").path, brush, { x: 180, y: 276 }),
    line("curl", curlMask, brush, { x: 264, y: 315 }),
    line("body-left", bodyLeft, bodyBrush),
    line("body-base", bodyBase, bodyBrush),
    line("body-right", bodyRight, bodyBrush),
    line("body-highlight", shape("highlight").path, detail, { x: 264, y: 315 }),
    line("eye-left", eyeLeft, roundedDetail),
    line("eye-right", eyeRight, roundedDetail),
    line("pupil-left", pupilLeft, roundedPupil),
    line("pupil-right", pupilRight, roundedPupil),
    line("smile", shape("smile").path, light, face),
    line("right-arm"),
    line("canister-body", shape("canister-body").path, brush, canister),
    line("canister-neck", shape("canister-neck").path, brush, canister),
    line("handle-hole", shape("handle-hole").path, detail, canister),
    line("canister-ridge", shape("canister-ridge").path, detail, canister),
    line("canister-f", shape("canister-f").path, detail, canister),
    line("canister-highlight", shape("canister-highlight").path, light, canister),
    line("left-motion-one", shape("left-motion-one").path, light),
    line("left-motion-two", shape("left-motion-two").path, light)
  ];
}
