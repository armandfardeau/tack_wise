import {
  calculateAutoSailAngle,
  clampCanvasZoom,
  constrainCanvasPosition,
  getCanvasContentBounds,
  getGridSnap,
  getSnappedPosition,
  isWithinGridSnapRadius,
} from '../src/utils/simulation';
import { MOBILE_INITIAL_CANVAS_ZOOM } from '../src/constants';
import { initialFrames } from '../src/data/initialFrames';

describe('simulation utilities', () => {
  it('calculates an auto-trimmed sail angle from heading and wind', () => {
    expect(calculateAutoSailAngle(45, 0)).toBe(-12);
    expect(calculateAutoSailAngle(315, 0)).toBe(12);
    expect(calculateAutoSailAngle(180, 0)).toBe(75);
  });

  it('snaps positions only when they are close enough to a grid intersection', () => {
    expect(getGridSnap({ x: 38, y: 82 })).toEqual({ x: 40, y: 80, distance: Math.hypot(2, 2) });
    expect(isWithinGridSnapRadius({ x: 38, y: 82 })).toBe(true);
    expect(getSnappedPosition({ x: 38, y: 82 })).toEqual({ x: 40, y: 80 });
    expect(isWithinGridSnapRadius({ x: 27, y: 27 })).toBe(false);
    expect(getSnappedPosition({ x: 27, y: 27 })).toEqual({ x: 27, y: 27 });
  });

  it('clamps zoom and keeps the canvas inside its stage bounds', () => {
    expect(clampCanvasZoom(0.1)).toBe(0.5);
    expect(clampCanvasZoom(5)).toBe(3);
    expect(constrainCanvasPosition({ x: 100, y: -500 }, 2, { width: 720, height: 500 })).toEqual({
      x: 0,
      y: -500,
    });
  });

  it('supports a reduced initial zoom for narrow viewports', () => {
    expect(MOBILE_INITIAL_CANVAS_ZOOM).toBe(0.7);
  });

  it('includes visual extents when calculating the canvas content bounds', () => {
    expect(getCanvasContentBounds([initialFrames[0]])).toEqual({ maxX: 490, maxY: 440 });
  });
});
