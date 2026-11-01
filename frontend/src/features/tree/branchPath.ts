// Geometry for parent→child edges drawn as tapering tree branches.
// SVG strokes have a constant width, so the branch is a filled outline built
// by offsetting a cubic Bézier curve on both sides with a shrinking width.

interface Point {
  x: number;
  y: number;
}

export interface Leaf {
  x: number;
  y: number;
  /** Rotation in degrees, already pointing away from the branch. */
  angle: number;
  scale: number;
}

export interface Branch {
  /** Filled outline of the tapering branch. */
  outline: string;
  /** Thin centre line used for a subtle bark highlight. */
  spine: string;
  leaves: Leaf[];
}

const SAMPLES = 24;
const START_WIDTH = 7;
const END_WIDTH = 2;

/** Cheap deterministic hash so each edge keeps the same leaves across renders. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildBranch(id: string, start: Point, end: Point): Branch {
  // Vertical-leaning S-curve: leave the parent straight down, arrive at the child straight down.
  const bend = Math.max(Math.abs(end.y - start.y) * 0.55, 30);
  const c1 = { x: start.x, y: start.y + bend };
  const c2 = { x: end.x, y: end.y - bend };

  const at = (t: number): Point => {
    const u = 1 - t;
    return {
      x: u * u * u * start.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x,
      y: u * u * u * start.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y,
    };
  };
  const tangent = (t: number): Point => {
    const u = 1 - t;
    const dx = 3 * u * u * (c1.x - start.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (end.x - c2.x);
    const dy = 3 * u * u * (c1.y - start.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (end.y - c2.y);
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  };

  const left: Point[] = [];
  const right: Point[] = [];
  const spine: Point[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const p = at(t);
    const d = tangent(t);
    // Ease the taper so the branch stays sturdy near the trunk.
    const half = (START_WIDTH + (END_WIDTH - START_WIDTH) * Math.pow(t, 0.7)) / 2;
    left.push({ x: p.x - d.y * half, y: p.y + d.x * half });
    right.push({ x: p.x + d.y * half, y: p.y - d.x * half });
    spine.push(p);
  }

  const fmt = (p: Point) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  const outline =
    `M ${fmt(left[0])} ` +
    left.slice(1).map((p) => `L ${fmt(p)}`).join(' ') +
    ` L ${fmt(right[right.length - 1])} ` +
    right.slice(0, -1).reverse().map((p) => `L ${fmt(p)}`).join(' ') +
    ' Z';
  const spinePath = `M ${fmt(spine[0])} ` + spine.slice(1, -2).map((p) => `L ${fmt(p)}`).join(' ');

  // One or two leaves per branch, on alternating sides, positions varied per edge.
  const seed = hash(id);
  const count = 1 + (seed % 2);
  const leaves: Leaf[] = [];
  for (let i = 0; i < count; i++) {
    const t = 0.35 + ((seed >> (i * 5)) % 30) / 100 + i * 0.12;
    const p = at(Math.min(t, 0.85));
    const d = tangent(Math.min(t, 0.85));
    const side = (seed >> (i + 3)) & 1 ? 1 : -1;
    const branchAngle = (Math.atan2(d.y, d.x) * 180) / Math.PI;
    leaves.push({
      x: p.x,
      y: p.y,
      angle: branchAngle + side * (55 + ((seed >> (i * 3)) % 20)),
      scale: 0.85 + ((seed >> (i * 7)) % 30) / 100,
    });
  }

  return { outline, spine: spinePath, leaves };
}
