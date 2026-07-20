import { Arrow, Circle } from 'react-konva';
import type { TacticalArrow as TacticalArrowModel } from '../types';
import { ensureCurvedArrowControlPoint } from '../utils/arrows';

interface TacticalArrowProps {
  arrow: TacticalArrowModel;
  isSelected: boolean;
  onMove?: (id: string, points: TacticalArrowModel['points']) => void;
  onOpenInspector?: () => void;
  onSelect?: (id: string) => void;
  readOnly?: boolean;
  isShadow?: boolean;
}

const ARROW_HIT_STROKE_WIDTH = 24;

export default function TacticalArrow({ arrow, isSelected, onMove, onOpenInspector, onSelect, readOnly = false, isShadow = false }: TacticalArrowProps) {
  const isCurved = arrow.curved === true;
  const pathPoints = isCurved ? ensureCurvedArrowControlPoint(arrow.points) : arrow.points;
  const points = pathPoints.flatMap((point) => [point.x, point.y]);
  const color = isShadow ? '#94a3b8' : isSelected ? '#22d3ee' : arrow.color;

  return (
    <>
      <Arrow
        points={points}
        stroke={color}
        fill={color}
        strokeWidth={arrow.lineWidth ?? 3}
        hitStrokeWidth={Math.max(ARROW_HIT_STROKE_WIDTH, (arrow.lineWidth ?? 3) + 16)}
        dash={arrow.lineStyle === 'dotted' ? [3, 6] : arrow.lineStyle === 'dashed' ? [12, 6] : undefined}
        pointerLength={arrow.showArrowhead === false ? 0 : 12}
        pointerWidth={arrow.showArrowhead === false ? 0 : 10}
        tension={isCurved ? 0.45 : 0}
        opacity={isShadow ? 0.22 : 0.9}
        draggable={!isShadow && !readOnly}
        listening={!isShadow}
        onClick={() => {
          onSelect?.(arrow.id);
        }}
        onTap={() => {
          onSelect?.(arrow.id);
        }}
        onDblClick={() => onOpenInspector?.()}
        onDblTap={() => onOpenInspector?.()}
        onDragStart={readOnly ? undefined : () => onSelect?.(arrow.id)}
        onDragEnd={readOnly ? undefined : (event) => {
          const dx = event.target.x();
          const dy = event.target.y();
          event.target.position({ x: 0, y: 0 });
          onMove?.(arrow.id, pathPoints.map((point) => ({ x: point.x + dx, y: point.y + dy })));
        }}
      />
      {isSelected && isCurved && !isShadow && !readOnly && pathPoints.slice(1, -1).map((point, pointIndex) => {
        const pathPointIndex = pointIndex + 1;

        return (
          <Circle
            key={`${arrow.id}-control-${pathPointIndex}`}
            x={point.x}
            y={point.y}
            radius={8}
            fill={color}
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            onClick={() => {
              onSelect?.(arrow.id);
            }}
            onTap={() => {
              onSelect?.(arrow.id);
            }}
            onDragStart={(event) => {
              event.cancelBubble = true;
              onSelect?.(arrow.id);
            }}
            onDragEnd={(event) => {
              event.cancelBubble = true;
              onMove?.(arrow.id, pathPoints.map((pathPoint, index) => (
                index === pathPointIndex
                  ? { x: event.target.x(), y: event.target.y() }
                  : { ...pathPoint }
              )));
            }}
          />
        );
      })}
    </>
  );
}
