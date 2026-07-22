import { Circle, Group, Line, Rect, RegularPolygon, Text } from 'react-konva';
import { BOAT_LENGTH, DEFAULT_MARK_ZONE_RADIUS, DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS } from '../constants';
import type { Mark as MarkModel } from '../types';
import { getMarkConnectionHandleOffset } from '../utils/markConnections';

interface MarkProps {
  mark: MarkModel;
  isSelected: boolean;
  onMove?: (markId: string, pos: { x: number; y: number }) => void;
  onOpenInspector?: () => void;
  onSelect?: (markId: string) => void;
  onStartConnection?: (markId: string) => void;
  /** Optional function that snaps a raw {x,y} to a constrained position */
  snapFn?: (pos: { x: number; y: number }) => { x: number; y: number };
  readOnly?: boolean;
  isShadow?: boolean;
  isOffense?: boolean;
  offenseColor?: string;
  isConnectionTarget?: boolean;
}

export default function Mark({ mark, isSelected, onMove, onOpenInspector, onSelect, onStartConnection, snapFn, readOnly = false, isShadow = false, isOffense = false, offenseColor, isConnectionTarget = false }: MarkProps) {
  const markSize = mark.size ?? 28;
  const offenseStroke = offenseColor ?? (isOffense ? '#ef4444' : undefined);
  const renderZone = (strokeColor: string) => mark.showZone ? (
    <Circle
      radius={(mark.zoneRadius ?? DEFAULT_MARK_ZONE_RADIUS) * BOAT_LENGTH}
      fill="transparent"
      stroke={strokeColor}
      strokeWidth={isSelected ? 2 : 1}
      dash={[10, 8]}
      opacity={isShadow ? 0.7 : 0.55}
    />
  ) : null;

  // Render different visual shapes based on mark.shape
  const renderShape = () => {
    const strokeColor = isShadow ? '#94a3b8' : isConnectionTarget ? '#22d3ee' : isSelected ? '#ffffff' : '#1e293b';
    const strokeWidth = isShadow ? 1.5 : isConnectionTarget || isSelected ? 3 : 1.5;
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
            radius={markSize / 2}
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
            x={-markSize / 2}
            y={-markSize / 2}
            width={markSize}
            height={markSize}
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
      case 'obstruction':
        return (
          <Group>
            <Circle
              radius={(mark.proximityRadius ?? DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS) * BOAT_LENGTH}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1}
              dash={[10, 8]}
              opacity={isShadow ? 0.7 : 0.55}
            />
            <Circle
              radius={markSize / 2}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              dash={[6, 5]}
              shadowColor={shadowColor}
              shadowBlur={shadowBlur}
              shadowOpacity={shadowOpacity}
              shadowOffset={shadowOffset}
            />
          </Group>
        );
      case 'gate':
        return (
          <Group>
            <Line points={[-markSize, 0, markSize, 0]} stroke={strokeColor} strokeWidth={Math.max(2, strokeWidth)} />
            <Circle radius={markSize / 3} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} x={-markSize / 2} />
            <Circle radius={markSize / 3} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} x={markSize / 2} />
          </Group>
        );
      case 'committeeBoat':
        return (
          <Group>
            <Rect
              x={-markSize}
              y={-markSize / 4}
              width={markSize * 2}
              height={markSize / 2}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={3}
              shadowColor={shadowColor}
              shadowBlur={shadowBlur}
              shadowOpacity={shadowOpacity}
              shadowOffset={shadowOffset}
            />
            <Line points={[0, -markSize / 4, 0, -markSize / 1.4]} stroke={strokeColor} strokeWidth={Math.max(1, strokeWidth / 2)} />
            <RegularPolygon x={markSize / 4} y={-markSize / 1.5} sides={3} radius={markSize / 5} rotation={90} fill={fillColor} stroke={strokeColor} strokeWidth={Math.max(1, strokeWidth / 2)} />
          </Group>
        );
      case 'circle':
      default:
        return (
          <Circle
            radius={markSize / 2}
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
        rotation={mark.rotation ?? 0}
        draggable={false}
        opacity={0.22}
        listening={false}
      >
        {renderZone('#94a3b8')}
        {renderShape()}
      </Group>
    );
  }

  return (
    <Group
      x={mark.x}
      y={mark.y}
      rotation={mark.rotation ?? 0}
      draggable={!readOnly}
      dragBoundFunc={snapFn ? (pos) => snapFn(pos) : undefined}
      onClick={() => {
        onSelect?.(mark.id);
      }}
      onTap={() => {
        onSelect?.(mark.id);
      }}
      onDblClick={() => onOpenInspector?.()}
      onDblTap={() => onOpenInspector?.()}
      onDragStart={readOnly ? undefined : () => onSelect?.(mark.id)}
      onDragEnd={readOnly ? undefined : (e) => {
        onMove?.(mark.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    >
      {/* Visual representation of the buoy */}
      {renderZone(isConnectionTarget ? '#22d3ee' : isSelected ? '#ffffff' : mark.color)}
      {offenseStroke && (
        <Circle
          radius={(mark.shape === 'gate' || mark.shape === 'committeeBoat' ? markSize : markSize / 2) + 10}
          fill="transparent"
          stroke={offenseStroke}
          strokeWidth={4}
          dash={[8, 5]}
          opacity={0.95}
        />
      )}
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
      <Group rotation={-(mark.rotation ?? 0)}>
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

      {!readOnly && (
        <Circle
          x={getMarkConnectionHandleOffset(mark)}
          y={0}
          radius={7}
          fill={isConnectionTarget ? '#22d3ee' : '#0e7490'}
          stroke="#ecfeff"
          strokeWidth={2}
          shadowColor="#0e7490"
          shadowBlur={4}
          shadowOpacity={0.55}
          onMouseDown={(event) => {
            event.cancelBubble = true;
            event.evt.preventDefault();
            onStartConnection?.(mark.id);
          }}
          onTouchStart={(event) => {
            event.cancelBubble = true;
            onStartConnection?.(mark.id);
          }}
        />
      )}
    </Group>
  );
}
