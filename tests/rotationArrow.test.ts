import {
  getRotationArrowGeometry,
  ROTATION_ARROW_ARROWHEAD_RADIUS,
  ROTATION_ARROW_RADIUS,
} from '../src/utils/rotationArrow';

describe('rotation arrow geometry', () => {
  it('mirrors the arrowhead and arc direction when reversed', () => {
    const clockwise = getRotationArrowGeometry('clockwise');
    const counterclockwise = getRotationArrowGeometry('counterclockwise');

    expect(clockwise.arcClockwise).toBe(false);
    expect(counterclockwise.arcClockwise).toBe(true);
    expect(clockwise.arcAngle).toBe(270);
    expect(counterclockwise.arcAngle).toBe(90);
    expect(clockwise.arrowX).toBeCloseTo(-counterclockwise.arrowX);
    expect(clockwise.arrowY).toBeCloseTo(-counterclockwise.arrowY);
    expect(Math.hypot(clockwise.arrowX, clockwise.arrowY)).toBeCloseTo(ROTATION_ARROW_ARROWHEAD_RADIUS);
    expect(Math.hypot(counterclockwise.arrowX, counterclockwise.arrowY)).toBeCloseTo(ROTATION_ARROW_ARROWHEAD_RADIUS);
    expect(ROTATION_ARROW_ARROWHEAD_RADIUS).toBeLessThan(ROTATION_ARROW_RADIUS);
    expect(clockwise.arrowRotation).not.toBe(counterclockwise.arrowRotation);
  });

  it('defaults to counterclockwise geometry', () => {
    expect(getRotationArrowGeometry()).toEqual(getRotationArrowGeometry('counterclockwise'));
  });
});
