import { useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { Frame } from '../types';
import { downloadBlob, exportToGif } from '../utils/exporter';

interface UseScenarioExportProps {
  currentFrameIndex: number;
  frames: Frame[];
  playSpeed: number;
  setCurrentFrameIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
}

export function useScenarioExport({
  currentFrameIndex,
  frames,
  playSpeed,
  setCurrentFrameIndex,
  setIsPlaying,
  stageRef,
  stageSize,
}: UseScenarioExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'gif' | 'mp4' | null>(null);

  const triggerExport = async (type: 'gif' | 'mp4') => {
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

        const stream = canvas.captureStream(20);
        const recordedChunks: BlobPart[] = [];
        const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? { mimeType: 'video/webm;codecs=vp9' }
          : MediaRecorder.isTypeSupported('video/webm')
            ? { mimeType: 'video/webm' }
            : { mimeType: '' };
        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunks.push(event.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'video/webm' });
          downloadBlob(blob, `regatta-simulation-${Date.now()}.webm`);
        };

        setCurrentFrameIndex(0);
        await delay(300);
        recorder.start();
        for (let index = 0; index < frames.length; index += 1) {
          setCurrentFrameIndex(index);
          setExportProgress(Math.round((index / frames.length) * 100));
          await delay(playSpeed);
        }
        recorder.stop();
      }
    } catch (error) {
      console.error('Export error: ', error);
      window.alert('Could not export canvas. Please try again.');
    } finally {
      setCurrentFrameIndex(originalFrame);
      setIsExporting(false);
      setExportType(null);
    }
  };

  return { exportProgress, exportType, isExporting, triggerExport };
}
