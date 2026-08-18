import type { ExportQuality } from '../types';

export interface ExportQualityPreset {
  label: string;
  fps: number;
  pixelRatio: number;
  gifSampleInterval: number;
  videoBitsPerSecond?: number;
  mp4Crf: number;
  mp4Preset: string;
  webmCrf: number;
  webmDeadline: string;
  webmCpuUsed: number;
}

export const DEFAULT_EXPORT_QUALITY: ExportQuality = 'standard';

export const EXPORT_QUALITY_PRESETS: Record<ExportQuality, ExportQualityPreset> = {
  fast: {
    label: 'Fast (10 FPS)',
    fps: 10,
    pixelRatio: 1,
    gifSampleInterval: 20,
    mp4Crf: 23,
    mp4Preset: 'veryfast',
    webmCrf: 32,
    webmDeadline: 'realtime',
    webmCpuUsed: 5,
  },
  standard: {
    label: 'Standard (15 FPS)',
    fps: 15,
    pixelRatio: 1,
    gifSampleInterval: 10,
    mp4Crf: 23,
    mp4Preset: 'veryfast',
    webmCrf: 32,
    webmDeadline: 'realtime',
    webmCpuUsed: 5,
  },
  high: {
    label: 'High (20 FPS)',
    fps: 20,
    pixelRatio: 2,
    gifSampleInterval: 5,
    videoBitsPerSecond: 12_000_000,
    mp4Crf: 18,
    mp4Preset: 'medium',
    webmCrf: 24,
    webmDeadline: 'good',
    webmCpuUsed: 2,
  },
};
