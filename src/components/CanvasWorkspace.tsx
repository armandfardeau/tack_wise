import type { ReactNode, RefObject } from 'react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { Frame } from '../types';
import type { SnapTarget } from '../hooks/useGridSnap';
import type { Position } from '../utils/simulation';
import CanvasZoomControls from './CanvasZoomControls';
import SimulationCanvas from './SimulationCanvas';
import WindHud from './WindHud';

interface CanvasWorkspaceProps {
  activeFrame: Frame;
  canvasPosition: Position;
  canvasZoom: number;
  constrainPosition: (position: Position) => Position;
  currentFrameIndex: number;
  frames: Frame[];
  getSnappedPosition: (objectId: string, position: Position) => Position;
  gridSnapEnabled: boolean;
  handleCanvasDragEnd: () => void;
  handleCanvasWheel: (event: { evt: { preventDefault: () => void; deltaY: number } }) => void;
  maxZoom: number;
  minZoom: number;
  onMoveBoat: (boatId: string, position: Position) => void;
  onMoveMark: (markId: string, position: Position) => void;
  onOpenControls: () => void;
  onSelectObject: (id: string, type: 'boat' | 'mark') => void;
  onSnapPreview: (target: SnapTarget | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  selectedId: string | null;
  selectedType: 'boat' | 'mark' | null;
  canvasWrapRef: RefObject<HTMLDivElement | null>;
  showGrid: boolean;
  snapTarget: SnapTarget | null;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
  children: ReactNode;
}

export default function CanvasWorkspace({
  activeFrame,
  canvasPosition,
  canvasZoom,
  constrainPosition,
  currentFrameIndex,
  frames,
  getSnappedPosition,
  gridSnapEnabled,
  handleCanvasDragEnd,
  handleCanvasWheel,
  maxZoom,
  minZoom,
  onMoveBoat,
  onMoveMark,
  onOpenControls,
  onSelectObject,
  onSnapPreview,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  selectedId,
  selectedType,
  canvasWrapRef,
  showGrid,
  snapTarget,
  stageRef,
  stageSize,
  children,
}: CanvasWorkspaceProps) {
  return (
    <section className="canvas-container">
      <div ref={canvasWrapRef} className="canvas-wrap">
        <SimulationCanvas
          activeFrame={activeFrame}
          canvasPosition={canvasPosition}
          canvasZoom={canvasZoom}
          constrainPosition={constrainPosition}
          currentFrameIndex={currentFrameIndex}
          frames={frames}
          getSnappedPosition={getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          onCanvasDragEnd={handleCanvasDragEnd}
          onCanvasWheel={handleCanvasWheel}
          onMoveBoat={onMoveBoat}
          onMoveMark={onMoveMark}
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
