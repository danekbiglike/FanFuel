import assert from "node:assert/strict";
import test from "node:test";
import { cornerExtensionSamples, handworkCandidates, renderPencilContours, roundedGestureSplit } from "./contour.js";
import type { PencilContourBrush } from "./contour.js";
import type { GbrTip } from "./gbr.js";

function lineCoverages(
  size: number, widthCss: number, tip?: GbrTip, pressureProfile?: number[],
  taper?: "both" | "start" | "end" | "none", from = 0.25, to = 0.75,
  brushOverrides: Partial<PencilContourBrush> = {}, boilFrame?: number,
  grainSpace: "paper" | "stroke" = "paper", centerOnly = false, redrawFrame = 0
): number[] {
  const pixels = new Uint8ClampedArray(size * size * 4);
  const canvas = {
    width: 0, height: 0, style: { width: "", height: "" },
    getContext: () => ({
      createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: (value: { width: number; height: number; data: Uint8ClampedArray }, x: number, y: number) => {
        for (let row = 0; row < value.height; row++) {
          pixels.set(value.data.subarray(row * value.width * 4, (row + 1) * value.width * 4),
            ((y + row) * size + x) * 4);
        }
      }
    })
  } as unknown as HTMLCanvasElement;
  const brush: PencilContourBrush = { widthCss, pigment: [0, 0, 0], density: 1, grain: 0, tilt: 0, tip, ...brushOverrides };
  renderPencilContours(canvas, [{ id: "line", path: [
    { op: "M", x: 100, y: 256 }, { op: "L", x: 412, y: 256 }
  ], brush, pressureProfile, taper }], { sceneWidth: 512, sceneHeight: 512, cssWidth: size, cssHeight: size,
    dpr: 1, seed: 13, boilFrame, boilStrength: boilFrame === undefined ? 0 : 0.48,
    grainSpace, redrawFrame });
  const coverages: number[] = [];
  for (let x = Math.floor(size * from); x < Math.ceil(size * to); x++) {
    let coverage = 0;
    for (let y = centerOnly ? Math.floor(size / 2) : 0; y < (centerOnly ? Math.floor(size / 2) + 1 : size); y++) {
      coverage += pixels[(y * size + x) * 4 + 3] / 255;
    }
    coverages.push(coverage);
  }
  return coverages;
}

function lineWidth(size: number, widthCss: number, tip?: GbrTip): number {
  const coverages = lineCoverages(size, widthCss, tip);
  return coverages.reduce((sum, coverage) => sum + coverage, 0) / coverages.length;
}

test("ширина карандаша не масштабируется вместе с рисунком", () => {
  const widths = [180, 512, 1000].map(size => lineWidth(size, 4));
  assert.ok(widths.every(width => width >= 1.5 && width <= 5), `ширина: ${widths}`);
  assert.ok(Math.max(...widths) - Math.min(...widths) <= 1.5, `ширина: ${widths}`);
  assert.ok(lineWidth(512, 8) > lineWidth(512, 4));
});

test("сменный наконечник управляет контактом с бумагой", () => {
  const blank: GbrTip = {
    name: "blank", colorMode: "mask", width: 1, height: 1, spacingPercent: 25,
    pixels: new Uint8ClampedArray([255, 255, 255, 0])
  };
  assert.equal(lineWidth(180, 4, blank), 0);
  assert.ok(lineWidth(180, 4, { ...blank, pixels: new Uint8ClampedArray([255, 255, 255, 255]) }) > 0);
});

test("заданный нажим меняет тон плавно по длине штриха", () => {
  const coverages = lineCoverages(512, 5, undefined, [0.58, 0.85, 1.35, 1.04, 0.64]);
  const segment = (start: number, end: number) => {
    const values = coverages.slice(Math.floor(coverages.length * start), Math.floor(coverages.length * end));
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };
  const beginning = segment(0, 0.2), middle = segment(0.4, 0.6), end = segment(0.8, 1);
  assert.ok(middle > beginning * 1.3 && middle > end * 1.2,
    `покрытие: ${beginning.toFixed(2)}, ${middle.toFixed(2)}, ${end.toFixed(2)}`);
});

