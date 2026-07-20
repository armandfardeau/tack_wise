import { Fragment, useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Circle, Group, Layer, Line, Rect, Stage } from 'react-konva';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { DisplayMode, Frame, Theme } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import Boat, { SpeechBubble } from './Boat';
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
import { getMarkConnectionAnchor, getMarkConnectionPoint, getMarkConnectionRadius } from '../utils/markConnections';
import { getSpeechBubblePositions, type SpeechBubblePosition } from '../utils/speechBubble';

interface SimulationCanvasProps {
  activeFrame: Frame;
  canvasPosition: Position;
  canvasZoom: number;
  constrainPosition: (position: Position) => Position;
  currentFrameIndex: number;
  displayMode: DisplayMode;
  readOnly?: boolean;
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
  onConnectMarks: (sourceMarkId: string, targetMarkId: string, anchors?: { start?: Position; end?: Position }) => void;
  onMoveArrow: (arrowId: string, points: NonNullable<Frame['arrows']>[number]['points']) => void;
  onArrowPoint: (position: Position) => void;
  isAddingArrow: boolean;
  arrowDrawingStart: Position | null;
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
  onCanvasTouchEnd: (event: { evt: TouchEvent }) => void;
  onCanvasTouchMove: (event: { evt: TouchEvent }) => void;
  onCanvasTouchStart: (event: { evt: TouchEvent }) => void;
}

interface ConnectionDrag {
  sourceMarkId: string;
  pointer: Position;
  targetMarkId: string | null;
  startAnchor: Position;
  endAnchor: Position | null;
}

function PositionedSpeechBubble({
  boat,
  position,
  isSelected,
  isShadow = false,
}: {
  boat: Frame['boats'][number];
  position: SpeechBubblePosition;
  isSelected: boolean;
  isShadow?: boolean;
}) {
  const text = boat.speechBubble?.trim();
  if (!text) return null;

  return (
    <Group
      x={boat.x}
      y={boat.y}
      scaleX={0.5}
      scaleY={0.5}
      opacity={isShadow ? 0.22 : 1}
      listening={false}
      zIndex={100}
    >
      <SpeechBubble
        text={text}
        heading={0}
        isSelected={isSelected}
        isShadow={isShadow}
        position={position}
      />
    </Group>
  );
}

