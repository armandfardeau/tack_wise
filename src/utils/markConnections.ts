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

  return {
    ...frame,
    marks: frame.marks.map(stripLegacyMarkConnections),
    connections,
  };
}

export function getMarkConnectionRadius(mark: Pick<Mark, 'shape' | 'size'>): number {
  const markSize = mark.size ?? 28;

  switch (mark.shape) {
    case 'gate':
    case 'committeeBoat':
      return markSize + 6;
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

export function getMarkConnectionPoint(mark: Mark, anchor: ConnectionPoint): ConnectionPoint {
  const localPoint = {
    x: anchor.x * getMarkConnectionRadius(mark),
    y: anchor.y * getMarkConnectionRadius(mark),
  };
  const rotatedPoint = rotatePoint(localPoint, mark.rotation ?? 0);

  return {
    x: mark.x + rotatedPoint.x,
    y: mark.y + rotatedPoint.y,
  };
}

export function getMarkConnectionAnchor(mark: Mark, point: ConnectionPoint): ConnectionPoint {
  const relativePoint = { x: point.x - mark.x, y: point.y - mark.y };
  const localPoint = rotatePoint(relativePoint, -(mark.rotation ?? 0));
  const radius = getMarkConnectionRadius(mark);

  return {
    x: Math.max(-1.5, Math.min(1.5, localPoint.x / radius)),
    y: Math.max(-1.5, Math.min(1.5, localPoint.y / radius)),
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
    x: sourceMark.x + unitDirection.x * getMarkConnectionRadius(sourceMark),
    y: sourceMark.y + unitDirection.y * getMarkConnectionRadius(sourceMark),
  };
  const endPoint = {
    x: targetMark.x - unitDirection.x * getMarkConnectionRadius(targetMark),
    y: targetMark.y - unitDirection.y * getMarkConnectionRadius(targetMark),
  };

  return {
    start: getMarkConnectionAnchor(sourceMark, startPoint),
    end: getMarkConnectionAnchor(targetMark, endPoint),
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
