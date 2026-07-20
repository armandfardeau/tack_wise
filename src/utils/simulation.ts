import {
  BOAT_LENGTH,
  CANVAS_PAN_MARGIN,
  COMMENT_PADDING_X,
  GRID_SNAP_RADIUS,
  GRID_SPACING,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
} from '../constants';
import { getRuleReferences, type Boat, type Frame, type FrameComment } from '../types';
import { COMMENT_PADDING_Y } from '../constants';

export interface Position {
  x: number;
  y: number;
}

const GEOMETRY_EPSILON = 1e-7;
export const MANEUVER_TURN_RATIO = 0.2;

export type BoatManeuverInvalidReason =
  | 'parallel-courses'
  | 'intersection-behind-start'
  | 'intersection-behind-end';

export interface BoatManeuver {
  intersection: Position;
  firstLegDistance: number;
  secondLegDistance: number;
  turnDelta: number;
}

export type BoatManeuverResult =
  | { valid: true; maneuver: BoatManeuver }
  | { valid: false; reason: BoatManeuverInvalidReason };

export function normalizeHeading(heading: number): number {
  const normalized = heading % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/** Returns a unit vector in the canvas coordinate system for a compass heading. */
export function getHeadingVector(heading: number): Position {
  const radians = (heading * Math.PI) / 180;
  return {
    x: Math.sin(radians),
    y: -Math.cos(radians),
  };
}

export function getShortestHeadingDelta(fromHeading: number, toHeading: number): number {
  return ((toHeading - fromHeading + 540) % 360) - 180;
}

function cross(first: Position, second: Position): number {
  return first.x * second.y - first.y * second.x;
}

function dot(first: Position, second: Position): number {
  return first.x * second.x + first.y * second.y;
}

function getPosition(boat: Pick<Boat, 'x' | 'y'>): Position {
  return { x: boat.x, y: boat.y };
}

function getValidManeuver(
  intersection: Position,
  firstLegDistance: number,
  secondLegDistance: number,
  startHeading: number,
  endHeading: number,
): BoatManeuverResult {
  return {
    valid: true,
    maneuver: {
      intersection,
      firstLegDistance: Math.max(0, firstLegDistance),
      secondLegDistance: Math.max(0, secondLegDistance),
      turnDelta: getShortestHeadingDelta(startHeading, endHeading),
    },
  };
}

/**
 * Finds a route made of two forward-traveling straight legs. The first leg
 * follows the start heading and the second leg follows the destination
 * heading, so the intersection satisfies:
 *
 *   start + t * startDirection = end - s * endDirection
 *
 * with t and s both non-negative.
 */
export function getBoatManeuver(
  startBoat: Pick<Boat, 'x' | 'y' | 'heading'>,
  endBoat: Pick<Boat, 'x' | 'y' | 'heading'>,
): BoatManeuverResult {
  const start = getPosition(startBoat);
  const end = getPosition(endBoat);
  const displacement = { x: end.x - start.x, y: end.y - start.y };
  const startDirection = getHeadingVector(startBoat.heading);
  const endDirection = getHeadingVector(endBoat.heading);
  const determinant = cross(startDirection, endDirection);
  const displacementLength = Math.hypot(displacement.x, displacement.y);

  if (displacementLength <= GEOMETRY_EPSILON) {
    return getValidManeuver(start, 0, 0, startBoat.heading, endBoat.heading);
  }

  if (Math.abs(determinant) <= GEOMETRY_EPSILON) {
    const onStartCourse = Math.abs(cross(startDirection, displacement)) <= GEOMETRY_EPSILON;
    const startProjection = dot(displacement, startDirection);
    if (onStartCourse && startProjection >= -GEOMETRY_EPSILON) {
      return getValidManeuver(end, Math.max(0, startProjection), 0, startBoat.heading, endBoat.heading);
    }

    const onEndCourse = Math.abs(cross(endDirection, displacement)) <= GEOMETRY_EPSILON;
    const endProjection = dot(displacement, endDirection);
    if (onEndCourse && endProjection >= -GEOMETRY_EPSILON) {
      return getValidManeuver(start, 0, Math.max(0, endProjection), startBoat.heading, endBoat.heading);
    }

    return { valid: false, reason: 'parallel-courses' };
  }

  // Solve displacement = t * startDirection + s * endDirection.
  const firstLegDistance = cross(displacement, endDirection) / determinant;
  const secondLegDistance = cross(startDirection, displacement) / determinant;

  if (firstLegDistance < -GEOMETRY_EPSILON) {
    return { valid: false, reason: 'intersection-behind-start' };
  }

  if (secondLegDistance < -GEOMETRY_EPSILON) {
    return { valid: false, reason: 'intersection-behind-end' };
  }

  return getValidManeuver(
    {
      x: start.x + Math.max(0, firstLegDistance) * startDirection.x,
      y: start.y + Math.max(0, firstLegDistance) * startDirection.y,
    },
    firstLegDistance,
    secondLegDistance,
    startBoat.heading,
    endBoat.heading,
  );
}

function clampProgress(progress: number): number {
  return Math.min(Math.max(progress, 0), 1);
}

function interpolateAngle(from: number, delta: number, progress: number): number {
  return normalizeHeading(from + delta * progress);
}

/** Interpolates a boat through a computed straight-line manoeuvre. */
export function interpolateBoatManeuver(
  startBoat: Boat,
  endBoat: Boat,
  progress: number,
  autoSailTrim = false,
  windAngle = 0,
): Boat {
  const clampedProgress = clampProgress(progress);
  if (clampedProgress <= 0) return { ...startBoat };
  if (clampedProgress >= 1) return { ...endBoat };

  const route = getBoatManeuver(startBoat, endBoat);
  if (!route.valid) return { ...startBoat };

  const { intersection, firstLegDistance, secondLegDistance, turnDelta } = route.maneuver;
  const totalTravelDistance = firstLegDistance + secondLegDistance;
  const hasTurn = Math.abs(turnDelta) > GEOMETRY_EPSILON;
  const turnDuration = hasTurn && totalTravelDistance > GEOMETRY_EPSILON ? MANEUVER_TURN_RATIO : 0;
  const travelDuration = 1 - turnDuration;
  const firstLegDuration = totalTravelDistance > GEOMETRY_EPSILON
    ? travelDuration * (firstLegDistance / totalTravelDistance)
    : 0;
  const secondLegDuration = totalTravelDistance > GEOMETRY_EPSILON
    ? travelDuration * (secondLegDistance / totalTravelDistance)
    : 0;
  const startDirection = getHeadingVector(startBoat.heading);
  const endDirection = getHeadingVector(endBoat.heading);
  let position = getPosition(startBoat);
  let heading = startBoat.heading;

  if (totalTravelDistance <= GEOMETRY_EPSILON) {
    heading = interpolateAngle(startBoat.heading, turnDelta, clampedProgress);
  } else if (clampedProgress < firstLegDuration || turnDuration === 0) {
    const legProgress = turnDuration === 0
      ? clampedProgress
      : firstLegDuration <= GEOMETRY_EPSILON
        ? 0
        : clampedProgress / firstLegDuration;
    const distanceAlongLeg = firstLegDistance * clampProgress(legProgress);
    position = {
      x: startBoat.x + distanceAlongLeg * startDirection.x,
      y: startBoat.y + distanceAlongLeg * startDirection.y,
    };
  } else if (clampedProgress <= firstLegDuration + turnDuration) {
    position = intersection;
    const turnProgress = turnDuration <= GEOMETRY_EPSILON
      ? 1
      : (clampedProgress - firstLegDuration) / turnDuration;
    heading = interpolateAngle(startBoat.heading, turnDelta, clampProgress(turnProgress));
  } else {
    position = intersection;
    const secondLegProgress = secondLegDuration <= GEOMETRY_EPSILON
      ? 1
      : (clampedProgress - firstLegDuration - turnDuration) / secondLegDuration;
    const distanceAlongLeg = secondLegDistance * clampProgress(secondLegProgress);
    position = {
      x: intersection.x + distanceAlongLeg * endDirection.x,
      y: intersection.y + distanceAlongLeg * endDirection.y,
    };
    heading = endBoat.heading;
  }

  const interpolatedBoat: Boat = {
    ...startBoat,
    x: position.x,
    y: position.y,
    heading: normalizeHeading(heading),
    sailAngle: autoSailTrim
      ? calculateAutoSailAngle(normalizeHeading(heading), windAngle)
      : startBoat.sailAngle + (endBoat.sailAngle - startBoat.sailAngle) * clampedProgress,
  };

  return interpolatedBoat;
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

export const RULE_COMMENT_HEADER_HEIGHT = 24;

export function getCommentText(comment: FrameComment): string {
  if (comment.type === 'rule') {
    const references = getRuleReferences(comment);
    return references.length > 0
      ? references.map((rule) => rule.description ? `${rule.label}: ${rule.description}` : rule.label).join('\n')
      : 'Select a rule reference';
  }

  return comment.text;
}

export function getCommentHeight(comment: Pick<FrameComment, 'fontSize' | 'width'> & { text: string; type?: FrameComment['type'] }): number {
  const fontSize = comment.fontSize ?? 14;
  const width = comment.width ?? 180;
  const availableTextWidth = Math.max(1, width - COMMENT_PADDING_X * 2);
  const estimatedCharacterWidth = fontSize * 0.56;
  const charactersPerLine = Math.max(1, Math.floor(availableTextWidth / estimatedCharacterWidth));
  const lineCount = comment.text.split('\n').reduce(
    (total, line) => total + Math.max(1, Math.ceil(line.length / charactersPerLine)),
    0,
  );

  const baseHeight = Math.max(64, lineCount * fontSize * 1.25 + COMMENT_PADDING_Y * 2);
  return baseHeight + (comment.type === 'rule' ? RULE_COMMENT_HEADER_HEIGHT : 0);
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