test("концы открытого штриха сужаются без провала на стыках", () => {
  const tapered = lineCoverages(512, 5, undefined, [1], "both", 0.2, 0.8);
  const joined = lineCoverages(512, 5, undefined, [1], "none", 0.2, 0.8);
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(average(tapered.slice(0, 10)) < average(joined.slice(0, 10)) * 0.82);
  assert.ok(average(tapered.slice(-10)) < average(joined.slice(-10)) * 0.82);
  const middle = Math.floor(tapered.length / 2);
  assert.ok(Math.abs(average(tapered.slice(middle - 5, middle + 5)) - average(joined.slice(middle - 5, middle + 5))) < 0.1);
});

test("настройки нажима и сужения меняют след независимо от геометрии", () => {
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const low = lineCoverages(512, 5, undefined, [0.65, 1.3, 0.65], "both", 0.45, 0.55, { pressureScale: 0.5 });
  const high = lineCoverages(512, 5, undefined, [0.65, 1.3, 0.65], "both", 0.45, 0.55, { pressureScale: 1.6 });
  assert.ok(average(high) > average(low) * 1.4);
  const narrow = lineCoverages(512, 5, undefined, [1], "start", 0.2, 0.25, { taperLengthCss: 28, taperMinimum: 0.1 });
  const blunt = lineCoverages(512, 5, undefined, [1], "start", 0.2, 0.25, { taperLengthCss: 0, taperMinimum: 1 });
  assert.ok(average(blunt) > average(narrow));
});

test("сильный нажим делает ядро подвижного графита заметно темнее", () => {
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const material = { density: 0.85, grain: 0.45 };
  const light = lineCoverages(180, 5.1, undefined, [0.65], "none", 0.3, 0.7,
    material, undefined, "stroke", true);
  const heavy = lineCoverages(180, 5.1, undefined, [1.35], "none", 0.3, 0.7,
    material, undefined, "stroke", true);
  assert.ok(average(heavy) > average(light) * 1.4,
    `ядро: ${average(light).toFixed(2)} → ${average(heavy).toFixed(2)}`);
  assert.ok(Math.max(...heavy) - Math.min(...heavy) > 0.08);
});

test("стык и повторный проход меняются между рисунками без потери линии", () => {
  const brush = { density: 0.85, grain: 0.45, handwork: 0.65 };
  const render = (frame: number) => lineCoverages(180, 5.1, undefined, [1], "none", 0.25, 0.75,
    brush, undefined, "stroke", true, frame);
  const first = render(1), again = render(1), second = render(2);
  const ordinary = lineCoverages(180, 5.1, undefined, [1], "none", 0.25, 0.75,
    { density: 0.85, grain: 0.45 }, undefined, "stroke", true, 1);
  assert.deepEqual(first, again);
  assert.notDeepEqual(first, second);
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(mean(first) > mean(ordinary) * 0.85);
});

test("стыки меняют место, сохраняют основной контур и локально добавляют второй след", () => {
  const ordinary = lineCoverages(180, 5.1, undefined, [1], "none", 0.15, 0.85,
    { density: 0.85, grain: 0 }, undefined, "stroke");
  const positions = new Set<number>();
  let weakest = 1;
  for (let frame = 1; frame <= 24; frame++) {
    const marked = lineCoverages(180, 5.1, undefined, [1], "none", 0.15, 0.85,
      { density: 0.85, grain: 0, handwork: 1, handworkSide: 1 }, undefined, "stroke", false, frame);
    const gains = marked.map((value, index) => value - ordinary[index]);
    marked.forEach((value, index) => {
      if (ordinary[index] > 0.05) weakest = Math.min(weakest, value / ordinary[index]);
    });
    const largest = Math.max(...gains);
    if (largest > 0.05) positions.add(Math.floor(gains.indexOf(largest) / 5));
  }
  assert.ok(positions.size >= 5, `места наложения в 24 кадрах: ${positions.size}`);
  assert.ok(weakest > 0.7, `минимальное сохранение контура: ${weakest}`);
});

