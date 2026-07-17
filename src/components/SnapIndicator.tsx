import { Circle, Group, Line } from 'react-konva';
import type { SnapTarget } from '../hooks/useGridSnap';

interface SnapIndicatorProps {
  target: SnapTarget | null;
}

export default function SnapIndicator({ target }: SnapIndicatorProps) {
  if (!target) return null;

  const color = target.active ? '#06b6d4' : '#475569';

  return (
    <Group x={target.x} y={target.y}>
      <Circle radius={22} fill="transparent" stroke={color} strokeWidth={2} dash={[4, 4]} opacity={target.active ? 0.9 : 0.4} />
      <Circle radius={5} fill={color} opacity={target.active ? 1 : 0.5} />
      <Line points={[-14, 0, 14, 0]} stroke={color} strokeWidth={1.5} opacity={0.6} />
      <Line points={[0, -14, 0, 14]} stroke={color} strokeWidth={1.5} opacity={0.6} />
    </Group>
  );
}
