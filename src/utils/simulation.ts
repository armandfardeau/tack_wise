import {
  GRID_SNAP_RADIUS,
  GRID_SPACING,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
} from '../constants';

export interface Position {
  x: number;
  y: number;
}

export interface GridSnap extends Position {
  distance: number;
}

export function calculateAutoSailAngle(heading: number, windAngle: number): number {
  let relativeWind = (windAngle - heading) % 360;
  if (relativeWind < 0) relativeWind += 360;

  const isStarboardTack = relativeWind > 180;
  const angleToWind = Math.min(relativeWind, 360 - relativeWind);

  let trimAngle = 0;
  if (angleToWind < 40) trimAngle = 2;
  else if (angleToWind < 50) trimAngle = 12;
  else if (angleToWind < 90) trimAngle = 35;
  else if (angleToWind < 135) trimAngle = 55;
  else trimAngle = 75;

  return isStarboardTack ? -trimAngle : trimAngle;
}

export function getGridSnap(position: Position): GridSnap {
  const x = Math.round(position.x / GRID_SPACING) * GRID_SPACING;
  const y = Math.round(position.y / GRID_SPACING) * GRID_SPACING;

  return {
    x,
    y,
    distance: Math.hypot(position.x - x, position.y - y),
  };
}

export function getSnappedPosition(position: Position): Position {
  const snap = getGridSnap(position);
  return snap.distance <= GRID_SNAP_RADIUS ? { x: snap.x, y: snap.y } : position;
}

export function isWithinGridSnapRadius(position: Position): boolean {
  return getGridSnap(position).distance <= GRID_SNAP_RADIUS;
}

export function clampCanvasZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_CANVAS_ZOOM), MAX_CANVAS_ZOOM);
}

export function constrainCanvasPosition(
  position: Position,
  zoom: number,
  stageSize: { width: number; height: number },
): Position {
  const horizontalRange = stageSize.width - stageSize.width * zoom;
  const verticalRange = stageSize.height - stageSize.height * zoom;

  return {
    x: Math.min(Math.max(position.x, Math.min(0, horizontalRange)), Math.max(0, horizontalRange)),
    y: Math.min(Math.max(position.y, Math.min(0, verticalRange)), Math.max(0, verticalRange)),
  };
}
