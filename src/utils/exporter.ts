import gifshot from 'gifshot';
import type {
  Boat,
  CommentNote,
  DiagramImage,
  Frame,
  Mark,
  RuleReference,
  ScenarioExportPayload,
  ScenarioSettings,
  TacticalArrow,
} from '../types';

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

export function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, encoded] = dataUrl.split(',');
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] ?? 'application/octet-stream';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

export function serializeScenarioToJson(
  frames: Frame[],
  currentFrameIndex: number,
  settings?: ScenarioSettings,
): string {
  const payload: ScenarioExportPayload = {
    version: settings ? 2 : 1,
    frames,
    currentFrameIndex,
    ...(settings ? { settings } : {}),
  };

  return JSON.stringify(payload, null, 2);
}

export function downloadScenarioJson(frames: Frame[], currentFrameIndex: number, settings?: ScenarioSettings) {
  const blob = new Blob([serializeScenarioToJson(frames, currentFrameIndex, settings)], {
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
    (value.shape === 'circle' || value.shape === 'triangle' || value.shape === 'square' || value.shape === 'obstruction' || value.shape === 'gate') &&
    (value.size === undefined || isFiniteNumber(value.size)) &&
    (value.showRotationArrow === undefined || typeof value.showRotationArrow === 'boolean') &&
    (value.rotationDirection === undefined || value.rotationDirection === 'clockwise' || value.rotationDirection === 'counterclockwise') &&
    (value.connectedToMarkId === undefined || value.connectedToMarkId === null || typeof value.connectedToMarkId === 'string') &&
    (value.connectionLineColor === undefined || typeof value.connectionLineColor === 'string') &&
    (value.connectionLineStyle === undefined || value.connectionLineStyle === 'dotted' || value.connectionLineStyle === 'dashed' || value.connectionLineStyle === 'solid')
  );
}

function isPoint(value: unknown): value is { x: number; y: number } {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isArrow(value: unknown): value is TacticalArrow {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    Array.isArray(value.points) &&
    value.points.length >= 2 &&
    value.points.every(isPoint) &&
    (value.curved === undefined || typeof value.curved === 'boolean') &&
    (value.lineStyle === undefined || ['dotted', 'dashed', 'solid'].includes(value.lineStyle as string)) &&
    (value.lineWidth === undefined || isFiniteNumber(value.lineWidth)) &&
    (value.showArrowhead === undefined || typeof value.showArrowhead === 'boolean')
  );
}

function isComment(value: unknown): value is CommentNote {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.text === 'string' &&
    typeof value.color === 'string' &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    (value.width === undefined || isFiniteNumber(value.width)) &&
    (value.fontSize === undefined || isFiniteNumber(value.fontSize))
  );
}

function isImage(value: unknown): value is DiagramImage {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.src === 'string' &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    (value.rotation === undefined || isFiniteNumber(value.rotation))
  );
}

function isRule(value: unknown): value is RuleReference {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    (value.description === undefined || typeof value.description === 'string') &&
    (value.url === undefined || typeof value.url === 'string')
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
    value.marks.every(isMark) &&
    (value.arrows === undefined || (Array.isArray(value.arrows) && value.arrows.every(isArrow))) &&
    (value.comments === undefined || (Array.isArray(value.comments) && value.comments.every(isComment))) &&
    (value.images === undefined || (Array.isArray(value.images) && value.images.every(isImage))) &&
    (value.rules === undefined || (Array.isArray(value.rules) && value.rules.every(isRule)))
  );
}

function isScenarioSettings(value: unknown): boolean {
  if (!isRecord(value)) return false;

  return (
    (value.title === undefined || typeof value.title === 'string') &&
    (value.displayMode === 'single' || value.displayMode === 'cumulative') &&
    typeof value.presenterMode === 'boolean' &&
    (value.showFrameTitle === undefined || typeof value.showFrameTitle === 'boolean') &&
    (value.showFrameNumber === undefined || typeof value.showFrameNumber === 'boolean')
  );
}

function isScenarioExportPayload(value: unknown): value is ScenarioExportPayload {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2) || !Array.isArray(value.frames)) return false;

  const currentFrameIndex = value.currentFrameIndex;

  return (
    value.frames.length > 0 &&
    value.frames.every(isFrame) &&
    typeof currentFrameIndex === 'number' &&
    Number.isInteger(currentFrameIndex) &&
    currentFrameIndex >= 0 &&
    currentFrameIndex < value.frames.length &&
    (value.settings === undefined || isScenarioSettings(value.settings))
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

function encodeBase64Url(value: string) {
  const binary = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const encoded = Array.from(binary, (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
  return decodeURIComponent(encoded);
}

export function createScenarioShareUrl(payload: ScenarioExportPayload, baseUrl = window.location.href) {
  const url = new URL(baseUrl);
  url.hash = `scenario=${encodeBase64Url(JSON.stringify(payload))}`;
  return url.toString();
}

export function parseScenarioShareUrl(urlValue = window.location.href): ScenarioExportPayload | null {
  try {
    const url = new URL(urlValue);
    const encoded = new URLSearchParams(url.hash.replace(/^#/, '')).get('scenario');
    if (!encoded) return null;
    return parseScenarioFromJson(decodeBase64Url(encoded));
  } catch {
    return null;
  }
}
