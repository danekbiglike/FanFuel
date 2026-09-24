import { layoutPencilText, type PencilAlphabet, type PencilScene, type PathCommand, type PencilStyle, type SceneNode, type ShapeNode } from "../src/index.js";

const M = (x: number, y: number): PathCommand => ({ op: "M", x, y });
const L = (x: number, y: number): PathCommand => ({ op: "L", x, y });
const Q = (cx: number, cy: number, x: number, y: number): PathCommand => ({ op: "Q", cx, cy, x, y });
const Z: PathCommand = { op: "Z" };
const charcoal = "#191a18", lime = "#cafa39", paper = "#fffdf5";

function shape(id: string, path: PathCommand[], style: PencilStyle, reveal?: { start: number; end: number }): ShapeNode {
  return { type: "shape", id, path, style, reveal };
}
const graphite: PencilStyle = {
  fill: charcoal, stroke: "#10110f", width: 2.5, grain: 1.2, temporal: "boil",
  hatch: { color: "#f0eee6", spacing: 3.1, angle: -0.62, width: 0.55, opacity: 0.36 }
};
const bright: PencilStyle = {
  fill: lime, stroke: "#20221a", width: 2.3, grain: 1.1, temporal: "boil",
  hatch: { color: "#60751d", spacing: 3.4, angle: -0.67, width: 0.5, opacity: 0.28 }
};

const canister: SceneNode = {
  type: "group", id: "canister-rig", transform: { x: 286, y: 83 },
  motion: { loop: true, keys: [
    { at: 0, value: { rotation: -0.035 } },
    { at: 0.9, value: { rotation: 0.035 } },
    { at: 1.8, value: { rotation: -0.035 } }
  ] },
  children: [
    shape("canister-body", [M(1, 23), Q(2, 5, 20, 3), L(43, 3), Q(52, 4, 58, 15), L(70, 22), L(112, 2), Q(121, -2, 133, 5), L(166, 24), Q(177, 30, 177, 41), L(177, 116), Q(182, 123, 182, 137), L(160, 184), Q(154, 193, 143, 193), L(13, 175), Q(-2, 174, -3, 159), Z], bright),
    shape("canister-neck", [M(11, 6), L(11, -8), Q(11, -17, 20, -17), L(44, -17), Q(53, -16, 53, -6), L(53, 5), Z], bright),
    shape("handle-hole", [M(83, 31), L(115, 13), Q(119, 11, 124, 14), L(156, 32), Q(160, 35, 159, 41), L(153, 56), L(80, 43), Q(75, 41, 83, 31), Z], { fill: paper, stroke: charcoal, width: 3, grain: 0.8 }),
    shape("canister-ridge", [M(19, 43), Q(22, 26, 38, 26), Q(57, 30, 54, 48), L(41, 137), Q(38, 153, 24, 151), Q(9, 149, 13, 132), Z], { fill: "#b2e929", stroke: charcoal, width: 1.8, grain: 1 }),
    shape("canister-f", [M(91, 75), L(153, 70), L(149, 90), L(108, 96), L(105, 109), L(137, 107), L(132, 125), L(101, 128), L(96, 156), L(70, 150), Z], { fill: charcoal, stroke: charcoal, width: 1.5, grain: 0.6 }),
    shape("canister-highlight", [M(30, 14), Q(57, 16, 77, 28), L(149, 65)], { stroke: paper, width: 2, grain: 0.7, opacity: 0.75, temporal: "held" })
  ]
};

