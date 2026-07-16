import { Group, Line, Path, Circle, Text } from 'react-konva';
import type { Boat as BoatModel } from '../types';

interface BoatProps {
  boat: BoatModel;
  isSelected: boolean;
  onMove: (boatId: string, pos: { x: number; y: number }) => void;
  onSelect: (boatId: string) => void;
}

export default function Boat({ boat, isSelected, onMove, onSelect }: BoatProps) {
  // Mast is located slightly forward of the center of the boat
  const mastX = 0;
  const mastY = -12;
  const boomLength = 36;

  // Calculate the boom endpoint. 
  // In our coordinate system, 0 deg heading is straight up (North, -Y).
  // The boom extends backwards (180 deg) + the sail angle.
  // We convert sailAngle to radians.
  const boomRad = ((180 + boat.sailAngle) * Math.PI) / 180;
  const boomEndX = mastX + boomLength * Math.sin(boomRad);
  const boomEndY = mastY - boomLength * Math.cos(boomRad);

  // Curved sail path: starting from mast, curving outwards, ending at the boom tip
  // The curve control point depends on the sail angle to show wind curvature
  const ctrlX = mastX + (boomLength / 2) * Math.sin(boomRad + (Math.sign(boat.sailAngle || 1) * 0.4));
  const ctrlY = mastY - (boomLength / 2) * Math.cos(boomRad + (Math.sign(boat.sailAngle || 1) * 0.4));

  const sailPathData = `M ${mastX} ${mastY} Q ${ctrlX} ${ctrlY} ${boomEndX} ${boomEndY}`;

  return (
    <Group
      x={boat.x}
      y={boat.y}
      rotation={boat.heading}
      draggable
      onClick={() => onSelect(boat.id)}
      onTap={() => onSelect(boat.id)}
      onDragStart={() => onSelect(boat.id)}
      onDragEnd={(e) => {
        onMove(boat.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    >
      {/* Selection Glow / Shadow Ring */}
      {isSelected && (
        <Path
          data="M 0 -62 C 30 -40 34 23 16 56 L -16 56 C -34 23 -30 -40 0 -62 Z"
          fill="transparent"
          stroke="#06b6d4"
          strokeWidth={4}
          opacity={0.8}
        />
      )}

      {/* Heading Pointer Arrow (extends from bow) */}
      <Line
        points={[0, -58, 0, -78]}
        stroke={isSelected ? '#06b6d4' : '#64748b'}
        strokeWidth={3}
        lineCap="round"
      />
      <Path
        data="M -4 -74 L 0 -82 L 4 -74 Z"
        fill={isSelected ? '#06b6d4' : '#64748b'}
      />

      {/* Boat Hull */}
      <Path
        data="M 0 -58 C 27 -37 31 21 14 52 L -14 52 C -31 21 -27 -37 0 -58 Z"
        fill={boat.color}
        stroke="#0f172a"
        strokeWidth={3}
        lineJoin="round"
        shadowColor="rgba(15, 23, 42, 0.3)"
        shadowBlur={6}
        shadowOffset={{ x: 0, y: 3 }}
      />

      {/* Cockpit / Deck features */}
      <Path
        data="M -9 15 L 9 15 L 6 45 L -6 45 Z"
        fill="#e2e8f0"
        stroke="#475569"
        strokeWidth={1.5}
        lineJoin="round"
      />

      {/* Mast */}
      <Circle x={mastX} y={mastY} radius={4} fill="#1e293b" />

      {/* Sail Boom (Mainsail Boom) */}
      <Line
        points={[mastX, mastY, boomEndX, boomEndY]}
        stroke="#475569"
        strokeWidth={3.5}
        lineCap="round"
      />

      {/* Mainsail (represented as a filled curved canvas) */}
      <Path
        data={sailPathData}
        stroke="#f8fafc"
        strokeWidth={4.5}
        lineCap="round"
        opacity={0.9}
        shadowColor="#000"
        shadowBlur={1}
      />

      {/* Label Text (Unrotated so it's always readable for the user) */}
      <Group rotation={-boat.heading}>
        {/* Background plate for readability */}
        <Text
          text={boat.name}
          x={-50}
          y={62}
          width={100}
          align="center"
          fontSize={12}
          fontStyle="bold"
          fill="#1e293b"
          wrap="none"
          ellipsis={true}
        />
      </Group>
    </Group>
  );
}
