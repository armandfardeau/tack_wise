import { render } from '@testing-library/react';
import MarkConnections from '../src/components/MarkConnections';
import { getConnectionPoints, getMarkConnectionAnchors, normalizeFrameConnections, reanchorFrameConnections } from '../src/utils/markConnections';
import type { Frame, Mark, MarkConnection } from '../src/types';

jest.mock('react-konva', () => ({
  Line: ({ points, ...props }: { points: number[]; [key: string]: unknown }) => (
    <div data-testid="connection-line" data-points={JSON.stringify(points)} {...props} />
  ),
  Arrow: ({ points, ...props }: { points: number[]; [key: string]: unknown }) => (
    <div data-testid="connection-line" data-points={JSON.stringify(points)} {...props} />
  ),
}));

const marks: Mark[] = [
  { id: 'mark-a', name: 'A', color: '#fff', x: 10, y: 20, shape: 'circle' },
  { id: 'mark-b', name: 'B', color: '#000', x: 30, y: 40, shape: 'circle' },
  { id: 'mark-c', name: 'C', color: '#f00', x: 50, y: 60, shape: 'circle' },
];

const connections: MarkConnection[] = [
  { id: 'connection-a-b', start: { markId: 'mark-a', anchor: { x: 0, y: 0 } }, end: { markId: 'mark-b', anchor: { x: 0, y: 0 } } },
  { id: 'connection-a-c', start: { markId: 'mark-a', anchor: { x: 0, y: 0 } }, end: { markId: 'mark-c', anchor: { x: 0, y: 0 } } },
  { id: 'connection-a-missing', start: { markId: 'mark-a', anchor: { x: 0, y: 0 } }, end: { markId: 'missing', anchor: { x: 0, y: 0 } } },
];

describe('MarkConnections', () => {
  it('renders one line for each valid target connection', () => {
    const { getAllByTestId } = render(<MarkConnections marks={marks} connections={connections} />);

    expect(getAllByTestId('connection-line')).toHaveLength(2);
    expect(getAllByTestId('connection-line').map((line) => line.getAttribute('data-points'))).toEqual([
      JSON.stringify([10, 20, 30, 40]),
      JSON.stringify([10, 20, 50, 60]),
    ]);
  });

  it('migrates legacy target fields into relative two-point connections', () => {
    const legacyFrame: Frame = {
      id: 'frame-legacy',
      name: 'Legacy',
      windAngle: 0,
      windSpeed: 12,
      boats: [],
      marks: [
        { id: 'mark-a', name: 'A', color: '#fff', x: 10, y: 20, shape: 'circle', connectedToMarkIds: ['mark-b'], connectedToMarkId: 'mark-c' },
        marks[1],
        marks[2],
      ],
    };

    const normalized = normalizeFrameConnections(legacyFrame);
    expect(normalized.connections).toEqual([
      expect.objectContaining({ start: expect.objectContaining({ markId: 'mark-a' }), end: expect.objectContaining({ markId: 'mark-b' }) }),
      expect.objectContaining({ start: expect.objectContaining({ markId: 'mark-a' }), end: expect.objectContaining({ markId: 'mark-c' }) }),
    ]);
    expect(normalized.connections?.every((connection) => (
      connection.start.anchor.x !== 0 || connection.start.anchor.y !== 0
        || connection.end.anchor.x !== 0 || connection.end.anchor.y !== 0
    ))).toBe(true);
    expect(normalized.connections?.every((connection) => connection.arrowhead === false)).toBe(true);
    expect(normalized.marks[0].connectedToMarkIds).toBeUndefined();
  });

  it('only renders an arrowhead when explicitly enabled', () => {
    const { getAllByTestId } = render(
      <MarkConnections
        marks={marks}
        connections={[connections[0], { ...connections[1], arrowhead: true }]}
      />,
    );

    expect(getAllByTestId('connection-line')[0]).not.toHaveAttribute('pointerLength');
    expect(getAllByTestId('connection-line')[1]).toHaveAttribute('pointerLength', '12');
  });

  it('renders endpoints from mark-relative anchors', () => {
    const relativeConnections: MarkConnection[] = [{
      id: 'relative-connection',
      start: { markId: 'mark-a', anchor: { x: 1, y: 0 } },
      end: { markId: 'mark-b', anchor: { x: -1, y: 0 } },
    }];

    const { getByTestId } = render(<MarkConnections marks={marks} connections={relativeConnections} />);

    expect(getByTestId('connection-line').getAttribute('data-points')).toBe(JSON.stringify([24, 20, 16, 40]));
  });

  it('attaches a gate connection to the visible gate boundary', () => {
    const gate: Mark = { id: 'gate', name: 'Gate', color: '#fff', x: 0, y: 0, shape: 'gate', size: 28 };
    const mark: Mark = { id: 'mark', name: 'Mark', color: '#000', x: 60, y: 0, shape: 'circle', size: 28 };
    const connection: MarkConnection = {
      id: 'gate-connection',
      start: { markId: gate.id, anchor: getMarkConnectionAnchors(gate, mark).start },
      end: { markId: mark.id, anchor: getMarkConnectionAnchors(gate, mark).end },
    };

    expect(getConnectionPoints(connection, [gate, mark])).toEqual([
      { x: 28 * 5 / 6, y: 0 },
      { x: 46, y: 0 },
    ]);
  });

  it('uses rotated mark-local geometry for connection endpoints', () => {
    const source: Mark = { id: 'source', name: 'Source', color: '#fff', x: 0, y: 0, shape: 'square', size: 20, rotation: 45 };
    const target: Mark = { id: 'target', name: 'Target', color: '#000', x: 40, y: 0, shape: 'circle', size: 20 };
    const anchors = getMarkConnectionAnchors(source, target);
    const points = getConnectionPoints({
      id: 'rotated-connection',
      start: { markId: source.id, anchor: anchors.start },
      end: { markId: target.id, anchor: anchors.end },
    }, [source, target]);

    expect(points?.[0].x).toBeCloseTo(10 * Math.sqrt(2));
    expect(points?.[0].y).toBeCloseTo(0);
    expect(points?.[1]).toEqual({ x: 30, y: 0 });
  });

  it('reanchors existing connections when a mark changes size or position', () => {
    const frame: Frame = {
      id: 'frame',
      name: 'Frame',
      windAngle: 0,
      windSpeed: 0,
      boats: [],
      marks: [
        { id: 'source', name: 'Source', color: '#fff', x: 0, y: 0, shape: 'circle', size: 20 },
        { id: 'target', name: 'Target', color: '#000', x: 40, y: 0, shape: 'circle', size: 20 },
      ],
      connections: [{
        id: 'connection',
        start: { markId: 'source', anchor: { x: 0, y: 1 } },
        end: { markId: 'target', anchor: { x: 0, y: -1 } },
      }],
    };

    const reanchored = reanchorFrameConnections({
      ...frame,
      marks: frame.marks.map((mark) => mark.id === 'target' ? { ...mark, x: 80, size: 40 } : mark),
    });
    const points = getConnectionPoints(reanchored.connections![0], reanchored.marks);

    expect(points).toEqual([{ x: 10, y: 0 }, { x: 60, y: 0 }]);
  });
});
