import type { Boat } from '../src/types';
import { getSpeechBubblePosition, getSpeechBubblePositions } from '../src/utils/speechBubble';

const boat = (changes: Partial<Boat> = {}): Boat => ({
  id: 'boat-1',
  name: 'Alpha',
  color: '#38bdf8',
  x: 200,
  y: 200,
  heading: 0,
  sailAngle: 0,
  speechBubble: 'Room to tack?',
  ...changes,
});

describe('speech bubble placement', () => {
  it('keeps a bubble at the top when no boat occupies that space', () => {
    expect(getSpeechBubblePosition(boat(), [boat(), boat({ id: 'boat-2', x: 420, y: 200 })])).toBe('top');
  });

  it('moves a bubble to the bottom when another boat intersects its top bounds', () => {
    expect(getSpeechBubblePosition(boat(), [boat(), boat({ id: 'boat-2', x: 200, y: 110 })])).toBe('bottom');
  });

  it('only returns placements for boats with readable bubble text', () => {
    const positions = getSpeechBubblePositions([
      boat(),
      boat({ id: 'boat-2', speechBubble: '   ' }),
    ]);

    expect(positions).toEqual(new Map([['boat-1', 'top']]));
  });
});
