import { Group, Arrow } from 'react-konva';

interface WindIndicatorProps {
  windAngle: number; // direction wind is blowing FROM (0 = North, clockwise)
  windSpeed: number; // wind speed in knots
  stageSize: { width: number; height: number };
}

export default function WindIndicator({ windAngle, windSpeed, stageSize }: WindIndicatorProps) {
  const { width, height } = stageSize;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // The wind direction is the angle it blows FROM.
  // The flow/arrow direction is opposite (windAngle + 180).
  const flowAngle = (windAngle + 180) % 360;

  // Let's draw 6 parallel wind lines across the screen.
  // We can place them at different vertical offsets in a group, then rotate the group.
  const linesCount = 5;
  const spacing = height / (linesCount + 1);

  return (
    <Group>
      {/* Background wind flow lines */}
      <Group x={centerX} y={centerY} rotation={flowAngle}>
        {Array.from({ length: linesCount }).map((_, i) => {
          const yOffset = -height / 2 + spacing * (i + 1);
          // Scale arrow length and width with windSpeed
          const opacity = Math.min(0.04 + (windSpeed / 30) * 0.08, 0.15);
          const strokeWidth = Math.max(1, (windSpeed / 10) * 1.5);
          
          return (
            <Arrow
              key={i}
              points={[-width * 0.7, yOffset, width * 0.7, yOffset]}
              pointerLength={12}
              pointerWidth={10}
              stroke="#0ea5e9"
              fill="#0ea5e9"
              strokeWidth={strokeWidth}
              opacity={opacity}
              dash={[20, 15]}
            />
          );
        })}
      </Group>
    </Group>
  );
}
