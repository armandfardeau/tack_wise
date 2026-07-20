import type { Boat } from '../types';

export type SpeechBubblePosition = 'top' | 'bottom';

export const SPEECH_BUBBLE_WIDTH = 190;
export const SPEECH_BUBBLE_TOP_Y = -112;
export const SPEECH_BUBBLE_BOTTOM_Y = 52;

const SPEECH_BUBBLE_TAIL_LENGTH = 20;
const SPEECH_BUBBLE_LINE_LENGTH = 26;
const SPEECH_BUBBLE_MIN_HEIGHT = 54;
const SPEECH_BUBBLE_MAX_HEIGHT = 100;
const SPEECH_BUBBLE_BOAT_RADIUS = 36;

export function getSpeechBubbleHeight(text: string): number {
  const lineCount = text.split('\n').reduce(
    (count, line) => count + Math.max(1, Math.ceil(line.length / SPEECH_BUBBLE_LINE_LENGTH)),
    0,
  );

  return Math.min(SPEECH_BUBBLE_MAX_HEIGHT, Math.max(SPEECH_BUBBLE_MIN_HEIGHT, 24 + lineCount * 18));
}

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function getSpeechBubbleBounds(boat: Boat, text: string, position: SpeechBubblePosition): Bounds {
  const height = getSpeechBubbleHeight(text);
  const bodyTop = boat.y + (position === 'top' ? SPEECH_BUBBLE_TOP_Y : SPEECH_BUBBLE_BOTTOM_Y);
  const bodyBottom = bodyTop + height;

  return {
    left: boat.x - SPEECH_BUBBLE_WIDTH / 2,
    top: position === 'top' ? bodyTop : bodyTop - SPEECH_BUBBLE_TAIL_LENGTH,
    right: boat.x + SPEECH_BUBBLE_WIDTH / 2,
    bottom: position === 'top' ? bodyBottom + SPEECH_BUBBLE_TAIL_LENGTH : bodyBottom,
  };
}

function intersectsBoat(bounds: Bounds, boat: Boat): boolean {
  const closestX = Math.max(bounds.left, Math.min(boat.x, bounds.right));
  const closestY = Math.max(bounds.top, Math.min(boat.y, bounds.bottom));

  return Math.hypot(boat.x - closestX, boat.y - closestY) <= SPEECH_BUBBLE_BOAT_RADIUS;
}

export function getSpeechBubblePosition(boat: Boat, otherBoats: Boat[]): SpeechBubblePosition {
  const text = boat.speechBubble?.trim();
  if (!text) return 'top';

  const topBounds = getSpeechBubbleBounds(boat, text, 'top');
  const topIsClear = otherBoats
    .filter((otherBoat) => otherBoat.id !== boat.id)
    .every((otherBoat) => !intersectsBoat(topBounds, otherBoat));

  return topIsClear ? 'top' : 'bottom';
}

export function getSpeechBubblePositions(boats: Boat[]): Map<string, SpeechBubblePosition> {
  return new Map(
    boats
      .filter((boat) => boat.speechBubble?.trim())
      .map((boat) => [boat.id, getSpeechBubblePosition(boat, boats)]),
  );
}
