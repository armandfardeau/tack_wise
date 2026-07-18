import type { Frame } from '../types';

export const initialFrames: Frame[] = [
  {
    id: 'frame-1',
    name: '1. Preparation',
    windAngle: 0,
    windSpeed: 12,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 200, y: 350, heading: 45, sailAngle: -12 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 400, y: 350, heading: 315, sailAngle: 12 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
  {
    id: 'frame-2',
    name: '2. Upwind Tack',
    windAngle: 0,
    windSpeed: 12,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 260, y: 280, heading: 45, sailAngle: -12 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 340, y: 280, heading: 315, sailAngle: 12 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
  {
    id: 'frame-3',
    name: '3. Meeting at Mark',
    windAngle: 10,
    windSpeed: 14,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 290, y: 160, heading: 45, sailAngle: -12 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 310, y: 160, heading: 315, sailAngle: 12 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
  {
    id: 'frame-4',
    name: '4. Rounding Mark',
    windAngle: 10,
    windSpeed: 14,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 300, y: 90, heading: 120, sailAngle: -60 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 330, y: 120, heading: 90, sailAngle: -45 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
];

export function cloneFrames(frames: Frame[] = initialFrames): Frame[] {
  return frames.map((frame) => ({
    ...frame,
    boats: frame.boats.map((boat) => ({ ...boat })),
    marks: frame.marks.map((mark) => ({ ...mark })),
    arrows: frame.arrows?.map((arrow) => ({
      ...arrow,
      points: arrow.points.map((point) => ({ ...point })),
    })),
    comments: frame.comments?.map((comment) => ({ ...comment })),
    images: frame.images?.map((image) => ({ ...image })),
    rules: frame.rules?.map((rule) => ({ ...rule })),
    transition: frame.transition ? { ...frame.transition } : undefined,
  }));
}
