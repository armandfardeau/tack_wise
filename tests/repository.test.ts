import {
  deleteScenarioRepositoryItem,
  listScenarioRepositoryItems,
  loadScenarioRepositoryItem,
  saveScenarioRepositoryItem,
} from '../src/utils/repository';
import type { ScenarioExportPayload } from '../src/types';

const payload: ScenarioExportPayload = {
  version: 1,
  currentFrameIndex: 0,
  frames: [{ id: 'frame-1', name: 'Start', windAngle: 0, windSpeed: 12, boats: [], marks: [] }],
};

describe('local scenario repository', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('saves trimmed titles, lists newest items first, and loads by id', () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1).mockReturnValueOnce(2);
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce('2026-01-01T00:00:00.000Z').mockReturnValueOnce('2026-01-02T00:00:00.000Z');

    const first = saveScenarioRepositoryItem('  First lesson  ', payload);
    const second = saveScenarioRepositoryItem('   ', payload);

    expect(first.title).toBe('First lesson');
    expect(second.title).toBe('Untitled situation');
    expect(listScenarioRepositoryItems().map((item) => item.id)).toEqual(['scenario-2', 'scenario-1']);
    expect(loadScenarioRepositoryItem(first.id)).toEqual(first);
    expect(loadScenarioRepositoryItem('missing')).toBeUndefined();
  });

  it('ignores malformed stored values and removes only the requested item', () => {
    localStorage.setItem('tack-wise-scenario-library', '{bad json');
    expect(listScenarioRepositoryItems()).toEqual([]);

    localStorage.setItem('tack-wise-scenario-library', JSON.stringify({ not: 'an array' }));
    expect(listScenarioRepositoryItems()).toEqual([]);

    const item = saveScenarioRepositoryItem('Keep me', payload);
    deleteScenarioRepositoryItem('missing');
    expect(loadScenarioRepositoryItem(item.id)).toEqual(item);
    deleteScenarioRepositoryItem(item.id);
    expect(listScenarioRepositoryItems()).toEqual([]);
  });
});
