import type { GroupNode, PathCommand, PencilStyle, ShapeNode } from "./model.js";

export type PencilGlyph = { advance: number; strokes: PathCommand[][] };
export type PencilAlphabet = {
  unitsPerEm: number;
  lineHeight?: number;
  glyphs: Record<string, PencilGlyph>;
};
export type LetteringOptions = {
  id: string;
  x?: number;
  y?: number;
  height: number;
  tracking?: number;
  start?: number;
  secondsPerStroke?: number;
  style: PencilStyle;
};

/** Lay out artist-authored centerline glyphs as independently revealable vector strokes. */
export function layoutPencilText(text: string, alphabet: PencilAlphabet, options: LetteringOptions): GroupNode {
  if (!(alphabet.unitsPerEm > 0 && options.height > 0)) throw new Error("Lettering units and height must be positive");
  const children: ShapeNode[] = [];
  let x = 0, y = 0, strokeIndex = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "\n") {
      x = 0;
      y += alphabet.unitsPerEm * (alphabet.lineHeight ?? 1.25);
      continue;
    }
    const glyph = alphabet.glyphs[character];
    if (!glyph) throw new Error(`Missing pencil glyph: ${character}`);
    for (let part = 0; part < glyph.strokes.length; part++) {
      const duration = options.secondsPerStroke ?? 0;
      const reveal = duration > 0 ? {
        start: (options.start ?? 0) + strokeIndex * duration,
        end: (options.start ?? 0) + (strokeIndex + 1) * duration
      } : undefined;
      children.push({
        type: "shape",
        id: `${options.id}/${index}/${part}`,
        transform: { x, y },
        path: glyph.strokes[part],
        style: options.style,
        reveal
      });
      strokeIndex++;
    }
    x += glyph.advance + (options.tracking ?? 0);
  }
  const scale = options.height / alphabet.unitsPerEm;
  return {
    type: "group", id: options.id,
    transform: { x: options.x ?? 0, y: options.y ?? 0, scaleX: scale, scaleY: scale },
    children
  };
}
