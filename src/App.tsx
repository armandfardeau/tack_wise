import { useState } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import CanvasWorkspace from './components/CanvasWorkspace';
import ExportOverlay from './components/ExportOverlay';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import { CANVAS_ZOOM_STEP } from './constants';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useGridSnap } from './hooks/useGridSnap';
import { useScenario } from './hooks/useScenario';
import { useScenarioExport } from './hooks/useScenarioExport';

export default function App() {
  const scenario = useScenario();
  const viewport = useCanvasViewport();
  const [showGrid, setShowGrid] = useState(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const gridSnap = useGridSnap(gridSnapEnabled);
  const exportState = useScenarioExport({
    currentFrameIndex: scenario.currentFrameIndex,
    frames: scenario.frames,
    playSpeed: scenario.playSpeed,
    setCurrentFrameIndex: scenario.setCurrentFrameIndex,
    setIsPlaying: scenario.setIsPlaying,
    stageRef: viewport.stageRef,
    stageSize: viewport.stageSize,
  });

  return (
    <main className="app-shell dark-theme">
      <AppHeader isExporting={exportState.isExporting} onExport={exportState.triggerExport} />

      <section className="workspace">
        <Sidebar
          activeFrame={scenario.activeFrame}
          autoSailTrim={scenario.autoSailTrim}
          gridSnapEnabled={gridSnapEnabled}
          onAddBoat={scenario.addBoat}
          onAddMark={scenario.addMark}
          onDeleteSelected={scenario.deleteSelected}
          onSetAutoSailTrim={scenario.setAutoSailTrim}
          onSetGridSnapEnabled={setGridSnapEnabled}
          onSetShowGrid={setShowGrid}
          selectedBoat={scenario.selectedBoat}
          selectedMark={scenario.selectedMark}
          selectedType={scenario.selectedType}
          showGrid={showGrid}
          updateActiveFrame={scenario.updateActiveFrame}
          updateBoat={scenario.updateBoat}
          updateMark={scenario.updateMark}
        />

        <CanvasWorkspace
          activeFrame={scenario.activeFrame}
          canvasPosition={viewport.canvasPosition}
          canvasZoom={viewport.canvasZoom}
          constrainPosition={viewport.constrainPosition}
          currentFrameIndex={scenario.currentFrameIndex}
          frames={scenario.frames}
          getSnappedPosition={gridSnap.getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          handleCanvasDragEnd={viewport.handleCanvasDragEnd}
          handleCanvasWheel={viewport.handleCanvasWheel}
          maxZoom={viewport.maxZoom}
          minZoom={viewport.minZoom}
          onMoveBoat={scenario.moveBoat}
          onMoveMark={scenario.moveMark}
          onSelectObject={scenario.selectObject}
          onSnapPreview={gridSnap.setSnapPreview}
          onZoomIn={() => viewport.zoomCanvasFromCenter(CANVAS_ZOOM_STEP)}
          onZoomOut={() => viewport.zoomCanvasFromCenter(1 / CANVAS_ZOOM_STEP)}
          onResetZoom={viewport.resetCanvasZoom}
          selectedId={scenario.selectedId}
          selectedType={scenario.selectedType}
          canvasWrapRef={viewport.canvasWrapRef}
          showGrid={showGrid}
          snapTarget={gridSnap.snapTarget}
          stageRef={viewport.stageRef}
          stageSize={viewport.stageSize}
        >
          <Timeline
            currentFrameIndex={scenario.currentFrameIndex}
            frames={scenario.frames}
            isPlaying={scenario.isPlaying}
            onAddFrame={scenario.addFrame}
            onDeleteFrame={() => scenario.deleteFrame(scenario.currentFrameIndex)}
            onDuplicateFrame={scenario.duplicateFrame}
            onSelectFrame={scenario.selectFrame}
            onTogglePlaying={() => scenario.setIsPlaying(!scenario.isPlaying)}
            playSpeed={scenario.playSpeed}
            onSetPlaySpeed={scenario.setPlaySpeed}
          />
        </CanvasWorkspace>
      </section>

      {exportState.isExporting && (
        <ExportOverlay
          exportProgress={exportState.exportProgress}
          exportType={exportState.exportType}
        />
      )}
    </main>
  );
}
