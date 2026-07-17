import { Circle, Group, Rect, RegularPolygon, Text } from 'react-konva';
import type { Mark as MarkModel } from '../types';

interface MarkProps {
  mark: MarkModel;
  isSelected: boolean;
  onMove?: (markId: string, pos: { x: number; y: number }) => void;
  onOpenControls?: () => void;
  onSelect?: (markId: string) => void;
  /** Optional function that snaps a raw {x,y} to a constrained position */
  snapFn?: (pos: { x: number; y: number }) => { x: number; y: number };
  isShadow?: boolean;
}

export default function Mark({ mark, isSelected, onMove, onOpenControls, onSelect, snapFn, isShadow = false }: MarkProps) {
  // Render different visual shapes based on mark.shape
  const renderShape = () => {
    const strokeColor = isShadow ? '#94a3b8' : isSelected ? '#ffffff' : '#1e293b';
    const strokeWidth = isShadow ? 1.5 : isSelected ? 3 : 1.5;
    const fillColor = isShadow ? '#475569' : mark.color;
    const shadowColor = 'black';
    const shadowBlur = isShadow ? 0 : 4;
    const shadowOpacity = isShadow ? 0 : 0.3;
    const shadowOffset = isShadow ? { x: 0, y: 0 } : { x: 1, y: 2 };

    switch (mark.shape) {
      case 'triangle':
        return (
          <RegularPolygon
            sides={3}
            radius={16}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            shadowOpacity={shadowOpacity}
            shadowOffset={shadowOffset}
            rotation={0}
          />
        );
      case 'square':
        return (
          <Rect
            x={-12}
            y={-12}
            width={24}
            height={24}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            shadowOpacity={shadowOpacity}
            shadowOffset={shadowOffset}
            cornerRadius={2}
          />
        );
      case 'circle':
      default:
        return (
          <Circle
            radius={14}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor={shadowColor}
            shadowBlur={shadowBlur}
            shadowOpacity={shadowOpacity}
            shadowOffset={shadowOffset}
          />
        );
    }
  };

  if (isShadow) {
    return (
      <Group
        x={mark.x}
        y={mark.y}
        draggable={false}
        opacity={0.22}
        listening={false}
      >
        {renderShape()}
      </Group>
    );
  }

  return (
    <Group
      x={mark.x}
      y={mark.y}
      draggable
      dragBoundFunc={snapFn ? (pos) => snapFn(pos) : undefined}
      onClick={() => {
        onSelect?.(mark.id);
        onOpenControls?.();
      }}
      onTap={() => {
        onSelect?.(mark.id);
        onOpenControls?.();
      }}
      onDragStart={() => onSelect?.(mark.id)}
      onDragEnd={(e) => {
        onMove?.(mark.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    >
      {/* Visual representation of the buoy */}
      {renderShape()}

      {/* A tiny flag stick & flag on top of the mark to make it look premium */}
      <Rect x={-1} y={-22} width={2} height={10} fill="#64748b" />
      <RegularPolygon
        x={5}
        y={-18}
        sides={3}
        radius={5}
        rotation={90}
        fill="#ef4444"
      />

      {/* Label for the mark */}
      <Text
        text={mark.name}
        x={-40}
        y={20}
        width={80}
        align="center"
        fontSize={11}
        fontStyle="bold"
        fill="#0f172a"
        wrap="none"
        ellipsis={true}
      />
    </Group>
  );
}
