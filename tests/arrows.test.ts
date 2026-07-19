import { ensureCurvedArrowControlPoint, getCurvedArrowPoints } from '../src/utils/arrows';

describe('curved tactical arrows', () => {
  it('creates a left-bending control point for a diagonal arrow', () => {
    const points = getCurvedArrowPoints({ x: 0, y: 0 }, { x: 100, y: 100 });

    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[2]).toEqual({ x: 100, y: 100 });
    expect(points[1].x).toBeGreaterThan(50);
    expect(points[1].y).toBeLessThan(50);
  });

  it('uses a stable normal for zero-length arrows and preserves existing paths', () => {
    expect(getCurvedArrowPoints({ x: 10, y: 10 }, { x: 10, y: 10 })).toEqual([
      { x: 10, y: 10 },
      { x: 10, y: -26 },
      { x: 10, y: 10 },
    ]);

    const existing = [{ x: 0, y: 0 }, { x: 20, y: 10 }, { x: 40, y: 0 }];
    expect(ensureCurvedArrowControlPoint(existing)).toBe(existing);
  });

  it('adds a control point to legacy two-point curved arrows', () => {
    const points = ensureCurvedArrowControlPoint([{ x: 0, y: 0 }, { x: 200, y: 0 }]);

    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[2]).toEqual({ x: 200, y: 0 });
  });
});