test("поворот притягивает стык, а середина длинной прямой — повтор", () => {
  const samples = Array.from({ length: 201 }, (_, distance) => ({
    x: Math.min(distance, 100), y: Math.max(0, distance - 100), distance
  }));
  const candidates = handworkCandidates(samples, 200, 1, false, [1], 13, 1);
  const near = (distance: number) => candidates.reduce((best, candidate) =>
    Math.abs(candidate.distance - distance) < Math.abs(best.distance - distance) ? candidate : best);
  const straight = near(60), corner = near(100);
  assert.ok(corner.joinWeight > straight.joinWeight * 2);
  assert.ok(straight.retraceWeight > corner.retraceWeight * 5);
});

test("на округлом замкнутом контуре стык тяготеет к нижней дуге, а на прямоугольнике нет", () => {
  const ellipse = Array.from({ length: 241 }, (_, index) => ({
    x: 50 + Math.cos(index / 240 * Math.PI * 2) * 28,
    y: 50 + Math.sin(index / 240 * Math.PI * 2) * 35,
    distance: 0
  }));
  for (let i = 1; i < ellipse.length; i++) ellipse[i].distance = ellipse[i - 1].distance
    + Math.hypot(ellipse[i].x - ellipse[i - 1].x, ellipse[i].y - ellipse[i - 1].y);
  const rounded = handworkCandidates(ellipse, ellipse.at(-1)!.distance,
    ellipse.at(-1)!.distance / 240, true, [1], 13, 1);
  const nearest = (candidates: typeof rounded, x: number, y: number) => candidates.reduce((best, candidate) =>
    Math.hypot(ellipse[candidate.index].x - x, ellipse[candidate.index].y - y)
      < Math.hypot(ellipse[best.index].x - x, ellipse[best.index].y - y) ? candidate : best);
  const bottom = nearest(rounded, 50, 85), top = nearest(rounded, 50, 15);
  assert.ok(bottom.joinWeight > top.joinWeight * 3);
  const allWeight = rounded.reduce((total, candidate) => total + candidate.joinWeight, 0);
  const lowerWeight = rounded.filter(candidate => ellipse[candidate.index].y > 72.75)
    .reduce((total, candidate) => total + candidate.joinWeight, 0);
  assert.ok(lowerWeight / allWeight > 0.7);

  const square = Array.from({ length: 161 }, (_, index) => {
    if (index === 160) return { x: 0, y: 0, distance: index };
    const side = Math.floor(index / 40), offset = index % 40;
    const positions = [[offset, 0], [40, offset], [40 - offset, 40], [0, 40 - offset]];
    const [x, y] = positions[side];
    return { x, y, distance: index };
  });
  const angular = handworkCandidates(square, 160, 1, true, [1], 13, 1);
  const midTop = angular.reduce((best, candidate) => Math.abs(candidate.index - 20) < Math.abs(best.index - 20)
    ? candidate : best);
  const midBottom = angular.reduce((best, candidate) => Math.abs(candidate.index - 100) < Math.abs(best.index - 100)
    ? candidate : best);
  assert.ok(Math.abs(midTop.joinWeight - midBottom.joinWeight) < 0.01);
});

