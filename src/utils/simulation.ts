import {
  CANVAS_PAN_MARGIN,
  GRID_SNAP_RADIUS,
  GRID_SPACING,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
} from '../constants';
import type { Boat, Frame, Mark } from '../types';

export interface Position {
  x: number;
  y: number;
}

export interface CanvasContentBounds {
  maxX: number;
  maxY: number;
}

export interface CanvasWorldBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function interpolateNumber(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function interpolateAngle(start: number, end: number, progress: number) {
  const delta = ((end - start + 540) % 360) - 180;
  return (start + delta * progress + 360) % 360;
}

function interpolateBoat(start: Boat, end: Boat | undefined, progress: number): Boat {
  if (!end) return { ...start };
  return {
    ...start,
    x: interpolateNumber(start.x, end.x, progress),
    y: interpolateNumber(start.y, end.y, progress),
    heading: interpolateAngle(start.heading, end.heading, progress),
    sailAngle: interpolateNumber(start.sailAngle, end.sailAngle, progress),
  };
}

function interpolateMark(start: Mark, end: Mark | undefined, progress: number): Mark {
  if (!end) return { ...start };
  return {
    ...start,
    x: interpolateNumber(start.x, end.x, progress),
    y: interpolateNumber(start.y, end.y, progress),
  };
}

export function interpolateFrame(start: Frame, end: Frame | undefined, progress: number): Frame {
  if (!end || progress <= 0) return start;
  if (progress >= 1) return end;

  const endBoats = new Map(end.boats.map((boat) => [boat.id, boat]));
  const endMarks = new Map(end.marks.map((mark) => [mark.id, mark]));

  return {
    ...start,
    windAngle: interpolateAngle(start.windAngle, end.windAngle, progress),
    windSpeed: interpolateNumber(start.windSpeed, end.windSpeed, progress),
    boats: start.boats.map((boat) => interpolateBoat(boat, endBoats.get(boat.id), progress)),
    marks: start.marks.map((mark) => interpolateMark(mark, endMarks.get(mark.id), progress)),
  };
}

export function getCanvasWorldBounds(viewportSize: { width: number; height: number }): CanvasWorldBounds {
  const horizontalMargin = viewportSize.width * CANVAS_PAN_MARGIN;
  const verticalMargin = viewportSize.height * CANVAS_PAN_MARGIN;

  return {
    left: -horizontalMargin,
    top: -verticalMargin,
    right: viewportSize.width + horizontalMargin,
    bottom: viewportSize.height + verticalMargin,
  };
}

export function getCanvasContentBounds(frames: Array<Pick<Frame, 'boats' | 'marks' | 'arrows' | 'comments' | 'images'>>): CanvasContentBounds {
  return frames.reduce<CanvasContentBounds>((bounds, frame) => {
    frame.boats.forEach((boat) => {
      const horizontalExtent = boat.showHeadingLine ? 360 : 50;
      const verticalExtent = boat.showHeadingLine ? 360 : 70;
      bounds.maxX = Math.max(bounds.maxX, boat.x + horizontalExtent);
      bounds.maxY = Math.max(bounds.maxY, boat.y + verticalExtent);
    });

    frame.marks.forEach((mark) => {
      bounds.maxX = Math.max(bounds.maxX, mark.x + 40);
      bounds.maxY = Math.max(bounds.maxY, mark.y + 40);
    });

    frame.arrows?.forEach((arrow) => {
      arrow.points.forEach((point) => {
        bounds.maxX = Math.max(bounds.maxX, point.x + 24);
        bounds.maxY = Math.max(bounds.maxY, point.y + 24);
      });
    });

    frame.comments?.forEach((comment) => {
      bounds.maxX = Math.max(bounds.maxX, comment.x + (comment.width ?? 180));
      bounds.maxY = Math.max(bounds.maxY, comment.y + 100);
    });

    frame.images?.forEach((image) => {
      bounds.maxX = Math.max(bounds.maxX, image.x + image.width);
      bounds.maxY = Math.max(bounds.maxY, image.y + image.height);
    });

    return bounds;
  }, { maxX: 0, maxY: 0 });
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
  worldBounds: CanvasWorldBounds = {
    left: 0,
    top: 0,
    right: stageSize.width,
    bottom: stageSize.height,
  },
): Position {
  const minX = stageSize.width - worldBounds.right * zoom;
  const maxX = -worldBounds.left * zoom || 0;
  const minY = stageSize.height - worldBounds.bottom * zoom;
  const maxY = -worldBounds.top * zoom || 0;

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, minY), maxY),
  };
}
