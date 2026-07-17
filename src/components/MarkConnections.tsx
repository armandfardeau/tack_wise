import { Line } from 'react-konva';
import type { Mark } from '../types';

const CONNECTION_LINE_DASH: Record<NonNullable<Mark['connectionLineStyle']>, number[] | undefined> = {
  dotted: [4, 6],
  dashed: [12, 6],
  solid: undefined,
};

interface MarkConnectionsProps {
  marks: Mark[];
  isShadow?: boolean;
  highlightMarkId?: string | null;
}

export default function MarkConnections({
  marks,
  isShadow = false,
  highlightMarkId = null,
}: MarkConnectionsProps) {
  const markById = new Map(marks.map((mark) => [mark.id, mark]));

  return (
    <>
      {marks.flatMap((mark) => {
        if (!mark.connectedToMarkId) return [];

        const target = markById.get(mark.connectedToMarkId);
        if (!target) return [];

        const isHighlighted =
          !isShadow && (highlightMarkId === mark.id || highlightMarkId === target.id);

        return [
          <Line
            key={`conn-${mark.id}-${target.id}`}
            points={[mark.x, mark.y, target.x, target.y]}
            stroke={isShadow ? '#94a3b8' : mark.connectionLineColor ?? mark.color}
            strokeWidth={isHighlighted ? 2.5 : 1.5}
            dash={CONNECTION_LINE_DASH[mark.connectionLineStyle ?? 'dotted']}
            opacity={isShadow ? 0.22 : 1}
            listening={false}
          />,
        ];
      })}
    </>
  );
}
