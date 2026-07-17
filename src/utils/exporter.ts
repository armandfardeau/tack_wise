import gifshot from 'gifshot';
import type { Boat, Frame, Mark, ScenarioExportPayload } from '../types';

// Client-side export helper for Tactical Sailing Simulator

export function exportToGif(
  images: string[],
  frameDelay: number, // in seconds (e.g. 0.5s for 500ms)
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    gifshot.createGIF(
      {
        images: images,
        interval: frameDelay,
        gifWidth: width,
        gifHeight: height,
        numWorkers: 2,
        sampleInterval: 10,
      },
      (obj: any) => {
        if (!obj.error) {
          // Convert dataURL to Blob
          const base64 = obj.image.split(',')[1];
          const binary = atob(base64);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          const blob = new Blob([new Uint8Array(array)], { type: 'image/gif' });
          resolve(blob);
        } else {
          reject(new Error(obj.errorMsg || 'Failed to create GIF'));
        }
      }
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function serializeScenarioToJson(frames: Frame[], currentFrameIndex: number): string {
  const payload: ScenarioExportPayload = {
    version: 1,
    frames,
    currentFrameIndex,
  };

  return JSON.stringify(payload, null, 2);
}

export function downloadScenarioJson(frames: Frame[], currentFrameIndex: number) {
  const blob = new Blob([serializeScenarioToJson(frames, currentFrameIndex)], {
    type: 'application/json',
  });

  downloadBlob(blob, `tack-wise-scenario-${Date.now()}.json`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoat(value: unknown): value is Boat {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.heading) &&
    isFiniteNumber(value.sailAngle) &&
    (value.showHeadingLine === undefined || typeof value.showHeadingLine === 'boolean')
  );
}

function isMark(value: unknown): value is Mark {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    (value.shape === 'circle' || value.shape === 'triangle' || value.shape === 'square') &&
    (value.showRotationArrow === undefined || typeof value.showRotationArrow === 'boolean') &&
    (value.rotationDirection === undefined || value.rotationDirection === 'clockwise' || value.rotationDirection === 'counterclockwise') &&
    (value.connectedToMarkId === undefined || value.connectedToMarkId === null || typeof value.connectedToMarkId === 'string') &&
    (value.connectionLineColor === undefined || typeof value.connectionLineColor === 'string') &&
    (value.connectionLineStyle === undefined || value.connectionLineStyle === 'dotted' || value.connectionLineStyle === 'dashed' || value.connectionLineStyle === 'solid')
  );
}

function isFrame(value: unknown): value is Frame {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.windAngle) &&
    isFiniteNumber(value.windSpeed) &&
    Array.isArray(value.boats) &&
    value.boats.every(isBoat) &&
    Array.isArray(value.marks) &&
    value.marks.every(isMark)
  );
}

function isScenarioExportPayload(value: unknown): value is ScenarioExportPayload {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.frames)) return false;

  const currentFrameIndex = value.currentFrameIndex;

  return (
    value.frames.length > 0 &&
    value.frames.every(isFrame) &&
    typeof currentFrameIndex === 'number' &&
    Number.isInteger(currentFrameIndex) &&
    currentFrameIndex >= 0 &&
    currentFrameIndex < value.frames.length
  );
}

export function parseScenarioFromJson(json: string): ScenarioExportPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!isScenarioExportPayload(parsed)) {
    throw new Error('The selected file is not a valid Tack Wise scenario export.');
  }

  return parsed;
}
