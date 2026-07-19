import { cloneFrames, initialScenarioTitle } from '../src/data/initialFrames';

describe('initial scenario data', () => {
  it('loads a titled scenario with frame data from the situations directory', () => {
    const frames = cloneFrames();

    expect(initialScenarioTitle).toBe('Getting Started');
    expect(frames).toHaveLength(4);
    expect(frames[0].name).toBe('1. Toolbox Tour');
  });

  it('opens with examples for every diagram capability', () => {
    const frame = cloneFrames()[0];
    const boats = frame.boats;
    const marks = frame.marks;
    const arrows = frame.arrows ?? [];

    expect(boats.some((boat) => boat.showHeadingLine)).toBe(true);

    expect(marks.map((mark) => mark.shape)).toEqual(expect.arrayContaining([
      'circle',
      'triangle',
      'square',
      'obstruction',
      'gate',
    ]));
    expect(marks.some((mark) => mark.showRotationArrow && mark.rotationDirection === 'clockwise')).toBe(true);
    expect(marks.some((mark) => mark.showRotationArrow && mark.rotationDirection === 'counterclockwise')).toBe(true);
    expect(marks.map((mark) => mark.connectionLineStyle)).toEqual(expect.arrayContaining(['dotted', 'dashed', 'solid']));

    expect(arrows.map((arrow) => arrow.lineStyle)).toEqual(expect.arrayContaining(['dotted', 'dashed', 'solid']));
    expect(arrows.some((arrow) => arrow.curved)).toBe(true);
    expect(arrows.some((arrow) => arrow.showArrowhead === false)).toBe(true);
    expect(frame.comments).toHaveLength(2);
    expect(frame.images?.[0].src).toMatch(/^data:image\//);
    expect(frame.rules?.map((rule) => rule.label)).toEqual(expect.arrayContaining(['RRS 10', 'RRS 18']));
  });
});
