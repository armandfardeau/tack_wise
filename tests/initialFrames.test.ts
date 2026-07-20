import { cloneFrames, initialScenarioTitle } from '../src/data/initialFrames';
import r18Situation from '../src/data/situations/r18.json';

describe('initial scenario data', () => {
  it('loads a titled scenario with frame data from the situations directory', () => {
    const frames = cloneFrames();

    expect(initialScenarioTitle).toBe('Getting started: R10 — Opposite Tacks');
    expect(frames).toHaveLength(5);
    expect(frames[0].name).toBe('1. Approaching on opposite tacks');
  });

  it('opens with a visual RRS 10 opposite-tacks example', () => {
    const frame = cloneFrames()[0];
    const boats = frame.boats;
    const marks = frame.marks;
    const arrows = frame.arrows ?? [];

    expect(boats).toHaveLength(2);
    expect(boats.every((boat) => boat.showHeadingLine)).toBe(true);
    expect(marks).toEqual([]);
    expect(arrows).toHaveLength(2);
    expect(arrows.every((arrow) => arrow.lineStyle === 'dashed')).toBe(true);
    expect(frame.comments).toHaveLength(1);
    expect(frame.comments?.[0]).toMatchObject({ name: 'Rule question' });
    expect(frame.images ?? []).toEqual([]);
    expect(frame.rules?.map((rule) => rule.label)).toEqual(['RRS 10']);
  });

  it('configures the RRS 18 template with a three-boat-length mark zone', () => {
    const mark = r18Situation.frames[0].marks[0];

    expect(mark).toMatchObject({ showZone: true, zoneRadius: 3 });
  });
});