test("округлый стык варьирует перекрытие без выступа за исходный силуэт", () => {
  const size = 128;
  const render = (handwork: number, redrawFrame = 0, boilFrame = 0) => {
    const pixels = new Uint8ClampedArray(size * size * 4);
    const canvas = { width: 0, height: 0, style: { width: "", height: "" }, getContext: () => ({
      createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: (image: { width: number; height: number; data: Uint8ClampedArray }, x: number, y: number) => {
        for (let row = 0; row < image.height; row++) pixels.set(
          image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4),
          ((y + row) * size + x) * 4);
      }
    }) } as unknown as HTMLCanvasElement;
    renderPencilContours(canvas, [{ id: "round", path: [
      { op: "M", x: 64, y: 22 },
      { op: "C", c1x: 88, c1y: 22, c2x: 97, c2y: 42, x: 97, y: 64 },
      { op: "C", c1x: 97, c1y: 86, c2x: 88, c2y: 106, x: 64, y: 106 },
      { op: "C", c1x: 40, c1y: 106, c2x: 31, c2y: 86, x: 31, y: 64 },
      { op: "C", c1x: 31, c1y: 42, c2x: 40, c2y: 22, x: 64, y: 22 }, { op: "Z" }
    ], brush: { widthCss: 4, pigment: [0, 0, 0], density: 0.85, grain: 0.35, tilt: 0, handwork } }],
    { sceneWidth: size, sceneHeight: size, cssWidth: size, cssHeight: size, dpr: 1, seed: 13,
      grainSpace: "paper", redrawFrame, boilFrame });
    return pixels;
  };
  const plain = render(0);
  const frames = Array.from({ length: 12 }, (_, frame) => render(0.65, frame));
  assert.notDeepEqual(render(0.65, 0, 0), render(0.65, 11, 0),
    "округлая петля должна немного перерисовываться на каждом новом кадре");
  const scores = frames.map(joined => {
    let gained = 0, lost = 0, strongest = 0, protrusions = 0;
    for (let y = 82; y < 116; y++) for (let x = 20; x < 108; x++) {
      const index = (y * size + x) * 4 + 3;
      const difference = joined[index] - plain[index];
      gained += Math.max(0, difference);
      lost += Math.max(0, -difference);
      strongest = Math.max(strongest, difference);
      if (y >= 110 && plain[index] < 4 && joined[index] > 20) protrusions++;
    }
    return { gained, lost, strongest, protrusions };
  });
  assert.ok(scores.some(score => score.gained > 120 && score.strongest > 25),
    `стык должен быть виден хотя бы в части кадров: ${JSON.stringify(scores)}`);
  assert.ok(scores.some(score => score.lost > 100),
    `исходная линия уступает место двум концам: ${JSON.stringify(scores)}`);
  assert.ok(scores.every(score => score.protrusions < 5),
    `снаружи контура не должен появляться «прыщик»: ${JSON.stringify(scores)}`);
});

test("в округлом стыке два конца коротко пересекаются без потери линии", () => {
  const mark = { position: 50, before: 5, after: 5, shift: 3, strength: 0.9 };
  const left = roundedGestureSplit(48, 100, mark, 1)!;
  const right = roundedGestureSplit(52, 100, mark, 1)!;
  assert.ok(left.firstShift < 0 && left.secondShift > 0);
  assert.ok(right.firstShift > 0 && right.secondShift < 0);
  for (let distance = -4.9; distance <= 4.9; distance += 0.1) {
    const split = roundedGestureSplit(50 + distance, 100, mark, 1);
    assert.ok(split);
    assert.ok(split.left + split.right >= 1);
    assert.ok(split.left + split.right <= 1.301);
  }
});

