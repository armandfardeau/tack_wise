import { createScenarioShareUrl, downloadScenarioJson, parseScenarioFromJson, parseScenarioShareUrl, serializeScenarioToJson } from '../src/utils/exporter';
import type { Frame } from '../src/types';

const frames: Frame[] = [
  {
    id: 'frame-1',
    name: 'Preparation',
    windAngle: 0,
    windSpeed: 12,
    boats: [],
    marks: [],
  },
  {
    id: 'frame-2',
    name: 'Upwind Tack',
    windAngle: 10,
    windSpeed: 14,
    boats: [],
    marks: [],
  },
];

describe('scenario JSON export', () => {
  it('serializes the complete scenario and current frame index', () => {
    const json = serializeScenarioToJson(frames, 1);
    const result = parseScenarioFromJson(json);

    expect(result).toEqual({
      version: 1,
      frames,
      currentFrameIndex: 1,
    });
    expect(json).toContain('\n  "version": 1');
  });

  it('rejects malformed scenario JSON', () => {
    expect(() => parseScenarioFromJson('{"version":1}')).toThrow(/valid Tack Wise scenario export/i);
  });

  it('downloads a JSON blob with a timestamped scenario filename', () => {
    const createObjectURL = jest.fn((blob: Blob) => {
      return blob.size > 0 ? 'blob:scenario' : 'blob:empty-scenario';
    });
    const revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    jest.spyOn(Date, 'now').mockReturnValue(123);

    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('tack-wise-scenario-123.json');
    });

    downloadScenarioJson(frames, 0);

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:scenario');

    click.mockRestore();
    jest.restoreAllMocks();
  });

  it('round-trips mark rotation settings', () => {
    const markFrame: Frame = {
      ...frames[0],
      marks: [{
        id: 'mark-1',
        name: 'Windward Mark',
        color: '#ef4444',
        x: 300,
        y: 120,
        shape: 'triangle',
        showRotationArrow: false,
        rotationDirection: 'counterclockwise',
      }],
    };

    const result = parseScenarioFromJson(serializeScenarioToJson([markFrame], 0));

    expect(result.frames[0].marks[0]).toEqual(markFrame.marks[0]);
  });

  it('accepts legacy marks without rotation settings', () => {
    const legacyMarkFrame: Frame = {
      ...frames[0],
      marks: [{
        id: 'mark-1',
        name: 'Windward Mark',
        color: '#ef4444',
        x: 300,
        y: 120,
        shape: 'triangle',
      }],
    };

    expect(parseScenarioFromJson(serializeScenarioToJson([legacyMarkFrame], 0)).frames[0].marks[0]).toEqual(legacyMarkFrame.marks[0]);
  });

  it('rejects an invalid mark rotation direction', () => {
    const invalidJson = JSON.stringify({
      version: 1,
      currentFrameIndex: 0,
      frames: [{
        ...frames[0],
        marks: [{
          id: 'mark-1',
          name: 'Windward Mark',
          color: '#ef4444',
          x: 300,
          y: 120,
          shape: 'triangle',
          rotationDirection: 'sideways',
        }],
      }],
    });

    expect(() => parseScenarioFromJson(invalidJson)).toThrow(/valid Tack Wise scenario export/i);
  });

  it('round-trips version 2 settings and richer diagram objects', () => {
    const result = parseScenarioFromJson(serializeScenarioToJson([{
      ...frames[0],
      arrows: [{
        id: 'arrow-1',
        name: 'Course change',
        color: '#f97316',
        points: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
        curved: true,
      }],
      comments: [{ id: 'comment-1', name: 'Note', text: 'Tack here', color: '#fff', x: 10, y: 20 }],
    }], 0, {
      animationMode: 'continuous',
      displayMode: 'cumulative',
      presenterMode: true,
    }));

    expect(result.version).toBe(2);
    expect(result.settings?.presenterMode).toBe(true);
    expect(result.frames[0].arrows?.[0].curved).toBe(true);
    expect(result.frames[0].comments?.[0].text).toBe('Tack here');
  });

  it('round-trips a scenario through a portable share URL', () => {
    const payload = { version: 2 as const, frames, currentFrameIndex: 1 };
    const url = createScenarioShareUrl(payload, 'https://example.test/tack-wise');
    expect(parseScenarioShareUrl(url)).toEqual(payload);
  });
});
