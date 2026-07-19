import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { Rnd } from 'react-rnd';
import type { AnimationMode, DisplayMode, Frame, Theme } from '../types';
import type { Boat, CommentNote, DiagramImage, Mark, TacticalArrow } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import type { SnapTarget } from '../hooks/useGridSnap';
import type { Position } from '../utils/simulation';
import CanvasZoomControls from './CanvasZoomControls';
import SimulationCanvas from './SimulationCanvas';
import WindHud from './WindHud';
import Inspector from './Inspector';
import GridSettingsButton from './GridSettingsButton';
import FloatingAddMenu from './FloatingAddMenu';
import PlaybackButton from './PlaybackButton';
import CanvasHistoryControls from './CanvasHistoryControls';

interface CanvasWorkspaceProps {
  activeFrame: Frame;
  inspectorFrame: Frame;
  autoSailTrim: boolean;
  canvasPosition: Position;
  canvasZoom: number;
  constrainPosition: (position: Position) => Position;
  currentFrameIndex: number;
  displayMode: DisplayMode;
  theme: Theme;
  frames: Frame[];
  canRedo: boolean;
  canUndo: boolean;
  hasAutosave: boolean;
  getSnappedPosition: (objectId: string, position: Position) => Position;
  gridSnapEnabled: boolean;
  isPlaying: boolean;
  isExporting: boolean;
  handleCanvasDragEnd: () => void;
  handleCanvasWheel: (event: { evt: { preventDefault: () => void; deltaY: number } }) => void;
  maxZoom: number;
  minZoom: number;
  onAddBoat: () => void;
  onAddMark: (shape?: Mark['shape']) => void;
  onAddArrow: () => void;
  onAddComment: () => void;
  onAddImage: (src: string, name?: string) => void;
  onMoveBoat: (boatId: string, position: Position) => void;
  onRotateBoat: (boatId: string, heading: number) => void;
  onMoveMark: (markId: string, position: Position) => void;
  onMoveArrow: (arrowId: string, points: NonNullable<Frame['arrows']>[number]['points']) => void;
  onMoveComment: (commentId: string, position: Position) => void;
  onMoveImage: (imageId: string, position: Position) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  onToggleTheme: () => void;
  onRedo: () => void;
  onRestoreAutosave: () => void;
  onTogglePlaying: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onReplayFromStart: () => void;
  onUndo: () => void;
  onSetPlaySpeed: (speed: number) => void;
  animationMode: AnimationMode;
  onSetAnimationMode: (mode: AnimationMode) => void;
  playSpeed: number;
  onPanCanvasBy: (delta: Position) => void;
  onOpenControls: () => void;
  onSelectObject: (id: string, type: Exclude<SelectedType, null>) => void;
  onSnapPreview: (target: SnapTarget | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  selectedId: string | null;
  selectedType: SelectedType;
  selectedBoat: Boat | undefined;
  selectedMark: Mark | undefined;
  selectedArrow?: TacticalArrow;
  selectedComment?: CommentNote;
  selectedImage?: DiagramImage;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
  updateActiveFrame: (changes: Partial<Frame>) => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
  updateArrow?: (arrowId: string, changes: Partial<TacticalArrow>) => void;
  updateComment?: (commentId: string, changes: Partial<CommentNote>) => void;
  updateImage?: (imageId: string, changes: Partial<DiagramImage>) => void;
  canvasWrapRef: RefObject<HTMLDivElement | null>;
  showGrid: boolean;
  snapTarget: SnapTarget | null;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
  children?: ReactNode;
}

interface InspectorPlacement {
  left: number;
  top: number;
  needsPan: boolean;
  panDelta: Position;
}

const INSPECTOR_MARGIN = 12;
const INSPECTOR_GAP = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getInspectorPlacement(
  anchor: Position,
  objectSize: { width: number; height: number },
  inspectorSize: { width: number; height: number },
  stageSize: { width: number; height: number },
): InspectorPlacement {
  const maxLeft = Math.max(INSPECTOR_MARGIN, stageSize.width - inspectorSize.width - INSPECTOR_MARGIN);
  const maxTop = Math.max(INSPECTOR_MARGIN, stageSize.height - Math.min(inspectorSize.height, stageSize.height - INSPECTOR_MARGIN * 2) - INSPECTOR_MARGIN);
  const centeredTop = clamp(anchor.y - inspectorSize.height / 2, INSPECTOR_MARGIN, maxTop);
  const centeredLeft = clamp(anchor.x - inspectorSize.width / 2, INSPECTOR_MARGIN, maxLeft);

  const candidates = [
    {
      left: centeredLeft,
      top: centeredTop,
      fits: !(
        centeredLeft < anchor.x + objectSize.width / 2
        && centeredLeft + inspectorSize.width > anchor.x - objectSize.width / 2
        && centeredTop < anchor.y + objectSize.height / 2
        && centeredTop + inspectorSize.height > anchor.y - objectSize.height / 2
      ),
    },
    {
      left: anchor.x + objectSize.width / 2 + INSPECTOR_GAP,
      top: centeredTop,
      fits: anchor.x + objectSize.width / 2 + INSPECTOR_GAP >= INSPECTOR_MARGIN
        && anchor.x + objectSize.width / 2 + INSPECTOR_GAP <= maxLeft,
    },
    {
      left: anchor.x - objectSize.width / 2 - INSPECTOR_GAP - inspectorSize.width,
      top: centeredTop,
      fits: anchor.x - objectSize.width / 2 - INSPECTOR_GAP - inspectorSize.width >= INSPECTOR_MARGIN,
    },
    {
      left: centeredLeft,
      top: anchor.y + objectSize.height / 2 + INSPECTOR_GAP,
      fits: anchor.y + objectSize.height / 2 + INSPECTOR_GAP <= maxTop,
    },
    {
      left: centeredLeft,
      top: anchor.y - objectSize.height / 2 - INSPECTOR_GAP - inspectorSize.height,
      fits: anchor.y - objectSize.height / 2 - INSPECTOR_GAP - inspectorSize.height >= INSPECTOR_MARGIN,
    },
  ];

  const availableCandidate = candidates.find((candidate) => candidate.fits);
  const objectHalfWidth = objectSize.width / 2;
  const objectHalfHeight = objectSize.height / 2;
  const visibleMinX = INSPECTOR_MARGIN + objectHalfWidth;
  const visibleMaxX = stageSize.width - INSPECTOR_MARGIN - objectHalfWidth;
  const visibleMinY = INSPECTOR_MARGIN + objectHalfHeight;
  const visibleMaxY = stageSize.height - INSPECTOR_MARGIN - objectHalfHeight;
  const visibleObject = anchor.x >= visibleMinX
    && anchor.x <= visibleMaxX
    && anchor.y >= visibleMinY
    && anchor.y <= visibleMaxY;

  if (visibleObject) {
    if (availableCandidate) {
      return {
        left: availableCandidate.left,
        top: availableCandidate.top,
        needsPan: false,
        panDelta: { x: 0, y: 0 },
      };
    }

    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: {
        x: stageSize.width / 2 - anchor.x,
        y: stageSize.height / 2 - anchor.y,
      },
    };
  }

