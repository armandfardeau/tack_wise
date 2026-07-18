import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { Rnd } from 'react-rnd';
import type { DisplayMode, Frame, Theme } from '../types';
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
  getSnappedPosition: (objectId: string, position: Position) => Position;
  gridSnapEnabled: boolean;
  isPlaying: boolean;
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
  onTogglePlaying: () => void;
  onSetPlaySpeed: (speed: number) => void;
  playSpeed: number;
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
  getSnappedPosition,
  gridSnapEnabled,
  isPlaying,
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
  onTogglePlaying,
  onSetPlaySpeed,
  playSpeed,
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
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    if (!selectedId || !isInspectorOpen) return undefined;

    const handlePointerOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && inspectorRef.current?.contains(event.target)) return;
      setIsInspectorOpen(false);
      onClearSelection();
    };

    document.addEventListener('pointerdown', handlePointerOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerOutside, true);
  }, [isInspectorOpen, onClearSelection, selectedId]);

  const handleSelectObject = (id: string, type: Exclude<SelectedType, null>) => {
    setIsInspectorOpen(false);
    onSelectObject(id, type);
  };

  const handleOpenInspector = (id: string, type: Exclude<SelectedType, null>) => {
    setIsInspectorOpen(true);
    onSelectObject(id, type);
  };

  const handleAddBoat = () => {
    onAddBoat();
    setIsInspectorOpen(true);
  };

  const handleAddMark = (shape?: Mark['shape']) => {
    onAddMark(shape);
    setIsInspectorOpen(true);
  };

  const handleAddArrow = () => {
    onAddArrow();
    setIsInspectorOpen(true);
  };

  const handleAddComment = () => {
    onAddComment();
    setIsInspectorOpen(true);
  };

  const handleAddImage = (src: string, name?: string) => {
    onAddImage(src, name);
    setIsInspectorOpen(true);
  };

  const selectedPosition = (() => {
    if (selectedType === 'boat') return selectedBoat ? { x: selectedBoat.x, y: selectedBoat.y } : null;
    if (selectedType === 'mark') return selectedMark ? { x: selectedMark.x, y: selectedMark.y } : null;
    if (selectedType === 'comment') return selectedComment ? { x: selectedComment.x, y: selectedComment.y } : null;
    if (selectedType === 'image') return selectedImage ? { x: selectedImage.x, y: selectedImage.y } : null;
    if (selectedType === 'arrow' && selectedArrow?.points.length) {
      const firstPoint = selectedArrow.points[0];
      const lastPoint = selectedArrow.points[selectedArrow.points.length - 1];
      return { x: (firstPoint.x + lastPoint.x) / 2, y: (firstPoint.y + lastPoint.y) / 2 };
    }
    return null;
  })();

  const inspectorHeightEstimate = selectedType === 'wind' || selectedType === 'grid' || selectedType === 'playback'
    ? 220
    : selectedType === 'boat'
      ? 560
      : selectedType === 'mark'
        ? 520
        : 360;
  const inspectorMaxTop = Math.max(
    12,
    stageSize.height - Math.min(inspectorHeightEstimate, stageSize.height - 24) - 12,
  );
  const isCompactLayout = typeof window !== 'undefined' && window.innerWidth <= 768;
  const inspectorWidth = isCompactLayout ? Math.max(0, window.innerWidth - 24) : 292;

  const inspectorStyle = selectedType === 'wind'
    ? {
        left: isCompactLayout
          ? 12
          : Math.max(12, Math.min(stageSize.width - inspectorWidth - 12, stageSize.width / 2 - inspectorWidth / 2)),
        top: Math.max(12, Math.min(inspectorMaxTop, 84)),
      }
    : selectedType === 'grid'
      ? {
          left: isCompactLayout ? 12 : 16,
          top: Math.max(12, Math.min(inspectorMaxTop, 68)),
        }
      : selectedType === 'playback'
        ? {
            left: isCompactLayout ? 12 : 16,
            top: Math.max(12, Math.min(inspectorMaxTop, stageSize.height - inspectorHeightEstimate - 72)),
          }
      : selectedPosition
      ? {
        left: isCompactLayout
          ? 12
          : Math.max(12, Math.min(stageSize.width - inspectorWidth - 12, canvasPosition.x + selectedPosition.x * canvasZoom + 24)),
        top: Math.max(12, Math.min(inspectorMaxTop, canvasPosition.y + selectedPosition.y * canvasZoom + 24)),
        }
      : undefined;

  const shouldShowInspector = isInspectorOpen && (selectedType === 'wind' || selectedType === 'grid' || selectedType === 'playback' || Boolean(selectedPosition));

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
          showGrid={showGrid}
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
            default={{ x: inspectorStyle.left, y: inspectorStyle.top, width: inspectorWidth, height: 'auto' }}
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
              onTogglePlaying={onTogglePlaying}
              onSetPlaySpeed={onSetPlaySpeed}
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
        <PlaybackButton
          isPlaying={isPlaying}
          onTogglePlaying={onTogglePlaying}
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
