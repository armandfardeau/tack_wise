import { Arrow } from 'react-konva';
import type { TacticalArrow as TacticalArrowModel } from '../types';

interface TacticalArrowProps {
  arrow: TacticalArrowModel;
  isSelected: boolean;
  onMove?: (id: string, points: TacticalArrowModel['points']) => void;
  onOpenControls?: () => void;
  onSelect?: (id: string) => void;
  isShadow?: boolean;
}

export default function TacticalArrow({ arrow, isSelected, onMove, onOpenControls, onSelect, isShadow = false }: TacticalArrowProps) {
  const points = arrow.points.flatMap((point) => [point.x, point.y]);
  const color = isShadow ? '#94a3b8' : isSelected ? '#22d3ee' : arrow.color;

  return (
    <Arrow
      points={points}
      stroke={color}
      fill={color}
      strokeWidth={arrow.lineWidth ?? 3}
      dash={arrow.lineStyle === 'dotted' ? [3, 6] : arrow.lineStyle === 'dashed' ? [12, 6] : undefined}
      pointerLength={arrow.showArrowhead === false ? 0 : 12}
      pointerWidth={arrow.showArrowhead === false ? 0 : 10}
      tension={arrow.curved ? 0.45 : 0}
      opacity={isShadow ? 0.22 : 0.9}
      draggable={!isShadow}
      listening={!isShadow}
      onClick={() => {
        onSelect?.(arrow.id);
        onOpenControls?.();
      }}
      onTap={() => {
        onSelect?.(arrow.id);
        onOpenControls?.();
      }}
      onDragStart={() => onSelect?.(arrow.id)}
      onDragEnd={(event) => {
        const dx = event.target.x();
        const dy = event.target.y();
        event.target.position({ x: 0, y: 0 });
        onMove?.(arrow.id, arrow.points.map((point) => ({ x: point.x + dx, y: point.y + dy })));
      }}
    />
  );
}
