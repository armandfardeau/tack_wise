import { act, renderHook } from '@testing-library/react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { useScenarioExport } from '../src/hooks/useScenarioExport';
import { downloadBlob } from '../src/utils/exporter';
import { convertWebmToMp4, encodePngFramesToVideo } from '../src/utils/mp4';
import type { Frame } from '../src/types';

jest.mock('../src/utils/exporter', () => ({
  dataUrlToBlob: jest.fn(),
  downloadBlob: jest.fn(),
  downloadScenarioJson: jest.fn(),
  exportToGif: jest.fn(),
}));

jest.mock('../src/utils/mp4', () => ({
  convertWebmToMp4: jest.fn(),
  encodePngFramesToVideo: jest.fn(),
}));

class TestMediaRecorder {
  static supportedMimeTypes = new Set<string>();
  static isTypeSupported = jest.fn((mimeType: string) => TestMediaRecorder.supportedMimeTypes.has(mimeType));

  readonly mimeType: string;
  state: RecordingState = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onerror: (() => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: MediaStream, options: MediaRecorderOptions) {
    this.mimeType = options.mimeType ?? '';
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['recorded video']) });
    this.onstop?.();
  }
}

const frames: Frame[] = [{
  id: 'frame-1',
  name: 'Start',
  windAngle: 0,
  windSpeed: 12,
  boats: [],
  marks: [],
}];

const originalRequestAnimationFrame = window.requestAnimationFrame;

function renderVideoExport(exportFrames: Frame[] = frames, exportPlaySpeed = 0, stage: KonvaStage | null = null) {
  const track = { stop: jest.fn() };
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'captureStream', {
    configurable: true,
    value: jest.fn(() => ({ getTracks: () => [track] })),
  });
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  canvasWrap.appendChild(canvas);
  document.body.appendChild(canvasWrap);

  const setCurrentFrameIndex = jest.fn();
  const setPlaybackProgress = jest.fn();
  const setIsPlaybackSampling = jest.fn();
  const setIsPlaying = jest.fn();
  const hook = renderHook(() => useScenarioExport({
    currentFrameIndex: 0,
    frames: exportFrames,
    playSpeed: exportPlaySpeed,
    setCurrentFrameIndex,
    setPlaybackProgress,
    setIsPlaybackSampling,
    setIsPlaying,
    settings: { displayMode: 'single', presenterMode: false },
    stageRef: { current: stage } as { current: KonvaStage | null },
    stageSize: { width: 800, height: 600 },
  }));

  return { ...hook, canvas, setCurrentFrameIndex, setPlaybackProgress, setIsPlaybackSampling, setIsPlaying, track };
}

describe('useScenarioExport video exports', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
    });
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      writable: true,
      value: TestMediaRecorder,
    });
    TestMediaRecorder.supportedMimeTypes = new Set();
    TestMediaRecorder.isTypeSupported.mockClear();
    jest.mocked(downloadBlob).mockClear();
    jest.mocked(convertWebmToMp4).mockReset();
    jest.mocked(encodePngFramesToVideo).mockReset();
    jest.spyOn(Date, 'now').mockReturnValue(123);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: originalRequestAnimationFrame,
    });
    document.body.innerHTML = '';
  });

  it('records and downloads WEBM without converting it', async () => {
    TestMediaRecorder.supportedMimeTypes.add('video/webm;codecs=vp9');
    const { result, setIsPlaying, setIsPlaybackSampling, track } = renderVideoExport();

    await act(async () => {
      await result.current.triggerExport('webm');
    });

    expect(TestMediaRecorder.isTypeSupported).toHaveBeenCalledWith('video/webm;codecs=vp9');
    expect(jest.mocked(convertWebmToMp4)).not.toHaveBeenCalled();
    const webmDownload = jest.mocked(downloadBlob).mock.calls[0];
    expect(webmDownload[0]).toBeInstanceOf(Blob);
    expect(webmDownload[0].type).toBe('video/webm;codecs=vp9');
    expect(webmDownload[1]).toBe('regatta-simulation-123.webm');
    expect(setIsPlaying).toHaveBeenCalledWith(false);
    expect(setIsPlaybackSampling).toHaveBeenCalledWith(true);
    expect(setIsPlaybackSampling).toHaveBeenLastCalledWith(false);
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it('renders and encodes video frames offline when Konva can export blobs', async () => {
    const stage = {
      toBlob: jest.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
    } as unknown as KonvaStage;
    const encodedBlob = new Blob(['offline video'], { type: 'video/webm' });
    jest.mocked(encodePngFramesToVideo).mockResolvedValue(encodedBlob);
    const { result } = renderVideoExport(frames, 0, stage);

    await act(async () => {
      await result.current.triggerExport('webm');
    });

    expect(stage.toBlob).toHaveBeenCalledWith({ pixelRatio: 1, mimeType: 'image/png' });
    expect(encodePngFramesToVideo).toHaveBeenCalledWith(
      [expect.any(Blob)],
      15,
      'webm',
      expect.any(Function),
    );
    expect(downloadBlob).toHaveBeenCalledWith(encodedBlob, 'regatta-simulation-123.webm');
  });

  it('samples intermediate playback progress for multi-frame video exports', async () => {
    TestMediaRecorder.supportedMimeTypes.add('video/webm;codecs=vp9');
    const secondFrame = { ...frames[0], id: 'frame-2', name: 'End' };
    const { result, setPlaybackProgress } = renderVideoExport([frames[0], secondFrame], 100);

    await act(async () => {
      await result.current.triggerExport('webm');
    });

    expect(setPlaybackProgress).toHaveBeenCalledWith(0.5);
    expect(setPlaybackProgress).toHaveBeenLastCalledWith(0);
  });

  it('records and downloads native MP4 when the browser supports it', async () => {
    TestMediaRecorder.supportedMimeTypes.add('video/mp4;codecs=avc1.42E01E');
    const { result } = renderVideoExport();

    await act(async () => {
      await result.current.triggerExport('mp4');
    });

    expect(TestMediaRecorder.isTypeSupported).toHaveBeenCalledWith('video/mp4;codecs=avc1.42E01E');
    expect(jest.mocked(convertWebmToMp4)).not.toHaveBeenCalled();
    const mp4Download = jest.mocked(downloadBlob).mock.calls[0];
    expect(mp4Download[0]).toBeInstanceOf(Blob);
    expect(mp4Download[0].type).toBe('video/mp4;codecs=avc1.42e01e');
    expect(mp4Download[1]).toBe('regatta-simulation-123.mp4');
  });

  it('converts a WEBM recording when native MP4 is unavailable', async () => {
    TestMediaRecorder.supportedMimeTypes.add('video/webm;codecs=vp8');
    const convertedBlob = new Blob(['converted video'], { type: 'video/mp4' });
    jest.mocked(convertWebmToMp4).mockResolvedValue(convertedBlob);
    const { result } = renderVideoExport();

    await act(async () => {
      await result.current.triggerExport('mp4');
    });

    const recordedWebm = jest.mocked(convertWebmToMp4).mock.calls[0][0];
    expect(recordedWebm).toBeInstanceOf(Blob);
    expect(recordedWebm.type).toBe('video/webm;codecs=vp8');
    expect(jest.mocked(convertWebmToMp4).mock.calls[0][1]).toEqual(expect.any(Function));
    expect(jest.mocked(downloadBlob)).toHaveBeenCalledWith(convertedBlob, 'regatta-simulation-123.mp4');
  });
});