  const rightTargetMaxX = maxLeft - objectHalfWidth - INSPECTOR_GAP;
  if (rightTargetMaxX >= visibleMinX) {
    const targetX = clamp(stageSize.width / 2, visibleMinX, rightTargetMaxX);
    const targetY = clamp(stageSize.height / 2, visibleMinY, visibleMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  const leftTargetMinX = INSPECTOR_MARGIN + inspectorSize.width + INSPECTOR_GAP + objectHalfWidth;
  if (leftTargetMinX <= visibleMaxX) {
    const targetX = clamp(stageSize.width / 2, leftTargetMinX, visibleMaxX);
    const targetY = clamp(stageSize.height / 2, visibleMinY, visibleMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  const belowTargetMaxY = maxTop - objectHalfHeight - INSPECTOR_GAP;
  if (belowTargetMaxY >= visibleMinY) {
    const targetX = clamp(stageSize.width / 2, visibleMinX, visibleMaxX);
    const targetY = clamp(stageSize.height / 2, visibleMinY, belowTargetMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  const aboveTargetMinY = INSPECTOR_MARGIN + inspectorSize.height + INSPECTOR_GAP + objectHalfHeight;
  if (aboveTargetMinY <= visibleMaxY) {
    const targetX = clamp(stageSize.width / 2, visibleMinX, visibleMaxX);
    const targetY = clamp(stageSize.height / 2, aboveTargetMinY, visibleMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  return {
    left: centeredLeft,
    top: centeredTop,
    needsPan: true,
    panDelta: {
      x: stageSize.width / 2 - anchor.x,
      y: stageSize.height / 2 - anchor.y,
    },
  };
}

export default function CanvasWorkspace({
  activeFrame,
  inspectorFrame,
  autoSailTrim,
  canvasPosition,
  canvasZoom,
  constrainPosition,
  currentFrameIndex,
  displayMode,
  theme,
  frames,
  canRedo,
  canUndo,
  hasAutosave,
  getSnappedPosition,
  gridSnapEnabled,
  isPlaying,
  isExporting,
  handleCanvasDragEnd,
  handleCanvasWheel,
  maxZoom,
  minZoom,
  onAddBoat,
  onAddMark,
  onAddArrow,
  onAddComment,
  onAddImage,
  onMoveBoat,
  onRotateBoat,
  onMoveMark,
  onMoveArrow,
  onMoveComment,
  onMoveImage,
  onDeleteSelected,
  onClearSelection,
  onSetAutoSailTrim,
  onSetGridSnapEnabled,
  onSetShowGrid,
  onToggleTheme,
  onRedo,
  onRestoreAutosave,
  onTogglePlaying,
  onStepBackward,
  onStepForward,
  onReplayFromStart,
  onUndo,
  onSetPlaySpeed,
  animationMode,
  onSetAnimationMode,
  playSpeed,
  onPanCanvasBy,
  onOpenControls,
  onSelectObject,
  onSnapPreview,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  selectedId,
  selectedType,
  selectedBoat,
  selectedMark,
  selectedArrow,
  selectedComment,
  selectedImage,
  updateBoat,
  updateActiveFrame,
  updateMark,
  updateArrow,
  updateComment,
  updateImage,
  canvasWrapRef,
  showGrid,
  snapTarget,
  stageRef,
  stageSize,
  children,
}: CanvasWorkspaceProps) {
  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const autoPanKeyRef = useRef<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorPosition, setInspectorPosition] = useState<Position | null>(null);

  const resetInspectorPlacement = () => {
    autoPanKeyRef.current = null;
    setInspectorPosition(null);
  };

  useEffect(() => {
    if (!selectedId || !isInspectorOpen) return undefined;

    const handlePointerOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && inspectorRef.current?.contains(event.target)) return;
      setIsInspectorOpen(false);
      resetInspectorPlacement();
      onClearSelection();
    };

    document.addEventListener('pointerdown', handlePointerOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerOutside, true);
  }, [isInspectorOpen, onClearSelection, selectedId]);

  const handleSelectObject = (id: string, type: Exclude<SelectedType, null>) => {
    resetInspectorPlacement();
    setIsInspectorOpen(false);
    onSelectObject(id, type);
  };

  const handleOpenInspector = (id: string, type: Exclude<SelectedType, null>) => {
    resetInspectorPlacement();
    setIsInspectorOpen(true);
    onSelectObject(id, type);
  };

  const handleAddBoat = () => {
    resetInspectorPlacement();
    onAddBoat();
    setIsInspectorOpen(true);
  };

  const handleAddMark = (shape?: Mark['shape']) => {
    resetInspectorPlacement();
    onAddMark(shape);
    setIsInspectorOpen(true);
  };

  const handleAddArrow = () => {
    resetInspectorPlacement();
    onAddArrow();
    setIsInspectorOpen(true);
  };

  const handleAddComment = () => {
    resetInspectorPlacement();
    onAddComment();
    setIsInspectorOpen(true);
  };

  const handleAddImage = (src: string, name?: string) => {
    resetInspectorPlacement();
    onAddImage(src, name);
    setIsInspectorOpen(true);
  };

  const selectedObjectRect = (() => {
    if (selectedType === 'boat' && selectedBoat) {
      return { left: selectedBoat.x - 40, top: selectedBoat.y - 55, width: 80, height: 110 };
    }

    if (selectedType === 'mark' && selectedMark) {
      return { left: selectedMark.x - 40, top: selectedMark.y - 30, width: 80, height: 60 };
    }

    if (selectedType === 'comment' && selectedComment) {
      const fontSize = selectedComment.fontSize ?? 14;
      const height = Math.max(48, selectedComment.text.split('\n').length * (fontSize + 5) + 18);
      return { left: selectedComment.x, top: selectedComment.y, width: selectedComment.width ?? 180, height };
    }

    if (selectedType === 'image' && selectedImage) {
      return { left: selectedImage.x, top: selectedImage.y, width: selectedImage.width, height: selectedImage.height };
    }

    if (selectedType === 'arrow' && selectedArrow?.points.length) {
      const xValues = selectedArrow.points.map((point) => point.x);
      const yValues = selectedArrow.points.map((point) => point.y);
      const left = Math.min(...xValues) - 16;
      const top = Math.min(...yValues) - 16;
      return {
        left,
        top,
        width: Math.max(...xValues) - left + 16,
        height: Math.max(...yValues) - top + 16,
      };
    }

    return null;
  })();

  const selectedPosition = selectedObjectRect
    ? {
        x: selectedObjectRect.left + selectedObjectRect.width / 2,
        y: selectedObjectRect.top + selectedObjectRect.height / 2,
      }
    : null;

  const inspectorHeightEstimate = selectedType === 'wind' || selectedType === 'grid' || selectedType === 'playback'
    ? 220
    : selectedType === 'boat'
      ? 560
      : selectedType === 'mark'
        ? 520
        : 360;
  const isCompactLayout = typeof window !== 'undefined' && window.innerWidth <= 768;
  const inspectorLayoutHeight = isCompactLayout
    ? Math.min(inspectorHeightEstimate, window.innerHeight * 0.45)
    : inspectorHeightEstimate;
  const inspectorMaxTop = Math.max(
    12,
    stageSize.height - Math.min(inspectorLayoutHeight, stageSize.height - 24) - 12,
  );
  const inspectorWidth = isCompactLayout ? Math.max(0, window.innerWidth - 24) : 292;
  const centeredInspectorLeft = isCompactLayout
    ? 12
    : Math.max(12, Math.min(stageSize.width - inspectorWidth - 12, stageSize.width / 2 - inspectorWidth / 2));
  const centeredInspectorTop = Math.max(
    12,
    Math.min(inspectorMaxTop, stageSize.height / 2 - inspectorLayoutHeight / 2),
  );

  const inspectorPlacement = selectedObjectRect && selectedPosition
    ? getInspectorPlacement(
        {
          x: canvasPosition.x + selectedPosition.x * canvasZoom,
          y: canvasPosition.y + selectedPosition.y * canvasZoom,
        },
        {
          width: selectedObjectRect.width * canvasZoom,
          height: selectedObjectRect.height * canvasZoom,
        },
        { width: inspectorWidth, height: inspectorLayoutHeight },
        stageSize,
      )
    : null;

  const inspectorStyle = selectedType === 'wind'
    ? {
        left: centeredInspectorLeft,
        top: Math.max(12, Math.min(inspectorMaxTop, 84)),
      }
    : selectedType === 'grid'
      ? {
          left: centeredInspectorLeft,
          top: centeredInspectorTop,
        }
      : selectedType === 'playback'
        ? {
            left: centeredInspectorLeft,
            top: centeredInspectorTop,
          }
      : inspectorPlacement
        ? { left: inspectorPlacement.left, top: inspectorPlacement.top }
      : undefined;

  const shouldShowInspector = isInspectorOpen && (selectedType === 'wind' || selectedType === 'grid' || selectedType === 'playback' || Boolean(selectedPosition));

  const inspectorPlacementKey = `${selectedId ?? ''}:${selectedType ?? ''}:${selectedPosition?.x ?? ''}:${selectedPosition?.y ?? ''}`;
  const inspectorStyleLeft = inspectorStyle?.left;
  const inspectorStyleTop = inspectorStyle?.top;
  const inspectorNeedsPan = inspectorPlacement?.needsPan ?? false;
  const inspectorPanDeltaX = inspectorPlacement?.panDelta.x ?? 0;
  const inspectorPanDeltaY = inspectorPlacement?.panDelta.y ?? 0;

  useEffect(() => {
    if (!shouldShowInspector || inspectorStyleLeft === undefined || inspectorStyleTop === undefined) {
      autoPanKeyRef.current = null;
      setInspectorPosition((position) => position === null ? position : null);
      return;
    }

    if (inspectorNeedsPan && autoPanKeyRef.current !== inspectorPlacementKey) {
      autoPanKeyRef.current = inspectorPlacementKey;
      setInspectorPosition(null);
      onPanCanvasBy({ x: inspectorPanDeltaX, y: inspectorPanDeltaY });
      return;
    }

    setInspectorPosition((position) => (
      position?.x === inspectorStyleLeft && position.y === inspectorStyleTop
        ? position
        : { x: inspectorStyleLeft, y: inspectorStyleTop }
    ));
  }, [
    inspectorNeedsPan,
    inspectorPanDeltaX,
    inspectorPanDeltaY,
    inspectorPlacementKey,
    inspectorStyleLeft,
    inspectorStyleTop,
    onPanCanvasBy,
    shouldShowInspector,
  ]);

  return (
    <section className="canvas-container">
      <div ref={canvasWrapRef} className="canvas-wrap">
        <SimulationCanvas
          activeFrame={activeFrame}
          canvasPosition={canvasPosition}
          canvasZoom={canvasZoom}
          constrainPosition={constrainPosition}
          currentFrameIndex={currentFrameIndex}
          displayMode={displayMode}
          theme={theme}
          frames={frames}
          getSnappedPosition={getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          showGrid={showGrid && !isExporting}
          onCanvasDragEnd={handleCanvasDragEnd}
          onCanvasWheel={handleCanvasWheel}
          onMoveBoat={onMoveBoat}
          onRotateBoat={onRotateBoat}
          onMoveMark={onMoveMark}
          onMoveArrow={onMoveArrow}
          onMoveComment={onMoveComment}
          onMoveImage={onMoveImage}
          onOpenControls={onOpenControls}
          onOpenInspector={handleOpenInspector}
          onSelectObject={handleSelectObject}
          onSnapPreview={onSnapPreview}
          selectedId={selectedId}
          selectedType={selectedType}
          snapTarget={snapTarget}
          stageRef={stageRef}
          stageSize={stageSize}
        />
        {shouldShowInspector && inspectorStyle && (
          <Rnd
            bounds="parent"
            className="floating-inspector"
            dragHandleClassName="inspector-drag-handle"
            enableResizing={false}
            position={{
              x: inspectorPosition?.x ?? inspectorStyle.left,
              y: inspectorPosition?.y ?? inspectorStyle.top,
            }}
            onDragStop={(_, data) => setInspectorPosition({ x: data.x, y: data.y })}
            key={selectedId ?? 'inspector'}
          >
            <div ref={inspectorRef}>
            <Inspector
              activeFrame={inspectorFrame}
              autoSailTrim={autoSailTrim}
              gridSnapEnabled={gridSnapEnabled}
              isPlaying={isPlaying}
              onDelete={onDeleteSelected}
              onSetGridSnapEnabled={onSetGridSnapEnabled}
              onSetAutoSailTrim={onSetAutoSailTrim}
              onSetShowGrid={onSetShowGrid}
              onToggleTheme={onToggleTheme}
              theme={theme}
              onTogglePlaying={onTogglePlaying}
              onSetPlaySpeed={onSetPlaySpeed}
              animationMode={animationMode}
              onSetAnimationMode={onSetAnimationMode}
              playSpeed={playSpeed}
              selectedBoat={selectedBoat}
              selectedMark={selectedMark}
              selectedArrow={selectedArrow}
              selectedComment={selectedComment}
              selectedImage={selectedImage}
              selectedType={selectedType}
              showGrid={showGrid}
              updateBoat={updateBoat}
              updateActiveFrame={updateActiveFrame}
              updateMark={updateMark}
              updateArrow={updateArrow}
              updateComment={updateComment}
              updateImage={updateImage}
            />
            </div>
          </Rnd>
        )}
        <FloatingAddMenu
          onAddBoat={handleAddBoat}
          onAddMark={handleAddMark}
          onAddArrow={handleAddArrow}
          onAddComment={handleAddComment}
          onAddImage={handleAddImage}
        />
        <CanvasHistoryControls
          canRedo={canRedo}
          canUndo={canUndo}
          hasAutosave={hasAutosave}
          onRedo={onRedo}
          onRestoreAutosave={onRestoreAutosave}
          onUndo={onUndo}
        />
        <PlaybackButton
          isPlaying={isPlaying}
          currentFrameIndex={currentFrameIndex}
          frameCount={frames.length}
          onTogglePlaying={onTogglePlaying}
          onStepBackward={onStepBackward}
          onStepForward={onStepForward}
          onReplayFromStart={onReplayFromStart}
          onOpenInspector={() => handleOpenInspector('playback', 'playback')}
        />
        <CanvasZoomControls
          canvasPosition={canvasPosition}
          canvasZoom={canvasZoom}
          maxZoom={maxZoom}
          minZoom={minZoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onResetZoom}
        />
        <GridSettingsButton onOpenInspector={() => handleOpenInspector('grid', 'grid')} />
        <WindHud
          windAngle={activeFrame.windAngle}
          windSpeed={activeFrame.windSpeed}
          onSelect={() => handleSelectObject('wind', 'wind')}
        />
      </div>
      {children}
    </section>
  );
}
