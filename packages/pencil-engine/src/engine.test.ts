import test from "node:test";
import assert from "node:assert/strict";
import { flattenPath, sampleMotion, softenPolyline } from "./geometry.js";
import { PencilRenderer } from "./renderer.js";
import { layoutPencilText } from "./lettering.js";
import type { PencilScene } from "./model.js";

test("curves are adaptively tessellated and retain path length", () => {
  const path = [
    { op: "M" as const, x: 0, y: 0 },
    { op: "Q" as const, cx: 50, cy: 100, x: 100, y: 0 }
  ];
  const coarse = flattenPath(path, 20)[0];
  const fine = flattenPath(path, 0.05)[0];
  assert.ok(fine.points.length > coarse.points.length);
  assert.ok(fine.length > 100);
  assert.deepEqual(fine.points.at(-1), { x: 100, y: 0 });
});

test("мягкое сглаживание убирает излом без сдвига концов и разрыва замкнутой оси", () => {
  const corner = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
  const open = softenPolyline(corner, false, 0.75);
  assert.deepEqual(open[0], corner[0]);
  assert.deepEqual(open.at(-1), corner[2]);
  assert.ok(open.length > corner.length);
  const middle = open[Math.floor(open.length / 2)];
  assert.ok(middle.x < 10 && middle.y > 0);
  assert.ok(Math.min(10 - middle.x, middle.y) <= 0.75);
  const closed = softenPolyline([...corner, corner[0]], true, 0.75);
  assert.deepEqual(closed.at(-1), closed[0]);
  assert.deepEqual(softenPolyline(corner, false, 0), corner);
});

test("сглаживание смягчает и небольшую рябь вдоль деформированной оси", () => {
  const kinked = [{ x: 0, y: 0 }, { x: 5, y: 1 }, { x: 10, y: 0 },
    { x: 15, y: 1 }, { x: 20, y: 0 }];
  const smooth = softenPolyline(kinked, false, 2.1);
  assert.deepEqual(smooth[0], kinked[0]);
  assert.deepEqual(smooth.at(-1), kinked.at(-1));
  assert.ok(Math.max(...smooth.map(point => point.y)) < 0.9);
});

test("rig motion interpolates and loops predictably", () => {
  const motion = { loop: true, keys: [
    { at: 0, value: { rotation: 0, x: 0 } },
    { at: 2, value: { rotation: 1, x: 20 } }
  ] };
  assert.equal(sampleMotion(motion, 1).x, 10);
  assert.equal(sampleMotion(motion, 3).x, 10);
});

function capture(scene: PencilScene, seconds: number): string {
  const calls: string[] = [];
  const context = new Proxy({}, {
    get(_target, property) {
      if (typeof property === "string" && ["setTransform", "clearRect", "save", "restore", "translate", "rotate", "scale", "beginPath", "moveTo", "lineTo", "stroke", "fill", "clip", "closePath"].includes(property)) {
        return (...args: number[]) => calls.push(`${property}:${args.map(n => n.toFixed(3)).join(",")}`);
      }
      return undefined;
    },
    set() { return true; }
  }) as CanvasRenderingContext2D;
  new PencilRenderer(scene).draw(context, seconds, { width: 100, height: 100 });
  return calls.join("|");
}

test("held grain is stable while boil changes only on its frame boundary", () => {
  const scene: PencilScene = { width: 100, height: 100, seed: 44, boilFps: 10, nodes: [{
    type: "shape", id: "line", path: [{ op: "M", x: 10, y: 20 }, { op: "L", x: 90, y: 20 }],
    style: { stroke: "#111", width: 3, grain: 2, temporal: "held" }
  }] };
  assert.equal(capture(scene, 0), capture(scene, 0.95));
  if (scene.nodes[0].type === "shape") scene.nodes[0].style.temporal = "boil";
  assert.equal(capture(scene, 0), capture(scene, 0.09));
  assert.notEqual(capture(scene, 0), capture(scene, 0.11));
});

test("draw on reveals a fixed stroke instead of regenerating grain", () => {
  const scene: PencilScene = { width: 100, height: 100, seed: 44, nodes: [{
    type: "shape", id: "letter", path: [{ op: "M", x: 10, y: 20 }, { op: "L", x: 90, y: 20 }],
    style: { stroke: "#111", width: 3, grain: 2, temporal: "boil" }, reveal: { start: 0, end: 1 }
  }] };
  const half = capture(scene, 0.5);
  assert.ok(half.includes("lineTo"));
  assert.equal(capture(scene, 1), capture(scene, 2));
});

test("lettering lays out authored glyphs, spaces and new lines in writing order", () => {
  const alphabet = { unitsPerEm: 100, glyphs: {
    "А": { advance: 70, strokes: [[{ op: "M" as const, x: 0, y: 80 }, { op: "L" as const, x: 35, y: 0 }]] },
    " ": { advance: 30, strokes: [] }
  } };
  const group = layoutPencilText("А А\nА", alphabet, {
    id: "title", x: 10, y: 20, height: 200,
    style: { stroke: "#111", width: 2 }, start: 1, secondsPerStroke: 0.5
  });
  assert.equal(group.children.length, 3);
  assert.deepEqual(group.transform, { x: 10, y: 20, scaleX: 2, scaleY: 2 });
  assert.equal(group.children[1].transform?.x, 100);
  assert.equal(group.children[2].transform?.y, 125);
  const last = group.children[2];
  assert.equal(last.type, "shape");
  if (last.type === "shape") assert.deepEqual(last.reveal, { start: 2, end: 2.5 });
});
