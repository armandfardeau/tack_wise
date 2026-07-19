import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './App.css';
import AppHeader from './components/AppHeader';
import CanvasWorkspace, { type InspectorRequest } from './components/CanvasWorkspace';
import ExportOverlay from './components/ExportOverlay';
import Sidebar from './components/Sidebar';
import { CANVAS_ZOOM_STEP } from './constants';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useGridSnap } from './hooks/useGridSnap';
import { useScenario } from './hooks/useScenario';
import type { SelectedType } from './hooks/useScenario';
import { useScenarioExport } from './hooks/useScenarioExport';
import { scenarioPayloadFromTemplate, situationTemplates } from './data/situationTemplates';
import { createScenarioShareUrl, parseScenarioFromJson, parseScenarioShareUrl } from './utils/exporter';
import { getCanvasContentBounds, getCanvasContentRect } from './utils/simulation';
import type { Theme } from './types';

const THEME_STORAGE_KEY = 'tack-wise-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    // Fall back to the system preference when storage is unavailable.
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function App() {
  const scenario = useScenario();
  const canvasContentBounds = useMemo(() => getCanvasContentBounds(scenario.frames), [scenario.frames]);
  const visibleCanvasContentRect = useMemo(() => {
    const visibleFrames = scenario.settings.displayMode === 'cumulative'
      ? scenario.frames.slice(0, scenario.currentFrameIndex + 1)
      : scenario.frames.slice(Math.max(0, scenario.currentFrameIndex - 1), scenario.currentFrameIndex + 1);

    return getCanvasContentRect(visibleFrames);
  }, [scenario.currentFrameIndex, scenario.frames, scenario.settings.displayMode]);
  const viewport = useCanvasViewport(canvasContentBounds);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inspectorRequest, setInspectorRequest] = useState<InspectorRequest | null>(null);
  const [isImageExporting, setIsImageExporting] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const gridSnap = useGridSnap(gridSnapEnabled);
  const { redo, undo } = scenario;
  const { importScenario } = scenario;
  const loadedShareRef = useRef(false);
  const inspectorRequestIdRef = useRef(0);

  const handleLayerSelect = (id: string, type: Exclude<SelectedType, null>) => {
    scenario.selectObject(id, type);
    inspectorRequestIdRef.current += 1;
    setInspectorRequest({ id, type, requestId: inspectorRequestIdRef.current });
  };

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
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
  }, [theme]);

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

  const isCanvasExporting = exportState.isExporting || isImageExporting;

  const handleImageExport = (type: 'png' | 'jpeg') => {
    flushSync(() => setIsImageExporting(true));
    try {
      exportState.triggerImageExport(type);
    } finally {
      setIsImageExporting(false);
    }
  };

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
    <main className={`app-shell ${theme}-theme${scenario.settings.presenterMode ? ' presenter-mode' : ''}`}>
      <AppHeader
        isExporting={isCanvasExporting}
        presenterMode={scenario.settings.presenterMode}
        onExport={exportState.triggerExport}
        onExportImage={handleImageExport}
        onExportJson={() => exportState.triggerJsonExport(scenario.frames, scenario.currentFrameIndex)}
        onImportJson={handleImportJson}
        onShareScenario={handleShareScenario}
        onLoadTemplate={(template) => scenario.importScenario(scenarioPayloadFromTemplate(template))}
        templates={situationTemplates}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        onTogglePresenter={() => scenario.updateSettings({ presenterMode: !scenario.settings.presenterMode })}
        theme={theme}
      />

      <section className="workspace">
        {!scenario.settings.presenterMode && <Sidebar
          currentFrameIndex={scenario.currentFrameIndex}
          frames={scenario.frames}
          onAddFrame={scenario.addFrame}
          onDeleteFrame={scenario.deleteFrame}
          onDuplicateFrame={scenario.duplicateFrame}
          onRenameFrame={scenario.renameFrame}
          onSelectFrame={scenario.selectFrame}
          onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectObject={handleLayerSelect}
          selectedId={scenario.selectedId}
          selectedType={scenario.selectedType}
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
          presenterMode={scenario.settings.presenterMode}
          theme={theme}
          frames={scenario.frames}
          canRedo={scenario.canRedo}
          canUndo={scenario.canUndo}
          hasAutosave={scenario.hasAutosave}
          getSnappedPosition={gridSnap.getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          isPlaying={scenario.isPlaying}
          isExporting={isCanvasExporting}
          handleCanvasDragEnd={viewport.handleCanvasDragEnd}
          handleCanvasWheel={viewport.handleCanvasWheel}
          maxZoom={viewport.maxZoom}
          minZoom={viewport.minZoom}
          onAddBoat={scenario.addBoat}
          onAddMark={scenario.addMark}
          onAddArrow={scenario.addArrow}
          onAddComment={scenario.addComment}
          onAddImage={scenario.addImage}
          onMoveBoat={scenario.moveBoat}
          onRotateBoat={(boatId, heading) => scenario.updateBoat(boatId, { heading })}
          onMoveMark={scenario.moveMark}
          onMoveArrow={scenario.moveArrow}
          onMoveComment={scenario.moveComment}
          onMoveImage={scenario.moveImage}
          onDeleteSelected={scenario.deleteSelected}
          onClearSelection={scenario.clearSelection}
          onSetAutoSailTrim={scenario.setAutoSailTrim}
          onSetGridSnapEnabled={setGridSnapEnabled}
          onSetShowGrid={setShowGrid}
          onRedo={scenario.redo}
          onRestoreAutosave={() => scenario.restoreAutosave()}
          onTogglePlaying={() => scenario.setIsPlaying((isPlaying) => !isPlaying)}
          onStepBackward={scenario.stepBackward}
          onStepForward={scenario.stepForward}
          onReplayFromStart={scenario.replayFromStart}
          onSetPlaySpeed={scenario.setPlaySpeed}
          playSpeed={scenario.playSpeed}
          onUndo={scenario.undo}
          onPanCanvasBy={viewport.panCanvasBy}
          onOpenControls={() => setIsSidebarOpen(true)}
          onSelectObject={scenario.selectObject}
          inspectorRequest={inspectorRequest}
          onSnapPreview={gridSnap.setSnapPreview}
          onZoomIn={() => viewport.zoomCanvasFromCenter(CANVAS_ZOOM_STEP)}
          onZoomOut={() => viewport.zoomCanvasFromCenter(1 / CANVAS_ZOOM_STEP)}
          onAutoZoom={() => viewport.fitCanvasToContent(visibleCanvasContentRect)}
          onResetZoom={viewport.resetCanvasZoom}
          selectedId={scenario.selectedId}
          selectedType={scenario.selectedType}
          selectedBoat={scenario.selectedBoat}
          selectedMark={scenario.selectedMark}
          selectedArrow={scenario.selectedArrow}
          selectedComment={scenario.selectedComment}
          selectedImage={scenario.selectedImage}
          updateBoat={scenario.updateBoat}
          updateActiveFrame={scenario.updateActiveFrame}
          updateMark={scenario.updateMark}
          updateArrow={scenario.updateArrow}
          updateComment={scenario.updateComment}
          updateImage={scenario.updateImage}
          canvasWrapRef={viewport.canvasWrapRef}
          showGrid={showGrid}
          snapTarget={gridSnap.snapTarget}
          stageRef={viewport.stageRef}
          stageSize={viewport.stageSize}
        />

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
