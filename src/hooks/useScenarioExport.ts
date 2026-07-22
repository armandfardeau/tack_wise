import { useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { type ExportFps, type ExportPhase, type ExportQuality, type Frame, type ScenarioSettings, type VideoExportType } from '../types';
import { dataUrlToBlob, downloadBlob, downloadScenarioJson } from '../utils/exporter';
import { DEFAULT_EXPORT_QUALITY, EXPORT_QUALITY_PRESETS } from '../utils/exportSettings';

interface UseScenarioExportProps {
  currentFrameIndex: number;
  frames: Frame[];
  playSpeed: number;
  playbackProgress?: number;
  setCurrentFrameIndex: (index: number) => void;
  setPlaybackProgress?: (progress: number) => void;
  setIsPlaybackSampling?: (sampling: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  settings: ScenarioSettings;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
  exportQuality?: ExportQuality;
}

export function useScenarioExport({
  currentFrameIndex,
  frames,
  playSpeed,
  playbackProgress = 0,
  setCurrentFrameIndex,
  setPlaybackProgress = () => undefined,
  setIsPlaybackSampling = () => undefined,
  setIsPlaying,
  settings,
  stageRef,
  stageSize,
  exportQuality = DEFAULT_EXPORT_QUALITY,
}: UseScenarioExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'gif' | VideoExportType | null>(null);
  const [exportPhase, setExportPhase] = useState<ExportPhase>('preparing');
  const { fps: configuredExportFps, gifPixelRatio, gifSampleInterval } = EXPORT_QUALITY_PRESETS[exportQuality];
  const defaultExportFps = configuredExportFps as ExportFps;

  const triggerJsonExport = (exportFrames: Frame[], exportCurrentFrameIndex: number) => {
    downloadScenarioJson(exportFrames, exportCurrentFrameIndex, settings);
  };

  const triggerImageExport = (type: 'png' | 'jpeg') => {
    const stage = stageRef.current;
    if (!stage) return;

    const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
    stage.draw();
    const dataUrl = stage.toDataURL({ pixelRatio: 1.5, mimeType });
    downloadBlob(dataUrlToBlob(dataUrl), `tack-wise-diagram-${Date.now()}.${type === 'png' ? 'png' : 'jpg'}`);
  };

  const captureStageBlob = async (stage: KonvaStage, pixelRatio: number) => {
    const blob = await stage.toBlob({ pixelRatio, mimeType: 'image/png' }) as Blob | null;
    if (!blob) throw new Error('Could not capture a video frame.');
    return blob;
  };

  const getRecordingMimeType = (type: VideoExportType) => {
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('Video recording is not supported by this browser.');
    }

    const webmMimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const supportedMimeTypes = type === 'webm'
      ? webmMimeTypes
      : [
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4',
        ...webmMimeTypes,
      ];
    const mimeType = supportedMimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));

    if (!mimeType) {
      throw new Error(`This browser cannot record a video that can be exported as ${type.toUpperCase()}.`);
    }

    return mimeType;
  };

  const triggerExport = async (type: 'gif' | VideoExportType, fps: ExportFps = defaultExportFps) => {
    setIsPlaying(false);
    setIsPlaybackSampling(true);
    setIsExporting(true);
    setExportType(type);
    setExportProgress(0);
    setExportPhase('preparing');

    const originalFrame = currentFrameIndex;
    const originalProgress = playbackProgress;
    const exportFps = fps;
    const exportFrameInterval = 1000 / fps;
    const exportDuration = Math.max(playSpeed, exportFrameInterval);
    const samplesPerSegment = Math.max(1, Math.ceil(exportDuration / exportFrameInterval));
    const segmentCount = Math.max(frames.length, 1);
    const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    const waitForPaint = () => new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const renderOfflineVideo = async (type: VideoExportType): Promise<Blob | null> => {
      const stage = stageRef.current;
      if (!stage || typeof stage.toBlob !== 'function') return null;

      setExportPhase('capturing');
      const capturedFrames: Blob[] = [];
      for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
        const frameIndex = frames.length === 0 ? 0 : segmentIndex % frames.length;
        for (let sampleIndex = 0; sampleIndex < samplesPerSegment; sampleIndex += 1) {
          flushSync(() => {
            setCurrentFrameIndex(frameIndex);
            setPlaybackProgress(sampleIndex / samplesPerSegment);
            setExportProgress(Math.round(((segmentIndex * samplesPerSegment + sampleIndex) / (segmentCount * samplesPerSegment)) * 45));
          });

          capturedFrames.push(await captureStageBlob(stage, gifPixelRatio));
        }
      }

      setExportProgress(50);
      setExportPhase('preparing');
      const { encodePngFramesToVideo, prepareVideoEncoder } = await import('../utils/mp4');
      await prepareVideoEncoder();
      setExportPhase('encoding');
      return encodePngFramesToVideo(capturedFrames, exportFps, type, (progress) => {
        setExportProgress(50 + Math.round(progress * 50));
      });
    };

    try {
      if (type === 'gif') {
        const { exportToGif } = await import('../utils/gif');
        setExportPhase('capturing');
        const capturedImageUrls: string[] = [];
        try {
          for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
            const frameIndex = frames.length === 0 ? 0 : segmentIndex % frames.length;
            for (let sampleIndex = 0; sampleIndex < samplesPerSegment; sampleIndex += 1) {
              flushSync(() => {
                setCurrentFrameIndex(frameIndex);
                setPlaybackProgress(sampleIndex / samplesPerSegment);
                setExportProgress(Math.round(((segmentIndex * samplesPerSegment + sampleIndex) / (segmentCount * samplesPerSegment)) * 50));
              });

              const stage = stageRef.current;
              if (!stage) throw new Error('Canvas stage not found.');
              capturedImageUrls.push(URL.createObjectURL(await captureStageBlob(stage, gifPixelRatio)));
            }
          }

          setExportProgress(60);
          setExportPhase('encoding');
          const gifBlob = await exportToGif(capturedImageUrls, exportFrameInterval / 1000, stageSize.width, stageSize.height, {
            sampleInterval: gifSampleInterval,
          });
          setExportProgress(90);
          downloadBlob(gifBlob, `regatta-simulation-${Date.now()}.gif`);
        } finally {
          capturedImageUrls.forEach((url) => URL.revokeObjectURL(url));
        }
      } else {
        try {
          const offlineVideoBlob = await renderOfflineVideo(type);
          if (offlineVideoBlob) {
            setExportProgress(100);
            downloadBlob(offlineVideoBlob, `regatta-simulation-${Date.now()}.${type}`);
            return;
          }
        } catch (error) {
          console.warn('Offline video export unavailable; falling back to real-time recording.', error);
        }

        setExportPhase('capturing');
        const canvas = document.querySelector('.canvas-wrap canvas') as HTMLCanvasElement | null;
        if (!canvas) throw new Error('Canvas element not found.');
        if (typeof canvas.captureStream !== 'function') {
          throw new Error('Canvas video capture is not supported by this browser.');
        }

        const mimeType = getRecordingMimeType(type);
        const stream = canvas.captureStream(exportFps);
        let recordedBlob: Blob;

        try {
          const recorder = new MediaRecorder(stream, { mimeType });
          recordedBlob = await new Promise<Blob>((resolve, reject) => {
            const recordedChunks: BlobPart[] = [];
            let settled = false;
            const finish = (callback: () => void) => {
              if (settled) return;
              settled = true;
              callback();
            };

            recorder.ondataavailable = (event) => {
              if (event.data.size > 0) recordedChunks.push(event.data);
            };
            recorder.onerror = () => finish(() => reject(new Error('Video recording failed.')));
            recorder.onstop = () => finish(() => resolve(new Blob(recordedChunks, { type: recorder.mimeType || mimeType })));

            void (async () => {
              try {
                flushSync(() => {
                  setCurrentFrameIndex(0);
                  setPlaybackProgress(0);
                  setExportProgress(0);
                });
                await waitForPaint();
                recorder.start();
                let nextSampleAt = performance.now();
                for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
                  const frameIndex = frames.length === 0 ? 0 : segmentIndex % frames.length;
                  for (let sampleIndex = 0; sampleIndex < samplesPerSegment; sampleIndex += 1) {
                    flushSync(() => {
                      setCurrentFrameIndex(frameIndex);
                      setPlaybackProgress(sampleIndex / samplesPerSegment);
                      setExportProgress(Math.round(((segmentIndex * samplesPerSegment + sampleIndex) / (segmentCount * samplesPerSegment)) * 50));
                    });
                    await waitForPaint();
                    nextSampleAt += exportFrameInterval;
                    const remainingDelay = nextSampleAt - performance.now();
                    if (remainingDelay > 0) await delay(remainingDelay);
                  }
                }
                recorder.stop();
              } catch (error) {
                finish(() => reject(error));
                if (recorder.state !== 'inactive') recorder.stop();
              }
            })();
          });
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }

        if (type === 'webm') {
          setExportProgress(100);
          downloadBlob(recordedBlob, `regatta-simulation-${Date.now()}.webm`);
        } else if (mimeType.startsWith('video/mp4')) {
          setExportProgress(100);
          downloadBlob(recordedBlob, `regatta-simulation-${Date.now()}.mp4`);
        } else {
          setExportProgress(60);
          setExportPhase('preparing');
          const { convertWebmToMp4, prepareVideoEncoder } = await import('../utils/mp4');
          await prepareVideoEncoder();
          setExportPhase('encoding');
          const mp4Blob = await convertWebmToMp4(recordedBlob, (progress) => {
            setExportProgress(60 + Math.round(progress * 35));
          });
          setExportProgress(100);
          downloadBlob(mp4Blob, `regatta-simulation-${Date.now()}.mp4`);
        }
      }
    } catch (error) {
      console.error('Export error: ', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      const exportLabel = type === 'gif' ? 'GIF' : type.toUpperCase();
      window.alert(`Could not export ${exportLabel}. ${message}`);
    } finally {
      setCurrentFrameIndex(originalFrame);
      setPlaybackProgress(originalProgress);
      setIsPlaybackSampling(false);
      setIsExporting(false);
      setExportType(null);
      setExportPhase('preparing');
    }
  };

  return { exportPhase, exportProgress, exportType, isExporting, triggerExport, triggerImageExport, triggerJsonExport };
}