test("перерисовка округлого глаза сохраняет овальную форму", () => {
  const size = 128;
  const rx = 35, ry = 45, cx = 64, cy = 64;
  const k = 0.5522848;
  const path = [
    { op: "M" as const, x: cx, y: cy - ry },
    { op: "C" as const, c1x: cx + rx * k, c1y: cy - ry, c2x: cx + rx,
      c2y: cy - ry * k, x: cx + rx, y: cy },
    { op: "C" as const, c1x: cx + rx, c1y: cy + ry * k, c2x: cx + rx * k,
      c2y: cy + ry, x: cx, y: cy + ry },
    { op: "C" as const, c1x: cx - rx * k, c1y: cy + ry, c2x: cx - rx,
      c2y: cy + ry * k, x: cx - rx, y: cy },
    { op: "C" as const, c1x: cx - rx, c1y: cy - ry * k, c2x: cx - rx * k,
      c2y: cy - ry, x: cx, y: cy - ry },
    { op: "Z" as const }
  ];
  for (let frame = 0; frame < 24; frame++) {
    let maximumDrift = 0;
    const canvas = { width: 0, height: 0, style: { width: "", height: "" }, getContext: () => ({
      createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: (image: { width: number; height: number; data: Uint8ClampedArray }, left: number, top: number) => {
        for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
          if (image.data[(y * image.width + x) * 4 + 3] < 50) continue;
          const px = left + x - cx, py = top + y - cy;
          const radius = Math.hypot(px / rx, py / ry);
          maximumDrift = Math.max(maximumDrift, Math.abs(radius - 1) * Math.min(rx, ry));
        }
      }
    }) } as unknown as HTMLCanvasElement;
    renderPencilContours(canvas, [{ id: "eye", path, brush: { widthCss: 4, pigment: [0, 0, 0],
      density: 0.85, grain: 0.35, tilt: 0, handwork: 0.65 } }],
    { sceneWidth: size, sceneHeight: size, cssWidth: size, cssHeight: size, dpr: 1,
      seed: 13, grainSpace: "stroke", redrawFrame: frame, boilFrame: Math.floor(frame / 12),
      redrawStrengthCss: 1.2 });
    assert.ok(maximumDrift < 5.5, `кадр ${frame}: край глаза ушёл на ${maximumDrift.toFixed(2)} px`);
  }
});

test("замкнутый острый угол получает короткий выход одного или двух жестов за вершину", () => {
  const points = [
    ...Array.from({ length: 21 }, (_, i) => ({ x: -i, y: i })),
    ...Array.from({ length: 40 }, (_, i) => ({ x: -19 + i, y: 20 })),
    ...Array.from({ length: 20 }, (_, i) => ({ x: 20 - (i + 1), y: 20 - (i + 1) }))
  ];
  const samples = points.map((point, index) => ({ ...point, distance: index * 1.4 }));
  const total = samples[samples.length - 1].distance;
  const candidates = handworkCandidates(samples, total, 1.4, true, [1], 13, 1);
  assert.ok(candidates.some(candidate => candidate.index === 0 && candidate.bend > 0.62));
  const variants = Array.from({ length: 40 }, (_, frame) =>
    cornerExtensionSamples(samples, candidates, total, 1.4, true, frame + 1, 1, 1));
  assert.ok(variants.some(variant => variant.some(sample => sample.y < -0.5)));
  assert.ok(variants.some(variant => variant.some(sample => sample.y < -0.5 && sample.x < -0.5)
    && variant.some(sample => sample.y < -0.5 && sample.x > 0.5)));
});

test("замкнутый контур рендерится на кадрах с двумя угловыми выходами", () => {
  const canvas = {
    width: 0, height: 0, style: { width: "", height: "" },
    getContext: () => ({
      createImageData: (width: number, height: number) => ({
        width, height, data: new Uint8ClampedArray(width * height * 4)
      }),
      putImageData: () => undefined
    })
  } as unknown as HTMLCanvasElement;
  for (let frame = 0; frame < 24; frame++) {
    assert.doesNotThrow(() => renderPencilContours(canvas, [{
      id: "sharp-closed", path: [
        { op: "M", x: 64, y: 18 }, { op: "L", x: 25, y: 95 },
        { op: "L", x: 103, y: 95 }, { op: "Z" }
      ], brush: { widthCss: 4, pigment: [0, 0, 0], density: 1, grain: 0.25,
        tilt: 0, handwork: 1 }
    }], { sceneWidth: 128, sceneHeight: 128, cssWidth: 128, cssHeight: 128,
      grainSpace: "stroke", redrawFrame: frame }));
  }
});

