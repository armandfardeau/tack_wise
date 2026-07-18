import { useEffect, useMemo, useRef, useState } from 'react';
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
import { createScenarioShareUrl, parseScenarioFromJson, parseScenarioShareUrl } from './utils/exporter';
import { getCanvasContentBounds } from './utils/simulation';

export default function App() {
  const scenario = useScenario();
  const canvasContentBounds = useMemo(() => getCanvasContentBounds(scenario.frames), [scenario.frames]);
  const viewport = useCanvasViewport(canvasContentBounds);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const gridSnap = useGridSnap(gridSnapEnabled);
  const { redo, undo } = scenario;
  const { importScenario } = scenario;
  const loadedShareRef = useRef(false);

  useEffect(() => {
    if (loadedShareRef.current) return;
    loadedShareRef.current = true;
    const sharedScenario = parseScenarioShareUrl();
    if (sharedScenario) importScenario(sharedScenario);
  }, [importScenario]);

  const handleShareScenario = async () => {
    const shareUrl = createScenarioShareUrl({
      version: 2,
      frames: scenario.frames,
      currentFrameIndex: scenario.currentFrameIndex,
      settings: scenario.settings,
    });

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert('Share link copied to clipboard.');
    } catch {
      window.prompt('Copy this share link:', shareUrl);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== 'z') return;

      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);
  const exportState = useScenarioExport({
    currentFrameIndex: scenario.currentFrameIndex,
    frames: scenario.frames,
    playSpeed: scenario.playSpeed,
    setCurrentFrameIndex: scenario.setCurrentFrameIndex,
    setIsPlaying: scenario.setIsPlaying,
    settings: scenario.settings,
    stageRef: viewport.stageRef,
    stageSize: viewport.stageSize,
  });

  const handleImportJson = async (file: File) => {
    try {
      const payload = parseScenarioFromJson(await file.text());
      scenario.importScenario(payload);
    } catch (error) {
      console.error('Import error: ', error);
      window.alert('Could not import scenario. Please select a valid Tack Wise JSON file.');
    }
  };

  return (
    <main className={`app-shell dark-theme${scenario.settings.presenterMode ? ' presenter-mode' : ''}`}>
      <AppHeader
        canRedo={scenario.canRedo}
        canUndo={scenario.canUndo}
        hasAutosave={scenario.hasAutosave}
        isExporting={exportState.isExporting}
        isSidebarOpen={isSidebarOpen}
        presenterMode={scenario.settings.presenterMode}
        onRedo={scenario.redo}
        onExport={exportState.triggerExport}
        onExportImage={exportState.triggerImageExport}
        onExportJson={() => exportState.triggerJsonExport(scenario.frames, scenario.currentFrameIndex)}
        onImportJson={handleImportJson}
        onRestoreAutosave={() => scenario.restoreAutosave()}
        onShareScenario={handleShareScenario}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
        onTogglePresenter={() => scenario.updateSettings({ presenterMode: !scenario.settings.presenterMode })}
        onUndo={scenario.undo}
      />

      <section className="workspace">
        {!scenario.settings.presenterMode && <Sidebar
          activeFrame={scenario.activeFrame}
          gridSnapEnabled={gridSnapEnabled}
          isExporting={exportState.isExporting}
          onAddRule={scenario.addRuleToActiveFrame}
          libraryItems={scenario.libraryItems}
          onSaveToLibrary={scenario.saveToLibrary}
          onLoadFromLibrary={scenario.loadFromLibrary}
          onDeleteFromLibrary={scenario.deleteFromLibrary}
          onExport={exportState.triggerExport}
          onExportImage={exportState.triggerImageExport}
          onExportJson={() => exportState.triggerJsonExport(scenario.frames, scenario.currentFrameIndex)}
          onImportJson={handleImportJson}
          onSetGridSnapEnabled={setGridSnapEnabled}
          onSetShowGrid={setShowGrid}
          onSetSettings={scenario.updateSettings}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          settings={scenario.settings}
          showGrid={showGrid}
          updateActiveFrame={scenario.updateActiveFrame}
        />}

        <CanvasWorkspace
          activeFrame={scenario.displayFrame}
          inspectorFrame={scenario.activeFrame}
          autoSailTrim={scenario.autoSailTrim}
          canvasPosition={viewport.canvasPosition}
          canvasZoom={viewport.canvasZoom}
          constrainPosition={viewport.constrainPosition}
          currentFrameIndex={scenario.currentFrameIndex}
          displayMode={scenario.settings.displayMode}
          frames={scenario.frames}
          getSnappedPosition={gridSnap.getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          handleCanvasDragEnd={viewport.handleCanvasDragEnd}
          handleCanvasWheel={viewport.handleCanvasWheel}
          maxZoom={viewport.maxZoom}
          minZoom={viewport.minZoom}
          onMoveBoat={scenario.moveBoat}
          onRotateBoat={(boatId, heading) => scenario.updateBoat(boatId, { heading })}
          onMoveMark={scenario.moveMark}
          onMoveArrow={scenario.moveArrow}
          onMoveComment={scenario.moveComment}
          onMoveImage={scenario.moveImage}
          onAddBoat={scenario.addBoat}
          onAddMark={scenario.addMark}
          onAddArrow={scenario.addArrow}
          onAddComment={scenario.addComment}
          onAddImage={scenario.addImage}
          onDeleteSelected={scenario.deleteSelected}
          onClearSelection={scenario.clearSelection}
          onSetAutoSailTrim={scenario.setAutoSailTrim}
          onOpenControls={() => setIsSidebarOpen(true)}
          onSelectObject={scenario.selectObject}
          onSnapPreview={gridSnap.setSnapPreview}
          onZoomIn={() => viewport.zoomCanvasFromCenter(CANVAS_ZOOM_STEP)}
          onZoomOut={() => viewport.zoomCanvasFromCenter(1 / CANVAS_ZOOM_STEP)}
          onResetZoom={viewport.resetCanvasZoom}
          selectedId={scenario.selectedId}
          selectedType={scenario.selectedType}
          selectedBoat={scenario.selectedBoat}
          selectedMark={scenario.selectedMark}
          selectedArrow={scenario.selectedArrow}
          selectedComment={scenario.selectedComment}
          selectedImage={scenario.selectedImage}
          updateBoat={scenario.updateBoat}
          updateMark={scenario.updateMark}
          updateArrow={scenario.updateArrow}
          updateComment={scenario.updateComment}
          updateImage={scenario.updateImage}
          canvasWrapRef={viewport.canvasWrapRef}
          showGrid={showGrid}
          snapTarget={gridSnap.snapTarget}
          stageRef={viewport.stageRef}
          stageSize={viewport.stageSize}
        >
          {!scenario.settings.presenterMode && <Timeline
            currentFrameIndex={scenario.currentFrameIndex}
            frames={scenario.frames}
            isPlaying={scenario.isPlaying}
            onAddFrame={scenario.addFrame}
            onDeleteFrame={() => scenario.deleteFrame(scenario.currentFrameIndex)}
            onDuplicateFrame={scenario.duplicateFrame}
            onRenameFrame={scenario.renameFrame}
            onSelectFrame={scenario.selectFrame}
            onTogglePlaying={() => scenario.setIsPlaying(!scenario.isPlaying)}
            playSpeed={scenario.playSpeed}
            onSetPlaySpeed={scenario.setPlaySpeed}
          />}
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