export const mascotScene: PencilScene = {
  width: 512, height: 512, seed: 72801, boilFps: 10,
  nodes: [
    shape("ground", [M(91, 458), Q(260, 447, 418, 456)], { stroke: "#92918b", width: 16, grain: 2.2, opacity: 0.4, temporal: "held" }),
    shape("left-leg", [M(206, 413), Q(206, 448, 187, 458), Q(178, 465, 201, 466), L(234, 466), Q(243, 459, 225, 455), L(228, 422)], { stroke: charcoal, width: 9, grain: 1, temporal: "boil" }),
    shape("right-leg", [M(329, 417), Q(351, 446, 350, 454), Q(342, 463, 363, 462), L(388, 462), Q(402, 459, 382, 452), L(361, 408)], { stroke: charcoal, width: 9, grain: 1, temporal: "boil" }),
    {
      type: "group", id: "left-arm", transform: { x: 160, y: 276 },
      motion: { loop: true, keys: [
        { at: 0, value: { rotation: -0.025 } },
        { at: 0.9, value: { rotation: 0.045 } },
        { at: 1.8, value: { rotation: -0.025 } }
      ] },
      children: [shape("left-arm-stroke", [M(0, 0), Q(-59, 76, -35, 137), Q(-16, 164, 2, 145)], { stroke: charcoal, width: 12, grain: 1.3, temporal: "boil" })]
    },
    {
      type: "group", id: "body-rig", transform: { x: 264, y: 315 },
      motion: { loop: true, keys: [
        { at: 0, value: { scaleY: 1, y: 0 } },
        { at: 0.9, value: { scaleY: 0.985, y: 3 } },
        { at: 1.8, value: { scaleY: 1, y: 0 } }
      ] },
      children: [
        shape("oily-body", [M(-100, -42), Q(-91, -94, -60, -129), Q(-33, -157, -46, -172), Q(-75, -192, -62, -213), Q(-49, -231, -26, -220), Q(1, -203, -1, -167), Q(25, -168, 65, -145), Q(132, -109, 154, -50), Q(179, 11, 154, 69), Q(131, 113, 65, 126), Q(-5, 141, -63, 114), Q(-131, 81, -126, 17), Q(-122, -10, -100, -42), Z], graphite),
        shape("highlight", [M(78, -94), Q(91, -105, 101, -91), L(127, -50), Q(136, -35, 123, -27), Q(112, -20, 104, -37), Z], { fill: lime, stroke: lime, width: 1.5, grain: 0.7, temporal: "boil" }),
        shape("eye-left", [M(-20, -1), Q(-52, -25, -65, -1), Q(-80, 37, -63, 62), Q(-45, 78, -21, 49), Q(-8, 28, -20, -1), Z], { fill: paper, stroke: charcoal, width: 2.5, grain: 0.8, temporal: "held" }),
        shape("eye-right", [M(33, -19), Q(11, -28, 2, -2), Q(-3, 33, 16, 55), Q(36, 72, 53, 37), Q(68, 1, 48, -13), Q(41, -20, 33, -19), Z], { fill: paper, stroke: charcoal, width: 2.5, grain: 0.8, temporal: "held" }),
        shape("pupil-left", [M(-41, 9), Q(-48, -1, -53, 7), Q(-58, 21, -50, 31), Q(-40, 35, -38, 20), Z], { fill: charcoal, stroke: charcoal, width: 1, temporal: "held" }),
        shape("pupil-right", [M(30, -7), Q(20, -13, 18, 0), Q(18, 15, 27, 23), Q(38, 22, 36, 8), Z], { fill: charcoal, stroke: charcoal, width: 1, temporal: "held" }),
        shape("smile", [M(-3, 75), Q(3, 93, 14, 86), Q(25, 79, 27, 66)], { stroke: paper, width: 2.2, grain: 0.5, temporal: "held" }),
        {
          type: "sprite", id: "blink", fps: 2, frames: [[], [], [], [], [], [
            shape("blink-cover-left", [M(-20, -1), Q(-52, -25, -65, -1), Q(-80, 37, -63, 62), Q(-45, 78, -21, 49), Q(-8, 28, -20, -1), Z], { fill: charcoal, stroke: charcoal, width: 3, temporal: "held" }),
            shape("blink-cover-right", [M(33, -19), Q(11, -28, 2, -2), Q(-3, 33, 16, 55), Q(36, 72, 53, 37), Q(68, 1, 48, -13), Q(41, -20, 33, -19), Z], { fill: charcoal, stroke: charcoal, width: 3, temporal: "held" }),
            shape("blink-left", [M(-62, 25), Q(-44, 19, -21, 28)], { stroke: paper, width: 2, temporal: "held" }),
            shape("blink-right", [M(7, 17), Q(26, 11, 51, 20)], { stroke: paper, width: 2, temporal: "held" })
          ]]
        }
      ]
    },
    shape("right-arm", [M(382, 315), Q(423, 259, 398, 231), L(387, 219)], { stroke: charcoal, width: 10, grain: 1, temporal: "boil" }),
    canister,
    shape("left-motion-one", [M(113, 176), Q(128, 150, 160, 147)], { stroke: charcoal, width: 1.4, grain: 0.5, opacity: 0.65 }),
    shape("left-motion-two", [M(122, 200), Q(132, 177, 164, 166)], { stroke: charcoal, width: 1.2, grain: 0.5, opacity: 0.5 })
  ]
};

const letters: PencilAlphabet = {
  unitsPerEm: 180,
  glyphs: {
    F: { advance: 142, strokes: [
      [M(0, 176), Q(12, 93, 22, 0)],
      [M(21, 3), Q(74, -16, 130, 0)],
      [M(12, 77), Q(55, 59, 103, 65)]
    ] },
    A: { advance: 120, strokes: [
      [M(0, 175), Q(24, 86, 54, 3)],
      [M(55, 5), Q(74, 87, 96, 176)],
      [M(19, 114), Q(54, 103, 81, 110)]
    ] },
    N: { advance: 100, strokes: [
      [M(0, 174), Q(2, 89, 1, 3)],
      [M(2, 5), Q(39, 78, 76, 172)],
      [M(76, 172), Q(72, 85, 76, 2)]
    ] },
    " ": { advance: 55, strokes: [] }
  }
};

export const writingScene: PencilScene = {
  width: 512, height: 512, seed: 5581, boilFps: 10,
  nodes: [layoutPencilText("FAN", letters, {
    id: "fan-lettering", x: 92, y: 169, height: 180,
    style: { stroke: charcoal, width: 13, grain: 1.3, temporal: "held" },
    secondsPerStroke: 0.58
  })]
};
