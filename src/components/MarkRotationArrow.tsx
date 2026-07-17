import { Arc, Group, RegularPolygon } from 'react-konva';
import type { Mark } from '../types';
import {
  getRotationArrowGeometry,
  ROTATION_ARROW_RADIUS,
  ROTATION_ARROW_START_ANGLE,
} from '../utils/rotationArrow';

interface MarkRotationArrowProps {
  mark: Mark;
  isSelected?: boolean;
  isShadow?: boolean;
}

export default function MarkRotationArrow({
  mark,
  isSelected = false,
  isShadow = false,
}: MarkRotationArrowProps) {
  if (mark.showRotationArrow !== true) return null;

  const geometry = getRotationArrowGeometry(mark.rotationDirection ?? 'counterclockwise');
  const color = isShadow ? '#94a3b8' : isSelected ? '#ffffff' : mark.color;

  return (
    <Group
      x={mark.x}
      y={mark.y}
      opacity={isShadow ? 0.22 : 0.9}
      listening={false}
    >
      <Arc
        innerRadius={ROTATION_ARROW_RADIUS - 3}
        outerRadius={ROTATION_ARROW_RADIUS}
        angle={geometry.arcAngle}
        rotation={ROTATION_ARROW_START_ANGLE}
        clockwise={geometry.arcClockwise}
        fill={color}
      />
      <RegularPolygon
        x={geometry.arrowX}
        y={geometry.arrowY}
        sides={3}
        radius={7}
        rotation={geometry.arrowRotation}
        fill={color}
      />
    </Group>
  );
}
