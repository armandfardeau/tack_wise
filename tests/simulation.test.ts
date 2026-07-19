import {
  calculateAutoSailAngle,
  canvasToWorldPosition,
  clampCanvasZoom,
  constrainCanvasPosition,
  getCommentHeight,
  getCanvasWorldBounds,
  getCanvasContentBounds,
  getGridSnap,
  getSnappedPosition,
  isWithinGridSnapRadius,
  worldToCanvasPosition,
} from '../src/utils/simulation';
import { GRID_SPACING, MOBILE_INITIAL_CANVAS_ZOOM } from '../src/constants';
import { initialFrames } from '../src/data/initialFrames';

describe('simulation utilities', () => {
  it('uses the denser 20px magnetic grid spacing', () => {
    expect(GRID_SPACING).toBe(20);
  });

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

  it('converts snap positions through the current canvas pan and zoom', () => {
    const canvasPosition = { x: 120, y: -40 };
    const canvasZoom = 2;
    const absolutePosition = { x: 200, y: 120 };
    const worldPosition = canvasToWorldPosition(absolutePosition, canvasPosition, canvasZoom);
    const snappedWorldPosition = getSnappedPosition(worldPosition);

    expect(worldPosition).toEqual({ x: 40, y: 80 });
    expect(snappedWorldPosition).toEqual({ x: 40, y: 80 });
    expect(worldToCanvasPosition(snappedWorldPosition, canvasPosition, canvasZoom)).toEqual(absolutePosition);
  });

  it('clamps zoom and keeps the canvas inside its stage bounds', () => {
    expect(clampCanvasZoom(0.1)).toBe(0.5);
    expect(clampCanvasZoom(5)).toBe(3);
    expect(constrainCanvasPosition({ x: 100, y: -500 }, 2, { width: 720, height: 500 })).toEqual({
      x: 0,
      y: -500,
    });
  });

  it('allows panning through the expanded canvas world at the default zoom', () => {
    const viewport = { width: 720, height: 500 };
    const worldBounds = getCanvasWorldBounds(viewport);

    expect(worldBounds).toEqual({ left: -1440, top: -1000, right: 2160, bottom: 1500 });
    expect(constrainCanvasPosition({ x: 2000, y: -2000 }, 1, viewport, worldBounds)).toEqual({
      x: 1440,
      y: -1000,
    });
  });

  it('supports a reduced initial zoom for narrow viewports', () => {
    expect(MOBILE_INITIAL_CANVAS_ZOOM).toBe(0.7);
  });

  it('includes visual extents when calculating the canvas content bounds', () => {
    expect(getCanvasContentBounds([initialFrames[0]])).toEqual({ maxX: 690, maxY: 705 });
  });

  it('uses default comment dimensions and returns empty bounds for empty scenarios', () => {
    expect(getCommentHeight({ text: 'Short note' })).toBe(64);
    expect(getCanvasContentBounds([])).toEqual({ maxX: 0, maxY: 0 });
    expect(getCanvasContentBounds([{
      boats: [],
      marks: [],
      comments: [{ id: 'comment', name: 'Note', text: 'Text', color: '#fff', x: 1, y: 2 }],
      images: [{ id: 'image', name: 'Image', src: 'data:image/png;base64,AA==', x: 5, y: 6, width: 10, height: 20 }],
    }])).toMatchObject({ maxX: expect.any(Number), maxY: expect.any(Number) });
  });

  it('normalizes negative wind-flow angles', () => {
    // WindHud owns the presentation calculation; this input keeps simulation
    // coverage focused on the corresponding negative-angle edge case.
    expect(calculateAutoSailAngle(-10, 0)).toBe(2);
  });

});
