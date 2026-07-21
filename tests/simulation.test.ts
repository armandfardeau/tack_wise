import {
  calculateAutoSailAngle,
  canvasToWorldPosition,
  clampCanvasZoom,
  constrainCanvasPosition,
  getBoatManeuver,
  getCommentHeight,
  getCanvasWorldBounds,
  getCanvasContentBounds,
  getHeadingVector,
  getGridSnap,
  getHeadingTowardPosition,
  getShortestHeadingDelta,
  getSnappedPosition,
  getUnanimatableTransitionIndices,
  interpolateBoatManeuver,
  isWithinGridSnapRadius,
  worldToCanvasPosition,
} from '../src/utils/simulation';
import type { Boat } from '../src/types';
import { GRID_SPACING, MOBILE_INITIAL_CANVAS_ZOOM } from '../src/constants';
import { initialFrames } from '../src/data/initialFrames';

describe('simulation utilities', () => {
  const boat = (changes: Partial<Boat> = {}): Boat => ({
    id: 'boat-1',
    name: 'Boat',
    color: '#fff',
    x: 0,
    y: 0,
    heading: 90,
    sailAngle: 0,
    ...changes,
  });

  it('converts compass headings to canvas direction vectors', () => {
    expect(getHeadingVector(0)).toEqual({ x: 0, y: -1 });
    expect(getHeadingVector(90).x).toBeCloseTo(1);
    expect(getHeadingVector(90).y).toBeCloseTo(0);
    expect(getHeadingVector(180).x).toBeCloseTo(0);
    expect(getHeadingVector(180).y).toBeCloseTo(1);
  });

  it('calculates a compass heading toward a canvas position', () => {
    expect(getHeadingTowardPosition({ x: 0, y: 0 }, { x: 10, y: -10 })).toBeCloseTo(45);
    expect(getHeadingTowardPosition({ x: 0, y: 0 }, { x: 10, y: 10 })).toBeCloseTo(135);
  });

  it('finds a forward two-leg route and its intersection', () => {
    const result = getBoatManeuver(
      boat({ x: 0, y: 0, heading: 90 }),
      boat({ x: 10, y: -10, heading: 0 }),
    );

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.maneuver.intersection.x).toBeCloseTo(10);
    expect(result.maneuver.intersection.y).toBeCloseTo(0);
    expect(result.maneuver.firstLegDistance).toBeCloseTo(10);
    expect(result.maneuver.secondLegDistance).toBeCloseTo(10);
    expect(result.maneuver.turnDelta).toBe(-90);
  });

  it('rejects an intersection that is behind the destination heading', () => {
    expect(getBoatManeuver(
      boat({ x: 0, y: 0, heading: 90 }),
      boat({ x: 10, y: 10, heading: 0 }),
    )).toEqual({ valid: false, reason: 'intersection-behind-end' });
  });

  it('identifies transitions containing an invalid matching boat manoeuvre', () => {
    const startBoat = boat({ id: 'boat-1', x: 0, y: 0, heading: 90 });
    const validDestinationBoat = boat({ id: 'boat-1', x: 10, y: -10, heading: 0 });
    const invalidDestinationBoat = boat({ id: 'boat-1', x: 10, y: 10, heading: 0 });

    expect(getUnanimatableTransitionIndices([
      { boats: [startBoat] },
      { boats: [invalidDestinationBoat] },
      { boats: [validDestinationBoat] },
    ])).toEqual([0]);
  });

  it('handles parallel courses and zero-distance turns', () => {
    expect(getBoatManeuver(
      boat({ heading: 90 }),
      boat({ x: 10, heading: 90 }),
    )).toEqual({
      valid: true,
      maneuver: {
        intersection: { x: 10, y: 0 },
        firstLegDistance: 10,
        secondLegDistance: 0,
        turnDelta: 0,
      },
    });

    expect(getBoatManeuver(
      boat({ heading: 90 }),
      boat({ heading: 0 }),
    )).toEqual({
      valid: true,
      maneuver: {
        intersection: { x: 0, y: 0 },
        firstLegDistance: 0,
        secondLegDistance: 0,
        turnDelta: -90,
      },
    });
  });

  it('interpolates travel, turn-in-place, and the destination leg', () => {
    const start = boat({ heading: 90 });
    const end = boat({ x: 10, y: -10, heading: 0 });

    expect(interpolateBoatManeuver(start, end, 0.2).x).toBeCloseTo(5);
    expect(interpolateBoatManeuver(start, end, 0.2).y).toBeCloseTo(0);
    expect(interpolateBoatManeuver(start, end, 0.2).heading).toBe(90);
    expect(interpolateBoatManeuver(start, end, 0.5).x).toBeCloseTo(10);
    expect(interpolateBoatManeuver(start, end, 0.5).y).toBeCloseTo(0);
    expect(interpolateBoatManeuver(start, end, 0.5).heading).toBeCloseTo(45);
    expect(interpolateBoatManeuver(start, end, 0.8).x).toBeCloseTo(10);
    expect(interpolateBoatManeuver(start, end, 0.8).y).toBeCloseTo(-5);
    expect(interpolateBoatManeuver(start, end, 0.8).heading).toBe(0);
    expect(interpolateBoatManeuver(start, end, 1)).toEqual(end);
  });

  it('uses the shortest heading rotation across zero degrees', () => {
    expect(getShortestHeadingDelta(350, 10)).toBe(20);
    expect(interpolateBoatManeuver(
      boat({ heading: 350 }),
      boat({ heading: 10 }),
      0.5,
    ).heading).toBe(0);
  });

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
    expect(getCanvasContentBounds([initialFrames[0]])).toEqual({ maxX: 770, maxY: 750 });
  });

  it('includes an enabled mark-room zone in the content bounds', () => {
    expect(getCanvasContentBounds([{
      boats: [],
      marks: [{
        id: 'mark',
        name: 'Windward mark',
        color: '#ef4444',
        x: 100,
        y: 120,
        shape: 'triangle',
        size: 30,
        showZone: true,
        zoneRadius: 4,
      }],
    }])).toEqual({ maxX: 320, maxY: 340 });
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
