import assert from "node:assert/strict";
import test from "node:test";
import { bindSoftBodyPath, createSoftBody, deformSoftBodyPath, grabSoftBody, moveSoftBodyGrab,
  releaseSoftBody, setSoftBodyCollider, setSoftBodySoftness, softBodyColliderPoints, stepSoftBody } from "./soft-body.js";

test("скорость контакта выбирает физический отклик или подготовленный клип", () => {
  const floor = [{ id: "floor", left: 0, right: 720, top: 350 }];
  const fall = (top: number) => {
    const body = createSoftBody({ x: 62, y: top, width: 132, height: 160 });
    for (let i = 0; i < 300; i++) {
      const impact = stepSoftBody(body, 1 / 120, floor);
      if (impact) return impact;
    }
    throw new Error("No contact");
  };
  const tall = fall(18), short = fall(140);
  assert.equal(tall.kind, "hard");
  assert.equal(short.kind, "soft");
  assert.ok(tall.speed > short.speed);
});

test("быстрый рывок сильнее растягивает ось штриха, чем медленное перемещение", () => {
  const path = [{ op: "M" as const, x: 62, y: 18 }, { op: "L" as const, x: 128, y: 98 }];
  const pull = (steps: number) => {
    const body = createSoftBody({ x: 62, y: 18, width: 132, height: 160 });
    const bound = bindSoftBodyPath(path, body);
    assert.ok(grabSoftBody(body, { x: 62, y: 18 }));
    for (let i = 0; i < steps; i++) {
      moveSoftBodyGrab(body, { x: 62 - 120 * (i + 1) / steps, y: 18 }, 1 / 120);
      stepSoftBody(body, 1 / 120, []);
    }
    const deformed = deformSoftBodyPath(bound, body);
    assert.equal(deformed[0].op, "M");
    assert.equal(deformed[1].op, "L");
    if (!("x" in deformed[0]) || !("x" in deformed[1])) throw new Error("Missing points");
    return Math.abs(deformed[0].x - deformed[1].x);
  };
  assert.ok(pull(10) > pull(80) + 50);
});

test("карточка вне траектории не перехватывает падение", () => {
  const body = createSoftBody({ x: 20, y: 0, width: 100, height: 100 });
  const card = [{ id: "card", left: 300, right: 450, top: 150 }];
  for (let i = 0; i < 240; i++) assert.equal(stepSoftBody(body, 1 / 120, card), undefined);
  assert.ok(body.nodes[body.nodes.length - 1].y > 150);
});

test("видимый контур опирается на пол и после резкого броска не проходит сквозь него", () => {
  const body = createSoftBody({ x: 62, y: 18, width: 132, height: 160 });
  setSoftBodyCollider(body, [
    { op: "M", x: 128, y: 21 },
    { op: "C", c1x: 68, c1y: 64, c2x: 54, c2y: 172, x: 125, y: 176 },
    { op: "C", c1x: 190, c1y: 182, c2x: 205, c2y: 74, x: 128, y: 21 },
    { op: "Z" }
  ], 2);
  body.worldBounds = { left: 0, right: 720 };
  const floor = [{ id: "floor", left: 0, right: 720, top: 355, solid: true }];
  for (let i = 0; i < 300; i++) stepSoftBody(body, 1 / 120, floor);
  assert.ok(body.sleeping);
  assert.ok(grabSoftBody(body, { x: 128, y: 280 }));
  for (let i = 0; i < 20; i++) {
    moveSoftBodyGrab(body, { x: 128 + i * 25, y: 280 - i * 9 }, 1 / 120);
    stepSoftBody(body, 1 / 120, floor);
  }
  releaseSoftBody(body);
  for (let i = 0; i < 800; i++) stepSoftBody(body, 1 / 120, floor);
  const points = softBodyColliderPoints(body);
  assert.ok(Math.abs(Math.max(...points.map(point => point.y)) - 353) < 0.5);
  assert.ok(Math.min(...points.map(point => point.x)) >= -0.5);
  assert.ok(Math.max(...points.map(point => point.x)) <= 720.5);
  const top = body.nodes[2], bottom = body.nodes[22];
  assert.ok(Math.abs(Math.atan2(top.x - bottom.x, bottom.y - top.y)) < 0.25);
  for (const triangle of body.triangles) {
    const a = body.nodes[triangle.a], b = body.nodes[triangle.b], c = body.nodes[triangle.c];
    const area = ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) * 0.5;
    assert.ok(area > 0);
  }
});

