import {
  BOAT_LENGTH,
  CANVAS_PAN_MARGIN,
  COMMENT_PADDING_X,
  GRID_SNAP_RADIUS,
  GRID_SPACING,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
} from '../constants';
import type { Frame, FrameComment } from '../types';
import { COMMENT_PADDING_Y } from '../constants';

export interface Position {
  x: number;
  y: number;
}

export interface CanvasContentBounds {
  maxX: number;
  maxY: number;
}

export interface CanvasContentRect extends CanvasContentBounds {
  minX: number;
  minY: number;
}

export interface CanvasWorldBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function getCommentText(comment: FrameComment): string {
  if (comment.type === 'rule') {
    return [comment.rule.label, comment.rule.description].filter(Boolean).join('\n');
  }

  return comment.text;
}

export function getCommentHeight(comment: Pick<FrameComment, 'fontSize' | 'width'> & { text: string }): number {
  const fontSize = comment.fontSize ?? 14;
  const width = comment.width ?? 180;
  const availableTextWidth = Math.max(1, width - COMMENT_PADDING_X * 2);
  const estimatedCharacterWidth = fontSize * 0.56;
  const charactersPerLine = Math.max(1, Math.floor(availableTextWidth / estimatedCharacterWidth));
  const lineCount = comment.text.split('\n').reduce(
    (total, line) => total + Math.max(1, Math.ceil(line.length / charactersPerLine)),
    0,
  );

  return Math.max(64, lineCount * fontSize * 1.25 + COMMENT_PADDING_Y * 2);
}

export function canvasToWorldPosition(position: Position, canvasPosition: Position, canvasZoom: number): Position {
  return {
    x: (position.x - canvasPosition.x) / canvasZoom,
    y: (position.y - canvasPosition.y) / canvasZoom,
  };
}

export function worldToCanvasPosition(position: Position, canvasPosition: Position, canvasZoom: number): Position {
  return {
    x: canvasPosition.x + position.x * canvasZoom,
    y: canvasPosition.y + position.y * canvasZoom,
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

export function getCanvasContentRect(frames: Array<Pick<Frame, 'boats' | 'marks' | 'arrows' | 'comments' | 'images'>>): CanvasContentRect {
  const bounds = frames.reduce<CanvasContentRect>((currentBounds, frame) => {
    const includeRect = (left: number, top: number, right: number, bottom: number) => {
      currentBounds.minX = Math.min(currentBounds.minX, left);
      currentBounds.minY = Math.min(currentBounds.minY, top);
      currentBounds.maxX = Math.max(currentBounds.maxX, right);
      currentBounds.maxY = Math.max(currentBounds.maxY, bottom);
    };

    frame.boats.forEach((boat) => {
      const horizontalExtent = boat.showHeadingLine ? 360 : 50;
      const verticalExtent = boat.showHeadingLine ? 360 : 70;
      includeRect(boat.x - horizontalExtent, boat.y - verticalExtent, boat.x + horizontalExtent, boat.y + verticalExtent);
    });

    frame.marks.forEach((mark) => {
      const markExtent = mark.shape === 'obstruction'
        ? Math.max(mark.size ?? 60, (mark.proximityRadius ?? 3) * BOAT_LENGTH)
        : mark.shape === 'gate'
          ? Math.max(mark.size ?? 28, (mark.size ?? 28) * 1.2)
          : mark.shape === 'committeeBoat'
            ? Math.max(mark.size ?? 36, (mark.size ?? 36) * 2)
            : mark.size ?? 40;
      includeRect(mark.x - markExtent, mark.y - markExtent, mark.x + markExtent, mark.y + markExtent);
    });

    frame.arrows?.forEach((arrow) => {
      arrow.points.forEach((point) => {
        includeRect(point.x - 24, point.y - 24, point.x + 24, point.y + 24);
      });
    });

    frame.comments?.forEach((comment) => {
      includeRect(
        comment.x,
        comment.y,
        comment.x + (comment.width ?? 180),
        comment.y + getCommentHeight({ ...comment, text: getCommentText(comment) }),
      );
    });

    frame.images?.forEach((image) => {
      const rotation = ((image.rotation ?? 0) * Math.PI) / 180;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const corners = [
        { x: 0, y: 0 },
        { x: image.width, y: 0 },
        { x: image.width, y: image.height },
        { x: 0, y: image.height },
      ].map((corner) => ({
        x: image.x + corner.x * cos - corner.y * sin,
        y: image.y + corner.x * sin + corner.y * cos,
      }));

      includeRect(
        Math.min(...corners.map((corner) => corner.x)),
        Math.min(...corners.map((corner) => corner.y)),
        Math.max(...corners.map((corner) => corner.x)),
        Math.max(...corners.map((corner) => corner.y)),
      );
    });

    return currentBounds;
  }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

  return Number.isFinite(bounds.minX)
    ? bounds
    : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

export function getCanvasContentBounds(frames: Array<Pick<Frame, 'boats' | 'marks' | 'arrows' | 'comments' | 'images'>>): CanvasContentBounds {
  const { maxX, maxY } = getCanvasContentRect(frames);
  return { maxX, maxY };
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
