import { Fragment, type RefObject } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { Frame } from '../types';
import Boat from './Boat';
import Mark from './Mark';
import MarkConnections from './MarkConnections';
import MarkRotationArrow from './MarkRotationArrow';
import PlacementGrid from './PlacementGrid';
import SnapIndicator from './SnapIndicator';
import WindIndicator from './WindIndicator';
import type { SnapTarget } from '../hooks/useGridSnap';
import { getCanvasWorldBounds, type Position } from '../utils/simulation';

interface SimulationCanvasProps {
  activeFrame: Frame;
  canvasPosition: Position;
  canvasZoom: number;
  constrainPosition: (position: Position) => Position;
  currentFrameIndex: number;
  frames: Frame[];
  gridSnapEnabled: boolean;
  onCanvasDragEnd: () => void;
  onCanvasWheel: (event: { evt: { preventDefault: () => void; deltaY: number } }) => void;
  onMoveBoat: (boatId: string, position: Position) => void;
  onMoveMark: (markId: string, position: Position) => void;
  onOpenControls: () => void;
  onSelectObject: (id: string, type: 'boat' | 'mark') => void;
  onSnapPreview: (target: SnapTarget | null) => void;
  selectedId: string | null;
  selectedType: 'boat' | 'mark' | null;
  showGrid: boolean;
  snapTarget: SnapTarget | null;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
  getSnappedPosition: (objectId: string, position: Position) => Position;
}

export default function SimulationCanvas({
  activeFrame,
  canvasPosition,
  canvasZoom,
  constrainPosition,
  currentFrameIndex,
  frames,
  gridSnapEnabled,
  onCanvasDragEnd,
  onCanvasWheel,
  onMoveBoat,
  onMoveMark,
  onOpenControls,
  onSelectObject,
  onSnapPreview,
  selectedId,
  selectedType,
  showGrid,
  snapTarget,
  stageRef,
  stageSize,
  getSnappedPosition,
}: SimulationCanvasProps) {
  const previousFrame = frames[currentFrameIndex - 1];
  const worldBounds = getCanvasWorldBounds(stageSize);
  const worldSize = {
    width: worldBounds.right - worldBounds.left,
    height: worldBounds.bottom - worldBounds.top,
  };

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      x={canvasPosition.x}
      y={canvasPosition.y}
      scaleX={canvasZoom}
      scaleY={canvasZoom}
      draggable
      dragBoundFunc={constrainPosition}
      onDragEnd={onCanvasDragEnd}
      onWheel={onCanvasWheel}
    >
      <Layer>
        <Rect
          x={worldBounds.left}
          y={worldBounds.top}
          width={worldSize.width}
          height={worldSize.height}
          fill="#0f172a"
        />
        {showGrid && (
          <PlacementGrid
            origin={{ x: worldBounds.left, y: worldBounds.top }}
            size={worldSize}
          />
        )}
        <WindIndicator
          windAngle={activeFrame.windAngle}
          windSpeed={activeFrame.windSpeed}
          origin={{ x: worldBounds.left, y: worldBounds.top }}
          stageSize={worldSize}
        />
      </Layer>

      <Layer>
        {previousFrame && (
          <>
            <MarkConnections marks={previousFrame.marks} isShadow />
            {previousFrame.marks.map((mark) => (
              <Fragment key={`shadow-${mark.id}`}>
                <MarkRotationArrow mark={mark} isShadow />
                <Mark mark={mark} isSelected={false} isShadow />
              </Fragment>
            ))}
            {previousFrame.boats.map((boat) => (
              <Boat key={`shadow-${boat.id}`} boat={boat} isSelected={false} isShadow />
            ))}
          </>
        )}

        <MarkConnections
          marks={activeFrame.marks}
          highlightMarkId={selectedType === 'mark' ? selectedId : null}
        />

        {activeFrame.marks.map((mark) => (
          <Fragment key={mark.id}>
            <MarkRotationArrow
              mark={mark}
              isSelected={selectedId === mark.id}
            />
            <Mark
              mark={mark}
              isSelected={selectedId === mark.id}
              snapFn={(position) => getSnappedPosition(mark.id, position)}
              onSelect={(id) => {
                onSelectObject(id, 'mark');
                onSnapPreview(null);
              }}
              onOpenControls={onOpenControls}
              onMove={(id, position) => {
                onSnapPreview(null);
                onMoveMark(id, position);
              }}
            />
          </Fragment>
        ))}

        {activeFrame.boats.map((boat) => (
          <Boat
            key={boat.id}
            boat={boat}
            isSelected={selectedId === boat.id}
            snapFn={
              gridSnapEnabled
                ? (position) => getSnappedPosition(boat.id, position)
                : undefined
            }
            onSelect={(id) => {
              onSelectObject(id, 'boat');
              onSnapPreview(null);
            }}
            onOpenControls={onOpenControls}
            onMove={(id, position) => {
              onSnapPreview(null);
              onMoveBoat(id, position);
            }}
          />
        ))}
      </Layer>

      <Layer listening={false}>
        <SnapIndicator target={snapTarget} />
      </Layer>
    </Stage>
  );
}
