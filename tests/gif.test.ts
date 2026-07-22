jest.mock('gifshot', () => ({
  __esModule: true,
  default: { createGIF: jest.fn() },
}));

import gifshot from 'gifshot';
import { exportToGif } from '../src/utils/gif';

describe('GIF exports', () => {
  beforeEach(() => jest.mocked(gifshot.createGIF).mockReset());

  it('creates a GIF blob from gifshot output', async () => {
    jest.mocked(gifshot.createGIF).mockImplementationOnce((_options, callback) => callback({ error: false, image: 'data:image/gif;base64,AAE=' }));

    await expect(exportToGif(['frame-1'], 0.5, 320, 180)).resolves.toEqual(expect.objectContaining({ type: 'image/gif', size: 2 }));
    expect(gifshot.createGIF).toHaveBeenCalledWith(
      expect.objectContaining({ images: ['frame-1'], interval: 0.5, gifWidth: 320, gifHeight: 180 }),
      expect.any(Function),
    );
  });

  it('passes GIF quality and worker settings to gifshot', async () => {
    jest.mocked(gifshot.createGIF).mockImplementationOnce((_options, callback) => callback({ error: false, image: 'data:image/gif;base64,AAE=' }));

    await exportToGif(['frame-1'], 0.1, 320, 180, { sampleInterval: 20, numWorkers: 3 });

    expect(gifshot.createGIF).toHaveBeenCalledWith(
      expect.objectContaining({ sampleInterval: 20, numWorkers: 3 }),
      expect.any(Function),
    );
  });

  it('rejects GIF errors with a useful fallback message', async () => {
    jest.mocked(gifshot.createGIF).mockImplementationOnce((_options, callback) => callback({ error: true }));
    await expect(exportToGif([], 1, 10, 10)).rejects.toThrow('Failed to create GIF');

    jest.mocked(gifshot.createGIF).mockImplementationOnce((_options, callback) => callback({ error: true, errorMsg: 'Canvas failed' }));
    await expect(exportToGif([], 1, 10, 10)).rejects.toThrow('Canvas failed');
  });
});
