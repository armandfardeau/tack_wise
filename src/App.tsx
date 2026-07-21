import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './App.css';
import AppHeader from './components/AppHeader';
import AboutPage from './components/AboutPage';
import CanvasWorkspace, { type InspectorRequest } from './components/CanvasWorkspace';
import ExportOverlay from './components/ExportOverlay';
import NewScenarioDialog from './components/NewScenarioDialog';
import Sidebar from './components/Sidebar';
import TemplateContributionDialog from './components/TemplateContributionDialog';
import { CANVAS_ZOOM_STEP } from './constants';
import { useCanvasViewport } from './hooks/useCanvasViewport';
import { useGridSnap } from './hooks/useGridSnap';
import { useScenario } from './hooks/useScenario';
import type { SelectedType } from './hooks/useScenario';
import { useScenarioExport } from './hooks/useScenarioExport';
import { scenarioPayloadFromTemplate, situationTemplates } from './data/situationTemplates';
import { createScenarioShareUrlAsync, parseScenarioFromJson, parseScenarioShareUrlAsync } from './utils/exporter';
import { getCanvasContentBounds, getCanvasContentRect } from './utils/simulation';
import { parseTemplateRepository, type TemplateContributionMode } from './utils/templateContribution';
import type { ExportOptions, ExportQuality, Theme } from './types';
import { DEFAULT_EXPORT_QUALITY } from './utils/exportSettings';

