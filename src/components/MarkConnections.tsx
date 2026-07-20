import { Arrow, Line } from 'react-konva';
import type { Mark, MarkConnection } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import { getConnectionPoints } from '../utils/markConnections';

const CONNECTION_LINE_DASH: Record<NonNullable<MarkConnection['style']>, number[] | undefined> = {
  dotted: [4, 6],
  dashed: [12, 6],
  solid: undefined,
};

interface MarkConnectionsProps {
  marks: Mark[];
  connections?: MarkConnection[];
  isShadow?: boolean;
  highlightMarkId?: string | null;
  selectedConnectionId?: string | null;
  interactive?: boolean;
  onSelectConnection?: (connectionId: string) => void;
  onOpenInspector?: (id: string, type: Exclude<SelectedType, null>) => void;
}

export default function MarkConnections({
  marks,
  connections = [],
  isShadow = false,
  highlightMarkId = null,
  selectedConnectionId = null,
  interactive = true,
  onSelectConnection,
  onOpenInspector,
}: MarkConnectionsProps) {
  return (
    <>
      {connections.flatMap((connection) => {
        const points = getConnectionPoints(connection, marks);
        if (!points) return [];

        const [start, end] = points;
        const isHighlighted = interactive && !isShadow && (
          highlightMarkId === connection.start.markId ||
          highlightMarkId === connection.end.markId
        );
        const isSelected = interactive && !isShadow && selectedConnectionId === connection.id;
        const stroke = isShadow ? '#94a3b8' : connection.color ?? '#38bdf8';
        const commonProps = {
          points: [start.x, start.y, end.x, end.y],
          stroke,
          fill: stroke,
          strokeWidth: isSelected ? 3.5 : isHighlighted ? 2.5 : 1.5,
          dash: CONNECTION_LINE_DASH[connection.style ?? 'dotted'],
          opacity: isShadow ? 0.22 : 1,
          listening: interactive && !isShadow,
          hitStrokeWidth: 14,
          onClick: interactive && !isShadow ? () => onSelectConnection?.(connection.id) : undefined,
          onTap: interactive && !isShadow ? () => onSelectConnection?.(connection.id) : undefined,
          onDblClick: interactive && !isShadow ? () => onOpenInspector?.(connection.id, 'connection') : undefined,
          onDblTap: interactive && !isShadow ? () => onOpenInspector?.(connection.id, 'connection') : undefined,
        };

        const element = connection.arrowhead === false
          ? <Line key={`conn-${connection.id}`} {...commonProps} />
          : <Arrow key={`conn-${connection.id}`} {...commonProps} pointerLength={12} pointerWidth={10} />;

        return [element];
      })}
    </>
  );
}
