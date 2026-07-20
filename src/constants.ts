export const BOAT_COLORS = [
  '#38bdf8',
  '#f87171',
  '#4ade80',
  '#fbbf24',
  '#c084fc',
  '#fb7185',
  '#2dd4bf',
] as const;

export const MARK_COLORS = ['#ef4444', '#22c55e', '#f97316', '#eab308'] as const;

// The canonical hull path is 110 world units long and is rendered at 0.5x.
// Keeping the effective length in one place lets obstruction proximity circles
// use a meaningful sailing-specific unit without coupling them to Konva paths.
export const BOAT_LENGTH = 55;
export const DEFAULT_BOAT_ASPECT_RATIO = 0.42;
export const MIN_BOAT_ASPECT_RATIO = 0.25;
export const MAX_BOAT_ASPECT_RATIO = 0.8;
export const DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS = 3;

export const MIN_CANVAS_ZOOM = 0.5;
export const MAX_CANVAS_ZOOM = 3;
export const CANVAS_ZOOM_STEP = 1.2;
export const MOBILE_INITIAL_CANVAS_ZOOM = 0.7;
// Keep a generous world around the visible viewport so the canvas can be panned
// in every direction even when it is at its default 100% zoom.
export const CANVAS_PAN_MARGIN = 2;
// Use 20px spacing to keep the placement and magnetic grids at 2x density.
export const GRID_SPACING = 20;
export const GRID_SNAP_RADIUS = GRID_SPACING * 0.45;
export const COMMENT_PADDING_X = 14;
export const COMMENT_PADDING_Y = 12;
