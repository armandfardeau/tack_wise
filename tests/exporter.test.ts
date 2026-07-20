jest.mock('gifshot', () => ({
  __esModule: true,
  default: { createGIF: jest.fn() },
}));

import gifshot from 'gifshot';
import {
  createScenarioShareUrl,
  dataUrlToBlob,
  downloadBlob,
  downloadScenarioJson,
  exportToGif,
  parseScenarioFromJson,
  parseScenarioShareUrl,
  serializeScenarioToJson,
} from '../src/utils/exporter';
import type { Frame, MarkConnection, ScenarioExportPayload } from '../src/types';

const frames: Frame[] = [
  {
    id: 'frame-1',
    name: 'Preparation',
    windAngle: 0,
    windSpeed: 12,
    boats: [],
    marks: [],
    connections: [],
  },
  {
    id: 'frame-2',
    name: 'Upwind Tack',
    windAngle: 10,
    windSpeed: 14,
    boats: [],
    marks: [],
    connections: [],
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
      comments: [
        { id: 'comment-1', name: 'Note', text: 'Tack here', color: '#fff', x: 10, y: 20 },
        {
          id: 'rule-comment-1',
          name: 'RRS 10 breach',
          type: 'rule' as const,
          rules: [{ id: 'rrs-10', label: 'RRS 10', description: 'Keep clear.' }],
          offenseTargets: [{ id: 'boat-1', type: 'boat' as const }],
          color: '#facc15',
          x: 40,
          y: 50,
        },
      ],
    }], 0, {
      displayMode: 'cumulative',
      presenterMode: true,
    }));

    expect(result.version).toBe(2);
    expect(result.settings?.presenterMode).toBe(true);
    expect(result.frames[0].arrows?.[0].curved).toBe(true);
    expect(result.frames[0].comments?.[0].text).toBe('Tack here');
    expect(result.frames[0].comments?.[1]).toMatchObject({
      type: 'rule',
      rules: [{ id: 'rrs-10', label: 'RRS 10' }],
      offenseTargets: [{ id: 'boat-1', type: 'boat' }],
    });
  });

  it('round-trips multiple canonical mark connections', () => {
    const connections: MarkConnection[] = [
      {
        id: 'connection-a-b',
        start: { markId: 'mark-a', anchor: { x: 0.75, y: -0.25 } },
        end: { markId: 'mark-b', anchor: { x: -0.5, y: 0.5 } },
        color: '#38bdf8',
        style: 'dashed',
        arrowhead: true,
      },
      {
        id: 'connection-a-c',
        start: { markId: 'mark-a', anchor: { x: 0, y: 0 } },
        end: { markId: 'mark-c', anchor: { x: 0.5, y: 0 } },
        color: '#f97316',
        style: 'solid',
        arrowhead: false,
      },
    ];
    const markFrame: Frame = {
      ...frames[0],
      marks: [
        { id: 'mark-a', name: 'A', color: '#fff', x: 10, y: 20, shape: 'circle' },
        { id: 'mark-b', name: 'B', color: '#000', x: 30, y: 40, shape: 'circle' },
        { id: 'mark-c', name: 'C', color: '#f00', x: 50, y: 60, shape: 'circle' },
      ],
      connections,
    };

    const result = parseScenarioFromJson(serializeScenarioToJson([markFrame], 0));

    expect(result.frames[0].connections).toEqual(connections);
  });

  it('round-trips a scenario through a portable share URL', () => {
    const payload = { version: 2 as const, frames, currentFrameIndex: 1 };
    const url = createScenarioShareUrl(payload, 'https://example.test/tack-wise');
    expect(parseScenarioShareUrl(url)).toEqual(payload);

    const defaultUrl = createScenarioShareUrl(payload);
    window.history.replaceState({}, '', defaultUrl);
    expect(parseScenarioShareUrl()).toEqual(payload);
  });

  it('reports malformed JSON and malformed share links without throwing to callers', () => {
    expect(() => parseScenarioFromJson('{not json')).toThrow(/not valid JSON/i);
    expect(parseScenarioShareUrl('https://example.test/tack-wise')).toBeNull();
    expect(parseScenarioShareUrl('not a URL')).toBeNull();
  });

  it.each([
    { frames: [null], label: 'frame' },
    { frames: [{ ...frames[0], boats: [null] }], label: 'boats' },
    { frames: [{ ...frames[0], marks: [null] }], label: 'marks' },
    { frames: [{ ...frames[0], arrows: [null] }], label: 'arrows' },
    { frames: [{ ...frames[0], comments: [null] }], label: 'comments' },
    { frames: [{ ...frames[0], images: [null] }], label: 'images' },
    { frames: [{ ...frames[0], rules: [null] }], label: 'rules' },
  ])('rejects a scenario with an invalid $label entry', ({ frames: invalidFrames }) => {
    expect(() => parseScenarioFromJson(JSON.stringify({ version: 1, frames: invalidFrames, currentFrameIndex: 0 }))).toThrow(/valid Tack Wise scenario export/i);
  });

  it('validates all optional diagram fields and settings', () => {
    const payload: ScenarioExportPayload = {
      version: 2 as const,
      currentFrameIndex: 0,
      settings: { title: 'Lesson', displayMode: 'single' as const, presenterMode: false },
      frames: [{
        ...frames[0],
        boats: [],
        marks: [{
          id: 'mark-1', name: 'Mark', color: '#fff', x: 1, y: 2, shape: 'circle' as const,
          size: 20, showRotationArrow: true, rotationDirection: 'clockwise' as const,
          connectedToMarkId: null, connectionLineColor: '#000', connectionLineStyle: 'solid' as const,
        }],
        arrows: [{
          id: 'arrow-1', name: 'Arrow', color: '#fff', points: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
          curved: false, lineStyle: 'dashed' as const, lineWidth: 4, showArrowhead: false,
        }],
        comments: [{ id: 'comment-1', name: 'Comment', text: 'Text', color: '#fff', x: 1, y: 2, width: 100, fontSize: 16 }],
        images: [{ id: 'image-1', name: 'Image', src: 'data:image/png;base64,AA==', x: 1, y: 2, width: 100, height: 80, rotation: 20 }],
        rules: [{ id: 'rrs-10', label: 'RRS 10', description: 'On opposite tacks', url: 'https://rules.example.test/10' }],
      }],
    };

    // The boat validator needs a real boat; keeping the fixture local makes the
    // optional-field coverage above independent from the application defaults.
    payload.frames[0].boats = [{ id: 'boat-1', name: 'Boat', color: '#fff', x: 1, y: 2, heading: 3, sailAngle: 4, showHeadingLine: true }];

    const result = parseScenarioFromJson(JSON.stringify(payload));
    const { connectedToMarkId: _legacyConnectedToMarkId, ...canonicalMark } = payload.frames[0].marks[0];
    expect(result).toMatchObject({
      ...payload,
      frames: [{ ...payload.frames[0], marks: [canonicalMark] }],
    });
    expect(result.frames[0].connections).toEqual([]);
    expect(result.frames[0].marks[0].connectedToMarkId).toBeUndefined();
  });

  it('rejects invalid settings and frame indexes', () => {
    const valid = { version: 2, frames, currentFrameIndex: 0, settings: { displayMode: 'single', presenterMode: false } };

    expect(() => parseScenarioFromJson(JSON.stringify({ ...valid, currentFrameIndex: 2 }))).toThrow(/valid Tack Wise scenario export/i);
    expect(() => parseScenarioFromJson(JSON.stringify({ ...valid, settings: { ...valid.settings, displayMode: 'continuous' } }))).toThrow(/valid Tack Wise scenario export/i);
    expect(() => parseScenarioFromJson(JSON.stringify({ ...valid, settings: { ...valid.settings, presenterMode: 'yes' } }))).toThrow(/valid Tack Wise scenario export/i);
    expect(() => parseScenarioFromJson(JSON.stringify({ ...valid, settings: { ...valid.settings, showFrameTitle: 'yes' } }))).toThrow(/valid Tack Wise scenario export/i);
    expect(() => parseScenarioFromJson(JSON.stringify({ ...valid, settings: { ...valid.settings, showFrameNumber: 'yes' } }))).toThrow(/valid Tack Wise scenario export/i);
    expect(() => parseScenarioFromJson(JSON.stringify({ ...valid, settings: null }))).toThrow(/valid Tack Wise scenario export/i);
  });
});

