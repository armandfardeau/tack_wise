import gifshot from 'gifshot';
import { cloneFrames } from '../data/initialFrames';
import type {
  Boat,
  DiagramImage,
  Frame,
  FrameComment,
  Mark,
  MarkConnection,
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
    frames: cloneFrames(frames),
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
    (value.shape === 'circle' || value.shape === 'triangle' || value.shape === 'square' || value.shape === 'obstruction' || value.shape === 'gate' || value.shape === 'committeeBoat') &&
    (value.size === undefined || isFiniteNumber(value.size)) &&
    (value.rotation === undefined || isFiniteNumber(value.rotation)) &&
    (value.proximityRadius === undefined || isFiniteNumber(value.proximityRadius)) &&
    (value.showRotationArrow === undefined || typeof value.showRotationArrow === 'boolean') &&
    (value.rotationDirection === undefined || value.rotationDirection === 'clockwise' || value.rotationDirection === 'counterclockwise') &&
    (value.connectedToMarkIds === undefined || (Array.isArray(value.connectedToMarkIds) && value.connectedToMarkIds.every((id) => typeof id === 'string'))) &&
    (value.connectedToMarkId === undefined || value.connectedToMarkId === null || typeof value.connectedToMarkId === 'string') &&
    (value.connectionLineColor === undefined || typeof value.connectionLineColor === 'string') &&
    (value.connectionLineStyle === undefined || value.connectionLineStyle === 'dotted' || value.connectionLineStyle === 'dashed' || value.connectionLineStyle === 'solid')
  );
}

function isConnectionEndpoint(value: unknown): value is MarkConnection['start'] {
  return isRecord(value)
    && typeof value.markId === 'string'
    && isRecord(value.anchor)
    && isFiniteNumber(value.anchor.x)
    && isFiniteNumber(value.anchor.y);
}

function isMarkConnection(value: unknown): value is MarkConnection {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    isConnectionEndpoint(value.start) &&
    isConnectionEndpoint(value.end) &&
    (value.color === undefined || typeof value.color === 'string') &&
    (value.style === undefined || value.style === 'dotted' || value.style === 'dashed' || value.style === 'solid') &&
    (value.arrowhead === undefined || typeof value.arrowhead === 'boolean')
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

function isOffenseTarget(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.type === 'boat' || value.type === 'mark')
    && (value.color === undefined || typeof value.color === 'string');
}

function isComment(value: unknown): value is FrameComment {
  if (!isRecord(value)) return false;

  const commonFields = (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    (value.width === undefined || isFiniteNumber(value.width)) &&
    (value.fontSize === undefined || isFiniteNumber(value.fontSize))
  );

  if (!commonFields) return false;
  if (value.type === 'rule') {
    const hasRuleReferences = Array.isArray(value.rules)
      ? value.rules.length > 0 && value.rules.every(isRule)
      : isRule(value.rule);

    return hasRuleReferences
      && Array.isArray(value.offenseTargets)
      && value.offenseTargets.every(isOffenseTarget);
  }

  return (value.type === undefined || value.type === 'comment') && typeof value.text === 'string';
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
    (value.connections === undefined || (Array.isArray(value.connections) && value.connections.every(isMarkConnection))) &&
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

  return {
    ...parsed,
    frames: cloneFrames(parsed.frames),
  };
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

function encodeBinaryBase64Url(value: Uint8Array) {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBinaryBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function serializeSharePayload(payload: ScenarioExportPayload) {
  return JSON.stringify({ ...payload, frames: cloneFrames(payload.frames) });
}

function getScenarioShareValue(urlValue: string) {
  const url = new URL(urlValue);
  return new URLSearchParams(url.hash.replace(/^#/, '')).get('scenario');
}

export function createScenarioShareUrl(payload: ScenarioExportPayload, baseUrl = window.location.href) {
  const url = new URL(baseUrl);
  url.hash = `scenario=${encodeBase64Url(serializeSharePayload(payload))}`;
  return url.toString();
}

/**
 * Creates a smaller share URL for modern browsers. The synchronous creator above
 * remains available for compatibility with callers and older browsers.
 */
export async function createScenarioShareUrlAsync(payload: ScenarioExportPayload, baseUrl = window.location.href) {
  if (typeof CompressionStream === 'undefined') return createScenarioShareUrl(payload, baseUrl);

  try {
    const compressedStream = new Blob([serializeSharePayload(payload)])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(compressedStream).arrayBuffer());
    const url = new URL(baseUrl);
    url.hash = `scenario=gzip.${encodeBinaryBase64Url(compressed)}`;
    return url.toString();
  } catch {
    return createScenarioShareUrl(payload, baseUrl);
  }
}

export function parseScenarioShareUrl(urlValue = window.location.href): ScenarioExportPayload | null {
  try {
    const encoded = getScenarioShareValue(urlValue);
    if (!encoded || encoded.startsWith('gzip.')) return null;
    return parseScenarioFromJson(decodeBase64Url(encoded));
  } catch {
    return null;
  }
}

export async function parseScenarioShareUrlAsync(urlValue = window.location.href): Promise<ScenarioExportPayload | null> {
  try {
    const encoded = getScenarioShareValue(urlValue);
    if (!encoded) return null;
    if (!encoded.startsWith('gzip.')) return parseScenarioShareUrl(urlValue);
    if (typeof DecompressionStream === 'undefined') return null;

    const compressed = decodeBinaryBase64Url(encoded.slice('gzip.'.length));
    const decompressedStream = new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    const json = await new Response(decompressedStream).text();
    return parseScenarioFromJson(json);
  } catch {
    return null;
  }
}
