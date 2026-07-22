import { Group, Line, Path, Circle, Rect, Text } from 'react-konva';
import type { Boat as BoatModel } from '../types';
import {
  getSpeechBubbleHeight,
  SPEECH_BUBBLE_BOTTOM_Y,
  SPEECH_BUBBLE_WIDTH,
  SPEECH_BUBBLE_TOP_Y,
  type SpeechBubblePosition,
} from '../utils/speechBubble';

interface BoatProps {
  boat: BoatModel;
  isSelected: boolean;
  onMove?: (boatId: string, pos: { x: number; y: number }) => void;
  onRotate?: (boatId: string, heading: number) => void;
  onOpenInspector?: () => void;
  onSelect?: (boatId: string) => void;
  /** Called every drag frame with the (possibly snapped) position */
  onDragMove?: (boatId: string, pos: { x: number; y: number }) => void;
  /** Optional function that snaps a raw {x,y} to a constrained position */
  snapFn?: (pos: { x: number; y: number }) => { x: number; y: number };
  readOnly?: boolean;
  isShadow?: boolean;
  isOffense?: boolean;
  offenseColor?: string;
  showSpeechBubble?: boolean;
  speechBubblePosition?: SpeechBubblePosition;
}

const SPEECH_BUBBLE_X = -SPEECH_BUBBLE_WIDTH / 2;
const SPEECH_BUBBLE_TAIL_LENGTH = 20;

function getForwardPoint(length: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: length * Math.sin(radians),
    y: -length * Math.cos(radians),
  };
}

function getFrontSailPath(angle: number) {
  const frontAngle = -angle;
  const clew = getForwardPoint(38, frontAngle);
  const control = getForwardPoint(19, frontAngle - (Math.sign(angle || 1) * 0.4 * 180) / Math.PI);
  return {
    clew,
    path: `M 0 -12 Q ${control.x} ${control.y} ${clew.x} ${clew.y}`,
  };
}

function getAsymmetricSpinnakerPath(angle: number) {
  const frontAngle = -angle;
  const center = getForwardPoint(84, frontAngle * 0.45);
  const left = getForwardPoint(62, frontAngle + 27);
  const right = getForwardPoint(68, frontAngle - 24);
  return [
    `M 0 -12`,
    `C ${left.x - 28} ${left.y + 30} ${center.x - 48} ${center.y + 18} ${left.x} ${left.y}`,
    `C ${center.x - 12} ${center.y - 42} ${center.x + 26} ${center.y - 46} ${right.x} ${right.y}`,
    `C ${right.x + 12} ${right.y + 18} ${right.x - 4} ${right.y + 30} 0 -12 Z`,
  ].join(' ');
}

const SYMMETRIC_SPINNAKER_PIVOT_Y = -44;

function getSymmetricSpinnakerPath() {
  return [
    `M 0 0`,
    `C -36 -8 -54 -36 -48 -62`,
    `C -42 -82 -22 -94 0 -98`,
    `C 22 -94 42 -82 48 -62`,
    `C 54 -36 36 -8 0 0 Z`,
  ].join(' ');
}

export function SpeechBubble({
  text,
  heading,
  isSelected,
  isShadow,
  position = 'top',
}: {
  text: string;
  heading: number;
  isSelected: boolean;
  isShadow: boolean;
  position?: SpeechBubblePosition;
}) {
  const height = getSpeechBubbleHeight(text);
  const bubbleY = position === 'top' ? SPEECH_BUBBLE_TOP_Y : SPEECH_BUBBLE_BOTTOM_Y;
  const tailY = position === 'top' ? bubbleY + height : bubbleY;
  const tailTipY = position === 'top' ? tailY + SPEECH_BUBBLE_TAIL_LENGTH : tailY - SPEECH_BUBBLE_TAIL_LENGTH;

  return (
    <Group
      rotation={-heading}
      scaleX={2}
      scaleY={2}
      zIndex={100}
      listening={!isShadow}
    >
      <Line
        points={[
          -12, tailY + (position === 'top' ? -2 : 2),
          0, tailTipY,
          12, tailY + (position === 'top' ? -2 : 2),
        ]}
        closed
        fill={isShadow ? '#cbd5e1' : '#ffffff'}
        stroke={isShadow ? '#94a3b8' : '#334155'}
        strokeWidth={2}
        lineJoin="round"
      />
      <Rect
        x={SPEECH_BUBBLE_X}
        y={bubbleY}
        width={SPEECH_BUBBLE_WIDTH}
        height={height}
        fill={isShadow ? '#e2e8f0' : '#ffffff'}
        stroke={isShadow ? '#94a3b8' : isSelected ? '#06b6d4' : '#334155'}
        strokeWidth={isSelected ? 2.5 : 2}
        cornerRadius={16}
        shadowColor="#000"
        shadowBlur={isShadow ? 0 : 6}
        shadowOpacity={0.22}
      />
      <Text
        text={text}
        x={SPEECH_BUBBLE_X + 12}
        y={bubbleY + 8}
        width={SPEECH_BUBBLE_WIDTH - 24}
        height={height - 16}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fill="#0f172a"
        lineHeight={1.2}
        wrap="word"
      />
    </Group>
  );
}

