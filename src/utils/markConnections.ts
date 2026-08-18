import type { Frame, Mark, MarkConnection, MarkConnectionEndpoint } from '../types';

export interface ConnectionPoint {
  x: number;
  y: number;
}

export function getMarkConnectionIds(mark: Pick<Mark, 'id' | 'connectedToMarkId' | 'connectedToMarkIds'>): string[] {
  const ids = [
    ...(mark.connectedToMarkIds ?? []),
    ...(mark.connectedToMarkId ? [mark.connectedToMarkId] : []),
  ];

  return Array.from(new Set(ids.filter((id) => id && id !== mark.id)));
}

function stripLegacyMarkConnections(mark: Mark): Mark {
  const {
    connectedToMarkId: _legacyConnectedToMarkId,
    connectedToMarkIds: _legacyConnectedToMarkIds,
    ...markWithoutLegacyConnectionFields
  } = mark;

  return markWithoutLegacyConnectionFields;
}

function cloneEndpoint(endpoint: MarkConnectionEndpoint): MarkConnectionEndpoint {
  return {
    markId: endpoint.markId,
    anchor: { x: endpoint.anchor.x, y: endpoint.anchor.y },
  };
}

function connectionEndpointKey(connection: Pick<MarkConnection, 'start' | 'end'>) {
  return `${connection.start.markId}->${connection.end.markId}`;
}

function legacyConnectionId(sourceMarkId: string, targetMarkId: string) {
  return `mark-connection-${sourceMarkId}-${targetMarkId}`;
}

