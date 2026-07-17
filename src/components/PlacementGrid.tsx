import { Line } from 'react-konva';
import { GRID_SPACING } from '../constants';

interface PlacementGridProps {
  origin: { x: number; y: number };
  size: { width: number; height: number };
}

export default function PlacementGrid({ origin, size }: PlacementGridProps) {
  const verticalLineCount = Math.ceil(size.width / GRID_SPACING) + 1;
  const horizontalLineCount = Math.ceil(size.height / GRID_SPACING) + 1;

  return (
    <>
      {Array.from({ length: verticalLineCount }, (_, index) => {
        const x = origin.x + index * GRID_SPACING;
        const isMajorLine = index % 5 === 0;

        return (
          <Line
            key={`grid-v-${x}`}
            points={[x, origin.y, x, origin.y + size.height]}
            stroke={isMajorLine ? '#155e75' : '#1e3a4f'}
            strokeWidth={isMajorLine ? 1.5 : 1}
            opacity={isMajorLine ? 0.42 : 0.28}
            listening={false}
          />
        );
      })}
      {Array.from({ length: horizontalLineCount }, (_, index) => {
        const y = origin.y + index * GRID_SPACING;
        const isMajorLine = index % 5 === 0;

        return (
          <Line
            key={`grid-h-${y}`}
            points={[origin.x, y, origin.x + size.width, y]}
            stroke={isMajorLine ? '#155e75' : '#1e3a4f'}
            strokeWidth={isMajorLine ? 1.5 : 1}
            opacity={isMajorLine ? 0.42 : 0.28}
            listening={false}
          />
        );
      })}
    </>
  );
}