describe('binary exports', () => {
  it('converts data URLs and uses a fallback MIME type when metadata is absent', () => {
    expect(dataUrlToBlob('data:text/plain;base64,SGk=')).toEqual(expect.objectContaining({ type: 'text/plain', size: 2 }));
    expect(dataUrlToBlob('data:text/plain,QQ==')).toEqual(expect.objectContaining({ type: 'application/octet-stream', size: 1 }));
  });

  it('creates a GIF blob from gifshot output', async () => {
    const createGIF = gifshot.createGIF as jest.Mock;
    createGIF.mockImplementationOnce((_options, callback) => callback({ image: 'data:image/gif;base64,AAE=' }));

    await expect(exportToGif(['frame-1'], 0.5, 320, 180)).resolves.toEqual(expect.objectContaining({ type: 'image/gif', size: 2 }));
    expect(createGIF).toHaveBeenCalledWith(expect.objectContaining({ images: ['frame-1'], interval: 0.5, gifWidth: 320, gifHeight: 180 }), expect.any(Function));
  });

  it('rejects GIF errors with a useful fallback message', async () => {
    const createGIF = gifshot.createGIF as jest.Mock;
    createGIF.mockImplementationOnce((_options, callback) => callback({ error: true }));
    await expect(exportToGif([], 1, 10, 10)).rejects.toThrow('Failed to create GIF');

    createGIF.mockImplementationOnce((_options, callback) => callback({ error: true, errorMsg: 'Canvas failed' }));
    await expect(exportToGif([], 1, 10, 10)).rejects.toThrow('Canvas failed');
  });

  it('downloads and revokes a blob URL', () => {
    const createObjectURL = jest.fn(() => 'blob:test');
    const revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadBlob(new Blob(['content']), 'scenario.json');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    click.mockRestore();
  });
});