export default function SimulationCanvas({
  activeFrame,
  canvasPosition,
  canvasZoom,
  constrainPosition,
  currentFrameIndex,
  displayMode,
  readOnly = false,
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
  onConnectMarks,
  onMoveArrow,
  onArrowPoint,
  isAddingArrow,
  arrowDrawingStart,
  onMoveComment,
  onMoveImage,
  onOpenControls: _onOpenControls,
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
  onCanvasTouchEnd,
  onCanvasTouchMove,
  onCanvasTouchStart,
}: SimulationCanvasProps) {
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDrag | null>(null);
  const connectionDragRef = useRef<ConnectionDrag | null>(null);
  const [arrowDrawingPointer, setArrowDrawingPointer] = useState<Position | null>(null);
  const previousFrames = displayMode === 'cumulative'
    ? frames.slice(0, currentFrameIndex)
    : frames[currentFrameIndex - 1]
      ? [frames[currentFrameIndex - 1]]
      : [];
  const speechBubblePositions = getSpeechBubblePositions(activeFrame.boats);
  const previousSpeechBubblePositions = previousFrames.map((frame) => ({
    frame,
    positions: getSpeechBubblePositions(frame.boats),
  }));
  const worldBounds = getCanvasWorldBounds(stageSize);
  const worldSize = {
    width: worldBounds.right - worldBounds.left,
    height: worldBounds.bottom - worldBounds.top,
  };
  const isLightTheme = theme === 'light';
  const offenseTargetColors = new Map(
    (activeFrame.comments ?? [])
      .filter((comment) => comment.type === 'rule')
      .flatMap((comment) => comment.offenseTargets.map((target) => [
        `${target.type}:${target.id}`,
        target.color ?? '#ef4444',
      ] as const)),
  );

  const getSnappedAbsolutePosition = (objectId: string, absolutePosition: Position) => {
    const worldPosition = canvasToWorldPosition(absolutePosition, canvasPosition, canvasZoom);
    const snappedWorldPosition = getSnappedPosition(objectId, worldPosition);
    return worldToCanvasPosition(snappedWorldPosition, canvasPosition, canvasZoom);
  };

  const setActiveConnectionDrag = useCallback((nextDrag: ConnectionDrag | null) => {
    connectionDragRef.current = nextDrag;
    setConnectionDrag(nextDrag);
  }, []);

  const getPointerWorldPosition = useCallback((): Position | null => {
    const pointerPosition = stageRef.current?.getPointerPosition();
    if (!pointerPosition) return null;
    return canvasToWorldPosition(pointerPosition, canvasPosition, canvasZoom);
  }, [canvasPosition, canvasZoom, stageRef]);

  const updateArrowDrawingPreview = useCallback(() => {
    if (!isAddingArrow) return;
    setArrowDrawingPointer(getPointerWorldPosition());
  }, [getPointerWorldPosition, isAddingArrow]);

  const handleArrowPoint = useCallback(() => {
    if (!isAddingArrow) return;

    const pointer = getPointerWorldPosition();
    if (pointer) onArrowPoint(pointer);
  }, [getPointerWorldPosition, isAddingArrow, onArrowPoint]);

  useEffect(() => {
    if (!isAddingArrow) setArrowDrawingPointer(null);
  }, [isAddingArrow]);

  const findConnectionTarget = useCallback((sourceMarkId: string, pointer: Position): string | null => {
    const candidates = activeFrame.marks
      .filter((mark) => mark.id !== sourceMarkId)
      .map((mark) => ({
        mark,
        distance: Math.hypot(mark.x - pointer.x, mark.y - pointer.y),
        hitRadius: getMarkConnectionRadius(mark) + 16,
      }))
      .filter(({ distance, hitRadius }) => distance <= hitRadius)
      .sort((left, right) => left.distance - right.distance);

    return candidates[0]?.mark.id ?? null;
  }, [activeFrame.marks]);

  const updateConnectionDrag = useCallback(() => {
    const activeDrag = connectionDragRef.current;
    const pointer = getPointerWorldPosition();
    if (!activeDrag || !pointer) return;

    setActiveConnectionDrag({
      ...activeDrag,
      pointer,
      targetMarkId: findConnectionTarget(activeDrag.sourceMarkId, pointer),
      endAnchor: (() => {
        const targetMarkId = findConnectionTarget(activeDrag.sourceMarkId, pointer);
        const targetMark = activeFrame.marks.find((mark) => mark.id === targetMarkId);
        return targetMark ? getMarkConnectionAnchor(targetMark, pointer) : null;
      })(),
    });
  }, [activeFrame.marks, findConnectionTarget, getPointerWorldPosition, setActiveConnectionDrag]);

  const finishConnectionDrag = useCallback(() => {
    const activeDrag = connectionDragRef.current;
    setActiveConnectionDrag(null);

    if (activeDrag?.targetMarkId) {
      onConnectMarks(activeDrag.sourceMarkId, activeDrag.targetMarkId, {
        start: activeDrag.startAnchor,
        end: activeDrag.endAnchor ?? { x: 0, y: 0 },
      });
    }
  }, [onConnectMarks, setActiveConnectionDrag]);

  const startConnectionDrag = useCallback((sourceMarkId: string) => {
    if (readOnly) return;

    const sourceMark = activeFrame.marks.find((mark) => mark.id === sourceMarkId);
    if (!sourceMark) return;

    const pointer = getPointerWorldPosition() ?? { x: sourceMark.x, y: sourceMark.y };
    setActiveConnectionDrag({
      sourceMarkId,
      pointer,
      targetMarkId: null,
      startAnchor: getMarkConnectionAnchor(sourceMark, pointer),
      endAnchor: null,
    });
    onSelectObject(sourceMarkId, 'mark');
    onSnapPreview(null);
  }, [activeFrame.marks, getPointerWorldPosition, onSelectObject, onSnapPreview, readOnly, setActiveConnectionDrag]);

  useEffect(() => {
    if (!connectionDrag) return undefined;

    const handleWindowPointerUp = () => finishConnectionDrag();
    window.addEventListener('mouseup', handleWindowPointerUp);
    window.addEventListener('touchend', handleWindowPointerUp);

    return () => {
      window.removeEventListener('mouseup', handleWindowPointerUp);
      window.removeEventListener('touchend', handleWindowPointerUp);
    };
  }, [connectionDrag, finishConnectionDrag]);

  const handleStageTouchMove = (event: { evt: TouchEvent }) => {
    if (isAddingArrow) {
      updateArrowDrawingPreview();
      return;
    }

    onCanvasTouchMove(event);
    if (connectionDrag) updateConnectionDrag();
  };

  const handleStageTouchEnd = (event: { evt: TouchEvent }) => {
    if (isAddingArrow) return;

    onCanvasTouchEnd(event);
    if (connectionDrag) finishConnectionDrag();
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
      draggable={!isAddingArrow}
      dragBoundFunc={constrainPosition}
      onDragEnd={isAddingArrow ? undefined : onCanvasDragEnd}
      onTouchCancel={isAddingArrow ? undefined : onCanvasTouchEnd}
      onTouchEnd={isAddingArrow ? undefined : handleStageTouchEnd}
      onTouchMove={handleStageTouchMove}
      onTouchStart={isAddingArrow ? undefined : onCanvasTouchStart}
      onWheel={onCanvasWheel}
      onClick={isAddingArrow ? handleArrowPoint : undefined}
      onTap={isAddingArrow ? handleArrowPoint : undefined}
      onMouseMove={isAddingArrow ? updateArrowDrawingPreview : connectionDrag ? updateConnectionDrag : undefined}
      onMouseUp={!isAddingArrow && connectionDrag ? finishConnectionDrag : undefined}
      onMouseLeave={isAddingArrow ? () => setArrowDrawingPointer(null) : connectionDrag ? () => {
        const activeDrag = connectionDragRef.current;
        if (activeDrag) setActiveConnectionDrag({ ...activeDrag, targetMarkId: null, endAnchor: null });
      } : undefined}
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
            <MarkConnections marks={previousFrame.marks} connections={previousFrame.connections} isShadow />
            {previousFrame.marks.map((mark) => (
              <Fragment key={`shadow-${shadowIndex}-${mark.id}`}>
                <MarkRotationArrow mark={mark} isShadow />
                <Mark mark={mark} isSelected={false} isShadow />
              </Fragment>
            ))}
            {!presenterMode && !isExporting && previousFrame.boats.map((boat) => (
              <Boat key={`shadow-${shadowIndex}-${boat.id}`} boat={boat} isSelected={false} isShadow showSpeechBubble={false} />
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
          connections={activeFrame.connections}
          interactive={!isExporting}
          highlightMarkId={selectedType === 'mark' ? selectedId : null}
          selectedConnectionId={selectedType === 'connection' ? selectedId : null}
          onSelectConnection={(id) => onSelectObject(id, 'connection')}
          onOpenInspector={onOpenInspector}
        />

        {connectionDrag && (
          <Line
            points={[
              (() => {
                const sourceMark = activeFrame.marks.find((mark) => mark.id === connectionDrag.sourceMarkId);
                return sourceMark ? getMarkConnectionPoint(sourceMark, connectionDrag.startAnchor).x : connectionDrag.pointer.x;
              })(),
              (() => {
                const sourceMark = activeFrame.marks.find((mark) => mark.id === connectionDrag.sourceMarkId);
                return sourceMark ? getMarkConnectionPoint(sourceMark, connectionDrag.startAnchor).y : connectionDrag.pointer.y;
              })(),
              connectionDrag.pointer.x,
              connectionDrag.pointer.y,
            ]}
            stroke="#22d3ee"
            strokeWidth={3}
            dash={[10, 8]}
            opacity={0.9}
            listening={false}
          />
        )}

        {isAddingArrow && arrowDrawingStart && (
          <>
            <Line
              points={[
                arrowDrawingStart.x,
                arrowDrawingStart.y,
                arrowDrawingPointer?.x ?? arrowDrawingStart.x,
                arrowDrawingPointer?.y ?? arrowDrawingStart.y,
              ]}
              stroke="#22d3ee"
              strokeWidth={3}
              dash={[10, 8]}
              opacity={0.9}
              listening={false}
            />
            <Circle
              x={arrowDrawingStart.x}
              y={arrowDrawingStart.y}
              radius={8}
              fill="#22d3ee"
              stroke="#ecfeff"
              strokeWidth={2}
              listening={false}
            />
          </>
        )}

        {activeFrame.marks.map((mark) => (
          <Fragment key={mark.id}>
            <MarkRotationArrow
              mark={mark}
              isSelected={selectedId === mark.id}
            />
            <Mark
              mark={mark}
              isSelected={selectedId === mark.id}
              offenseColor={offenseTargetColors.get(`mark:${mark.id}`)}
              isConnectionTarget={connectionDrag?.targetMarkId === mark.id}
              readOnly={readOnly || isExporting}
              onOpenInspector={readOnly || isExporting ? undefined : () => onOpenInspector(mark.id, 'mark')}
              snapFn={(position) => getSnappedAbsolutePosition(mark.id, position)}
              onSelect={(id) => {
                onSelectObject(id, 'mark');
                onSnapPreview(null);
              }}
              onMove={(id, position) => {
                onSnapPreview(null);
                onMoveMark(id, position);
              }}
              onStartConnection={startConnectionDrag}
            />
          </Fragment>
        ))}

        {activeFrame.boats.map((boat) => (
          <Boat
            key={boat.id}
            boat={boat}
            isSelected={selectedId === boat.id}
            showSpeechBubble={false}
            offenseColor={offenseTargetColors.get(`boat:${boat.id}`)}
            readOnly={readOnly}
            onOpenInspector={readOnly ? undefined : () => onOpenInspector(boat.id, 'boat')}
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
            readOnly={readOnly}
            onOpenInspector={readOnly ? undefined : () => onOpenInspector(arrow.id, 'arrow')}
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
            readOnly={readOnly}
            onOpenInspector={readOnly ? undefined : () => onOpenInspector(comment.id, 'comment')}
            onSelect={(id) => onSelectObject(id, 'comment')}
            onMove={onMoveComment}
          />
        ))}

        {(activeFrame.images ?? []).map((image) => (
          <DiagramImage
            key={image.id}
            image={image}
            isSelected={selectedId === image.id}
            readOnly={readOnly}
            onOpenInspector={readOnly ? undefined : () => onOpenInspector(image.id, 'image')}
            onSelect={(id) => onSelectObject(id, 'image')}
            onMove={onMoveImage}
          />
        ))}
      </Layer>

      <Layer zIndex={100} listening={false}>
        {!presenterMode && !isExporting && previousSpeechBubblePositions.flatMap(({ frame, positions }) => (
          frame.boats.map((boat) => {
            const position = positions.get(boat.id);
            return position ? (
              <PositionedSpeechBubble
                key={`shadow-bubble-${frame.id}-${boat.id}`}
                boat={boat}
                position={position}
                isSelected={false}
                isShadow
              />
            ) : null;
          })
        ))}
        {activeFrame.boats.map((boat) => {
          const position = speechBubblePositions.get(boat.id);
          return position ? (
            <PositionedSpeechBubble
              key={`bubble-${boat.id}`}
              boat={boat}
              position={position}
              isSelected={selectedId === boat.id}
            />
          ) : null;
        })}
      </Layer>

      <Layer listening={false}>
        <SnapIndicator target={snapTarget} />
      </Layer>
    </Stage>
  );
}
