import { downloadScenarioJson, parseScenarioFromJson, serializeScenarioToJson } from '../src/utils/exporter';
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
});