const THEME_STORAGE_KEY = 'tack-wise-theme';
const DEFAULT_GITHUB_SPONSORS_URL = 'https://github.com/sponsors/armandfardeau';
const sponsorshipLinks = {
  stripeUrl: import.meta.env.VITE_STRIPE_PAYMENT_LINK,
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  githubUrl: import.meta.env.VITE_GITHUB_SPONSORS_URL || DEFAULT_GITHUB_SPONSORS_URL,
  donationUrl: import.meta.env.VITE_DONATION_URL,
};
const templateRepository = parseTemplateRepository(import.meta.env.VITE_TEMPLATE_REPOSITORY, import.meta.env.VITE_TEMPLATE_BRANCH);

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
  const [exportTheme, setExportTheme] = useState<Theme | null>(null);
  const [isNewScenarioDialogOpen, setIsNewScenarioDialogOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [page, setPage] = useState<'editor' | 'about'>(() => (
    typeof window !== 'undefined' && window.location.pathname === '/about' ? 'about' : 'editor'
  ));
  const [exportQuality, setExportQuality] = useState<ExportQuality>(DEFAULT_EXPORT_QUALITY);
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [templateContributionMode, setTemplateContributionMode] = useState<TemplateContributionMode | null>(null);
  const gridSnap = useGridSnap(gridSnapEnabled);
  const { redo, undo } = scenario;
  const { importScenario } = scenario;
  const loadedShareRef = useRef(false);
  const inspectorRequestIdRef = useRef(0);

  const navigateTo = (nextPage: 'editor' | 'about') => {
    const targetPath = nextPage === 'about' ? '/about' : '/';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setPage(nextPage);
  };

  useEffect(() => {
    const handlePopState = () => setPage(window.location.pathname === '/about' ? 'about' : 'editor');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.title = page === 'about' ? 'About — Tack Wise' : 'Tack Wise';
  }, [page]);

  const handleLayerOpenInspector = (id: string, type: Exclude<SelectedType, null>) => {
    setIsSidebarOpen(false);
    scenario.selectObject(id, type);
    inspectorRequestIdRef.current += 1;
    setInspectorRequest({ id, type, requestId: inspectorRequestIdRef.current });
  };

  useEffect(() => {
    if (loadedShareRef.current) return;
    loadedShareRef.current = true;

    let isMounted = true;
    void parseScenarioShareUrlAsync().then((sharedScenario) => {
      if (!isMounted || !sharedScenario) return;
      importScenario(sharedScenario);
      setLoadedTemplateId(null);
    });

    return () => {
      isMounted = false;
    };
  }, [importScenario]);

  const loadedTemplate = situationTemplates.find((template) => template.id === loadedTemplateId);

  const handleLoadTemplate = (template: typeof situationTemplates[number]) => {
    scenario.importScenario(scenarioPayloadFromTemplate(template));
    setLoadedTemplateId(template.id);
  };

  const handleShareScenario = async () => {
    const shareUrl = await createScenarioShareUrlAsync({
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
    playbackProgress: scenario.playbackProgress,
    setCurrentFrameIndex: scenario.setCurrentFrameIndex,
    setPlaybackProgress: scenario.setPlaybackProgress,
    setIsPlaybackSampling: scenario.setIsPlaybackSampling,
    setIsPlaying: scenario.setIsPlaying,
    settings: scenario.settings,
    stageRef: viewport.stageRef,
    stageSize: viewport.stageSize,
    exportQuality,
  });

  const isCanvasExporting = exportState.isExporting || isImageExporting;

  if (page === 'about') {
    return (
      <AboutPage
        theme={theme}
        onBackToEditor={() => navigateTo('editor')}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  const resetToNewScenario = () => {
    scenario.createNewScenario();
    setLoadedTemplateId(null);
    setIsNewScenarioDialogOpen(false);
  };

  const handleNewScenario = () => {
    if (scenario.hasUnsavedChanges) {
      setIsNewScenarioDialogOpen(true);
      return;
    }

    resetToNewScenario();
  };

  const handleExportAndStartNewScenario = () => {
    exportState.triggerJsonExport(scenario.frames, scenario.currentFrameIndex);
    resetToNewScenario();
  };

  const handleExport = (options: ExportOptions) => {
    if (options.format === 'json') {
      exportState.triggerJsonExport(scenario.frames, scenario.currentFrameIndex);
      return;
    }

    if (options.format === 'png' || options.format === 'jpeg') {
      flushSync(() => {
        setExportTheme(options.theme);
        setIsImageExporting(true);
      });
      try {
        exportState.triggerImageExport(options.format);
      } finally {
        setIsImageExporting(false);
        setExportTheme(null);
      }
      return;
    }

    flushSync(() => setExportTheme(options.theme));
    void exportState.triggerExport(options.format, options.fps).finally(() => setExportTheme(null));
  };

  const handleImportJson = async (file: File) => {
    try {
      const payload = parseScenarioFromJson(await file.text());
      scenario.importScenario(payload);
      setLoadedTemplateId(null);
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
        scenarioTitle={scenario.settings.title ?? 'Untitled situation'}
        onScenarioTitleChange={(title) => scenario.updateSettings({ title })}
        onNewScenario={handleNewScenario}
        onExport={handleExport}
        onImportJson={handleImportJson}
        onShareScenario={handleShareScenario}
        onOpenAbout={() => navigateTo('about')}
        onLoadTemplate={handleLoadTemplate}
        onContributeTemplate={() => setTemplateContributionMode('create')}
        onUpdateTemplate={() => {
          if (loadedTemplate) setTemplateContributionMode('update');
        }}
        canUpdateTemplate={Boolean(loadedTemplate)}
        templates={situationTemplates}
        exportQuality={exportQuality}
        onExportQualityChange={setExportQuality}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        onTogglePresenter={() => scenario.updateSettings({ presenterMode: !scenario.settings.presenterMode })}
        theme={theme}
        sponsorship={sponsorshipLinks}
      />

      <section className="workspace">
        {!scenario.settings.presenterMode && <Sidebar
          currentFrameIndex={scenario.currentFrameIndex}
          frames={scenario.frames}
          unanimatableTransitionIndices={scenario.unanimatableTransitionIndices}
          onAddFrame={scenario.addFrame}
          onDeleteFrame={scenario.deleteFrame}
          onDuplicateFrame={scenario.duplicateFrame}
          onRenameFrame={scenario.renameFrame}
          onSelectFrame={scenario.selectFrame}
          onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenInspector={handleLayerOpenInspector}
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
          showFrameTitle={scenario.settings.showFrameTitle ?? true}
          showFrameNumber={scenario.settings.showFrameNumber ?? true}
          presenterMode={scenario.settings.presenterMode}
          theme={exportTheme ?? theme}
          frames={scenario.frames}
          canRedo={scenario.canRedo}
          canUndo={scenario.canUndo}
          hasAutosave={scenario.hasAutosave}
          getSnappedPosition={gridSnap.getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          isPlaying={scenario.isPlaying}
          playbackWarning={scenario.playbackWarning}
          isExporting={isCanvasExporting}
          handleCanvasDragEnd={viewport.handleCanvasDragEnd}
          handleCanvasWheel={viewport.handleCanvasWheel}
          maxZoom={viewport.maxZoom}
          minZoom={viewport.minZoom}
          onAddBoat={scenario.addBoat}
          onAddMark={scenario.addMark}
          onAddArrow={scenario.addArrow}
          onAddComment={scenario.addComment}
          onAddRuleComment={scenario.addRuleComment}
          onAddImage={scenario.addImage}
          onMoveBoat={scenario.moveBoat}
          onRotateBoat={(boatId, heading) => scenario.updateBoat(boatId, { heading })}
          onMoveMark={scenario.moveMark}
          onConnectMarks={scenario.connectMarks}
          onRemoveMarkConnection={scenario.removeMarkConnection}
          onReplaceMarkConnection={scenario.replaceMarkConnection}
          onMoveArrow={scenario.moveArrow}
          onMoveComment={scenario.moveComment}
          onMoveImage={scenario.moveImage}
          onDeleteSelected={scenario.deleteSelected}
          onDuplicateSelected={scenario.duplicateSelected}
          onClearSelection={scenario.clearSelection}
          onSetAutoSailTrim={scenario.setAutoSailTrim}
          onSetDisplayMode={(displayMode) => scenario.updateSettings({ displayMode })}
          onSetShowFrameTitle={(showFrameTitle) => scenario.updateSettings({ showFrameTitle })}
          onSetShowFrameNumber={(showFrameNumber) => scenario.updateSettings({ showFrameNumber })}
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
          onCloseControls={() => setIsSidebarOpen(false)}
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
          selectedConnection={scenario.selectedConnection}
          selectedArrow={scenario.selectedArrow}
          selectedComment={scenario.selectedComment}
          selectedImage={scenario.selectedImage}
          updateBoat={scenario.updateBoat}
          updateActiveFrame={scenario.updateActiveFrame}
          updateMark={scenario.updateMark}
          updateConnection={scenario.updateConnection}
          updateArrow={scenario.updateArrow}
          updateComment={scenario.updateComment}
          updateRuleComment={scenario.updateRuleComment}
          updateImage={scenario.updateImage}
          canvasWrapRef={viewport.canvasWrapRef}
          handleCanvasTouchEnd={viewport.handleCanvasTouchEnd}
          handleCanvasTouchMove={viewport.handleCanvasTouchMove}
          handleCanvasTouchStart={viewport.handleCanvasTouchStart}
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

      {isNewScenarioDialogOpen && (
        <NewScenarioDialog
          onCancel={() => setIsNewScenarioDialogOpen(false)}
          onExportAndContinue={handleExportAndStartNewScenario}
          onDiscard={resetToNewScenario}
        />
      )}

      {templateContributionMode && (
        <TemplateContributionDialog
          key={`${templateContributionMode}-${loadedTemplateId ?? 'new'}`}
          mode={templateContributionMode}
          frames={scenario.frames}
          initialTitle={scenario.settings.title ?? loadedTemplate?.title ?? 'Untitled situation'}
          existingTemplateIds={situationTemplates.map((template) => template.id)}
          templateId={loadedTemplate?.id}
          repository={templateRepository}
          onClose={() => setTemplateContributionMode(null)}
        />
      )}
    </main>
  );
}
