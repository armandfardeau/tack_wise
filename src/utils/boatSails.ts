export interface SailPoint {
  x: number;
  y: number;
}

export interface MainsailGeometry {
  mastHead: SailPoint;
  mastFoot: SailPoint;
  clew: SailPoint;
  leechControl: SailPoint;
  boomPoints: [SailPoint, SailPoint];
  sailPath: string;
  luffPath: string;
  leechPath: string;
  footPath: string;
  battenPaths: string[];
  sailAngle: number;
}

const MIN_SAIL_ANGLE = -90;
const MAX_SAIL_ANGLE = 90;
const MAST_HEAD_Y = -52;
const MAST_FOOT_Y = -12;
const BOOM_LENGTH = 40;
const LEECH_BELLY = 16;
const BATTEN_POSITIONS = [0.35, 0.65];

function clampSailAngle(sailAngle: number): number {
  if (!Number.isFinite(sailAngle)) return 0;
  return Math.min(Math.max(sailAngle, MIN_SAIL_ANGLE), MAX_SAIL_ANGLE);
}

function formatPoint(point: SailPoint): string {
  return `${point.x} ${point.y}`;
}

function cleanCoordinate(value: number): number {
  return Math.abs(value) < 1e-9 ? 0 : value;
}

function getQuadraticPoint(start: SailPoint, control: SailPoint, end: SailPoint, progress: number): SailPoint {
  const inverseProgress = 1 - progress;
  return {
    x: (inverseProgress ** 2) * start.x
      + 2 * inverseProgress * progress * control.x
      + (progress ** 2) * end.x,
    y: (inverseProgress ** 2) * start.y
      + 2 * inverseProgress * progress * control.y
      + (progress ** 2) * end.y,
  };
}

/**
 * Builds the local-coordinate geometry for the generic boat's mainsail.
 *
 * The sign of sailAngle controls which side of the hull the sail is trimmed
 * toward. The geometry is intentionally independent of boat position and
 * heading so it can be reused by live boats and cumulative-frame shadows.
 */
export function getMainsailGeometry(sailAngle: number): MainsailGeometry {
  const normalizedAngle = clampSailAngle(sailAngle);
  const angleRadians = ((180 + normalizedAngle) * Math.PI) / 180;
  const trimSide = Math.sign(normalizedAngle);
  const mastHead = { x: 0, y: MAST_HEAD_Y };
  const mastFoot = { x: 0, y: MAST_FOOT_Y };
  const clew = {
    x: cleanCoordinate(mastFoot.x + BOOM_LENGTH * Math.sin(angleRadians)),
    y: cleanCoordinate(mastFoot.y - BOOM_LENGTH * Math.cos(angleRadians)),
  };
  const midpoint = {
    x: cleanCoordinate((mastHead.x + clew.x) / 2),
    y: cleanCoordinate((mastHead.y + clew.y) / 2),
  };
  const leechControl = {
    x: cleanCoordinate(midpoint.x + trimSide * LEECH_BELLY),
    y: cleanCoordinate(midpoint.y),
  };
  const luffPath = `M ${formatPoint(mastHead)} L ${formatPoint(mastFoot)}`;
  const footPath = `M ${formatPoint(mastFoot)} L ${formatPoint(clew)}`;
  const leechPath = `M ${formatPoint(clew)} Q ${formatPoint(leechControl)} ${formatPoint(mastHead)}`;
  const sailPath = `M ${formatPoint(mastHead)} L ${formatPoint(mastFoot)} L ${formatPoint(clew)} Q ${formatPoint(leechControl)} ${formatPoint(mastHead)} Z`;
  const battenPaths = BATTEN_POSITIONS.map((progress) => {
    const leechPoint = getQuadraticPoint(clew, leechControl, mastHead, progress);
    return `M 0 ${leechPoint.y} L ${leechPoint.x} ${leechPoint.y}`;
  });

  return {
    mastHead,
    mastFoot,
    clew,
    leechControl,
    boomPoints: [mastFoot, clew],
    sailPath,
    luffPath,
    leechPath,
    footPath,
    battenPaths,
    sailAngle: normalizedAngle,
  };
}
