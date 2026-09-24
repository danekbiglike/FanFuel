export type Point = { x: number; y: number };

export type PathCommand =
  | { op: "M" | "L"; x: number; y: number }
  | { op: "Q"; cx: number; cy: number; x: number; y: number }
  | { op: "C"; c1x: number; c1y: number; c2x: number; c2y: number; x: number; y: number }
  | { op: "Z" };

export type PencilStyle = {
  /** Base pigment. A fill can be combined with a second, clipped hatch layer. */
  fill?: string;
  stroke?: string;
  width?: number;
  opacity?: number;
  grain?: number;
  hatch?: { color: string; spacing: number; angle: number; width?: number; opacity?: number };
  /** Held strokes keep the same marks across frames; boil changes only the mark pattern. */
  temporal?: "held" | "boil";
};

export type Transform = { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number };
export type Keyframe = { at: number; value: Transform };
export type Motion = { keys: Keyframe[]; loop?: boolean };
export type Reveal = { start: number; end: number };

type BaseNode = { id: string; transform?: Transform; motion?: Motion };
export type ShapeNode = BaseNode & {
  type: "shape";
  path: PathCommand[];
  style: PencilStyle;
  /** Draw-on interval in seconds. Pigment stays fixed while the path is revealed. */
  reveal?: Reveal;
};
/** Nested groups are the vector bone hierarchy; child coordinates are local to the parent. */
export type GroupNode = BaseNode & { type: "group"; children: SceneNode[] };
/** Each frame remains vector geometry and is rerendered at the current display scale. */
export type SpriteNode = BaseNode & {
  type: "sprite";
  frames: SceneNode[][];
  fps: number;
  loop?: boolean;
};
export type SceneNode = ShapeNode | GroupNode | SpriteNode;

export type PencilScene = {
  width: number;
  height: number;
  seed: number;
  boilFps?: number;
  nodes: SceneNode[];
};