test("зерно в покое меняется по кадрам, но один кадр воспроизводится точно", () => {
  const first = lineCoverages(180, 5, undefined, [1], "none", 0.25, 0.75, { grain: 0.6 }, 12);
  const again = lineCoverages(180, 5, undefined, [1], "none", 0.25, 0.75, { grain: 0.6 }, 12);
  const next = lineCoverages(180, 5, undefined, [1], "none", 0.25, 0.75, { grain: 0.6 }, 13);
  assert.deepEqual(first, again);
  assert.notDeepEqual(first, next);
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(Math.abs(mean(first) - mean(next)) < 0.5);
});

test("зерно в координатах штриха переезжает вместе с линией между перерисовками", () => {
  const size = 128;
  const render = (y: number, boilFrame: number) => {
    const pixels = new Uint8ClampedArray(size * size * 4);
    const canvas = {
      width: 0, height: 0, style: { width: "", height: "" },
      getContext: () => ({
        createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: (value: { width: number; height: number; data: Uint8ClampedArray }, x: number, top: number) => {
          for (let row = 0; row < value.height; row++) pixels.set(
            value.data.subarray(row * value.width * 4, (row + 1) * value.width * 4), ((top + row) * size + x) * 4);
        }
      })
    } as unknown as HTMLCanvasElement;
    renderPencilContours(canvas, [{ id: "moving-line", materialLengthCss: 80, path: [
      { op: "M", x: 20, y }, { op: "L", x: 100, y }
    ], brush: { widthCss: 5.1, pigment: [24, 24, 22], density: 0.85, grain: 0.45, tilt: 0.08 } }], {
      sceneWidth: size, sceneHeight: size, cssWidth: size, cssHeight: size, dpr: 1,
      seed: 73571, boilFrame, boilStrength: 0.75, grainSpace: "stroke"
    });
    return pixels;
  };
  const first = render(42, 7), moved = render(50, 7), redrawn = render(50, 8);
  for (let y = 0; y < size - 8; y++) for (let x = 0; x < size; x++) {
    assert.equal(first[(y * size + x) * 4 + 3], moved[((y + 8) * size + x) * 4 + 3]);
  }
  assert.notDeepEqual(moved, redrawn);
  let occupied = 0, changed = 0;
  for (let index = 3; index < moved.length; index += 4) {
    if (moved[index] > 0 || redrawn[index] > 0) occupied++;
    if (Math.abs(moved[index] - redrawn[index]) >= 16) changed++;
  }
  assert.ok(changed > occupied * 0.15, `зерно почти не меняется: ${changed}/${occupied}`);
});

test("каждый новый рисунок слегка меняет ось, сохраняя исходный штрих", () => {
  const size = 128;
  const render = (redrawFrame: number) => {
    const pixels = new Uint8ClampedArray(size * size * 4);
    const canvas = {
      width: 0, height: 0, style: { width: "", height: "" },
      getContext: () => ({
        createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: (value: { width: number; height: number; data: Uint8ClampedArray }, x: number, top: number) => {
          for (let row = 0; row < value.height; row++) pixels.set(
            value.data.subarray(row * value.width * 4, (row + 1) * value.width * 4), ((top + row) * size + x) * 4);
        }
      })
    } as unknown as HTMLCanvasElement;
    renderPencilContours(canvas, [{ id: "redraw-line", materialLengthCss: 88, path: [
      { op: "M", x: 20, y: 64 }, { op: "L", x: 108, y: 64 }
    ], brush: { widthCss: 5, pigment: [24, 24, 22], density: 0.85, grain: 0.45, tilt: 0.08 }, taper: "none" }], {
      sceneWidth: size, sceneHeight: size, cssWidth: size, cssHeight: size, dpr: 1,
      seed: 73571, grainSpace: "stroke", redrawFrame, redrawStrengthCss: 0.72
    });
    return pixels;
  };
  const first = render(1), again = render(1), next = render(2);
  assert.deepEqual(first, again);
  assert.notDeepEqual(first, next);
  for (const pixels of [first, next]) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (pixels[(y * size + x) * 4 + 3] > 0) assert.ok(y >= 56 && y <= 72, `штрих ушёл от оси: ${y}`);
  }
});