/** Converts old mark-owned target fields into canonical frame-owned connections. */
export function normalizeFrameConnections(frame: Frame): Frame {
  const connections: MarkConnection[] = [];
  const seenEndpoints = new Set<string>();

  for (const connection of frame.connections ?? []) {
    if (!connection.id || !connection.start?.markId || !connection.end?.markId || connection.start.markId === connection.end.markId) continue;

    const key = connectionEndpointKey(connection);
    if (seenEndpoints.has(key)) continue;

    seenEndpoints.add(key);
    connections.push({
      ...connection,
      start: cloneEndpoint(connection.start),
      end: cloneEndpoint(connection.end),
    });
  }

  for (const sourceMark of frame.marks) {
    for (const targetMarkId of getMarkConnectionIds(sourceMark)) {
      const targetMark = frame.marks.find((mark) => mark.id === targetMarkId);
      const anchors = targetMark
        ? getMarkConnectionAnchors(sourceMark, targetMark)
        : { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
      const legacyConnection: MarkConnection = {
        id: legacyConnectionId(sourceMark.id, targetMarkId),
        start: { markId: sourceMark.id, anchor: anchors.start },
        end: { markId: targetMarkId, anchor: anchors.end },
        color: sourceMark.connectionLineColor ?? sourceMark.color,
        style: sourceMark.connectionLineStyle ?? 'dotted',
        arrowhead: false,
      };
      const key = connectionEndpointKey(legacyConnection);
      if (seenEndpoints.has(key)) continue;

      seenEndpoints.add(key);
      connections.push(legacyConnection);
    }
  }

  const normalizedFrame = {
    ...frame,
    marks: frame.marks.map(stripLegacyMarkConnections),
    connections,
  };

  return reanchorFrameConnections(normalizedFrame);
}

export function getMarkConnectionRadius(mark: Pick<Mark, 'shape' | 'size'>): number {
  const markSize = mark.size ?? 28;

  switch (mark.shape) {
    case 'gate':
      return markSize * 5 / 6;
    case 'committeeBoat':
      return markSize;
    default:
      return markSize / 2;
  }
}

export function getMarkConnectionHandleOffset(mark: Pick<Mark, 'shape' | 'size'>): number {
  return getMarkConnectionRadius(mark) + 14;
}

function rotatePoint(point: ConnectionPoint, degrees: number): ConnectionPoint {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function getRectangleBoundary(direction: ConnectionPoint, halfWidth: number, halfHeight: number): ConnectionPoint {
  const scale = Math.max(
    Math.abs(direction.x) / halfWidth,
    Math.abs(direction.y) / halfHeight,
  );

  return scale === 0
    ? { x: 0, y: 0 }
    : { x: direction.x / scale, y: direction.y / scale };
}

/** Returns the visible mark boundary in mark-local coordinates. */
function getMarkConnectionBoundaryPoint(mark: Pick<Mark, 'shape' | 'size'>, direction: ConnectionPoint): ConnectionPoint {
  const markSize = mark.size ?? 28;
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) return { x: 0, y: 0 };

  switch (mark.shape) {
    case 'square':
      return getRectangleBoundary(direction, markSize / 2, markSize / 2);
    case 'gate':
      // The gate consists of a line from -size to size and circles at +/-size/2.
      return getRectangleBoundary(direction, markSize * 5 / 6, markSize / 3);
    case 'committeeBoat':
      // Include the hull, mast, and flag in the connection hit boundary.
      return getRectangleBoundary(direction, markSize, markSize * 0.95);
    case 'triangle': {
      // A regular triangle is approximated by its circumscribed circle for now;
      // unlike gates, its rendered and connection extents share the same scale.
      const radius = markSize / 2;
      return { x: direction.x * radius / length, y: direction.y * radius / length };
    }
    case 'circle':
    case 'obstruction':
    default: {
      const radius = markSize / 2;
      return { x: direction.x * radius / length, y: direction.y * radius / length };
    }
  }
}

export function getMarkConnectionPoint(mark: Mark, anchor: ConnectionPoint): ConnectionPoint {
  const localPoint = getMarkConnectionBoundaryPoint(mark, anchor);
  const rotatedPoint = rotatePoint(localPoint, mark.rotation ?? 0);

  return {
    x: mark.x + rotatedPoint.x,
    y: mark.y + rotatedPoint.y,
  };
}

export function getMarkConnectionAnchor(mark: Mark, point: ConnectionPoint): ConnectionPoint {
  const relativePoint = { x: point.x - mark.x, y: point.y - mark.y };
  const localPoint = rotatePoint(relativePoint, -(mark.rotation ?? 0));
  const length = Math.hypot(localPoint.x, localPoint.y);
  if (length === 0) return { x: 0, y: 0 };

  return {
    x: Math.max(-1.5, Math.min(1.5, localPoint.x / length)),
    y: Math.max(-1.5, Math.min(1.5, localPoint.y / length)),
  };
}

export function getMarkConnectionAnchors(sourceMark: Mark, targetMark: Mark): {
  start: ConnectionPoint;
  end: ConnectionPoint;
} {
  const direction = { x: targetMark.x - sourceMark.x, y: targetMark.y - sourceMark.y };
  const distance = Math.hypot(direction.x, direction.y);
  if (distance === 0) return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };

  const unitDirection = { x: direction.x / distance, y: direction.y / distance };
  const startPoint = {
    x: sourceMark.x + unitDirection.x,
    y: sourceMark.y + unitDirection.y,
  };
  const endPoint = {
    x: targetMark.x - unitDirection.x,
    y: targetMark.y - unitDirection.y,
  };

  return {
    start: getMarkConnectionAnchor(sourceMark, startPoint),
    end: getMarkConnectionAnchor(targetMark, endPoint),
  };
}

export function reanchorFrameConnections(frame: Frame): Frame {
  const markById = new Map(frame.marks.map((mark) => [mark.id, mark]));

  return {
    ...frame,
    connections: (frame.connections ?? []).map((connection) => {
      const sourceMark = markById.get(connection.start.markId);
      const targetMark = markById.get(connection.end.markId);
      if (!sourceMark || !targetMark) return connection;

      const anchors = getMarkConnectionAnchors(sourceMark, targetMark);
      return {
        ...connection,
        start: { ...connection.start, anchor: anchors.start },
        end: { ...connection.end, anchor: anchors.end },
      };
    }),
  };
}

export function getConnectionPoints(connection: MarkConnection, marks: Mark[]): [ConnectionPoint, ConnectionPoint] | null {
  const markById = new Map(marks.map((mark) => [mark.id, mark]));
  const startMark = markById.get(connection.start.markId);
  const endMark = markById.get(connection.end.markId);
  if (!startMark || !endMark) return null;

  return [
    getMarkConnectionPoint(startMark, connection.start.anchor),
    getMarkConnectionPoint(endMark, connection.end.anchor),
  ];
}
