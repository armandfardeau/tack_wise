import { Line } from 'react-konva';
import { GRID_SPACING } from '../constants';

interface PlacementGridProps {
  stageSize: { width: number; height: number };
}

export default function PlacementGrid({ stageSize }: PlacementGridProps) {
  const verticalLineCount = Math.ceil(stageSize.width / GRID_SPACING) + 1;
  const horizontalLineCount = Math.ceil(stageSize.height / GRID_SPACING) + 1;

  return (
    <>
      {Array.from({ length: verticalLineCount }, (_, index) => {
        const x = index * GRID_SPACING;
        const isMajorLine = index % 5 === 0;

        return (
          <Line
            key={`grid-v-${x}`}
            points={[x, 0, x, stageSize.height]}
            stroke={isMajorLine ? '#155e75' : '#1e3a4f'}
            strokeWidth={isMajorLine ? 1.5 : 1}
            opacity={isMajorLine ? 0.42 : 0.28}
            listening={false}
          />
        );
      })}
      {Array.from({ length: horizontalLineCount }, (_, index) => {
        const y = index * GRID_SPACING;
        const isMajorLine = index % 5 === 0;

        return (
          <Line
            key={`grid-h-${y}`}
            points={[0, y, stageSize.width, y]}
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
