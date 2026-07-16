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
  shape: 'circle' | 'triangle' | 'square';
}

export interface Frame {
  id: string;
  name: string;
  windAngle: number; // direction wind is blowing FROM (0 = North, clockwise)
  windSpeed: number; // wind speed in knots
  boats: Boat[];
  marks: Mark[];
}
