import type { Mark } from '../types';

export const ROTATION_ARROW_RADIUS = 28;
export const ROTATION_ARROW_ARROWHEAD_RADIUS = ROTATION_ARROW_RADIUS - 1.5;
export const ROTATION_ARROW_SWEEP = 270;
export const ROTATION_ARROW_START_ANGLE = 45;

export interface RotationArrowGeometry {
  arcAngle: number;
  arrowRotation: number;
  arrowX: number;
  arrowY: number;
  arcClockwise: boolean;
}

function pointAtAngle(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

export function getRotationArrowGeometry(
  direction: NonNullable<Mark['rotationDirection']> = 'counterclockwise',
): RotationArrowGeometry {
  const isCounterclockwise = direction === 'counterclockwise';
  const endAngle = isCounterclockwise
    ? ROTATION_ARROW_START_ANGLE - ROTATION_ARROW_SWEEP
    : ROTATION_ARROW_START_ANGLE + ROTATION_ARROW_SWEEP;
  // Keep the arrowhead centered inside the arc band so both directions
  // meet cleanly at the endpoint instead of leaving a one-pixel gap.
  const arrowPoint = pointAtAngle(endAngle, ROTATION_ARROW_ARROWHEAD_RADIUS);

  return {
    // Konva's counterclockwise arc travels from 0 down to the supplied
    // angle, so 90° produces the desired 270° reverse sweep.
    arcAngle: isCounterclockwise ? 360 - ROTATION_ARROW_SWEEP : ROTATION_ARROW_SWEEP,
    arrowRotation: isCounterclockwise ? endAngle : endAngle + 180,
    arrowX: arrowPoint.x,
    arrowY: arrowPoint.y,
    // Konva's Arc uses the canvas anticlockwise flag; false is visually
    // clockwise because the canvas y-axis points down.
    arcClockwise: isCounterclockwise,
  };
}