export default function Boat({ boat, isSelected, onMove, onOpenInspector, onSelect, onDragMove, onRotate, snapFn, readOnly = false, isShadow = false, isOffense = false, offenseColor, showSpeechBubble = true, speechBubblePosition = 'top' }: BoatProps) {
  const boatScale = 0.5;
  const offenseStroke = offenseColor ?? (isOffense ? '#ef4444' : undefined);
  const speechBubble = boat.speechBubble?.trim();
  const sailPlan = boat.sailPlan ?? 'main-only';
  const frontSailAngle = boat.frontSailAngle ?? boat.sailAngle;
  const spinnakerAngle = boat.spinnakerAngle ?? boat.sailAngle;

  // Mast is located slightly forward of the center of the boat
  const mastX = 0;
  const mastY = -12;
  const boomLength = 36;

  // Calculate the boom endpoint
  const boomRad = ((180 + boat.sailAngle) * Math.PI) / 180;
  const boomEndX = mastX + boomLength * Math.sin(boomRad);
  const boomEndY = mastY - boomLength * Math.cos(boomRad);

  // Curved sail path
  const ctrlX = mastX + (boomLength / 2) * Math.sin(boomRad + (Math.sign(boat.sailAngle || 1) * 0.4));
  const ctrlY = mastY - (boomLength / 2) * Math.cos(boomRad + (Math.sign(boat.sailAngle || 1) * 0.4));

  const sailPathData = `M ${mastX} ${mastY} Q ${ctrlX} ${ctrlY} ${boomEndX} ${boomEndY}`;
  const frontSail = getFrontSailPath(frontSailAngle);
  const frontSailPathData = frontSail.path;
  const symmetricSpinnakerPathData = getSymmetricSpinnakerPath();
  const asymmetricSpinnakerPathData = getAsymmetricSpinnakerPath(spinnakerAngle);

  if (isShadow) {
    return (
      <Group
        x={boat.x}
        y={boat.y}
        rotation={boat.heading}
        scaleX={boatScale}
        scaleY={boatScale}
        draggable={false}
        opacity={0.22}
        listening={false}
      >
        {showSpeechBubble && speechBubble && <SpeechBubble text={speechBubble} heading={boat.heading} isSelected={false} isShadow position={speechBubblePosition} />}
        {/* Simplified Ghost Heading Line */}
        {boat.showHeadingLine && (
          <Line
            points={[0, -58, 0, -358]}
            stroke="#94a3b8"
            strokeWidth={1.5}
            dash={[6, 6]}
          />
        )}

        {/* Simplified Ghost Hull */}
        <Path
          data="M 0 -58 C 27 -37 31 21 14 52 L -14 52 C -31 21 -27 -37 0 -58 Z"
          fill="#475569"
          stroke="#94a3b8"
          strokeWidth={2}
          lineJoin="round"
        />
        {/* Simplified Sail */}
        <Line
          points={[mastX, mastY, boomEndX, boomEndY]}
          stroke="#94a3b8"
          strokeWidth={2}
        />
        <Path
          data={sailPathData}
          stroke="#cbd5e1"
          strokeWidth={3}
          opacity={0.7}
        />
        {sailPlan === 'front-sail' && (
          <>
            <Line
              points={[mastX, mastY, frontSail.clew.x, frontSail.clew.y]}
              stroke="#94a3b8"
              strokeWidth={2}
            />
            <Path
              data={frontSailPathData}
              stroke="#cbd5e1"
              strokeWidth={3}
              opacity={0.7}
            />
          </>
        )}
        {sailPlan === 'symmetric-spinnaker' && (
          <>
            <Group x={0} y={SYMMETRIC_SPINNAKER_PIVOT_Y} rotation={spinnakerAngle}>
              <Path
                data={symmetricSpinnakerPathData}
                fill="#cbd5e1"
                stroke="#94a3b8"
                strokeWidth={2}
                opacity={0.7}
              />
            </Group>
            <Circle cx={0} cy={SYMMETRIC_SPINNAKER_PIVOT_Y} r={3} fill="#94a3b8" />
          </>
        )}
        {sailPlan === 'asymmetric-spinnaker' && (
          <Path
            data={asymmetricSpinnakerPathData}
            fill="#cbd5e1"
            stroke="#94a3b8"
            strokeWidth={2}
            opacity={0.7}
          />
        )}
        <Circle cx={mastX} cy={mastY} r={3} fill="#94a3b8" />
      </Group>
    );
  }

  return (
    <Group
      x={boat.x}
      y={boat.y}
      rotation={boat.heading}
      scaleX={boatScale}
      scaleY={boatScale}
      draggable={!readOnly}
      dragBoundFunc={snapFn ? (pos) => snapFn(pos) : undefined}
      onClick={() => {
        onSelect?.(boat.id);
      }}
      onTap={() => {
        onSelect?.(boat.id);
      }}
      onDblClick={() => onOpenInspector?.()}
      onDblTap={() => onOpenInspector?.()}
      onDragStart={readOnly ? undefined : () => onSelect?.(boat.id)}
      onDragMove={readOnly ? undefined : (e) => {
        onDragMove?.(boat.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onDragEnd={readOnly ? undefined : (e) => {
        onMove?.(boat.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    >
      {showSpeechBubble && speechBubble && <SpeechBubble text={speechBubble} heading={boat.heading} isSelected={isSelected} isShadow={false} position={speechBubblePosition} />}

      {/* Selection Glow / Shadow Ring */}
      {offenseStroke && (
        <Path
          data="M 0 -66 C 32 -43 36 24 18 60 L -18 60 C -36 24 -32 -43 0 -66 Z"
          fill="transparent"
          stroke={offenseStroke}
          strokeWidth={5}
          dash={[10, 6]}
          opacity={0.95}
        />
      )}

      {isSelected && (
        <Path
          data="M 0 -62 C 30 -40 34 23 16 56 L -16 56 C -34 23 -30 -40 0 -62 Z"
          fill="transparent"
          stroke="#06b6d4"
          strokeWidth={4}
          opacity={0.8}
        />
      )}

      {isSelected && !readOnly && (
        <Circle
          x={0}
          y={-88}
          radius={8}
          fill="#22d3ee"
          stroke="#082f49"
          strokeWidth={2}
          hitStrokeWidth={24}
          draggable={!readOnly}
          onMouseDown={(event) => { event.cancelBubble = true; }}
          onTouchStart={(event) => { event.cancelBubble = true; }}
          onDragStart={(event) => { event.cancelBubble = true; }}
          onDragMove={(event) => { event.cancelBubble = true; }}
          onDragEnd={readOnly ? undefined : (event) => {
            event.cancelBubble = true;

            const pointerPosition = event.target.getStage()?.getPointerPosition();
            const boatPosition = event.target.getParent()?.getAbsolutePosition();

            if (pointerPosition && boatPosition) {
              const angle = (Math.atan2(
                pointerPosition.x - boatPosition.x,
                -(pointerPosition.y - boatPosition.y),
              ) * 180) / Math.PI;
              onRotate?.(boat.id, (angle + 360) % 360);
            }

            event.target.position({ x: 0, y: -88 });
          }}
        />
      )}

      {/* Projected Heading Line */}
      {boat.showHeadingLine && (
        <Line
          points={[0, -58, 0, -358]}
          stroke={isSelected ? '#06b6d4' : '#64748b'}
          strokeWidth={1.5}
          dash={[6, 6]}
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

      {sailPlan === 'front-sail' && (
        <>
          <Line
            points={[mastX, mastY, frontSail.clew.x, frontSail.clew.y]}
            stroke="#475569"
            strokeWidth={3.5}
            lineCap="round"
          />
          <Path
            data={frontSailPathData}
            stroke="#f8fafc"
            strokeWidth={4.5}
            lineCap="round"
            opacity={0.9}
            shadowColor="#000"
            shadowBlur={1}
          />
        </>
      )}

      {sailPlan === 'symmetric-spinnaker' && (
        <>
          <Group x={0} y={SYMMETRIC_SPINNAKER_PIVOT_Y} rotation={spinnakerAngle}>
            <Path
              data={symmetricSpinnakerPathData}
              fill={boat.color}
              stroke="#f8fafc"
              strokeWidth={3}
              lineJoin="round"
              opacity={0.7}
              shadowColor="#000"
              shadowBlur={2}
            />
          </Group>
          <Circle
            cx={0}
            cy={SYMMETRIC_SPINNAKER_PIVOT_Y}
            radius={3}
            fill="#1e293b"
            stroke="#f8fafc"
            strokeWidth={1}
          />
        </>
      )}

      {sailPlan === 'asymmetric-spinnaker' && (
        <Path
          data={asymmetricSpinnakerPathData}
          fill={boat.color}
          stroke="#f8fafc"
          strokeWidth={3}
          lineJoin="round"
          opacity={0.7}
          shadowColor="#000"
          shadowBlur={2}
        />
      )}

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
