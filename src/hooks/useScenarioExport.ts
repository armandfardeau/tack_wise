import { useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { Frame, ScenarioSettings, VideoExportType } from '../types';
import { dataUrlToBlob, downloadBlob, downloadScenarioJson, exportToGif } from '../utils/exporter';
import { convertWebmToMp4 } from '../utils/mp4';

interface UseScenarioExportProps {
  currentFrameIndex: number;
  frames: Frame[];
  playSpeed: number;
  setCurrentFrameIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  settings: ScenarioSettings;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
}

export function useScenarioExport({
  currentFrameIndex,
  frames,
  playSpeed,
  setCurrentFrameIndex,
  setIsPlaying,
  settings,
  stageRef,
  stageSize,
}: UseScenarioExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'gif' | VideoExportType | null>(null);

  const triggerJsonExport = (exportFrames: Frame[], exportCurrentFrameIndex: number) => {
    downloadScenarioJson(exportFrames, exportCurrentFrameIndex, settings);
  };

  const triggerImageExport = (type: 'png' | 'jpeg') => {
    const stage = stageRef.current;
    if (!stage) return;

    const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = stage.toDataURL({ pixelRatio: 1.5, mimeType });
    downloadBlob(dataUrlToBlob(dataUrl), `tack-wise-diagram-${Date.now()}.${type === 'png' ? 'png' : 'jpg'}`);
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

  const triggerExport = async (type: 'gif' | VideoExportType) => {
    setIsPlaying(false);
    setIsExporting(true);
    setExportType(type);
    setExportProgress(0);

    const originalFrame = currentFrameIndex;
    const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    const waitForPaint = () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      });

    try {
      if (type === 'gif') {
        const capturedImages: string[] = [];
        for (let index = 0; index < frames.length; index += 1) {
          flushSync(() => {
            setCurrentFrameIndex(index);
            setExportProgress(Math.round((index / frames.length) * 50));
          });
          await waitForPaint();

          const stage = stageRef.current;
          if (!stage) throw new Error('Canvas stage not found.');
          stage.draw();
          capturedImages.push(stage.toDataURL({ pixelRatio: 1.5 }));
        }

        setExportProgress(60);
        const gifBlob = await exportToGif(capturedImages, playSpeed / 1000, stageSize.width, stageSize.height);
        setExportProgress(90);
        downloadBlob(gifBlob, `regatta-simulation-${Date.now()}.gif`);
      } else {
        const canvas = document.querySelector('.canvas-wrap canvas') as HTMLCanvasElement | null;
        if (!canvas) throw new Error('Canvas element not found.');
        if (typeof canvas.captureStream !== 'function') {
          throw new Error('Canvas video capture is not supported by this browser.');
        }

        const mimeType = getRecordingMimeType(type);
        const stream = canvas.captureStream(20);
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
                  setExportProgress(0);
                });
                await waitForPaint();
                recorder.start();
                for (let index = 0; index < frames.length; index += 1) {
                  if (index > 0) {
                    flushSync(() => {
                      setCurrentFrameIndex(index);
                      setExportProgress(Math.round((index / Math.max(frames.length - 1, 1)) * 50));
                    });
                    await waitForPaint();
                  }
                  await delay(playSpeed);
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
      setIsExporting(false);
      setExportType(null);
    }
  };

  return { exportProgress, exportType, isExporting, triggerExport, triggerImageExport, triggerJsonExport };
}
