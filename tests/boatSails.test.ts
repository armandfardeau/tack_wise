import { getMainsailGeometry } from '../src/utils/boatSails';

describe('mainsail geometry', () => {
  it('keeps the mast fixed and attaches the boom to the sail clew', () => {
    const geometry = getMainsailGeometry(35);

    expect(geometry.mastHead).toEqual({ x: 0, y: -52 });
    expect(geometry.mastFoot).toEqual({ x: 0, y: -12 });
    expect(geometry.boomPoints[0]).toEqual(geometry.mastFoot);
    expect(geometry.boomPoints[1]).toEqual(geometry.clew);
    expect(geometry.sailPath).toContain('Z');
  });

  it('mirrors the boom and leech across the centerline for opposite trim', () => {
    const portTrim = getMainsailGeometry(55);
    const starboardTrim = getMainsailGeometry(-55);

    expect(starboardTrim.clew.x).toBeCloseTo(-portTrim.clew.x);
    expect(starboardTrim.clew.y).toBeCloseTo(portTrim.clew.y);
    expect(starboardTrim.leechControl.x).toBeCloseTo(-portTrim.leechControl.x);
    expect(starboardTrim.leechControl.y).toBeCloseTo(portTrim.leechControl.y);
  });

  it('handles neutral trim without introducing a preferred tack', () => {
    const geometry = getMainsailGeometry(0);

    expect(geometry.clew.x).toBe(0);
    expect(geometry.leechControl.x).toBe(0);
    expect(geometry.sailAngle).toBe(0);
    expect(geometry.battenPaths).toHaveLength(2);
  });

  it('clamps extreme and non-finite input to safe renderable geometry', () => {
    expect(getMainsailGeometry(180).sailAngle).toBe(90);
    expect(getMainsailGeometry(-180).sailAngle).toBe(-90);
    expect(getMainsailGeometry(Number.NaN).sailAngle).toBe(0);

    for (const angle of [-180, -90, -45, 0, 45, 90, 180]) {
      const geometry = getMainsailGeometry(angle);
      const points = [
        geometry.mastHead,
        geometry.mastFoot,
        geometry.clew,
        geometry.leechControl,
        ...geometry.boomPoints,
      ];

      expect(points.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
      expect(geometry.battenPaths.every((path) => path.includes('M') && path.includes('L'))).toBe(true);
    }
  });

  it('keeps sail control points inside the existing boat content bounds', () => {
    for (const angle of [-90, -45, 0, 45, 90]) {
      const geometry = getMainsailGeometry(angle);
      const points = [geometry.mastHead, geometry.mastFoot, geometry.clew, geometry.leechControl];

      expect(Math.max(...points.map(({ x }) => Math.abs(x)))).toBeLessThanOrEqual(50);
      expect(Math.max(...points.map(({ y }) => Math.abs(y)))).toBeLessThanOrEqual(70);
    }
  });
});
