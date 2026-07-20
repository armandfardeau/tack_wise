export type DisplayMode = 'single' | 'cumulative';

export type Theme = 'light' | 'dark';

export type VideoExportType = 'webm' | 'mp4';

export interface Boat {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  heading: number; // heading in degrees (0 = North, clockwise)
  sailAngle: number; // sail angle relative to centerline (-90 to +90 degrees)
  showHeadingLine?: boolean;
}

export interface Mark {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  shape: 'circle' | 'triangle' | 'square' | 'obstruction' | 'gate' | 'committeeBoat';
  size?: number;
  rotation?: number;
  /** Whether to show the mark-room zone around this mark. */
  showZone?: boolean;
  /** Radius of the mark-room zone, measured in boat lengths. */
  zoneRadius?: number;
  /** Radius of an obstruction's proximity circle, measured in boat lengths. */
  proximityRadius?: number;
  showRotationArrow?: boolean;
  rotationDirection?: 'clockwise' | 'counterclockwise';
  /** Canonical list of marks this mark connects to. */
  connectedToMarkIds?: string[];
  /** @deprecated Use connectedToMarkIds. Kept for importing older scenarios. */
  connectedToMarkId?: string | null;
  connectionLineColor?: string;
  connectionLineStyle?: 'dotted' | 'dashed' | 'solid';
}

export interface MarkConnectionEndpoint {
  markId: string;
  /** Normalized mark-local coordinates. 0 is the center; +/-1 is the mark's visual radius. */
  anchor: { x: number; y: number };
}

export interface MarkConnection {
  id: string;
  start: MarkConnectionEndpoint;
  end: MarkConnectionEndpoint;
  color?: string;
  style?: 'dotted' | 'dashed' | 'solid';
  arrowhead?: boolean;
}

export interface TacticalArrow {
  id: string;
  name: string;
  color: string;
  points: Array<{ x: number; y: number }>;
  curved?: boolean;
  lineStyle?: 'dotted' | 'dashed' | 'solid';
  lineWidth?: number;
  showArrowhead?: boolean;
}

interface CommentVisualProperties {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
}

export interface CommentNote extends CommentVisualProperties {
  type?: 'comment';
  text: string;
}

export interface RuleOffenseTarget {
  id: string;
  type: 'boat' | 'mark';
  color?: string;
}

export interface RuleComment extends CommentVisualProperties {
  type: 'rule';
  /** Kept optional for compatibility with code that treats all comments as text notes. */
  text?: string;
  rules?: RuleReference[];
  /** Legacy single-reference shape; normalized to rules when scenarios are loaded. */
  rule?: RuleReference;
  offenseTargets: RuleOffenseTarget[];
}

export type FrameComment = CommentNote | RuleComment;

export function getRuleReferences(comment: RuleComment): RuleReference[] {
  return comment.rules?.length ? comment.rules : comment.rule ? [comment.rule] : [];
}

export interface DiagramImage {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface RuleReference {
  id: string;
  label: string;
  description?: string;
  url?: string;
}

export interface Frame {
  id: string;
  name: string;
  windAngle: number; // direction wind is blowing FROM (0 = North, clockwise)
  windSpeed: number; // wind speed in knots
  boats: Boat[];
  marks: Mark[];
  connections?: MarkConnection[];
  arrows?: TacticalArrow[];
  comments?: FrameComment[];
  images?: DiagramImage[];
  rules?: RuleReference[];
}

export interface ScenarioSettings {
  title?: string;
  displayMode: DisplayMode;
  presenterMode: boolean;
  showFrameTitle?: boolean;
  showFrameNumber?: boolean;
}

export interface ScenarioExportPayload {
  version: 1 | 2;
  frames: Frame[];
  currentFrameIndex: number;
  settings?: ScenarioSettings;
}

export interface ScenarioRepositoryItem {
  id: string;
  title: string;
  updatedAt: string;
  payload: ScenarioExportPayload;
}
