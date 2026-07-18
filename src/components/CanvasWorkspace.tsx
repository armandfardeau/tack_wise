import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { DisplayMode, Frame } from '../types';
import type { Boat, CommentNote, DiagramImage, Mark, TacticalArrow } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import type { SnapTarget } from '../hooks/useGridSnap';
import type { Position } from '../utils/simulation';
import CanvasZoomControls from './CanvasZoomControls';
import SimulationCanvas from './SimulationCanvas';
import WindHud from './WindHud';
import Inspector from './Inspector';
import FloatingAddMenu from './FloatingAddMenu';

interface CanvasWorkspaceProps {
  activeFrame: Frame;
  inspectorFrame: Frame;
  autoSailTrim: boolean;
  canvasPosition: Position;
  canvasZoom: number;
  constrainPosition: (position: Position) => Position;
  currentFrameIndex: number;
  displayMode: DisplayMode;
  frames: Frame[];
  getSnappedPosition: (objectId: string, position: Position) => Position;
  gridSnapEnabled: boolean;
  handleCanvasDragEnd: () => void;
  handleCanvasWheel: (event: { evt: { preventDefault: () => void; deltaY: number } }) => void;
  maxZoom: number;
  minZoom: number;
  onMoveBoat: (boatId: string, position: Position) => void;
  onRotateBoat: (boatId: string, heading: number) => void;
  onMoveMark: (markId: string, position: Position) => void;
  onMoveArrow: (arrowId: string, points: NonNullable<Frame['arrows']>[number]['points']) => void;
  onMoveComment: (commentId: string, position: Position) => void;
  onMoveImage: (imageId: string, position: Position) => void;
  onAddBoat: () => void;
  onAddMark: (shape?: Mark['shape']) => void;
  onAddArrow: () => void;
  onAddComment: () => void;
  onAddImage: (src: string, name?: string) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
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
  updateMark: (markId: string, changes: Partial<Mark>) => void;
  updateArrow?: (arrowId: string, changes: Partial<TacticalArrow>) => void;
  updateComment?: (commentId: string, changes: Partial<CommentNote>) => void;
  updateImage?: (imageId: string, changes: Partial<DiagramImage>) => void;
  canvasWrapRef: RefObject<HTMLDivElement | null>;
  showGrid: boolean;
  snapTarget: SnapTarget | null;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
  children: ReactNode;
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
  frames,
  getSnappedPosition,
  gridSnapEnabled,
  handleCanvasDragEnd,
  handleCanvasWheel,
  maxZoom,
  minZoom,
  onMoveBoat,
  onRotateBoat,
  onMoveMark,
  onMoveArrow,
  onMoveComment,
  onMoveImage,
  onAddBoat,
  onAddMark,
  onAddArrow,
  onAddComment,
  onAddImage,
  onDeleteSelected,
  onClearSelection,
  onSetAutoSailTrim,
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

  useEffect(() => {
    if (!selectedId) return undefined;

    const handlePointerOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && inspectorRef.current?.contains(event.target)) return;
      onClearSelection();
    };

    document.addEventListener('pointerdown', handlePointerOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerOutside, true);
  }, [onClearSelection, selectedId]);

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

  const inspectorHeightEstimate = selectedType === 'boat'
    ? 560
    : selectedType === 'mark'
      ? 520
      : 360;
  const inspectorMaxTop = Math.max(
    12,
    stageSize.height - Math.min(inspectorHeightEstimate, stageSize.height - 24) - 12,
  );

  const inspectorStyle = selectedPosition
    ? {
        left: Math.max(12, Math.min(stageSize.width - 308, canvasPosition.x + selectedPosition.x * canvasZoom + 24)),
        top: Math.max(12, Math.min(inspectorMaxTop, canvasPosition.y + selectedPosition.y * canvasZoom + 24)),
      }
    : undefined;

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
          onSelectObject={onSelectObject}
          onSnapPreview={onSnapPreview}
          selectedId={selectedId}
          selectedType={selectedType}
          showGrid={showGrid}
          snapTarget={snapTarget}
          stageRef={stageRef}
          stageSize={stageSize}
        />
        {selectedPosition && inspectorStyle && (
          <div ref={inspectorRef} className="floating-inspector" style={inspectorStyle}>
            <Inspector
              activeFrame={inspectorFrame}
              autoSailTrim={autoSailTrim}
              onDelete={onDeleteSelected}
              onSetAutoSailTrim={onSetAutoSailTrim}
              selectedBoat={selectedBoat}
              selectedMark={selectedMark}
              selectedArrow={selectedArrow}
              selectedComment={selectedComment}
              selectedImage={selectedImage}
              selectedType={selectedType}
              updateBoat={updateBoat}
              updateMark={updateMark}
              updateArrow={updateArrow}
              updateComment={updateComment}
              updateImage={updateImage}
            />
          </div>
        )}
        <FloatingAddMenu
          onAddBoat={onAddBoat}
          onAddMark={onAddMark}
          onAddArrow={onAddArrow}
          onAddComment={onAddComment}
          onAddImage={onAddImage}
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
        <WindHud windAngle={activeFrame.windAngle} windSpeed={activeFrame.windSpeed} />
      </div>
      {children}
    </section>
  );
}
