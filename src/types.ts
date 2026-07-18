export type BoatClass =
  | 'dinghy'
  | 'keelboat'
  | 'optimist'
  | 'tornado'
  | 'trimaran'
  | 'custom';

export type SailPlan = 'main' | 'symmetric-spinnaker' | 'asymmetric-spinnaker';

export type AnimationMode = 'step' | 'continuous';

export type DisplayMode = 'single' | 'cumulative';

export interface Boat {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  heading: number; // heading in degrees (0 = North, clockwise)
  sailAngle: number; // sail angle relative to centerline (-90 to +90 degrees)
  boatClass?: BoatClass;
  hullScale?: number;
  sailPlan?: SailPlan;
  spinnakerDeployed?: boolean;
  showHeadingLine?: boolean;
}

export interface Mark {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  shape: 'circle' | 'triangle' | 'square' | 'obstruction' | 'gate';
  size?: number;
  showRotationArrow?: boolean;
  rotationDirection?: 'clockwise' | 'counterclockwise';
  connectedToMarkId?: string | null;
  connectionLineColor?: string;
  connectionLineStyle?: 'dotted' | 'dashed' | 'solid';
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

export interface CommentNote {
  id: string;
  name: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
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

export interface FrameTransition {
  durationMs?: number;
  animationMode?: AnimationMode;
}

export interface Frame {
  id: string;
  name: string;
  windAngle: number; // direction wind is blowing FROM (0 = North, clockwise)
  windSpeed: number; // wind speed in knots
  boats: Boat[];
  marks: Mark[];
  arrows?: TacticalArrow[];
  comments?: CommentNote[];
  images?: DiagramImage[];
  rules?: RuleReference[];
  transition?: FrameTransition;
}

export interface ScenarioSettings {
  title?: string;
  animationMode: AnimationMode;
  displayMode: DisplayMode;
  presenterMode: boolean;
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
