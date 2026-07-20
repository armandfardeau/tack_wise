import { Fragment, type RefObject } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { DisplayMode, Frame, Theme } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import Boat from './Boat';
import CommentNote from './CommentNote';
import DiagramImage from './DiagramImage';
import Mark from './Mark';
import MarkConnections from './MarkConnections';
import MarkRotationArrow from './MarkRotationArrow';
import PlacementGrid from './PlacementGrid';
import SnapIndicator from './SnapIndicator';
import TacticalArrow from './TacticalArrow';
import WindIndicator from './WindIndicator';
import type { SnapTarget } from '../hooks/useGridSnap';
import { canvasToWorldPosition, getCanvasWorldBounds, worldToCanvasPosition, type Position } from '../utils/simulation';

interface SimulationCanvasProps {
  activeFrame: Frame;
  canvasPosition: Position;
  canvasZoom: number;
  constrainPosition: (position: Position) => Position;
  currentFrameIndex: number;
  displayMode: DisplayMode;
  presenterMode: boolean;
  isExporting: boolean;
  theme: Theme;
  frames: Frame[];
  gridSnapEnabled: boolean;
  onCanvasDragEnd: () => void;
  onCanvasWheel: (event: { evt: { preventDefault: () => void; deltaY: number } }) => void;
  onMoveBoat: (boatId: string, position: Position) => void;
  onRotateBoat: (boatId: string, heading: number) => void;
  onMoveMark: (markId: string, position: Position) => void;
  onMoveArrow: (arrowId: string, points: NonNullable<Frame['arrows']>[number]['points']) => void;
  onMoveComment: (commentId: string, position: Position) => void;
  onMoveImage: (imageId: string, position: Position) => void;
  onOpenControls: () => void;
  onOpenInspector: (id: string, type: Exclude<SelectedType, null>) => void;
  onSelectObject: (id: string, type: Exclude<SelectedType, null>) => void;
  onSnapPreview: (target: SnapTarget | null) => void;
  selectedId: string | null;
  selectedType: SelectedType;
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
  displayMode,
  presenterMode,
  isExporting,
  theme,
  frames,
  gridSnapEnabled,
  onCanvasDragEnd,
  onCanvasWheel,
  onMoveBoat,
  onRotateBoat,
  onMoveMark,
  onMoveArrow,
  onMoveComment,
  onMoveImage,
  onOpenControls,
  onOpenInspector,
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
  const previousFrames = displayMode === 'cumulative'
    ? frames.slice(0, currentFrameIndex)
    : frames[currentFrameIndex - 1]
      ? [frames[currentFrameIndex - 1]]
      : [];
  const worldBounds = getCanvasWorldBounds(stageSize);
  const worldSize = {
    width: worldBounds.right - worldBounds.left,
    height: worldBounds.bottom - worldBounds.top,
  };
  const isLightTheme = theme === 'light';

  const getSnappedAbsolutePosition = (objectId: string, absolutePosition: Position) => {
    const worldPosition = canvasToWorldPosition(absolutePosition, canvasPosition, canvasZoom);
    const snappedWorldPosition = getSnappedPosition(objectId, worldPosition);
    return worldToCanvasPosition(snappedWorldPosition, canvasPosition, canvasZoom);
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
          fill={isLightTheme ? '#f8fafc' : '#0f172a'}
        />
        {showGrid && !isExporting && (
          <PlacementGrid
            origin={{ x: worldBounds.left, y: worldBounds.top }}
            size={worldSize}
            theme={theme}
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
        {previousFrames.map((previousFrame, shadowIndex) => (
          <Fragment key={`history-${previousFrame.id}`}>
            <MarkConnections marks={previousFrame.marks} isShadow />
            {previousFrame.marks.map((mark) => (
              <Fragment key={`shadow-${shadowIndex}-${mark.id}`}>
                <MarkRotationArrow mark={mark} isShadow />
                <Mark mark={mark} isSelected={false} isShadow />
              </Fragment>
            ))}
            {!presenterMode && !isExporting && previousFrame.boats.map((boat) => (
              <Boat key={`shadow-${shadowIndex}-${boat.id}`} boat={boat} isSelected={false} isShadow />
            ))}
            {(previousFrame.arrows ?? []).map((arrow) => (
              <TacticalArrow key={`shadow-${shadowIndex}-${arrow.id}`} arrow={arrow} isSelected={false} isShadow />
            ))}
            {(previousFrame.comments ?? []).map((comment) => (
              <CommentNote key={`shadow-${shadowIndex}-${comment.id}`} comment={comment} isSelected={false} theme={theme} isShadow />
            ))}
            {(previousFrame.images ?? []).map((image) => (
              <DiagramImage key={`shadow-${shadowIndex}-${image.id}`} image={image} isSelected={false} isShadow />
            ))}
          </Fragment>
        ))}

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
                onOpenInspector={() => onOpenInspector(mark.id, 'mark')}
                snapFn={(position) => getSnappedAbsolutePosition(mark.id, position)}
              onSelect={(id) => {
                onSelectObject(id, 'mark');
                onSnapPreview(null);
              }}
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
            onOpenInspector={() => onOpenInspector(boat.id, 'boat')}
            snapFn={
              gridSnapEnabled
                ? (position) => getSnappedAbsolutePosition(boat.id, position)
                : undefined
            }
            onSelect={(id) => {
              onSelectObject(id, 'boat');
              onSnapPreview(null);
            }}
            onRotate={(id, heading) => onRotateBoat(id, heading)}
            onMove={(id, position) => {
              onSnapPreview(null);
              onMoveBoat(id, position);
            }}
          />
        ))}

        {(activeFrame.arrows ?? []).map((arrow) => (
          <TacticalArrow
            key={arrow.id}
            arrow={arrow}
            isSelected={selectedId === arrow.id}
            onOpenInspector={() => onOpenInspector(arrow.id, 'arrow')}
            onSelect={(id) => onSelectObject(id, 'arrow')}
            onMove={onMoveArrow}
          />
        ))}

        {(activeFrame.comments ?? []).map((comment) => (
          <CommentNote
            key={comment.id}
            comment={comment}
            isSelected={selectedId === comment.id}
            theme={theme}
            onOpenInspector={() => onOpenInspector(comment.id, 'comment')}
            onSelect={(id) => onSelectObject(id, 'comment')}
            onMove={onMoveComment}
          />
        ))}

        {(activeFrame.images ?? []).map((image) => (
          <DiagramImage
            key={image.id}
            image={image}
            isSelected={selectedId === image.id}
            onOpenInspector={() => onOpenInspector(image.id, 'image')}
            onSelect={(id) => onSelectObject(id, 'image')}
            onMove={onMoveImage}
          />
        ))}
      </Layer>

      <Layer listening={false}>
        <SnapIndicator target={snapTarget} />
      </Layer>
    </Stage>
  );
}
