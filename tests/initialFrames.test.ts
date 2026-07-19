import { cloneFrames, initialScenarioTitle } from '../src/data/initialFrames';

describe('initial scenario data', () => {
  it('loads a titled scenario with frame data from the situations directory', () => {
    const frames = cloneFrames();

    expect(initialScenarioTitle).toBe('Tacking Basics');
    expect(frames).toHaveLength(4);
    expect(frames[0].name).toBe('1. Preparation');
  });
});
