import type { ExportQuality } from '../types';

export interface ExportQualityPreset {
  label: string;
  fps: number;
  gifPixelRatio: number;
  gifSampleInterval: number;
}

export const DEFAULT_EXPORT_QUALITY: ExportQuality = 'standard';

export const EXPORT_QUALITY_PRESETS: Record<ExportQuality, ExportQualityPreset> = {
  fast: {
    label: 'Fast (10 FPS)',
    fps: 10,
    gifPixelRatio: 1,
    gifSampleInterval: 20,
  },
  standard: {
    label: 'Standard (15 FPS)',
    fps: 15,
    gifPixelRatio: 1,
    gifSampleInterval: 10,
  },
  high: {
    label: 'High (20 FPS)',
    fps: 20,
    gifPixelRatio: 1.5,
    gifSampleInterval: 5,
  },
};
