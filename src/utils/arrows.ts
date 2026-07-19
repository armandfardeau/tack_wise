export interface ArrowPoint {
  x: number;
  y: number;
}

/**
 * Returns a three-point path that bends to the left of the arrow's direction.
 * Konva needs an intermediate point before its tension can produce a curve.
 */
export function getCurvedArrowPoints(start: ArrowPoint, end: ArrowPoint): ArrowPoint[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const bend = Math.min(64, Math.max(36, length * 0.25));
  const normalX = length === 0 ? 0 : dy / length;
  const normalY = length === 0 ? -1 : -dx / length;

  return [
    { ...start },
    {
      x: (start.x + end.x) / 2 + normalX * bend,
      y: (start.y + end.y) / 2 + normalY * bend,
    },
    { ...end },
  ];
}

/**
 * Keeps older two-point curved arrows renderable by supplying their missing
 * control point. Existing multi-point paths are left untouched.
 */
export function ensureCurvedArrowControlPoint(points: ArrowPoint[]): ArrowPoint[] {
  if (points.length !== 2) return points;

  return getCurvedArrowPoints(points[0], points[1]);
}