test("видимый контур не проходит сквозь верх и боковые грани карточки", () => {
  const card = { id: "card", left: 150, right: 320, top: 170, bottom: 280 };
  const floor = { id: "floor", left: 0, right: 720, top: 350, solid: true };
  const dropped = createSoftBody({ x: 185, y: 0, width: 100, height: 100 });
  for (let i = 0; i < 600; i++) stepSoftBody(dropped, 1 / 120, [card, floor]);
  assert.equal(dropped.supportSurfaceId, "card");
  assert.ok(Math.max(...softBodyColliderPoints(dropped).map(point => point.y)) <= card.top + 0.5);

  const pushed = createSoftBody({ x: 12, y: 185, width: 100, height: 100 });
  assert.ok(grabSoftBody(pushed, { x: 112, y: 235 }));
  for (let i = 0; i < 32; i++) {
    moveSoftBodyGrab(pushed, { x: 112 + i * 3.4, y: 235 }, 1 / 120);
    stepSoftBody(pushed, 1 / 120, [card, floor]);
  }
  releaseSoftBody(pushed);
  for (let i = 0; i < 300; i++) stepSoftBody(pushed, 1 / 120, [card, floor]);
  const inside = softBodyColliderPoints(pushed).filter(point =>
    point.x > card.left + 0.5 && point.x < card.right - 0.5 &&
    point.y > card.top + 0.5 && point.y < card.bottom - 0.5);
  assert.equal(inside.length, 0);

  const edge = createSoftBody({ x: 55, y: 0, width: 100, height: 100 });
  for (let i = 0; i < 600; i++) stepSoftBody(edge, 1 / 120, [card, floor]);
  assert.equal(edge.supportSurfaceId, "floor");
  assert.ok(Math.max(...softBodyColliderPoints(edge).map(point => point.y)) <= floor.top + 0.5);
});

test("в полёте угол сохраняется, а после посадки тело постепенно встаёт", () => {
  const body = createSoftBody({ x: 240, y: 20, width: 100, height: 110 });
  const center = { x: 290, y: 75 }, angle = 0.55;
  for (const node of body.nodes) {
    const x = node.x - center.x, y = node.y - center.y;
    node.x = node.previousX = center.x + x * Math.cos(angle) - y * Math.sin(angle);
    node.y = node.previousY = center.y + x * Math.sin(angle) + y * Math.cos(angle);
  }
  const currentAngle = () => {
    const top = body.nodes[2], bottom = body.nodes[22];
    return Math.atan2(top.x - bottom.x, bottom.y - top.y);
  };
  for (let i = 0; i < 28; i++) stepSoftBody(body, 1 / 120, []);
  assert.ok(Math.abs(currentAngle() - angle) < 0.08, `угол в полёте: ${currentAngle()}`);
  const floor = [{ id: "floor", left: 0, right: 720, top: 350, solid: true }];
  for (let i = 0; i < 550; i++) stepSoftBody(body, 1 / 120, floor);
  assert.ok(Math.abs(currentAngle()) < 0.1, `угол на полу: ${currentAngle()}`);
});

test("настройка мягкости меняет растяжение при одинаковом рывке", () => {
  const stretch = (softness: number) => {
    const body = createSoftBody({ x: 100, y: 80, width: 100, height: 110 });
    setSoftBodySoftness(body, softness);
    assert.ok(grabSoftBody(body, { x: 100, y: 80 }));
    for (let i = 0; i < 14; i++) {
      moveSoftBodyGrab(body, { x: 100 - (i + 1) * 7, y: 80 }, 1 / 120);
      stepSoftBody(body, 1 / 120, []);
    }
    return body.nodes[0].x - body.nodes[4].x;
  };
  assert.ok(Math.abs(stretch(1)) > Math.abs(stretch(0)) + 3);
});

test("после быстрого броска контур остаётся ниже верхней границы экрана", () => {
  const body = createSoftBody({ x: 100, y: 18, width: 100, height: 110 });
  body.worldBounds = { left: 0, right: 390, top: 0 };
  for (const node of body.nodes) node.previousY = node.y + 15;
  for (let frame = 0; frame < 120; frame++) {
    stepSoftBody(body, 1 / 120, []);
    const top = Math.min(...softBodyColliderPoints(body).map(point => point.y));
    assert.ok(top >= -0.5, `верхняя точка в кадре ${frame}: ${top}`);
  }
});

test("самая мягкая решётка после рывка сохраняет площадь ячеек и опору", () => {
  const body = createSoftBody({ x: 62, y: 18, width: 132, height: 160 });
  setSoftBodySoftness(body, 1);
  body.worldBounds = { left: 0, right: 720 };
  const floor = [{ id: "floor", left: 0, right: 720, top: 350, solid: true }];
  for (let i = 0; i < 250; i++) stepSoftBody(body, 1 / 120, floor);
  assert.ok(grabSoftBody(body, { x: 128, y: 250 }));
  for (let i = 0; i < 24; i++) {
    moveSoftBodyGrab(body, { x: 128 + i * 15, y: 250 - i * 6 }, 1 / 120);
    stepSoftBody(body, 1 / 120, floor);
  }
  releaseSoftBody(body);
  for (let i = 0; i < 600; i++) stepSoftBody(body, 1 / 120, floor);
  const bottom = Math.max(...softBodyColliderPoints(body).map(point => point.y));
  assert.ok(bottom <= 350.5, `нижняя точка: ${bottom}`);
  for (const triangle of body.triangles) {
    const a = body.nodes[triangle.a], b = body.nodes[triangle.b], c = body.nodes[triangle.c];
    assert.ok((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0);
  }
});
